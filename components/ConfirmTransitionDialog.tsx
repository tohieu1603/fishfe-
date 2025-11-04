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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";
import { Order, OrderStatus, User } from "@/types";
import { authApi } from "@/lib/api";

interface ConfirmTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  onConfirm: (data?: any) => void;
}

export function ConfirmTransitionDialog({
  open,
  onOpenChange,
  order,
  fromStatus,
  toStatus,
  onConfirm,
}: ConfirmTransitionDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [shopPhone, setShopPhone] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "cod">("transfer");

  // Delivery options
  const [shippingType, setShippingType] = useState<"external" | "company">("external");
  const [shipperName, setShipperName] = useState("");
  const [selectedCompanyShipper, setSelectedCompanyShipper] = useState("");

  // User assignment
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await authApi.getUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    };
    if (open) {
      loadUsers();
    }
  }, [open]);

  const getTransitionConfig = () => {
    // Tạo đơn -> Cân hàng
    if (fromStatus === OrderStatus.CREATED && toStatus === OrderStatus.WEIGHING) {
      return {
        title: "Xác nhận chuyển sang Cân hàng",
        description: "Xác nhận đã cân hàng xong và gửi ảnh cân hàng trước khi tạo phiếu đặt hàng.",
        requireConfirm: true,
        confirmText: "Tôi xác nhận đã in Bill (Phiếu trắng)",
        requireImages: false,
        mustHaveImages: false,
        requirePhone: false,
        requireTime: false,
      };
    }

    // Cân hàng -> Tạo phiếu ĐH
    if (fromStatus === OrderStatus.WEIGHING && toStatus === OrderStatus.CREATE_INVOICE) {
      return {
        title: "Xác nhận chuyển sang Tạo phiếu ĐH",
        description: "Upload ảnh cân hàng (hoặc có thể upload sau trong chi tiết đơn hàng)",
        requireConfirm: true,
        confirmText: "Tôi xác nhận đã cân hàng xong",
        requireImages: true,
        mustHaveImages: false,
        imageType: "weighing",
        imageLabel: "Ảnh cân hàng (tùy chọn)",
        requirePhone: false,
        requireTime: false,
        requireAssignment: true,
      };
    }

    // Tạo phiếu ĐH -> Gửi ảnh cân
    if (fromStatus === OrderStatus.CREATE_INVOICE && toStatus === OrderStatus.SEND_PHOTO) {
      return {
        title: "Xác nhận Gửi ảnh cân cho khách",
        description: "Upload ảnh phiếu đặt hàng và xác nhận đã gửi cho khách (hoặc upload sau trong chi tiết).",
        requireConfirm: true,
        confirmText: "Tôi xác nhận đã gửi ảnh cân cho khách",
        requireImages: true,
        mustHaveImages: false,
        imageType: "invoice",
        imageLabel: "Ảnh phiếu đặt hàng (tùy chọn)",
        requirePhone: false,
        requireTime: false,
        requireAssignment: true,
      };
    }

    // Gửi ảnh cân -> Thanh toán
    if (fromStatus === OrderStatus.SEND_PHOTO && toStatus === OrderStatus.PAYMENT) {
      return {
        title: "Xác nhận chuyển sang Thanh toán",
        description: "Xác nhận đã gửi ảnh cân và bill chuyển khoản cho khách hàng.",
        requireConfirm: true,
        confirmText: "Tôi xác nhận đã gửi ảnh cân và bill chuyển khoản cho khách",
        requireImages: false,
        mustHaveImages: false,
        requirePhone: false,
        requireTime: false,
        requireAssignment: true,
      };
    }

    // Thanh toán -> Vào bếp
    if (fromStatus === OrderStatus.PAYMENT && toStatus === OrderStatus.IN_KITCHEN) {
      return {
        title: "Xác nhận chuyển sang Vào bếp",
        description: "Upload ảnh bill và chọn phương thức thanh toán.",
        requireConfirm: true,
        confirmText: "Tôi xác nhận đã nhận được thanh toán và gửi bill cho khách",
        requireImages: true,
        mustHaveImages: false,
        imageType: "invoice",
        imageLabel: "Ảnh bill thanh toán (tùy chọn)",
        requirePhone: false,
        requireTime: false,
        requirePaymentMethod: true,
        requireAssignment: true,
      };
    }

    // Vào bếp -> Chế biến
    if (fromStatus === OrderStatus.IN_KITCHEN && toStatus === OrderStatus.PROCESSING) {
      return {
        title: "Xác nhận chuyển sang Chế biến",
        description: "Chỉnh thời hạn hoàn thành nếu cần.",
        requireConfirm: false,
        requireImages: false,
        mustHaveImages: false,
        requirePhone: false,
        requireTime: true,
        timeLabel: "Thời hạn hoàn thành",
        requireAssignment: true,
      };
    }

    // Chế biến -> Giao hàng
    if (fromStatus === OrderStatus.PROCESSING && toStatus === OrderStatus.DELIVERY) {
      return {
        title: "Xác nhận chuyển sang Giao hàng",
        description: "Chọn loại ship và nhập thông tin giao hàng.",
        requireConfirm: false,
        requireImages: false,
        mustHaveImages: false,
        requirePhone: false,
        requireTime: true,
        timeLabel: "Thời gian giao hàng mong muốn",
        requireShipping: true,
        requireAssignment: true,
      };
    }

    // Giao hàng -> Hoàn thành
    if (fromStatus === OrderStatus.DELIVERY && toStatus === OrderStatus.COMPLETED) {
      return {
        title: "Xác nhận Hoàn thành",
        description: "Xác nhận đã giao hàng thành công cho khách.",
        requireConfirm: true,
        confirmText: "Tôi xác nhận đã giao hàng thành công",
        requireImages: false,
        mustHaveImages: false,
        requirePhone: false,
        requireTime: false,
      };
    }

    // Default
    return {
      title: "Xác nhận chuyển tiếp",
      description: `Bạn có chắc muốn chuyển đơn #${order.order_number} sang trạng thái tiếp theo?`,
      requireConfirm: false,
      requireImages: false,
      mustHaveImages: false,
      requirePhone: false,
      requireTime: false,
    };
  };

  const config = getTransitionConfig();

  // Auto-check confirmation if required images already exist
  useEffect(() => {
    if (open && config.requireImages && config.imageType) {
      const hasRequiredImages = order.images?.some(
        (img) => img.image_type === config.imageType
      );
      setConfirmed(hasRequiredImages || false);
    } else if (open) {
      setConfirmed(false);
    }
  }, [open, fromStatus, toStatus, order.images, config.requireImages, config.imageType]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const data: any = {};

      // Only include images if new images are uploaded
      if (config.requireImages && images.length > 0) {
        data.images = images;
        data.imageType = config.imageType;
      }

      if (config.requirePhone && shopPhone) {
        data.shopPhone = shopPhone;
      }

      if (config.requireTime && deliveryTime) {
        data.deliveryTime = deliveryTime;
      }

      // Handle shipping info
      if (config.requireShipping) {
        data.shippingType = shippingType;
        if (shippingType === "external") {
          data.shipperName = shipperName;
          data.shipperPhone = shopPhone;
        } else if (shippingType === "company") {
          data.companyShipper = selectedCompanyShipper;
        }
      }

      // Handle payment method
      if (config.requirePaymentMethod) {
        data.paymentMethod = paymentMethod;
      }

      // Handle user assignment
      if (config.requireAssignment && selectedUserId) {
        data.responsibleUserId = selectedUserId;
      }

      await onConfirm(data);
      handleClose();
    } catch (error) {
      console.error("Failed to confirm transition:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setImages([]);
    setShopPhone("");
    setDeliveryTime("");
    setPaymentMethod("transfer");
    setShippingType("external");
    setShipperName("");
    setSelectedCompanyShipper("");
    setSelectedUserId(null);
    onOpenChange(false);
  };

  const canConfirm = () => {
    if (config.requireConfirm && !confirmed) return false;
    if (config.requirePhone && !shopPhone) return false;

    // Check shipping info
    if (config.requireShipping) {
      if (shippingType === "external") {
        // External shipping requires phone
        if (!shopPhone) return false;
      } else if (shippingType === "company") {
        // Company shipping requires selection
        if (!selectedCompanyShipper) return false;
      }
    }

    // Check if images are required and must have them
    if (config.mustHaveImages === true) {
      // Check if images already exist in order
      const hasExistingImages = order.images?.some(
        (img) => img.image_type === config.imageType
      );
      // If no existing images, must upload new ones
      if (!hasExistingImages && images.length === 0) return false;
    }

    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white max-h-[90vh] sm:max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-base sm:text-lg text-gray-900">{config.title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600">{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 overflow-y-auto flex-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Order Info */}
          <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">Số đơn:</p>
                <p className="text-sm sm:text-base font-bold text-gray-900">#{order.order_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-600">Khách hàng:</p>
                <p className="font-medium text-gray-900 truncate">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Tổng tiền:</p>
                <p className="font-medium text-gray-900">
                  {(order.total_amount || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          {config.requireConfirm && (
            <div className="flex items-start space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                className="mt-0.5 h-5 w-5 sm:h-4 sm:w-4"
              />
              <label
                htmlFor="confirm"
                className="text-xs sm:text-sm font-medium text-orange-900 cursor-pointer leading-tight flex-1"
              >
                {config.confirmText}
              </label>
            </div>
          )}

          {/* Image Upload */}
          {config.requireImages && (() => {
            const hasExistingImages = order.images?.some(
              (img) => img.image_type === config.imageType
            );
            const existingImagesCount = order.images?.filter(
              (img) => img.image_type === config.imageType
            ).length || 0;

            return (
              <div className="space-y-2">
                <Label htmlFor="images" className="text-xs sm:text-sm font-medium">
                  {config.imageLabel}
                </Label>

                {/* Show existing images status */}
                {hasExistingImages && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
                    <p className="text-xs sm:text-sm text-green-800 font-medium">
                      ✓ Đã có {existingImagesCount} ảnh trong đơn hàng
                    </p>
                    <p className="text-[10px] sm:text-xs text-green-600 mt-1">
                      Bạn có thể bỏ qua upload ảnh mới
                    </p>
                  </div>
                )}

                {/* Show warning if no images exist and required */}
                {!hasExistingImages && config.mustHaveImages === true && (
                  <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                    * Bắt buộc phải có ảnh để chuyển sang bước tiếp theo
                  </p>
                )}

                <div className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center hover:border-gray-400 transition-colors ${
                  !hasExistingImages && config.mustHaveImages === true ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="images" className="cursor-pointer block">
                    <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                    {images.length > 0 ? (
                      <p className="text-xs sm:text-sm text-gray-900 font-medium">
                        {images.length} ảnh mới đã chọn
                      </p>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {hasExistingImages
                            ? "Nhấp để thêm ảnh mới (tùy chọn)"
                            : "Nhấp để chọn ảnh hoặc kéo thả vào đây"}
                        </p>
                        {config.mustHaveImages !== true && !hasExistingImages && (
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Có thể bỏ qua và upload sau trong chi tiết</p>
                        )}
                      </>
                    )}
                  </label>
                </div>
              </div>
            );
          })()}

          {/* Payment Method */}
          {config.requirePaymentMethod && (
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Phương thức thanh toán *</Label>
              <div className="flex flex-col gap-2.5 sm:gap-2">
                <label className="flex items-center space-x-2 cursor-pointer p-2.5 sm:p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value as "cash" | "transfer" | "cod")}
                    className="w-4 h-4"
                  />
                  <span className="text-xs sm:text-sm flex-1">Chuyển khoản</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-2.5 sm:p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value as "cash" | "transfer" | "cod")}
                    className="w-4 h-4"
                  />
                  <span className="text-xs sm:text-sm flex-1">Tiền mặt</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-2.5 sm:p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value as "cash" | "transfer" | "cod")}
                    className="w-4 h-4"
                  />
                  <span className="text-xs sm:text-sm flex-1">COD (Thu hộ)</span>
                </label>
              </div>
            </div>
          )}

          {/* Shipping Options */}
          {config.requireShipping && (
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Loại ship *</Label>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingType"
                      value="external"
                      checked={shippingType === "external"}
                      onChange={(e) => setShippingType(e.target.value as "external" | "company")}
                      className="w-4 h-4 sm:w-4 sm:h-4"
                    />
                    <span className="text-xs sm:text-sm">Ship ngoài</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingType"
                      value="company"
                      checked={shippingType === "company"}
                      onChange={(e) => setShippingType(e.target.value as "external" | "company")}
                      className="w-4 h-4 sm:w-4 sm:h-4"
                    />
                    <span className="text-xs sm:text-sm">Ship công ty</span>
                  </label>
                </div>
              </div>

              {shippingType === "external" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shipperName" className="text-xs sm:text-sm font-medium">
                      Tên ship (tùy chọn)
                    </Label>
                    <Input
                      id="shipperName"
                      type="text"
                      placeholder="Nhập tên shipper"
                      value={shipperName}
                      onChange={(e) => setShipperName(e.target.value)}
                      className="h-11 sm:h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopPhone" className="text-xs sm:text-sm font-medium">
                      Số điện thoại *
                    </Label>
                    <Input
                      id="shopPhone"
                      type="tel"
                      placeholder="0901234567"
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      className="h-11 sm:h-9 text-sm"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="companyShipper" className="text-xs sm:text-sm font-medium">
                    Chọn shipper công ty *
                  </Label>
                  <select
                    id="companyShipper"
                    value={selectedCompanyShipper}
                    onChange={(e) => setSelectedCompanyShipper(e.target.value)}
                    className="w-full h-11 sm:h-9 px-3 border border-gray-300 rounded-md text-xs sm:text-sm"
                    required
                  >
                    <option value="">-- Chọn shipper --</option>
                    <option value="shipper1">Nguyễn Văn A - 0901234567</option>
                    <option value="shipper2">Trần Thị B - 0912345678</option>
                    <option value="shipper3">Lê Văn C - 0923456789</option>
                  </select>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Chọn shipper công ty từ danh sách
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Phone Input (for non-shipping cases) */}
          {config.requirePhone && !config.requireShipping && (
            <div className="space-y-2">
              <Label htmlFor="shopPhone" className="text-xs sm:text-sm font-medium">
                Số điện thoại *
              </Label>
              <Input
                id="shopPhone"
                type="tel"
                placeholder="0901234567"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="h-11 sm:h-9 text-sm"
                required
              />
            </div>
          )}

          {/* Time Input */}
          {config.requireTime && (
            <div className="space-y-2">
              <Label htmlFor="deliveryTime" className="text-xs sm:text-sm font-medium">
                {config.timeLabel}
              </Label>
              <Input
                id="deliveryTime"
                type="datetime-local"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="h-11 sm:h-9 text-sm"
              />
              <p className="text-[10px] sm:text-xs text-gray-500">Để trống nếu giữ nguyên thời gian hiện tại</p>
            </div>
          )}

          {/* User Assignment */}
          {config.requireAssignment && (
            <div className="space-y-2">
              <Label htmlFor="assignUser" className="text-xs sm:text-sm font-medium">
                Người chịu trách nhiệm (tùy chọn)
              </Label>
              <select
                id="assignUser"
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full h-11 sm:h-9 px-3 border border-gray-300 rounded-md text-xs sm:text-sm"
              >
                <option value="">-- Chọn người chịu trách nhiệm --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} (@{user.username}) - {user.role}
                  </option>
                ))}
              </select>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Chọn người sẽ chịu trách nhiệm cho giai đoạn này
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 sm:pt-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-t border-gray-100 mt-3 sm:mt-0 sm:border-t-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-11 sm:h-9 text-sm font-medium flex-1 sm:flex-initial"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm() || isLoading}
            className="h-11 sm:h-9 bg-black text-white hover:bg-gray-800 text-sm font-medium flex-1 sm:flex-initial"
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận chuyển tiếp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
