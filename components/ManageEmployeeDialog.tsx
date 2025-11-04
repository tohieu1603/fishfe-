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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

interface ManageEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: User | null;
  onSuccess: () => void;
}

export function ManageEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: ManageEmployeeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "staff",
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        username: employee.username,
        password: "",
        email: employee.email || "",
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        phone: employee.phone || "",
        role: employee.role || "staff",
      });
    } else {
      setFormData({
        username: "",
        password: "",
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "staff",
      });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (employee) {
        // Update employee - TODO: Implement update API
        toast.error("Chức năng cập nhật nhân viên chưa được triển khai");
      } else {
        // Create new employee
        await authApi.register(formData);
        toast.success("Thêm nhân viên thành công!");
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Failed to save employee:", error);
      const errorMessage = error?.response?.data?.detail || "Không thể lưu thông tin nhân viên";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>{employee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}</DialogTitle>
          <DialogDescription>
            {employee
              ? "Cập nhật thông tin nhân viên trong hệ thống"
              : "Tạo tài khoản nhân viên mới để họ có thể truy cập hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Thông tin tài khoản</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Tên đăng nhập *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="john_doe"
                  disabled={!!employee}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  Mật khẩu {employee ? "(để trống nếu không đổi)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!employee}
                  placeholder="••••••••"
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Thông tin cá nhân</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Họ và tên đệm *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  placeholder="Nguyễn Văn"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Tên *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  placeholder="A"
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0901234567"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-gray-800">
              {isLoading ? "Đang lưu..." : employee ? "Cập nhật" : "Thêm nhân viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
