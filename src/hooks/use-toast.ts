
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive";
};

// This wrapper makes the toast function directly callable
const createToastFunction = () => {
  const toastFn = (props: ToastProps) => {
    const { title, description } = props;
    sonnerToast(title as string, {
      description,
      position: "bottom-right",
    });
  };
  
  // Add methods to the function
  toastFn.success = (title: string, options?: { description?: string }) => {
    return sonnerToast.success(title, {
      ...options,
      position: "bottom-right",
    });
  };
  
  toastFn.error = (title: string, options?: { description?: string }) => {
    return sonnerToast.error(title, {
      ...options,
      position: "bottom-right",
    });
  };
  
  toastFn.warning = (title: string, options?: { description?: string }) => {
    return sonnerToast.warning(title, {
      ...options,
      position: "bottom-right",
    });
  };
  
  toastFn.info = (title: string, options?: { description?: string }) => {
    return sonnerToast.info(title, {
      ...options,
      position: "bottom-right",
    });
  };
  
  toastFn.promise = <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    // Fix: sonnerToast.promise expects only 2 arguments in this version
    // The first is the promise, and the second is an object that can contain
    // both message data and options like position
    return sonnerToast.promise(promise, {
      loading: msgs.loading,
      success: msgs.success,
      error: msgs.error,
      position: "bottom-right",
    });
  };
  
  return toastFn;
};

// Export a callable function with methods
const toast = createToastFunction();

const useToast = () => {
  return { toast };
};

export { toast, useToast };
export type { ToastProps };
