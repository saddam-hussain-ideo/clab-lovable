
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Advertisement } from "./types";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const CurrentAds = () => {
  const queryClient = useQueryClient();

  const { data: currentAds, isLoading } = useQuery({
    queryKey: ['advertisements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Advertisement[];
    }
  });

  const { mutate: toggleAdStatus } = useMutation({
    mutationFn: async ({ id, isActive, type }: { id: number, isActive: boolean, type: string }) => {
      // If activating an ad, deactivate all other ads of the same type
      if (isActive) {
        await supabase
          .from('advertisements')
          .update({ is_active: false })
          .eq('type', type);
      }

      // Update the status of the current ad
      const { error } = await supabase
        .from('advertisements')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Advertisement status updated");
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
    onError: (error) => {
      toast.error("Failed to update advertisement status");
      console.error('Error updating ad status:', error);
    }
  });

  const handleToggleStatus = (ad: Advertisement) => {
    toggleAdStatus({
      id: ad.id,
      isActive: !ad.is_active,
      type: ad.type
    });
  };

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading advertisements...</div>;
  }

  if (!currentAds?.length) {
    return <div className="p-4 text-gray-500">No advertisements found</div>;
  }

  // Group ads by type
  const sidebarAds = currentAds.filter(ad => ad.type === 'sidebar');
  const bannerAds = currentAds.filter(ad => ad.type === 'banner');
  const leaderboardAds = currentAds.filter(ad => ad.type === 'leaderboard');

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Current Advertisements</h3>
      
      <div className="space-y-8">
        {sidebarAds.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-3">Sidebar Ads</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sidebarAds.map(ad => (
                <div key={ad.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium">
                      Ad #{ad.id}
                      <span className="text-gray-500 text-xs ml-2">(300x250)</span>
                    </h5>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={ad.is_active} 
                        onCheckedChange={() => handleToggleStatus(ad)}
                      />
                      <span className={ad.is_active ? "text-green-600 text-xs" : "text-gray-500 text-xs"}>
                        {ad.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="aspect-[6/5] relative mb-2">
                    <img 
                      src={ad.image_url} 
                      alt={`Ad #${ad.id}`} 
                      className="absolute inset-0 w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600 break-all">
                    Target URL: <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{ad.target_url}</a>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {bannerAds.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-3">Banner Ads</h4>
            <div className="grid grid-cols-1 gap-4">
              {bannerAds.map(ad => (
                <div key={ad.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium">
                      Ad #{ad.id}
                      <span className="text-gray-500 text-xs ml-2">(728x90)</span>
                    </h5>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={ad.is_active} 
                        onCheckedChange={() => handleToggleStatus(ad)}
                      />
                      <span className={ad.is_active ? "text-green-600 text-xs" : "text-gray-500 text-xs"}>
                        {ad.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="aspect-[8/1] relative mb-2">
                    <img 
                      src={ad.image_url} 
                      alt={`Ad #${ad.id}`} 
                      className="absolute inset-0 w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600 break-all">
                    Target URL: <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{ad.target_url}</a>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {leaderboardAds.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-3">Leaderboard Ads</h4>
            <div className="grid grid-cols-1 gap-4">
              {leaderboardAds.map(ad => (
                <div key={ad.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium">
                      Ad #{ad.id}
                      <span className="text-gray-500 text-xs ml-2">(728x90)</span>
                    </h5>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={ad.is_active} 
                        onCheckedChange={() => handleToggleStatus(ad)}
                      />
                      <span className={ad.is_active ? "text-green-600 text-xs" : "text-gray-500 text-xs"}>
                        {ad.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="aspect-[8/1] relative mb-2">
                    <img 
                      src={ad.image_url} 
                      alt={`Ad #${ad.id}`} 
                      className="absolute inset-0 w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600 break-all">
                    Target URL: <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{ad.target_url}</a>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
