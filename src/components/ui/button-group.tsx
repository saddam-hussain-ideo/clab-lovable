
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
}

interface ButtonGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

const ButtonGroupItem = ({
  value,
  children,
  className,
  ...props
}: ButtonGroupItemProps) => {
  return (
    <Button
      type="button"
      value={value}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
};

export const ButtonGroup = ({
  value,
  onValueChange,
  className,
  buttonClassName,
  activeButtonClassName,
  children,
  ...props
}: ButtonGroupProps) => {
  // Clone and modify children to add active state and onClick handler
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement<ButtonGroupItemProps>(child)) {
      const isActive = child.props.value === value;
      return React.cloneElement(child, {
        onClick: () => onValueChange(child.props.value),
        className: cn(
          buttonClassName,
          isActive ? activeButtonClassName : "",
          child.props.className
        ),
        "aria-selected": isActive,
      });
    }
    return child;
  });

  return (
    <div className={cn("flex", className)} role="tablist" {...props}>
      {enhancedChildren}
    </div>
  );
};

ButtonGroup.Item = ButtonGroupItem;
