import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Client, Project, StudioSettings } from '../types/studio';

function buildReceiptNumber(project: Project) {
  const short = project.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `REC-${format(new Date(), 'MMdd')}-${short || '01'}`;
}

// ============================================================================
// 1. VECTOR PDF PAYMENT RECEIPT
// ============================================================================
export function generatePaymentReceiptPdf(
  project: Project,
  settings: StudioSettings,
  client?: Client
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a5' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const margin = 32;
  const receiptNo = buildReceiptNumber(project);
  const pending = Math.max(0, project.price - project.amountPaid);
  const isPaidFull = pending === 0 && project.price > 0;

  // Full Dark Obsidian Luxury Receipt Background
  doc.setFillColor(12, 14, 19);
  doc.rect(0, 0, w, h, 'F');

  // Top Accent Bar
  doc.setFillColor(217, 249, 80);
  doc.rect(0, 0, w, 8, 'F');

  // Header Badge
  doc.setFillColor(217, 249, 80);
  doc.roundedRect(margin, 30, 130, 22, 11, 11, 'F');
  doc.setTextColor(12, 14, 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('COMPROBANTE DE PAGO', margin + 12, 44);

  // Folio & Date
  doc.setTextColor(180, 188, 205);
  doc.setFontSize(9);
  doc.text(receiptNo, w - margin, 40, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(
    format(new Date(), "d 'de' MMMM yyyy", { locale: es }),
    w - margin,
    54,
    { align: 'right' }
  );

  // Studio Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(settings.studioName, margin, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(150, 160, 180);
  doc.text(`Editor responsable: ${settings.editorName}`, margin, 98);

  // Main Receipt Card
  doc.setFillColor(24, 27, 36);
  doc.roundedRect(margin, 118, w - margin * 2, 215, 14, 14, 'F');

  // Amount Paid Hero
  doc.setTextColor(160, 170, 190);
  doc.setFontSize(9);
  doc.text('MONTO RECIBIDO', margin + 20, 146);

  doc.setTextColor(217, 249, 80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(
    `${settings.currency}${project.amountPaid.toLocaleString('es-ES')}`,
    margin + 20,
    178
  );

  // Status Stamp Pill
  if (isPaidFull) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(w - margin - 122, 152, 102, 24, 12, 12, 'F');
    doc.setTextColor(10, 15, 15);
    doc.setFontSize(8.5);
    doc.text('PAGADO 100%', w - margin - 71, 167, { align: 'center' });
  } else {
    doc.setFillColor(238, 125, 38);
    doc.roundedRect(w - margin - 132, 152, 112, 24, 12, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text('ANTICIPO / ABONO', w - margin - 76, 167, { align: 'center' });
  }

  // Divider
  doc.setDrawColor(45, 52, 68);
  doc.line(margin + 20, 196, w - margin - 20, 196);

  // Client & Project rows
  const row = (label: string, val: string, yPos: number, highlight = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(150, 160, 180);
    doc.text(label, margin + 20, yPos);

    doc.setFont('helvetica', 'bold');
    if (highlight) {
      doc.setTextColor(238, 125, 38);
    } else {
      doc.setTextColor(255, 255, 255);
    }
    const cleanVal = val.length > 36 ? val.slice(0, 35) + '...' : val;
    doc.text(cleanVal, w - margin - 20, yPos, { align: 'right' });
  };

  row(
    'Cliente:',
    client ? `${client.name} ${client.company ? `(${client.company})` : ''}` : 'Cliente',
    220
  );
  row('Proyecto:', project.title, 242);
  row('Formato:', project.format, 264);
  row(
    'Valor Total del Proyecto:',
    `${settings.currency}${project.price.toLocaleString('es-ES')}`,
    286
  );
  row(
    'Saldo Pendiente:',
    pending === 0
      ? `${settings.currency}0 (Liquidado)`
      : `${settings.currency}${pending.toLocaleString('es-ES')}`,
    310,
    pending > 0
  );

  // Footer thank you
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(135, 145, 165);
  doc.text(
    'Gracias por tu confianza. Este documento respalda tu pago registrado.',
    w / 2,
    h - 44,
    { align: 'center' }
  );

  doc.save(`${receiptNo}-${project.title.slice(0, 18).replace(/\s+/g, '_')}.pdf`);
}

// ============================================================================
// 2. HIGH-RESOLUTION PNG PAYMENT RECEIPT (1080x1350 WhatsApp-Ready Card)
// ============================================================================
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function generatePaymentReceiptPng(
  project: Project,
  settings: StudioSettings,
  client?: Client
): Promise<void> {
  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const receiptNo = buildReceiptNumber(project);
  const pending = Math.max(0, project.price - project.amountPaid);
  const isPaidFull = pending === 0 && project.price > 0;

  // 1. Deep Obsidian Studio Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0B0C10');
  bgGrad.addColorStop(1, '#131620');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Ambient Electric Lime & Violet Glows
  const limeGlow = ctx.createRadialGradient(180, 150, 20, 180, 150, 420);
  limeGlow.addColorStop(0, 'rgba(217, 249, 80, 0.22)');
  limeGlow.addColorStop(1, 'rgba(217, 249, 80, 0)');
  ctx.fillStyle = limeGlow;
  ctx.fillRect(0, 0, W, H);

  const violetGlow = ctx.createRadialGradient(920, 1150, 20, 920, 1150, 460);
  violetGlow.addColorStop(0, 'rgba(178, 120, 255, 0.22)');
  violetGlow.addColorStop(1, 'rgba(178, 120, 255, 0)');
  ctx.fillStyle = violetGlow;
  ctx.fillRect(0, 0, W, H);

  // 2. Main Ticket Container
  const cardX = 84;
  const cardY = 96;
  const cardW = W - cardX * 2;
  const cardH = H - cardY * 2;

  ctx.fillStyle = '#171A24';
  roundRect(ctx, cardX, cardY, cardW, cardH, 52);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.stroke();

  // Top Electric Lime Header Banner inside Ticket
  ctx.fillStyle = '#D9F950';
  roundRect(ctx, cardX + 36, cardY + 36, cardW - 72, 230, 38);
  ctx.fill();

  // Studio Pill inside Lime Banner
  ctx.fillStyle = '#0B0C10';
  roundRect(ctx, cardX + 74, cardY + 70, 290, 48, 24);
  ctx.fill();

  ctx.fillStyle = '#D9F950';
  ctx.font = '800 21px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('COMPROBANTE OFICIAL', cardX + 98, cardY + 101);

  // Receipt Folio on Top Right
  ctx.fillStyle = '#0B0C10';
  ctx.font = '800 26px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(receiptNo, cardX + cardW - 74, cardY + 102);

  // Studio Name Big
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0B0C10';
  ctx.font = '800 54px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(settings.studioName, cardX + 74, cardY + 185);

  ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(11, 12, 16, 0.78)';
  ctx.fillText(
    `Emitido por ${settings.editorName}  •  ${format(new Date(), "d MMM yyyy", { locale: es })}`,
    cardX + 74,
    cardY + 228
  );

  // 3. Amount Paid Hero Block
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('MONTO RECIBIDO', cardX + 74, cardY + 345);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 96px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(
    `${settings.currency}${project.amountPaid.toLocaleString('es-ES')}`,
    cardX + 74,
    cardY + 450
  );

  // Status Badge Pill
  const pillText = isPaidFull ? '✓ LIQUIDADO 100%' : '⚡ ANTICIPO RECIBIDO';
  ctx.fillStyle = isPaidFull ? 'rgba(52, 211, 153, 0.18)' : 'rgba(238, 125, 38, 0.2)';
  roundRect(ctx, cardX + 74, cardY + 485, 320, 56, 28);
  ctx.fill();

  ctx.fillStyle = isPaidFull ? '#34D399' : '#EE7D26';
  ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(pillText, cardX + 102, cardY + 521);

  // Perforated Ticket Line + Side Notches
  const lineY = cardY + 595;
  ctx.fillStyle = '#0E1017';
  ctx.beginPath();
  ctx.arc(cardX, lineY, 24, 0, Math.PI * 2);
  ctx.arc(cardX + cardW, lineY, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.setLineDash([14, 14]);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 44, lineY);
  ctx.lineTo(cardX + cardW - 44, lineY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Detail Rows
  const drawDetail = (
    label: string,
    value: string,
    y: number,
    valueColor = '#FFFFFF'
  ) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 26px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(label, cardX + 74, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = valueColor;
    ctx.font = '800 28px "Plus Jakarta Sans", system-ui, sans-serif';
    const trimmed = value.length > 34 ? value.slice(0, 33) + '…' : value;
    ctx.fillText(trimmed, cardX + cardW - 74, y);
  };

  const clientDisplay = client
    ? `${client.name}${client.company ? ` • ${client.company}` : ''}`
    : 'Cliente';

  drawDetail('Cliente', clientDisplay, cardY + 680);
  drawDetail('Proyecto', project.title, cardY + 755);
  drawDetail('Formato', project.format, cardY + 830, '#B278FF');
  drawDetail(
    'Total del Proyecto',
    `${settings.currency}${project.price.toLocaleString('es-ES')}`,
    cardY + 905
  );
  drawDetail(
    'Saldo Pendiente',
    pending === 0
      ? `${settings.currency}0 (Pagado)`
      : `${settings.currency}${pending.toLocaleString('es-ES')}`,
    cardY + 980,
    pending === 0 ? '#34D399' : '#EE7D26'
  );

  // Footer Box
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  roundRect(ctx, cardX + 54, cardY + 1035, cardW - 108, 82, 24);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    '¡Gracias por trabajar con nosotros! Comprobante generado digitalmente.',
    W / 2,
    cardY + 1084
  );

  // Trigger download as crisp PNG
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receiptNo}-${project.title.slice(0, 18).replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}
