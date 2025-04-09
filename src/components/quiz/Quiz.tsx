import { useState, useEffect } from 'react';
import { useSession } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { CategorySelector } from './CategorySelector';
import { QuizModal } from './QuizModal';
import { QuizCategory } from '@/lib/types/quiz';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { QuizIntro } from './QuizIntro';
import { QuizComingSoonModal } from './QuizComingSoonModal';

// Admin wallet address that can bypass the coming soon modal
const ADMIN_WALLET_ADDRESS = "AST2fqXjuvgcRoaVXKJ7BAWqjT4ZdVBwyu2cHMfmv6cd";

export function Quiz({ inModal = false }) {
  const session = useSession();
  const { walletAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  useEffect(() => {
    const initializeWalletState = async () => {
      try {
        setLoading(true);
        
        // Only attempt to ensure wallet profile if we're actually connected
        if (isConnected && walletAddress) {
          console.log("Ensuring wallet profile for:", walletAddress);
          
          // First check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('wallet_profiles')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

          if (profileError) {
            console.error("Error checking wallet profile:", profileError);
            // Don't throw error here - we just want to know if profile exists
          }

          // Only create/update profile if it doesn't exist
          if (!profile) {
            try {
              // Create profile with upsert to avoid race conditions
              const { error } = await supabase
                .from('wallet_profiles')
                .upsert({ 
                  wallet_address: walletAddress,
                  username: `Wallet_${walletAddress.substring(0, 6)}`
                }, { onConflict: 'wallet_address' });
                
              if (error) {
                console.error("Error creating wallet profile:", error);
                // Don't throw error here - profile creation is best effort
              }
            } catch (error) {
              console.error("Database error creating wallet profile:", error);
              // Don't throw error here - profile creation is best effort
            }
          }
        }
      } catch (error) {
        console.error("Error initializing wallet state:", error);
        // Don't throw error here - we want to continue with existing wallet state
      } finally {
        setLoading(false);
      }
    };
    
    initializeWalletState();
    
    // Listen for category selector events
    const handleOpenCategorySelector = () => {
      setSelectedCategory(null);
      setShowQuizModal(false);
    };
    
    window.addEventListener('openQuizCategorySelector', handleOpenCategorySelector);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('openQuizCategorySelector', handleOpenCategorySelector);
    };
  }, [walletAddress, isConnected]);

  useEffect(() => {
    if (!isConnected && walletAddress) {
      console.log("Wallet disconnected during quiz navigation");
      // Clear any local state that depends on wallet connection
      setSelectedCategory(null);
      setShowQuizModal(false);
    }
  }, [isConnected]);

  const handleCategorySelect = (category: QuizCategory) => {
    console.log("Selected category:", category);
    setSelectedCategory(category);
    setShowQuizModal(true);
    
    toast({
      title: "Category Selected",
      description: `Starting quiz in ${category.replace('_', ' ')} category...`,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/30 mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Display the Coming Soon modal */}
      <QuizComingSoonModal adminWalletAddress={ADMIN_WALLET_ADDRESS} />
      
      {!inModal && (
        <div className="max-w-5xl mx-auto">
          <QuizIntro onStart={handleCategorySelect} />
        </div>
      )}
      
      {selectedCategory && (
        <QuizModal
          open={showQuizModal}
          onOpenChange={setShowQuizModal}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
}
