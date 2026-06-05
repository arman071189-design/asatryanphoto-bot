from __future__ import annotations

import cgi
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT / "data"))
DB_PATH = DATA_DIR / "db.json"
DB_LOCK = threading.RLock()

def load_local_env() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "")
ADMIN_CHAT_IDS = [
    chat_id.strip()
    for chat_id in os.environ.get("ADMIN_CHAT_IDS", ADMIN_CHAT_ID).split(",")
    if chat_id.strip()
]
ENABLE_POLLING = os.environ.get("ENABLE_POLLING", "1") == "1"
ALLOW_LOCAL_TESTING = os.environ.get("ALLOW_LOCAL_TESTING", "0") == "1"
WEB_APP_URL = os.environ.get("WEB_APP_URL", "http://127.0.0.1:8000/app/")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")
ENABLE_SELF_KEEP_ALIVE = os.environ.get("ENABLE_SELF_KEEP_ALIVE", "0") == "1"
KEEP_ALIVE_INTERVAL_SECONDS = int(os.environ.get("KEEP_ALIVE_INTERVAL_SECONDS", "600"))
CONFIGURE_BOT_UI = os.environ.get("CONFIGURE_BOT_UI", "1") == "1"
try:
    APP_TIMEZONE = ZoneInfo(os.environ.get("APP_TIMEZONE", "Asia/Yerevan"))
except ZoneInfoNotFoundError:
    APP_TIMEZONE = timezone(timedelta(hours=4))

PHOTO_TYPES = [
    "Անհատական ֆոտոսեսիա",
    "Ընտանեկան ֆոտոսեսիա",
    "Զույգերի ֆոտոսեսիա",
    "Հարսանեկան ֆոտոսեսիա",
    "Ծննդյան ֆոտոսեսիա",
    "Մանկական ֆոտոսեսիա",
]

DEFAULT_AVAILABILITY = []

DEFAULT_WORK_SETTINGS = {
    "dateFrom": "2026-06-01",
    "dateTo": "2026-06-30",
    "startTime": "10:00",
    "endTime": "18:00",
    "slotMinutes": 60,
    "studioBlockMinutes": 60,
    "otherBlockMinutes": 120,
    "bookingDaysAhead": 60,
}

DEFAULT_SERVICE_PRICES = {
    "studio": {
        "Photo": 0,
        "Reel": 0,
        "Photo + Reel": 0,
    },
    "yerevan": {
        "Photo": 0,
        "Reel": 0,
        "Photo + Reel": 0,
    },
}


def ensure_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DB_PATH.exists():
        save_db(
            {
                "availability": DEFAULT_AVAILABILITY,
                "bookings": [],
                "servicePrices": DEFAULT_SERVICE_PRICES,
                "workSettings": DEFAULT_WORK_SETTINGS,
                "busySlots": [],
                "nonWorkingDays": [],
            }
        )
        return

    with DB_PATH.open("r", encoding="utf-8") as db_file:
        data = json.load(db_file)

    changed = False
    if "availability" not in data:
        data["availability"] = DEFAULT_AVAILABILITY
        changed = True
    if "bookings" not in data:
        data["bookings"] = []
        changed = True
    if "workSettings" not in data:
        data["workSettings"] = DEFAULT_WORK_SETTINGS.copy()
        changed = True
    else:
        for key, value in DEFAULT_WORK_SETTINGS.items():
            if key not in data["workSettings"]:
                data["workSettings"][key] = value
                changed = True
    if "busySlots" not in data:
        data["busySlots"] = []
        changed = True
    if "nonWorkingDays" not in data:
        data["nonWorkingDays"] = []
        changed = True
    if "servicePrices" not in data:
        data["servicePrices"] = DEFAULT_SERVICE_PRICES.copy()
        changed = True
    elif any(key in data["servicePrices"] for key in ("Photo", "Reel", "Photo + Reel")):
        old_prices = data["servicePrices"]
        data["servicePrices"] = {
            "studio": {key: int(old_prices.get(key, 0) or 0) for key in DEFAULT_SERVICE_PRICES["studio"]},
            "yerevan": {key: int(old_prices.get(key, 0) or 0) for key in DEFAULT_SERVICE_PRICES["yerevan"]},
        }
        changed = True
    else:
        for group_key, group_value in DEFAULT_SERVICE_PRICES.items():
            if group_key not in data["servicePrices"] or not isinstance(data["servicePrices"][group_key], dict):
                data["servicePrices"][group_key] = group_value.copy()
                changed = True
                continue
            for service_key, value in group_value.items():
                if service_key not in data["servicePrices"][group_key]:
                    data["servicePrices"][group_key][service_key] = value
                    changed = True
    for booking in data["bookings"]:
        if "remindersSent" not in booking:
            booking["remindersSent"] = []
            changed = True
        if "otherArea" not in booking:
            booking["otherArea"] = "yerevan"
            changed = True
        if "blockMinutes" not in booking:
            booking["blockMinutes"] = (
                data["workSettings"].get("studioBlockMinutes", 60)
                if booking.get("locationType") == "studio"
                else data["workSettings"].get("otherBlockMinutes", 120)
            )
            changed = True

    if changed:
        save_db(data)


def load_db() -> dict:
    with DB_LOCK:
        ensure_db()
        with DB_PATH.open("r", encoding="utf-8") as db_file:
            return json.load(db_file)


def save_db(data: dict) -> None:
    with DB_LOCK:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        temp_path = DB_PATH.with_suffix(".tmp")
        with temp_path.open("w", encoding="utf-8") as db_file:
            json.dump(data, db_file, ensure_ascii=False, indent=2)
        temp_path.replace(DB_PATH)


