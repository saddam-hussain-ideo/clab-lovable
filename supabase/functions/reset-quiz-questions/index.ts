
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

// Create a Supabase client with the admin key
function getSupabaseClient(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  })
}

// Reset quiz answered questions by category 
async function resetQuizAnsweredQuestions(
  supabase: any, 
  category: string | null, 
  userId: string | null, 
  walletAddress: string | null
) {
  console.log(`[reset-quiz-questions] Resetting quiz answered questions for ${userId ? 'user:' + userId : 'wallet:' + walletAddress}${category ? ', category: ' + category : ''}`);

  if (!userId && !walletAddress) {
    throw new Error('Either userId or walletAddress must be provided')
  }

  try {
    let deleteResults = {
      user: null,
      wallet: null
    };

    if (userId) {
      // Delete records from user_answered_questions
      const query = supabase
        .from('user_answered_questions')
        .delete();
      
      if (category) {
        // If category is specified, first get all question ids for that category
        const { data: questions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('category', category);
          
        if (questionsError) {
          console.error('[reset-quiz-questions] Error fetching questions for category:', questionsError);
          throw questionsError;
        }
        
        if (questions && questions.length > 0) {
          const questionIds = questions.map((q: any) => q.id);
          deleteResults.user = await query.eq('user_id', userId).in('question_id', questionIds);
        } else {
          console.log('[reset-quiz-questions] No questions found for category:', category);
          return { success: true, message: 'No questions found for specified category' };
        }
      } else {
        // If no category, delete all answered questions for this user
        deleteResults.user = await query.eq('user_id', userId);
      }
      
      console.log('[reset-quiz-questions] User delete result:', deleteResults.user);
    } 
    
    if (walletAddress) {
      // Delete records from wallet_answered_questions
      const query = supabase
        .from('wallet_answered_questions')
        .delete();
      
      if (category) {
        // If category is specified, get all question ids for that category
        const { data: questions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('category', category);
          
        if (questionsError) {
          console.error('[reset-quiz-questions] Error fetching questions for category:', questionsError);
          throw questionsError;
        }
        
        if (questions && questions.length > 0) {
          const questionIds = questions.map((q: any) => q.id);
          deleteResults.wallet = await query.eq('wallet_address', walletAddress).in('question_id', questionIds);
        } else {
          console.log('[reset-quiz-questions] No questions found for category:', category);
          return { success: true, message: 'No questions found for specified category' };
        }
      } else {
        // If no category, delete all answered questions for this wallet
        deleteResults.wallet = await query.eq('wallet_address', walletAddress);
      }
      
      console.log('[reset-quiz-questions] Wallet delete result:', deleteResults.wallet);
    }
    
    return { 
      success: true, 
      message: 'Answered questions reset successfully',
      details: {
        userId: userId,
        walletAddress: walletAddress,
        category: category,
        deleteResults,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[reset-quiz-questions] Error in resetQuizAnsweredQuestions:', error);
    throw error;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  
  try {
    // Get authenticated Supabase client
    const supabase = getSupabaseClient(req)
    
    // Parse request body
    const requestBody = await req.json();
    const { category = null, userId = null, walletAddress = null } = requestBody;
    
    console.log('[reset-quiz-questions] Request received:', {
      userId,
      walletAddress,
      category
    });
    
    // Reset answered questions
    const result = await resetQuizAnsweredQuestions(
      supabase, 
      category,
      userId,
      walletAddress
    )
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[reset-quiz-questions] Error processing request:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal Server Error',
        status: 'error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
