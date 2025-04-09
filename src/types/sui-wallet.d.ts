
interface SuiWallet {
  hasPermissions?: () => Promise<boolean>;
  requestPermissions?: () => Promise<void>;
  getAccounts?: () => Promise<string[]>;
  requestAccounts?: () => Promise<string[]>;
  disconnect?: () => Promise<void>;
}

interface Window {
  suiWallet?: SuiWallet;
}
