"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Quản lý đơn hàng</h1>
      <p className="text-gray-600">
        Trang này đang được phát triển. Hiện tại bạn có thể quản lý đơn hàng từ trang chủ.
      </p>
    </div>
  );
}

export default function Orders() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <OrdersPage />
      </AppLayout>
    </ProtectedRoute>
  );
}
