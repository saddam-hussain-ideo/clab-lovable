
// Define the StacksProvider interface for use with Stacks wallets
export interface StacksProvider {
  connect: () => Promise<string>; 
  disconnect: () => Promise<void>;
  getAddress?: () => Promise<string>;
  signMessage?: (message: string) => Promise<string>;
  // Add other methods as needed
}

// Don't redeclare the interface in the global namespace
// Instead, just declare that we're using the type
declare global {
  interface Window {
    // Use optional property with the interface we defined above
    StacksProvider?: StacksProvider;
  }
}

// Export the type for use elsewhere in the app
export type { StacksProvider };
