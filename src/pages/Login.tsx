
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get the current window location origin for the redirect
      // Include admin=true parameter to direct admins straight to admin page
      const redirectUrl = `${window.location.origin}/auth/callback?admin=true`;
      console.log(`Setting redirect URL to: ${redirectUrl}`);
      
      // Store the current origin in local storage to check during callback
      localStorage.setItem('auth_origin', window.location.origin);
      
      // Additionally clear admin cache before login
      try {
        localStorage.removeItem('adminRoleData');
        localStorage.removeItem('isAdmin');
        sessionStorage.removeItem('adminRoleData');
        sessionStorage.removeItem('isAdmin');
        console.log('Cleared admin cache before login');
      } catch (e) {
        console.warn('Failed to clear admin cache:', e);
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
      toast({
        title: "Magic link sent",
        description: "Check your email for the login link",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred during login.");
      toast({
        title: "Login failed",
        description: error.message || "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a magic link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link for admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleMagicLinkLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
