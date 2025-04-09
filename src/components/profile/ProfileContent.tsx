
import { Profile } from "@/types/profile";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { PresalePurchases } from "@/components/profile/PresalePurchases";
import { QuizActivity } from "@/components/profile/QuizActivity";
import { FavoriteArticles } from "@/components/profile/FavoriteArticles";
import { DefiCardTab } from "@/components/profile/DefiCardTab";

interface ProfileContentProps {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  activeTab: string;
}

export const ProfileContent = ({ profile, setProfile, activeTab }: ProfileContentProps) => {
  console.log("[ProfileContent] Rendering with activeTab:", activeTab, "profile:", profile);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-md p-6">
      {activeTab === "info" && (
        <PersonalInfoForm profile={profile} setProfile={setProfile} />
      )}
      
      {activeTab === "purchases" && (
        <PresalePurchases profile={profile} />
      )}
      
      {activeTab === "quiz" && (
        <QuizActivity profile={profile} />
      )}
      
      {activeTab === "favorites" && (
        <FavoriteArticles />
      )}
      
      {activeTab === "deficard" && (
        <DefiCardTab profile={profile} />
      )}
    </div>
  );
};
