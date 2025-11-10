"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle, Loader2, Eye, Database, CheckCircle, XCircle, Info, CalendarClock, FileImage } from "lucide-react";

interface CleanupPreview {
  success: boolean;
  days: number;
  total_count: number;
  total_size_mb: number;
  sample_files: Array<{
    id: number;
    filename: string;
    order_number: string;
    image_type: string;
    created_at: string;
    size_kb: number;
  }>;
  showing: string;
}

interface CleanupResult {
  success: boolean;
  message: string;
  dry_run: boolean;
  days: number;
  total_found: number;
  deleted_count?: number;
  would_delete_count?: number;
  failed_count: number;
  total_size_mb: number;
}

export function CleanupImagesDialog() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  };

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/api/orders/cleanup-old-images/preview?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Không thể tải preview");
      }

      const data = await response.json();
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const executeCleanup = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/api/orders/cleanup-old-images?days=${days}&dry_run=${dryRun}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Không thể thực hiện cleanup");
      }

      const data = await response.json();
      setResult(data);

      // Close dialog after successful cleanup
      if (!dryRun && data.success) {
        setTimeout(() => {
          setOpen(false);
          // Reset state
          setPreview(null);
          setResult(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setPreview(null);
      setResult(null);
      setError(null);
      setDays(30);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all">
          <Database className="h-4 w-4" />
          Dọn dẹp bộ nhớ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Header - Filament style */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div className="bg-danger-100 p-2.5 rounded-lg">
                <Database className="h-5 w-5 text-danger-600" />
              </div>
              Dọn dẹp bộ nhớ server
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2 ml-12">
              Xóa các ảnh đơn hàng cũ để giải phóng dung lượng server
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-5 space-y-5">
          {/* Info Banner - Filament style */}
          <div className="bg-info-50 border-l-4 border-info-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <div className="bg-info-500 rounded-full p-1 mt-0.5">
                <Info className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-info-900 mb-2">Lưu ý quan trọng</p>
                <ul className="space-y-1.5 text-info-800">
                  <li className="flex items-start gap-2">
                    <span className="text-info-600 mt-0.5">•</span>
                    <span>Ảnh đã xóa không thể khôi phục</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-info-600 mt-0.5">•</span>
                    <span>Nên chạy "Xem trước" và "Dry Run" trước khi xóa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-info-600 mt-0.5">•</span>
                    <span>Chỉ Admin mới có quyền thực hiện</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Days Input - Filament form style */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <Label htmlFor="days" className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-gray-500" />
              Xóa ảnh cũ hơn bao nhiêu ngày?
            </Label>
            <div className="flex items-center gap-3 mb-3">
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                disabled={loading}
                className="text-base font-semibold w-28 h-11 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 font-medium">ngày</span>
            </div>
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-warning-800">
                Chỉ xóa ảnh được tạo trước <span className="font-semibold">{days} ngày</span>
                {' '}({new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')})
              </p>
            </div>
          </div>

          {/* Preview Button */}
          {!preview && !result && (
            <Button
              onClick={fetchPreview}
              disabled={loading}
              className="w-full gap-2 h-11 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Xem trước những file sẽ bị xóa
            </Button>
          )}

          {/* Error Display - Filament style */}
          {error && (
            <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="bg-danger-500 rounded-full p-1 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-danger-900 mb-1">Lỗi</p>
                  <p className="text-sm text-danger-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Display - Filament style */}
          {preview && !result && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-600 rounded-lg p-2">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Kết quả xem trước</p>
                    <p className="text-xs text-gray-600 mt-0.5">Dưới đây là những file sẽ bị xóa</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50">
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <FileImage className="h-4 w-4 text-gray-500" />
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tổng số ảnh</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{preview.total_count}</p>
                  <p className="text-xs text-gray-500 mt-1">file</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dung lượng</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{preview.total_size_mb}</p>
                  <p className="text-xs text-gray-500 mt-1">MB</p>
                </div>
              </div>

              {/* Sample Files List */}
              {preview.sample_files && preview.sample_files.length > 0 && (
                <div className="border-t border-gray-200">
                  <div className="bg-warning-50 border-b border-warning-200 px-5 py-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-600" />
                    <div>
                      <p className="text-sm font-medium text-warning-900">Mẫu file sẽ bị xóa</p>
                      <p className="text-xs text-warning-700">{preview.showing}</p>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-4 space-y-2 bg-gray-50">
                    {preview.sample_files.slice(0, 10).map((file, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-danger-300 hover:bg-danger-50/50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-gray-100 group-hover:bg-danger-100 rounded-lg p-2 mt-0.5 transition-colors">
                            <Trash2 className="h-3.5 w-3.5 text-gray-600 group-hover:text-danger-600 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate mb-1.5">
                              {file.filename.split("/").pop()}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                {file.order_number}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="font-medium text-primary-600">{file.size_kb} KB</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{new Date(file.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result Display - Filament style */}
          {result && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className={`${
                result.success
                  ? "bg-gradient-to-r from-success-50 to-success-100/50 border-b border-success-200"
                  : "bg-gradient-to-r from-danger-50 to-danger-100/50 border-b border-danger-200"
              } px-5 py-4`}>
                <div className="flex items-center gap-3">
                  <div className={`${result.success ? "bg-success-600" : "bg-danger-600"} rounded-lg p-2`}>
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <XCircle className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${result.success ? "text-success-900" : "text-danger-900"}`}>
                      {result.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {result.dry_run ? "Chạy thử - không có file nào bị xóa" : "Đã hoàn tất xóa file"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Tìm thấy</p>
                  <p className="text-2xl font-bold text-gray-900">{result.total_found}</p>
                  <p className="text-xs text-gray-500 mt-0.5">ảnh</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                    {result.dry_run ? "Sẽ xóa" : "Đã xóa"}
                  </p>
                  <p className={`text-2xl font-bold ${result.success ? "text-success-600" : "text-danger-600"}`}>
                    {result.dry_run ? result.would_delete_count : result.deleted_count}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">ảnh</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Dung lượng</p>
                  <p className="text-2xl font-bold text-gray-900">{result.total_size_mb}</p>
                  <p className="text-xs text-gray-500 mt-0.5">MB</p>
                </div>
                {result.failed_count > 0 && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-danger-700 uppercase tracking-wide mb-1">Thất bại</p>
                    <p className="text-2xl font-bold text-danger-600">{result.failed_count}</p>
                    <p className="text-xs text-danger-600 mt-0.5">file</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Filament style */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {preview && !result && (
              <>
                <Button
                  onClick={() => executeCleanup(true)}
                  disabled={loading}
                  className="gap-2 flex-1 h-11 bg-warning-500 hover:bg-warning-600 text-white font-medium shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Chạy thử (Dry Run)
                </Button>
                <Button
                  onClick={() => executeCleanup(false)}
                  disabled={loading}
                  className="gap-2 flex-1 h-11 bg-danger-600 hover:bg-danger-700 text-white font-medium shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Xóa ngay
                </Button>
              </>
            )}

            {result && !result.dry_run && result.success && (
              <Button
                onClick={() => setOpen(false)}
                className="w-full h-11 bg-success-600 hover:bg-success-700 text-white font-medium shadow-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Hoàn tất
              </Button>
            )}

            {result && result.dry_run && (
              <Button
                onClick={() => executeCleanup(false)}
                disabled={loading}
                className="w-full gap-2 h-11 bg-danger-600 hover:bg-danger-700 text-white font-medium shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Xác nhận xóa vĩnh viễn
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
