
import { toast } from 'sonner';

/**
 * Copy text to clipboard and show a toast notification
 */
export const copyToClipboard = (text: string, successMessage: string = 'Copied to clipboard') => {
  try {
    navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    toast.error('Failed to copy to clipboard');
    return false;
  }
};
