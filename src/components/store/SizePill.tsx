import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const sizePill = cva(
  "inline-flex items-center justify-center border font-mono text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      selected: {
        true: "border-foreground bg-foreground text-background",
        false: "border-border bg-transparent text-foreground hover:border-foreground",
      },
      size: {
        sm: "h-8 min-w-10 px-2",
        lg: "h-12 min-w-14 px-3",
      },
    },
    defaultVariants: { selected: false, size: "sm" },
  },
);

type SizePillProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof sizePill>;

export function SizePill({ selected, size, className, ...props }: SizePillProps) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      className={cn(sizePill({ selected, size }), className)}
      {...props}
    />
  );
}
