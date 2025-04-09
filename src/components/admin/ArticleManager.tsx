import { ArticleList } from "@/components/admin/ArticleList";
import { useArticles } from "@/hooks/useArticles";
import { Article, NewArticle } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";  // Fixed import path
import { PlusCircle } from "lucide-react";
import { SearchBar } from "./article-manager/SearchBar";
import { ArticlePagination } from "./article-manager/ArticlePagination";
import { ArticleDialog } from "./article-manager/ArticleDialog";

export const ArticleManager = () => {
  const {
    articles,
    articlesLoading,
    submitArticle,
    isSubmitting,
    deleteArticle,
    updateArticleStatus,
    updateArticle
  } = useArticles();

  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  // Ensure date is in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const emptyFormData: NewArticle = {
    title: "",
    excerpt: "",
    content: "",
    category: "",
    author: "",
    imageUrl: "",
    status: "draft",
    date: getCurrentDate()
  };

  const [formData, setFormData] = useState<NewArticle>(emptyFormData);

  const filteredArticles = articles?.filter(article => {
    const searchLower = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower) ||
      article.author.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, {
          ...formData,
          date: formData.date || getCurrentDate() // Ensure we always have a date
        });
        setIsEditing(false);
        setEditingArticle(null);
      } else {
        await submitArticle({
          ...formData,
          date: formData.date || getCurrentDate() // Ensure we always have a date
        });
      }
      setFormData(emptyFormData);
      setShowModal(false);
    } catch (error) {
      console.error('Error submitting/updating article:', error);
    }
  };

  const handleEdit = (article: Article) => {
    console.log('ArticleManager: handleEdit called with article:', article);
    toast.success(`Editing article: ${article.title}`);
    
    // Ensure the date is in YYYY-MM-DD format
    const formattedDate = article.date ? new Date(article.date).toISOString().split('T')[0] : getCurrentDate();
    console.log('Setting form data with date:', formattedDate);
    
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      author: article.author,
      imageUrl: article.imageUrl,
      status: article.status as 'draft' | 'published',
      date: formattedDate
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleFormChange = (data: Partial<NewArticle>) => {
    console.log('Form data being updated:', data);
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingArticle(null);
    setFormData(emptyFormData);
    setShowModal(false);
  };

  const handleNewArticle = () => {
    setIsEditing(false);
    setEditingArticle(null);
    setFormData({
      ...emptyFormData,
      date: getCurrentDate() // Ensure new articles get today's date
    });
    setShowModal(true);
  };

  const totalPages = filteredArticles ? Math.ceil(filteredArticles.length / itemsPerPage) : 0;
  const paginatedArticles = filteredArticles ? filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) : [];

  return (
    <div className="space-y-8 text-foreground pt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Manage Articles</h2>
        <Button onClick={handleNewArticle} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          New Article
        </Button>
      </div>

      <SearchBar 
        searchTerm={searchTerm} 
        onSearch={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />

      {articlesLoading ? (
        <p className="text-foreground">Loading articles...</p>
      ) : (
        <>
          {paginatedArticles.length === 0 && searchTerm ? (
            <p className="text-center text-muted-foreground my-8">
              No articles found matching "{searchTerm}"
            </p>
          ) : (
            <ArticleList
              articles={paginatedArticles}
              onUpdateStatus={(id, status) => updateArticleStatus({ id, status })}
              onDelete={deleteArticle}
              onEdit={handleEdit}
            />
          )}

          <ArticlePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <ArticleDialog
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={isEditing}
        formData={formData}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
