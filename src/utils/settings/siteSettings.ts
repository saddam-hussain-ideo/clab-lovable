
import { supabase } from "@/lib/supabase";

/**
 * Utility function to safely update a site setting
 * Checks if the setting exists first and handles insert or update accordingly
 */
export const updateSiteSetting = async (
  key: string,
  value: string | boolean | number | object
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log(`Updating site setting: ${key} = ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    
    // Check if setting exists first
    const exists = await settingExists(key);
    console.log(`Setting ${key} exists: ${exists}`);
    
    // Stringify non-string values
    const stringValue = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    let result;
    
    if (exists) {
      // Update existing setting
      console.log(`Updating existing setting: ${key}`);
      result = await supabase
        .from('site_settings')
        .update({ value: stringValue })
        .eq('key', key);
    } else {
      // Insert new setting
      console.log(`Inserting new setting: ${key}`);
      result = await supabase
        .from('site_settings')
        .insert({ key, value: stringValue });
    }
    
    if (result.error) {
      console.error(`Error ${exists ? 'updating' : 'inserting'} ${key} setting:`, result.error);
      return { success: false, error: result.error };
    }
    
    console.log(`Successfully ${exists ? 'updated' : 'inserted'} site setting: ${key}`);
    return { success: true };
  } catch (error) {
    console.error(`Exception in updateSiteSetting for ${key}:`, error);
    return { success: false, error };
  }
};

/**
 * Retrieves a site setting value
 */
export const getSiteSetting = async <T>(
  key: string,
  defaultValue?: T
): Promise<T | null> => {
  try {
    console.log(`Fetching site setting: ${key}`);
    
    // Direct database query with detailed error logging
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching ${key} setting:`, error);
      return defaultValue !== undefined ? defaultValue : null;
    }
    
    if (!data || !data.value) {
      console.log(`No data found for ${key} setting, using default:`, defaultValue);
      return defaultValue !== undefined ? defaultValue : null;
    }
    
    console.log(`Retrieved site setting ${key}:`, data.value);
    
    // Try to parse as JSON if it looks like JSON
    if (typeof data.value === 'string' && 
        (data.value.startsWith('{') || 
         data.value.startsWith('[') || 
         data.value === 'true' || 
         data.value === 'false' ||
         !isNaN(Number(data.value)))
    ) {
      try {
        return JSON.parse(data.value);
      } catch {
        // If parsing fails, return as is
        return data.value as unknown as T;
      }
    }
    
    return data.value as unknown as T;
  } catch (error) {
    console.error(`Exception in getSiteSetting for ${key}:`, error);
    return defaultValue !== undefined ? defaultValue : null;
  }
};

/**
 * Direct method to check if a setting exists
 */
export const settingExists = async (key: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('site_settings')
      .select('*', { count: 'exact', head: true })
      .eq('key', key);
    
    if (error) {
      console.error(`Error checking if ${key} setting exists:`, error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error(`Exception in settingExists for ${key}:`, error);
    return false;
  }
};
