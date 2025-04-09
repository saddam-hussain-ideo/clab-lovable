
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, Trash, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const WhitepaperUpload = () => {
  const [buttonTitle, setButtonTitle] = useState("View Whitepaper");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ path: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<number | null>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWhitepaperSettings();
  }, []);

  const fetchWhitepaperSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("whitepaper_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setButtonTitle(data.button_title || "View Whitepaper");
        setSettingsId(data.id);
        if (data.file_path && data.file_name) {
          setCurrentFile({
            path: data.file_path,
            name: data.file_name,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching whitepaper settings:", error);
      setError("Failed to load whitepaper settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const uploadWhitepaper = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);

      // Delete previous file if exists
      if (currentFile?.path) {
        await supabase.storage.from("whitepapers").remove([currentFile.path.split("/").pop() || ""]);
      }

      // Upload new file
      const fileName = `whitepaper-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("whitepapers")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("whitepapers")
        .getPublicUrl(fileName);

      // Update settings
      const { error: updateError } = await supabase
        .from("whitepaper_settings")
        .update({
          button_title: buttonTitle,
          file_path: publicUrl.publicUrl,
          file_name: selectedFile.name
        })
        .eq("id", settingsId || 1);

      if (updateError) throw updateError;

      setCurrentFile({
        path: publicUrl.publicUrl,
        name: selectedFile.name
      });
      setSelectedFile(null);
      toast.success("Whitepaper uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading whitepaper:", error);
      setError(error.message || "Failed to upload whitepaper");
      toast.error("Failed to upload whitepaper");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteWhitepaper = async () => {
    if (!currentFile?.path) return;

    try {
      setIsUploading(true);
      
      // Extract filename from path
      const fileName = currentFile.path.split("/").pop();
      
      if (fileName) {
        // Delete file from storage
        const { error: deleteError } = await supabase.storage
          .from("whitepapers")
          .remove([fileName]);

        if (deleteError) throw deleteError;
      }

      // Update settings
      const { error: updateError } = await supabase
        .from("whitepaper_settings")
        .update({
          file_path: null,
          file_name: null
        })
        .eq("id", settingsId || 1);

      if (updateError) throw updateError;

      setCurrentFile(null);
      toast.success("Whitepaper deleted successfully");
    } catch (error: any) {
      console.error("Error deleting whitepaper:", error);
      setError(error.message || "Failed to delete whitepaper");
      toast.error("Failed to delete whitepaper");
    } finally {
      setIsUploading(false);
    }
  };

  const saveButtonTitle = async () => {
    try {
      setIsUploading(true);
      
      const { error } = await supabase
        .from("whitepaper_settings")
        .update({ button_title: buttonTitle })
        .eq("id", settingsId || 1);

      if (error) throw error;
      
      toast.success("Button title updated successfully");
    } catch (error: any) {
      console.error("Error updating button title:", error);
      setError(error.message || "Failed to update button title");
      toast.error("Failed to update button title");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Whitepaper Management
            <FileText className="ml-2 h-5 w-5 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Whitepaper Management
          <FileText className="ml-2 h-5 w-5 text-blue-500" />
        </CardTitle>
        <CardDescription>Upload and manage the whitepaper PDF for the website</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="button-title">Button Text</Label>
            <div className="flex gap-2">
              <Input
                id="button-title"
                value={buttonTitle}
                onChange={(e) => setButtonTitle(e.target.value)}
                placeholder="View Whitepaper"
              />
              <Button onClick={saveButtonTitle} disabled={isUploading}>Save</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whitepaper-upload">Whitepaper PDF</Label>
            <div className="flex flex-col gap-4">
              {currentFile && (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">{currentFile.name}</span>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={deleteWhitepaper}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  id="whitepaper-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              
              {selectedFile && (
                <Button 
                  onClick={uploadWhitepaper} 
                  disabled={isUploading}
                  className="w-fit"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Whitepaper
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
