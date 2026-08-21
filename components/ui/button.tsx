import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none active:scale-[0.98] active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900/90 hover:bg-zinc-900 text-white dark:bg-zinc-100/95 dark:hover:bg-white dark:text-zinc-950 backdrop-blur-md border border-white/20 dark:border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.35)]",
        outline:
          "border border-zinc-200/90 dark:border-white/15 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-white/80 dark:hover:bg-zinc-800/80 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]",
        secondary:
          "bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 text-secondary-foreground backdrop-blur-md border border-zinc-200/70 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
        ghost:
          "hover:bg-zinc-200/40 dark:hover:bg-white/10 text-foreground backdrop-blur-xs transition-colors",
        destructive:
          "bg-red-600/90 hover:bg-red-600 text-white backdrop-blur-md border border-red-400/40 shadow-[0_4px_14px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_18px_rgba(220,38,38,0.45)]",
        glass:
          "bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/15 text-foreground backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.6)]",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default:
          "h-9 gap-2 px-3.5 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1.5 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 rounded-xl px-5 text-sm font-bold shadow-[0_4px_14px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)]",
        icon: "size-9 rounded-xl",
        "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7.5 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
