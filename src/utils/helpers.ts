
/**
 * Format a number with commas as thousands separators
 * @param num The number to format
 * @param maxDecimals Maximum number of decimal places to display (default: 2)
 * @returns Formatted number string
 */
export function formatNumberWithCommas(
  num: number | string | null | undefined, 
  maxDecimals: number = 2
): string {
  if (num === null || num === undefined) return '0';
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  });
}

/**
 * Format a currency value with symbol
 * @param amount The amount to format
 * @param currency The currency symbol
 * @param maxDecimals Maximum number of decimal places to display
 */
export function formatCurrency(
  amount: number | string | null | undefined, 
  currency: string = 'SOL',
  maxDecimals: number = 5
): string {
  // For stablecoins, use 2 decimal places by default unless explicitly specified
  const effectiveDecimals = ['USDC', 'USDT'].includes(currency) && maxDecimals === 5 ? 2 : maxDecimals;
  
  const formattedAmount = formatNumberWithCommas(amount, effectiveDecimals);
  return `${formattedAmount} ${currency}`;
}
