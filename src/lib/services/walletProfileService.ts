import { supabase } from "@/lib/supabase";

// Implement saveWalletProfile function - modify to use AnonBoss as default
export const saveWalletProfile = async (
  walletAddress: string,
  username?: string,
  points?: number,
  avatarUrl?: string | null,
  walletType?: string
) => {
  try {
    console.log(`Saving wallet profile:
      - walletAddress: ${walletAddress}
      - username: ${username || 'not provided'}
      - points: ${points !== undefined ? points : 'not provided'}
      - avatarUrl: ${avatarUrl !== undefined ? (avatarUrl || 'null') : 'not provided'}
      - walletType: ${walletType || 'phantom'}`);
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('wallet_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('wallet_type', walletType || 'phantom') // Always filter by wallet_type too
      .maybeSingle();
      
    const updates: any = {};
    
    if (username) updates.username = username;
    if (points !== undefined) updates.points = points;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (walletType) updates.wallet_type = walletType;
    
    console.log("Updates to be applied:", updates);
    
    // If profile exists, update it
    if (existingProfile) {
      console.log("Existing profile found, updating...");
      const { error } = await supabase
        .from('wallet_profiles')
        .update(updates)
        .eq('wallet_address', walletAddress)
        .eq('wallet_type', walletType || 'phantom'); // CRITICAL: Filter by both fields
        
      if (error) {
        console.error('Error updating wallet profile:', error);
        return false;
      }
      
      console.log("Wallet profile updated successfully");
      return true;
    }
    
    // If profile doesn't exist, create it
    console.log("No existing profile found, creating new one...");
    // Use AnonBoss as default instead of Wallet_address format
    const defaultUsername = username || `AnonBoss_${walletAddress.substring(0, 6)}`;
    const defaultPoints = points !== undefined ? points : 0;
    
    const { error } = await supabase
      .from('wallet_profiles')
      .insert({
        wallet_address: walletAddress,
        username: defaultUsername,
        points: defaultPoints,
        avatar_url: avatarUrl || null,
        wallet_type: walletType || 'phantom'
      });
      
    if (error) {
      console.error('Error creating wallet profile:', error);
      return false;
    }
    
    console.log("New wallet profile created successfully");
    return true;
  } catch (err) {
    console.error('Unexpected error in saveWalletProfile:', err);
    return false;
  }
};

// Implement fetchWalletProfile function for retrieving profiles
export const fetchWalletProfile = async (walletAddress: string, walletType: string = 'phantom') => {
  try {
    const { data, error } = await supabase
      .from('wallet_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('wallet_type', walletType)
      .maybeSingle();

    if (error) {
      console.error('Error fetching wallet profile:', error);
      return null;
    }

    if (!data) {
      // If no profile exists, try to create one
      const success = await saveWalletProfile(
        walletAddress, 
        `AnonBoss_${walletAddress.substring(0, 6)}`,
        0,
        null,
        walletType
      );
      
      if (success) {
        // Try fetching again after creation
        const { data: newData } = await supabase
          .from('wallet_profiles')
          .select('*')
          .eq('wallet_address', walletAddress)
          .eq('wallet_type', walletType)
          .maybeSingle();
          
        return newData;
      }
      
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error in fetchWalletProfile:', err);
    return null;
  }
};

export const getWalletProfile = fetchWalletProfile;

// Add missing functions mentioned in the errors

// Function to get answered questions count for either wallet or user
export const getAnsweredQuestionsCount = async (walletAddress?: string, userId?: string): Promise<number> => {
  try {
    console.log(`Getting answered questions count for: wallet=${walletAddress || 'none'}, userId=${userId || 'none'}`);
    
    // Check for wallet user first
    if (walletAddress) {
      const { count, error } = await supabase
        .from('wallet_answered_questions')
        .select('*', { count: 'exact', head: true})
        .eq('wallet_address', walletAddress);
        
      if (!error && count !== null) {
        console.log(`Found ${count} answered questions for wallet ${walletAddress}`);
        return count;
      }
    }
    
    // Check for authenticated user
    if (userId) {
      const { count, error } = await supabase
        .from('user_answered_questions')
        .select('*', { count: 'exact', head: true})
        .eq('user_id', userId);
        
      if (!error && count !== null) {
        console.log(`Found ${count} answered questions for user ${userId}`);
        return count;
      }
    }
    
    return 0;
  } catch (err) {
    console.error('Error getting answered questions count:', err);
    return 0;
  }
};

// Function to mark a question as answered by a wallet
export const markWalletQuestionAnswered = async (questionId: number, walletAddress?: string): Promise<boolean> => {
  if (!walletAddress) {
    console.log('No wallet address provided to markWalletQuestionAnswered');
    return false;
  }

  try {
    console.log(`Marking question ${questionId} as answered by wallet ${walletAddress}`);
    
    // Check if this question is already answered by this wallet
    const { data: existing, error: checkError } = await supabase
      .from('wallet_answered_questions')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('question_id', questionId)
      .maybeSingle();
      
    if (existing) {
      console.log(`Question ${questionId} was already answered by wallet ${walletAddress}`);
      return true;
    }
    
    // Mark the question as answered
    const { error } = await supabase
      .from('wallet_answered_questions')
      .insert({
        wallet_address: walletAddress,
        question_id: questionId
      });
      
    if (error) {
      console.error('Error marking question as answered by wallet:', error);
      return false;
    }
    
    // Trigger an event to notify components that question count updated
    const totalAnswered = await getAnsweredQuestionsCount(walletAddress);
    window.dispatchEvent(new CustomEvent('questionCountUpdated', {
      detail: {
        walletAddress,
        questionId,
        totalAnswered,
      }
    }));
    
    return true;
  } catch (err) {
    console.error('Unexpected error in markWalletQuestionAnswered:', err);
    return false;
  }
};

// Function to record a quiz attempt for a wallet
export const recordWalletQuizAttempt = async (
  walletAddress: string,
  score: number,
  questionsAnswered: number,
  correctAnswers: number,
  perfectRounds: number = 0
): Promise<number | null> => {
  try {
    console.log(`Recording quiz attempt for wallet ${walletAddress}:`, {
      score,
      questionsAnswered,
      correctAnswers,
      perfectRounds
    });
    
    const { data, error } = await supabase
      .from('wallet_quiz_attempts')
      .insert({
        wallet_address: walletAddress,
        score,
        questions_answered: questionsAnswered,
        correct_answers: correctAnswers,
        perfect_rounds: perfectRounds
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('Error recording wallet quiz attempt:', error);
      return null;
    }
    
    console.log(`Wallet quiz attempt recorded with ID: ${data.id}`);
    return data.id;
  } catch (err) {
    console.error('Unexpected error in recordWalletQuizAttempt:', err);
    return null;
  }
};

// Get combined leaderboard from both authenticated users and wallet users
export const getCombinedLeaderboard = async (limit: number = 10): Promise<any[]> => {
  try {
    console.log(`Fetching combined leaderboard with limit: ${limit}`);
    
    // First try to use the get_combined_leaderboard RPC function if it exists
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_combined_leaderboard',
        { p_limit: limit }
      );
      
      if (!rpcError && rpcData) {
        console.log(`Got ${rpcData.length} leaderboard entries from RPC function`);
        return rpcData;
      }
    } catch (rpcErr) {
      console.warn('RPC function failed or does not exist, using fallback:', rpcErr);
    }
    
    // Fallback to manual fetching if RPC doesn't work
    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, points')
      .order('points', { ascending: false })
      .gt('points', 0)
      .limit(limit);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }
    
    // Get wallet profiles
    const { data: walletProfiles, error: walletError } = await supabase
      .from('wallet_profiles')
      .select('id, username, avatar_url, points, wallet_address, wallet_type')
      .order('points', { ascending: false })
      .gt('points', 0)
      .limit(limit);
    
    if (walletError) {
      console.error('Error fetching wallet profiles:', walletError);
    }
    
    // Combine and sort the results
    const combined = [
      ...(profiles || []).map(p => ({
        ...p,
        is_wallet: false,
        social_links: {} as any
      })),
      ...(walletProfiles || []).map(p => ({
        ...p,
        is_wallet: true,
        social_links: {} as any
      }))
    ];
    
    // Sort by points descending
    combined.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // Take the top entries
    const topEntries = combined.slice(0, limit);
    
    console.log(`Manually fetched ${topEntries.length} combined leaderboard entries`);
    return topEntries;
  } catch (err) {
    console.error('Error getting combined leaderboard:', err);
    return [];
  }
};
