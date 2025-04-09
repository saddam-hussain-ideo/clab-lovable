import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Loader2, Copy, AlertCircle } from "lucide-react";

interface PageContentFormProps {
  pageId: string;
  sectionId: string;
  initialContent: any;
  template?: any;
  onSuccess?: () => void;
}

export const PageContentForm = ({ pageId, sectionId, initialContent, template, onSuccess }: PageContentFormProps) => {
  const [content, setContent] = useState(
    JSON.stringify(initialContent || template || {}, null, 2)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setJsonError(null);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message);
      } else {
        setJsonError("Invalid JSON format");
      }
      return false;
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (newContent.trim()) {
      validateJson(newContent);
    } else {
      setJsonError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateJson(content)) {
      toast.error("Please fix the JSON format errors before submitting");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const parsedContent = JSON.parse(content);
      const timestamp = Date.now(); // Add timestamp for cache busting

      // Add strong cache control headers
      const { error } = await supabase
        .from("page_content")
        .upsert({
          page_id: pageId,
          section_id: sectionId,
          content: parsedContent,
          updated_at: new Date().toISOString() // Force updated_at to change
        }, { 
          onConflict: 'page_id,section_id'
        });

      if (error) throw error;

      // Clear localStorage and sessionStorage to force fresh data
      try {
        // Clear all items that might be related to this content
        Object.keys(localStorage).forEach(key => {
          if (key.includes(pageId) || key.includes(sectionId) || key.includes('cms') || key.includes('content')) {
            localStorage.removeItem(key);
          }
        });
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes(pageId) || key.includes(sectionId) || key.includes('cms') || key.includes('content')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn("Failed to clear cache:", e);
      }

      toast.success("Page content has been updated");
      
      // Force query client to refetch this data
      if (onSuccess) {
        onSuccess();
      }
      
      // Force reload after a short delay to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Failed to update page content. Please check your JSON format.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadTemplate = () => {
    if (template) {
      setContent(JSON.stringify(template, null, 2));
      setJsonError(null);
      toast.success("The template has been loaded into the editor");
    }
  };

  const tokenomicsTemplate = pageId === 'tokenomics' ? {
    totalSupply: "268B CLAB",
    sections: [
      {
        name: "Marketing",
        value: 20,
        amount: "53.60B",
        tabContent: {
          purpose: "Purpose:",
          details: [
            "Promotions & Awareness: Influencer outreach, social media ads, community-building",
            "Community growth initiatives",
            "Brand development and partnerships"
          ]
        }
      },
      {
        name: "Liquidity",
        value: 20,
        amount: "53.60B",
        tabContent: {
          purpose: "Purpose:",
          details: [
            "DEX Liquidity: Paired with ETH for trading pools",
            "Reduces price volatility and slippage",
            "LP tokens will be locked to build trust"
          ]
        }
      },
      {
        name: "Quiz Rewards",
        value: 25,
        amount: "67.00B",
        tabContent: {
          purpose: "Mechanism:",
          details: [
            "Users earn points by completing the CLAB Quiz",
            "Points can be exchanged for CLAB at token launch",
            "3-month staking lock on redeemed tokens"
          ]
        }
      },
      {
        name: "Roadmap Dev",
        value: 15,
        amount: "40.20B",
        tabContent: {
          purpose: "Purpose:",
          details: [
            "Continuous development of platform features",
            "Technical improvements and updates",
            "Future roadmap implementation funding"
          ],
          ctaLink: {
            text: "View Full Development Roadmap",
            url: "/roadmap"
          }
        }
      }
    ]
  } : template;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="content-textarea" className="block text-sm font-medium">Content (JSON)</label>
          {tokenomicsTemplate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadTemplate}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Load Template
            </Button>
          )}
        </div>
        
        <Textarea
          id="content-textarea"
          value={content}
          onChange={handleContentChange}
          className={`font-mono text-sm ${jsonError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          rows={20}
        />
        
        {jsonError && (
          <div className="text-red-500 text-sm flex items-start gap-2 mt-1 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">JSON Error</p>
              <p className="text-xs">{jsonError}</p>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || !!jsonError}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
};
