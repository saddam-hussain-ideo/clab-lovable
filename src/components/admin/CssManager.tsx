
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const CssManager = () => {
  const [customCss, setCustomCss] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomCss = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'custom_css')
          .single();
        
        if (error) throw error;
        if (data) setCustomCss(data.value || "");
      } catch (error) {
        console.error('Error fetching custom CSS:', error);
      }
    };

    fetchCustomCss();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'custom_css', value: customCss }, { onConflict: 'key' });

      if (error) throw error;

      // Apply the CSS changes immediately
      const styleElement = document.getElementById('custom-css') || document.createElement('style');
      styleElement.id = 'custom-css';
      styleElement.textContent = customCss;
      if (!document.getElementById('custom-css')) {
        document.head.appendChild(styleElement);
      }

      toast("Custom CSS has been updated");
    } catch (error) {
      console.error('Error saving custom CSS:', error);
      toast.error("Failed to save custom CSS");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom CSS</CardTitle>
        <CardDescription>Add custom CSS to override the default styles. Changes will be applied immediately.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        <textarea
          className="w-full h-[400px] font-mono text-sm p-4 border rounded-md bg-zinc-900 text-zinc-100 border-zinc-700"
          value={customCss}
          onChange={(e) => setCustomCss(e.target.value)}
          placeholder=":root {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* Add your custom CSS variables here */
}

/* Add your custom styles here */
.my-custom-class {
  background-color: var(--background);
}"
        />
      </CardContent>
    </Card>
  );
};
