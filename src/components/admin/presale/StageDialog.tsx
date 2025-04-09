import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SimpleEditor } from "./SimpleEditor";

interface StageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingStage: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fetchStages: () => void;
  stagesLength: number;
  activeNetwork: string;
  onSubmit?: (data: any, isEdit: boolean) => Promise<void>;
  existingStages?: any[];
  isEdit?: boolean;
}

export const StageDialog = ({
  isOpen,
  onOpenChange,
  editingStage,
  isLoading,
  setIsLoading,
  fetchStages,
  stagesLength,
  activeNetwork,
  onSubmit,
  existingStages,
  isEdit = false
}: StageDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const [tokenPriceUsd, setTokenPriceUsd] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [order, setOrder] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetAmountUsd, setTargetAmountUsd] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [solanaNetwork, setSolanaNetwork] = useState<string>("devnet");
  const [solPrice, setSolPrice] = useState<number>(0);

  useEffect(() => {
    if (editingStage) {
      setName(editingStage.name || "");
      setDescription(editingStage.description || "");
      setTokenPrice(editingStage.token_price?.toString() || "");
      setTokenPriceUsd(editingStage.token_price_usd?.toString() || "");
      setStartDate(editingStage.start_date ? new Date(editingStage.start_date) : undefined);
      setEndDate(editingStage.end_date ? new Date(editingStage.end_date) : undefined);
      setOrder(editingStage.order_number?.toString() || "");
      setTargetAmount(editingStage.target_amount?.toString() || "");
      setTargetAmountUsd(editingStage.target_amount_usd?.toString() || "");
      setIsPublished(editingStage.is_published !== false);
    } else {
      setName("");
      setDescription("");
      setTokenPrice("");
      setTokenPriceUsd("");
      setStartDate(undefined);
      setEndDate(undefined);
      setOrder((stagesLength + 1).toString());
      setTargetAmount("");
      setTargetAmountUsd("");
      setIsPublished(true);
    }

    setSolanaNetwork(activeNetwork === 'testnet' ? 'devnet' : 'mainnet-beta');
    
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data.solana && data.solana.usd) {
          setSolPrice(data.solana.usd);
        }
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
        setSolPrice(100);
      }
    };

    fetchSolPrice();
  }, [editingStage, stagesLength, isOpen, activeNetwork]);

  useEffect(() => {
    if (solPrice > 0) {
      if (tokenPrice && !tokenPriceUsd) {
        const calculatedUsd = parseFloat(tokenPrice) * solPrice;
        if (!isNaN(calculatedUsd)) {
          setTokenPriceUsd(calculatedUsd.toFixed(6));
        }
      } else if (tokenPriceUsd && !tokenPrice) {
        const calculatedSol = parseFloat(tokenPriceUsd) / solPrice;
        if (!isNaN(calculatedSol)) {
          setTokenPrice(calculatedSol.toFixed(8));
        }
      }
      
      if (targetAmount && !targetAmountUsd) {
        const calculatedTargetUsd = parseFloat(targetAmount) * solPrice;
        if (!isNaN(calculatedTargetUsd)) {
          setTargetAmountUsd(calculatedTargetUsd.toFixed(2));
        }
      } else if (targetAmountUsd && !targetAmount) {
        const calculatedTargetSol = parseFloat(targetAmountUsd) / solPrice;
        if (!isNaN(calculatedTargetSol)) {
          setTargetAmount(calculatedTargetSol.toFixed(4));
        }
      }
    }
  }, [tokenPrice, tokenPriceUsd, targetAmount, targetAmountUsd, solPrice]);

  const handleSave = async () => {
    if (!name || !tokenPrice || !order) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const stageData = {
        name,
        description,
        token_price: parseFloat(tokenPrice),
        token_price_usd: tokenPriceUsd ? parseFloat(tokenPriceUsd) : null,
        start_date: startDate,
        end_date: endDate,
        order_number: parseInt(order),
        target_amount: targetAmount ? parseFloat(targetAmount) : null,
        target_amount_usd: targetAmountUsd ? parseFloat(targetAmountUsd) : null,
        is_published: isPublished,
        network: activeNetwork
      };
      
      if (onSubmit) {
        await onSubmit(stageData, isEdit);
      } else {
        if (editingStage) {
          const { error } = await supabase
            .from('presale_stages')
            .update(stageData)
            .eq('id', editingStage.id);
          
          if (error) throw error;
          
          toast({
            title: "Stage Updated",
            description: "Presale stage has been updated successfully"
          });
        } else {
          const { error } = await supabase
            .from('presale_stages')
            .insert(stageData);
          
          if (error) throw error;
          
          toast({
            title: "Stage Created",
            description: "New presale stage has been created successfully"
          });
        }
        
        onOpenChange(false);
        fetchStages();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save stage: " + error.message,
        variant: "destructive"
      });
      console.error('Save stage error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSolPrice = e.target.value;
    setTokenPrice(newSolPrice);
    
    if (newSolPrice && solPrice > 0) {
      const usdValue = parseFloat(newSolPrice) * solPrice;
      if (!isNaN(usdValue)) {
        setTokenPriceUsd(usdValue.toFixed(6));
      }
    }
  };

  const handleUsdPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsdPrice = e.target.value;
    setTokenPriceUsd(newUsdPrice);
    
    if (newUsdPrice && solPrice > 0) {
      const solValue = parseFloat(newUsdPrice) / solPrice;
      if (!isNaN(solValue)) {
        setTokenPrice(solValue.toFixed(8));
      }
    }
  };
  
  const handleTargetSolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTargetSol = e.target.value;
    setTargetAmount(newTargetSol);
    
    if (newTargetSol && solPrice > 0) {
      const usdValue = parseFloat(newTargetSol) * solPrice;
      if (!isNaN(usdValue)) {
        setTargetAmountUsd(usdValue.toFixed(2));
      }
    }
  };

  const handleTargetUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTargetUsd = e.target.value;
    setTargetAmountUsd(newTargetUsd);
    
    if (newTargetUsd && solPrice > 0) {
      const solValue = parseFloat(newTargetUsd) / solPrice;
      if (!isNaN(solValue)) {
        setTargetAmount(solValue.toFixed(4));
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingStage ? "Edit Presale Stage" : "Create New Presale Stage"}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Seed Round"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <div className="col-span-3">
              <SimpleEditor 
                value={description} 
                onChange={setDescription}
                placeholder="Enter stage description (supports basic HTML formatting)"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tokenPrice" className="text-right flex items-center">
              Token Price (SOL) *
            </Label>
            <div className="col-span-3 space-y-1">
              <div className="relative">
                <Input
                  id="tokenPrice"
                  type="number"
                  value={tokenPrice}
                  onChange={handleSolPriceChange}
                  className="w-full"
                  placeholder="Price in SOL"
                  step="0.0000001"
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <p className="text-xs text-muted-foreground flex items-center">
                  <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                  This is the SOL price per token
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tokenPriceUsd" className="text-right flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-green-500" />
              Token Price (USD)
            </Label>
            <div className="col-span-3 space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <Input
                  id="tokenPriceUsd"
                  type="number"
                  value={tokenPriceUsd}
                  onChange={handleUsdPriceChange}
                  className="w-full pl-8"
                  placeholder="Price in USD"
                  step="0.000001"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                Reference USD price per token (calculated automatically)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetAmount" className="text-right">
              Target (SOL)
            </Label>
            <Input
              id="targetAmount"
              type="number"
              value={targetAmount}
              onChange={handleTargetSolChange}
              className="col-span-3"
              placeholder="Target amount in SOL"
              step="0.01"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetAmountUsd" className="text-right flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-green-500" />
              Target (USD)
            </Label>
            <div className="col-span-3 space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <Input
                  id="targetAmountUsd"
                  type="number"
                  value={targetAmountUsd}
                  onChange={handleTargetUsdChange}
                  className="w-full pl-8"
                  placeholder="Target amount in USD"
                  step="1"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                Target funding amount in USD (displayed to users)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order" className="text-right">
              Order *
            </Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="col-span-3"
              placeholder="Display order"
              min="1"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => 
                      startDate ? date < startDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isPublished" className="text-right">
              Published
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="isPublished"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <span className="text-sm text-gray-500">
                {isPublished ? "Visible to users" : "Hidden from users"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-amber-600">
              Network
            </Label>
            <div className="col-span-3">
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-amber-600">
                  {activeNetwork.charAt(0).toUpperCase() + activeNetwork.slice(1)}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
                  <span>Application: <strong>{activeNetwork}</strong></span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
                  <span>Solana: <strong>{solanaNetwork}</strong></span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will create a stage for the application's {activeNetwork} environment
                  which uses Solana's {solanaNetwork} network.
                </p>
              </div>
            </div>
          </div>
          
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (editingStage ? "Update Stage" : "Create Stage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
