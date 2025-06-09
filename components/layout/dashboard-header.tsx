import * as React from "react";
import { cn } from "@/lib/utils";

export interface DashboardHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  title = "Dashboard",
  children,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "flex justify-between items-center px-6 py-4 border-b border-border bg-background",
        className
      )}
    >
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {children && (
        <div className="flex items-center space-x-2">{children}</div>
      )}
    </header>
  );
} 