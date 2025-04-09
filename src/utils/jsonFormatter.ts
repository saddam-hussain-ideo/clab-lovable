
/**
 * Formats a JSON string with proper indentation
 * @param jsonString The JSON string to format
 * @returns Formatted JSON string or error message
 */
export const formatJson = (jsonString: string): { formatted: string; error: string | null } => {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      formatted: JSON.stringify(parsed, null, 2),
      error: null
    };
  } catch (error) {
    return {
      formatted: jsonString,
      error: error instanceof Error ? error.message : "Invalid JSON"
    };
  }
};

/**
 * Validates if a string is proper JSON
 * @param jsonString The JSON string to validate
 * @returns An object with isValid flag and error message if invalid
 */
export const validateJson = (jsonString: string): { isValid: boolean; error: string | null } => {
  try {
    JSON.parse(jsonString);
    return { isValid: true, error: null };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : "Invalid JSON" 
    };
  }
};
