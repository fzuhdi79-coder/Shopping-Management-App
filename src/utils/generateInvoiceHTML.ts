// File: src/utils/generateInvoiceHTML.ts

export interface InvoiceItem {
  title:    string;
  priceUSD: number;
  quantity: number;
  imageUrl?: string;
}

export interface InvoiceOptions {
  items:            InvoiceItem[];
  grandTotalUSD:    number;
  discountPct:      number;
  discountAmtUSD:   number;
  finalTotalUSD:    number;
  appliedPromo:     string;
  selectedCurrency: string;
  formatPrice:      (usd: number) => string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad   = (n: number) => String(n).padStart(2, '0');
const nowID = () => {
  const d = new Date();
  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};
const invoiceNo = () =>
  'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

// ─── Main generator ───────────────────────────────────────────────────────────
export function generateInvoiceHTML(opts: InvoiceOptions): string {
  const {
    items,
    grandTotalUSD,
    discountPct,
    discountAmtUSD,
    finalTotalUSD,
    appliedPromo,
    formatPrice,
  } = opts;

  const invNo   = invoiceNo();
  const invDate = nowID();
  const hasDisc = discountPct > 0;

  // Build item rows (Format: Qty, Item Name @ Price, Subtotal)
  const itemRows = items
    .map((item) => {
      const subtotal = item.priceUSD * item.quantity;
      return `
        <tr>
          <td class="td-qty">${item.quantity}x</td>
          <td class="td-item">
            <div class="item-name">${item.title}</div>
            <div class="item-price">@ ${formatPrice(item.priceUSD)}</div>
          </td>
          <td class="td-subtotal">${formatPrice(subtotal)}</td>
        </tr>`;
    })
    .join('');

  const discountRow = hasDisc
    ? `
      <div class="summary-row">
        <span>Discount (${appliedPromo})</span>
        <span>- ${formatPrice(discountAmtUSD)}</span>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt ${invNo}</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      /* Menggunakan font monospace agar terlihat seperti struk kasir asli */
      font-family: 'Courier New', Courier, monospace;
      background: #ffffff;
      color: #000000;
      font-size: 14px;
      line-height: 1.4;
      display: flex;
      justify-content: center;
      padding: 20px;
    }

    /* ── Kertas Struk ── */
    .receipt {
      width: 320px; /* Ukuran standar struk kasir */
      max-width: 100%;
      background: #fff;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 22px;
      margin-bottom: 5px;
      letter-spacing: 1px;
    }
    .header p {
      font-size: 12px;
      color: #333;
    }

    /* ── Garis Putus-Putus ── */
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }

    /* ── Informasi Pesanan ── */
    .meta-info {
      font-size: 13px;
      margin: 10px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    /* ── Tabel Item ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    td {
      vertical-align: top;
      padding: 6px 0;
    }
    .td-qty {
      width: 15%;
      font-weight: bold;
    }
    .td-item {
      width: 55%;
      padding-right: 10px;
    }
    .item-name {
      font-weight: bold;
      word-break: break-word;
    }
    .item-price {
      font-size: 12px;
      color: #555;
      margin-top: 2px;
    }
    .td-subtotal {
      width: 30%;
      text-align: right;
      font-weight: bold;
    }

    /* ── Summary / Total ── */
    .summary {
      margin-top: 10px;
      font-size: 14px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .total-row {
      font-size: 18px;
      font-weight: bold;
      border-top: 1px dashed #000;
      padding-top: 10px;
      margin-top: 5px;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 13px;
    }
    .footer-bold {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .barcode {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px;
      letter-spacing: 2px;
      margin-top: 15px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="receipt">
    
    <div class="header">
      <h1>PPNS Store</h1>
      <p>Jl. Teknik Kimia, Kampus ITS Sukolilo<br/>Surabaya, Indonesia </p>
    </div>

    <div class="divider"></div>

    <div class="meta-info">
      <div class="meta-row">
        <span>No.</span>
        <span>${invNo}</span>
      </div>
      <div class="meta-row">
        <span>Tgl.</span>
        <span>${invDate}</span>
      </div>
      <div class="meta-row">
        <span>Kasir</span>
        <span>Admin-01</span>
      </div>
    </div>

    <div class="divider"></div>

    <table>
      ${itemRows}
    </table>

    <div class="divider"></div>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${formatPrice(grandTotalUSD)}</span>
      </div>
      ${discountRow}
      <div class="summary-row total-row">
        <span>TOTAL</span>
        <span>${formatPrice(finalTotalUSD)}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="footer">
      <div class="footer-bold">TERIMA KASIH</div>
      <div>Silakan datang kembali</div>
      <div class="barcode">||| |||| | |||| || || | |||</div>
      <div style="font-size: 10px; margin-top: 5px;">${invNo}</div>
    </div>

  </div>
</body>
</html>`;
}