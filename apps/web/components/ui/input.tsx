import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
