import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { deletePresaleStage } from "@/utils/presale/solanaPresale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeleteStageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingStage: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fetchStages: () => void;
  onDelete?: () => Promise<void>;
}

export const DeleteStageDialog = ({
  isOpen,
  onOpenChange,
  editingStage,
  isLoading,
  setIsLoading,
  fetchStages,
  onDelete
}: DeleteStageDialogProps) => {
  const deleteStage = async () => {
    if (!editingStage) return;
    
    try {
      setIsLoading(true);
      
      if (onDelete) {
        await onDelete();
      } else {
        const result = await deletePresaleStage(editingStage.id);
        
        if (result.success) {
          toast({
            title: "Stage Deleted",
            description: "Presale stage successfully deleted"
          });
          
          onOpenChange(false);
          fetchStages();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete stage",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Presale Stage</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the "{editingStage?.name}" stage? 
            This action cannot be undone if the stage has existing contributions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={deleteStage} 
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Stage'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
