
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Milestone {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  icon: string;
}

interface MilestoneEditDialogProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (milestone: Milestone) => void;
  index: number;
}

export function MilestoneEditDialog({ milestone, isOpen, onClose, onSave, index }: MilestoneEditDialogProps) {
  const [title, setTitle] = useState(milestone?.title || "");
  const [description, setDescription] = useState(milestone?.description || "");
  const [status, setStatus] = useState<'completed' | 'in-progress' | 'upcoming'>(milestone?.status || "upcoming");
  const [icon, setIcon] = useState(milestone?.icon || "CheckCircle2");
  const { toast } = useToast();

  // Reset form when dialog opens with new milestone
  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description);
      setStatus(milestone.status);
      setIcon(milestone.icon);
    }
  }, [milestone, isOpen]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the milestone",
        variant: "destructive",
      });
      return;
    }

    onSave({
      title,
      description,
      status: status,
      icon
    });

    toast({
      title: "Milestone Updated",
      description: "The milestone has been successfully updated",
    });
    
    onClose();
  };

  // This function handles the status change with proper type casting
  const handleStatusChange = (value: string) => {
    // Validate and cast the string value to our specific union type
    if (value === 'completed' || value === 'in-progress' || value === 'upcoming') {
      setStatus(value);
    }
  };

  // This function handles the icon change
  const handleIconChange = (value: string) => {
    setIcon(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Milestone {index + 1}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icon
            </Label>
            <Select value={icon} onValueChange={handleIconChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CheckCircle2">Check Circle</SelectItem>
                <SelectItem value="Clock">Clock</SelectItem>
                <SelectItem value="Rocket">Rocket</SelectItem>
                <SelectItem value="Target">Target</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
