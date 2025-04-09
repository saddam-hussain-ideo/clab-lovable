
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizQuestionManager } from "./quiz/QuizQuestionManager";
import { QuizSettingsManager } from "./quiz/QuizSettingsManager";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

export const QuizManager = () => {
  const [activeTab, setActiveTab] = useState<string>("questions");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check database structure on component mount
  useEffect(() => {
    const checkDbStructure = async () => {
      setIsLoading(true);
      try {
        // Check if the quiz_questions table exists with category field
        const { error: tableError } = await supabase
          .from('quiz_questions')
          .select('category')
          .limit(1);
          
        if (tableError) {
          console.error("Error checking quiz_questions table:", tableError);
          setError("Quiz questions table might not be set up correctly.");
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Error checking database structure:", err);
        setError("Could not verify database structure. Please check Supabase configuration.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkDbStructure();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Quiz Management</h2>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="questions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions">Quiz Questions</TabsTrigger>
          <TabsTrigger value="settings">Premium Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="space-y-4 mt-4">
          <QuizQuestionManager />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 mt-4">
          <QuizSettingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
