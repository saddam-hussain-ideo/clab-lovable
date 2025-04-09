
/**
 * A utility function to hide the price display that appears above the progress bar 
 * in the TokenPresale component
 */
export const hideTopPrice = () => {
  try {
    // Use a CSS class selector that targets the price element above the progress bar
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Hide all instances of the price display above progress bar */
      .presale-section-container [class*="presale-price-display"]:first-of-type,
      .presale-section-container .token-price-top,
      .presale-section-container .presale-token-price:first-of-type,
      /* Target Badge with CLAB price near the top */
      .presale-section-container .flex.items-center .badge:first-of-type,
      /* Target any element that might contain the "1 CLAB = $" string near the top */
      .presale-section-container .flex.items-center.gap-1 {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Also try to find and hide the element directly
    setTimeout(() => {
      try {
        // Try different selectors to find the price element
        const priceElements = document.querySelectorAll(
          '[class*="presale-price-display"], .token-price-top, .presale-token-price'
        );
        
        if (priceElements.length > 0) {
          // Hide the first element (which is typically above the progress bar)
          const firstPriceElement = priceElements[0] as HTMLElement;
          if (firstPriceElement) {
            firstPriceElement.style.display = 'none';
            console.log('Successfully hid the price display above progress bar');
          }
          
          // Also try to find any elements containing the price text
          document.querySelectorAll('.badge, .text-xs').forEach(el => {
            const text = el.textContent || '';
            if (text.includes('CLAB =') || text.includes('1 CLAB')) {
              if (el.closest('.progress-container') || el.closest('.items-center')) {
                (el as HTMLElement).style.display = 'none';
                console.log('Hid price badge by text content');
              }
            }
          });
        }
      } catch (error) {
        console.error('Error hiding price elements:', error);
      }
    }, 500);
  } catch (error) {
    console.error('Error in hideTopPrice function:', error);
  }
};
