import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useDb } from "@/context/DbContext";

const HELP = [
  "CacheForge CLI — supported command groups:",
  "  strings : SET GET DEL APPEND INCR DECR INCRBY MSET MGET STRLEN SETEX GETSET",
  "  keys    : KEYS SCAN EXISTS TYPE TTL EXPIRE PERSIST RENAME DBSIZE FLUSHDB",
  "  lists   : LPUSH RPUSH LPOP RPOP LRANGE LLEN LINDEX LSET LREM",
  "  sets    : SADD SREM SMEMBERS SISMEMBER SCARD SPOP SUNION SINTER SDIFF",
  "  hashes  : HSET HGET HDEL HGETALL HKEYS HVALS HLEN HEXISTS HINCRBY",
  "  zsets   : ZADD ZREM ZSCORE ZCARD ZRANK ZREVRANK ZRANGE ZREVRANGE ZINCRBY ZRANGEBYSCORE",
  "  pubsub  : PUBLISH SUBSCRIBE",
  "  server  : PING ECHO SELECT INFO TIME · type CLEAR to reset screen",
];

const formatResult = (result) => {
  if (result === null) return ["(nil)"];
  if (result === "OK" || typeof result === "string" || typeof result === "number") {
    return String(result).split("\r\n").filter((l) => l !== "");
  }
  if (Array.isArray(result)) {
    if (result.length === 0) return ["(empty array)"];
    return result.map((item, i) => `${i + 1}) ${item === null ? "(nil)" : item}`);
  }
  return [JSON.stringify(result)];
};

export default function CliConsole() {
  const { db, setDb } = useDb();
  const [lines, setLines] = useState([
    { type: "sys", text: "CacheForge CLI v1.0.0 — connected. Type HELP for commands." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [hIdx, setHIdx] = useState(-1);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const run = async () => {
    const cmd = input.trim();
    if (!cmd) return;
    setHistory((h) => [...h, cmd]); setHIdx(-1);
    setLines((l) => [...l, { type: "cmd", text: cmd, db }]);
    setInput("");

    const upper = cmd.toUpperCase();
    if (upper === "CLEAR") { setLines([]); return; }
    if (upper === "HELP") { setLines((l) => [...l, ...HELP.map((t) => ({ type: "help", text: t }))]); return; }

    try {
      const res = await api.post("/cli/execute", { db, command: cmd });
      if (res.data.db !== db) setDb(res.data.db);
      if (res.data.ok) {
        setLines((l) => [...l, ...formatResult(res.data.result).map((t) => ({ type: "out", text: t }))]);
      } else {
        setLines((l) => [...l, { type: "err", text: `(error) ${res.data.error}` }]);
      }
    } catch {
      setLines((l) => [...l, { type: "err", text: "(error) request failed" }]);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") { run(); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const ni = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(ni); setInput(history[ni]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx < 0) return;
      const ni = hIdx + 1;
      if (ni >= history.length) { setHIdx(-1); setInput(""); }
      else { setHIdx(ni); setInput(history[ni]); }
    }
  };

  return (
    <div className="fade-up">
      <div className="mb-4">
        <h1 className="font-head text-2xl font-bold tracking-tight">CLI Terminal</h1>
        <p className="text-muted-foreground text-sm mt-1">Interactive redis-cli · db{db}</p>
      </div>

      <div
        data-testid="cli-terminal"
        onClick={() => inputRef.current?.focus()}
        className="border border-border rounded-lg bg-[#0a0a0a] cursor-text overflow-hidden"
      >
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-card/50">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-muted-foreground">cacheforge — db{db}</span>
        </div>
        <div className="p-4 font-mono text-sm h-[calc(100vh-280px)] min-h-[360px] overflow-auto leading-6">
          {lines.map((l, i) => {
            if (l.type === "cmd")
              return <div key={i}><span className="text-[#60a5fa]">{`127.0.0.1:6379[${l.db}]>`}</span> <span className="text-foreground">{l.text}</span></div>;
            if (l.type === "err") return <div key={i} className="text-[#f87171]">{l.text}</div>;
            if (l.type === "sys") return <div key={i} className="text-muted-foreground">{l.text}</div>;
            if (l.type === "help") return <div key={i} className="text-muted-foreground whitespace-pre">{l.text}</div>;
            return <div key={i} className="text-foreground/80 pl-1">{l.text}</div>;
          })}
          <div className="flex items-center">
            <span className="text-[#60a5fa] shrink-0">{`127.0.0.1:6379[${db}]>`}</span>
            <input
              ref={inputRef}
              data-testid="cli-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoComplete="off"
              className="ml-2 flex-1 bg-transparent border-none outline-none text-foreground font-mono"
            />
          </div>
          <div ref={endRef} />
        </div>
      </div>
      <p className="mt-3 font-mono text-xs text-muted-foreground">↑/↓ history · CLEAR to reset · HELP for commands</p>
    </div>
  );
}
