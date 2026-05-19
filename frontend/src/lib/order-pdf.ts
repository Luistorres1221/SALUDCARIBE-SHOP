import jsPDF from "jspdf";
import type { Order } from "@/api/orders";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  pagado: "Pagado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function downloadOrderPdf(order: Order) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Encabezado azul ────────────────────────────────────────────────────────
  doc.setFillColor(62, 64, 149); // #3E4095
  doc.rect(0, 0, W, 35, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("SaludCaribe Shop", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Gestión interna de insumos médicos", 14, 22);
  doc.text("www.saluddelcaribe.com", 14, 28);

  // Número de pedido (alineado a la derecha en el encabezado)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Pedido #${order.id.slice(0, 8).toUpperCase()}`, W - 14, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(formatDate(order.createdAt), W - 14, 25, { align: "right" });

  y = 45;

  // ── Información del solicitante ────────────────────────────────────────────
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(10, y, W - 20, 28, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Información del solicitante", 14, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Nombre: ${order.userFullName || "—"}`, 14, y + 14);
  doc.text(`Correo: ${order.userEmail || "—"}`, 14, y + 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const statusColor = order.status === "cancelado" ? [200, 50, 50] : [62, 64, 149];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Estado: ${STATUS_LABELS[order.status] ?? order.status}`, W - 14, y + 14, { align: "right" });

  y += 36;

  // ── Tabla de productos ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Detalle del pedido", 14, y);
  y += 5;

  // Cabecera de tabla
  doc.setFillColor(62, 64, 149);
  doc.rect(10, y, W - 20, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Producto", 14, y + 5.5);
  doc.text("Cant.", 118, y + 5.5, { align: "right" });
  doc.text("Precio unit.", 148, y + 5.5, { align: "right" });
  doc.text("Subtotal", W - 14, y + 5.5, { align: "right" });
  y += 8;

  // Filas
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  order.items.forEach((item, idx) => {
    const bg = idx % 2 === 0 ? [255, 255, 255] : [248, 248, 252];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(10, y, W - 20, 8, "F");

    doc.setTextColor(40, 40, 40);
    // Truncar nombre largo
    const name = item.productName.length > 55 ? item.productName.slice(0, 52) + "..." : item.productName;
    doc.text(name, 14, y + 5.5);
    doc.text(String(item.quantity), 118, y + 5.5, { align: "right" });
    doc.text(formatCOP(Number(item.unitPrice)), 148, y + 5.5, { align: "right" });
    doc.text(formatCOP(Number(item.unitPrice) * item.quantity), W - 14, y + 5.5, { align: "right" });
    y += 8;
  });

  // Línea separadora
  doc.setDrawColor(200, 200, 210);
  doc.line(10, y, W - 10, y);
  y += 6;

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(62, 64, 149);
  doc.text("Total:", W - 60, y);
  doc.text(formatCOP(Number(order.total)), W - 14, y, { align: "right" });
  y += 12;

  // Notas si las hay
  if (order.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Notas: ${order.notes}`, 14, y);
    y += 8;
  }

  // ── Pie de página ──────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(62, 64, 149);
  doc.rect(0, pageH - 22, W, 22, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 230);
  doc.text("Central de Citas — Cartagena: +57 605 6932177 | Armenia: +57 606 7314460", W / 2, pageH - 13, { align: "center" });
  doc.text("centraldecitas@saluddelcaribe.com | Sede Norte: Calle 2 Norte #12-78 | Sede Sur: Cra 19 #50-25", W / 2, pageH - 7, { align: "center" });

  doc.save(`pedido-${order.id.slice(0, 8).toUpperCase()}.pdf`);
}
