
import React from 'react';

interface DebugPanelProps {
  messages: string[];
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ messages }) => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Only show debug panel in development or if explicitly enabled
  if (!isDevelopment || messages.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8 text-left">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-60">
        {messages.map((msg, i) => (
          <div key={i} className="mb-1">{msg}</div>
        ))}
      </div>
    </div>
  );
};
