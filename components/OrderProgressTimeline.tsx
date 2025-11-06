"use client";

import { AlertTriangle, CheckCircle, Clock, Circle, ChevronRight } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { PROCESS_STAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface OrderProgressTimelineProps {
  order: Order;
  onTransition?: (newStatus?: OrderStatus) => void;
}

export function OrderProgressTimeline({ order, onTransition }: OrderProgressTimelineProps) {
  const currentIndex = PROCESS_STAGES.findIndex((s) => s.status === order.status);

  // Get next status for transition button
  const nextStatus = currentIndex >= 0 && currentIndex < PROCESS_STAGES.length - 1
    ? PROCESS_STAGES[currentIndex + 1]
    : null;

  // Calculate time spent at each stage
  const getStageTime = (status: OrderStatus): { minutes: number; isOverdue: boolean; deadline?: Date } => {
    const history = order.status_history || [];

    // Find when this status started
    const statusEntry = history.find(h => h.status === status);
    if (!statusEntry) return { minutes: 0, isOverdue: false };

    const startTime = new Date(statusEntry.changed_at);

    // Find when it ended (next status change or current time)
    const currentStatusIndex = history.findIndex(h => h.status === status);
    const nextStatusChange = history[currentStatusIndex + 1];
    const endTime = nextStatusChange ? new Date(nextStatusChange.changed_at) : new Date();

    const minutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Get threshold for this stage
    const stage = PROCESS_STAGES.find(s => s.status === status);
    const threshold = stage?.duration || 60;

    return {
      minutes,
      isOverdue: minutes > threshold,
      deadline: new Date(startTime.getTime() + threshold * 60 * 1000),
    };
  };

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-medium">Tiến độ tổng thể</span>
          <span className="font-semibold text-blue-600">
            {Math.round(((currentIndex + 1) / PROCESS_STAGES.filter(s => s.status !== OrderStatus.COMPLETED && s.status !== OrderStatus.FAILED).length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / PROCESS_STAGES.filter(s => s.status !== OrderStatus.COMPLETED && s.status !== OrderStatus.FAILED).length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
      {PROCESS_STAGES.filter(stage =>
        stage.status !== OrderStatus.COMPLETED && stage.status !== OrderStatus.FAILED
      ).map((stage, index) => {
        // Check if this stage actually exists in status_history
        const hasBeenInThisStage = order.status_history?.some(h => h.status === stage.status) || false;

        const isPast = hasBeenInThisStage && index < currentIndex;
        const isCurrent = index === currentIndex;

        const stageTime = (isPast || isCurrent) && hasBeenInThisStage ? getStageTime(stage.status) : null;

        return (
          <div key={stage.status} className="relative">
            {/* Connecting Line */}
            {index > 0 && (
              <div
                className={`absolute left-3 top-0 w-1 h-4 -mt-4 ${
                  isPast ? "bg-green-500" : isCurrent ? "bg-blue-400" : "bg-gray-300"
                }`}
              />
            )}

            {/* Stage Row */}
            <div
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                isCurrent
                  ? stageTime?.isOverdue
                    ? "bg-red-50 border-2 border-red-300"
                    : "bg-blue-50 border-2 border-blue-300"
                  : isPast
                    ? stageTime?.isOverdue
                      ? "bg-orange-100 border-2 border-orange-400"
                      : "bg-green-100 border-2 border-green-400"
                    : "bg-gray-50 border border-gray-200"
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isPast ? (
                  <CheckCircle className="h-6 w-6 text-green-600 fill-green-600" />
                ) : isCurrent ? (
                  stageTime?.isOverdue ? (
                    <div className="relative">
                      <Circle className="h-6 w-6 text-red-600 fill-red-100" />
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  ) : (
                    <Circle className="h-6 w-6 text-blue-600 fill-blue-100 animate-pulse" />
                  )
                ) : (
                  <Circle className="h-6 w-6 text-gray-300" />
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? stageTime?.isOverdue
                          ? "text-red-900"
                          : "text-blue-900"
                        : isPast
                          ? "text-gray-900"
                          : "text-gray-500"
                    }`}
                  >
                    {stage.label}
                  </h4>

                  {(isPast || isCurrent) && stageTime && (
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        stageTime.isOverdue
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{stageTime.minutes} phút</span>
                    </div>
                  )}
                </div>

                {/* Show responsible user */}
                {(isPast || isCurrent) && (() => {
                  const statusEntry = order.status_history?.find(h => h.status === stage.status);
                  const responsibleUser = statusEntry?.changed_by;

                  if (responsibleUser) {
                    return (
                      <div className="flex items-center gap-2 mb-2">
                        {responsibleUser.avatar ? (
                          <img
                            src={responsibleUser.avatar}
                            alt={responsibleUser.full_name}
                            className="w-5 h-5 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-[10px] font-semibold text-gray-600">
                              {responsibleUser.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-600">
                          <span className="font-medium">{responsibleUser.full_name}</span>
                          {" "}
                          <span className="text-gray-500">(@{responsibleUser.username})</span>
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Stage Duration Info */}
                <p className="text-xs text-gray-600 mb-1">
                  Thời gian chuẩn: {stage.duration} phút
                </p>

                {/* Overdue Warning */}
                {(isPast || isCurrent) && stageTime?.isOverdue && (
                  <div className="flex items-center gap-1.5 text-xs mt-2 p-2 bg-white/80 rounded border border-red-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                    <span className="text-red-700 font-medium">
                      Đã muộn {stageTime.minutes - stage.duration} phút so với thời gian chuẩn
                    </span>
                  </div>
                )}

                {/* Current Stage Progress */}
                {isCurrent && !stageTime?.isOverdue && stageTime && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Tiến độ</span>
                      <span>{Math.round((stageTime.minutes / stage.duration) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min((stageTime.minutes / stage.duration) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Transition Button - Only show on current stage if there's a next status */}
                {isCurrent && nextStatus && onTransition && (
                  <div className="mt-3">
                    <Button
                      onClick={() => onTransition()}
                      className="w-full h-10 bg-black hover:bg-gray-800 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2"
                    >
                      <span>Chuyển sang: {nextStatus.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
