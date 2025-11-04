"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { Order } from "@/types";
import { PROCESS_STAGES } from "@/lib/constants";

interface OverdueOrdersAlertProps {
  orders: Order[];
}

export function OverdueOrdersAlert({ orders }: OverdueOrdersAlertProps) {
  // Filter overdue orders
  const overdueOrders = orders.filter(order =>
    order.deadline ? new Date(order.deadline) < new Date() : false
  );

  if (overdueOrders.length === 0) {
    return null;
  }

  // Group overdue orders by status
  const overdueByStatus: Record<string, { count: number; label: string; orders: Order[] }> = {};

  PROCESS_STAGES.forEach(stage => {
    const stageOverdue = overdueOrders.filter(order => order.status === stage.status);
    if (stageOverdue.length > 0) {
      overdueByStatus[stage.status] = {
        count: stageOverdue.length,
        label: stage.label,
        orders: stageOverdue,
      };
    }
  });

  // Calculate total minutes overdue
  const totalMinutesOverdue = overdueOrders.reduce((sum, order) => {
    if (order.deadline) {
      const deadline = new Date(order.deadline);
      const now = new Date();
      const minutesOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60));
      return sum + (minutesOverdue > 0 ? minutesOverdue : 0);
    }
    return sum;
  }, 0);

  // Find most overdue order
  const mostOverdue = overdueOrders.reduce((most, order) => {
    if (!order.deadline) return most;
    if (!most.deadline) return order;

    const orderOverdue = new Date().getTime() - new Date(order.deadline).getTime();
    const mostOverdueTime = new Date().getTime() - new Date(most.deadline).getTime();

    return orderOverdue > mostOverdueTime ? order : most;
  }, overdueOrders[0]);

  const mostOverdueMinutes = mostOverdue?.deadline
    ? Math.floor((new Date().getTime() - new Date(mostOverdue.deadline).getTime()) / (1000 * 60))
    : 0;

  return (
    <div className="mb-2 md:mb-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-300 md:border-2 rounded-lg md:rounded-xl p-2.5 md:p-4 shadow-sm">
      {/* Mobile: Compact version */}
      <div className="md:hidden flex items-center gap-2">
        <div className="bg-red-500 rounded-full p-1.5 flex-shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-red-900 truncate">
            {overdueOrders.length} đơn muộn deadline
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-red-100 rounded-full px-2 py-0.5 shrink-0">
          <Clock className="h-3 w-3 text-red-600" />
          <span className="text-[10px] font-semibold text-red-700">
            {totalMinutesOverdue}p
          </span>
        </div>
      </div>

      {/* Desktop: Full version */}
      <div className="hidden md:flex items-start gap-3">
        <div className="bg-red-500 rounded-full p-2 flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-red-900">
              Cảnh báo: {overdueOrders.length} đơn hàng đang muộn deadline!
            </h3>
            <div className="flex items-center gap-1.5 bg-red-100 rounded-full px-3 py-1">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">
                Tổng: {totalMinutesOverdue} phút
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {Object.entries(overdueByStatus).map(([status, data]) => (
              <div
                key={status}
                className="bg-white border border-red-200 rounded-lg p-2.5 hover:shadow-md transition-shadow"
              >
                <div className="text-xs text-gray-600 mb-0.5">{data.label}</div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-red-600">{data.count}</span>
                  <span className="text-xs text-gray-500">đơn</span>
                </div>
              </div>
            ))}
          </div>

          {mostOverdue && (
            <div className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Đơn muộn nhất:</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    #{mostOverdue.order_number}
                  </span>
                  <span className="text-xs text-gray-600">
                    • {mostOverdue.customer_name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">
                  {mostOverdueMinutes} phút
                </div>
                <div className="text-xs text-gray-600">đã muộn</div>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-medium">
              Vui lòng xử lý các đơn hàng muộn deadline càng sớm càng tốt!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
