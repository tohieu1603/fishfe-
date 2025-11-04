"use client";

import { useState } from "react";
import { useDrag } from "react-dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer } from "./Timer";
import { ConfirmTransitionDialog } from "./ConfirmTransitionDialog";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";
import { Package, DollarSign, Clock, ArrowRight, ChevronRight, Image, AlertTriangle, Phone } from "lucide-react";
import { PROCESS_STAGES } from "@/lib/constants";

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  onTransition?: (order: Order, newStatus: OrderStatus, data?: any) => void;
}

export function OrderCard({ order, onClick, onTransition }: OrderCardProps) {
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ORDER",
    item: { order },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Get next status
  const currentIndex = PROCESS_STAGES.findIndex((s) => s.status === order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < PROCESS_STAGES.length - 1
    ? PROCESS_STAGES[currentIndex + 1].status
    : null;

  // Check if order is overdue
  const isOverdue = order.deadline ? new Date(order.deadline) < new Date() : false;

  // Get warning threshold for current stage
  const warningThreshold =
    order.status === "created" ? 10
    : order.status === "weighing" ? 15
    : order.status === "create_invoice" ? 7
    : order.status === "send_photo" ? 7
    : order.status === "payment" ? 20
    : 45;

  const handleQuickTransition = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextStatus) {
      setShowTransitionDialog(true);
    }
  };

  const handleConfirmTransition = async (data?: any) => {
    if (nextStatus && onTransition) {
      await onTransition(order, nextStatus, data);
    }
  };

  return (
    <Card
      ref={drag}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all rounded-xl overflow-hidden ${
        isDragging ? "opacity-50 rotate-2" : ""
      } ${
        isOverdue
          ? "border-2 border-red-500 bg-red-50/50"
          : "border border-gray-200"
      }`}
    >
      <div className="p-3">
        {/* Overdue Warning Badge */}
        {isOverdue && (
          <div className="mb-2 flex items-center gap-1.5 bg-red-100 border border-red-300 rounded-md px-2 py-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-semibold text-red-700">Đang muộn deadline!</span>
          </div>
        )}

        {/* Header with Order Number and Timer */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">#{order.order_number}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{order.customer_name}</p>
          </div>
          {order.deadline && (
            <div className="bg-gray-100 rounded-md px-1.5 py-0.5">
              <Timer
                deadline={order.deadline}
                warningThreshold={warningThreshold}
              />
            </div>
          )}
        </div>

        {/* Order Info */}
        <div className="space-y-1.5 mb-2">
          {/* Items count */}
          <div className="flex items-center gap-1.5 text-xs text-gray-700">
            <Package className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium">{order.items_count || order.items?.length || 0} sản phẩm</span>
          </div>

          {/* Total amount */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            <span>{formatCurrency(Number(order.total_amount || order.total || 0))}</span>
          </div>

          {/* Customer phone */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span>{order.customer_phone}</span>
          </div>

          {/* Delivery time */}
          {order.delivery_time && (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span>
                Nhận:{" "}
                {new Date(order.delivery_time).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {/* Images count */}
          {(order.images_count || 0) > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-green-700">
              <Image className="h-3.5 w-3.5 text-green-500" />
              <span>{order.images_count || order.images?.length || 0} ảnh</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {order.assigned_to && order.assigned_to.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {order.assigned_to.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="text-[10px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full px-2 py-0"
              >
                @{user.username}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1.5 mt-2">
          <Button
            variant="ghost"
            className="flex-1 justify-between hover:bg-gray-50 rounded-lg h-7 text-xs"
            onClick={onClick}
          >
            <span className="font-medium">Xem chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          {/* Quick Transition Button */}
          {nextStatus && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.FAILED && (
            <Button
              size="icon"
              className="h-7 w-7 bg-black hover:bg-gray-800 text-white rounded-lg"
              onClick={handleQuickTransition}
              title="Chuyển tiếp nhanh"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Transition Confirmation Dialog */}
      {nextStatus && (
        <ConfirmTransitionDialog
          open={showTransitionDialog}
          onOpenChange={setShowTransitionDialog}
          order={order}
          fromStatus={order.status}
          toStatus={nextStatus}
          onConfirm={handleConfirmTransition}
        />
      )}
    </Card>
  );
}
