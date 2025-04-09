
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Upload, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const DocumentUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [buttonTitle, setButtonTitle] = useState("View Document");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    console.log("CLAB Documents Manager component mounted");
    fetchCurrentDocument();
  }, []);

  const fetchCurrentDocument = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching document data from clab_documents table");
      const { data, error } = await supabase
        .from("clab_documents")
        .select("*")
        .eq("document_type", "main")
        .maybeSingle();

      if (error) {
        console.error("Error fetching document:", error);
        toast.error("Failed to load document information");
        return;
      }

      console.log("Document data retrieved:", data);
      if (data) {
        setButtonTitle(data.button_title || "View Document");
        setFileUrl(data.file_path);
        setFileName(data.file_name);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred while loading document data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check if file is a PDF
      if (selectedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    if (!buttonTitle.trim()) {
      toast.error("Please provide a button title");
      return;
    }

    try {
      setIsUploading(true);
      
      // Get session to confirm user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("You must be signed in to upload documents");
        setIsUploading(false);
        return;
      }
      
      // If there's an existing file, delete it first
      if (fileUrl) {
        const oldFilePath = fileUrl.split('/').pop();
        if (oldFilePath) {
          console.log("Removing old file:", oldFilePath);
          await supabase.storage.from('documents').remove([oldFilePath]);
          // Silently continue even if there's an error - old file might not exist
        }
      }
      
      // Upload file to Storage bucket
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `document_${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log("Uploading file:", filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        if (uploadError.message.includes("bucket") || uploadError.message.includes("not found")) {
          toast.error("Document storage is not configured correctly. Please contact an administrator.");
        } else if (uploadError.message.includes("row-level security")) {
          toast.error("You don't have permission to upload files. Please contact an administrator.");
        } else {
          toast.error(`Upload failed: ${uploadError.message}`);
        }
        throw uploadError;
      }
      
      if (!uploadData) {
        throw new Error("Upload failed: No data returned from upload");
      }
      
      console.log("File uploaded successfully:", uploadData);
      
      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get public URL for the uploaded file");
      }
      
      const publicUrl = urlData.publicUrl;
      console.log("File public URL:", publicUrl);
      
      // Check if a record exists first
      const { data: existingData } = await supabase
        .from("clab_documents")
        .select("id")
        .eq("document_type", "main")
        .maybeSingle();
      
      let dbResult;
      
      if (existingData) {
        // Update existing record
        console.log("Updating existing document record");
        dbResult = await supabase
          .from("clab_documents")
          .update({
            button_title: buttonTitle,
            file_path: publicUrl,
            file_name: file.name
          })
          .eq("document_type", "main")
          .select()
          .single();
      } else {
        // Insert new record
        console.log("Creating new document record");
        dbResult = await supabase
          .from("clab_documents")
          .insert({
            document_type: "main",
            button_title: buttonTitle,
            file_path: publicUrl,
            file_name: file.name
          })
          .select()
          .single();
      }
      
      if (dbResult.error) {
        console.error("Error updating document record:", dbResult.error);
        throw dbResult.error;
      }
      
      setFileUrl(publicUrl);
      setFileName(file.name);
      setFile(null);
      
      toast.success("Document uploaded successfully");
      
      // Reset file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDocument = async () => {
    if (!fileUrl) return;
    
    try {
      setIsUploading(true);
      
      // Delete file from storage
      const oldFilePath = fileUrl.split('/').pop();
      if (oldFilePath) {
        console.log("Removing file:", oldFilePath);
        const { error: removeError } = await supabase.storage.from('documents').remove([oldFilePath]);
        if (removeError) {
          console.error("Error removing file:", removeError);
          if (removeError.message.includes("bucket") || removeError.message.includes("not found")) {
            toast.error("Document storage is not configured correctly. Please contact an administrator.");
            throw removeError;
          }
        }
      }
      
      // Update record
      console.log("Updating document record");
      const { error: updateError } = await supabase
        .from("clab_documents")
        .update({
          file_path: null,
          file_name: null
        })
        .eq("document_type", "main");
      
      if (updateError) {
        console.error("Error updating document record:", updateError);
        throw updateError;
      }
      
      setFileUrl(null);
      setFileName(null);
      
      toast.success("Document removed successfully");
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error(`Failed to remove document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CLAB Document Manager</CardTitle>
        <CardDescription>
          Upload a PDF document and customize the button that will be displayed on the site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="button-title">Button Text</Label>
          <Input
            id="button-title"
            value={buttonTitle}
            onChange={(e) => setButtonTitle(e.target.value)}
            placeholder="e.g., View Whitepaper, Download Document"
          />
        </div>

        {fileUrl && (
          <div className="p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Current document</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(fileUrl, "_blank")}
                >
                  View
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveDocument}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="document-upload">Upload Document (PDF only, max 10MB)</Label>
          <Input
            id="document-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
