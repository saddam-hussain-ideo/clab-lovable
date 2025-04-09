
import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form";
import { z } from "@/lib/zod-config";

interface InputWithValidationProps extends React.InputHTMLAttributes<HTMLInputElement> {
  schema?: ReturnType<typeof z.string> | ReturnType<typeof z.number> | ReturnType<typeof z.object> | ReturnType<typeof z.array> | any;
  errorMessage?: string;
  showError?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  sanitize?: boolean; // New prop to enable content sanitization
  maxLength?: number; // Add explicit maxLength control
  preserveUrl?: boolean; // Add prop to preserve URL formatting
}

export const InputWithValidation = React.forwardRef<HTMLInputElement, InputWithValidationProps>(
  ({ className, schema, errorMessage, showError = true, onValidationChange, onChange, onBlur, sanitize = true, maxLength = 256, preserveUrl = true, ...props }, ref) => {
    const [validationError, setValidationError] = React.useState<string | null>(null);
    const [isDirty, setIsDirty] = React.useState(false);
    
    // Basic content sanitization function
    const sanitizeInput = React.useCallback((value: string): string => {
      if (!sanitize) return value;
      
      // If preserveUrl is true and this looks like a URL, handle specially
      if (preserveUrl && value.match(/^https?:\/\//i)) {
        try {
          // Verify it's a valid URL by parsing it
          new URL(value);
          // For URLs, only encode quotes and angle brackets, leave slashes intact
          let sanitized = value
            .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
            .replace(/javascript:/gi, "") // Remove javascript: protocol
            .replace(/on\w+=/gi, ""); // Remove event handlers
            
          // Enforce maximum length
          if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
          }
          
          return sanitized;
        } catch (e) {
          // If URL parsing fails, use regular sanitization
        }
      }
      
      // Remove potentially dangerous HTML/script tags
      let sanitized = value
        .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+=/gi, ""); // Remove event handlers
      
      // Enforce maximum length
      if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }
      
      return sanitized;
    }, [sanitize, maxLength, preserveUrl]);
    
    const validate = React.useCallback(
      (value: string) => {
        if (!schema) return true;
        
        try {
          schema.parse(value);
          setValidationError(null);
          onValidationChange?.(true);
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.errors[0]?.message || "Invalid input";
            setValidationError(message);
            onValidationChange?.(false);
            return false;
          }
          setValidationError("Invalid input");
          onValidationChange?.(false);
          return false;
        }
      },
      [schema, onValidationChange]
    );
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mark as dirty once user starts typing
      if (!isDirty) setIsDirty(true);
      
      // Sanitize input value if enabled
      if (sanitize) {
        const originalValue = e.target.value;
        const sanitizedValue = sanitizeInput(originalValue);
        
        // Only modify the input if sanitization changed something
        if (sanitizedValue !== originalValue) {
          e.target.value = sanitizedValue;
        }
      }
      
      // Always call the original onChange if provided
      onChange?.(e);
      
      // Only validate if we have a schema and the input is dirty
      if (schema && isDirty) {
        validate(e.target.value);
      }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Additional sanitization on blur for extra safety
      if (sanitize) {
        const sanitizedValue = sanitizeInput(e.target.value);
        if (sanitizedValue !== e.target.value) {
          e.target.value = sanitizedValue;
        }
      }
      
      // Always call the original onBlur if provided
      onBlur?.(e);
      
      // Mark as dirty and validate on blur
      setIsDirty(true);
      if (schema) {
        validate(e.target.value);
      }
    };
    
    const displayError = showError && isDirty && validationError;
    const errorToShow = errorMessage || validationError;
    
    // Apply security constraints to component props
    const secureProps = {
      ...props,
      maxLength: maxLength, // Ensure maxLength is applied
      autoComplete: props.type === 'password' ? 'new-password' : props.autoComplete, // Better autocomplete settings for passwords
    };
    
    return (
      <div className="space-y-1 w-full">
        <Input
          ref={ref}
          className={cn(
            displayError ? "border-red-500 focus-visible:ring-red-500" : "",
            className
          )}
          onChange={handleChange}
          onBlur={handleBlur}
          {...secureProps}
        />
        {displayError && <FormMessage>{errorToShow}</FormMessage>}
      </div>
    );
  }
);

InputWithValidation.displayName = "InputWithValidation";
