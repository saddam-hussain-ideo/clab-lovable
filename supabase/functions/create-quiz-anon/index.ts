
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First check if the user already exists
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail('quiz@anonymous.com')
    
    // If user exists, just return success
    if (!getUserError && existingUser) {
      console.log('Quiz anonymous user already exists:', existingUser.id)
      
      // Ensure the user has email confirmed
      if (!existingUser.email_confirmed_at) {
        console.log('Confirming email for existing quiz anonymous user')
        await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          message: 'Anonymous user already exists', 
          userId: existingUser.id,
          status: 'exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating new quiz anonymous user...')

    // Create a new anonymous user with email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'quiz@anonymous.com',
      password: 'quizanon123',
      email_confirm: true
    })

    if (error) {
      console.error('Error creating quiz anonymous user:', error)
      throw error
    }

    console.log('Created quiz anonymous user successfully:', data)
    return new Response(
      JSON.stringify({ 
        message: 'Quiz anonymous user created successfully', 
        userId: data.user.id,
        status: 'created'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in create-quiz-anon function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
