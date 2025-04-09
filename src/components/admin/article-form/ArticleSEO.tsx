
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ArticleSEOProps {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  onChange: (data: { [key: string]: any }) => void;
  isSubmitting: boolean;
}

export const ArticleSEO = ({
  meta_title = "",
  meta_description = "",
  meta_keywords = [],
  onChange,
  isSubmitting
}: ArticleSEOProps) => {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-foreground">Meta Title</Label>
        <Input
          value={meta_title}
          onChange={(e) => onChange({ meta_title: e.target.value })}
          placeholder="Enter SEO title (optional)"
          disabled={isSubmitting}
          className="text-foreground bg-secondary border-border mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          If left empty, the article title will be used
        </p>
      </div>

      <div>
        <Label className="text-foreground">Meta Description</Label>
        <Textarea
          value={meta_description}
          onChange={(e) => onChange({ meta_description: e.target.value })}
          placeholder="Enter SEO description (optional)"
          disabled={isSubmitting}
          className="text-foreground bg-secondary border-border mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          If left empty, the article excerpt will be used
        </p>
      </div>

      <div>
        <Label className="text-foreground">Meta Keywords</Label>
        <Input
          value={meta_keywords?.join(", ")}
          onChange={(e) => onChange({ 
            meta_keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean)
          })}
          placeholder="Enter keywords separated by commas"
          disabled={isSubmitting}
          className="text-foreground bg-secondary border-border mt-2"
        />
      </div>
    </div>
  );
};
