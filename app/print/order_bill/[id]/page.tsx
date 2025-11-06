"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Order } from "@/types";
import { orderApi } from "@/lib/api";

export default function OrderBillPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = parseInt(params.id as string);
  const size = searchParams.get("size") || "K80";
  const copies = parseInt(searchParams.get("copies") || "1");
  const isPreview = searchParams.get("preview") === "true";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderApi.getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Không tìm thấy đơn hàng</p>
        </div>
      </div>
    );
  }

  const paperWidth = size === "K57" ? "57mm" : "80mm";

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperWidth} auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Courier New', monospace;
        }

        .receipt {
          width: ${paperWidth};
          margin: 0 auto;
          padding: 5mm;
          background: white;
        }

        .receipt * {
          font-size: 12px;
          line-height: 1.4;
        }

        .receipt-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 5mm;
          margin-bottom: 5mm;
        }

        .receipt-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 2mm;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2mm;
        }

        .receipt-label {
          font-weight: bold;
        }

        .receipt-items {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 3mm 0;
          margin: 3mm 0;
        }

        .receipt-item {
          margin-bottom: 2mm;
        }

        .receipt-footer {
          border-top: 2px dashed #000;
          padding-top: 5mm;
          margin-top: 5mm;
          text-align: center;
        }

        .receipt-total {
          font-size: 14px;
          font-weight: bold;
          margin: 3mm 0;
        }
      `}</style>

      {isPreview && (
        <div className="no-print bg-gray-100 p-4 text-center border-b">
          <p className="text-sm text-gray-700">
            <strong>Chế độ xem trước</strong> - Nhấn Ctrl/Cmd + P để in
          </p>
          <button
            onClick={() => window.print()}
            className="mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            In ngay
          </button>
        </div>
      )}

      {Array.from({ length: copies }).map((_, index) => (
        <div key={index} className="receipt" style={{ pageBreakAfter: index < copies - 1 ? "always" : "auto" }}>
          {/* Header */}
          <div className="receipt-header">
            <div className="receipt-title">SEEFOOD</div>
            <div>BILL ĐẶT HÀNG</div>
            <div style={{ fontSize: "10px", marginTop: "2mm" }}>
              (Phiếu trắng - Lưu bếp)
            </div>
          </div>

          {/* Order Info */}
          <div className="receipt-row">
            <span className="receipt-label">Số đơn:</span>
            <span>#{order.order_number}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Ngày:</span>
            <span>{new Date(order.created_at).toLocaleString("vi-VN")}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Khách hàng:</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">SĐT:</span>
            <span>{order.customer_phone}</span>
          </div>
          {order.delivery_time && (
            <div className="receipt-row">
              <span className="receipt-label">Nhận hàng:</span>
              <span>{new Date(order.delivery_time).toLocaleString("vi-VN")}</span>
            </div>
          )}

          {/* Items */}
          <div className="receipt-items">
            <div className="receipt-label" style={{ marginBottom: "3mm" }}>
              SẢN PHẨM:
            </div>
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="receipt-item">
                <div className="receipt-row">
                  <span>
                    {idx + 1}. {item.product_name}
                  </span>
                  <span>x{item.quantity}</span>
                </div>
                {item.note && (
                  <div style={{ fontSize: "10px", paddingLeft: "5mm", color: "#666" }}>
                    Ghi chú: {item.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="receipt-row receipt-total">
            <span>TỔNG CỘNG:</span>
            <span>{(order.total_amount || 0).toLocaleString("vi-VN")}đ</span>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginTop: "5mm", padding: "3mm", background: "#f5f5f5" }}>
              <div className="receipt-label">Ghi chú:</div>
              <div style={{ fontSize: "10px" }}>{order.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="receipt-footer">
            <div style={{ fontSize: "10px" }}>Cảm ơn quý khách!</div>
            <div style={{ fontSize: "10px", marginTop: "2mm" }}>
              www.seefood.vn
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
