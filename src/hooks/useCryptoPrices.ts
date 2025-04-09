
// A comprehensive useCryptoPrices hook that provides both the prices object
// and a getPrice function for backward compatibility

export const useCryptoPrices = (cryptos: string[] = [], forceUseMock: boolean = true) => {
  // Fixed mock prices to avoid fluctuations and console logs
  const fixedPrices = {
    ethereum: 2200,
    solana: 120,
    bitcoin: 42000,
    // add other needed coins with static values
  };

  const isLoading = false;
  const error = null;

  // Create a prices object from the crypto list
  const prices = cryptos.reduce((acc, crypto) => {
    acc[crypto] = fixedPrices[crypto] || 1; // Default to 1 if crypto not in our list
    return acc;
  }, {} as Record<string, number>);

  // Add a getPrice function for backward compatibility
  const getPrice = (crypto: string): number => {
    return fixedPrices[crypto.toLowerCase()] || 1; // Default to 1 if crypto not in our list
  };

  return {
    prices,
    isLoading,
    error,
    refetch: () => Promise.resolve({ data: fixedPrices }),
    getPrice,
  };
};

export default useCryptoPrices;
