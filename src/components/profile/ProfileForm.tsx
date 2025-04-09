
import { useState } from "react";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { Profile } from "@/types/profile";
import { ReferralSection } from "@/components/profile/ReferralSection";
import { useReferrals } from "@/hooks/useReferrals";

interface ProfileFormProps {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  showPersonalSection?: boolean;
  showReferralSection?: boolean;
}

export const ProfileForm = ({ 
  profile, 
  setProfile, 
  showPersonalSection = true, 
  showReferralSection = true 
}: ProfileFormProps) => {
  const { referrals, refetch, isLoading } = useReferrals(profile);

  return (
    <div className="space-y-8">
      {showPersonalSection && (
        <PersonalInfoForm 
          profile={profile} 
          setProfile={setProfile} 
        />
      )}

      {showReferralSection && profile?.referral_code && (
        <ReferralSection 
          referralCode={profile.referral_code} 
          referrals={referrals} 
          points={profile.points} 
          onRefresh={refetch}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
