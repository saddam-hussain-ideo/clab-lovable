
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const UpdateContributionsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [network, setNetwork] = useState<string>("all");

  const triggerUpdate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('trigger-contribution-updates', {
        body: { network }
      });
      
      if (error) throw error;
      
      setResult(data);
      toast.success(`Successfully processed contributions: ${data?.result?.updated || 0} updated`);
    } catch (error) {
      console.error('Error triggering contribution update:', error);
      toast.error('Failed to update contributions');
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Process Pending Contributions</CardTitle>
        <CardDescription>
          Update pending contributions to confirmed/completed status based on blockchain verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Network</div>
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Networks</SelectItem>
              <SelectItem value="mainnet">Mainnet</SelectItem>
              <SelectItem value="testnet">Testnet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {result && (
          <div className="mt-4 p-4 bg-zinc-800 rounded-md overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={triggerUpdate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Contributions
            </>
          ) : (
            "Update Pending Contributions"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
