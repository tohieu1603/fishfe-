"use client";

import { AlertTriangle, Clock, Circle, ChevronRight, XCircle, CheckCircle } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { PROCESS_STAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface OrderProgressTimelineProps {
  order: Order;
  onTransition?: (newStatus?: OrderStatus) => void;
}

export function OrderProgressTimeline({ order, onTransition }: OrderProgressTimelineProps) {
  // Check if order is completed or failed
  const isCompleted = order.status === OrderStatus.COMPLETED;
  const isFailed = order.status === OrderStatus.FAILED;

  // Get all stages including the failed stage if order failed
  const allStages = isFailed
    ? [...PROCESS_STAGES.filter(s => s.status !== OrderStatus.COMPLETED), { ...PROCESS_STAGES.find(s => s.status === OrderStatus.FAILED)!, label: "Đã hủy" }]
    : PROCESS_STAGES.filter(s => s.status !== OrderStatus.COMPLETED && s.status !== OrderStatus.FAILED);

  const currentIndex = allStages.findIndex((s) => s.status === order.status);

  // Get next status for transition button
  const nextStatus = currentIndex >= 0 && currentIndex < PROCESS_STAGES.length - 1
    ? PROCESS_STAGES[currentIndex + 1]
    : null;

  // Calculate time spent at each stage
  const getStageTime = (status: OrderStatus): { minutes: number; isOverdue: boolean; deadline?: Date; timestamp?: Date } => {
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
      timestamp: startTime,
    };
  };

  // Calculate progress percentage
  const totalStages = allStages.length;
  const progressPercentage = isCompleted
    ? 100
    : isFailed
      ? Math.round((currentIndex / totalStages) * 100)
      : Math.round(((currentIndex + 1) / totalStages) * 100);

  const filteredStages = allStages;

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar - Compact on mobile */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-medium">Tiến độ</span>
          <span className={`font-semibold ${
            isCompleted ? "text-green-600" : isFailed ? "text-red-600" : "text-blue-600"
          }`}>
            {progressPercentage}%
          </span>
        </div>
        <div className="h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : isFailed
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : "bg-gradient-to-r from-green-500 to-blue-500"
            }`}
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>
      </div>

      {/* Horizontal Timeline for Mobile, Vertical for Desktop */}
      <div className="hidden md:block">
        {/* Desktop: Vertical Timeline */}
        <div className="space-y-1">
        {filteredStages.map((stage, index) => {
          const hasBeenInThisStage = order.status_history?.some(h => h.status === stage.status) || false;
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const stageTime = (isPast || isCurrent) && hasBeenInThisStage ? getStageTime(stage.status) : null;

          return (
            <div key={stage.status} className="relative">
              {/* Connecting Line */}
              {index > 0 && (
                <div
                  className={`absolute left-3 top-0 w-1.5 h-4 -mt-4 ${
                    isPast ? "bg-green-500" : isCurrent ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              )}

              {/* Stage Row */}
              <div
                className={`flex items-start gap-3 p-3 rounded-lg transition-all shadow-sm ${
                  isCurrent
                    ? stageTime?.isOverdue
                      ? "bg-red-50 border-2 border-red-400"
                      : "bg-blue-50 border-2 border-blue-400"
                    : isPast
                      ? stageTime?.isOverdue
                        ? "bg-orange-50 border-2 border-orange-500"
                        : "bg-green-50 border-2 border-green-500"
                      : "bg-white border-2 border-gray-300"
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isFailed && isCurrent ? (
                    // Failed state - red X
                    <div className="relative flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : isPast ? (
                    // Completed stage - green check
                    <div className="relative flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : isCurrent ? (
                    // Current stage
                    stageTime?.isOverdue ? (
                      <div className="relative">
                        <Circle className="h-6 w-6 text-red-600 fill-red-100" />
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-blue-600 fill-blue-100 animate-pulse" />
                    )
                  ) : (
                    // Future stage
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
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isFailed && isCurrent
                              ? "bg-red-100 text-red-700"
                              : stageTime.isOverdue
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{stageTime.minutes} phút</span>
                        </div>
                        {stageTime.timestamp && (
                          <span className="text-[10px] text-gray-500">
                            {stageTime.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
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

      {/* Mobile: Horizontal Compact Timeline */}
      <div className="block md:hidden">
        {/* Horizontal Steps */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-300" />

          {/* Active Progress Line */}
          <div
            className={`absolute top-3 left-0 h-0.5 transition-all duration-500 ${
              isCompleted
                ? "bg-green-500"
                : isFailed
                  ? "bg-red-500"
                  : "bg-blue-500"
            }`}
            style={{
              width: `${(currentIndex / (filteredStages.length - 1)) * 100}%`,
            }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {filteredStages.map((stage, index) => {
              const hasBeenInThisStage = order.status_history?.some(h => h.status === stage.status) || false;
              const isPast = index < currentIndex;
              const isCurrent = index === currentIndex;
              const stageTime = (isPast || isCurrent) && hasBeenInThisStage ? getStageTime(stage.status) : null;

              return (
                <div key={stage.status} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Step Circle */}
                  <div className="relative z-10">
                    {isPast ? (
                      <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
                        <svg className="h-3.5 w-3.5 text-white font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isCurrent ? (
                      stageTime?.isOverdue ? (
                        <div className="relative">
                          <div className="h-6 w-6 rounded-full bg-red-100 border-2 border-red-600 flex items-center justify-center shadow-sm">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-600 border-2 border-blue-600 shadow-sm animate-pulse" />
                      )
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-white border-2 border-gray-300 shadow-sm" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <p className={`text-[10px] font-medium leading-tight ${
                      isCurrent
                        ? stageTime?.isOverdue
                          ? "text-red-900"
                          : "text-blue-900"
                        : isPast
                          ? "text-gray-900"
                          : "text-gray-500"
                    }`}>
                      {stage.label.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </p>

                    {/* Time Badge */}
                    {(isPast || isCurrent) && stageTime && (
                      <div className={`mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                        stageTime.isOverdue
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        <Clock className="h-2.5 w-2.5" />
                        <span>{stageTime.minutes}p</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Stage Details */}
        {filteredStages.map((stage, index) => {
          const hasBeenInThisStage = order.status_history?.some(h => h.status === stage.status) || false;
          const isCurrent = index === currentIndex;
          const stageTime = isCurrent && hasBeenInThisStage ? getStageTime(stage.status) : null;

          if (!isCurrent) return null;

          return (
            <div key={`detail-${stage.status}`} className="mt-4 p-3 rounded-lg border-2 border-blue-400 bg-blue-50 shadow-sm">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">{stage.label}</h4>

              {/* Responsible User */}
              {(() => {
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
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Duration Info */}
              <p className="text-xs text-gray-600 mb-2">
                Chuẩn: {stage.duration} phút
              </p>

              {/* Overdue Warning */}
              {stageTime?.isOverdue && (
                <div className="flex items-center gap-1.5 text-xs p-2 bg-white/80 rounded border border-red-200 mb-2">
                  <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 font-medium">
                    Muộn {stageTime.minutes - stage.duration}p
                  </span>
                </div>
              )}

              {/* Progress Bar */}
              {!stageTime?.isOverdue && stageTime && (
                <div className="mb-2">
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

              {/* Transition Button */}
              {nextStatus && onTransition && (
                <Button
                  onClick={() => onTransition()}
                  className="w-full h-9 bg-black hover:bg-gray-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5"
                >
                  <span>Chuyển sang: {nextStatus.label}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
