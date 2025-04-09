
import { Article } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ArticleListProps {
  articles: Article[];
  onUpdateStatus: (id: number, status: 'published' | 'draft') => void;
  onDelete: (id: number) => void;
  onEdit: (article: Article) => void;
}

export const ArticleList = ({ articles, onUpdateStatus, onDelete, onEdit }: ArticleListProps) => {
  const handleEditClick = (article: Article) => {
    console.log('ArticleList: handleEditClick called with article:', article);
    onEdit(article);
  };

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <div 
          key={article.id} 
          className="flex items-center justify-between p-4 bg-secondary rounded-lg shadow"
        >
          <div>
            <h3 className="font-medium text-foreground">{article.title}</h3>
            <p className="text-sm text-muted-foreground">
              {article.date} • {article.category}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {article.status === 'published' ? 'Published' : 'Draft'}
              </span>
              <Switch
                checked={article.status === 'published'}
                onCheckedChange={(checked) => 
                  onUpdateStatus(article.id, checked ? 'published' : 'draft')
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(article)}
              className="text-blue-500 hover:text-blue-400 hover:bg-blue-950"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-400 hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the article.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(article.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};
