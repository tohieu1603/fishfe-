"use client";

import { useState, useEffect } from "react";
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
import { Order } from "@/types";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMode?: boolean;
  orderToEdit?: Order | null;
}

interface OrderItemInput {
  product_id?: number;
  product_name: string;
  quantity: number;
  unit: string;
  price: number;
  note?: string;
}

export function CreateOrderDialog({ open, onOpenChange, onSuccess, editMode = false, orderToEdit = null }: CreateOrderDialogProps) {
  // Helper function to get current datetime in local format for input
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loyaltyPhone, setLoyaltyPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("Hà Nội, ");
  const [items, setItems] = useState<OrderItemInput[]>([
    { product_name: "", quantity: 1, unit: "kg", price: 0 },
  ]);
  const [shippingFee, setShippingFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [deliveryTime, setDeliveryTime] = useState(getCurrentDateTime());
  const [receivedTime, setReceivedTime] = useState("");
  const [kitchenTime, setKitchenTime] = useState("");

  // Employee assignment states
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Auto-select current user when dialog opens
  useEffect(() => {
    if (open) {
      const currentUser = localStorage.getItem("current_user");
      if (currentUser) {
        const userId = JSON.parse(currentUser).id;
        setSelectedUserIds([userId]);
      }
    }
  }, [open]);

  // Helper function to format datetime for input field
  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return getCurrentDateTime();
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Populate form when in edit mode
  useEffect(() => {
    if (editMode && orderToEdit && open) {
      setCustomerName(orderToEdit.customer_name || "");
      setCustomerPhone(orderToEdit.customer_phone || "");
      setCustomerAddress(orderToEdit.customer_address || "Hà Nội, ");
      setLoyaltyPhone(orderToEdit.loyalty_phone || "");

      // Populate items
      if (orderToEdit.items && orderToEdit.items.length > 0) {
        setItems(orderToEdit.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          note: item.note || ""
        })));
      }

      setShippingFee(typeof orderToEdit.shipping_fee === 'number' ? orderToEdit.shipping_fee : parseFloat(String(orderToEdit.shipping_fee)) || 0);
      setNotes(orderToEdit.notes || "");
      setDeliveryTime(formatDateTimeForInput(orderToEdit.delivery_time || ""));

      // Populate assigned users
      if (orderToEdit.assigned_to && orderToEdit.assigned_to.length > 0) {
        setSelectedUserIds(orderToEdit.assigned_to.map(u => u.id));
      }
    } else if (!editMode && open) {
      // Reset form when creating new order
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("Hà Nội, ");
      setLoyaltyPhone("");
      setItems([{ product_name: "", quantity: 1, unit: "kg", price: 0 }]);
      setShippingFee(0);
      setNotes("");
      setDeliveryTime(getCurrentDateTime());

      // Auto-select current user for new orders
      const currentUser = localStorage.getItem("current_user");
      if (currentUser) {
        const userId = JSON.parse(currentUser).id;
        setSelectedUserIds([userId]);
      }
    }
  }, [editMode, orderToEdit, open]);


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
      const input = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items: items.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          note: item.note || undefined,
        })),
        shipping_fee: shippingFee,
        chip_fee: 0,
        notes: notes || undefined,
        received_time: receivedTime || undefined,
        kitchen_time: kitchenTime || undefined,
        delivery_time: deliveryTime || undefined,
        assigned_to_ids: selectedUserIds,
      };

      if (editMode && orderToEdit) {
        // Update existing order
        console.log("Updating order with input:", input);
        const result = await orderApi.updateOrder(orderToEdit.id, input);
        console.log("Order updated successfully:", result);
        toast.success("Cập nhật đơn hàng thành công!");
      } else {
        // Create new order
        console.log("Creating order with input:", input);
        const result = await orderApi.createOrder(input);
        console.log("Order created successfully:", result);
        toast.success("Tạo đơn hàng thành công!");
      }

      resetForm();
      onOpenChange(false);

      // Call onSuccess after dialog is closed - WebSocket will handle the update
      console.log("Calling onSuccess - WebSocket will refresh the order...");
      onSuccess();
    } catch (error: unknown) {
      console.error(`Failed to ${editMode ? 'update' : 'create'} order:`, error);
      const errorMessage = error instanceof Error ? error.message : "Vui lòng thử lại!";
      toast.error(`Không thể ${editMode ? 'cập nhật' : 'tạo'} đơn hàng. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setLoyaltyPhone("");
    setCustomerAddress("Hà Nội, ");
    setItems([{ product_name: "", quantity: 1, unit: "kg", price: 0 }]);
    setShippingFee(0);
    setNotes("");
    setDeliveryTime(getCurrentDateTime());
    // Reset to current user
    const currentUser = localStorage.getItem("current_user");
    if (currentUser) {
      const userId = JSON.parse(currentUser).id;
      setSelectedUserIds([userId]);
    } else {
      setSelectedUserIds([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg text-gray-900">
            {editMode ? "Sửa đơn hàng" : "Tạo đơn hàng mới"}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-gray-600">
            {editMode ? "Cập nhật thông tin đơn hàng" : "Điền thông tin để tạo đơn hàng mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm md:text-base">Thông tin khách hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-xs md:text-sm">Tên khách hàng *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Nguyễn Văn A"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone" className="text-xs md:text-sm">Số điện thoại *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="0901234567"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </div>
            <AddressAutocomplete
              value={customerAddress}
              onChange={setCustomerAddress}
              required
            />
          </div>


          {/* Products - Simplified */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm md:text-base">Sản phẩm</h3>
              <Button type="button" size="sm" onClick={addItem} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Thêm món</span>
                <span className="sm:hidden">Thêm</span>
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                <div className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs md:text-sm font-medium">Tên món *</Label>
                      <Input
                        placeholder="Nhập tên món"
                        value={item.product_name}
                        onChange={(e) => updateItem(index, "product_name", e.target.value)}
                        required
                        className="h-9 md:h-10 text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs md:text-sm font-medium">Ghi chú món</Label>
                      <textarea
                        placeholder="VD: nướng mơi, làm chín vừa..."
                        value={item.note || ""}
                        onChange={(e) => updateItem(index, "note", e.target.value)}
                        rows={2}
                        className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 shrink-0"
                      title="Xóa món"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notes & Delivery Time */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs md:text-sm font-medium">Ghi chú đơn hàng</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Ghi chú đặc biệt cho đơn hàng..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="receivedTime" className="text-xs md:text-sm font-medium">Thời gian nhận hàng</Label>
              <Input
                id="receivedTime"
                type="datetime-local"
                value={receivedTime}
                onChange={(e) => setReceivedTime(e.target.value)}
                className="h-9 md:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kitchenTime" className="text-xs md:text-sm font-medium">Thời gian vào bếp</Label>
              <Input
                id="kitchenTime"
                type="datetime-local"
                value={kitchenTime}
                onChange={(e) => setKitchenTime(e.target.value)}
                className="h-9 md:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryTime" className="text-xs md:text-sm font-medium">Thời gian giao hàng</Label>
              <Input
                id="deliveryTime"
                type="datetime-local"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="h-9 md:h-10 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-sm">
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="h-9 text-sm">
              {isLoading
                ? (editMode ? "Đang cập nhật..." : "Đang tạo...")
                : (editMode ? "Cập nhật" : "Tạo đơn")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
