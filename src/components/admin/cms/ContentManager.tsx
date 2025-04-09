
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContent } from "@/lib/types/cms";
import { Loader2 } from "lucide-react";
import { HomeContent } from "./sections/HomeContent";
import { RoadmapContent } from "./sections/roadmap";
import { LegalContent } from "./sections/LegalContent";
import { useEffect } from "react";

export const ContentManager = () => {
  useEffect(() => {
    console.log("ContentManager mounted");
  }, []);

  const { data: pageContents, isLoading } = useQuery({
    queryKey: ["page-contents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .order("page_id");

      if (error) {
        console.error("Error fetching page contents:", error);
        throw error;
      }
      
      return data as PageContent[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getContent = (pageId: string, sectionId: string) => {
    return pageContents?.find(
      (content) => content.page_id === pageId && content.section_id === sectionId
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Management System</h2>
          <p className="text-gray-500 mt-1">Manage website content and pages</p>
        </div>
      </div>
      
      <Tabs defaultValue="home" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="w-full flex flex-wrap gap-2">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="legal">Legal Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <HomeContent 
            content={getContent('home', 'main')}
            formatDate={formatDate}
          />
        </TabsContent>

        <TabsContent value="roadmap">
          <RoadmapContent 
            content={getContent('roadmap', 'main')}
            formatDate={formatDate}
          />
        </TabsContent>

        <TabsContent value="legal">
          <LegalContent 
            privacyContent={getContent('privacy', 'main')}
            termsContent={getContent('terms', 'main')}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
