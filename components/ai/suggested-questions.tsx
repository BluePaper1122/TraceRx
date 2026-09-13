import { Button } from "@/components/ui/button"

const DEFAULT_QUESTIONS = [
  "Which evidence affected this assessment most?",
  "What information is still missing?",
  "Why did external history increase confidence?",
  "What role does the local antibiogram play?",
]

export function SuggestedQuestions({
  onSelect,
  questions = DEFAULT_QUESTIONS,
}: {
  onSelect: (question: string) => void
  questions?: string[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q) => (
        <Button
          key={q}
          type="button"
          variant="outline"
          size="sm"
          className="h-auto whitespace-normal rounded-full text-left text-xs"
          onClick={() => onSelect(q)}
        >
          {q}
        </Button>
      ))}
    </div>
  )
}
