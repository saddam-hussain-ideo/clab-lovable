
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange } from "lucide-react";
import { PageContent } from "@/lib/types/cms";
import { PageContentForm } from "../PageContentForm";

interface LegalContentProps {
  privacyContent: PageContent | undefined;
  termsContent: PageContent | undefined;
  formatDate: (date: string) => string;
}

export const LegalContent = ({ privacyContent, termsContent, formatDate }: LegalContentProps) => {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Last updated: {privacyContent?.updated_at ? 
              formatDate(privacyContent.updated_at) : 
              'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PageContentForm
            pageId="privacy"
            sectionId="main"
            initialContent={privacyContent?.content}
            template={{
              lastUpdated: new Date().toISOString(),
              sections: [
                {
                  title: "Section Title",
                  content: "Section content goes here"
                }
              ]
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Last updated: {termsContent?.updated_at ? 
              formatDate(termsContent.updated_at) : 
              'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PageContentForm
            pageId="terms"
            sectionId="main"
            initialContent={termsContent?.content}
            template={{
              lastUpdated: new Date().toISOString(),
              sections: [
                {
                  title: "Section Title",
                  content: "Section content goes here"
                }
              ]
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
