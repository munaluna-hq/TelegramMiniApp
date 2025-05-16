import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Simple loading spinner component
 */
export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4", className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}