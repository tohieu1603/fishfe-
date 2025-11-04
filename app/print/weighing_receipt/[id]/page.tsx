"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Order } from "@/types";
import { orderApi } from "@/lib/api";

export default function WeighingReceiptPrintPage() {
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

  // Filter weighing images
  const weighingImages = order.images?.filter((img) => img.image_type === "weighing") || [];

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

        .weighing-page {
          width: ${size === "A4" ? "210mm" : "148mm"};
          min-height: ${size === "A4" ? "297mm" : "210mm"};
          margin: 0 auto;
          padding: 15mm;
          background: white;
        }

        .weighing-header {
          text-align: center;
          border-bottom: 3px solid #000;
          padding-bottom: 10mm;
          margin-bottom: 10mm;
        }

        .weighing-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5mm;
        }

        .weighing-subtitle {
          font-size: 14px;
          color: #666;
        }

        .weighing-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5mm;
          margin-bottom: 10mm;
        }

        .info-item {
          display: flex;
          border-bottom: 1px solid #ddd;
          padding: 3mm 0;
        }

        .info-label {
          font-weight: bold;
          min-width: 100px;
          color: #333;
        }

        .info-value {
          flex: 1;
          color: #000;
        }

        .weighing-items {
          margin-bottom: 10mm;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .items-table th {
          background: #f5f5f5;
          border: 1px solid #ddd;
          padding: 5mm;
          text-align: left;
          font-weight: bold;
        }

        .items-table td {
          border: 1px solid #ddd;
          padding: 5mm;
        }

        .weighing-images {
          margin-top: 10mm;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 5mm;
          margin-top: 5mm;
        }

        .image-container {
          border: 1px solid #ddd;
          padding: 3mm;
          text-align: center;
        }

        .image-container img {
          max-width: 100%;
          height: auto;
          max-height: 150px;
          object-fit: contain;
        }

        .image-label {
          font-size: 11px;
          color: #666;
          margin-top: 2mm;
        }

        .weighing-footer {
          margin-top: 15mm;
          padding-top: 10mm;
          border-top: 2px solid #000;
        }

        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20mm;
          text-align: center;
        }

        .signature-box {
          padding-top: 10mm;
        }

        .signature-label {
          font-weight: bold;
          margin-bottom: 15mm;
        }

        .signature-line {
          border-top: 1px solid #000;
          padding-top: 2mm;
          font-style: italic;
          font-size: 12px;
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
        <div key={index} className="weighing-page" style={{ pageBreakAfter: index < copies - 1 ? "always" : "auto" }}>
          {/* Header */}
          <div className="weighing-header">
            <div className="weighing-title">SEEFOOD</div>
            <div className="weighing-title">PHIẾU CÂN HÀNG</div>
            <div className="weighing-subtitle">
              Ngày: {new Date(order.created_at).toLocaleDateString("vi-VN")}
            </div>
          </div>

          {/* Order Info */}
          <div className="weighing-info">
            <div className="info-item">
              <span className="info-label">Số đơn:</span>
              <span className="info-value">#{order.order_number}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Khách hàng:</span>
              <span className="info-value">{order.customer_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Số điện thoại:</span>
              <span className="info-value">{order.customer_phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Địa chỉ:</span>
              <span className="info-value">{order.customer_address || "N/A"}</span>
            </div>
            {order.delivery_time && (
              <div className="info-item">
                <span className="info-label">Thời gian nhận:</span>
                <span className="info-value">
                  {new Date(order.delivery_time).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Tổng tiền:</span>
              <span className="info-value" style={{ fontWeight: "bold" }}>
                {(order.total_amount || 0).toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="weighing-items">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>STT</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: "80px" }}>Số lượng</th>
                  <th style={{ width: "100px" }}>Đơn giá</th>
                  <th style={{ width: "120px" }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: "center" }}>{idx + 1}</td>
                    <td>
                      <div>{item.product_name}</div>
                      {item.notes && (
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "2mm" }}>
                          Ghi chú: {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {(item.price || 0).toLocaleString("vi-VN")}đ
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {((item.price || 0) * item.quantity).toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{ textAlign: "right", fontWeight: "bold" }}>
                    TỔNG CỘNG:
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "16px" }}>
                    {(order.total_amount || 0).toLocaleString("vi-VN")}đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginBottom: "10mm", padding: "5mm", background: "#f9f9f9", border: "1px solid #ddd" }}>
              <div style={{ fontWeight: "bold", marginBottom: "2mm" }}>Ghi chú:</div>
              <div>{order.notes}</div>
            </div>
          )}

          {/* Weighing Images */}
          {weighingImages.length > 0 && (
            <div className="weighing-images">
              <div style={{ fontWeight: "bold", marginBottom: "5mm" }}>Hình ảnh cân hàng:</div>
              <div className="images-grid">
                {weighingImages.slice(0, 4).map((img, idx) => (
                  <div key={idx} className="image-container">
                    <img src={img.image_url} alt={`Ảnh cân ${idx + 1}`} />
                    <div className="image-label">Ảnh {idx + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="weighing-footer">
            <div className="signature-section">
              <div className="signature-box">
                <div className="signature-label">Người cân hàng</div>
                <div className="signature-line">(Ký và ghi rõ họ tên)</div>
              </div>
              <div className="signature-box">
                <div className="signature-label">Người kiểm tra</div>
                <div className="signature-line">(Ký và ghi rõ họ tên)</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
