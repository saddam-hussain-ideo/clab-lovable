// Helper functions for AI chat component

export const getFallbackResponses = () => ({
  greeting: "I'm currently operating in offline mode due to connectivity issues. I can answer basic questions about CLAB, but for detailed or specific inquiries, please try again later when the connection is restored.",
  tokenomics: "CLAB has a total supply of 1 billion tokens. The presale allocates 40% to early investors, with the remainder distributed between the team (20%), marketing (15%), liquidity pool (15%), and ecosystem development (10%).",
  presale: "The CLAB presale is structured in 4 stages with increasing token prices. Currently in Stage 2, tokens are priced at 0.00015 SOL. The presale ends on June 30, 2025.",
  howToBuy: "To buy CLAB tokens, connect your Solana wallet on the website, enter the amount you wish to purchase, and complete the transaction with SOL. The minimum purchase is 10 SOL, and the maximum is 5,000 SOL.",
  quizPoints: "If your quiz points appear to be reset to 0, this is likely a temporary display issue. Your points are stored securely in our database. Try refreshing the page, clearing your browser cache, or logging out and back in. If the issue persists, your points should be restored automatically within 24 hours as our systems sync.",
  default: "I apologize, but I'm operating in offline mode due to connectivity issues. Please try again later when the connection is restored, or visit our website for more information."
});

export const getFallbackResponse = (userMessage: string): string => {
  const fallbackResponses = getFallbackResponses();
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('tokenomics') || lowerMessage.includes('token distribution')) {
    return fallbackResponses.tokenomics;
  }
  
  if (lowerMessage.includes('presale') || lowerMessage.includes('ico') || lowerMessage.includes('sale')) {
    return fallbackResponses.presale;
  }
  
  if (lowerMessage.includes('how to buy') || lowerMessage.includes('purchase')) {
    return fallbackResponses.howToBuy;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('hey')) {
    return fallbackResponses.greeting;
  }
  
  if (lowerMessage.includes('points') || lowerMessage.includes('quiz points') || lowerMessage.includes('reset') || 
      lowerMessage.includes('zero') || lowerMessage.includes('0')) {
    return fallbackResponses.quizPoints;
  }
  
  return fallbackResponses.default;
};

export const testAIChatConnection = async (supabase: any, silent = false): Promise<{success: boolean; latency?: number; error?: string}> => {
  try {
    if (!silent) {
      console.log('Testing AI support chat connection');
    }
    
    const startTime = performance.now();

    try {
      // Use the Supabase functions.invoke method which handles authentication properly
      const { data, error } = await supabase.functions.invoke('ai-support-chat', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      if (error) {
        if (!silent) {
          console.error('Connection test failed with error:', error);
        }
        
        return { 
          success: false, 
          latency,
          error: `Error: ${error.message || error}` 
        };
      }
      
      if (!data || !data.knowledgeBase) {
        if (!silent) {
          console.error('Connection test failed - invalid response format:', data);
        }
        return { 
          success: false,
          latency,
          error: 'Invalid response from AI service' 
        };
      }
      
      if (!silent) {
        console.log('Connection test successful', { latency });
      }
      
      return { 
        success: true,
        latency
      };
    } catch (fetchError) {
      if (!silent) {
        console.error('Connection test fetch error:', fetchError);
      }
      
      return { 
        success: false,
        error: `Fetch error: ${fetchError.message}` 
      };
    }
  } catch (error) {
    if (!silent) {
      console.error('Connection test exception:', error);
    }
    return { 
      success: false,
      error: error.message
    };
  }
};

// Properly serialize and send message data
export const sendChatMessage = async (supabase: any, messages: string[]): Promise<{data?: any; error?: any}> => {
  try {
    console.log('Sending chat message with payload:', { messages });
    
    // Simple validation
    if (!Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages format:', messages);
      return { error: 'Invalid messages format' };
    }
    
    // Create a simple object structure
    const payload = { messages };
    
    // Debug logging
    console.log('Sending payload:', JSON.stringify(payload));
    
    // Use explicit content-type and simpler invocation
    const response = await supabase.functions.invoke('ai-support-chat', {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response from AI chat:', response);
    return response;
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    return { error };
  }
};
