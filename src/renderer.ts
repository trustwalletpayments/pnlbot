import sharp from 'sharp';
import fs from 'node:fs/promises';

// Replace these coordinates after uploading your real PNL sample.
const fields = {
  coin: { x: 80, y: 70, size: 32 }, side: { x: 80, y: 115, size: 24 }, leverage: { x: 220, y: 115, size: 24 },
  entry: { x: 80, y: 170, size: 22 }, last: { x: 80, y: 215, size: 22 }, pnlPercent: { x: 80, y: 270, size: 30 }, pnlAmount: { x: 80, y: 325, size: 30 }
};

export async function renderPnl(templatePath: string, data: any) {
  const base = await fs.readFile(templatePath);
  const svg = `<svg width="1200" height="700" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Arial,sans-serif;fill:white}</style>
    <text x="${fields.coin.x}" y="${fields.coin.y}" font-size="${fields.coin.size}">${escape(data.coin)}</text>
    <text x="${fields.side.x}" y="${fields.side.y}" font-size="${fields.side.size}">${data.side}</text>
    <text x="${fields.leverage.x}" y="${fields.leverage.y}" font-size="${fields.leverage.size}">${data.leverage}x</text>
    <text x="${fields.entry.x}" y="${fields.entry.y}" font-size="${fields.entry.size}">${data.entry}</text>
    <text x="${fields.last.x}" y="${fields.last.y}" font-size="${fields.last.size}">${data.last}</text>
    <text x="${fields.pnlPercent.x}" y="${fields.pnlPercent.y}" font-size="${fields.pnlPercent.size}">${data.pnlPercent.toFixed(1)}%</text>
    <text x="${fields.pnlAmount.x}" y="${fields.pnlAmount.y}" font-size="${fields.pnlAmount.size}">${data.pnlAmount >= 0 ? '+' : '-'}$${Math.abs(data.pnlAmount).toFixed(2)}</text></svg>`;
  return sharp(base).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
}
function escape(value: string) { return value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]!)); }
