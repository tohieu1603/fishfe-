"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Order } from "@/types";
import { Printer, FileText, Receipt, Package } from "lucide-react";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

type PrintType = "order_bill" | "weighing_receipt" | "payment_bill" | "delivery_note";
type PaperSize = "K57" | "K80" | "A4" | "A5";

interface PrintOption {
  type: PrintType;
  label: string;
  description: string;
  icon: React.ReactNode;
  availableSizes: PaperSize[];
  defaultSize: PaperSize;
}

const PRINT_OPTIONS: PrintOption[] = [
  {
    type: "order_bill",
    label: "Bill đặt hàng (Phiếu trắng)",
    description: "In phiếu đặt hàng ban đầu",
    icon: <FileText className="h-5 w-5" />,
    availableSizes: ["K57", "K80"],
    defaultSize: "K80",
  },
  {
    type: "weighing_receipt",
    label: "Phiếu cân hàng",
    description: "In phiếu cân hàng với chi tiết trọng lượng",
    icon: <Package className="h-5 w-5" />,
    availableSizes: ["A4", "A5"],
    defaultSize: "A4",
  },
  {
    type: "payment_bill",
    label: "Bill thanh toán",
    description: "In bill thanh toán cho khách",
    icon: <Receipt className="h-5 w-5" />,
    availableSizes: ["K57", "K80"],
    defaultSize: "K80",
  },
  {
    type: "delivery_note",
    label: "Phiếu giao hàng",
    description: "In phiếu giao hàng cho shipper",
    icon: <Package className="h-5 w-5" />,
    availableSizes: ["A4", "A5"],
    defaultSize: "A4",
  },
];

export function PrintDialog({ open, onOpenChange, order }: PrintDialogProps) {
  const [selectedType, setSelectedType] = useState<PrintType>("order_bill");
  const [selectedSize, setSelectedSize] = useState<PaperSize>("K80");
  const [copies, setCopies] = useState(1);

  const selectedOption = PRINT_OPTIONS.find((opt) => opt.type === selectedType);

  const handlePrint = () => {
    // Open print preview in new window
    const printWindow = window.open(
      `/print/${selectedType}/${order.id}?size=${selectedSize}&copies=${copies}`,
      "_blank",
      "width=800,height=600"
    );

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }

    onOpenChange(false);
  };

  const handlePreview = () => {
    // Open preview in new tab
    window.open(
      `/print/${selectedType}/${order.id}?size=${selectedSize}&preview=true`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] sm:max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg text-gray-900 flex items-center gap-2">
            <Printer className="h-5 w-5" />
            In phiếu - Đơn #{order.order_number}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600">
            Chọn loại phiếu, khổ giấy và số bản in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* Print Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Loại phiếu</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRINT_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    setSelectedType(option.type);
                    setSelectedSize(option.defaultSize);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    selectedType === option.type
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 p-2 rounded-md ${
                      selectedType === option.type
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        selectedType === option.type ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Paper Size Selection */}
          {selectedOption && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Khổ giấy</Label>
              <div className="flex flex-wrap gap-2">
                {selectedOption.availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {size}
                    {size === "K57" && " (57mm)"}
                    {size === "K80" && " (80mm)"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedSize.startsWith("K")
                  ? "Khổ giấy nhiệt cho máy in bill"
                  : "Khổ giấy A4/A5 cho máy in thường"}
              </p>
            </div>
          )}

          {/* Number of Copies */}
          <div className="space-y-2">
            <Label htmlFor="copies" className="text-sm font-semibold text-gray-900">
              Số bản in
            </Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="h-10 w-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 font-semibold text-gray-700"
              >
                -
              </button>
              <input
                id="copies"
                type="number"
                min="1"
                max="10"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="h-10 w-20 text-center border-2 border-gray-300 rounded-lg font-semibold text-gray-900"
              />
              <button
                onClick={() => setCopies(Math.min(10, copies + 1))}
                className="h-10 w-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 font-semibold text-gray-700"
              >
                +
              </button>
              <span className="text-sm text-gray-600">bản</span>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Printer className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Thông tin in:</p>
                <ul className="space-y-0.5">
                  <li>• Loại: {selectedOption?.label}</li>
                  <li>• Khổ: {selectedSize}</li>
                  <li>• Số bản: {copies}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 sm:h-9 text-sm font-medium flex-1 sm:flex-initial"
          >
            Hủy
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            className="h-11 sm:h-9 text-sm font-medium flex-1 sm:flex-initial"
          >
            Xem trước
          </Button>
          <Button
            onClick={handlePrint}
            className="h-11 sm:h-9 bg-black text-white hover:bg-gray-800 text-sm font-medium flex-1 sm:flex-initial"
          >
            <Printer className="h-4 w-4 mr-2" />
            In ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
