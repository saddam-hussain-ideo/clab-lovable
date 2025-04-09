
/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers mapping
 * @returns CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: Record<keyof T, string>
): string => {
  if (data.length === 0) return '';

  // Get all possible keys from data
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  // Use provided headers or generate from keys
  const keys = headers ? Object.keys(headers) as Array<keyof T> : Array.from(allKeys) as Array<keyof T>;
  
  // Create header row
  const headerRow = headers
    ? keys.map(key => headers[key])
    : keys;

  // Create data rows
  const rows = data.map(item => 
    keys.map(key => {
      const value = item[key];
      // Handle special cases like objects, arrays, null, undefined
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      // Quote values with commas
      if (String(value).includes(',')) return `"${value}"`;
      return String(value);
    })
  );

  // Combine header and data rows
  return [headerRow, ...rows].map(row => row.join(',')).join('\n');
};

/**
 * Download data as a CSV file
 * @param data Data to download
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers mapping
 */
export const downloadCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): void => {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
