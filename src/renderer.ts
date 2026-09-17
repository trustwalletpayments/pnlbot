import sharp from 'sharp';
import fs from 'node:fs/promises';

const WIDTH = 1536;
const HEIGHT = 1024;

const fields = {
  coin: { x: 80, y: 113, size: 54 },
  leverage: { x: 752, y: 113, size: 40 },
  pnlAmount: { x: 61, y: 316, size: 96 },
  pnlPercent: { x: 955, y: 316, size: 66 },
  size: { x: 61, y: 511, size: 40 },
  margin: { x: 600, y: 511, size: 40 },
  marginRatio: { x: 1158, y: 511, size: 40 },
  entry: { x: 61, y: 645, size: 40 },
  last: { x: 600, y: 645, size: 40 },
};

// Blur only the original dynamic-value areas. This preserves the original
// background gradients and prevents old numbers from showing underneath.
const eraseAreas = [
  { left: 45, top: 55, width: 430, height: 90 },
  { left: 680, top: 55, width: 245, height: 90 },
  { left: 45, top: 225, width: 635, height: 125 },
  { left: 925, top: 265, width: 470, height: 95 },
  { left: 45, top: 470, width: 320, height: 80 },
  { left: 575, top: 470, width: 375, height: 80 },
  { left: 1125, top: 470, width: 365, height: 80 },
  { left: 45, top: 600, width: 320, height: 80 },
  { left: 575, top: 600, width: 375, height: 80 },
];

export async function renderPnl(templatePath: string, data: any) {
  const base = await fs.readFile(templatePath);
  const positive = Number(data.pnlAmount) >= 0;
  const pnlColor = positive ? '#00e5a0' : '#ff5577';
  const pnlSign = positive ? '+' : '-';

  const image = sharp(base);
  const eraseLayers = [];

  for (const area of eraseAreas) {
    const patch = await sharp(base)
      .extract(area)
      .blur(18)
      .png()
      .toBuffer();
    eraseLayers.push({ input: patch, left: area.left, top: area.top });
  }

  const cleaned = await image
    .composite(eraseLayers)
    .png()
    .toBuffer();

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .white { font-family: sans-serif; font-weight: 700; fill: #f5f7ff; }
      .pnl { font-family: sans-serif; font-weight: 700; fill: ${pnlColor}; }
    </style>
    <text class="white" x="${fields.coin.x}" y="${fields.coin.y}" font-size="${fields.coin.size}">${escape(String(data.coin))}</text>
    <text class="white" x="${fields.leverage.x}" y="${fields.leverage.y}" font-size="${fields.leverage.size}">Cross ${escape(String(data.leverage))}X</text>
    <text class="pnl" x="${fields.pnlAmount.x}" y="${fields.pnlAmount.y}" font-size="${fields.pnlAmount.size}">${pnlSign}${Math.abs(Number(data.pnlAmount)).toFixed(4)}</text>
    <text class="pnl" x="${fields.pnlPercent.x}" y="${fields.pnlPercent.y}" font-size="${fields.pnlPercent.size}">${positive ? '+' : '-'}${Math.abs(Number(data.pnlPercent)).toFixed(2)}%</text>
    <text class="white" x="${fields.size.x}" y="${fields.size.y}" font-size="${fields.size.size}">${Number(data.size).toFixed(2)}</text>
    <text class="white" x="${fields.margin.x}" y="${fields.margin.y}" font-size="${fields.margin.size}">${Number(data.margin).toFixed(4)}</text>
    <text class="white" x="${fields.marginRatio.x}" y="${fields.marginRatio.y}" font-size="${fields.marginRatio.size}">${Number(data.marginRatio).toFixed(2)}%</text>
    <text class="white" x="${fields.entry.x}" y="${fields.entry.y}" font-size="${fields.entry.size}">${escape(String(data.entry))}</text>
    <text class="white" x="${fields.last.x}" y="${fields.last.y}" font-size="${fields.last.size}">${escape(String(data.last))}</text>
  </svg>`;

  return sharp(cleaned)
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
