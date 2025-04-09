
import React, { useRef } from 'react';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const SimpleEditor: React.FC<SimpleEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  minHeight = "150px"
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Function to handle inserting formatting tags around selected text
  const formatSelectedText = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      // There's a selection, so wrap it with formatting
      const selectedText = value.substring(start, end);
      const newValue = 
        value.substring(0, start) + 
        prefix + selectedText + suffix + 
        value.substring(end);
      
      onChange(newValue);
      
      // Restore selection plus formatting
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          end + prefix.length
        );
      }, 10);
    }
  };
  
  return (
    <div className="border border-input rounded-md bg-transparent">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 bg-transparent text-sm resize-y outline-none focus:ring-1 focus:ring-ring"
        style={{ minHeight }}
      />
    </div>
  );
};
