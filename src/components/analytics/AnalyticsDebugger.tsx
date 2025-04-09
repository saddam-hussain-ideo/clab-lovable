
import React, { useState, useEffect } from 'react';
import { getAnalyticsHistory, testAnalyticsTracking, isAnalyticsLoaded } from '@/utils/analytics';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalyticsDebuggerProps {
  measurementId: string;
}

export const AnalyticsDebugger: React.FC<AnalyticsDebuggerProps> = ({ measurementId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    // Only run in development
    if (!isDevelopment) return;
    
    const checkStatus = () => {
      setIsLoaded(isAnalyticsLoaded());
      setHistory(getAnalyticsHistory());
    };
    
    checkStatus();
    
    // Update history every 2 seconds
    const interval = setInterval(checkStatus, 2000);
    
    return () => clearInterval(interval);
  }, [isDevelopment]);
  
  const handleTestEvent = () => {
    const success = testAnalyticsTracking();
    setIsLoaded(success);
    setTimeout(() => setHistory(getAnalyticsHistory()), 100);
  };
  
  // Don't render in production
  if (!isDevelopment) return null;
  
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          📊 Analytics Debug
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Analytics Debugger</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              X
            </Button>
          </div>
          <CardDescription>
            Measurement ID: {measurementId}
            <Badge variant={isLoaded ? "success" : "destructive"} className="ml-2">
              {isLoaded ? "Loaded" : "Not Loaded"}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <ScrollArea className="h-60 rounded-md border p-2">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No events tracked yet</div>
            ) : (
              history.map((event, index) => (
                <div 
                  key={index} 
                  className="mb-2 pb-2 border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium">{event.eventName}</div>
                  {event.eventParams && (
                    <pre className="text-xs mt-1 bg-gray-50 p-1 rounded">
                      {JSON.stringify(event.eventParams, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTestEvent} size="sm" className="w-full">
            Send Test Event
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
