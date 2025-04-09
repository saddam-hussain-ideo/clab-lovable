
import { Buffer } from 'buffer';

/**
 * Initialize the Buffer polyfill globally
 * This must be imported as early as possible in the application
 */
export function initializeBufferPolyfill() {
  if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
    console.log("Buffer polyfill initialized:", typeof window.Buffer);
  }
}

// Auto-initialize on import
initializeBufferPolyfill();

// Re-export Buffer for convenience
export { Buffer };
