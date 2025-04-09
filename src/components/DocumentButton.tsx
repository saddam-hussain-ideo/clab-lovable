
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface DocumentButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "nav" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

export const DocumentButton = ({
  className,
  variant = "outline",
  size = "sm"
}: DocumentButtonProps) => {
  const [buttonTitle, setButtonTitle] = useState("WHITE PAPER");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocumentSettings();
  }, []);

  const fetchDocumentSettings = async () => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.from("clab_documents").select("button_title, file_path").eq("document_type", "main").single();
      if (error) throw error;
      if (data) {
        setButtonTitle(data.button_title || "WHITE PAPER");
        setFilePath(data.file_path);
      }
    } catch (error) {
      console.error("Error fetching document settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentClick = () => {
    if (!filePath) {
      toast.error("Document is not available yet");
      return;
    }

    // Open the document in a new tab
    window.open(filePath, "_blank", "noopener,noreferrer");
  };

  // Don't render anything if still loading or no file available
  if (isLoading) {
    return null;
  }

  // Don't render the button if there's no document
  if (!filePath) {
    return null;
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      className={`document-button min-w-[160px] ${className}`}
      onClick={handleDocumentClick}
    >
      <FileText className="mr-2 h-4 w-4" />
      <span className="whitespace-nowrap font-medium">{buttonTitle}</span>
    </Button>
  );
};
