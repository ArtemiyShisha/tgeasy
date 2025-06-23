"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
      onChange?.(event);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-zinc-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 sr-only",
            className
          )}
          onChange={handleChange}
          {...props}
        />
        <span className="h-4 w-4 shrink-0 rounded-sm border border-zinc-200 ring-offset-white peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-950 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-zinc-900 peer-checked:text-zinc-50 dark:border-zinc-800 dark:ring-offset-zinc-950 dark:peer-focus-visible:ring-zinc-300 dark:peer-checked:bg-zinc-50 dark:peer-checked:text-zinc-900 flex items-center justify-center">
          <Check className="h-4 w-4 text-current opacity-0 peer-checked:opacity-100" />
        </span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox } 