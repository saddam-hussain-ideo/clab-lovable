
import { NewArticle } from "@/lib/types";
import { ArticleMetadata } from "./article-form/ArticleMetadata";
import { ArticleContent } from "./article-form/ArticleContent";
import { ImageUpload } from "./article-form/ImageUpload";
import { PublishSwitch } from "./article-form/PublishSwitch";
import { ArticleSEO } from "./article-form/ArticleSEO";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ArticleFormProps {
  formData: NewArticle;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: Partial<NewArticle>) => void;
  isSubmitting: boolean;
}

export const ArticleForm = ({ 
  formData, 
  onSubmit, 
  onChange, 
  isSubmitting 
}: ArticleFormProps) => {
  return (
    <form id="article-form" onSubmit={onSubmit} className="space-y-6 text-foreground">
      <ArticleMetadata
        title={formData.title}
        date={formData.date}
        category={formData.category}
        author={formData.author}
        onChange={(data) => onChange(data)}
        isSubmitting={isSubmitting}
      />

      <ArticleContent
        content={formData.content}
        excerpt={formData.excerpt}
        onChange={(data) => onChange(data)}
        isSubmitting={isSubmitting}
      />

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Article Image</label>
        <ImageUpload
          imageUrl={formData.imageUrl}
          onChange={(imageUrl) => onChange({ imageUrl })}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label htmlFor="featured" className="text-sm font-medium text-foreground">
            Featured Article
          </label>
          <p className="text-sm text-muted-foreground">
            Featured articles appear in a special section on the home page
          </p>
        </div>
        <Switch
          id="featured"
          checked={formData.is_featured}
          onCheckedChange={(checked) => onChange({ is_featured: checked })}
          disabled={isSubmitting}
        />
      </div>

      <Accordion type="single" collapsible className="text-foreground">
        <AccordionItem value="seo">
          <AccordionTrigger>SEO Metadata</AccordionTrigger>
          <AccordionContent>
            <ArticleSEO
              meta_title={formData.meta_title}
              meta_description={formData.meta_description}
              meta_keywords={formData.meta_keywords}
              onChange={(data) => onChange(data)}
              isSubmitting={isSubmitting}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <PublishSwitch
        status={formData.status}
        onChange={(status) => onChange({ status })}
      />
    </form>
  );
};
