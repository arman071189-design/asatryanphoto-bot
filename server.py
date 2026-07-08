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
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATA_FILE = DATA_DIR / "bookings.json"
USERS_FILE = DATA_DIR / "users.json"


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
    data = json.dumps(payload or {}).encode("utf-8")
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
    return telegram("sendMessage", payload)


def is_public_https_url(url):
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or ""
    local_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}
    return parsed.scheme == "https" and host not in local_hosts


def web_app_keyboard():
    return {
        "inline_keyboard": [
            [{"text": "Բացել Beauty Studio Mini App-ը", "web_app": {"url": WEB_APP_URL}}],
        ]
    }


def start_message():
    if is_public_https_url(WEB_APP_URL):
        return (
            "Բարի գալուստ Beauty Studio։ Սեղմեք կոճակը և բացեք Mini App-ը։",
            web_app_keyboard(),
        )
    return (
        "Mini App-ը դեռ public HTTPS URL չունի։\n\n"
        f"Այժմ WEB_APP_URL = {WEB_APP_URL}\n"
        "Telegram-ը չի բացում localhost/http հասցեներ։ Deploy արեք app-ը և դրեք "
        "WEB_APP_URL=https://your-domain/app/",
        None,
    )


def booking_text(booking):
    return (
        "Նոր ամրագրում\n"
        f"Ծառայություն՝ {booking.get('serviceName')}\n"
        f"Մասնագետ՝ {booking.get('specialistName')}\n"
        f"Ամսաթիվ՝ {booking.get('date')} {booking.get('time')}\n"
        f"Գին՝ {booking.get('price')} ֏"
    )


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


def bot_loop():
    if not BOT_TOKEN:
        print("BOT_TOKEN is missing. Web server will run without Telegram polling.")
        return

    offset = None
    print("Telegram bot polling started.")
    while True:
      try:
        payload = {"timeout": 25}
        if offset is not None:
            payload["offset"] = offset
        result = telegram("getUpdates", payload) or {}
        for update in result.get("result", []):
            offset = update["update_id"] + 1
            message = update.get("message") or {}
            if not message:
                continue
            remember_user(message)
            chat_id = message["chat"]["id"]
            text = (message.get("text") or "").strip()
            if text.startswith("/start"):
                text, markup = start_message()
                send_message(chat_id, text, markup)
            elif text.startswith("/admin"):
                send_message(chat_id, f"Ձեր chat id-ն է՝ {chat_id}")
            else:
                send_message(chat_id, "Ամրագրելու համար բացեք Mini App-ը։", web_app_keyboard())
      except Exception as exc:
        print(f"Bot polling error: {exc}")
        time.sleep(5)


def reminder_loop():
    while True:
        try:
            bookings = read_json(DATA_FILE, [])
            changed = False
            now = datetime.now()
            for booking in bookings:
                if not booking.get("reminder") or booking.get("reminded") or booking.get("status") == "Չեղարկված":
                    continue
                starts_at = datetime.fromisoformat(f"{booking.get('date')}T{booking.get('time')}:00")
                if timedelta(0) < starts_at - now <= timedelta(hours=2):
                    chat_id = booking.get("telegramUserId") or ADMIN_CHAT_ID
                    if chat_id:
                        send_message(chat_id, f"Հիշեցում՝ այսօր {booking.get('time')}-ին {booking.get('serviceName')}")
                    booking["reminded"] = True
                    changed = True
            if changed:
                write_json(DATA_FILE, bookings)
        except Exception as exc:
            print(f"Reminder error: {exc}")
        time.sleep(60)


class Handler(SimpleHTTPRequestHandler):
    server_version = "BeautySalonMiniApp/1.1"

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
        self.send_header("X-Beauty-Salon-App", "1")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("X-Beauty-Salon-App", "1")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith("/health"):
            return self.send_json(200, {"ok": True})
        if path.startswith("/api/bookings"):
            return self.send_json(200, read_json(DATA_FILE, []))
        if path == "/" or path == "/app":
            self.send_response(302)
            self.send_header("Location", "/app/")
            self.end_headers()
            return
        if not path.startswith("/app/"):
            self.path = "/app/"
        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8")
        payload = json.loads(raw or "{}")

        if self.path.startswith("/api/bookings"):
            bookings = read_json(DATA_FILE, [])
            booking = payload.get("booking", payload)
            booking.setdefault("id", f"booking_{int(time.time() * 1000)}")
            booking.setdefault("status", "Հաստատված")
            booking.setdefault("createdAt", datetime.utcnow().isoformat())
            bookings.append(booking)
            write_json(DATA_FILE, bookings)

            if ADMIN_CHAT_ID:
                send_message(ADMIN_CHAT_ID, booking_text(booking))
            if booking.get("telegramUserId"):
                send_message(booking["telegramUserId"], "Ձեր ամրագրումը հաստատված է։")

            return self.send_json(201, {"ok": True, "booking": booking})

        return self.send_json(404, {"ok": False, "error": "Not found"})


def main():
    threading.Thread(target=bot_loop, daemon=True).start()
    threading.Thread(target=reminder_loop, daemon=True).start()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Beauty Salon Mini App server: http://localhost:{PORT}/app/")
    server.serve_forever()


if __name__ == "__main__":
    main()
