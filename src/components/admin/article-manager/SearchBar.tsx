
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SearchBar = ({ searchTerm, onSearch }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="search"
        placeholder="Search articles by title, excerpt, category, or author..."
        value={searchTerm}
        onChange={onSearch}
        className="pl-10 bg-secondary text-foreground border-border"
      />
    </div>
  );
};
