
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryFilter = ({ 
  categories,
  selectedCategory, 
  onSelectCategory 
}: CategoryFilterProps) => {
  // Handle category selection from dropdown
  const handleCategoryChange = (value: string) => {
    // If "all" is selected, set to null to show all categories
    onSelectCategory(value === "all" ? null : value);
  };

  // Handle clearing the selected category filter
  const handleClearFilter = () => {
    onSelectCategory(null);
  };

  return (
    <div className="mb-8 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-64">
          <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-white/20">
              <SelectItem value="all" className="text-white hover:bg-white/10">
                All Categories
              </SelectItem>
              {categories.map(category => (
                <SelectItem 
                  key={category} 
                  value={category}
                  className="text-white hover:bg-white/10"
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && (
          <div className="flex items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-500/30 text-emerald-400">
              <span className="text-sm">Filtering: {selectedCategory}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 text-emerald-400 hover:text-white hover:bg-emerald-800"
                onClick={handleClearFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
