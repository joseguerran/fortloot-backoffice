import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/20 text-primary shadow-neon-sm hover:bg-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/20 text-destructive shadow hover:bg-destructive/30",
        outline: "text-foreground border-white/10",
        // Neon status variants
        success:
          "bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-neon-green",
        warning:
          "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30",
        error:
          "bg-neon-red/20 text-neon-red border border-neon-red/30 shadow-neon-red",
        info:
          "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 shadow-neon-cyan",
        purple:
          "bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-neon-purple",
        // Status-specific variants
        online:
          "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        offline:
          "bg-slate-500/20 text-slate-400 border border-slate-500/30",
        busy:
          "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        pending:
          "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
        completed:
          "bg-green-500/20 text-green-400 border border-green-500/30",
        cancelled:
          "bg-gray-500/20 text-gray-400 border border-gray-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
