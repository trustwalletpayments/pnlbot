import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { calculatePnl, parseEditCommand, formatMoney, formatPercent } from './pnl.js';
import { renderPnl } from './renderer.js';

const token = process.env.BOT_TOKEN;
const defaultMargin = Number(process.env.DEFAULT_MARGIN ?? 0);
const templatePath = process.env.TEMPLATE_PATH ?? './assets/pnl-template.png';

if (!token) throw new Error('BOT_TOKEN is missing');

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply(
  'PNL Bot is ready for everyone.\n\n' +
  'Use: /edit COIN LONG|SHORT LEVERAGE ENTRY LAST [MARGIN]\n' +
  'Example: /edit BRUSDT LONG 10x 0.21867 0.65518 500\n\n' +
  'If margin is omitted, the bot automatically selects a margin between $100 and $500.'
));

bot.command('edit', async (ctx) => {
  try {
    const trade = parseEditCommand(ctx.message.text);
    const selectedMargin = trade.margin ?? (defaultMargin > 0 ? defaultMargin : undefined);
    const result = calculatePnl({ ...trade, margin: selectedMargin });
    const image = await renderPnl(templatePath, { ...trade, ...result });

    await ctx.replyWithPhoto(
      { source: image },
      {
        caption:
          `✅ ${trade.coin} ${trade.side}\n` +
          `Leverage: ${trade.leverage}x\n` +
          `Entry: ${trade.entry}\n` +
          `Last/Mark: ${trade.last}\n` +
          `Size: ${result.size.toFixed(2)} USDT\n` +
          `Margin: ${result.margin.toFixed(4)} USDT\n` +
          `Margin Ratio: ${result.marginRatio.toFixed(2)}%\n` +
          `ROE: ${formatPercent(result.pnlPercent)}\n` +
          `Unrealized PNL: ${formatMoney(result.pnlAmount)}`,
      },
    );
  } catch (error: any) {
    await ctx.reply(
      `❌ ${error.message}\n\n` +
      'Format:\n' +
      '/edit COIN LONG|SHORT LEVERAGE ENTRY LAST [MARGIN]\n\n' +
      'Example:\n' +
      '/edit USELESSUSDT LONG 10x 0.22662 0.24887 500'
    );
  }
});

bot.command('help', (ctx) => ctx.reply(
  'Commands:\n\n' +
  '/edit COIN LONG|SHORT LEVERAGE ENTRY LAST [MARGIN]\n\n' +
  'Margin is optional. Without it, the bot selects a margin from $100 to $500.\n' +
  'The bot calculates ROE, unrealized PNL, position size, and margin ratio below 1%.\n\n' +
  'Labeled format is also supported:\n' +
  'Coin: USELESSUSDT\n' +
  'Side: LONG\n' +
  'Leverage: 10x\n' +
  'Entry: 0.22662\n' +
  'Last: 0.24887\n' +
  'Margin: 500'
));

bot.catch((error, ctx) => {
  console.error('Bot error:', error);
  return ctx.reply('Something went wrong while generating the screenshot. Please try again.');
});

bot.launch();
console.log('Public PNL bot running');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
