
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserFilter } from "@/hooks/useUserManager";
import { Badge } from "@/components/ui/badge";

interface UserFilterProps {
  activeFilter: UserFilter;
  onFilterChange: (filter: UserFilter) => void;
  premiumCount?: number;
  adminCount?: number;
  defiWaitlistCount?: number;
}

export const UserFilterSelect = ({ 
  activeFilter, 
  onFilterChange, 
  premiumCount, 
  adminCount,
  defiWaitlistCount 
}: UserFilterProps) => {
  return (
    <div className="flex gap-2 items-center">
      <Select value={activeFilter} onValueChange={(value) => onFilterChange(value as UserFilter)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          <SelectItem value="premium">
            <span className="flex items-center gap-2">
              Premium Users
              {premiumCount !== undefined && (
                <Badge variant="outline" className="ml-2">
                  {premiumCount}
                </Badge>
              )}
            </span>
          </SelectItem>
          <SelectItem value="admin">
            <span className="flex items-center gap-2">
              Admin Users
              {adminCount !== undefined && (
                <Badge variant="outline" className="ml-2">
                  {adminCount}
                </Badge>
              )}
            </span>
          </SelectItem>
          <SelectItem value="defi-waitlist">
            <span className="flex items-center gap-2">
              DeFi Waitlist
              {defiWaitlistCount !== undefined && (
                <Badge variant="outline" className="ml-2">
                  {defiWaitlistCount}
                </Badge>
              )}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
