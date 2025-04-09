
/**
 * This file initializes token logging and tracking immediately on import
 * Production-safe version - only enables detailed logging in development
 */

import { setupGlobalTokenLogging } from './debugLogging';
import { dumpTokenStorage } from './tokenCalculation';
import { monitorTokenChanges } from './tokenTracking';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Only initialize extensive logging in development
if (isDevelopment) {
  // Initialize logging
  setupGlobalTokenLogging();

  // Dump existing token storage values
  const storedValues = dumpTokenStorage();
  console.log('Initial token storage values:', storedValues);

  // Set up monitoring
  monitorTokenChanges();

  // Add a global convenience method to access logs
  if (typeof window !== 'undefined') {
    try {
      // Make dumpTokenStorage available globally only in development
      window.dumpTokenStorage = dumpTokenStorage;
      
      // Create a test log to verify the system is working
      console.log('%c Token logging system initialized in development mode ', 'background: #4CAF50; color: white; font-size: 12px;');
      
      // Create a test log
      if (window.tokenLogs) {
        window.tokenLogs.push({
          type: 'info',
          timestamp: new Date().toISOString(),
          location: 'tokenLoggingInit',
          message: 'Token logging system initialized',
          data: { storedValues }
        });
      }
    } catch (e) {
      // Silent error in production
      if (isDevelopment) {
        console.error('Failed to add global token logging methods:', e);
      }
    }
  }
}

// No debug buttons in production
document.addEventListener('DOMContentLoaded', () => {
  // Only add debug buttons if explicitly enabled via environment variable AND in development
  const debuggingEnabled = isDevelopment && false; // Set to false to hide buttons
  
  if (debuggingEnabled && window.location.pathname.includes('/profile')) {
    setTimeout(() => {
      try {
        const profileContainer = document.querySelector('.container');
        if (profileContainer) {
          const debugButton = document.createElement('button');
          debugButton.innerText = 'Show Token Logs';
          debugButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px 15px; background: #4b0082; color: white; border: none; border-radius: 4px; cursor: pointer; z-index: 9999;';
          
          debugButton.onclick = () => {
            if (typeof window.showTokenLogs === 'function') {
              window.showTokenLogs();
              alert('Token logs have been printed to the console. Please open your browser developer tools to view them.');
            } else {
              alert('Token logging system is not properly initialized.');
            }
          };
          
          document.body.appendChild(debugButton);
        }
      } catch (error) {
        // Silent fail in production
      }
    }, 1000);
  }
});

// In production, we don't add token consistency test function
if (typeof window !== 'undefined' && isDevelopment) {
  try {
    window.testTokenConsistency = (amount) => {
      const { ensureConsistentTokenAmount } = require('./tokenCalculation');
      const result = ensureConsistentTokenAmount(amount, 'test_button');
      console.log(`Input: ${amount} → Output: ${result}`);
      alert(`Token consistency test:\nInput: ${amount}\nOutput: ${result}\n\nCheck console for details.`);
    };
  } catch (e) {
    // Silent fail in production
  }
}

// Extend window type definition
declare global {
  interface Window {
    showTokenLogs?: () => string;
    printTokenLogs?: () => string;
    dumpTokenStorage?: () => Record<string, string>;
    tokenLogs?: any[];
    testTokenConsistency?: (amount: number) => void;
  }
}

export default { 
  initialized: true,
  timestamp: new Date().toISOString()
};
