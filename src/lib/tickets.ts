import type { CartLine } from '../stores/cartStore';
import type { StockMovement } from '../types/Product';
import type { CustomOrder } from '../types/Sale';
import type { ShopSettings } from '../hooks/useShopSettings';
import { formatCurrency } from './utils';

export interface SaleTicket {
  id: string;
  sellerName: string;
  paymentMethod: string;
  customerPhone: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  createdAt: string;
}

function cleanPdfText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[()\\]/g, '');
}

function money(value: number) {
  return cleanPdfText(formatCurrency(value));
}

function pdfLine(text: string, x: number, y: number, size = 9, bold = false) {
  return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${cleanPdfText(text)}) Tj ET`;
}

function downloadPdf(filename: string, lines: string[]) {
  const width = 226;
  const height = Math.max(420, 92 + lines.length * 16);
  let y = height - 34;
  const content = lines
    .map((line) => {
      const size = line.startsWith('#') ? 14 : line.startsWith('##') ? 11 : 9;
      const bold = line.startsWith('#') || line.startsWith('TOTAL') || line.startsWith('1ere');
      const text = line.replace(/^##?\s*/, '');
      const output = pdfLine(text, 18, y, size, bold);
      y -= line === '' ? 8 : 15;
      return output;
    })
    .join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([body], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function saleTicketLines(ticket: SaleTicket, settings?: Partial<ShopSettings>) {
  const shopName = settings?.shopName || '1ere Commerce';
  const footer = settings?.footerMessage || 'Thank you for shopping with us';
  return [
    `# ${shopName}`,
    settings?.address ? settings.address : '',
    settings?.phone ? settings.phone : '',
    'SALES RECEIPT',
    '------------------------------',
    `Order: ${ticket.id.slice(0, 8).toUpperCase()}`,
    `Date: ${new Date(ticket.createdAt).toLocaleString('fr-FR')}`,
    `Cashier: ${ticket.sellerName || '-'}`,
    ticket.customerPhone ? `Customer: ${ticket.customerPhone}` : 'Customer: Walk-in',
    '------------------------------',
    ...ticket.items.flatMap((item) => [
      item.name,
      `${item.sku}  x${item.quantity}   ${money(item.unitPrice * item.quantity)}`,
    ]),
    '------------------------------',
    `Subtotal              ${money(ticket.subtotal)}`,
    `Discount              ${money(ticket.discount)}`,
    `Tax                   ${money(ticket.tax)}`,
    `TOTAL                 ${money(ticket.total)}`,
    `Paid                  ${money(ticket.paidAmount)}`,
    `Change                ${money(Math.max(0, ticket.paidAmount - ticket.total))}`,
    `Payment               ${ticket.paymentMethod}`,
    '------------------------------',
    footer,
  ].filter(Boolean);
}

export function downloadSaleTicket(ticket: SaleTicket, settings?: Partial<ShopSettings>) {
  downloadPdf(`ticket-vente-${ticket.id.slice(0, 8)}.pdf`, saleTicketLines(ticket, settings));
}

export function downloadOrderTicket(order: CustomOrder, statusLabel: string, settings?: Partial<ShopSettings>) {
  const shopName = settings?.shopName || '1ere Commerce';
  downloadPdf(`ticket-commande-${order.id.slice(0, 8)}.pdf`, [
    `# ${shopName}`,
    settings?.address ? settings.address : '',
    settings?.phone ? settings.phone : '',
    'Custom order ticket',
    `Order: ${order.id.slice(0, 8)}`,
    `Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR') : '-'}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Status: ${statusLabel}`,
    '------------------------------',
    `Type: ${order.productType}`,
    order.details,
    '------------------------------',
    `Deposit               ${money(order.deposit)}`,
    `TOTAL                 ${money(order.totalPrice)}`,
    `Remaining             ${money(Math.max(0, order.totalPrice - order.deposit))}`,
    `Due date              ${order.dueDate}`,
    settings?.footerMessage || '',
  ].filter(Boolean));
}
