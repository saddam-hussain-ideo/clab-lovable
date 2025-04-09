
/**
 * Safely access properties that might be non-existent
 * or cause exceptions when accessed
 */
export const safelyAccessProperty = (obj: any, propName: string): any => {
  if (!obj) return undefined;
  
  try {
    return obj[propName];
  } catch (error) {
    console.warn(`Error accessing property ${propName}:`, error);
    return undefined;
  }
};
