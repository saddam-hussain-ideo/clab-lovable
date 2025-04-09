
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Textarea } from "@/components/ui/textarea";
import { EditorToolbar } from "./EditorToolbar";
import { useEffect } from "react";

interface ArticleContentProps {
  content: string;
  excerpt: string;
  onChange: (data: { [key: string]: string }) => void;
  isSubmitting: boolean;
}

// Create a custom extension to handle Tailwind classes
const TailwindClasses = Extension.create({
  name: 'tailwindClasses',
  
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          class: {
            default: null,
            renderHTML: attributes => {
              if (!attributes.class) {
                return {};
              }
              
              return {
                class: attributes.class
              };
            },
            parseHTML: element => element.getAttribute('class')
          }
        }
      }
    ];
  }
});

// Custom extension to handle shortcodes
const ShortcodeExtension = Extension.create({
  name: 'shortcode',
  
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.classList.add('shortcode-node');
      dom.setAttribute('contenteditable', 'false');
      dom.innerHTML = `<div class="rounded bg-emerald-100 text-emerald-800 px-2 py-1 inline-flex items-center mr-1 text-sm">
        <span class="text-emerald-500 mr-1">⬦</span> Presale Widget
      </div>`;
      
      return {
        dom,
        update: () => {},
        destroy: () => {},
      };
    };
  },
});

export const ArticleContent = ({
  content,
  excerpt,
  onChange,
  isSubmitting
}: ArticleContentProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4'
          }
        }
      }),
      TextStyle,
      Color,
      TailwindClasses,
      ShortcodeExtension, // Add the shortcode extension
    ],
    content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML()
        .replace(/(<\/h[2-3]>)\s*(<p)/g, '$1$2')
        .replace(/(<\/p>)\s*(<p)/g, '$1$2')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log('Editor content updated:', newContent);
      onChange({ content: newContent });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none p-4 min-h-[200px] prose-invert text-foreground',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Excerpt</label>
        <Textarea
          value={excerpt}
          onChange={(e) => onChange({ excerpt: e.target.value })}
          required
          disabled={isSubmitting}
          className="text-foreground bg-secondary border-border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Content</label>
        <div className="border border-border rounded-md overflow-hidden bg-secondary">
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} className="bg-secondary" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tip: Use the Presale button in the toolbar to insert a presale widget within your content.
        </p>
      </div>
    </>
  );
};
