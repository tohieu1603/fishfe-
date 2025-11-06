"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Order } from "@/types";
import { orderApi } from "@/lib/api";

export default function PaymentBillPrintPage() {
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
          line-height: 1.5;
        }

        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 5mm;
          margin-bottom: 5mm;
        }

        .receipt-title {
          font-size: 18px;
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
          border-top: 2px dashed #000;
          border-bottom: 2px dashed #000;
          padding: 3mm 0;
          margin: 3mm 0;
        }

        .receipt-item {
          margin-bottom: 3mm;
        }

        .receipt-item-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }

        .receipt-item-details {
          font-size: 10px;
          color: #666;
          margin-top: 1mm;
          padding-left: 3mm;
        }

        .receipt-summary {
          margin: 5mm 0;
        }

        .receipt-total {
          font-size: 16px;
          font-weight: bold;
          margin: 5mm 0;
          padding: 3mm;
          background: #000;
          color: #fff;
          text-align: center;
        }

        .receipt-payment {
          border: 1px solid #000;
          padding: 3mm;
          margin: 5mm 0;
          background: #f5f5f5;
        }

        .receipt-footer {
          border-top: 2px dashed #000;
          padding-top: 5mm;
          margin-top: 5mm;
          text-align: center;
        }

        .qr-code {
          margin: 5mm auto;
          text-align: center;
          padding: 5mm;
          border: 1px dashed #000;
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
            <div style={{ fontSize: "14px", fontWeight: "bold" }}>HÓA ĐƠN THANH TOÁN</div>
            <div style={{ fontSize: "10px", marginTop: "2mm" }}>
              {new Date(order.created_at).toLocaleString("vi-VN")}
            </div>
          </div>

          {/* Customer Info */}
          <div className="receipt-row">
            <span className="receipt-label">Số hóa đơn:</span>
            <span>#{order.order_number}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Khách hàng:</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">SĐT:</span>
            <span>{order.customer_phone}</span>
          </div>
          {order.customer_address && (
            <div style={{ marginBottom: "3mm", fontSize: "10px" }}>
              <div className="receipt-label">Địa chỉ:</div>
              <div>{order.customer_address}</div>
            </div>
          )}

          {/* Items */}
          <div className="receipt-items">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="receipt-item">
                <div className="receipt-item-header">
                  <span>
                    {idx + 1}. {item.product_name}
                  </span>
                </div>
                <div className="receipt-item-details">
                  <div className="receipt-row">
                    <span>SL: {item.quantity}</span>
                    <span>
                      {(item.price || 0).toLocaleString("vi-VN")}đ x {item.quantity}
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span>Thành tiền:</span>
                    <span style={{ fontWeight: "bold" }}>
                      {((item.price || 0) * item.quantity).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
                {item.note && (
                  <div style={{ fontSize: "10px", paddingLeft: "3mm", color: "#666", marginTop: "1mm" }}>
                    * {item.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="receipt-summary">
            <div className="receipt-row">
              <span>Tạm tính:</span>
              <span>{(order.total_amount || 0).toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="receipt-row">
              <span>Giảm giá:</span>
              <span>0đ</span>
            </div>
            <div className="receipt-row">
              <span>Phí ship:</span>
              <span>0đ</span>
            </div>
          </div>

          {/* Total */}
          <div className="receipt-total">
            TỔNG THANH TOÁN: {(order.total_amount || 0).toLocaleString("vi-VN")}đ
          </div>

          {/* Payment Info */}
          <div className="receipt-payment">
            <div className="receipt-label" style={{ marginBottom: "2mm" }}>
              THÔNG TIN CHUYỂN KHOẢN:
            </div>
            <div style={{ fontSize: "11px" }}>
              <div>Ngân hàng: MB Bank</div>
              <div>STK: 0123456789</div>
              <div>Chủ TK: SEEFOOD CO.</div>
              <div style={{ marginTop: "2mm", fontWeight: "bold" }}>
                Nội dung: {order.order_number}
              </div>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="qr-code">
            <div style={{ fontSize: "10px", marginBottom: "2mm" }}>Quét mã QR để thanh toán</div>
            <div style={{ fontSize: "24px", letterSpacing: "2px" }}>■ ■ ■</div>
            <div style={{ fontSize: "24px", letterSpacing: "2px" }}>■ ■ ■</div>
            <div style={{ fontSize: "24px", letterSpacing: "2px" }}>■ ■ ■</div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginTop: "5mm", padding: "3mm", background: "#f5f5f5", fontSize: "10px" }}>
              <div className="receipt-label">Ghi chú:</div>
              <div>{order.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="receipt-footer">
            <div style={{ fontSize: "11px", fontWeight: "bold" }}>Cảm ơn quý khách!</div>
            <div style={{ fontSize: "10px", marginTop: "2mm" }}>
              Hẹn gặp lại quý khách
            </div>
            <div style={{ fontSize: "10px", marginTop: "3mm", borderTop: "1px dashed #000", paddingTop: "3mm" }}>
              Hotline: 0901234567
            </div>
            <div style={{ fontSize: "10px" }}>
              www.seefood.vn
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
