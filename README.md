# PNL Screenshot Telegram Bot

This bot calculates leveraged PNL and overlays the editable values onto a PNL screenshot template.

## Required template

Upload the supplied screenshot to this exact path in the repository:

```text
assets/pnl-template.png
```

The renderer is aligned to the supplied 1536x1024 screenshot.

## Setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your Telegram bot token and your Telegram user ID.
5. Keep `DEFAULT_MARGIN=500`, or change it to your normal margin.
6. Start with `npm start`.

## Telegram command

One line:

```text
/edit BRUSDT LONG 10x 0.21867 0.65518 500
```

Labeled format:

```text
/edit
Coin: BRUSDT
Side: LONG
Leverage: 10x
Entry: 0.21867
Last: 0.65518
Margin: 500
```

The bot calculates:

- Price movement percentage
- Leveraged PNL percentage / ROI
- PNL amount from margin

For a SHORT trade, use `SHORT`. If margin is omitted, `DEFAULT_MARGIN` is used.

## Values you edit each time

- Coin
- Side: LONG or SHORT
- Leverage
- Entry price
- Last / mark price
- Optional margin

You do **not** type the PNL percentage or PNL amount; the bot calculates them.