def send_json(handler: BaseHTTPRequestHandler, data: object, status: int = 200) -> None:
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def read_json(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0"))
    raw_body = handler.rfile.read(length) if length else b"{}"
    if not raw_body:
        return {}
    return json.loads(raw_body.decode("utf-8"))


def read_booking_request(handler: BaseHTTPRequestHandler) -> tuple[dict, list[dict]]:
    content_type = handler.headers.get("Content-Type", "")
    if not content_type.startswith("multipart/form-data"):
        return read_json(handler), []

    content_length = handler.headers.get("Content-Length", "0")
    form = cgi.FieldStorage(
        fp=handler.rfile,
        headers=handler.headers,
        environ={
            "REQUEST_METHOD": "POST",
            "CONTENT_TYPE": content_type,
            "CONTENT_LENGTH": content_length,
        },
    )
    payload = {}
    files = []

    for key in form.keys():
        fields = form[key]
        if not isinstance(fields, list):
            fields = [fields]
        for field in fields:
            if field.filename:
                files.append(
                    {
                        "field": key,
                        "filename": field.filename,
                        "contentType": field.type or "application/octet-stream",
                        "data": field.file.read(),
                    }
                )
            else:
                if key not in payload:
                    payload[key] = field.value

    return payload, files


def telegram_api(method: str, payload: dict) -> dict:
    if not BOT_TOKEN:
        return {"ok": False, "description": "BOT_TOKEN is not configured"}

    request = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/{method}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            details = exc.read().decode("utf-8")
        except Exception:
            details = str(exc)
        return {"ok": False, "description": details}
    except Exception as exc:
        return {"ok": False, "description": str(exc)}


def telegram_multipart(method: str, fields: dict, files: dict) -> dict:
    if not BOT_TOKEN:
        return {"ok": False, "description": "BOT_TOKEN is not configured"}

    boundary = f"----AsatryanPhoto{secrets.token_hex(12)}"
    body = bytearray()

    for key, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(value).encode("utf-8"))
        body.extend(b"\r\n")

    for key, file_data in files.items():
        filename = file_data.get("filename") or "upload.jpg"
        content_type = file_data.get("contentType") or "application/octet-stream"
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(
            (
                f'Content-Disposition: form-data; name="{key}"; '
                f'filename="{filename}"\r\n'
                f"Content-Type: {content_type}\r\n\r\n"
            ).encode("utf-8")
        )
        body.extend(file_data["data"])
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    request = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/{method}",
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        return {"ok": False, "description": str(exc)}


def telegram_media_group(fields: dict, media_files: list[dict]) -> dict:
    files = {}
    media = []
    for index, file_data in enumerate(media_files[:10]):
        attach_name = f"photo{index}"
        files[attach_name] = file_data
        item = {"type": "photo", "media": f"attach://{attach_name}"}
        caption = file_data.get("caption", "")
        if caption:
            item["caption"] = caption
        media.append(item)

    return telegram_multipart(
        "sendMediaGroup",
        {
            **fields,
            "media": json.dumps(media, ensure_ascii=False),
        },
        files,
    )


def process_callback_query(callback: dict) -> tuple[bool, str]:
    data = callback.get("data", "")
    action, _, booking_id = data.partition(":")
    if action not in {"approve", "reject"} or not booking_id:
        return False, "Սխալ գործողություն"

    status = "approved" if action == "approve" else "rejected"
    booking = update_booking_status(booking_id, status)
    answer_text = "Ամրագրումը թարմացվեց" if booking else "Ամրագրումը չի գտնվել"

    if callback.get("id"):
        telegram_api("answerCallbackQuery", {"callback_query_id": callback["id"], "text": answer_text})

    if booking and callback.get("message"):
        telegram_api(
            "editMessageText",
            {
                "chat_id": callback["message"]["chat"]["id"],
                "message_id": callback["message"]["message_id"],
                "text": format_booking_message(booking),
            },
        )

    return bool(booking), answer_text


def configure_bot_ui() -> None:
    if not BOT_TOKEN:
        return

    telegram_api(
        "setMyCommands",
        {
            "commands": [
                {"command": "start", "description": "Բացել ամրագրման Mini App-ը"},
                {"command": "app", "description": "Բացել ամրագրումը"},
                {"command": "admin", "description": "Բացել admin էջը"},
            ]
        },
    )
    if WEB_APP_URL.startswith("https://"):
        telegram_api(
            "setChatMenuButton",
            {
                "menu_button": {
                    "type": "web_app",
                    "text": "Գրանցվել",
                    "web_app": {"url": WEB_APP_URL},
                }
            },
        )


def web_button(text: str, url: str) -> dict:
    button = {"text": text}
    if url.startswith("https://"):
        button["web_app"] = {"url": url}
    else:
        button["url"] = url
    return button


def admin_app_url() -> str:
    return WEB_APP_URL.rstrip("/") + "/admin.html"


def is_admin_chat(chat_id: object) -> bool:
    return str(chat_id) in ADMIN_CHAT_IDS


def process_message(message: dict) -> None:
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = str(message.get("text", "")).strip()
    if not chat_id:
        return

    if message.get("photo") or message.get("document") or message.get("video"):
        process_reference_chat_file(message)
        return

    keyboard = [[web_button("Բացել Mini App", WEB_APP_URL)]]
    if is_admin_chat(chat_id):
        keyboard.append([web_button("Բացել Admin էջ", admin_app_url())])

    if text.startswith("/start") or text.startswith("/app") or text.startswith("/admin"):
        intro = (
            "Բարի գալուստ AsatryanPhoto 📸\n\n"
            "Սեղմեք կոճակը՝ ազատ ժամերը տեսնելու և ամրագրման հարցում ուղարկելու համար։"
        )
        if is_admin_chat(chat_id):
            intro = (
                "Բարի գալուստ AsatryanPhoto admin բաժին 📸\n\n"
                "Կարող եք բացել հաճախորդի Mini App-ը կամ անմիջապես մտնել admin էջ։"
            )
        telegram_api(
            "sendMessage",
            {
                "chat_id": chat_id,
                "text": intro,
                "reply_markup": {
                    "inline_keyboard": keyboard
                },
            },
        )
        return

    telegram_api(
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": "Ամրագրում կատարելու համար սեղմեք /start։",
        },
    )


