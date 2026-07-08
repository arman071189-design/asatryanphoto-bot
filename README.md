# Beauty Salon Telegram Mini App

Աշխատող demo/prototype՝ beauty salon-ի համար։

## Ինչ կա

- Telegram Mini App էջ՝ `/app/`
- Ծառայության ընտրություն
- Մասնագետի ընտրություն
- Ամսաթիվ/ժամ ընտրություն
- Հիշեցում այցից 2 ժամ առաջ
- Admin panel՝ PIN `2026`
- Python backend՝ առանց external dependency-ի
- Telegram bot `/start` հրաման՝ Mini App կոճակով
- Booking-ների պահպանում JSON ֆայլում

## Local запуск

Root պանակում արդեն կա local `.env`, որտեղ պահված է bot token-ը։

```powershell
.\outputs\beauty-salon-mini-app\run-local.ps1
```

Բացեք՝

```text
http://localhost:8000/app/
```

Telegram-ում գրեք bot-ին `/start`։ Local URL-ը Telegram mobile-ում սովորաբար չի բացվի որպես production Mini App, որովհետև Telegram-ը պահանջում է public HTTPS URL։

## Production

Deploy անելիս environment variables-ում դրեք՝

```text
BOT_TOKEN=...
WEB_APP_URL=https://your-domain.example/app/
ADMIN_CHAT_ID=...
```

Admin chat id ստանալու համար bot-ին գրեք `/admin`, հետո ստացված id-ն դրեք `ADMIN_CHAT_ID`-ի մեջ։

## Ինչու bot-ում կարող է չբացվել

Եթե `WEB_APP_URL`-ը `http://localhost:8000/app/` է, Telegram-ը չի բացի Mini App-ը հեռախոսում։ Պետք է deploy անել public HTTPS հասցեի վրա, օրինակ՝ Render, Railway, VPS կամ Cloudflare Tunnel։

Այս պանակում կա `render.yaml`, որը պատրաստ է Render deploy-ի համար։ Deploy-ից հետո դրեք՝

```text
WEB_APP_URL=https://your-render-service.onrender.com/app/
```

Հետո Telegram-ում կրկին ուղարկեք `/start`։
