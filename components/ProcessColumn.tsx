"use client";

import { useState } from "react";
import { useDrop } from "react-dnd";
import { OrderCard } from "./OrderCard";
import { Order, OrderStatus, ProcessStage } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessColumnProps {
  stage: ProcessStage;
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onOrderDrop: (order: Order, newStatus: OrderStatus) => void;
  onOrderTransition?: (order: Order, newStatus: OrderStatus, data?: any) => void;
}

const ITEMS_PER_PAGE = 5;

export function ProcessColumn({ stage, orders, onOrderClick, onOrderDrop, onOrderTransition }: ProcessColumnProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "ORDER",
    drop: (item: { order: Order }) => {
      if (item.order.status !== stage.status) {
        onOrderDrop(item.order, stage.status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const visibleOrders = orders.slice(0, visibleCount);
  const hasMore = orders.length > visibleCount;

  // Count overdue orders
  const overdueOrders = orders.filter(order =>
    order.deadline ? new Date(order.deadline) < new Date() : false
  );
  const overdueCount = overdueOrders.length;

  return (
    <div ref={drop as any} className="flex flex-col min-w-[260px] sm:min-w-[280px] max-w-[260px] sm:max-w-[280px]">
      {/* Column Header - Compact */}
      <div className="bg-white rounded-t-xl border border-gray-200 p-3 mb-1.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">{stage.label}</h2>
          <div className="bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
            {orders.length}
          </div>
        </div>

        {/* Overdue Warning */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-md px-2 py-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-semibold text-red-700">
              {overdueCount} đơn đang muộn
            </span>
          </div>
        )}
      </div>

      {/* Column Content - Drop Zone */}
      <div
        className={cn(
          "flex-1 bg-gray-50 rounded-b-xl border-x border-b border-gray-200 p-2 h-[600px] overflow-y-auto transition-colors",
          isOver && "bg-blue-50 border-blue-300"
        )}
      >
        <div className="space-y-2">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Không có đơn hàng
            </div>
          ) : (
            <>
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => onOrderClick(order)}
                  onTransition={onOrderTransition}
                />
              ))}

              {hasMore && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                  >
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Tải thêm {Math.min(ITEMS_PER_PAGE, orders.length - visibleCount)} đơn • Còn {orders.length - visibleCount} đơn
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
