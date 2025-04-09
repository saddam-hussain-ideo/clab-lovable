
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, Plus, Trash2 } from "lucide-react";
import { PageContent, TokenomicsContent as TokenomicsContentType, TokenomicsSection } from "@/lib/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";

interface TokenomicsContentProps {
  content: PageContent | undefined;
  formatDate: (date: string) => string;
  onDataUpdated?: () => void;
}

const defaultContent: TokenomicsContentType = {
  totalSupply: "69B CLAB",
  tokenType: "SPL Token",
  sections: [],
  narrativeText: "Listen up—I've been around the block since BTC was under a buck, and let me tell you, CLAB has a tokenomic model built for true believers in this space. There's no team allocation—meaning no cheap dumps or hidden agendas. It's a fair and sustainable launch with a burned liquidity pool, locked forever so nobody's messing with the liquidity. The funds raised pump straight into product development, marketing, and rewarding the loyal crew who stick around for the long haul.\n\nCLAB allocates tokens in a way that serves its holders first: solid reserves for professional marketing, robust staking to reward long-term loyalty, future trading incentives for the hardcore degens, and an ever-growing community rewards pool. On top of that, we've locked in deep liquidity for high-volume trading—so you can move your bags without fear of slippage. Bottom line: If you're all about longevity, real utility, and a project that's got your back, CLAB is where you stack."
};

const defaultSection: TokenomicsSection = {
  name: "New Section",
  value: 0,
  amount: "0B",
  tabContent: {
    purpose: "Purpose:",
    details: ["Add details here"]
  }
};

export const TokenomicsContent = ({ content, formatDate, onDataUpdated }: TokenomicsContentProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TokenomicsContentType>(() => {
    if (!content?.content) return defaultContent;
    
    const tokenomicsContent = content.content as TokenomicsContentType;
    
    return {
      totalSupply: tokenomicsContent.totalSupply || defaultContent.totalSupply,
      tokenType: tokenomicsContent.tokenType || defaultContent.tokenType,
      narrativeText: tokenomicsContent.narrativeText || defaultContent.narrativeText,
      sections: Array.isArray(tokenomicsContent.sections) 
        ? tokenomicsContent.sections.map(section => ({
            name: section.name || defaultSection.name,
            value: typeof section.value === 'number' ? section.value : 0,
            amount: section.amount || defaultSection.amount,
            tabContent: {
              purpose: section.tabContent?.purpose || defaultSection.tabContent.purpose,
              details: Array.isArray(section.tabContent?.details) 
                ? section.tabContent.details 
                : defaultSection.tabContent.details
            }
          }))
        : []
    };
  });

  useEffect(() => {
    console.log("TokenomicsContent component loaded with data:", content);
    console.log("Initialized form data:", formData);
  }, [content]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const validatedData = {
        ...formData,
        sections: formData.sections.map(section => ({
          name: section.name,
          value: Number(section.value),
          amount: section.amount,
          tabContent: {
            purpose: section.tabContent?.purpose || "Purpose:",
            details: section.tabContent?.details || []
          }
        }))
      };

      console.log("Saving tokenomics data:", validatedData);

      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      const { data, error } = await supabase
        .from("page_content")
        .upsert({
          page_id: "tokenomics",
          section_id: "tokenomics",
          content: validatedData
        }, { 
          onConflict: 'page_id,section_id'
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Save successful:", data);

      toast({
        title: "Success!",
        description: "Tokenomics content has been updated successfully",
      });

      try {
        localStorage.removeItem('tokenomics-data');
      } catch (e) {
        console.warn("Failed to clear cache:", e);
      }
      
      if (onDataUpdated) {
        onDataUpdated();
      }

    } catch (error) {
      console.error("Error saving tokenomics content:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tokenomics content",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  function removeSection(index: number) {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  }

  function updateSection(index: number, field: string, value: any) {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i === index) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'tabContent') {
              return {
                ...section,
                tabContent: {
                  ...section.tabContent,
                  [child]: value
                }
              };
            }
          }
          return { ...section, [field]: value };
        }
        return section;
      })
    }));
  }

  function updateDetails(index: number, detailIndex: number, value: string) {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i === index) {
          const newDetails = [...(section.tabContent?.details || [])];
          newDetails[detailIndex] = value;
          return {
            ...section,
            tabContent: {
              ...section.tabContent,
              details: newDetails
            }
          };
        }
        return section;
      })
    }));
  }

  function addDetail(sectionIndex: number) {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i === sectionIndex) {
          return {
            ...section,
            tabContent: {
              ...section.tabContent,
              details: [...(section.tabContent?.details || []), "New detail"]
            }
          };
        }
        return section;
      })
    }));
  }

  function removeDetail(sectionIndex: number, detailIndex: number) {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i === sectionIndex && section.tabContent?.details) {
          return {
            ...section,
            tabContent: {
              ...section.tabContent,
              details: section.tabContent.details.filter((_, i) => i !== detailIndex)
            }
          };
        }
        return section;
      })
    }));
  }

  function addNewSection() {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { ...defaultSection }]
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokenomics Content</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          Last updated: {content?.updated_at ? formatDate(content.updated_at) : 'Never'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Total Supply</Label>
              <Input
                value={formData.totalSupply}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSupply: e.target.value }))}
                placeholder="e.g., 69B CLAB"
              />
            </div>
            
            <div>
              <Label>Token Type</Label>
              <Input
                value={formData.tokenType}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenType: e.target.value }))}
                placeholder="e.g., SPL Token"
              />
            </div>

            <div>
              <Label>Narrative Text Block</Label>
              <Textarea
                value={formData.narrativeText}
                onChange={(e) => setFormData(prev => ({ ...prev, narrativeText: e.target.value }))}
                placeholder="Enter the tokenomics narrative text here..."
                className="min-h-[200px]"
              />
              <p className="text-sm text-gray-500 mt-1">
                This text appears in the distribution tab on the Tokenomics page.
              </p>
            </div>

            {formData.sections.map((section, index) => (
              <Card key={index} className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Section {index + 1}</h3>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSection(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(index, 'name', e.target.value)}
                      placeholder="Section name"
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      value={section.amount}
                      onChange={(e) => updateSection(index, 'amount', e.target.value)}
                      placeholder="e.g., 13.80B"
                    />
                  </div>
                </div>

                <div>
                  <Label>Value (%)</Label>
                  <Input
                    type="number"
                    value={section.value}
                    onChange={(e) => updateSection(index, 'value', Number(e.target.value))}
                    placeholder="Percentage value"
                  />
                </div>

                <div>
                  <Label>Purpose</Label>
                  <Input
                    value={section.tabContent?.purpose || ''}
                    onChange={(e) => updateSection(index, 'tabContent.purpose', e.target.value)}
                    placeholder="Purpose"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Details</Label>
                  {section.tabContent?.details?.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex gap-2">
                      <Input
                        value={detail}
                        onChange={(e) => updateDetails(index, detailIndex, e.target.value)}
                        placeholder="Detail"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDetail(index, detailIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addDetail(index)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Detail
                  </Button>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addNewSection}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Section
            </Button>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
