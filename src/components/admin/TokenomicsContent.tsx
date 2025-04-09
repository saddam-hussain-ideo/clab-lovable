import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function AdminTokenomicsContent() {
  const [state, setState] = useState<'loading' | 'error' | 'success' | 'empty'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tokenomicsData, setTokenomicsData] = useState<any>(null);
  const { toast } = useToast();

  const fetchTokenomicsData = async () => {
    try {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_id", "tokenomics")
        .eq("section_id", "tokenomics")
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setTokenomicsData(data);
        setState('success');
      } else {
        setState('empty');
      }
    } catch (err: any) {
      console.error("Error fetching tokenomics data:", err);
      setError(err.message || "Failed to load tokenomics data");
      setState('error');
      toast({
        title: "Error",
        description: "Failed to load tokenomics data. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTokenomicsData();
  }, []); // Only run on initial mount

  const content = useMemo(() => {
    switch (state) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading tokenomics data...</p>
          </div>
        );
      case 'error':
        return (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-6 my-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive">Error loading tokenomics data</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={fetchTokenomicsData}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        );
      case 'success':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tokenomics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                  {JSON.stringify(tokenomicsData.content, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        );
      case 'empty':
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tokenomics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No tokenomics data found. Please create a new configuration.</p>
            </CardContent>
          </Card>
        );
    }
  }, [state, tokenomicsData, error, fetchTokenomicsData]);

  return content;
}
