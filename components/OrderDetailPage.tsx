"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Printer, Clock, ChevronRight, Upload, Trash2, Users, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus, OrderActivity } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { orderApi } from "@/lib/api";
import { ConfirmTransitionDialog } from "@/components/ConfirmTransitionDialog";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { OrderProgressTimeline } from "@/components/OrderProgressTimeline";
import { SwipeButton } from "@/components/SwipeButton";
import { PrintDialog } from "@/components/PrintDialog";
import { AssignUsersDialog } from "@/components/AssignUsersDialog";
import { CreateOrderDialog } from "@/components/CreateOrderDialog";
import { OrderChat } from "@/components/OrderChat";
import { getNextStatus } from "@/lib/constants";
import { toast } from "sonner";

interface OrderDetailPageProps {
  orderId: number;
  onClose: () => void;
}

// Helper function to get full image URL
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return "";

  // If already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Backend now returns pre-encoded URLs like /media/orders/2025/11/10/filename.png
  // Just prepend the domain
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // If path starts with /, just append to domain
  if (imagePath.startsWith("/")) {
    return `${apiUrl}${imagePath}`;
  }

  // Otherwise add leading slash
  return `${apiUrl}/${imagePath}`;
};

export function OrderDetailPage({ orderId, onClose }: OrderDetailPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "products" | "images" | "activities" | "chat">("info");
  const [isLoading, setIsLoading] = useState(true);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchOrderDetail();
    fetchActivities();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const data = await orderApi.getOrderById(orderId);
      console.log("Order data:", data);
      console.log("Images:", data.images);
      setOrder(data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await orderApi.getOrderActivities(orderId);
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const handleOrderTransition = async (newStatus: OrderStatus, data?: any) => {
    if (!order) return;

    try {
      // Upload images if provided
      if (data?.images && data.images.length > 0) {
        for (const image of data.images) {
          await orderApi.uploadOrderImage(order.id, image, data.imageType || "other");
        }
      }

      // Ensure new_status is sent as string value
      const payload: any = {
        new_status: String(newStatus),
      };

      // Only add failure_reason if provided
      if (data?.failure_reason) {
        payload.failure_reason = String(data.failure_reason);
      }

      console.log("Transition payload:", payload, "Original:", newStatus, "Type:", typeof newStatus);

      await orderApi.updateOrderStatus(order.id, payload);
      await fetchOrderDetail();
      setShowTransitionDialog(false);
      toast.success("Chuyển trạng thái thành công!");
    } catch (error: any) {
      console.error("Failed to transition order:", error);
      console.error("Error response data:", error?.response?.data);
      console.error("Error detail:", error?.response?.data?.detail);
      toast.error(`Không thể chuyển trạng thái. ${error?.response?.data?.detail || "Vui lòng thử lại!"}`);
    }
  };

  const handleAssignUsers = async (userIds: number[]) => {
    if (!order) return;

    try {
      await orderApi.updateAssignedUsers(order.id, userIds);
      await fetchOrderDetail();
      toast.success("Phân công nhân viên thành công!");
    } catch (error: any) {
      console.error("Failed to update assigned users:", error);
      toast.error(`Không thể phân công nhân viên. ${error?.response?.data?.detail || "Vui lòng thử lại!"}`);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !e.target.files || e.target.files.length === 0) return;

    setUploadingImages(true);
    try {
      const files = Array.from(e.target.files);

      // Determine image type based on current order status
      let imageType = "other";
      if (order.status === OrderStatus.WEIGHING) {
        imageType = "weighing";
      } else if (order.status === OrderStatus.CREATE_INVOICE) {
        imageType = "invoice";
      }

      for (const file of files) {
        await orderApi.uploadOrderImage(order.id, file, imageType);
      }
      await fetchOrderDetail();
      toast.success(`Đã upload ${files.length} ảnh thành công!`);
    } catch (error: any) {
      console.error("Failed to upload images:", error);
      toast.error(`Không thể upload ảnh. ${error?.response?.data?.detail || "Vui lòng thử lại!"}`);
    } finally {
      setUploadingImages(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!order) return;

    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    try {
      await orderApi.deleteOrderImage(order.id, imageId);
      await fetchOrderDetail();
      toast.success("Đã xóa ảnh thành công!");
    } catch (error: any) {
      console.error("Failed to delete image:", error);
      toast.error(`Không thể xóa ảnh. ${error?.response?.data?.detail || "Vui lòng thử lại!"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Không tìm thấy đơn hàng</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "created":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      created: "Tạo đơn",
      weighing: "Cân hàng",
      create_invoice: "Tạo phiếu ĐH",
      send_photo: "Gửi ảnh cân",
      payment: "Thanh toán",
      in_kitchen: "Vào bếp",
      processing: "Chế biến",
      delivery: "Giao hàng",
      completed: "Hoàn thành",
      failed: "Thất bại",
    };
    return statusMap[status] || status;
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 md:px-6 py-2.5 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">Đơn {order.order_number}</h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                  Tạo lúc: {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-xs whitespace-nowrap`}>{getStatusLabel(order.status)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Sửa đơn
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={() => setShowPrintDialog(true)}
              >
                <Printer className="h-4 w-4 mr-2" />
                In phiếu
              </Button>
              {/* Hide transition button on mobile - use swipe button instead */}
              {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.FAILED && (
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 hidden md:flex"
                  onClick={() => setShowTransitionDialog(true)}
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Chuyển tiếp
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3 md:gap-6 p-3 md:p-6 pb-24 md:pb-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 mb-3 md:mb-4">
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex min-w-max">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-medium border-b-2 ${
                    activeTab === "info"
                      ? "border-black text-black"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Thông tin đơn
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-medium border-b-2 ${
                    activeTab === "products"
                      ? "border-black text-black"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sản phẩm
                </button>
                <button
                  onClick={() => setActiveTab("images")}
                  className={`px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-medium border-b-2 ${
                    activeTab === "images"
                      ? "border-black text-black"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Hình ảnh
                </button>
                <button
                  onClick={() => setActiveTab("activities")}
                  className={`px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-medium border-b-2 ${
                    activeTab === "activities"
                      ? "border-black text-black"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Lịch sử
                  {activities.length > 0 && (
                    <span className="ml-1.5 md:ml-2 px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs bg-gray-200 text-gray-700 rounded-full">
                      {activities.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-medium border-b-2 ${
                    activeTab === "chat"
                      ? "border-black text-black"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  💬 Thảo luận
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-3 md:p-6">
              {activeTab === "info" && (
                <div className="space-y-6">
                  {/* Order Basic Info - Blue box like in image */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700 font-medium mb-1">Thời gian nhận hàng</p>
                        <p className="text-blue-900 font-semibold">
                          {order.delivery_time
                            ? new Date(order.delivery_time).toLocaleString("vi-VN")
                            : "Chưa xác định"}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium mb-1">Thời hạn giai đoạn</p>
                        <p className="text-blue-900 font-semibold">
                          {order.deadline ? new Date(order.deadline).toLocaleString("vi-VN") : "Chưa có"}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium mb-1">Giai đoạn hiện tại</p>
                        <p className="text-blue-900 font-semibold">{getStatusLabel(order.status)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trường tùy chỉnh - Custom Fields */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">ĐƠN VÀO CHỢ - TRƯỜNG DỮ LIỆU KHI NHẬP MỚI</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-4 gap-4 text-sm pb-2 border-b border-gray-100">
                        <div>
                          <span className="text-gray-600 block mb-1">01</span>
                          <span className="text-gray-900 font-medium">Thời gian nhận hàng</span>
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-900 font-medium mt-5">
                            {order.delivery_time
                              ? new Date(order.delivery_time).toLocaleString("vi-VN")
                              : "Chưa xác định"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm pb-2 border-b border-gray-100">
                        <div>
                          <span className="text-gray-600 block mb-1">02</span>
                          <span className="text-gray-900 font-medium">Tên KH</span>
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-900 font-medium mt-5">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm pb-2 border-b border-gray-100">
                        <div>
                          <span className="text-gray-600 block mb-1">03</span>
                          <span className="text-gray-900 font-medium">SĐT tích điểm</span>
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-900 font-medium mt-5">{order.customer_phone}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm pb-2 border-b border-gray-100">
                        <div>
                          <span className="text-gray-600 block mb-1">04</span>
                          <span className="text-gray-900 font-medium">SĐT nhận hàng</span>
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-900 font-medium mt-5">{order.customer_phone}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm pb-2 border-b border-gray-100">
                        <div>
                          <span className="text-gray-600 block mb-1">05</span>
                          <span className="text-gray-900 font-medium">Địa chỉ</span>
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-900 font-medium mt-5">{order.customer_address || "Chưa có"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">MÔ TẢ</h3>
                    </div>
                    <div className="p-4">
                      {order.notes ? (
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Không có mô tả</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">TỔNG THỜI GIAN</h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đã sử dụng:</span>
                          <span className="font-medium text-gray-900">
                            {order.created_at
                              ? `${Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)} phút`
                              : "0 phút"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Còn lại:</span>
                          <span className="font-medium text-orange-600">
                            {order.deadline
                              ? `${Math.max(0, Math.floor((new Date(order.deadline).getTime() - Date.now()) / 60000))} phút`
                              : "∞"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "products" && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Chi tiết đơn hàng - Danh sách sản phẩm</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">STT</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tên sản phẩm</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Số lượng</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Đơn vị</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Đơn giá</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {order.items?.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                            <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{item.unit}</td>
                            <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(Number(item.quantity) * Number(item.price))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-900">
                            Tổng cộng:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-gray-900">
                            {formatCurrency(
                              order.items?.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0) || 0
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "images" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Hình ảnh đính kèm</h3>
                    <div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImages}
                      />
                      <Button
                        size="sm"
                        onClick={() => document.getElementById("image-upload")?.click()}
                        disabled={uploadingImages}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingImages ? "Đang upload..." : "Upload ảnh"}
                      </Button>
                    </div>
                  </div>

                  {order.images && order.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {order.images.map((image, index) => {
                        const imageUrl = getImageUrl(image.image);
                        console.log(`Image ${index + 1}:`, {
                          original: image.image,
                          fullUrl: imageUrl,
                          type: image.image_type
                        });
                        return (
                          <div key={image.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                            <img
                              src={imageUrl}
                              alt={`Order image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error("Failed to load image:", image.image, "Full URL:", imageUrl);
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                              onLoad={() => {
                                console.log("Successfully loaded image:", imageUrl);
                              }}
                            />
                            {/* Image info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="font-semibold">{image.image_type}</div>
                              {image.uploaded_by && (
                                <div className="text-xs opacity-90">
                                  Bởi: {image.uploaded_by.full_name || image.uploaded_by.username}
                                </div>
                              )}
                            </div>
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">Chưa có hình ảnh</p>
                      <p className="text-xs text-gray-500">Click "Upload ảnh" để thêm hình ảnh</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "activities" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Lịch sử hoạt động</h3>
                  <ActivityTimeline activities={activities} />
                </div>
              )}

              {activeTab === "chat" && (
                <div>
                  <OrderChat orderId={orderId} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Sidebar - Desktop only */}
        <div className="w-80 hidden md:block">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">Tiến trình chi tiết</h3>
            </div>

            {order.deadline && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {Math.max(
                    0,
                    Math.floor((new Date(order.deadline).getTime() - Date.now()) / 60000)
                  )}{" "}
                  phút
                </p>
                <p className="text-xs text-orange-700 mt-1">Đến hạn lúc {new Date(order.deadline).toLocaleTimeString("vi-VN")}</p>
              </div>
            )}

            <div className="mb-4">
              <OrderProgressTimeline
                order={order}
                onTransition={() => setShowTransitionDialog(true)}
              />
            </div>

            {/* Assigned Users */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Nhân viên CSKH</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignDialog(true)}
                  className="h-7 text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Phân công lại
                </Button>
              </div>
              {order.assigned_to && order.assigned_to.length > 0 ? (
                <div className="space-y-2">
                  {order.assigned_to.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">{user.full_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa phân công</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transition Dialog */}
      {showTransitionDialog && (
        <ConfirmTransitionDialog
          open={showTransitionDialog}
          onOpenChange={setShowTransitionDialog}
          order={order}
          fromStatus={order.status as OrderStatus}
          toStatus={getNextStatus(order.status as OrderStatus) || OrderStatus.COMPLETED}
          onConfirm={(data) => {
            const nextStatus = getNextStatus(order.status as OrderStatus) || OrderStatus.COMPLETED;
            return handleOrderTransition(nextStatus, data);
          }}
        />
      )}

      {/* Print Dialog */}
      <PrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        order={order}
      />

      {/* Assign Users Dialog */}
      <AssignUsersDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        currentAssignedUsers={order.assigned_to || []}
        onConfirm={handleAssignUsers}
      />

      {/* Edit Order Dialog */}
      <CreateOrderDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editMode={true}
        orderToEdit={order}
        onSuccess={() => {
          setShowEditDialog(false);
          console.log('✅ Order updated - WebSocket will refresh the order automatically');
        }}
      />

      {/* Bottom Swipe Action Bar - Mobile Friendly */}
      {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.FAILED && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-20 shadow-2xl">
          <SwipeButton
            text={`Vuốt để chuyển sang: ${getNextStatus(order.status as OrderStatus) ? getStatusLabel(getNextStatus(order.status as OrderStatus)!) : "Hoàn thành"}`}
            onSwipeComplete={() => setShowTransitionDialog(true)}
          />
        </div>
      )}
    </div>
  );
}
