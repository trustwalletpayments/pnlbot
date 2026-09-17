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

const valueRegions = [
  [45, 225, 635, 345],
  [925, 265, 1460, 350],
  [45, 470, 350, 545],
  [575, 470, 950, 545],
  [1125, 470, 1490, 545],
  [45, 600, 350, 675],
  [575, 600, 950, 675],
];

export async function renderPnl(templatePath: string, data: any) {
  const base = await fs.readFile(templatePath);
  const positive = Number(data.pnlAmount) >= 0;
  const pnlColor = positive ? '#00e5a0' : '#ff5577';
  const pnlSign = positive ? '+' : '-';

  const maskSvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="black" />
    ${valueRegions.map(([x1, y1, x2, y2]) => `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="white" />`).join('')}
  </svg>`;

  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
  const blurred = await sharp(base).blur(18).png().toBuffer();
  const blurredMasked = await sharp(blurred)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const cleaned = await sharp(base)
    .composite([{ input: blurredMasked, blend: 'over' }])
    .png()
    .toBuffer();

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .white { font-family: 'DejaVu Sans', sans-serif; font-weight: 700; fill: #f5f7ff; }
      .pnl { font-family: 'DejaVu Sans', sans-serif; font-weight: 700; fill: ${pnlColor}; }
    </style>
    <text class="white" x="${fields.coin.x}" y="${fields.coin.y}" font-size="${fields.coin.size}">${escape(String(data.coin))}</text>
    <text class="white" x="${fields.leverage.x}" y="${fields.leverage.y}" font-size="${fields.leverage.size}">Cross ${escape(String(data.leverage))}X</text>
    <text class="pnl" x="${fields.pnlAmount.x}" y="${fields.pnlAmount.y}" font-size="${fields.pnlAmount.size}">${pnlSign}${Math.abs(Number(data.pnlAmount)).toFixed(4)}</text>
    <text class="pnl" x="${fields.pnlPercent.x}" y="${fields.pnlPercent.y}" font-size="${fields.pnlPercent.size}">${data.pnlPercent >= 0 ? '+' : '-'}${Math.abs(Number(data.pnlPercent)).toFixed(2)}%</text>
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
