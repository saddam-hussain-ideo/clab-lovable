import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateSiteSetting } from "@/utils/settings/siteSettings";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Types for cryptocurrency data
interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
}

// Popular cryptocurrencies to choose from
const defaultCryptos: CryptoCurrency[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "binancecoin", name: "Binance Coin", symbol: "BNB" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
  { id: "tron", name: "TRON", symbol: "TRX" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
  { id: "uniswap", name: "Uniswap", symbol: "UNI" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC" },
  { id: "polygon", name: "Polygon", symbol: "MATIC" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR" },
  { id: "stellar", name: "Stellar", symbol: "XLM" },
  { id: "internet-computer", name: "Internet Computer", symbol: "ICP" },
  { id: "cosmos", name: "Cosmos", symbol: "ATOM" },
  { id: "monero", name: "Monero", symbol: "XMR" },
  { id: "algorand", name: "Algorand", symbol: "ALGO" },
];

export const CryptoTickerManager = () => {
  const [availableCryptos, setAvailableCryptos] = useState<CryptoCurrency[]>([...defaultCryptos]);
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCryptoId, setNewCryptoId] = useState("");
  const [newCryptoName, setNewCryptoName] = useState("");
  const [newCryptoSymbol, setNewCryptoSymbol] = useState("");
  const [addingCustomCrypto, setAddingCustomCrypto] = useState(false);
  const [bulkAddMode, setBulkAddMode] = useState(false);
  const [bulkCryptoData, setBulkCryptoData] = useState("");
  const [isTickerEnabled, setIsTickerEnabled] = useState(false);
  const { toast } = useToast();

  // Fetch currently selected cryptocurrencies, custom cryptos, and ticker state
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['crypto-ticker-settings'],
    queryFn: async () => {
      // Fetch selected crypto IDs
      const { data: selectedData, error: selectedError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'crypto_ticker_ids')
        .single();
      
      if (selectedError && selectedError.code !== 'PGRST116') {
        throw selectedError;
      }
      
      // Fetch custom added cryptos
      const { data: customData, error: customError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'custom_crypto_list')
        .single();
      
      if (customError && customError.code !== 'PGRST116') {
        throw customError;
      }
      
      // Fetch ticker enabled state
      const { data: tickerEnabledData, error: tickerEnabledError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'crypto_ticker_enabled')
        .single();
      
      // Default to false if no data found
      const isEnabled = tickerEnabledData?.value 
        ? JSON.parse(tickerEnabledData.value) 
        : false;
      
      console.log("Fetched ticker enabled state:", isEnabled);
      
      return {
        selected: selectedData?.value ? JSON.parse(selectedData.value) : [],
        custom: customData?.value ? JSON.parse(customData.value) : [],
        enabled: isEnabled
      };
    },
  });

  // Set selected cryptos and add custom ones to available list when data is loaded
  useEffect(() => {
    if (settings) {
      setSelectedCryptos(settings.selected);
      setIsTickerEnabled(settings.enabled);
      console.log("Applied ticker state from settings:", settings.enabled);
      
      if (settings.custom && settings.custom.length > 0) {
        // Merge default cryptos with custom ones, avoiding duplicates by ID
        const mergedCryptos = [...defaultCryptos];
        settings.custom.forEach((customCrypto: CryptoCurrency) => {
          if (!mergedCryptos.some(crypto => crypto.id === customCrypto.id)) {
            mergedCryptos.push(customCrypto);
          }
        });
        setAvailableCryptos(mergedCryptos);
      }
    }
  }, [settings]);

  const filteredCryptos = availableCryptos.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleCrypto = (cryptoId: string) => {
    setSelectedCryptos(prev => {
      if (prev.includes(cryptoId)) {
        return prev.filter(id => id !== cryptoId);
      } else {
        return [...prev, cryptoId];
      }
    });
  };
  
  const handleToggleTickerEnabled = async () => {
    setIsSubmitting(true);
    const newState = !isTickerEnabled;
    console.log("Toggling ticker state to:", newState);
    
    try {
      const result = await updateSiteSetting('crypto_ticker_enabled', newState);
      
      if (!result.success) {
        throw result.error;
      }
      
      setIsTickerEnabled(newState);
      
      toast({
        title: "Success",
        description: `Crypto ticker has been ${newState ? 'enabled' : 'disabled'}`,
      });
      
      console.log("Ticker state updated successfully");
    } catch (error) {
      console.error('Error updating ticker state:', error);
      toast({
        title: "Error",
        description: "Failed to update crypto ticker state",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomCrypto = async () => {
    if (!newCryptoId.trim() || !newCryptoName.trim() || !newCryptoSymbol.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Validate that the ID doesn't already exist
    if (availableCryptos.some(crypto => crypto.id === newCryptoId.trim())) {
      toast({
        title: "Error",
        description: "A cryptocurrency with this ID already exists",
        variant: "destructive",
      });
      return;
    }

    setAddingCustomCrypto(true);
    
    try {
      // Add to available cryptos
      const newCrypto = {
        id: newCryptoId.trim(), 
        name: newCryptoName.trim(), 
        symbol: newCryptoSymbol.trim()
      };
      
      const updatedAvailableCryptos = [...availableCryptos, newCrypto];
      setAvailableCryptos(updatedAvailableCryptos);
      
      // Add to selected by default
      setSelectedCryptos(prev => [...prev, newCrypto.id]);
      
      // Save custom cryptos to database
      const customCryptos = updatedAvailableCryptos.filter(
        crypto => !defaultCryptos.some(defaultCrypto => defaultCrypto.id === crypto.id)
      );
      
      const result = await updateSiteSetting('custom_crypto_list', customCryptos);
      
      if (!result.success) {
        throw result.error;
      }
      
      toast({
        title: "Success",
        description: `Added ${newCryptoName} to your cryptocurrencies`,
      });
      
      // Reset form
      setNewCryptoId("");
      setNewCryptoName("");
      setNewCryptoSymbol("");
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding custom cryptocurrency:', error);
      toast({
        title: "Error",
        description: "Failed to save custom cryptocurrency",
        variant: "destructive",
      });
    } finally {
      setAddingCustomCrypto(false);
    }
  };

  const handleBulkAddCryptos = async () => {
    if (!bulkCryptoData.trim()) {
      toast({
        title: "Error",
        description: "Please enter cryptocurrency data",
        variant: "destructive",
      });
      return;
    }

    setAddingCustomCrypto(true);
    
    try {
      // Parse the bulk data
      let newCryptos: CryptoCurrency[] = [];
      const lines = bulkCryptoData.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 3) {
          toast({
            title: "Warning",
            description: `Skipped invalid line: ${line}`,
            variant: "destructive",
          });
          continue;
        }
        
        const [id, name, symbol] = parts;
        
        // Skip if already exists
        if (availableCryptos.some(crypto => crypto.id === id)) {
          continue;
        }
        
        newCryptos.push({ id, name, symbol });
      }
      
      if (newCryptos.length === 0) {
        toast({
          title: "Info",
          description: "No new cryptocurrencies to add",
        });
        setBulkCryptoData("");
        setShowAddDialog(false);
        return;
      }
      
      // Add to available cryptos
      const updatedAvailableCryptos = [...availableCryptos, ...newCryptos];
      setAvailableCryptos(updatedAvailableCryptos);
      
      // Add to selected by default
      setSelectedCryptos(prev => [...prev, ...newCryptos.map(crypto => crypto.id)]);
      
      // Save custom cryptos to database
      const customCryptos = updatedAvailableCryptos.filter(
        crypto => !defaultCryptos.some(defaultCrypto => defaultCrypto.id === crypto.id)
      );
      
      const result = await updateSiteSetting('custom_crypto_list', customCryptos);
      
      if (!result.success) {
        throw result.error;
      }
      
      toast({
        title: "Success",
        description: `Added ${newCryptos.length} new cryptocurrencies`,
      });
      
      // Reset form
      setBulkCryptoData("");
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding custom cryptocurrencies:', error);
      toast({
        title: "Error",
        description: "Failed to save custom cryptocurrencies",
        variant: "destructive",
      });
    } finally {
      setAddingCustomCrypto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateSiteSetting('crypto_ticker_ids', selectedCryptos);
      
      if (!result.success) {
        throw result.error;
      }

      toast({
        title: "Success",
        description: "Crypto ticker selections have been saved",
      });
      
      refetch();
    } catch (error) {
      console.error('Error saving crypto ticker selections:', error);
      toast({
        title: "Error",
        description: "Failed to save crypto ticker selections",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCustomCrypto = (cryptoId: string) => {
    return !defaultCryptos.some(crypto => crypto.id === cryptoId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Crypto Ticker Configuration</h2>
        <p className="text-sm text-gray-500">
          Select which cryptocurrencies to display in the scrolling ticker on your site.
        </p>
      </div>
      
      {/* Ticker Enable/Disable Toggle */}
      <div className="flex items-center space-x-2 py-4 border-b border-gray-800">
        <Switch 
          id="ticker-enabled"
          checked={isTickerEnabled}
          onCheckedChange={handleToggleTickerEnabled}
          disabled={isSubmitting}
        />
        <Label htmlFor="ticker-enabled" className="font-medium">
          {isTickerEnabled ? 'Crypto Ticker Enabled' : 'Crypto Ticker Disabled'}
        </Label>
        {isSubmitting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Search className="h-4 w-4 mr-2 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cryptocurrencies..." 
            className="max-w-md"
          />
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)} 
          className="bg-purple-700 hover:bg-purple-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Crypto
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-gray-800 rounded-md">
          <Table>
            <TableHeader className="bg-gray-900">
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>CoinGecko ID</TableHead>
                <TableHead className="w-24">Custom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCryptos.map((crypto) => (
                <TableRow key={crypto.id} className="hover:bg-gray-800">
                  <TableCell>
                    <Checkbox
                      id={`crypto-${crypto.id}`}
                      checked={selectedCryptos.includes(crypto.id)}
                      onCheckedChange={() => handleToggleCrypto(crypto.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Label 
                      htmlFor={`crypto-${crypto.id}`}
                      className="cursor-pointer"
                    >
                      {crypto.name}
                    </Label>
                  </TableCell>
                  <TableCell>{crypto.symbol.toUpperCase()}</TableCell>
                  <TableCell>
                    <code className="px-1 py-0.5 bg-gray-800 rounded text-xs">{crypto.id}</code>
                  </TableCell>
                  <TableCell>
                    {isCustomCrypto(crypto.id) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-100">
                        Custom
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCryptos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No cryptocurrencies found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {selectedCryptos.length} cryptocurrencies selected
          </p>
          <Button type="submit" disabled={isSubmitting} className="bg-purple-700 hover:bg-purple-800">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      {/* Dialog for adding custom cryptocurrencies */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Add Custom Cryptocurrency</DialogTitle>
            <DialogDescription>
              Add cryptocurrencies not in the default list using their CoinGecko IDs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant={bulkAddMode ? "outline" : "default"}
              onClick={() => setBulkAddMode(false)}
              className={!bulkAddMode ? "bg-purple-700" : "border-gray-700"}
            >
              Single Entry
            </Button>
            <Button
              variant={!bulkAddMode ? "outline" : "default"}
              onClick={() => setBulkAddMode(true)}
              className={bulkAddMode ? "bg-purple-700" : "border-gray-700"}
            >
              Bulk Import
            </Button>
          </div>
          
          {!bulkAddMode ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="crypto-id">CoinGecko ID</Label>
                <Input
                  id="crypto-id"
                  placeholder="e.g. filecoin"
                  value={newCryptoId}
                  onChange={(e) => setNewCryptoId(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-400">
                  This is the ID used by CoinGecko API (e.g., "bitcoin", "ethereum").
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="crypto-name">Display Name</Label>
                <Input
                  id="crypto-name"
                  placeholder="e.g. Filecoin"
                  value={newCryptoName}
                  onChange={(e) => setNewCryptoName(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="crypto-symbol">Symbol</Label>
                <Input
                  id="crypto-symbol"
                  placeholder="e.g. FIL"
                  value={newCryptoSymbol}
                  onChange={(e) => setNewCryptoSymbol(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="bulk-crypto-data">
                  Enter one cryptocurrency per line (id,name,symbol)
                </Label>
                <Textarea
                  id="bulk-crypto-data"
                  placeholder="filecoin,Filecoin,FIL&#10;apecoin,ApeCoin,APE&#10;optimism,Optimism,OP"
                  value={bulkCryptoData}
                  onChange={(e) => setBulkCryptoData(e.target.value)}
                  className="min-h-[120px] bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-400">
                  Format: coingecko-id,Display Name,SYMBOL
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button" 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              disabled={addingCustomCrypto}
              onClick={bulkAddMode ? handleBulkAddCryptos : handleAddCustomCrypto}
              className="bg-purple-700 hover:bg-purple-800"
            >
              {addingCustomCrypto ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Cryptocurrency"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
