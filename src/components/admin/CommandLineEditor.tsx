
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CommandLineEditorProps {
  sectionId: string;
  pageId: string;
  initialContent: any;
  onSave: (updatedContent: any) => void;
  onCancel: () => void;
}

export const CommandLineEditor = ({
  sectionId,
  pageId,
  initialContent,
  onSave,
  onCancel,
}: CommandLineEditorProps) => {
  const [content, setContent] = useState<string>(
    JSON.stringify(initialContent, null, 2)
  );
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the editor when it mounts
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl+S to save
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    
    // Handle Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
    
    // Handle arrow up/down for command history
    if (e.key === "ArrowUp" && history.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
    }
    
    if (e.key === "ArrowDown" && historyIndex >= 0) {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        setContent(history[newIndex]);
      } else {
        setContent(JSON.stringify(initialContent, null, 2));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Clear any previous error
    setError(null);
  };

  const handleSave = async () => {
    try {
      // Try to parse the JSON to validate it
      const parsedContent = JSON.parse(content);
      
      // Add current command to history
      setHistory((prev) => [content, ...prev.slice(0, 9)]);
      setHistoryIndex(-1);
      
      setIsSaving(true);
      
      console.log("Saving content to Supabase:", {
        page_id: pageId,
        section_id: sectionId,
        content: parsedContent
      });
      
      // Check if the record already exists
      const { data: existingData, error: fetchError } = await supabase
        .from("page_content")
        .select("id")
        .eq("page_id", pageId)
        .eq("section_id", sectionId)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Error checking existing content:", fetchError);
        throw fetchError;
      }
      
      let saveError;
      if (existingData) {
        console.log("Updating existing record:", existingData.id);
        // Update the existing record
        const { error } = await supabase
          .from("page_content")
          .update({ content: parsedContent })
          .eq("id", existingData.id);
        
        saveError = error;
      } else {
        console.log("Creating new record");
        // Insert a new record
        const { error } = await supabase
          .from("page_content")
          .insert({
            page_id: pageId,
            section_id: sectionId,
            content: parsedContent,
          });
        
        saveError = error;
      }
      
      if (saveError) {
        console.error("Error saving content:", saveError);
        throw saveError;
      }
      
      toast.success("The section has been successfully updated");
      
      // Pass the updated content back to the parent component
      onSave(parsedContent);
    } catch (err) {
      console.error("Save error:", err);
      if (err instanceof Error) {
        setError(err.message);
        toast.error(`Failed to update content: ${err.message}`);
      } else if (typeof err === 'object' && err !== null) {
        const errorMsg = JSON.stringify(err);
        setError(errorMsg);
        toast.error(`Failed to update content: ${errorMsg}`);
      } else {
        setError("Unknown error occurred");
        toast.error("Failed to update content: Unknown error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 rounded-t-lg border-b border-zinc-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-zinc-400">
          {sectionId}/{pageId} - JSON Editor
        </div>
        <div className="text-xs text-zinc-400">
          {isSaving ? "Saving..." : "Ready"}
        </div>
      </div>

      <div className="p-1">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full h-60 bg-zinc-900 text-fuchsia-300 font-mono text-sm p-4 outline-none resize-none"
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-900/20 border-t border-red-800 text-red-300 text-xs font-mono">
          Error: {error}
        </div>
      )}

      <div className="flex justify-between items-center px-4 py-2 bg-zinc-800 rounded-b-lg border-t border-zinc-700">
        <div className="text-xs text-zinc-400">
          <span className="text-fuchsia-400">Ctrl+S</span> Save | 
          <span className="text-fuchsia-400 ml-1">Esc</span> Cancel
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-xs bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 text-xs bg-fuchsia-700 text-white rounded hover:bg-fuchsia-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
