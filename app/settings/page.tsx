"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { CleanupImagesDialog } from "@/components/CleanupImagesDialog";

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Cài đặt</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Thông tin tài khoản</h2>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Tên đăng nhập:</span>
            <p className="font-medium">{user?.username}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Email:</span>
            <p className="font-medium">{user?.email || "Chưa có"}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Họ tên:</span>
            <p className="font-medium">{user?.full_name || "Chưa có"}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Vai trò:</span>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Số điện thoại:</span>
            <p className="font-medium">{user?.phone || "Chưa có"}</p>
          </div>
        </div>
      </div>

      {/* Admin Only - Storage Management */}
      {user?.role === "admin" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Quản lý dung lượng (Admin)</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Xóa các ảnh đơn hàng cũ để tiết kiệm dung lượng server
              </p>
              <CleanupImagesDialog />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Cài đặt hệ thống</h2>
        <p className="text-gray-600">
          Các tùy chọn cài đặt khác đang được phát triển.
        </p>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <SettingsPage />
      </AppLayout>
    </ProtectedRoute>
  );
}
