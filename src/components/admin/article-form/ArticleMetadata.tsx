
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";

const CATEGORIES = [
  "AI",
  "Bitcoin",
  "Ethereum",
  "NFT",
  "Memecoins",
  "Altcoins",
  "Utility Coins",
  "Sponsored",
  "Cryptocurrency",
  "Defi",
  "Web3"
] as const;

interface ArticleMetadataProps {
  title: string;
  date: string;
  category: string;
  author: string;
  onChange: (data: { [key: string]: string }) => void;
  isSubmitting: boolean;
}

export const ArticleMetadata = ({ 
  title,
  date,
  category,
  author,
  onChange,
  isSubmitting
}: ArticleMetadataProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date ? new Date(date) : undefined);

  // Update selected date when prop changes
  useEffect(() => {
    if (date) {
      setSelectedDate(new Date(date));
    }
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    setSelectedDate(newDate);
    
    // Format the date as YYYY-MM-DD for database compatibility
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('Selected new date:', newDate);
    console.log('Formatted new date for database:', formattedDate);
    
    onChange({ date: formattedDate });
    setIsCalendarOpen(false);
  };

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    console.log('Manual date input:', inputDate);
    
    // Update the selected date for the calendar
    if (inputDate) {
      setSelectedDate(new Date(inputDate));
    } else {
      setSelectedDate(undefined);
    }
    
    // Pass the date string directly to onChange
    onChange({ date: inputDate });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Title</label>
        <Input
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          required
          disabled={isSubmitting}
          className="text-foreground bg-secondary border-border"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <label className="block text-sm font-medium text-foreground">Publication Date</label>
          
          {/* Manual date input */}
          <Input
            type="date"
            value={date}
            onChange={handleManualDateChange}
            disabled={isSubmitting}
            className="text-foreground bg-secondary border-border mb-2"
          />
          
          {/* Calendar picker */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal text-foreground bg-secondary"
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Pick from calendar</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isSubmitting}
                initialFocus
                className="rounded-md border-none text-foreground"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2 text-foreground">Category</label>
          <Select
            value={category}
            onValueChange={(value) => onChange({ category: value })}
            disabled={isSubmitting}
          >
            <SelectTrigger className="text-foreground bg-secondary border-border">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground">
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} className="text-foreground">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Author</label>
        <Input
          value={author}
          onChange={(e) => onChange({ author: e.target.value })}
          required
          disabled={isSubmitting}
          className="text-foreground bg-secondary border-border"
        />
      </div>
    </div>
  );
};
