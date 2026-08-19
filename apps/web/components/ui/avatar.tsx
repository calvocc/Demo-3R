import { HTMLAttributes } from "react";
import clsx from "clsx";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

const palette = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function initialsOf(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function colorFor(name?: string | null) {
  if (!name) return palette[0];
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ name, size = "md", className, ...props }: AvatarProps) {
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClasses[size],
        colorFor(name),
        className,
      )}
      {...props}
    >
      {initialsOf(name)}
    </div>
  );
}