def latest_user_booking(chat_id: object) -> dict | None:
    bookings = [
        booking
        for booking in load_db().get("bookings", [])
        if str(booking.get("telegramUserId", "")) == str(chat_id)
        and booking.get("status") in {"pending", "approved"}
    ]
    if not bookings:
        return None
    return sorted(bookings, key=lambda item: int(item.get("createdAt", 0)), reverse=True)[0]


def process_reference_chat_file(message: dict) -> None:
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    if not chat_id:
        return

    booking = latest_user_booking(chat_id)
    if not booking:
        telegram_api(
            "sendMessage",
            {
                "chat_id": chat_id,
                "text": "Նկարները կցելու համար նախ ուղարկեք ամրագրման հարցումը Mini App-ից, հետո ուղարկեք նկարները այստեղ։",
            },
        )
        return

    caption = "\n".join(
        [
            "🖼 Նկար / օրինակ բոտի chat-ից",
            f"{booking['firstName']} {booking['lastName']}",
            f"{booking['date']} {booking['time']}",
            f"Ամրագրում՝ {booking['id']}",
        ]
    )
    results = []
    for admin_chat_id in ADMIN_CHAT_IDS:
        result = telegram_api(
            "copyMessage",
            {
                "chat_id": admin_chat_id,
                "from_chat_id": chat_id,
                "message_id": message["message_id"],
                "caption": caption,
            },
        )
        results.append(result)

    telegram_api(
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": "Նկարը ստացվեց և ուղարկվեց admin-ին։ Կարող եք ուղարկել ևս նկարներ։"
            if any(item.get("ok") for item in results)
            else "Չհաջողվեց ուղարկել նկարը admin-ին։ Խնդրում ենք փորձել կրկին։",
        },
    )


def polling_loop() -> None:
    if not BOT_TOKEN:
        print("Telegram local polling skipped: BOT_TOKEN is not configured")
        return

    print("Telegram local polling started")
    telegram_api("deleteWebhook", {"drop_pending_updates": True})
    offset = 0
    while True:
        result = telegram_api(
            "getUpdates",
            {
                "offset": offset,
                "timeout": 25,
                "allowed_updates": ["callback_query", "message"],
            },
        )
        if not result.get("ok"):
            print(f"Telegram polling error: {result.get('description')}")
            time.sleep(5)
            continue

        for update in result.get("result", []):
            offset = max(offset, update["update_id"] + 1)
            callback = update.get("callback_query")
            if callback:
                process_callback_query(callback)
                continue
            message = update.get("message")
            if message:
                process_message(message)


def keep_alive_url() -> str:
    configured_url = os.environ.get("KEEP_ALIVE_URL", "").strip()
    if configured_url:
        return configured_url

    parsed = urllib.parse.urlparse(WEB_APP_URL)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}/health"
    return ""


def self_keep_alive_loop() -> None:
    url = keep_alive_url()
    if not url:
        print("Self keep-alive skipped: no public URL configured")
        return

    print(f"Self keep-alive started for {url}")
    while True:
        time.sleep(max(60, KEEP_ALIVE_INTERVAL_SECONDS))
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                print(f"Self keep-alive ping: {response.status}")
        except Exception as exc:
            print(f"Self keep-alive ping failed: {exc}")


