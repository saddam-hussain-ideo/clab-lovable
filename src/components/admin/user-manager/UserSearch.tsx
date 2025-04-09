
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EnhancedUser } from "@/hooks/useUserManager";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface UserSearchProps {
  onUserFound: (user: EnhancedUser) => void;
}

interface SearchFormValues {
  searchType: "email" | "wallet";
  searchValue: string;
}

export const UserSearch = ({ onUserFound }: UserSearchProps) => {
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState<string | null>(null);
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const { toast } = useToast();
  
  const form = useForm<SearchFormValues>({
    defaultValues: {
      searchType: "email",
      searchValue: "",
    }
  });

  const searchUser = async (values: SearchFormValues) => {
    if (!values.searchValue) return;
    
    setLoading(true);
    try {
      const { searchType, searchValue } = values;
      
      let query = supabase
        .from('profiles')
        .select('*');
      
      // Apply the appropriate filter based on search type
      if (searchType === 'email') {
        query = query.ilike('email', `%${searchValue}%`);
      } else if (searchType === 'wallet') {
        query = query.ilike('wallet_address', `%${searchValue}%`);
      }
      
      const { data: profiles, error } = await query.single();

      if (error) throw error;
      
      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profiles.id)
        .eq('role', 'admin');
        
      if (roleError) throw roleError;
      
      // Check if user has premium subscription
      const { data: premiumData, error: premiumError } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', profiles.id)
        .maybeSingle();
      
      if (premiumError) throw premiumError;
      
      // Determine if premium is active (either no expiry or not expired yet)
      const isPremium = premiumData && 
        (!premiumData.expires_at || new Date(premiumData.expires_at) > new Date());
        
      // Note: We can't check email verification status because we don't have auth admin access
      const foundUser: EnhancedUser = {
        ...profiles,
        isAdmin: roleData && roleData.length > 0,
        isPremium: !!isPremium,
        emailConfirmed: false, // Default value since we can't check auth users
        lastSignIn: null       // Default value since we can't check auth users
      };
      
      setUser(foundUser);
      onUserFound(foundUser);
    } catch (error: any) {
      console.error("Error searching user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setUser(null);
      onUserFound(null as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Search Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(searchUser)} className="space-y-4">
            <FormField
              control={form.control}
              name="searchType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    name="search-type"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="search-email" />
                      <Label htmlFor="search-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wallet" id="search-wallet" />
                      <Label htmlFor="search-wallet">Wallet Address</Label>
                    </div>
                  </RadioGroup>
                </FormItem>
              )}
            />
            
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="searchValue"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        id="search-value"
                        name="search-value"
                        placeholder={form.watch("searchType") === "email" 
                          ? "Search by email..." 
                          : "Search by wallet address..."}
                        className="flex-1 bg-secondary text-foreground border-border"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} id="search-button" name="search-button">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </Form>

        {user && (
          <div className="mt-6 p-4 border rounded-lg bg-secondary">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{user.email || user.wallet_address}</h3>
                <p className="text-sm text-gray-300">ID: {user.id}</p>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Admin Status:</span>{" "}
                    <span className={`${user.isAdmin ? 'text-blue-500' : 'text-gray-400'}`}>
                      {user.isAdmin ? 'Admin' : 'Regular User'}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Premium Status:</span>{" "}
                    <span className={`${user.isPremium ? 'text-green-500' : 'text-gray-400'}`}>
                      {user.isPremium ? 'Premium Subscriber' : 'Free User'}
                    </span>
                  </p>
                  {user.wallet_address && (
                    <p className="text-sm">
                      <span className="font-medium">Wallet Address:</span>{" "}
                      <span className="text-gray-400 font-mono text-xs">
                        {user.wallet_address}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  id="verification-info-button"
                  name="verification-info-button"
                  onClick={() => toast({
                    title: "Email Verification Status",
                    description: "Verification status cannot be checked or modified due to missing auth admin access. Please use the Supabase dashboard for user verification.",
                    variant: "default",
                  })}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Verification Info
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
