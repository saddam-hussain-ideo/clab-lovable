
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';

export const TailwindClasses = Extension.create({
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

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3]
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
];
