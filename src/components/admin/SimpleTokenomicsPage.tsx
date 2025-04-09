import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function SimpleTokenomicsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: tokenomicsData, error } = await supabase
          .from("page_content")
          .select("*")
          .eq("page_id", "tokenomics")
          .eq("section_id", "tokenomics")
          .maybeSingle();

        if (error) throw error;
        
        // Handle the case where content is an object with specific structure
        if (tokenomicsData && tokenomicsData.content) {
          const content = tokenomicsData.content;
          // Convert object to array of key-value pairs for rendering
          const contentArray = Object.entries(content).map(([key, value]) => ({
            title: key,
            value: typeof value === 'object' ? JSON.stringify(value, null, 2) : value
          }));
          setData(contentArray);
        } else {
          setData([]);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load tokenomics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tokenomics data...</p>
      </div>
    );
  }

  if (error) {
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
              onClick={() => setIsLoading(true)}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokenomics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item: any, index: number) => (
            <div key={index} className="space-y-2">
              <h4 className="font-medium">{item.title}</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {typeof item.value === 'string' ? item.value : JSON.stringify(item.value, null, 2)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
