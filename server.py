import json
import os
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


def load_env_file(path):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file(Path.cwd() / ".env")
load_env_file(BASE_DIR / ".env")

BOT_TOKEN = os.environ.get("BOT_TOKEN", "").strip()
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "").strip()
WEB_APP_URL = os.environ.get("WEB_APP_URL", "http://localhost:8000/app/").strip()
PORT = int(os.environ.get("PORT", "8000"))
API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"
APP_VERSION = "20260710-flow6"
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATA_FILE = DATA_DIR / "bookings.json"
USERS_FILE = DATA_DIR / "users.json"
CATALOG_FILE = DATA_DIR / "catalog.json"

STATUS_LABELS = {
    "pending": "սպասում է հաստատման",
    "confirmed": "հաստատված է",
    "cancelled": "չեղարկված է",
    "completed": "ավարտված է",
}


def read_json(path, fallback):
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return fallback


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def telegram(method, payload=None):
    if not BOT_TOKEN:
        return None
    data = json.dumps(payload or {}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{API_BASE}/{method}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def send_message(chat_id, text, reply_markup=None):
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        return telegram("sendMessage", payload)
    except Exception as exc:
        print(f"sendMessage error: {exc}", flush=True)
        return None


def answer_callback(callback_id, text=""):
    try:
        telegram("answerCallbackQuery", {"callback_query_id": callback_id, "text": text})
    except Exception as exc:
        print(f"answerCallbackQuery error: {exc}", flush=True)


def web_app_keyboard():
    return {
        "inline_keyboard": [
            [{"text": "Բացել Beauty Studio Mini App-ը", "web_app": {"url": web_app_url()}}],
        ]
    }


def web_app_url():
    separator = "&" if "?" in WEB_APP_URL else "?"
    if "v=" in WEB_APP_URL:
        return WEB_APP_URL
    return f"{WEB_APP_URL}{separator}v={APP_VERSION}"


def admin_booking_keyboard(booking_id):
    return {
        "inline_keyboard": [
            [
                {"text": "Հաստատել", "callback_data": f"booking:confirmed:{booking_id}"},
                {"text": "Չեղարկել", "callback_data": f"booking:cancelled:{booking_id}"},
            ],
            [{"text": "Բացել Mini App-ը", "web_app": {"url": web_app_url()}}],
        ]
    }


def booking_text(booking):
    vip = "VIP հաճախորդ\n" if booking.get("vip") else ""
    loyalty = f"Loyalty՝ {booking.get('loyaltyLevel', 'Standard')}\n"
    contact = f"Հաճախորդ՝ {booking.get('clientName', '-')} {booking.get('clientSurname', '')}, {booking.get('clientPhone', '-')}\n"
    return (
        f"Նոր ամրագրում ({STATUS_LABELS.get(booking.get('status'), booking.get('status'))})\n"
        f"{vip}{loyalty}{contact}"
        f"Ծառայություն՝ {booking.get('serviceName')}\n"
        f"Մասնագետ՝ {booking.get('specialistName')}\n"
        f"Ամսաթիվ՝ {booking.get('date')} {booking.get('time')}\n"
        f"Գին՝ {booking.get('price')} ֏"
    )


def find_booking(bookings, booking_id):
    return next((item for item in bookings if item.get("id") == booking_id), None)


def update_booking_status(booking_id, status, source="admin"):
    bookings = read_json(DATA_FILE, [])
    booking = find_booking(bookings, booking_id)
    if not booking:
        return None
    booking["status"] = status
    booking["updatedAt"] = datetime.utcnow().isoformat()
    booking["updatedBy"] = source
    write_json(DATA_FILE, bookings)

    label = STATUS_LABELS.get(status, status)
    if booking.get("telegramUserId"):
        send_message(
            booking["telegramUserId"],
            f"Ձեր ամրագրումը {label}։\n{booking.get('serviceName')} · {booking.get('date')} {booking.get('time')}",
        )
    if ADMIN_CHAT_ID and source == "client":
        send_message(ADMIN_CHAT_ID, f"Հաճախորդը չեղարկել է ամրագրումը։\n\n{booking_text(booking)}")
    return booking


def remember_user(message):
    chat = message.get("chat", {})
    from_user = message.get("from", {})
    chat_id = str(chat.get("id", ""))
    if not chat_id:
        return
    users = read_json(USERS_FILE, {})
    users[chat_id] = {
        "chat_id": chat_id,
        "first_name": from_user.get("first_name", ""),
        "username": from_user.get("username", ""),
        "updated_at": datetime.utcnow().isoformat(),
    }
    write_json(USERS_FILE, users)


def handle_callback(update):
    callback = update.get("callback_query") or {}
    data = callback.get("data", "")
    callback_id = callback.get("id")
    if not data.startswith("booking:"):
        answer_callback(callback_id, "Չճանաչված գործողություն")
        return
    _, status, booking_id = data.split(":", 2)
    booking = update_booking_status(booking_id, status, source="admin")
    if booking:
        answer_callback(callback_id, f"Կարգավիճակը՝ {STATUS_LABELS.get(status, status)}")
    else:
        answer_callback(callback_id, "Ամրագրումը չի գտնվել")


def bot_loop():
    if not BOT_TOKEN:
        print("BOT_TOKEN is missing. Web server will run without Telegram polling.", flush=True)
        return

    offset = None
    print("Telegram bot polling started.", flush=True)
    while True:
        try:
            payload = {"timeout": 25}
            if offset is not None:
                payload["offset"] = offset
            result = telegram("getUpdates", payload) or {}
            for update in result.get("result", []):
                offset = update["update_id"] + 1
                if update.get("callback_query"):
                    handle_callback(update)
                    continue
                message = update.get("message") or {}
                if not message:
                    continue
                remember_user(message)
                chat_id = message["chat"]["id"]
                text = (message.get("text") or "").strip()
                if text.startswith("/start"):
                    send_message(chat_id, "Բարի գալուստ Beauty Studio։ Սեղմեք կոճակը և բացեք Mini App-ը։", web_app_keyboard())
                elif text.startswith("/admin"):
                    send_message(chat_id, f"Ձեր chat id-ն է՝ {chat_id}")
                else:
                    send_message(chat_id, "Ամրագրելու համար բացեք Mini App-ը։", web_app_keyboard())
        except Exception as exc:
            print(f"Bot polling error: {exc}", flush=True)
            time.sleep(5)


def reminder_loop():
    while True:
        try:
            bookings = read_json(DATA_FILE, [])
            changed = False
            now = datetime.now()
            for booking in bookings:
                if not booking.get("reminder") or booking.get("status") in {"cancelled", "completed"}:
                    continue
                starts_at = datetime.fromisoformat(f"{booking.get('date')}T{booking.get('time')}:00")
                diff = starts_at - now
                for hours, key in [(24, "reminded24h"), (2, "reminded2h")]:
                    if booking.get(key):
                        continue
                    if timedelta(0) < diff <= timedelta(hours=hours):
                        chat_id = booking.get("telegramUserId") or ADMIN_CHAT_ID
                        if chat_id:
                            send_message(chat_id, f"Հիշեցում՝ {hours} ժամից այց ունեք։\n{booking.get('serviceName')} · {booking.get('date')} {booking.get('time')}")
                        booking[key] = True
                        changed = True
            if changed:
                write_json(DATA_FILE, bookings)
        except Exception as exc:
            print(f"Reminder error: {exc}", flush=True)
        time.sleep(60)


class Handler(SimpleHTTPRequestHandler):
    server_version = "BeautySalonMiniApp/1.7"

    def translate_path(self, path):
        parsed = urllib.parse.urlparse(path)
        clean_path = parsed.path
        if clean_path == "/" or clean_path == "/app":
            clean_path = "/app/"
        if clean_path.startswith("/app/"):
            relative = clean_path.removeprefix("/app/") or "index.html"
            return str(BASE_DIR / relative)
        return str(BASE_DIR / clean_path.lstrip("/"))

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS")
        self.send_header("X-Beauty-Salon-App", "1")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("X-Beauty-Salon-App", "1")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith("/health"):
            return self.send_json(200, {"ok": True, "version": "1.7", "appVersion": APP_VERSION})
        if path.startswith("/api/bookings"):
            return self.send_json(200, read_json(DATA_FILE, []))
        if path.startswith("/api/catalog"):
            return self.send_json(200, read_json(CATALOG_FILE, {}))
        if path == "/" or path == "/app":
            self.send_response(302)
            self.send_header("Location", "/app/")
            self.end_headers()
            return
        if not path.startswith("/app/"):
            self.path = "/app/"
        return super().do_GET()

    def do_POST(self):
        payload = self.read_body()
        if self.path.startswith("/api/bookings"):
            bookings = read_json(DATA_FILE, [])
            booking = payload.get("booking", payload)
            booking.setdefault("id", f"booking_{int(time.time() * 1000)}")
            booking.setdefault("status", "pending")
            booking.setdefault("createdAt", datetime.utcnow().isoformat())
            booking.setdefault("reminded24h", False)
            booking.setdefault("reminded2h", False)
            bookings.append(booking)
            write_json(DATA_FILE, bookings)

            if ADMIN_CHAT_ID:
                send_message(ADMIN_CHAT_ID, booking_text(booking), admin_booking_keyboard(booking["id"]))
            if booking.get("telegramUserId"):
                send_message(
                    booking["telegramUserId"],
                    f"Ձեր ամրագրումը ստացվել է և սպասում է հաստատման։\n{booking.get('serviceName')} · {booking.get('date')} {booking.get('time')}",
                )
            return self.send_json(201, {"ok": True, "booking": booking})

        return self.send_json(404, {"ok": False, "error": "Not found"})

    def do_PUT(self):
        payload = self.read_body()
        if self.path.startswith("/api/catalog"):
            catalog = {
                "services": payload.get("services", []),
                "specialists": payload.get("specialists", []),
                "updatedAt": datetime.utcnow().isoformat(),
            }
            write_json(CATALOG_FILE, catalog)
            return self.send_json(200, {"ok": True, "catalog": catalog})
        return self.send_json(404, {"ok": False, "error": "Not found"})

    def do_PATCH(self):
        payload = self.read_body()
        if self.path.startswith("/api/bookings/"):
            booking_id = urllib.parse.urlparse(self.path).path.rsplit("/", 1)[-1]
            status = payload.get("status")
            if status not in STATUS_LABELS:
                return self.send_json(400, {"ok": False, "error": "Invalid status"})
            booking = update_booking_status(booking_id, status, source=payload.get("source", "admin"))
            if not booking:
                return self.send_json(404, {"ok": False, "error": "Booking not found"})
            return self.send_json(200, {"ok": True, "booking": booking})
        return self.send_json(404, {"ok": False, "error": "Not found"})


def main():
    threading.Thread(target=bot_loop, daemon=True).start()
    threading.Thread(target=reminder_loop, daemon=True).start()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Beauty Salon Mini App server: http://localhost:{PORT}/app/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
