
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Define the types for auth user data
interface AuthUser {
  id: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface AuthResponse {
  users: AuthUser[];
}

// Define the type for combined user data
export interface EnhancedUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
  isPremium: boolean;
  emailConfirmed: boolean;
  lastSignIn: string | null;
  created_at: string;
  wallet_address: string | null;
  username: string | null;
  avatar_url: string | null; // Added this property
  points: number;
  defiWaitlist?: {
    name: string | null;
    email: string;
    discord: string | null;
    twitter: string | null;
    telegram: string | null;
  } | null;
  // Include other profile fields as needed
}

export type UserFilter = 'all' | 'premium' | 'admin' | 'defi-waitlist';

export const useUserManager = () => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');
  const [filterCounts, setFilterCounts] = useState<{
    premium: number;
    admin: number;
    defiWaitlist: number;
  }>({ premium: 0, admin: 0, defiWaitlist: 0 });
  const { toast } = useToast();
  const pageSize = 10;

  // Listen for premium status changes via localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | Event) => {
      if (e instanceof StorageEvent && e.key === 'force_premium_check') {
        console.log("Premium status change detected, refreshing users");
        refreshUsers();
      } else if (!(e instanceof StorageEvent) && localStorage.getItem('force_premium_check')) {
        // This handles the custom dispatched event
        console.log("Internal premium status change detected, refreshing users");
        refreshUsers();
        localStorage.removeItem('force_premium_check');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('premiumStatusChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('premiumStatusChange', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchFilterCounts();
  }, [page, refreshTrigger, activeFilter]);

  const fetchFilterCounts = async () => {
    try {
      // Get premium count
      const { count: premiumCount } = await supabase
        .from('premium_subscriptions')
        .select('*', { count: 'exact', head: true })
        .or('expires_at.is.null,expires_at.gt.now()');
      
      // Get admin count
      const { count: adminCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      
      // Get defi waitlist count
      const { count: defiWaitlistCount } = await supabase
        .from('defi_card_waitlist')
        .select('*', { count: 'exact', head: true });
      
      setFilterCounts({
        premium: premiumCount || 0,
        admin: adminCount || 0,
        defiWaitlist: defiWaitlistCount || 0
      });
    } catch (error) {
      console.error("Error fetching filter counts:", error);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Build query for filter counting
      let query = supabase.from('profiles').select('*', { count: 'exact', head: true });

      // Apply filters for count
      if (activeFilter === 'premium') {
        // Join with premium_subscriptions to filter only premium users
        query = query.filter('id', 'in', 
          supabase.from('premium_subscriptions')
            .select('user_id')
            .or('expires_at.is.null,expires_at.gt.now()')
            .then(res => res.data?.map(item => item.user_id) || [])
        );
      } else if (activeFilter === 'admin') {
        // Join with user_roles to filter only admin users
        query = query.filter('id', 'in',
          supabase.from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
            .then(res => res.data?.map(item => item.user_id) || [])
        );
      } else if (activeFilter === 'defi-waitlist') {
        // When filtering for DeFi waitlist, we'll count differently
        const { count } = await supabase
          .from('defi_card_waitlist')
          .select('*', { count: 'exact', head: true });
        
        // Set count and total pages based on defi waitlist
        const calculatedTotalPages = Math.ceil((count || 0) / pageSize);
        setTotalPages(calculatedTotalPages || 1);
        
        // Fetch defi waitlist entries directly
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data: defiData, error: defiError } = await supabase
          .from('defi_card_waitlist')
          .select('*')
          .range(from, to)
          .order('created_at', { ascending: false });
        
        if (defiError) throw defiError;
        
        // Transform defi waitlist entries to enhanced users
        const defiUsers: EnhancedUser[] = defiData?.map(entry => ({
          id: entry.id,
          email: entry.email,
          isAdmin: false,
          isPremium: false,
          emailConfirmed: false,
          lastSignIn: null,
          created_at: entry.created_at,
          wallet_address: null,
          username: entry.name || entry.email,
          avatar_url: null, // Added avatar_url field
          points: 0,
          defiWaitlist: {
            name: entry.name,
            email: entry.email,
            discord: entry.discord,
            twitter: entry.twitter,
            telegram: entry.telegram
          }
        })) || [];
        
        setUsers(defiUsers);
        setLoadingUsers(false);
        return;
      }
      
      // Get count for pagination
      const { count, error: countError } = await query;
      
      if (countError) throw countError;
      
      // Calculate total pages
      const calculatedTotalPages = Math.ceil((count || 0) / pageSize);
      setTotalPages(calculatedTotalPages || 1);
      
      // Then get the actual users for the current page
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Query profiles table with filters applied
      let dataQuery = supabase.from('profiles').select('*');
      
      // Apply the same filters to the data query
      if (activeFilter === 'premium') {
        // We'll handle filtering for premium users later by fetching premium subscriptions
      } else if (activeFilter === 'admin') {
        // We'll handle filtering for admin users later by fetching roles
      }
      
      dataQuery = dataQuery.range(from, to).order('created_at', { ascending: false });
      
      const { data, error } = await dataQuery;
      
      if (error) throw error;
      
      // Get admin roles separately for these users
      if (data && data.length > 0) {
        const userIds = data.map(user => user.id);
        
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
          
        if (rolesError) throw rolesError;
        
        // Get premium status for these users with more detailed data
        const { data: premiumData, error: premiumError } = await supabase
          .from('premium_subscriptions')
          .select('user_id, expires_at, created_at')
          .in('user_id', userIds);
          
        if (premiumError) throw premiumError;
        
        // Fetch DeFi waitlist data for emails that match user emails
        const { data: defiWaitlistData, error: defiWaitlistError } = await supabase
          .from('defi_card_waitlist')
          .select('*');
        
        if (defiWaitlistError) throw defiWaitlistError;
        
        // Create a map of email to defi waitlist data for efficient lookup
        const defiWaitlistMap = new Map();
        defiWaitlistData?.forEach(entry => {
          if (entry.email) {
            defiWaitlistMap.set(entry.email.toLowerCase(), entry);
          }
        });
        
        // Merge role data with user data
        // Note: We don't have email confirmation status from auth.users because we don't have admin access
        let enhancedUsers = data.map(user => {
          const userRoles = rolesData?.filter(role => role.user_id === user.id) || [];
          
          // Check if user has premium subscription that hasn't expired
          const premiumSubscription = premiumData?.find(sub => sub.user_id === user.id);
          const isPremium = premiumSubscription && 
            (!premiumSubscription.expires_at || new Date(premiumSubscription.expires_at) > new Date());
          
          // Check if user is in DeFi waitlist
          const userEmail = user.email?.toLowerCase();
          const defiWaitlistEntry = userEmail ? defiWaitlistMap.get(userEmail) : null;
          
          return {
            ...user,
            isAdmin: userRoles.some(role => role.role === 'admin'),
            isPremium: !!isPremium,
            emailConfirmed: false, // Default value since we can't check auth users
            lastSignIn: null,      // Default value since we can't check auth users
            defiWaitlist: defiWaitlistEntry ? {
              name: defiWaitlistEntry.name,
              email: defiWaitlistEntry.email,
              discord: defiWaitlistEntry.discord,
              twitter: defiWaitlistEntry.twitter,
              telegram: defiWaitlistEntry.telegram
            } : null
          };
        });
        
        // Apply client-side filtering if needed (for premium, admin, and defi waitlist)
        if (activeFilter === 'premium') {
          enhancedUsers = enhancedUsers.filter(user => user.isPremium);
        } else if (activeFilter === 'admin') {
          enhancedUsers = enhancedUsers.filter(user => user.isAdmin);
        } else if (activeFilter === String('defi-waitlist')) { // Fix comparison error by ensuring both sides are of the same type
          enhancedUsers = enhancedUsers.filter(user => user.defiWaitlist !== null);
        }
        
        setUsers(enhancedUsers);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshUsers = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    users,
    page,
    setPage,
    totalPages,
    loadingUsers,
    refreshUsers,
    activeFilter,
    setActiveFilter,
    filterCounts
  };
};
