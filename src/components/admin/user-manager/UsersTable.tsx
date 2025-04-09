
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnhancedUser, UserFilter } from "@/hooks/useUserManager";
import { supabase } from "@/lib/supabase";
import { UserCircle, ShieldCheck, Crown, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UsersTableProps {
  users: EnhancedUser[];
  loadingUsers: boolean;
  onAdminStatusChange: () => void;
  activeFilter?: UserFilter;
}

export const UsersTable = ({ users, loadingUsers, onAdminStatusChange, activeFilter }: UsersTableProps) => {
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const toggleAdminStatus = async (user: EnhancedUser) => {
    try {
      setProcessingUserId(user.id);
      
      if (user.isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', 'admin');
        
        if (error) throw error;
        
        toast.success("Admin role removed");
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'admin'
          });
        
        if (error) throw error;
        
        toast.success("Admin role added");
      }
      
      // Notify other parts of the application that admin status has changed
      localStorage.setItem('admin_status_changed', new Date().toISOString());
      window.dispatchEvent(new CustomEvent('admin_status_changed'));
      
      // Refresh the users list
      onAdminStatusChange();
    } catch (error: any) {
      console.error("Error updating admin status:", error);
      toast.error(`Failed to update admin status: ${error.message}`);
    } finally {
      setProcessingUserId(null);
    }
  };

  if (loadingUsers) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
        <p className="mt-2">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-2 text-left">User</th>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Status</th>
            {activeFilter === 'defi-waitlist' && (
              <th className="px-4 py-2 text-left">Social</th>
            )}
            <th className="px-4 py-2 text-left">Created</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-secondary">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username || user.email || 'User'} 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-8 w-8 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">{user.username || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-xs text-muted-foreground">
                {user.id.substring(0, 8)}...
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  {user.isAdmin && (
                    <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {user.isPremium && (
                    <Badge variant="outline" className="bg-amber-900/20 text-amber-400 border-amber-800">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {user.defiWaitlist && (
                    <Badge variant="outline" className="bg-emerald-900/20 text-emerald-400 border-emerald-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      DeFi
                    </Badge>
                  )}
                </div>
              </td>
              {activeFilter === 'defi-waitlist' && (
                <td className="px-4 py-4 text-xs">
                  <div className="space-y-1">
                    {user.defiWaitlist?.twitter && (
                      <div>Twitter: {user.defiWaitlist.twitter}</div>
                    )}
                    {user.defiWaitlist?.discord && (
                      <div>Discord: {user.defiWaitlist.discord}</div>
                    )}
                    {user.defiWaitlist?.telegram && (
                      <div>Telegram: {user.defiWaitlist.telegram}</div>
                    )}
                    {!user.defiWaitlist?.twitter && !user.defiWaitlist?.discord && !user.defiWaitlist?.telegram && '-'}
                  </div>
                </td>
              )}
              <td className="px-4 py-4 text-xs text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-center">
                {!user.defiWaitlist && ( // Only show admin toggle for regular users, not for defi waitlist entries
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAdminStatus(user)}
                    disabled={processingUserId === user.id}
                  >
                    {processingUserId === user.id ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : user.isAdmin ? (
                      "Remove Admin"
                    ) : (
                      "Make Admin"
                    )}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
