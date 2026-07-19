import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useDb } from "@/context/DbContext";
import {
  MagnifyingGlass, Plus, Trash, ArrowClockwise, Clock, X, FloppyDisk,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const TYPE_COLORS = {
  string: "text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/10",
  list: "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10",
  set: "text-[#34d399] border-[#34d399]/30 bg-[#34d399]/10",
  hash: "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10",
  zset: "text-[#fb7185] border-[#fb7185]/30 bg-[#fb7185]/10",
};

const TypeBadge = ({ type }) => (
  <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border ${TYPE_COLORS[type] || ""}`}>
    {type}
  </span>
);

export default function KeyBrowser() {
  const { db } = useDb();
  const [keys, setKeys] = useState([]);
  const [pattern, setPattern] = useState("*");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/cache/keys", { params: { db_idx: db, pattern: pattern || "*" } });
      setKeys(res.data.keys);
    } catch { toast.error("Failed to load keys"); }
    finally { setLoading(false); }
  }, [db, pattern]);

  useEffect(() => { load(); setSelected(null); setDetail(null); }, [load]);

  const openKey = async (key) => {
    setSelected(key);
    try {
      const res = await api.get("/cache/key", { params: { key, db_idx: db } });
      setDetail(res.data);
    } catch { toast.error("Key not found"); setDetail(null); }
  };

  const del = async (key) => {
    await api.delete(`/cache/key/${encodeURIComponent(key)}`, { params: { db_idx: db } });
    toast.success(`Deleted ${key}`);
    if (selected === key) { setSelected(null); setDetail(null); }
    load();
  };

  const updateTtl = async (key, ttl) => {
    await api.put(`/cache/key/${encodeURIComponent(key)}/ttl`, { db, ttl });
    toast.success("TTL updated");
    openKey(key); load();
  };

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-2xl font-bold tracking-tight">Key Browser</h1>
          <p className="text-muted-foreground text-sm mt-1">db{db} · {keys.length} keys</p>
        </div>
        <Button data-testid="new-key-button" onClick={() => setShowCreate(true)} className="rounded-md gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus weight="bold" size={16} /> New Key
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="border border-border rounded-md bg-card">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <div className="relative flex-1">
              <MagnifyingGlass size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                data-testid="key-search-input"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="pattern e.g. user:*"
                className="pl-8 h-9 rounded-md font-mono text-sm bg-background border-border"
              />
            </div>
            <Button data-testid="key-search-button" onClick={load} variant="outline" size="icon" className="h-9 w-9 rounded-md border-border">
              <ArrowClockwise size={15} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
          <div className="max-h-[calc(100vh-260px)] overflow-auto">
            {keys.length === 0 && (
              <div className="p-8 text-center font-mono text-sm text-muted-foreground">
                {loading ? "scanning…" : "no keys match pattern"}
              </div>
            )}
            {keys.map((k) => (
              <button
                key={k.key}
                data-testid={`key-row-${k.key}`}
                onClick={() => openKey(k.key)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 border-b border-border/60 text-left hover:bg-accent transition-colors ${selected === k.key ? "bg-primary/5 border-l-2 border-l-foreground" : "border-l-2 border-l-transparent"}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TypeBadge type={k.type} />
                  <span className="font-mono text-sm truncate">{k.key}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono text-xs text-muted-foreground">
                  <span>{k.size}</span>
                  {k.ttl >= 0 && <span className="text-warning flex items-center gap-1"><Clock size={11} />{k.ttl}s</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="border border-border rounded-md bg-card min-h-[300px]">
          {!detail ? (
            <div className="h-full flex items-center justify-center p-8 font-mono text-sm text-muted-foreground">
              select a key to inspect
            </div>
          ) : (
            <KeyDetail detail={detail} onDelete={del} onTtl={updateTtl} onClose={() => { setSelected(null); setDetail(null); }} />
          )}
        </div>
      </div>

      <CreateKeyDialog open={showCreate} onOpenChange={setShowCreate} db={db} onCreated={() => { setShowCreate(false); load(); }} />
    </div>
  );
}

function KeyDetail({ detail, onDelete, onTtl, onClose }) {
  const [ttlInput, setTtlInput] = useState(detail.ttl >= 0 ? String(detail.ttl) : "");

  return (
    <div>
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TypeBadge type={detail.type} />
            <span className="font-mono text-sm truncate">{detail.key}</span>
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            size {detail.size} · ttl {detail.ttl < 0 ? "∞" : `${detail.ttl}s`}
          </div>
        </div>
        <button data-testid="key-detail-close" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>

      <div className="p-4 space-y-4">
        {/* TTL editor */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground w-10">TTL</span>
          <Input
            data-testid="ttl-input"
            value={ttlInput}
            onChange={(e) => setTtlInput(e.target.value)}
            placeholder="seconds (-1 = persist)"
            className="h-8 rounded-md font-mono text-sm bg-background flex-1"
          />
          <Button data-testid="set-ttl-button" size="sm" variant="outline" className="rounded-md border-border h-8"
            onClick={() => onTtl(detail.key, ttlInput === "" ? -1 : Number(ttlInput))}>
            <FloppyDisk size={14} className="mr-1" /> Set
          </Button>
        </div>

        {/* Value viewer */}
        <ValueViewer detail={detail} />

        <Button data-testid="delete-key-button" variant="outline"
          className="w-full rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
          onClick={() => onDelete(detail.key)}>
          <Trash size={15} /> Delete key
        </Button>
      </div>
    </div>
  );
}

function ValueViewer({ detail }) {
  const { type, value } = detail;
  if (type === "string") {
    return <pre className="font-mono text-sm bg-background border border-border rounded-md p-3 whitespace-pre-wrap break-all">{value}</pre>;
  }
  if (type === "list" || type === "set") {
    return (
      <div className="border border-border rounded-md max-h-[300px] overflow-auto">
        {value.map((v, i) => (
          <div key={i} className="flex gap-3 px-3 py-1.5 border-b border-border/50 font-mono text-sm">
            <span className="text-muted-foreground w-8">{type === "list" ? i : "•"}</span>
            <span className="break-all">{v}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "hash") {
    return (
      <div className="border border-border rounded-md max-h-[300px] overflow-auto">
        {value.map((row, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 px-3 py-1.5 border-b border-border/50 font-mono text-sm">
            <span className="text-primary truncate">{row.field}</span>
            <span className="break-all">{row.value}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "zset") {
    return (
      <div className="border border-border rounded-md max-h-[300px] overflow-auto">
        {value.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 border-b border-border/50 font-mono text-sm">
            <span className="break-all">{row.member}</span>
            <span className="text-warning">{row.score}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function CreateKeyDialog({ open, onOpenChange, db, onCreated }) {
  const [key, setKey] = useState("");
  const [type, setType] = useState("string");
  const [ttl, setTtl] = useState("");
  const [raw, setRaw] = useState("");

  useEffect(() => { if (open) { setKey(""); setType("string"); setTtl(""); setRaw(""); } }, [open]);

  const placeholder = {
    string: "hello world",
    list: "one, two, three",
    set: "apple, banana, cherry",
    hash: "name=Ada, role=admin",
    zset: "alice=100, bob=85",
  }[type];

  const parseValue = () => {
    if (type === "string") return raw;
    if (type === "list" || type === "set") return raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (type === "hash")
      return raw.split(",").map((p) => { const [f, ...v] = p.split("="); return { field: f.trim(), value: v.join("=").trim() }; }).filter((x) => x.field);
    if (type === "zset")
      return raw.split(",").map((p) => { const [mem, sc] = p.split("="); return { member: mem.trim(), score: Number(sc) }; }).filter((x) => x.member);
    return raw;
  };

  const submit = async () => {
    if (!key.trim()) { toast.error("Key name required"); return; }
    try {
      await api.post("/cache/key", {
        db, key: key.trim(), type, value: parseValue(),
        ttl: ttl === "" ? null : Number(ttl),
      });
      toast.success(`Key ${key} created`);
      onCreated();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to create key"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-md max-w-lg">
        <DialogHeader><DialogTitle className="font-head tracking-tight">Create Key · db{db}</DialogTitle>
          <DialogDescription className="font-mono text-xs">Add a new key of any supported type to db{db}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs text-muted-foreground">KEY NAME</label>
            <Input data-testid="create-key-name" value={key} onChange={(e) => setKey(e.target.value)} placeholder="user:1001" className="mt-1 h-9 rounded-md font-mono bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-xs text-muted-foreground">TYPE</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="create-key-type" className="mt-1 h-9 rounded-md font-mono bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="font-mono">
                  {["string", "list", "set", "hash", "zset"].map((t) => (
                    <SelectItem key={t} value={t} data-testid={`type-option-${t}`}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground">TTL (sec, blank=∞)</label>
              <Input data-testid="create-key-ttl" value={ttl} onChange={(e) => setTtl(e.target.value)} placeholder="3600" className="mt-1 h-9 rounded-md font-mono bg-background" />
            </div>
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground">VALUE</label>
            <textarea
              data-testid="create-key-value"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="mt-1 w-full rounded-md font-mono text-sm bg-background border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {type === "hash" ? "format: field=value, field=value" : type === "zset" ? "format: member=score, member=score" : type === "string" ? "raw text" : "comma separated"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-md border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="create-key-submit" className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90" onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
