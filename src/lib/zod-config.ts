
/**
 * This file pre-initializes Zod to ensure it's properly loaded
 * before any other modules try to use it.
 */
// Import the entire zod library
import * as z from 'zod';

// Export the z object directly for consistent access
export { z };

// Re-export the ZodType type properly
export type { ZodType } from 'zod';

// Define the infer type using z's infer
export type infer<T extends z.ZodType<any, any, any>> = z.infer<T>;

// Make sure Zod is initialized
(() => {
  try {
    // Force Zod initialization
    const _testSchema = z.string();
    console.log("Zod initialized successfully");
  } catch (e) {
    console.error("Failed to initialize Zod:", e);
  }
})();

// Export a simple schema to force Zod initialization
export const simpleSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Initialize some common Zod validation patterns
export const nonEmptyString = z.string().min(1, "This field cannot be empty");
export const emailSchema = z.string().email("Please enter a valid email address");
export const optionalString = z.string().optional();
export const nullableString = z.string().nullable();

// URL validation with proper protocol check
export const urlSchema = z.string()
  .url("Please enter a valid URL")
  .regex(/^https?:\/\//, "URL must start with http:// or https://");

// Username validation with additional security checks
export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be less than 50 characters")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens")
  .refine(val => !val.includes(".."), "Username cannot contain consecutive dots");

// Wallet address validation (basic pattern for Solana, can be extended)
export const walletAddressSchema = z.string()
  .length(44, "Wallet address must be 44 characters long")
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid wallet address format");

// Safe number input validation
export const numberInputSchema = z.preprocess(
  // Convert string to number, handle empty strings
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? undefined : parsed;
  },
  z.number().optional()
);

// Quiz-specific schemas
export const quizAnswerSchema = z.number()
  .int("Answer must be a whole number")
  .min(0, "Invalid answer selection");

export const quizCategorySchema = z.enum([
  "satoshi", 
  "bitcoin_history", 
  "ethereum_history", 
  "altcoins", 
  "defi", 
  "web3", 
  "crypto_news", 
  "crypto_personalities", 
  "degenerates"
], {
  errorMap: () => ({ message: "Please select a valid category" })
});

// Input sanitization helper to prevent XSS
export const sanitizeInput = (input: string): string => {
  if (!input) return input;
  
  // Special handling for URLs - check if input looks like a URL
  if (input.match(/^https?:\/\//i)) {
    try {
      // Verify it's a valid URL by parsing it
      new URL(input);
      // For URLs, only encode quotes and angle brackets, leave slashes intact
      return input
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    } catch (e) {
      // If URL parsing fails, use regular sanitization
    }
  }
  
  // Regular sanitization for non-URLs
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Function to validate form inputs with type support
export const validateFormInput = <T>(schema: z.ZodType<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError?.message || "Validation failed" };
    }
    return { success: false, error: "Unknown validation error" };
  }
};