def validate_init_data(init_data: str) -> tuple[bool, dict]:
    if not BOT_TOKEN:
        return True, {}
    if not init_data:
        return ALLOW_LOCAL_TESTING, {}

    parsed = urllib.parse.parse_qsl(init_data, keep_blank_values=True)
    received_hash = ""
    fields = []
    auth_data = {}

    for key, value in parsed:
        if key == "hash":
            received_hash = value
        else:
            fields.append(f"{key}={value}")
            auth_data[key] = value

    secret_key = hmac.new(
        key=b"WebAppData",
        msg=BOT_TOKEN.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    check_string = "\n".join(sorted(fields)).encode("utf-8")
    calculated_hash = hmac.new(
        key=secret_key,
        msg=check_string,
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        return False, {}

    user = {}
    if "user" in auth_data:
        try:
            user = json.loads(auth_data["user"])
        except json.JSONDecodeError:
            user = {}
    return True, user


def format_booking_message(booking: dict) -> str:
    location_labels = {
        "studio": "Ստուդիա",
        "other": "Այլ վայր",
        "undecided": "Դեռ որոշված չէ",
    }
    location = location_labels.get(booking["locationType"], "Դեռ որոշված չէ")
    address_lines = []
    if booking["locationType"] == "studio":
        address_lines.append(f"Ստուդիա՝ {booking.get('studioName', '-')}")
        address_lines.append(f"Հասցե՝ {booking.get('studioAddress', '-')}")
    elif booking["locationType"] == "other":
        area = "Երևան" if booking.get("otherArea") == "yerevan" else "Երևանից դուրս"
        address_lines.append(f"Տարածք՝ {area}")
        address_lines.append(f"Հասցե՝ {booking.get('otherAddress', '-')}")
    else:
        address_lines.append("Հասցե՝ դեռ նշված չէ")

    username = booking.get("telegramUsername")
    contact = f"@{username}" if username else f"ID {booking.get('telegramUserId', '-')}"

    return "\n".join(
        [
            "📸 Նոր ամրագրման հարցում",
            "━━━━━━━━━━━━━━",
            f"👤 Հաճախորդ՝ {booking['firstName']} {booking['lastName']}",
            f"☎️ Հեռախոս՝ {booking.get('phone') or '-'}",
            f"💬 Telegram՝ {contact}",
            "",
            f"📅 Օր / ժամ՝ {booking['date']} {booking['time']}",
            f"⏱ Ժամի տեսակ՝ {'Ցանկալի ժամի հարցում' if booking.get('isPreferredTimeRequest') else 'Ազատ ժամից ընտրված'}",
            f"🎬 Ծառայություն՝ {booking.get('serviceType', 'Photo')}",
            f"🖼 Տեսակ՝ {booking['photoType']}",
            f"💰 Գին՝ {format_price(booking.get('price', 0))}",
            "",
            f"📍 Վայր՝ {location}",
            *address_lines,
            f"👥 Անձերի քանակ՝ {booking['peopleCount']}",
            f"📝 Նշումներ՝ {booking.get('notes') or '-'}",
            "",
            f"📌 Կարգավիճակ՝ {booking['statusLabel']}",
        ]
    )


def notify_admin(booking: dict, reference_files: list[dict] | None = None) -> dict:
    if not ADMIN_CHAT_IDS:
        return {"ok": False, "description": "ADMIN_CHAT_IDS is not configured"}

    results = []
    for admin_chat_id in ADMIN_CHAT_IDS:
        result = telegram_api(
            "sendMessage",
            {
                "chat_id": admin_chat_id,
                "text": format_booking_message(booking),
                "reply_markup": {
                    "inline_keyboard": [
                        [
                            {"text": "Հաստատել", "callback_data": f"approve:{booking['id']}"},
                            {"text": "Մերժել", "callback_data": f"reject:{booking['id']}"},
                        ]
                    ]
                },
            },
        )
        reference_results = []
        if reference_files:
            reference_results = send_reference_files(admin_chat_id, booking, reference_files)
        if reference_results:
            result["referenceFiles"] = reference_results
        results.append({"chatId": admin_chat_id, **result})

    return {"ok": any(item.get("ok") for item in results), "results": results}


def send_reference_files(admin_chat_id: str, booking: dict, reference_files: list[dict]) -> list[dict]:
    caption = (
        "Հաճախորդի ուղարկած ցանկալի նկարների / ռիլի օրինակներ\n"
        f"{booking['firstName']} {booking['lastName']}\n"
        f"{booking['date']} {booking['time']}"
    )
    image_files = [
        {**file_data, "caption": caption if index == 0 else ""}
        for index, file_data in enumerate(reference_files[:10])
        if str(file_data.get("contentType", "")).startswith("image/")
    ]
    if len(image_files) > 1:
        group_result = telegram_media_group({"chat_id": admin_chat_id}, image_files)
        if group_result.get("ok"):
            return [
                {
                    "filename": file_data.get("filename", ""),
                    "ok": True,
                    "grouped": True,
                    "description": "",
                }
                for file_data in image_files
            ]

    results = []
    for index, file_data in enumerate(reference_files[:10], start=1):
        caption = ""
        if index == 1:
            caption = (
                "Հաճախորդի ուղարկած ցանկալի նկարների / ռիլի օրինակներ\n"
                f"{booking['firstName']} {booking['lastName']}\n"
                f"{booking['date']} {booking['time']}"
            )
        result = telegram_multipart(
            "sendPhoto",
            {
                "chat_id": admin_chat_id,
                "caption": caption,
            },
            {"photo": file_data},
        )
        if not result.get("ok"):
            result = telegram_multipart(
                "sendDocument",
                {
                    "chat_id": admin_chat_id,
                    "caption": caption,
                },
                {"document": file_data},
            )
        results.append(
            {
                "filename": file_data.get("filename", ""),
                "ok": bool(result.get("ok")),
                "description": result.get("description", ""),
            }
        )
    return results


def notify_client(booking: dict, approved: bool) -> dict:
    user_id = booking.get("telegramUserId")
    if not user_id:
        return {"ok": False, "description": "Telegram user id is missing"}

    status_text = "հաստատվել է" if approved else "մերժվել է"
    text = (
        f"Ձեր ամրագրման հարցումը {status_text}։\n\n"
        f"{booking['date']} {booking['time']}\n"
        f"{booking.get('serviceType', 'Photo')}\n"
        f"{booking['photoType']}\n"
        f"Գին՝ {format_price(booking.get('price', 0))}\n"
        f"AsatryanPhoto"
    )
    return telegram_api("sendMessage", {"chat_id": user_id, "text": text})


def format_price(value: object) -> str:
    if value is None:
        return "Հարցումով"
    try:
        amount = int(value)
    except (TypeError, ValueError):
        amount = 0
    if amount <= 0:
        return "Նշված չէ"
    return f"{amount:,} AMD / 1 ժամ".replace(",", " ")


def price_group_for_booking(location_type: str, other_area: str = "") -> str | None:
    if location_type == "studio":
        return "studio"
    if location_type == "other" and other_area == "yerevan":
        return "yerevan"
    return None


def get_booking_price(db: dict, service_type: str, location_type: str, other_area: str = "") -> int | None:
    group_key = price_group_for_booking(location_type, other_area)
    if not group_key:
        return None
    return db.get("servicePrices", {}).get(group_key, {}).get(service_type, 0)


def send_booking_reminder(booking: dict, days_before: int) -> dict:
    user_id = booking.get("telegramUserId")
    if not user_id:
        return {"ok": False, "description": "Telegram user id is missing"}

    day_text = "2 օրից" if days_before == 2 else "վաղը"
    text = "\n".join(
        [
            "Հիշեցում AsatryanPhoto-ից",
            "",
            f"Ձեր նկարահանումը {day_text} է։",
            f"{booking['date']} {booking['time']}",
            f"{booking.get('serviceType', 'Photo')} · {booking['photoType']}",
            f"Գին՝ {format_price(booking.get('price', 0))}",
        ]
    )
    return telegram_api("sendMessage", {"chat_id": user_id, "text": text})


def run_due_reminders(today: date | None = None) -> int:
    current_date = today or date.today()
    db = load_db()
    sent_count = 0

    for booking in db["bookings"]:
        if booking.get("status") != "approved":
            continue
        try:
            booking_date = datetime.strptime(booking["date"], "%Y-%m-%d").date()
        except (KeyError, ValueError):
            continue

        days_until = (booking_date - current_date).days
        if days_until not in {2, 1}:
            continue

        reminder_key = f"{days_until}d"
        sent = booking.setdefault("remindersSent", [])
        if reminder_key in sent:
            continue

        result = send_booking_reminder(booking, days_until)
        if result.get("ok"):
            sent.append(reminder_key)
            sent_count += 1

    if sent_count:
        save_db(db)
    return sent_count


def reminder_loop() -> None:
    while True:
        run_due_reminders()
        time.sleep(60 * 60)


def slot_id(date_text: str, time_text: str) -> str:
    return f"{date_text}-{time_text.replace(':', '')}"


def parse_minutes(time_text: str) -> int:
    hours, minutes = time_text.split(":", 1)
    return int(hours) * 60 + int(minutes)


def format_minutes(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def blocked_ids_for_booking(booking: dict, settings: dict) -> set[str]:
    try:
        start_minutes = parse_minutes(booking["time"])
        duration = int(
            booking.get(
                "blockMinutes",
                settings.get("studioBlockMinutes", 60)
                if booking.get("locationType") == "studio"
                else settings.get("otherBlockMinutes", 120),
            )
        )
    except (KeyError, TypeError, ValueError):
        return set()

    blocked_ids = set()
    end_minutes = start_minutes + max(duration, 1)
    minutes = start_minutes
    while minutes < end_minutes:
        blocked_ids.add(slot_id(booking["date"], format_minutes(minutes)))
        minutes += int(settings.get("slotMinutes", 60) or 60)
    return blocked_ids


def generate_work_slots(db: dict) -> list[dict]:
    settings = db.get("workSettings", DEFAULT_WORK_SETTINGS)
    try:
        now = datetime.now(APP_TIMEZONE)
        current_day = now.date()
        end_day = current_day + timedelta(days=int(settings.get("bookingDaysAhead", 60)))
        if settings.get("dateFrom"):
            current_day = max(current_day, datetime.strptime(settings["dateFrom"], "%Y-%m-%d").date())
        if settings.get("dateTo"):
            end_day = min(end_day, datetime.strptime(settings["dateTo"], "%Y-%m-%d").date())
        start_minutes = parse_minutes(settings["startTime"])
        end_minutes = parse_minutes(settings["endTime"])
        step = int(settings.get("slotMinutes", 60))
    except (KeyError, TypeError, ValueError):
        return []

    if end_day < current_day or step <= 0 or start_minutes >= end_minutes:
        return []

    non_working_dates = {item["date"] for item in db.get("nonWorkingDays", [])}
    booked_ids = set()
    for booking in db.get("bookings", []):
        if booking.get("status") in {"pending", "approved"} and booking.get("slotId"):
            booked_ids.update(blocked_ids_for_booking(booking, settings))
    busy_ids = {
        slot_id(item["date"], item["time"])
        for item in db.get("busySlots", [])
        if item.get("date") and item.get("time")
    }
    blocked_ids = booked_ids | busy_ids

    slots = []
    while current_day <= end_day:
        date_text = current_day.isoformat()
        if date_text in non_working_dates:
            current_day += timedelta(days=1)
            continue
        minutes = start_minutes
        while minutes < end_minutes:
            time_text = format_minutes(minutes)
            current_slot_id = slot_id(date_text, time_text)
            slot_datetime = datetime.combine(current_day, datetime.strptime(time_text, "%H:%M").time(), APP_TIMEZONE)
            if slot_datetime > now and current_slot_id not in blocked_ids:
                slots.append({"id": current_slot_id, "date": date_text, "time": time_text})
            minutes += step
        current_day += timedelta(days=1)
    return slots


def public_availability() -> list[dict]:
    db = load_db()
    return generate_work_slots(db)


def public_settings() -> dict:
    db = load_db()
    return {
        "servicePrices": db.get("servicePrices", DEFAULT_SERVICE_PRICES),
        "workSettings": db.get("workSettings", DEFAULT_WORK_SETTINGS),
    }


def create_booking(payload: dict, reference_files: list[dict] | None = None) -> tuple[int, dict]:
    valid, tg_user = validate_init_data(payload.get("initData", ""))
    if not valid:
        return 403, {"error": "Telegram initData validation failed"}

    is_preferred_time = str(payload.get("isPreferredTime", "")).strip() == "1"
    required = ["firstName", "lastName", "phone", "serviceType", "photoType", "locationType", "peopleCount"]
    if is_preferred_time:
        required.extend(["requestedDate", "preferredTime"])
    else:
        required.append("slotId")
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return 400, {"error": "Missing required fields", "fields": missing}

    db = load_db()
    if is_preferred_time:
        try:
            datetime.strptime(payload["requestedDate"], "%Y-%m-%d")
            parse_minutes(payload["preferredTime"])
        except ValueError:
            return 400, {"error": "Invalid requested date or preferred time"}
        slot = {
            "id": f"preferred-{payload['requestedDate']}-{payload['preferredTime'].replace(':', '')}-{secrets.token_hex(4)}",
            "date": payload["requestedDate"],
            "time": payload["preferredTime"],
        }
    else:
        slot = next((item for item in generate_work_slots(db) if item["id"] == payload["slotId"]), None)
        if not slot:
            return 409, {"error": "Selected time is not available"}

    location_type = payload["locationType"]
    if location_type == "studio":
        if not payload.get("studioName") or not payload.get("studioAddress"):
            return 400, {"error": "Studio name and address are required"}
    elif location_type == "other":
        if not payload.get("otherAddress"):
            return 400, {"error": "Address is required"}
    elif location_type != "undecided":
        return 400, {"error": "Invalid location type"}

    other_area = payload.get("otherArea", "yerevan") if location_type == "other" else ""
    if location_type == "other" and other_area not in {"yerevan", "outside"}:
        return 400, {"error": "Invalid other area"}

    service_type = payload["serviceType"].strip()
    if service_type not in {"Photo", "Reel", "Photo + Reel"}:
        return 400, {"error": "Invalid service type"}

    try:
        people_count = int(payload["peopleCount"])
    except (TypeError, ValueError):
        return 400, {"error": "Invalid people count"}
    if people_count < 1 or people_count > 50:
        return 400, {"error": "People count must be between 1 and 50"}

    block_minutes = (
        int(db.get("workSettings", {}).get("studioBlockMinutes", 60))
        if location_type == "studio"
        else int(db.get("workSettings", {}).get("otherBlockMinutes", 120))
    )

    booking = {
        "id": secrets.token_urlsafe(8),
        "createdAt": int(time.time()),
        "status": "pending",
        "statusLabel": "Սպասում է հաստատման",
        "date": slot["date"],
        "time": slot["time"],
        "slotId": slot["id"],
        "isPreferredTimeRequest": is_preferred_time,
        "firstName": payload["firstName"].strip(),
        "lastName": payload["lastName"].strip(),
        "phone": payload["phone"].strip(),
        "serviceType": service_type,
        "photoType": payload["photoType"],
        "price": get_booking_price(db, service_type, location_type, other_area),
        "locationType": location_type,
        "otherArea": other_area,
        "blockMinutes": block_minutes,
        "studioName": payload.get("studioName", "").strip(),
        "studioAddress": payload.get("studioAddress", "").strip(),
        "otherAddress": payload.get("otherAddress", "").strip(),
        "peopleCount": people_count,
        "notes": payload.get("notes", "").strip(),
        "telegramUserId": tg_user.get("id") or payload.get("telegramUserId"),
        "telegramUsername": tg_user.get("username") or payload.get("telegramUsername", ""),
        "remindersSent": [],
    }

    db["bookings"].append(booking)
    save_db(db)

    telegram_result = notify_admin(booking, reference_files or [])
    return 201, {"booking": booking, "telegram": telegram_result}


def update_booking_status(booking_id: str, status: str) -> dict | None:
    db = load_db()
    booking = next((item for item in db["bookings"] if item["id"] == booking_id), None)
    if not booking:
        return None

    approved = status == "approved"
    booking["status"] = status
    booking["statusLabel"] = "Հաստատված է" if approved else "Մերժված է"

    save_db(db)
    notify_client(booking, approved)
    return booking


class AppHandler(BaseHTTPRequestHandler):
    def is_admin_request(self) -> bool:
        if not ADMIN_SECRET:
            return True
        return hmac.compare_digest(self.headers.get("X-Admin-Token", ""), ADMIN_SECRET)

    def require_admin(self) -> bool:
        if self.is_admin_request():
            return True
        send_json(self, {"error": "admin authentication required"}, 401)
        return False

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/":
            self.redirect("/app/")
            return
        if parsed.path == "/api/availability":
            settings = public_settings()
            send_json(
                self,
                {
                    "availability": public_availability(),
                    "photoTypes": PHOTO_TYPES,
                    "servicePrices": settings["servicePrices"],
                    "workSettings": settings["workSettings"],
                },
            )
            return
        if parsed.path == "/health":
            send_json(self, {"ok": True, "service": "AsatryanPhoto"})
            return
        if parsed.path.startswith("/api/admin/") and not self.require_admin():
            return
        if parsed.path == "/api/admin/bookings":
            send_json(self, {"bookings": load_db()["bookings"]})
            return
        if parsed.path == "/api/bookings/status":
            query = urllib.parse.parse_qs(parsed.query)
            booking_id = (query.get("id") or [""])[0]
            booking = next((item for item in load_db()["bookings"] if item["id"] == booking_id), None)
            if not booking:
                send_json(self, {"error": "booking not found"}, 404)
                return
            send_json(
                self,
                {
                    "id": booking["id"],
                    "status": booking["status"],
                    "statusLabel": booking["statusLabel"],
                    "date": booking["date"],
                    "time": booking["time"],
                    "serviceType": booking.get("serviceType", "Photo"),
                    "price": booking.get("price"),
                },
            )
            return
        if parsed.path == "/api/admin/schedule":
            db = load_db()
            send_json(
                self,
                {
                    "workSettings": db.get("workSettings", DEFAULT_WORK_SETTINGS),
                    "nonWorkingDays": db.get("nonWorkingDays", []),
                    "availability": generate_work_slots(db),
                },
            )
            return
        if parsed.path.startswith("/app/"):
            self.serve_static(parsed.path.removeprefix("/app/") or "index.html")
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/admin/") and not self.require_admin():
            return
        if parsed.path == "/api/bookings":
            payload, reference_files = read_booking_request(self)
            status, data = create_booking(payload, reference_files)
            send_json(self, data, status)
            return
        if parsed.path == "/api/admin/availability":
            self.create_availability(read_json(self))
            return
        if parsed.path == "/api/admin/bookings/status":
            self.admin_status(read_json(self))
            return
        if parsed.path == "/api/admin/availability/update":
            self.update_availability(read_json(self))
            return
        if parsed.path == "/api/admin/availability/delete":
            self.delete_availability(read_json(self))
            return
        if parsed.path == "/api/admin/prices":
            self.update_prices(read_json(self))
            return
        if parsed.path == "/api/admin/work-settings":
            self.update_work_settings(read_json(self))
            return
        if parsed.path == "/api/admin/non-working":
            self.create_non_working_day(read_json(self))
            return
        if parsed.path == "/api/admin/non-working/range":
            self.create_non_working_range(read_json(self))
            return
        if parsed.path == "/api/admin/non-working/delete":
            self.delete_non_working_day(read_json(self))
            return
        if parsed.path == "/api/admin/busy":
            self.create_busy_slot(read_json(self))
            return
        if parsed.path == "/api/admin/busy/delete":
            self.delete_busy_slot(read_json(self))
            return
        if parsed.path == "/api/admin/reminders/run":
            sent_count = run_due_reminders()
            send_json(self, {"sent": sent_count})
            return
        if parsed.path == "/telegram/webhook":
            self.telegram_webhook(read_json(self))
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def redirect(self, location: str) -> None:
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def serve_static(self, relative_path: str) -> None:
        safe_path = Path(relative_path).as_posix().lstrip("/")
        target = (STATIC_DIR / safe_path).resolve()
        if STATIC_DIR.resolve() not in target.parents and target != STATIC_DIR.resolve():
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        content_type = "text/plain; charset=utf-8"
        if target.suffix == ".html":
            content_type = "text/html; charset=utf-8"
        elif target.suffix == ".css":
            content_type = "text/css; charset=utf-8"
        elif target.suffix == ".js":
            content_type = "application/javascript; charset=utf-8"
        elif target.suffix == ".svg":
            content_type = "image/svg+xml"
        elif target.suffix == ".png":
            content_type = "image/png"

        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def create_availability(self, payload: dict) -> None:
        date = str(payload.get("date", "")).strip()
        time_value = str(payload.get("time", "")).strip()
        if not date or not time_value:
            send_json(self, {"error": "date and time are required"}, 400)
            return

        db = load_db()
        new_slot_id = slot_id(date, time_value)
        if any(slot["id"] == new_slot_id for slot in db["availability"]):
            send_json(self, {"error": "slot already exists"}, 409)
            return
        slot = {"id": new_slot_id, "date": date, "time": time_value, "reserved": False}
        db["availability"].append(slot)
        db["availability"].sort(key=lambda item: (item["date"], item["time"]))
        save_db(db)
        send_json(self, {"slot": slot}, 201)

    def update_availability(self, payload: dict) -> None:
        slot_id = str(payload.get("slotId", "")).strip()
        date = str(payload.get("date", "")).strip()
        time_value = str(payload.get("time", "")).strip()
        if not slot_id or not date or not time_value:
            send_json(self, {"error": "slotId, date and time are required"}, 400)
            return

        db = load_db()
        slot = next((item for item in db["availability"] if item["id"] == slot_id), None)
        if not slot:
            send_json(self, {"error": "slot not found"}, 404)
            return
        if slot.get("reserved"):
            send_json(self, {"error": "reserved slot cannot be edited"}, 409)
            return

        new_id = f"{date}-{time_value.replace(':', '')}"
        if new_id != slot_id and any(item["id"] == new_id for item in db["availability"]):
            send_json(self, {"error": "slot already exists"}, 409)
            return

        slot["id"] = new_id
        slot["date"] = date
        slot["time"] = time_value
        db["availability"].sort(key=lambda item: (item["date"], item["time"]))
        save_db(db)
        send_json(self, {"slot": slot})

    def delete_availability(self, payload: dict) -> None:
        slot_id = str(payload.get("slotId", "")).strip()
        db = load_db()
        slot = next((item for item in db["availability"] if item["id"] == slot_id), None)
        if not slot:
            send_json(self, {"error": "slot not found"}, 404)
            return
        if slot.get("reserved"):
            send_json(self, {"error": "reserved slot cannot be deleted"}, 409)
            return

        db["availability"] = [item for item in db["availability"] if item["id"] != slot_id]
        save_db(db)
        send_json(self, {"ok": True})

    def update_prices(self, payload: dict) -> None:
        db = load_db()
        prices = db.setdefault("servicePrices", json.loads(json.dumps(DEFAULT_SERVICE_PRICES)))
        for group_key, group_values in DEFAULT_SERVICE_PRICES.items():
            group_payload = payload.get(group_key, {})
            if not isinstance(group_payload, dict):
                send_json(self, {"error": f"invalid prices for {group_key}"}, 400)
                return
            prices.setdefault(group_key, {})
            for service_key in group_values:
                try:
                    value = int(group_payload.get(service_key, prices[group_key].get(service_key, 0)) or 0)
                except (TypeError, ValueError):
                    send_json(self, {"error": f"invalid price for {group_key}.{service_key}"}, 400)
                    return
                prices[group_key][service_key] = max(0, value)
        save_db(db)
        send_json(self, {"servicePrices": prices})

    def update_work_settings(self, payload: dict) -> None:
        required = [
            "dateFrom",
            "dateTo",
            "startTime",
            "endTime",
            "slotMinutes",
            "studioBlockMinutes",
            "otherBlockMinutes",
        ]
        missing = [field for field in required if not str(payload.get(field, "")).strip()]
        if missing:
            send_json(self, {"error": "missing required fields", "fields": missing}, 400)
            return

        try:
            date_from = datetime.strptime(payload["dateFrom"], "%Y-%m-%d").date()
            date_to = datetime.strptime(payload["dateTo"], "%Y-%m-%d").date()
            start_minutes = parse_minutes(payload["startTime"])
            end_minutes = parse_minutes(payload["endTime"])
            slot_minutes = int(payload["slotMinutes"])
            studio_block_minutes = int(payload["studioBlockMinutes"])
            other_block_minutes = int(payload["otherBlockMinutes"])
        except (TypeError, ValueError):
            send_json(self, {"error": "invalid work settings"}, 400)
            return

        if (
            date_to < date_from
            or start_minutes >= end_minutes
            or slot_minutes <= 0
            or studio_block_minutes <= 0
            or other_block_minutes <= 0
        ):
            send_json(self, {"error": "invalid work settings range"}, 400)
            return

        db = load_db()
        db["workSettings"] = {
            "dateFrom": date_from.isoformat(),
            "dateTo": date_to.isoformat(),
            "startTime": payload["startTime"],
            "endTime": payload["endTime"],
            "slotMinutes": slot_minutes,
            "studioBlockMinutes": studio_block_minutes,
            "otherBlockMinutes": other_block_minutes,
            "bookingDaysAhead": int(db.get("workSettings", {}).get("bookingDaysAhead", 60)),
        }
        save_db(db)
        send_json(self, {"workSettings": db["workSettings"], "availability": generate_work_slots(db)})

    def create_busy_slot(self, payload: dict) -> None:
        date_text = str(payload.get("date", "")).strip()
        time_text = str(payload.get("time", "")).strip()
        reason = str(payload.get("reason", "")).strip()
        if not date_text or not time_text:
            send_json(self, {"error": "date and time are required"}, 400)
            return

        try:
            datetime.strptime(date_text, "%Y-%m-%d")
            parse_minutes(time_text)
        except ValueError:
            send_json(self, {"error": "invalid date or time"}, 400)
            return

        db = load_db()
        busy_id = slot_id(date_text, time_text)
        if any(item["id"] == busy_id for item in db.get("busySlots", [])):
            send_json(self, {"error": "busy slot already exists"}, 409)
            return

        busy_slot = {"id": busy_id, "date": date_text, "time": time_text, "reason": reason}
        db.setdefault("busySlots", []).append(busy_slot)
        db["busySlots"].sort(key=lambda item: (item["date"], item["time"]))
        save_db(db)
        send_json(self, {"busySlot": busy_slot, "availability": generate_work_slots(db)}, 201)

    def delete_busy_slot(self, payload: dict) -> None:
        busy_id = str(payload.get("id", "")).strip()
        db = load_db()
        db["busySlots"] = [item for item in db.get("busySlots", []) if item["id"] != busy_id]
        save_db(db)
        send_json(self, {"ok": True, "availability": generate_work_slots(db)})

    def create_non_working_day(self, payload: dict) -> None:
        date_text = str(payload.get("date", "")).strip()
        reason = str(payload.get("reason", "")).strip()
        if not date_text:
            send_json(self, {"error": "date is required"}, 400)
            return

        try:
            datetime.strptime(date_text, "%Y-%m-%d")
        except ValueError:
            send_json(self, {"error": "invalid date"}, 400)
            return

        db = load_db()
        if any(item["date"] == date_text for item in db.get("nonWorkingDays", [])):
            send_json(self, {"error": "non-working day already exists"}, 409)
            return

        day = {"id": date_text, "date": date_text, "reason": reason}
        db.setdefault("nonWorkingDays", []).append(day)
        db["nonWorkingDays"].sort(key=lambda item: item["date"])
        save_db(db)
        send_json(self, {"nonWorkingDay": day, "availability": generate_work_slots(db)}, 201)

    def delete_non_working_day(self, payload: dict) -> None:
        day_id = str(payload.get("id", "")).strip()
        db = load_db()
        db["nonWorkingDays"] = [item for item in db.get("nonWorkingDays", []) if item["id"] != day_id]
        save_db(db)
        send_json(self, {"ok": True, "availability": generate_work_slots(db)})

    def create_non_working_range(self, payload: dict) -> None:
        date_from = str(payload.get("dateFrom", "")).strip()
        date_to = str(payload.get("dateTo", "")).strip()
        reason = str(payload.get("reason", "")).strip()
        if not date_from or not date_to:
            send_json(self, {"error": "dateFrom and dateTo are required"}, 400)
            return

        try:
            current_day = datetime.strptime(date_from, "%Y-%m-%d").date()
            end_day = datetime.strptime(date_to, "%Y-%m-%d").date()
        except ValueError:
            send_json(self, {"error": "invalid date range"}, 400)
            return
        if end_day < current_day:
            send_json(self, {"error": "invalid date range"}, 400)
            return

        db = load_db()
        existing = {item["date"] for item in db.get("nonWorkingDays", [])}
        while current_day <= end_day:
            date_text = current_day.isoformat()
            if date_text not in existing:
                db.setdefault("nonWorkingDays", []).append(
                    {"id": date_text, "date": date_text, "reason": reason}
                )
            current_day += timedelta(days=1)
        db["nonWorkingDays"].sort(key=lambda item: item["date"])
        save_db(db)
        send_json(self, {"nonWorkingDays": db["nonWorkingDays"], "availability": generate_work_slots(db)}, 201)

    def admin_status(self, payload: dict) -> None:
        status = payload.get("status")
        if status not in {"approved", "rejected"}:
            send_json(self, {"error": "invalid status"}, 400)
            return
        booking = update_booking_status(payload.get("bookingId", ""), status)
        if not booking:
            send_json(self, {"error": "booking not found"}, 404)
            return
        send_json(self, {"booking": booking})

    def telegram_webhook(self, update: dict) -> None:
        callback = update.get("callback_query")
        if not callback:
            send_json(self, {"ok": True})
            return

        ok, message = process_callback_query(callback)
        send_json(self, {"ok": ok, "message": message}, 200 if ok else 400)

    def log_message(self, format: str, *args: object) -> None:
        print(f"{self.address_string()} - {format % args}")


def main() -> None:
    ensure_db()
    if CONFIGURE_BOT_UI:
        configure_bot_ui()
    threading.Thread(target=reminder_loop, daemon=True).start()
    if ENABLE_POLLING:
        threading.Thread(target=polling_loop, daemon=True).start()
    if ENABLE_SELF_KEEP_ALIVE:
        threading.Thread(target=self_keep_alive_loop, daemon=True).start()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"AsatryanPhoto Mini App running at http://{host}:{port}/app/")
    server.serve_forever()


if __name__ == "__main__":
    main()
