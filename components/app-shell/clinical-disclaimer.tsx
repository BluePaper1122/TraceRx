import { cn } from "@/lib/utils"

export function ClinicalDisclaimer({
  className,
  variant = "default",
}: {
  className?: string
  variant?: "default" | "compact"
}) {
  if (variant === "compact") {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Synthetic data · Research prototype
      </p>
    )
  }

  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      Synthetic-data research prototype. Not validated for clinical use. Does
      not diagnose infection or recommend treatment.
    </p>
  )
}
