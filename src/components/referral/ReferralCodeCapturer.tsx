
import { useEffect } from 'react';

export const ReferralCodeCapturer = () => {
  useEffect(() => {
    // Check for referral code in URL
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (referralCode) {
        console.log('Referral code detected in URL:', referralCode);
        // Store in localStorage for later retrieval after authentication
        localStorage.setItem('pendingReferralCode', referralCode);
        console.log('Stored referral code in localStorage:', referralCode);
      }
    } catch (error) {
      console.error('Error in ReferralCodeCapturer:', error);
    }
  }, []); // Empty dependency array ensures it only runs once
  
  return null; // This component doesn't render anything
};
