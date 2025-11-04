"use client";

import { OrderActivity } from "@/types";
import { Clock, Package, Upload, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ActivityTimelineProps {
  activities: OrderActivity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return <Package className="w-4 h-4" />;
      case "status_change":
        return <Clock className="w-4 h-4" />;
      case "image_uploaded":
        return <Upload className="w-4 h-4" />;
      case "image_deleted":
        return <Trash2 className="w-4 h-4" />;
      case "comment":
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "created":
        return "bg-green-500";
      case "status_change":
        return "bg-blue-500";
      case "image_uploaded":
        return "bg-purple-500";
      case "image_deleted":
        return "bg-red-500";
      case "comment":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>Chưa có lịch sử hoạt động</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, idx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {idx !== activities.length - 1 && (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                {/* Avatar */}
                <div className="relative">
                  {activity.user ? (
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium ring-8 ring-white">
                      {getInitials(activity.user.full_name)}
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium ring-8 ring-white">
                      ?
                    </div>
                  )}
                  {/* Activity icon badge */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 ${getActivityColor(
                      activity.activity_type
                    )} rounded-full p-1 ring-2 ring-white text-white`}
                  >
                    {getActivityIcon(activity.activity_type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {activity.user?.full_name || "Hệ thống"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{activity.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
