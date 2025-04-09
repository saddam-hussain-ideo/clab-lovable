
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Filter, Download } from "lucide-react";
import { UserSearch } from "./user-manager/UserSearch";
import { UserDetail } from "./user-manager/UserDetail";
import { UsersTable } from "./user-manager/UsersTable";
import { UserPagination } from "./user-manager/UserPagination";
import { useUserManager, EnhancedUser } from "@/hooks/useUserManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserFilterSelect } from "./user-manager/UserFilter";
import { downloadCSV } from "@/utils/csvExport";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const UserManager = () => {
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { 
    users, 
    page, 
    setPage, 
    totalPages, 
    loadingUsers, 
    refreshUsers,
    activeFilter,
    setActiveFilter,
    filterCounts
  } = useUserManager();

  // Listen for admin status changes
  useEffect(() => {
    const handleAdminStatusChanged = () => {
      console.log("Admin status change detected in UserManager");
      refreshUsers();
    };
    
    window.addEventListener('admin_status_changed', handleAdminStatusChanged);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_status_changed') {
        console.log("Storage event for admin status detected in UserManager");
        refreshUsers();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('admin_status_changed', handleAdminStatusChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshUsers]);

  const handleUserFound = (user: EnhancedUser) => {
    setSelectedUser(user);
  };

  const handleUserUpdated = () => {
    refreshUsers();
    if (selectedUser) {
      // Update the local state of the selected user
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    }
  };

  const exportAllUsers = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing users export...");

      // Query all users depending on the active filter
      let query = supabase.from('profiles').select('*');
      
      if (activeFilter === 'premium') {
        query = query.filter('id', 'in', 
          supabase.from('premium_subscriptions')
            .select('user_id')
            .or('expires_at.is.null,expires_at.gt.now()')
            .then(res => res.data?.map(item => item.user_id) || [])
        );
      } else if (activeFilter === 'admin') {
        query = query.filter('id', 'in',
          supabase.from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
            .then(res => res.data?.map(item => item.user_id) || [])
        );
      }
      
      // For defi waitlist, use a different table
      if (activeFilter === 'defi-waitlist') {
        const { data: defiData, error } = await supabase
          .from('defi_card_waitlist')
          .select('*');
          
        if (error) throw error;
        
        // Transform data and export
        const exportData = defiData.map(entry => ({
          name: entry.name || '',
          email: entry.email,
          discord: entry.discord || '',
          twitter: entry.twitter || '',
          telegram: entry.telegram || '',
          created_at: new Date(entry.created_at).toISOString()
        }));
        
        const headers = {
          name: 'Name',
          email: 'Email',
          discord: 'Discord',
          twitter: 'Twitter',
          telegram: 'Telegram',
          created_at: 'Signed Up'
        };
        
        downloadCSV(exportData, `defi-waitlist-${new Date().toISOString().split('T')[0]}.csv`, headers);
        toast.success("DeFi waitlist export complete!");
        setIsExporting(false);
        return;
      }
      
      // For regular users, continue with the query
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.warning("No users found to export");
        setIsExporting(false);
        return;
      }
      
      // Get admin statuses and premium statuses for these users
      const userIds = data.map(user => user.id);
      
      const [rolesRes, premiumRes] = await Promise.all([
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('premium_subscriptions').select('user_id, expires_at').in('user_id', userIds)
      ]);
      
      // Transform data for export
      const exportData = data.map(user => {
        const isAdmin = rolesRes.data?.some(role => role.user_id === user.id && role.role === 'admin') || false;
        const premiumSub = premiumRes.data?.find(sub => sub.user_id === user.id);
        const isPremium = premiumSub && (!premiumSub.expires_at || new Date(premiumSub.expires_at) > new Date());
        
        return {
          id: user.id,
          username: user.username || '',
          email: user.email || '',
          wallet_address: user.wallet_address || '',
          isAdmin: isAdmin ? 'Yes' : 'No',
          isPremium: isPremium ? 'Yes' : 'No',
          created_at: new Date(user.created_at).toISOString(),
          points: user.points || 0
        };
      });
      
      const headers = {
        id: 'User ID',
        username: 'Username',
        email: 'Email',
        wallet_address: 'Wallet Address',
        isAdmin: 'Admin',
        isPremium: 'Premium',
        created_at: 'Created At',
        points: 'Points'
      };
      
      // Generate filename based on active filter
      const filename = `users-${activeFilter}-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(exportData, filename, headers);
      toast.success("Users export complete!");
    } catch (error: any) {
      console.error("Error exporting users:", error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 admin-dark-text">
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Limited Functionality Notice</AlertTitle>
        <AlertDescription>
          The user management functionality is limited because the current user doesn't have access to Supabase Auth Admin API. 
          Email verification status cannot be displayed or modified. Please use the Supabase dashboard for these operations.
        </AlertDescription>
      </Alert>
      
      <Alert variant="info" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Admin Access Note</AlertTitle>
        <AlertDescription>
          When you make a user an admin, they will need to sign out and sign back in 
          for the new permissions to take effect.
        </AlertDescription>
      </Alert>
      
      <UserSearch onUserFound={handleUserFound} />
      
      {selectedUser && (
        <div className="mt-6 p-4 border rounded-lg bg-secondary">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{selectedUser.email}</h3>
              <p className="text-sm text-gray-300">ID: {selectedUser.id}</p>
              <div className="space-y-1 mt-2">
                <p className="text-sm">
                  <span className="font-medium">Admin Status:</span>{" "}
                  <span className={`${selectedUser.isAdmin ? 'text-blue-500' : 'text-gray-400'}`}>
                    {selectedUser.isAdmin ? 'Admin' : 'Regular User'}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Premium Status:</span>{" "}
                  <span className={`${selectedUser.isPremium ? 'text-green-500' : 'text-gray-400'}`}>
                    {selectedUser.isPremium ? 'Premium Subscriber' : 'Free User'}
                  </span>
                </p>
                {selectedUser.defiWaitlist && (
                  <p className="text-sm">
                    <span className="font-medium">DeFi Waitlist:</span>{" "}
                    <span className="text-emerald-500">Subscribed</span>
                  </p>
                )}
              </div>
            </div>
            <UserDetail user={selectedUser} onUserUpdated={handleUserUpdated} />
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Users</CardTitle>
          <div className="flex items-center gap-2">
            <UserFilterSelect 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter} 
              premiumCount={filterCounts.premium}
              adminCount={filterCounts.admin}
              defiWaitlistCount={filterCounts.defiWaitlist}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportAllUsers} 
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={refreshUsers} disabled={loadingUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UsersTable 
            users={users} 
            loadingUsers={loadingUsers} 
            onAdminStatusChange={refreshUsers} 
            activeFilter={activeFilter}
          />

          {/* Pagination */}
          <UserPagination 
            page={page} 
            totalPages={totalPages} 
            setPage={setPage} 
          />
        </CardContent>
      </Card>
    </div>
  );
};
