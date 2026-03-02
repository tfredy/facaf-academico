import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = {
  default:
    "border-gray-200 bg-white text-foreground",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  destructive: "border-red-200 bg-red-50 text-red-800",
} as const;

interface AlertProps {
  variant?: "default" | "info" | "warning" | "destructive";
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = "default",
  children,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 items-start rounded-lg border p-4",
        alertVariants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
