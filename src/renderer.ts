import sharp from 'sharp';
import fs from 'node:fs/promises';

const WIDTH = 1536;
const HEIGHT = 1024;

// Coordinates for the supplied 1536x1024 screenshot.
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

export async function renderPnl(templatePath: string, data: any) {
  const base = await fs.readFile(templatePath);

  // Opaque masks remove every old numeric value first. This prevents the
  // original sample numbers from showing through or appearing twice.
  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .white { font-family: Arial, Helvetica, sans-serif; font-weight: 700; fill: #f5f7ff; }
      .green { font-family: Arial, Helvetica, sans-serif; font-weight: 700; fill: #00e5a0; }
    </style>

    <g fill="#06101b">
      <rect x="45" y="230" width="570" height="115" rx="10" />
      <rect x="925" y="260" width="370" height="90" rx="10" />
      <rect x="45" y="465" width="390" height="75" rx="8" />
      <rect x="575" y="465" width="390" height="75" rx="8" />
      <rect x="1125" y="465" width="365" height="75" rx="8" />
      <rect x="45" y="595" width="390" height="75" rx="8" />
      <rect x="575" y="595" width="390" height="75" rx="8" />
    </g>

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
    .composite([{ input: Buffer.from(svg), top: 0, left: 0, blend: 'over' }])
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
