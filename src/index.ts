import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { calculatePnl, parseEditCommand, formatMoney, formatPercent } from './pnl.js';
import { renderPnl } from './renderer.js';

const token = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_TELEGRAM_ID;
const defaultMargin = Number(process.env.DEFAULT_MARGIN ?? 500);
const templatePath = process.env.TEMPLATE_PATH ?? './assets/pnl-template.png';

if (!token) throw new Error('BOT_TOKEN is missing');
const bot = new Telegraf(token);

function isAdmin(ctx: any) {
  return !adminId || String(ctx.from?.id) === String(adminId);
}

const helpText = [
  'PNL Bot ready.',
  '',
  'One-line format:',
  '/edit COIN LONG 10x ENTRY LAST [MARGIN]',
  '',
  'Example:',
  '/edit BRUSDT LONG 10x 0.21867 0.65518 500',
  '',
  'You can also send labeled lines:',
  'Coin: BRUSDT',
  'Side: LONG',
  'Leverage: 10x',
  'Entry: 0.21867',
  'Last: 0.65518',
  'Margin: 500',
].join('\n');

bot.start((ctx) => ctx.reply(helpText));
bot.command('help', (ctx) => ctx.reply(helpText));

bot.command('edit', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('Unauthorized.');

  try {
    const trade = parseEditCommand(ctx.message.text);
    const effectiveTrade = { ...trade, margin: trade.margin ?? defaultMargin };
    const result = calculatePnl(effectiveTrade);
    const image = await renderPnl(templatePath, { ...effectiveTrade, ...result });

    await ctx.replyWithPhoto(
      { source: image },
      {
        caption: [
          `✅ ${effectiveTrade.coin} ${effectiveTrade.side}`,
          `Leverage: ${effectiveTrade.leverage}x`,
          `Entry: ${effectiveTrade.entry}`,
          `Last: ${effectiveTrade.last}`,
          `Margin: $${effectiveTrade.margin}`,
          `PNL: ${formatPercent(result.pnlPercent)}`,
          `Amount: ${formatMoney(result.pnlAmount)}`,
        ].join('\n'),
      },
    );
  } catch (error: any) {
    await ctx.reply(`❌ ${error.message}\n\n${helpText}`);
  }
});

bot.catch((error) => console.error('Telegram bot error:', error));
bot.launch();
console.log('PNL bot running');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
