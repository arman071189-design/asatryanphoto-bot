# AsatryanPhoto Telegram Mini App

Python-only Telegram Mini App for photographer booking requests. It serves the Mini App UI, stores availability and booking requests in JSON, notifies the photographer in Telegram, and lets the photographer approve or reject requests from inline buttons.

## Run Locally

Create `.env` from `.env.example` and fill in your Telegram bot values:

```text
BOT_TOKEN=123456:ABC...
ADMIN_CHAT_ID=123456789
ENABLE_POLLING=1
```

```powershell
python app.py
```

Open:

```text
http://localhost:8000/app/
```

Admin:

```text
http://localhost:8000/app/admin.html
```

## Telegram Setup

For local testing, keep `ENABLE_POLLING=1`. This lets the bot receive `/start` messages and approve/reject button callbacks without a public HTTPS webhook.

For production with polling:

1. Create a bot with BotFather.
2. Set `BOT_TOKEN` and `ADMIN_CHAT_ID` on the server.
3. Host this app on HTTPS.
4. Set `WEB_APP_URL` to your public app URL:

```text
https://YOUR_DOMAIN/app/
```

5. Keep `ENABLE_POLLING=1`. The app deletes any old webhook on startup so polling can stay active.
6. Add the Mini App URL in BotFather as `https://YOUR_DOMAIN/app/`.

Do not commit `.env`; add secrets only in the hosting provider dashboard.

## Deploy From GitHub To Render

1. Create a new GitHub repository and push this project.
2. In Render, create a new Web Service from that GitHub repository.
3. Use:

```text
Build Command: pip install -r requirements.txt
Start Command: python app.py
Health Check Path: /health
```

4. Add environment variables:

```text
BOT_TOKEN=your_real_bot_token
ADMIN_CHAT_ID=your_admin_chat_id
ENABLE_POLLING=1
ALLOW_LOCAL_TESTING=0
WEB_APP_URL=https://YOUR_RENDER_DOMAIN/app/
DATA_DIR=/var/data
```

5. Add a persistent disk mounted at `/var/data`, so bookings are not lost after deploys.

For a bot that must always answer, use a paid/non-sleeping server plan. Free web services can sleep, and a sleeping bot will not process `/start` until the server wakes up.

## Files

- `app.py` - Python backend, API, Telegram Bot API integration.
- `static/index.html` - Telegram Mini App UI.
- `static/styles.css` - AsatryanPhoto visual style.
- `static/app.js` - booking form logic and Telegram WebApp integration.
- `data/db.json` - created automatically on first run.

## Environment Variables

- `BOT_TOKEN` - Telegram bot token.
- `ADMIN_CHAT_ID` - photographer/admin Telegram chat id.
- `ENABLE_POLLING` - set `1` to keep the bot active with long polling.
- `WEB_APP_URL` - public Mini App URL used in the `/start` button.
- `ALLOW_LOCAL_TESTING` - set `1` only for local browser testing without Telegram init data.
- `DATA_DIR` - optional persistent data directory, default `data`.
- `HOST` - optional, default `0.0.0.0`.
- `PORT` - optional, default `8000`.
