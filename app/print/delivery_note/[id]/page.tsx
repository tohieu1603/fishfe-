"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Order } from "@/types";
import { orderApi } from "@/lib/api";

export default function DeliveryNotePrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = parseInt(params.id as string);
  const size = searchParams.get("size") || "A4";
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

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: ${size};
            margin: 15mm;
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
          font-family: Arial, sans-serif;
        }

        .delivery-page {
          width: ${size === "A4" ? "210mm" : "148mm"};
          min-height: ${size === "A4" ? "297mm" : "210mm"};
          margin: 0 auto;
          padding: 15mm;
          background: white;
        }

        .delivery-header {
          text-align: center;
          border: 3px solid #000;
          padding: 10mm;
          margin-bottom: 10mm;
          background: linear-gradient(to bottom, #f5f5f5, #fff);
        }

        .delivery-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 3mm;
        }

        .delivery-subtitle {
          font-size: 16px;
          color: #666;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10mm;
          margin-bottom: 10mm;
        }

        .info-box {
          border: 2px solid #000;
          padding: 5mm;
        }

        .info-box-title {
          font-size: 14px;
          font-weight: bold;
          background: #000;
          color: #fff;
          padding: 3mm;
          margin: -5mm -5mm 5mm -5mm;
        }

        .info-row {
          display: flex;
          padding: 2mm 0;
          border-bottom: 1px dotted #ccc;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: bold;
          min-width: 80px;
          color: #333;
        }

        .info-value {
          flex: 1;
          color: #000;
        }

        .delivery-items {
          margin-bottom: 10mm;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
        }

        .items-table th {
          background: #000;
          color: #fff;
          border: 1px solid #000;
          padding: 5mm;
          text-align: left;
          font-weight: bold;
        }

        .items-table td {
          border: 1px solid #000;
          padding: 5mm;
        }

        .total-box {
          background: #000;
          color: #fff;
          padding: 5mm;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin: 10mm 0;
        }

        .instructions {
          border: 2px dashed #000;
          padding: 5mm;
          margin: 10mm 0;
          background: #fffbeb;
        }

        .instructions-title {
          font-weight: bold;
          margin-bottom: 3mm;
          font-size: 14px;
        }

        .checkbox-list {
          list-style: none;
          padding: 0;
        }

        .checkbox-list li {
          padding: 2mm 0;
          display: flex;
          align-items: center;
        }

        .checkbox-list li:before {
          content: '☐';
          font-size: 18px;
          margin-right: 3mm;
        }

        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10mm;
          margin-top: 15mm;
          text-align: center;
        }

        .signature-box {
          border: 1px solid #000;
          padding: 5mm;
        }

        .signature-label {
          font-weight: bold;
          margin-bottom: 20mm;
          font-size: 14px;
        }

        .signature-line {
          border-top: 2px solid #000;
          padding-top: 2mm;
          font-style: italic;
          font-size: 11px;
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
        <div key={index} className="delivery-page" style={{ pageBreakAfter: index < copies - 1 ? "always" : "auto" }}>
          {/* Header */}
          <div className="delivery-header">
            <div className="delivery-title">SEEFOOD</div>
            <div className="delivery-title">PHIẾU GIAO HÀNG</div>
            <div className="delivery-subtitle">
              Số đơn: #{order.order_number}
            </div>
          </div>

          {/* Info Grid */}
          <div className="info-grid">
            {/* Sender Info */}
            <div className="info-box">
              <div className="info-box-title">THÔNG TIN NGƯỜI GỬI</div>
              <div className="info-row">
                <span className="info-label">Tên:</span>
                <span className="info-value">SEEFOOD</span>
              </div>
              <div className="info-row">
                <span className="info-label">SĐT:</span>
                <span className="info-value">0901234567</span>
              </div>
              <div className="info-row">
                <span className="info-label">Địa chỉ:</span>
                <span className="info-value">123 Đường ABC, Q.1, TP.HCM</span>
              </div>
            </div>

            {/* Receiver Info */}
            <div className="info-box">
              <div className="info-box-title">THÔNG TIN NGƯỜI NHẬN</div>
              <div className="info-row">
                <span className="info-label">Tên:</span>
                <span className="info-value">{order.customer_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">SĐT:</span>
                <span className="info-value">{order.customer_phone}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Địa chỉ:</span>
                <span className="info-value">{order.customer_address || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          <div style={{ marginBottom: "10mm", padding: "5mm", border: "2px solid #000", background: "#f0f9ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "2mm" }}>Thời gian giao hàng:</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {order.delivery_time
                    ? new Date(order.delivery_time).toLocaleString("vi-VN")
                    : "Sớm nhất có thể"}
                </div>
              </div>
              {order.deadline && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Deadline:</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#d00" }}>
                    {new Date(order.deadline).toLocaleString("vi-VN")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="delivery-items">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>STT</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: "80px" }}>Số lượng</th>
                  <th style={{ width: "120px" }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
                    <td style={{ fontWeight: "bold" }}>{item.product_name}</td>
                    <td style={{ textAlign: "center", fontSize: "16px", fontWeight: "bold" }}>
                      {item.quantity}
                    </td>
                    <td style={{ fontSize: "11px" }}>{item.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="total-box">
            TỔNG TIỀN THU HỘ: {(order.total_amount || 0).toLocaleString("vi-VN")}đ
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div style={{ marginBottom: "10mm", padding: "5mm", border: "2px solid #f59e0b", background: "#fffbeb" }}>
              <div style={{ fontWeight: "bold", marginBottom: "2mm", color: "#f59e0b" }}>
                ⚠ Ghi chú quan trọng:
              </div>
              <div style={{ fontSize: "14px" }}>{order.notes}</div>
            </div>
          )}

          {/* Delivery Instructions */}
          <div className="instructions">
            <div className="instructions-title">HƯỚNG DẪN GIAO HÀNG:</div>
            <ul className="checkbox-list">
              <li>Kiểm tra tình trạng hàng hóa trước khi giao</li>
              <li>Gọi điện cho khách trước khi đến 15 phút</li>
              <li>Thu đủ tiền mặt theo đúng số tiền ghi trên phiếu</li>
              <li>Yêu cầu khách ký nhận trên phiếu</li>
              <li>Chụp ảnh xác nhận đã giao hàng</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="signature-section">
            <div className="signature-box">
              <div className="signature-label">Người lập phiếu</div>
              <div className="signature-line">(Ký và ghi rõ họ tên)</div>
            </div>
            <div className="signature-box">
              <div className="signature-label">Shipper</div>
              <div className="signature-line">(Ký và ghi rõ họ tên)</div>
            </div>
            <div className="signature-box">
              <div className="signature-label">Người nhận</div>
              <div className="signature-line">(Ký và ghi rõ họ tên)</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "10mm", textAlign: "center", fontSize: "11px", color: "#666" }}>
            <div>Hotline: 0901234567 | Email: support@seefood.vn</div>
            <div style={{ marginTop: "2mm" }}>www.seefood.vn</div>
          </div>
        </div>
      ))}
    </>
  );
}
