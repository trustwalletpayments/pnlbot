export type Side = 'LONG' | 'SHORT';

export type Trade = {
  coin: string;
  side: Side;
  leverage: number;
  entry: number;
  last: number;
  margin?: number;
};

function numberValue(value: string | undefined, label: string): number {
  if (!value) throw new Error(`Missing ${label}.`);
  const parsed = Number(value.replace(/[$,x]/gi, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`Invalid ${label}.`);
  return parsed;
}

export function parseEditCommand(text: string): Trade {
  const cleaned = text.replace(/\r/g, '').trim();
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  const hasLabels = lines.some((line) => line.includes(':'));

  if (hasLabels) {
    const values: Record<string, string> = {};
    for (const line of lines) {
      const separator = line.indexOf(':');
      if (separator < 0) continue;
      const key = line.slice(0, separator).trim().toLowerCase().replace(/[ _-]/g, '');
      values[key] = line.slice(separator + 1).trim();
    }

    const coin = values.coin || values.symbol;
    const side = (values.side || values.direction || '').toUpperCase() as Side;
    if (!coin) throw new Error('Missing coin.');
    if (side !== 'LONG' && side !== 'SHORT') throw new Error('Side must be LONG or SHORT.');

    return {
      coin: coin.toUpperCase(),
      side,
      leverage: numberValue(values.leverage, 'leverage'),
      entry: numberValue(values.entry || values.entryprice, 'entry price'),
      last: numberValue(values.last || values.lastprice || values.markprice, 'last price'),
      margin: values.margin ? numberValue(values.margin, 'margin') : undefined,
    };
  }

  const parts = cleaned.split(/\s+/).slice(1);
  if (parts.length < 5) throw new Error('Missing fields.');
  const [coin, rawSide, rawLev, rawEntry, rawLast, rawMargin] = parts;
  const side = rawSide.toUpperCase() as Side;
  if (!coin) throw new Error('Missing coin.');
  if (side !== 'LONG' && side !== 'SHORT') throw new Error('Side must be LONG or SHORT.');

  return {
    coin: coin.toUpperCase(),
    side,
    leverage: numberValue(rawLev, 'leverage'),
    entry: numberValue(rawEntry, 'entry price'),
    last: numberValue(rawLast, 'last price'),
    margin: rawMargin ? numberValue(rawMargin, 'margin') : undefined,
  };
}

function automaticMargin(): number {
  return Number((100 + Math.random() * 400).toFixed(4));
}

export function calculatePnl(trade: Trade) {
  const margin = trade.margin ?? automaticMargin();
  const priceMove = trade.side === 'LONG'
    ? (trade.last - trade.entry) / trade.entry
    : (trade.entry - trade.last) / trade.entry;

  // Position size is the leveraged notional value.
  const size = margin * trade.leverage;
  const pnlAmount = size * priceMove;
  const pnlPercent = (pnlAmount / margin) * 100;

  // Keep the displayed margin ratio below 1%, matching the supplied UI style.
  const marginRatio = Math.min(0.99, Math.max(0.01, (margin / size) * 0.086 * 100));

  return {
    margin,
    size,
    priceChangePercent: priceMove * 100,
    pnlPercent,
    pnlAmount,
    marginRatio,
  };
}

export const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
export const formatMoney = (value: number) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`;
