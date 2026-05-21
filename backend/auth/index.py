import json
import os
import hashlib
import secrets
import psycopg2

COLORS = [
    "from-purple-500 to-pink-500",
    "from-green-500 to-blue-500",
    "from-blue-500 to-purple-500",
    "from-orange-500 to-red-500",
    "from-teal-500 to-cyan-500",
    "from-yellow-500 to-orange-500",
]

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Регистрация и вход пользователей в ФренЧат"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action")  # "register" or "login"
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    if not username or not password:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Введи имя и пароль"}),
        }

    if len(username) < 2 or len(username) > 30:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Имя должно быть от 2 до 30 символов"}),
        }

    if len(password) < 4:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Пароль должен быть минимум 4 символа"}),
        }

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "register":
            avatar_letter = username[0].upper()
            color_index = sum(ord(c) for c in username) % len(COLORS)
            avatar_color = COLORS[color_index]
            password_hash = hash_password(password)

            cur.execute(
                "INSERT INTO users (username, password_hash, avatar_letter, avatar_color) VALUES (%s, %s, %s, %s) RETURNING id",
                (username, password_hash, avatar_letter, avatar_color),
            )
            user_id = cur.fetchone()[0]
            conn.commit()

            session_token = secrets.token_hex(32)
            cur.execute(
                "UPDATE users SET password_hash = password_hash WHERE id = %s",
                (user_id,),
            )

            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "ok": True,
                    "user": {
                        "id": user_id,
                        "username": username,
                        "avatar_letter": avatar_letter,
                        "avatar_color": avatar_color,
                        "token": hash_password(f"{user_id}:{password}"),
                    },
                }),
            }

        elif action == "login":
            password_hash = hash_password(password)
            cur.execute(
                "SELECT id, username, avatar_letter, avatar_color FROM users WHERE username = %s AND password_hash = %s",
                (username, password_hash),
            )
            row = cur.fetchone()
            if not row:
                return {
                    "statusCode": 401,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Неверное имя или пароль"}),
                }

            user_id, uname, avatar_letter, avatar_color = row
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "ok": True,
                    "user": {
                        "id": user_id,
                        "username": uname,
                        "avatar_letter": avatar_letter,
                        "avatar_color": avatar_color,
                        "token": hash_password(f"{user_id}:{password}"),
                    },
                }),
            }

        else:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Неверный action"}),
            }
    finally:
        cur.close()
        conn.close()
