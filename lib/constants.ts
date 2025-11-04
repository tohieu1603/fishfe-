import { OrderStatus, ImageType, type ProcessStage } from "@/types";

// Process Stages Configuration - 10 steps (8 active + Completed + Failed)
export const PROCESS_STAGES: ProcessStage[] = [
  {
    status: OrderStatus.CREATED,
    label: "Tạo đơn",
    color: "bg-blue-500",
    duration: 15,
    warningThreshold: 10,
  },
  {
    status: OrderStatus.WEIGHING,
    label: "Cân hàng",
    color: "bg-purple-500",
    duration: 20,
    warningThreshold: 15,
    requiresImages: [ImageType.WEIGHING],
  },
  {
    status: OrderStatus.CREATE_INVOICE,
    label: "Tạo phiếu ĐH",
    color: "bg-indigo-500",
    duration: 10,
    warningThreshold: 7,
    requiresImages: [ImageType.INVOICE],
  },
  {
    status: OrderStatus.SEND_PHOTO,
    label: "Gửi ảnh cân",
    color: "bg-cyan-500",
    duration: 10,
    warningThreshold: 7,
  },
  {
    status: OrderStatus.PAYMENT,
    label: "Thanh toán",
    color: "bg-green-500",
    duration: 30,
    warningThreshold: 20,
  },
  {
    status: OrderStatus.IN_KITCHEN,
    label: "Vào bếp",
    color: "bg-orange-500",
    duration: 60,
    warningThreshold: 45,
  },
  {
    status: OrderStatus.PROCESSING,
    label: "Chế biến",
    color: "bg-amber-500",
    duration: 45,
    warningThreshold: 30,
  },
  {
    status: OrderStatus.DELIVERY,
    label: "Giao hàng",
    color: "bg-teal-500",
    duration: 30,
    warningThreshold: 20,
  },
  {
    status: OrderStatus.COMPLETED,
    label: "Hoàn thành",
    color: "bg-emerald-500",
    duration: 0,
    warningThreshold: 0,
  },
  {
    status: OrderStatus.FAILED,
    label: "Thất bại",
    color: "bg-red-500",
    duration: 0,
    warningThreshold: 0,
  },
];

// Status labels in Vietnamese
export const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "Tạo đơn",
  [OrderStatus.WEIGHING]: "Cân hàng",
  [OrderStatus.CREATE_INVOICE]: "Tạo phiếu ĐH",
  [OrderStatus.SEND_PHOTO]: "Gửi ảnh cân",
  [OrderStatus.PAYMENT]: "Thanh toán",
  [OrderStatus.IN_KITCHEN]: "Vào bếp",
  [OrderStatus.PROCESSING]: "Chế biến",
  [OrderStatus.DELIVERY]: "Giao hàng",
  [OrderStatus.COMPLETED]: "Hoàn thành",
  [OrderStatus.FAILED]: "Thất bại",
};

// Get next status in the workflow
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const stages = PROCESS_STAGES.filter(
    (s) => s.status !== OrderStatus.COMPLETED && s.status !== OrderStatus.FAILED
  );

  const currentIndex = stages.findIndex((s) => s.status === currentStatus);
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return OrderStatus.COMPLETED;
  }

  return stages[currentIndex + 1].status;
}

// Get process stage by status
export function getProcessStage(status: OrderStatus): ProcessStage | undefined {
  return PROCESS_STAGES.find((s) => s.status === status);
}

// Check if status requires images
export function requiresImages(status: OrderStatus): ImageType[] {
  const stage = getProcessStage(status);
  return stage?.requiresImages || [];
}

// Image type labels
export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  [ImageType.WEIGHING]: "Ảnh cân hàng",
  [ImageType.INVOICE]: "Ảnh phiếu đặt hàng",
  [ImageType.ATTACHMENT]: "Ảnh đính kèm",
};
