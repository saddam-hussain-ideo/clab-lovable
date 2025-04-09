
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignJustify } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextColorSelector } from "./TextColorSelector";

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = "Enter content here...",
  minHeight = "200px",
  className = "",
}: SimpleRichTextEditorProps) {
  const [text, setText] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Update the internal text state when value prop changes
  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setText(newValue);
    onChange(newValue);
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Only apply formatting if text is selected
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const beforeText = text.substring(0, start);
      const afterText = text.substring(end);

      const newText = beforeText + prefix + selectedText + suffix + afterText;
      setText(newText);
      onChange(newText);

      // Set selection to after the inserted formatting with a small delay
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          end + prefix.length
        );
      }, 10);
    } else {
      // If no text is selected, insert the formatting tags and place cursor between them
      const beforeText = text.substring(0, start);
      const afterText = text.substring(start);
      const newText = beforeText + prefix + suffix + afterText;
      
      setText(newText);
      onChange(newText);
      
      // Place cursor between the tags
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length
        );
      }, 10);
    }
  };

  const applyHeading = (level: number) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find the beginning of the line
    let lineStart = start;
    while (lineStart > 0 && text.charAt(lineStart - 1) !== '\n') {
      lineStart--;
    }

    // Check if there's already a heading at this line
    const currentLine = text.substring(lineStart, end);
    const headingMatch = currentLine.match(/^(#{1,6})\s/);
    
    // Create the replacement
    const headingPrefix = '#'.repeat(level) + ' ';
    let newText;
    
    if (headingMatch) {
      // Replace existing heading
      newText = text.substring(0, lineStart) + 
                headingPrefix + 
                text.substring(lineStart + headingMatch[0].length);
    } else {
      // Add new heading
      newText = text.substring(0, lineStart) + 
                headingPrefix + 
                text.substring(lineStart);
    }
    
    setText(newText);
    onChange(newText);
    
    // Restore focus with a delay
    setTimeout(() => {
      textarea.focus();
    }, 10);
  };

  const insertColoredText = (color: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      // Apply color only to selected text
      const selectedText = text.substring(start, end);
      const coloredText = `<span style="color: ${color}">${selectedText}</span>`;
      const newText = text.substring(0, start) + coloredText + text.substring(end);
      
      setText(newText);
      onChange(newText);
      
      // Set selection after the colored text with a delay
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + coloredText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 10);
    } else {
      // If no text is selected, insert a placeholder
      const coloredText = `<span style="color: ${color}">Colored text</span>`;
      const newText = text.substring(0, start) + coloredText + text.substring(end);
      
      setText(newText);
      onChange(newText);
      
      // Position cursor after the inserted colored text
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + coloredText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 10);
    }
  };

  const insertList = (ordered: boolean) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    
    // Split the selected text into lines
    const lines = selectedText.split('\n');
    
    // Format each line as a list item
    const formattedLines = lines.map((line, index) => {
      if (line.trim() === '') return line;
      return ordered ? `${index + 1}. ${line}` : `- ${line}`;
    });
    
    // Join the lines back together
    const formattedText = formattedLines.join('\n');
    
    const newText = text.substring(0, start) + formattedText + text.substring(end);
    setText(newText);
    onChange(newText);
    
    // Restore cursor position with a delay
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 10);
  };

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/50">
        <Toggle aria-label="Bold" onClick={() => insertFormatting("**")}>
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle aria-label="Italic" onClick={() => insertFormatting("*")}>
          <Italic className="h-4 w-4" />
        </Toggle>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Toggle aria-label="Heading 1" onClick={() => applyHeading(1)}>
          H1
        </Toggle>
        <Toggle aria-label="Heading 2" onClick={() => applyHeading(2)}>
          H2
        </Toggle>
        <Toggle aria-label="Heading 3" onClick={() => applyHeading(3)}>
          H3
        </Toggle>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Toggle aria-label="Bullet List" onClick={() => insertList(false)}>
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle aria-label="Numbered List" onClick={() => insertList(true)}>
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <div className="w-px h-6 bg-border mx-1"></div>
        <TextColorSelector onSelectColor={insertColoredText} />
      </div>
      <ScrollArea style={{ maxHeight: "600px" }}>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          placeholder={placeholder}
          style={{ minHeight, resize: "vertical" }}
          className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </ScrollArea>
    </div>
  );
}
