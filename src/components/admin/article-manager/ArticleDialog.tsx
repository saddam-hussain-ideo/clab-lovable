
import { ArticleForm } from "@/components/admin/ArticleForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NewArticle } from "@/lib/types";

interface ArticleDialogProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  isEditing: boolean;
  formData: NewArticle;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: Partial<NewArticle>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ArticleDialog = ({
  showModal,
  setShowModal,
  isEditing,
  formData,
  onSubmit,
  onChange,
  onCancel,
  isSubmitting,
}: ArticleDialogProps) => {
  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Article" : "Create New Article"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Make changes to your article here. Click update when you're done."
              : "Fill in the details for your new article. Click create when you're done."}
          </DialogDescription>
        </DialogHeader>

        <ArticleForm
          formData={formData}
          onSubmit={onSubmit}
          onChange={onChange}
          isSubmitting={isSubmitting}
        />

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form="article-form">
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
