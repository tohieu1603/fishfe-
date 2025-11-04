"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimerProps {
  deadline: string | Date;
  warningThreshold: number; // in minutes
}

export function Timer({ deadline, warningThreshold }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = Math.floor((deadlineTime - now) / 1000); // in seconds

      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft(0);
      } else {
        setIsOverdue(false);
        setTimeLeft(diff);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const minutes = Math.floor(timeLeft / 60);
  const isWarning = minutes <= warningThreshold && !isOverdue;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold",
        isOverdue ? "text-red-600" : isWarning ? "text-yellow-600" : "text-gray-700"
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{isOverdue ? "Quá hạn" : formatTime(timeLeft)}</span>
    </div>
  );
}
