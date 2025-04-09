
import { AlertCircle, Info } from "lucide-react";

interface WalletAlertProps {
  message: string;
  variant?: "warning" | "info" | "error" | "success";
}

export const WalletAlert = ({ message, variant = "warning" }: WalletAlertProps) => {
  const bgColors = {
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
  };

  return (
    <div className={`flex items-center gap-2 p-3 rounded-md border ${bgColors[variant]}`}>
      {variant === "warning" ? (
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <Info className="h-5 w-5 flex-shrink-0" />
      )}
      <p className="text-sm">{message}</p>
    </div>
  );
};
