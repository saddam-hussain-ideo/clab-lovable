import { safelyAccessProperty } from "./safeAccess";

/**
 * Formats a wallet address to show only the beginning and end characters
 * @param address The full wallet address to format
 * @param startChars Number of characters to show at the start
 * @param endChars Number of characters to show at the end
 * @returns Formatted wallet address string
 */
export const formatWalletAddress = (
  address: string | null | undefined | any,
  startChars: number = 4,
  endChars: number = 4
): string => {
  // Handle null, undefined, or non-string values
  if (!address || typeof address !== 'string') {
    return 'Not Connected';
  }
  
  // Handle addresses that are too short
  if (address.length <= startChars + endChars + 3) {
    return address;
  }
  
  try {
    const start = address.substring(0, startChars);
    const end = address.substring(address.length - endChars);
    return `${start}...${end}`;
  } catch (error) {
    console.error('Error formatting wallet address:', error);
    return 'Invalid Address';
  }
};
