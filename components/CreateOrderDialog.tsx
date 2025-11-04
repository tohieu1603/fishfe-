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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { orderApi } from "@/lib/api";
import { toast } from "sonner";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OrderItemInput {
  product_id?: number;
  product_name: string;
  quantity: number;
  unit: string;
  price: number;
}

export function CreateOrderDialog({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [items, setItems] = useState<OrderItemInput[]>([
    { product_name: "", quantity: 1, unit: "kg", price: 0 },
  ]);
  const [shippingFee, setShippingFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [warningMinutes, setWarningMinutes] = useState(5);
  const [taskDescription, setTaskDescription] = useState("");

  const addItem = () => {
    setItems([...items, { product_name: "", quantity: 1, unit: "kg", price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItemInput, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    return itemsTotal + shippingFee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user from localStorage to auto-assign
      const currentUser = localStorage.getItem("current_user");
      const currentUserId = currentUser ? JSON.parse(currentUser).id : null;

      const input = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items: items.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
        })),
        shipping_fee: shippingFee,
        chip_fee: 0,
        notes: notes || undefined,
        delivery_time: deliveryTime || undefined,
        assigned_to_ids: currentUserId ? [currentUserId] : [],
      };

      console.log("Creating order with input:", input);
      const result = await orderApi.createOrder(input);
      console.log("Order created successfully:", result);

      toast.success("Tạo đơn hàng thành công!");
      resetForm();
      onOpenChange(false);

      // Call onSuccess after dialog is closed to refresh the order list
      console.log("Calling onSuccess to refresh orders...");
      onSuccess();
    } catch (error: any) {
      console.error("Failed to create order:", error);
      toast.error(`Không thể tạo đơn hàng. ${error?.response?.data?.detail || "Vui lòng thử lại!"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setItems([{ product_name: "", quantity: 1, unit: "kg", price: 0 }]);
    setShippingFee(0);
    setNotes("");
    setDeliveryTime("");
    setDeadline("");
    setWarningMinutes(5);
    setTaskDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg text-gray-900">Tạo đơn hàng mới</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Điền thông tin đầy đủ để tạo đơn hàng mới trong hệ thống
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Thông tin khách hàng</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-sm">Tên khách hàng *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Nguyễn Văn A"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone" className="text-sm">Số điện thoại *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="0901234567"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <AddressAutocomplete
              value={customerAddress}
              onChange={setCustomerAddress}
              required
            />
          </div>

          {/* Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Sản phẩm</h3>
              <Button type="button" size="sm" onClick={addItem} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Thêm sản phẩm
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Tên sản phẩm"
                    value={item.product_name}
                    onChange={(e) => updateItem(index, "product_name", e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Số kg"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    required
                    min="0.1"
                    step="0.1"
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Đơn giá"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="1000"
                    className="h-9 text-sm"
                  />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Fees */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Chi phí</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="shippingFee" className="text-sm">Phí ship</Label>
                <Input
                  id="shippingFee"
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1000"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Tổng tiền</Label>
                <div className="h-9 px-3 py-2 border rounded-md bg-muted font-semibold text-sm flex items-center">
                  {calculateTotal().toLocaleString("vi-VN")}đ
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Thông tin bổ sung</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryTime" className="text-sm">Thời gian nhận hàng</Label>
                <Input
                  id="deliveryTime"
                  type="datetime-local"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-sm">Giờ ra đơn</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warningMinutes" className="text-sm">Thời gian cảnh báo (phút)</Label>
              <Input
                id="warningMinutes"
                type="number"
                value={warningMinutes}
                onChange={(e) => setWarningMinutes(parseInt(e.target.value) || 5)}
                min="1"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taskDescription" className="text-sm">Mô tả nhiệm vụ</Label>
              <textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Nhập mô tả nhiệm vụ..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm">Ghi chú</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ghi chú đặc biệt cho đơn hàng..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Tài liệu đính kèm</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">Click để tải lên tài liệu</p>
                  <p className="text-xs text-gray-500 mt-1">Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-sm">
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="h-9 text-sm">
              {isLoading ? "Đang tạo..." : "Tạo đơn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
