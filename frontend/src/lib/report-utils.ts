import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/logo.png";

export const BRAND    = "SALUDCARIBE SHOP";
const BRAND_SUB       = "Sistema de Gestión de Insumos Médicos";
const HEADER_H        = 30;

let _logo: string | null = null;

/** Preloads the logo as base64. Call once when the reports page mounts. */
export async function preloadReportAssets(): Promise<void> {
  if (_logo !== null) return;
  try {
    const res  = await fetch(logoUrl);
    const blob = await res.blob();
    _logo = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    _logo = "";
  }
}

/**
 * Draws the branded blue header (logo + company name) on the current page
 * and returns the Y coordinate where content should start.
 */
export function addBrandHeader(doc: jsPDF): number {
  const pageW = doc.internal.pageSize.getWidth();

  // Blue background bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, HEADER_H, "F");

  // Logo (if loaded)
  let textX = 14;
  if (_logo) {
    try {
      doc.addImage(_logo, "PNG", 7, 4, 22, 22);
      textX = 33;
    } catch { /* skip logo on error */ }
  }

  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(BRAND, textX, 13);

  // Tagline
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(BRAND_SUB, textX, 22);

  // Generated date (right-aligned)
  doc.setFontSize(7);
  doc.text(
    `Generado: ${new Date().toLocaleString("es-CO")}`,
    pageW - 14,
    13,
    { align: "right" },
  );

  doc.setTextColor(0, 0, 0);
  return HEADER_H + 6; // Y position after header + padding
}

export type SheetDef = {
  name: string;
  columns: string[];
  rows: (string | number | boolean)[][];
};

export function downloadExcel(filename: string, sheets: SheetDef[]) {
  const wb      = XLSX.utils.book_new();
  const dateStr = new Date().toLocaleString("es-CO");

  sheets.forEach(({ name, columns, rows }) => {
    const aoa: (string | number | boolean)[][] = [
      [BRAND],
      [BRAND_SUB],
      [`Reporte: ${name}`],
      [`Generado: ${dateStr}`],
      [],
      columns,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Auto-size columns based on data content
    ws["!cols"] = columns.map((col, i) => ({
      wch: Math.max(col.length, ...rows.map((r) => String(r[i] ?? "").length), 10) + 2,
    }));

    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function downloadPdf(
  filename: string,
  title: string,
  columns: string[],
  rows: (string | number | boolean)[][],
  subtitle?: string,
) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  let y = addBrandHeader(doc);

  // Report title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);
  y += 6;

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
  }

  y += 2;

  autoTable(doc, {
    head: [columns],
    body: rows.map((r) => r.map(String)),
    startY: y,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}
