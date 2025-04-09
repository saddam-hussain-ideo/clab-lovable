
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

interface LocationState {
  email?: string;
  message?: string;
  adminLogin?: boolean;
}

const Verification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  if (!state?.email) {
    return <Navigate to="/" replace />;
  }

  const handleReturn = () => {
    if (state.adminLogin) {
      navigate("/admin-login");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-emerald-500" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription className="text-gray-400">
            {state.message || `We've sent a verification link to ${state.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleReturn}
          >
            {state.adminLogin ? "Return to Admin Login" : "Return to Home"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verification;
