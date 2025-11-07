"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Printer, Clock, Upload, Trash2, Users, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order, OrderActivity, OrderStatus } from "@/types";
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
import { getNextStatus, getProcessStage } from "@/lib/constants";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Helper function to get full image URL
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const baseUrl = apiUrl.replace("/api", "");
  if (cleanPath.startsWith("media/")) {
    return `${baseUrl}/${cleanPath}`;
  }
  return `${baseUrl}/media/${cleanPath}`;
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.id as string);

  const [order, setOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "products" | "images" | "activities" | "chat">("info");
  const [isLoading, setIsLoading] = useState(true);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activities, setActivities] = useState<OrderActivity[]>([]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchActivities();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const data = await orderApi.getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Không thể tải thông tin đơn hàng");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await orderApi.getOrderActivities(orderId);
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleStatusTransition = async (data?: any) => {
    if (!order) return;

    const nextStatusValue = getNextStatus(order.status);
    if (!nextStatusValue) return;

    const nextStage = getProcessStage(nextStatusValue);
    if (!nextStage) return;

    try {
      await orderApi.updateOrderStatus(orderId, {
        new_status: nextStatusValue,
        ...data,
      });
      await fetchOrder();
      await fetchActivities();
      toast.success(`Đã chuyển sang: ${nextStage.label}`);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.detail || "Không thể cập nhật trạng thái");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      for (const file of Array.from(files)) {
        await orderApi.uploadOrderImage(orderId, file, "other");
      }
      await fetchOrder();
      toast.success("Đã tải ảnh lên");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    try {
      await orderApi.deleteOrderImage(orderId, imageId);
      await fetchOrder();
      toast.success("Đã xóa ảnh");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Không thể xóa ảnh");
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Không tìm thấy đơn hàng</p>
              <Button onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const nextStatusValue = getNextStatus(order.status);
  const nextStatus = nextStatusValue ? getProcessStage(nextStatusValue) : null;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-full flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/")}
                    className="shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-bold truncate">{order.order_number}</h1>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrintDialog(true)}
                    className="hidden md:flex"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Edit className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Sửa</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-t">
              {[
                { id: "info", label: "Thông tin" },
                { id: "products", label: "Sản phẩm" },
                { id: "images", label: "Hình ảnh" },
                { id: "activities", label: "Hoạt động" },
                { id: "chat", label: "Chat" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content - Desktop: 2 columns, Mobile: stacked */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content - Left Side */}
                <div className="flex-1 space-y-4">
                  {/* Progress Timeline - Mobile Only (at top) */}
                  <div className="lg:hidden bg-white rounded-lg shadow-sm p-4">
                    <h2 className="text-base font-semibold mb-4">Tiến độ đơn hàng</h2>
                    <OrderProgressTimeline
                      order={order}
                      onTransition={() => setShowTransitionDialog(true)}
                    />
                  </div>

                  {/* Info Tab */}
                  {activeTab === "info" && (
                    <>
                      {/* Order Info Card */}
                      <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-4 border-b">
                          <h2 className="text-base font-semibold">Thông tin khách hàng</h2>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Khách hàng</p>
                            <p className="font-medium text-sm">{order.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                            <p className="font-medium text-sm">{order.customer_phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Địa chỉ giao hàng</p>
                            <p className="font-medium text-sm">{order.customer_address}</p>
                          </div>
                          {order.delivery_time && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Thời gian giao</p>
                              <p className="font-medium text-sm flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(order.delivery_time).toLocaleString("vi-VN")}
                              </p>
                            </div>
                          )}
                          {order.notes && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                              <p className="text-sm bg-gray-50 p-2 rounded">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Products Card */}
                      <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-4 border-b">
                          <h2 className="text-base font-semibold">Sản phẩm đặt hàng</h2>
                        </div>
                        <div className="p-4">
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-start pb-3 border-b last:border-0">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{item.product_name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {item.quantity} {item.unit} × {formatCurrency(item.price)}
                                  </p>
                                  {item.note && (
                                    <p className="text-xs text-gray-400 mt-1 bg-gray-50 px-2 py-1 rounded inline-block">
                                      {item.note}
                                    </p>
                                  )}
                                </div>
                                <p className="font-semibold text-sm ml-4">{formatCurrency(item.total_price)}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tạm tính</span>
                              <span className="font-medium">{formatCurrency(Number(order.subtotal || 0))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Phí vận chuyển</span>
                              <span className="font-medium">{formatCurrency(Number(order.shipping_fee))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Phí chip</span>
                              <span className="font-medium">{formatCurrency(Number(order.chip_fee))}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 border-t">
                              <span>Tổng cộng</span>
                              <span className="text-blue-600">{formatCurrency(Number(order.total))}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assigned Users */}
                      {order.assigned_to && order.assigned_to.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm">
                          <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-base font-semibold">Người phụ trách</h2>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAssignDialog(true)}
                            >
                              <Users className="h-3.5 w-3.5 mr-1.5" />
                              Chỉnh sửa
                            </Button>
                          </div>
                          <div className="p-4 flex flex-wrap gap-2">
                            {order.assigned_to.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                              >
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.full_name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium">{user.full_name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Products Tab */}
                  {activeTab === "products" && (
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                      <h2 className="text-lg font-semibold mb-4">Sản phẩm</h2>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start border-b pb-3 last:border-0">
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-gray-500">
                                {item.quantity} {item.unit} × {formatCurrency(item.price)}
                              </p>
                              {item.note && (
                                <p className="text-xs text-gray-400 mt-1">Ghi chú: {item.note}</p>
                              )}
                            </div>
                            <p className="font-medium">{formatCurrency(item.total_price)}</p>
                          </div>
                        ))}
                        <div className="pt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tạm tính</span>
                            <span>{formatCurrency(Number(order.subtotal || 0))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Phí vận chuyển</span>
                            <span>{formatCurrency(Number(order.shipping_fee))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Phí chip</span>
                            <span>{formatCurrency(Number(order.chip_fee))}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Tổng cộng</span>
                            <span>{formatCurrency(Number(order.total))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Images Tab */}
                  {activeTab === "images" && (
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Hình ảnh</h2>
                        <Button size="sm" onClick={() => document.getElementById("image-upload")?.click()} disabled={uploadingImages}>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImages ? "Đang tải..." : "Tải lên"}
                        </Button>
                        <input
                          id="image-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      {order.images && order.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {order.images.map((image) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={getImageUrl(image.image)}
                                alt=""
                                className="w-full h-40 object-cover rounded-lg cursor-pointer"
                                onClick={() => setSelectedImage(getImageUrl(image.image))}
                              />
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">Chưa có hình ảnh</p>
                      )}
                    </div>
                  )}

                  {/* Activities Tab */}
                  {activeTab === "activities" && (
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                      <h2 className="text-lg font-semibold mb-4">Lịch sử hoạt động</h2>
                      <ActivityTimeline activities={activities} />
                    </div>
                  )}

                  {/* Chat Tab */}
                  {activeTab === "chat" && (
                    <div className="bg-white rounded-lg shadow-sm h-[600px]">
                      <OrderChat orderId={orderId} />
                    </div>
                  )}
                </div>

                {/* Right Sidebar - Progress Timeline (Desktop Only) */}
                <div className="hidden lg:block lg:w-96 shrink-0">
                  <div className="sticky top-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h2 className="text-base font-semibold mb-4">Tiến độ đơn hàng</h2>
                      <OrderProgressTimeline
                        order={order}
                        onTransition={() => setShowTransitionDialog(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Button - Mobile */}
          {nextStatus && (
            <div className="md:hidden sticky bottom-0 bg-white border-t p-4">
              <SwipeButton
                onSwipeComplete={() => setShowTransitionDialog(true)}
                text={`Chuyển sang: ${nextStatus.label}`}
              />
            </div>
          )}
        </div>

        {/* Dialogs */}
        <ConfirmTransitionDialog
          open={showTransitionDialog}
          onOpenChange={setShowTransitionDialog}
          order={order}
          fromStatus={order.status}
          toStatus={nextStatusValue || OrderStatus.COMPLETED}
          onConfirm={handleStatusTransition}
        />

        <PrintDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          order={order}
        />

        <AssignUsersDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          currentAssignedUsers={order.assigned_to || []}
          onConfirm={async (userIds) => {
            await orderApi.updateAssignedUsers(orderId, userIds);
            await fetchOrder();
            toast.success("Đã cập nhật người phụ trách");
          }}
        />

        <CreateOrderDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={fetchOrder}
          editMode={true}
          orderToEdit={order}
        />

        {/* Image Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <img src={selectedImage} alt="" className="max-w-full max-h-full" />
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
