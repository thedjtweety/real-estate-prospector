import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ProgressUpdate {
  stage: string;
  status: "in_progress" | "completed" | "failed";
  message: string;
  percentage: number;
  timestamp: Date;
}

interface SearchProgressProps {
  searchId: string;
  onComplete?: () => void;
}

export function SearchProgress({ searchId, onComplete }: SearchProgressProps) {
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Subscribe to progress updates
  trpc.progress.subscribe.useSubscription(
    { searchId },
    {
      onData(update) {
        setUpdates((prev) => [...prev, update]);
        setCurrentProgress(update.percentage);

        if (update.status === "completed" && update.stage === "Complete") {
          setIsComplete(true);
          onComplete?.();
        }
      },
      onError(err) {
        console.error("Progress subscription error:", err);
      },
    }
  );

  const latestUpdate = updates[updates.length - 1];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Search Complete!
            </>
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-navy" />
              Scrubbing Data...
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={currentProgress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {currentProgress}% Complete
          </p>
        </div>

        {/* Latest Status */}
        {latestUpdate && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-navy">
              {latestUpdate.message}
            </p>
          </div>
        )}

        {/* Stage List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {updates.map((update, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50 transition-colors"
            >
              {update.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : update.status === "failed" ? (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 text-navy animate-spin mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {update.stage}
                </p>
                <p className="text-muted-foreground text-xs">
                  {update.message}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(update.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
