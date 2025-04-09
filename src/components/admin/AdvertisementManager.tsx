
import { CurrentAds } from "./advertisement/CurrentAds";
import { AdFormSection } from "./advertisement/AdFormSection";

export const AdvertisementManager = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Manage Advertisements</h2>
      <CurrentAds />
      <AdFormSection />
    </div>
  );
};
