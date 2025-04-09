
import React from 'react';
import { useNavigate } from "react-router-dom";

interface AuthCallbackStatusProps {
  error: string | null;
  processing: boolean;
}

export const AuthCallbackStatus: React.FC<AuthCallbackStatusProps> = ({ error, processing }) => {
  const navigate = useNavigate();
  
  if (error) {
    return (
      <div>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Home
        </button>
      </div>
    );
  }
  
  if (processing) {
    return (
      <div>
        <p className="mb-2">Authenticating...</p>
        <div className="w-8 h-8 border-4 border-t-emerald-500 border-emerald-200 rounded-full animate-spin mx-auto mb-4"></div>
      </div>
    );
  }
  
  return <p>Redirecting...</p>;
};
