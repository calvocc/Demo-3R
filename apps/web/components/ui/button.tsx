import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "default" | "outline" | "ghost" | "destructive" | "subtle";
type Size = "default" | "sm" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  outline: "border border-border bg-card hover:bg-secondary",
  ghost: "bg-transparent hover:bg-secondary",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  subtle: "bg-secondary text-foreground hover:bg-border/60",
};

const sizeClasses: Record<Size, string> = {
  default: "h-10 px-4 text-sm gap-2",
  sm: "h-8 px-3 text-xs gap-1.5",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
