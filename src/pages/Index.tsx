import { useState, useEffect, useRef } from "react";
import {
  Hash,
  Users,
  Mic,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Monitor,
  Send,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AUTH_URL = "https://functions.poehali.dev/4d3e041d-3570-45e3-a4e4-f1e752bfc02c";
const MESSAGES_URL = "https://functions.poehali.dev/a4613d5c-1808-4f26-a7cf-2f5e60dd82c6";

const CHANNELS = ["общий", "флуд", "мемы", "знакомства"];
const VOICE_CHANNELS = ["Общий", "Игры с друзьями"];

interface User {
  id: number;
  username: string;
  avatar_letter: string;
  avatar_color: string;
  token: string;
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  channel: string;
  username: string;
  avatar_letter: string;
  avatar_color: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState("общий");

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("frenchat_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    const res = await fetch(`${MESSAGES_URL}?channel=${encodeURIComponent(activeChannel)}`);
    const data = await res.json();
    if (data.messages) {
      setMessages(data.messages);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: authMode, username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(data.error || "Ошибка");
      } else {
        localStorage.setItem("frenchat_user", JSON.stringify(data.user));
        setUser(data.user);
        setAuthUsername("");
        setAuthPassword("");
      }
    } catch {
      setAuthError("Ошибка соединения");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || sending) return;
    setSending(true);
    const content = inputText.trim();
    setInputText("");
    try {
      await fetch(MESSAGES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(user.id),
          "X-Auth-Token": user.token,
        },
        body: JSON.stringify({ content, channel: activeChannel }),
      });
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("frenchat_user");
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#36393f] text-white overflow-x-hidden">
      {/* Навигация */}
      <nav className="bg-[#2f3136] border-b border-[#202225] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#5865f2] rounded-full flex items-center justify-center">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">ФренЧат</h1>
              <p className="text-xs text-[#b9bbbe] hidden sm:block">Общайся с друзьями в реальном времени</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <Button
                variant="ghost"
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            ) : (
              <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-2 rounded text-sm font-medium">
                Начать общение
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            className="sm:hidden text-[#b9bbbe] hover:text-white hover:bg-[#40444b] p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-[#202225]">
            <div className="flex flex-col gap-3">
              {user ? (
                <Button
                  variant="ghost"
                  className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </Button>
              ) : (
                <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-2 rounded text-sm font-medium">
                  Начать общение
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Макет Discord */}
      <div className="flex" style={{ height: "calc(100vh - 73px)" }}>
        {/* Боковая панель серверов */}
        <div className="hidden lg:flex w-[72px] bg-[#202225] flex-col items-center py-3 gap-2">
          <div className="w-12 h-12 bg-[#5865f2] rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-12 h-12 bg-[#36393f] rounded-3xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-[#5865f2]"
            >
              <span className="text-[#dcddde] text-sm font-medium">{i}</span>
            </div>
          ))}
        </div>

        {/* Каналы */}
        <div className={`${mobileSidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-60 bg-[#2f3136] flex flex-col flex-shrink-0`}>
          <div className="p-4 border-b border-[#202225] flex items-center justify-between">
            <h2 className="text-white font-semibold text-base">ФренЧат</h2>
            <Button
              variant="ghost"
              className="lg:hidden text-[#b9bbbe] hover:text-white hover:bg-[#40444b] p-1"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="mb-4">
              <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
                <span>Текстовые каналы</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {CHANNELS.map((channel) => (
                  <div
                    key={channel}
                    onClick={() => { setActiveChannel(channel); setMobileSidebarOpen(false); }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer ${
                      activeChannel === channel
                        ? "bg-[#393c43] text-[#dcddde]"
                        : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43]"
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    <span className="text-sm">{channel}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
                <span>Голосовые каналы</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {VOICE_CHANNELS.map((channel) => (
                  <div
                    key={channel}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">{channel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Пользователь внизу */}
          <div className="p-2 bg-[#292b2f] flex items-center gap-2">
            {user ? (
              <>
                <div className={`w-8 h-8 bg-gradient-to-r ${user.avatar_color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-medium">{user.avatar_letter}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{user.username}</div>
                  <div className="text-[#3ba55c] text-xs">В сети</div>
                </div>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-[#40444b]" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 text-[#b9bbbe]" />
                </Button>
              </>
            ) : (
              <div className="flex-1 text-[#b9bbbe] text-xs">Войди чтобы писать</div>
            )}
          </div>
        </div>

        {/* Основная область */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Заголовок канала */}
          <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              className="lg:hidden text-[#8e9297] hover:text-[#dcddde] hover:bg-[#40444b] p-1 mr-2"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Hash className="w-5 h-5 text-[#8e9297]" />
            <span className="text-white font-semibold">{activeChannel}</span>
            <div className="w-px h-6 bg-[#40444b] mx-2 hidden sm:block"></div>
            <span className="text-[#8e9297] text-sm hidden sm:block">Болтай с друзьями в любое время</span>
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!user && (
              /* Форма авторизации */
              <div className="flex items-center justify-center h-full">
                <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-6 w-full max-w-sm">
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => { setAuthMode("login"); setAuthError(""); }}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                        authMode === "login"
                          ? "bg-[#5865f2] text-white"
                          : "bg-[#40444b] text-[#b9bbbe] hover:text-white"
                      }`}
                    >
                      <LogIn className="w-4 h-4 inline mr-1" />
                      Войти
                    </button>
                    <button
                      onClick={() => { setAuthMode("register"); setAuthError(""); }}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                        authMode === "register"
                          ? "bg-[#5865f2] text-white"
                          : "bg-[#40444b] text-[#b9bbbe] hover:text-white"
                      }`}
                    >
                      <UserPlus className="w-4 h-4 inline mr-1" />
                      Регистрация
                    </button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <label className="text-[#8e9297] text-xs font-semibold uppercase block mb-1">Имя пользователя</label>
                      <input
                        type="text"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        placeholder="Введи своё имя"
                        className="w-full bg-[#40444b] text-white rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] placeholder-[#72767d]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[#8e9297] text-xs font-semibold uppercase block mb-1">Пароль</label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#40444b] text-white rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] placeholder-[#72767d]"
                        required
                      />
                    </div>
                    {authError && (
                      <div className="text-red-400 text-sm bg-red-900/20 rounded px-3 py-2">{authError}</div>
                    )}
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium"
                    >
                      {authLoading ? "Загрузка..." : authMode === "login" ? "Войти" : "Зарегистрироваться"}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {user && messages.length === 0 && (
              <div className="text-center text-[#72767d] py-8">
                <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-semibold text-[#b9bbbe]">Добро пожаловать в #{activeChannel}!</p>
                <p className="text-sm">Стань первым, кто напишет сюда.</p>
              </div>
            )}

            {user && messages.map((msg, i) => {
              const prevMsg = messages[i - 1];
              const sameUser = prevMsg && prevMsg.username === msg.username;
              return (
                <div key={msg.id} className={`flex gap-3 sm:gap-4 group ${sameUser ? "mt-0.5" : "mt-4"}`}>
                  {sameUser ? (
                    <div className="w-8 sm:w-10 flex-shrink-0 flex items-start justify-center pt-1">
                      <span className="text-[#72767d] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  ) : (
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${msg.avatar_color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className="text-white text-xs sm:text-sm font-medium">{msg.avatar_letter}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {!sameUser && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-white font-medium text-sm sm:text-base">{msg.username}</span>
                        <span className="text-[#72767d] text-xs hidden sm:inline">Сегодня в {formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div className="text-[#dcddde] text-sm sm:text-base break-words">{msg.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="p-2 sm:p-4 flex-shrink-0">
            {user ? (
              <form onSubmit={handleSend} className="flex gap-2">
                <div className="flex-1 bg-[#40444b] rounded-lg px-3 sm:px-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Сообщение #${activeChannel}`}
                    className="flex-1 bg-transparent text-white text-sm sm:text-base py-2 sm:py-3 outline-none placeholder-[#72767d]"
                    maxLength={2000}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-3 py-2 sm:py-3 rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <div className="bg-[#40444b] rounded-lg px-4 py-3 text-[#72767d] text-sm">
                Войди в аккаунт, чтобы писать сообщения
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
