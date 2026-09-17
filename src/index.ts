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

bot.start((ctx) => ctx.reply('PNL Bot ready. Use /edit COIN LONG 10x ENTRY LAST [MARGIN].\nExample: /edit BRUSDT LONG 10x 0.21867 0.65518 500'));
bot.command('edit', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('Unauthorized.');
  try {
    const trade = parseEditCommand(ctx.message.text);
    const result = calculatePnl({ ...trade, margin: trade.margin ?? defaultMargin });
    const image = await renderPnl(templatePath, { ...trade, ...result });
    await ctx.replyWithPhoto({ source: image }, { caption: `✅ ${trade.coin} ${trade.side}\nLeverage: ${trade.leverage}x\nEntry: ${trade.entry}\nLast: ${trade.last}\nPNL: ${formatPercent(result.pnlPercent)}\nAmount: ${formatMoney(result.pnlAmount)}` });
  } catch (error: any) {
    await ctx.reply(`❌ ${error.message}\n\nFormat: /edit COIN LONG|SHORT LEVERAGE ENTRY LAST [MARGIN]`);
  }
});

bot.command('help', (ctx) => ctx.reply('Commands:\n/edit COIN LONG|SHORT LEVERAGE ENTRY LAST [MARGIN]\n/setmargin is planned for the next version.\n\nFields edited: coin, side, leverage, entry price, last price, PNL %, and PNL amount.'));
bot.launch();
console.log('PNL bot running');
