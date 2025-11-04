"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User } from "@/types";
import { authApi } from "@/lib/api";
import { Users } from "lucide-react";

interface AssignUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignedUsers: User[];
  onConfirm: (userIds: number[]) => Promise<void>;
}

export function AssignUsersDialog({
  open,
  onOpenChange,
  currentAssignedUsers,
  onConfirm,
}: AssignUsersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUserIds(currentAssignedUsers.map(u => u.id));
    }
  }, [open, currentAssignedUsers]);

  const fetchUsers = async () => {
    try {
      setIsFetching(true);
      const data = await authApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirm = async () => {
    if (selectedUserIds.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      await onConfirm(selectedUserIds);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update assigned users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Phân công nhân viên
          </DialogTitle>
          <DialogDescription>
            Chọn nhân viên phụ trách đơn hàng này
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="py-8 text-center text-gray-500">
            Đang tải danh sách nhân viên...
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto py-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                <Checkbox
                  id={`user-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={() => handleToggleUser(user.id)}
                  className="h-5 w-5"
                />
                <Label
                  htmlFor={`user-${user.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-gray-900">{user.full_name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </Label>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedUserIds.length === 0 || isLoading}
            className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-initial"
          >
            {isLoading ? "Đang lưu..." : `Phân công (${selectedUserIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
