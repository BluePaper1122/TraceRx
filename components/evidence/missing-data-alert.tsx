import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MissingDataAlert({
  missingItems,
}: {
  missingItems: string[]
}) {
  if (missingItems.length === 0) return null

  return (
    <Alert className="border-data-missing-border bg-data-missing-bg text-foreground">
      <AlertTriangle className="text-data-missing" aria-hidden="true" />
      <AlertTitle>Patient history incomplete</AlertTitle>
      <AlertDescription className="text-foreground/80">
        <p>
          External hospital records have not yet been retrieved.{" "}
          {missingItems.join(", ")} {missingItems.length === 1 ? "is" : "are"} currently
          unavailable.
        </p>
        <p className="mt-1 font-medium text-foreground">
          Unavailable data is not interpreted as negative evidence.
        </p>
      </AlertDescription>
    </Alert>
  )
}
