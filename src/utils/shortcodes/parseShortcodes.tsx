
import React from 'react';
import { PresaleShortcode } from '@/components/shortcodes/PresaleShortcode';

/**
 * Parses content string for shortcodes and replaces them with React components
 */
export const parseShortcodes = (content: string): React.ReactNode[] => {
  if (!content) return [];
  
  // Split the content by shortcode pattern
  const parts = content.split(/(\[presale\])/g);
  
  // Map each part to either text or a component
  return parts.map((part, index) => {
    if (part === '[presale]') {
      return <PresaleShortcode key={`presale-shortcode-${index}`} />;
    }
    
    // Return regular text content (may contain HTML)
    return (
      <div 
        key={`content-part-${index}`}
        dangerouslySetInnerHTML={{ __html: part }}
      />
    );
  });
};
