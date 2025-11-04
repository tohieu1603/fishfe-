"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { Order } from "@/types";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onConfirm: (reason: string) => void;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      await onConfirm(reason);
      handleClose();
    } catch (error) {
      console.error("Failed to cancel order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Xác nhận hủy đơn hàng
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Info */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-600">Số đơn:</p>
                <p className="text-sm font-bold text-gray-900">#{order.order_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-600">Khách hàng:</p>
                <p className="font-medium text-gray-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Tổng tiền:</p>
                <p className="font-medium text-gray-900">
                  {(order.total_amount || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Lý do hủy đơn *
            </Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do hủy đơn hàng..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] text-sm"
              required
            />
            <p className="text-xs text-gray-500">
              Vui lòng nhập lý do để ghi vào lịch sử đơn hàng
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            Không, giữ lại
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="bg-red-500 hover:bg-red-600 text-white flex-1 sm:flex-initial"
          >
            {isLoading ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
