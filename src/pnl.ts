export type Side = 'LONG' | 'SHORT';
export type Trade = { coin: string; side: Side; leverage: number; entry: number; last: number; margin?: number };

export function parseEditCommand(text: string): Trade {
  const parts = text.trim().split(/\s+/).slice(1);
  if (parts.length < 5) throw new Error('Missing fields.');
  const [coin, rawSide, rawLev, rawEntry, rawLast, rawMargin] = parts;
  const side = rawSide.toUpperCase() as Side;
  const leverage = Number(rawLev.replace(/x$/i, ''));
  const entry = Number(rawEntry);
  const last = Number(rawLast);
  const margin = rawMargin ? Number(rawMargin) : undefined;
  if (!coin || !['LONG', 'SHORT'].includes(side) || !leverage || !entry || !last || (rawMargin && !margin)) throw new Error('Invalid values.');
  return { coin: coin.toUpperCase(), side, leverage, entry, last, margin };
}

export function calculatePnl(t: Trade) {
  const move = t.side === 'LONG' ? (t.last - t.entry) / t.entry : (t.entry - t.last) / t.entry;
  const pnlPercent = move * 100 * t.leverage;
  const pnlAmount = (t.margin ?? 0) * pnlPercent / 100;
  return { priceChangePercent: move * 100, pnlPercent, pnlAmount };
}

export const formatPercent = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
export const formatMoney = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`;
