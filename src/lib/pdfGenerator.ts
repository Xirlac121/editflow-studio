import { jsPDF } from 'jspdf';
import { Client, Quote, StudioSettings } from '../types/studio';

export function generateQuotePdf(
  quote: Quote,
  settings: StudioSettings,
  client?: Client
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;

  // Top Studio Obsidian Header Band
  doc.setFillColor(15, 17, 23);
  doc.rect(0, 0, pageWidth, 118, 'F');

  // Electric Lime Accent Pill
  doc.setFillColor(217, 249, 80);
  doc.roundedRect(margin, 28, 110, 22, 8, 8, 'F');
  doc.setTextColor(15, 17, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PRESUPUESTO', margin + 15, 42);

  // Studio Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(settings.studioName.toUpperCase(), margin, 78);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(180, 188, 204);
  doc.text(`Editor responsable: ${settings.editorName}`, margin, 96);

  // Right Header Quote Number & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(217, 249, 80);
  doc.text(quote.number, pageWidth - margin, 48, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(200, 205, 215);
  doc.text(
    `Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-ES')}`,
    pageWidth - margin,
    68,
    { align: 'right' }
  );
  if (quote.validUntil) {
    doc.text(`Válido hasta: ${quote.validUntil}`, pageWidth - margin, 84, {
      align: 'right',
    });
  }

  // Client & Project Summary Section
  let y = 152;
  doc.setTextColor(15, 17, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(quote.title, margin, y);

  y += 22;
  doc.setFontSize(10);
  doc.setTextColor(80, 90, 105);
  const clientLabel = client
    ? `${client.name}${client.company ? ` — ${client.company}` : ''}`
    : quote.clientNameSnapshot || 'Cliente';
  doc.text(`Cliente: ${clientLabel}`, margin, y);
  doc.text(
    `Formato: ${quote.format}  |  Entrega estimada: ${quote.deliveryDays} días hábiles  |  Revisiones incluidas: ${quote.revisionsIncluded}`,
    margin,
    y + 16
  );

  // Items Table Header
  y += 44;
  doc.setFillColor(242, 244, 248);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 6, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 46, 58);
  doc.text('CONCEPTO / SERVICIO DE EDICIÓN', margin + 12, y + 18);
  doc.text('CANT.', pageWidth - margin - 150, y + 18, { align: 'right' });
  doc.text('UNITARIO', pageWidth - margin - 75, y + 18, { align: 'right' });
  doc.text('SUBTOTAL', pageWidth - margin - 12, y + 18, { align: 'right' });

  y += 38;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  let total = 0;
  quote.items.forEach((item, index) => {
    const sub = item.quantity * item.unitPrice;
    total += sub;

    if (index % 2 === 1) {
      doc.setFillColor(250, 251, 253);
      doc.rect(margin, y - 14, pageWidth - margin * 2, 26, 'F');
    }

    doc.setTextColor(25, 30, 40);
    const wrappedDesc = doc.splitTextToSize(
      item.description || 'Servicio de edición',
      pageWidth - margin * 2 - 200
    );
    doc.text(wrappedDesc, margin + 12, y);

    doc.text(String(item.quantity), pageWidth - margin - 150, y, {
      align: 'right',
    });
    doc.text(
      `${settings.currency}${item.unitPrice.toLocaleString('es-ES')}`,
      pageWidth - margin - 75,
      y,
      { align: 'right' }
    );
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${settings.currency}${sub.toLocaleString('es-ES')}`,
      pageWidth - margin - 12,
      y,
      { align: 'right' }
    );
    doc.setFont('helvetica', 'normal');

    y += Math.max(26, wrappedDesc.length * 14 + 10);
  });

  // Totals & Deposit Box
  y += 16;
  const depositAmount = Math.round((total * quote.depositPercent) / 100);
  const remainingAmount = Math.max(0, total - depositAmount);

  doc.setFillColor(15, 17, 23);
  doc.roundedRect(pageWidth - margin - 240, y, 240, 92, 10, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', pageWidth - margin - 224, y + 26);
  doc.setTextColor(217, 249, 80);
  doc.setFontSize(15);
  doc.text(
    `${settings.currency}${total.toLocaleString('es-ES')}`,
    pageWidth - margin - 16,
    y + 26,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(210, 215, 225);
  doc.text(
    `Anticipo para iniciar (${quote.depositPercent}%):`,
    pageWidth - margin - 224,
    y + 52
  );
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${settings.currency}${depositAmount.toLocaleString('es-ES')}`,
    pageWidth - margin - 16,
    y + 52,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.text('Restante contra entrega:', pageWidth - margin - 224, y + 72);
  doc.text(
    `${settings.currency}${remainingAmount.toLocaleString('es-ES')}`,
    pageWidth - margin - 16,
    y + 72,
    { align: 'right' }
  );

  // Notes & Terms
  if (quote.notes) {
    const notesY = y + 118;
    doc.setTextColor(30, 35, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Condiciones y Notas:', margin, notesY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(80, 90, 105);
    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, notesY + 16);
  }

  doc.save(`${quote.number}-${quote.title.slice(0, 24).replace(/\s+/g, '_')}.pdf`);
}
