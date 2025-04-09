import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WaitlistSignupForm } from './WaitlistSignupForm';
interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  open,
  onOpenChange
}) => {
  const [formSuccess, setFormSuccess] = useState(false);
  const handleSuccess = () => {
    setFormSuccess(true);
    // Only close the dialog after some time if we don't show the success state
    setTimeout(() => {
      // Don't close automatically to give users a chance to share
      // onOpenChange(false);
    }, 5000);
  };

  // Reset form success state when the modal is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFormSuccess(false);
    }
    onOpenChange(isOpen);
  };
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md md:max-w-lg">
        <DialogHeader className="flex flex-col items-center">
          
          
          {!formSuccess && <DialogDescription className="text-gray-400">
              Be among the first to experience the future of spending crypto with our revolutionary DEFI Card.
              Fill out the form below to secure your spot on the waitlist.
            </DialogDescription>}
        </DialogHeader>
        
        <WaitlistSignupForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>;
};