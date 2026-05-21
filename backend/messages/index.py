import json
import os
import hashlib
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def verify_user(conn, user_id: int, token: str) -> bool:
    cur = conn.cursor()
    cur.execute("SELECT password_hash, username FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    if not row:
        return False
    return True


def handler(event: dict, context) -> dict:
    """Получение и отправка сообщений в чате ФренЧат"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    user_id_str = headers.get("x-user-id") or headers.get("X-User-Id")
    token = headers.get("x-auth-token") or headers.get("X-Auth-Token")

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        channel = params.get("channel", "общий")
        limit = min(int(params.get("limit", 50)), 100)

        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT m.id, m.content, m.created_at, m.channel,
                       u.username, u.avatar_letter, u.avatar_color
                FROM messages m
                JOIN users u ON u.id = m.user_id
                WHERE m.channel = %s
                ORDER BY m.created_at ASC
                LIMIT %s
                """,
                (channel, limit),
            )
            rows = cur.fetchall()
            messages = [
                {
                    "id": r[0],
                    "content": r[1],
                    "created_at": r[2].isoformat(),
                    "channel": r[3],
                    "username": r[4],
                    "avatar_letter": r[5],
                    "avatar_color": r[6],
                }
                for r in rows
            ]
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"messages": messages}),
            }
        finally:
            cur.close()
            conn.close()

    elif method == "POST":
        if not user_id_str or not token:
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Не авторизован"}),
            }

        body = json.loads(event.get("body") or "{}")
        content = (body.get("content") or "").strip()
        channel = body.get("channel", "общий")

        if not content:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Сообщение не может быть пустым"}),
            }

        if len(content) > 2000:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Сообщение слишком длинное"}),
            }

        user_id = int(user_id_str)
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT id, username, avatar_letter, avatar_color FROM users WHERE id = %s",
                (user_id,),
            )
            user = cur.fetchone()
            if not user:
                return {
                    "statusCode": 401,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Пользователь не найден"}),
                }

            cur.execute(
                "INSERT INTO messages (user_id, channel, content) VALUES (%s, %s, %s) RETURNING id, created_at",
                (user_id, channel, content),
            )
            msg_id, created_at = cur.fetchone()
            conn.commit()

            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "ok": True,
                    "message": {
                        "id": msg_id,
                        "content": content,
                        "created_at": created_at.isoformat(),
                        "channel": channel,
                        "username": user[1],
                        "avatar_letter": user[2],
                        "avatar_color": user[3],
                    },
                }),
            }
        finally:
            cur.close()
            conn.close()

    return {
        "statusCode": 405,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": "Method not allowed"}),
    }
