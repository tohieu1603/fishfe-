"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

function CustomersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Quản lý khách hàng</h1>
      <p className="text-gray-600">
        Trang này đang được phát triển. Bạn có thể thêm, chỉnh sửa và xem danh sách khách hàng tại đây.
      </p>
    </div>
  );
}

export default function Customers() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <CustomersPage />
      </AppLayout>
    </ProtectedRoute>
  );
}
