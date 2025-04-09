
import { Article } from "@/lib/types";
import { RelatedArticlesWidget } from "@/components/RelatedArticlesWidget";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { parseShortcodes } from "@/utils/shortcodes/parseShortcodes";
import { FavoriteButton } from "@/components/articles/FavoriteButton";

interface ArticleContentProps {
  article: Article;
  articles: Article[];
}

export const ArticleContent = ({ article, articles }: ArticleContentProps) => {
  // Parse content for shortcodes
  const parsedContent = parseShortcodes(article.content || '');

  const shareData = {
    title: article.title,
    text: article.excerpt,
    url: window.location.href,
  };

  return (
    <article className="mt-8">
      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
          <span>{article.author}</span>
          <span>•</span>
          <span>{new Date(article.date).toLocaleDateString()}</span>
          <span>•</span>
          <span>{article.category}</span>
        </div>
        <div className="flex justify-between items-start">
          <ShareButtons {...shareData} />
          <FavoriteButton articleId={article.id} />
        </div>
        {article.imageUrl && (
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-64 object-cover rounded-lg mt-6"
          />
        )}
      </header>

      {/* Article Content */}
      <div 
        className="prose prose-lg max-w-none text-gray-300 
          [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-white
          [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-white
          [&>p]:mb-4 [&>p]:leading-relaxed
          [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:list-inside
          [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:list-inside
          [&>blockquote]:border-l-4 [&>blockquote]:border-gray-500 [&>blockquote]:pl-4 [&>blockquote]:italic
          [&>*:last-child]:mb-0"
      >
        {parsedContent}
      </div>

      {/* Related Articles Widget - Now placed after the article content */}
      {articles && articles.length > 0 && (
        <div className="mt-8">
          <RelatedArticlesWidget 
            currentArticleId={article.id}
            articles={articles}
          />
        </div>
      )}
    </article>
  );
};
