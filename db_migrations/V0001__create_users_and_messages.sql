
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_letter VARCHAR(1) NOT NULL,
  avatar_color VARCHAR(50) NOT NULL DEFAULT 'from-purple-500 to-pink-500',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  channel VARCHAR(50) NOT NULL DEFAULT 'общий',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_channel_created ON messages(channel, created_at DESC);
