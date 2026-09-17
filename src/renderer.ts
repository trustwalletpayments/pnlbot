import sharp from 'sharp';
import fs from 'node:fs/promises';

// Coordinates are aligned to the supplied 1536x1024 screenshot.
// Upload the screenshot to assets/pnl-template.png.
const fields = {
  coin: { x: 175, y: 113, size: 54 },
  leverage: { x: 752, y: 113, size: 40 },
  pnlAmount: { x: 61, y: 316, size: 96 },
  pnlPercent: { x: 955, y: 316, size: 66 },
  size: { x: 61, y: 511, size: 40 },
  margin: { x: 600, y: 511, size: 40 },
  marginRatio: { x: 1158, y: 511, size: 40 },
  entry: { x: 61, y: 645, size: 40 },
  last: { x: 600, y: 645, size: 40 },
};

export async function renderPnl(templatePath: string, data: any) {
  const base = await fs.readFile(templatePath);
  const svg = `<svg width="1536" height="1024" xmlns="http://www.w3.org/2000/svg">
    <style>
      .white { font-family: Arial, sans-serif; font-weight: 700; fill: #f5f7ff; }
      .green { font-family: Arial, sans-serif; font-weight: 700; fill: #00e5a0; }
    </style>
    <text class="white" x="${fields.coin.x}" y="${fields.coin.y}" font-size="${fields.coin.size}">${escape(String(data.coin))}</text>
    <text class="white" x="${fields.leverage.x}" y="${fields.leverage.y}" font-size="${fields.leverage.size}">Cross ${escape(String(data.leverage))}X</text>
    <text class="green" x="${fields.pnlAmount.x}" y="${fields.pnlAmount.y}" font-size="${fields.pnlAmount.size}">${data.pnlAmount >= 0 ? '+' : '-'}${Math.abs(data.pnlAmount).toFixed(4)}</text>
    <text class="green" x="${fields.pnlPercent.x}" y="${fields.pnlPercent.y}" font-size="${fields.pnlPercent.size}">${data.pnlPercent >= 0 ? '+' : '-'}${Math.abs(data.pnlPercent).toFixed(2)}%</text>
    <text class="white" x="${fields.size.x}" y="${fields.size.y}" font-size="${fields.size.size}">${Number(data.size).toFixed(2)}</text>
    <text class="white" x="${fields.margin.x}" y="${fields.margin.y}" font-size="${fields.margin.size}">${Number(data.margin).toFixed(4)}</text>
    <text class="white" x="${fields.marginRatio.x}" y="${fields.marginRatio.y}" font-size="${fields.marginRatio.size}">${Number(data.marginRatio).toFixed(2)}%</text>
    <text class="white" x="${fields.entry.x}" y="${fields.entry.y}" font-size="${fields.entry.size}">${escape(String(data.entry))}</text>
    <text class="white" x="${fields.last.x}" y="${fields.last.y}" font-size="${fields.last.size}">${escape(String(data.last))}</text>
  </svg>`;

  return sharp(base)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[character]!));
}
