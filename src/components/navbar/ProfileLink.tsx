import { Link } from "react-router-dom";
import { UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

// Default avatar image path
const DEFAULT_AVATAR = "/lovable-uploads/988144ca-38fb-4273-a0cf-e82e64218efc.png";

interface ProfileLinkProps {
  session: Session | null;
  userProfile: any;
  onItemClick?: () => void;
  mobile?: boolean;
  walletConnected?: boolean;
  walletAddress?: string | null;
}

export const ProfileLink = ({ 
  session, 
  userProfile, 
  onItemClick, 
  mobile = false,
  walletConnected = false,
  walletAddress = null
}: ProfileLinkProps) => {
  const [profileData, setProfileData] = useState<any>(userProfile);
  
  // Update local state when props change
  useEffect(() => {
    if (userProfile) {
      console.log("[ProfileLink] Received updated profile:", userProfile);
      setProfileData(userProfile);
    }
  }, [userProfile]);
  
  // Listen for profile loaded events directly
  useEffect(() => {
    const handleProfileLoaded = (event: CustomEvent<{profile: any, timestamp: number}>) => {
      const { profile } = event.detail;
      console.log("[ProfileLink] Received profileLoaded event with profile:", profile);
      
      if (profile && profile.wallet_address && profile.wallet_type) {
        // Ensure the profile is for the currently connected wallet
        const currentWalletAddress = localStorage.getItem('walletAddress');
        const currentWalletType = localStorage.getItem('walletType');
        
        if (profile.wallet_address === currentWalletAddress && profile.wallet_type === currentWalletType) {
          console.log("[ProfileLink] Setting profile data from event");
          setProfileData(profile);
        }
      }
    };
    
    window.addEventListener('profileLoaded', handleProfileLoaded as EventListener);
    
    return () => {
      window.removeEventListener('profileLoaded', handleProfileLoaded as EventListener);
    };
  }, []);
  
  console.log("[ProfileLink] Rendering with:", { 
    hasSession: !!session, 
    hasProfile: !!profileData,
    profileUsername: profileData?.username,
    walletConnected,
    walletAddress: walletAddress ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}` : null
  });

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (session?.user?.email) {
      return session.user.email.substring(0, 2).toUpperCase();
    }
    if (walletConnected && walletAddress) {
      return walletAddress.substring(0, 2).toUpperCase();
    }
    return "CL";
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    if (profileData?.avatar_url) {
      return profileData.avatar_url;
    }
    return DEFAULT_AVATAR;
  };

  // Get display name
  const getDisplayName = () => {
    if (profileData?.username) {
      return profileData.username;
    }
    if (walletConnected && walletAddress) {
      return `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`;
    }
    return "Profile";
  };

  const isAuthenticated = !!session || (walletConnected && walletAddress);

  if (mobile) {
    return (
      <Link
        to="/profile"
        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded flex items-center gap-2"
        onClick={onItemClick}
        title="Profile"
      >
        {isAuthenticated ? (
          <>
            <Avatar className="h-5 w-5 mr-2">
              <AvatarImage src={getAvatarUrl()} />
              <AvatarFallback className="text-xs bg-zinc-800">
                <img src={DEFAULT_AVATAR} alt="CLAB" className="h-full w-full object-cover" />
              </AvatarFallback>
            </Avatar>
            {getDisplayName()}
          </>
        ) : (
          <>
            <UserCircle className="h-5 w-5" />
            PROFILE
          </>
        )}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {profileData?.username && (
        <span className="text-sm font-medium text-gray-300 hidden sm:inline-block mr-1">
          {profileData.username}
        </span>
      )}
      <Link 
        to="/profile" 
        className="nav-link text-gray-300 hover:text-white flex items-center"
        title={getDisplayName()}
      >
        {isAuthenticated ? (
          <Avatar className="h-6 w-6">
            <AvatarImage src={getAvatarUrl()} />
            <AvatarFallback className="text-xs bg-zinc-800">
              <img src={DEFAULT_AVATAR} alt="CLAB" className="h-full w-full object-cover" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserCircle className="h-5 w-5" />
        )}
      </Link>
    </div>
  );
};
