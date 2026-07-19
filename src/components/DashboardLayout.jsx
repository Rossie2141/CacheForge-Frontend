import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Lightning, Gauge, Database, Terminal, Broadcast, GearSix,
  SignOut, Circle, Plus,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";

const nav = [
  { to: "/", label: "Overview", icon: Gauge, end: true, testid: "nav-overview" },
  { to: "/keys", label: "Key Browser", icon: Database, testid: "nav-keys" },
  { to: "/cli", label: "CLI Terminal", icon: Terminal, testid: "nav-cli" },
  { to: "/pubsub", label: "Pub / Sub", icon: Broadcast, testid: "nav-pubsub" },
  { to: "/settings", label: "Settings", icon: GearSix, testid: "nav-settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { db, setDb } = useDb();
  const location = useLocation();
  const [online, setOnline] = useState(true);
  const [ops, setOps] = useState(0);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await api.get("/metrics");
        if (active) { setOnline(true); setOps(res.data.ops_per_sec); }
      } catch {
        if (active) setOnline(false);
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => { active = false; clearInterval(id); };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border flex flex-col fixed h-screen bg-card/40">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
            <Lightning weight="fill" className="text-background" size={15} />
          </div>
          <span className="font-head font-bold tracking-tight">CacheForge</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                data-testid={n.testid}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`
                }
              >
                <Icon size={17} weight="regular" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-medium text-xs">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <button
            data-testid="logout-button"
            onClick={logout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
          >
            <SignOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 sticky top-0 bg-background/70 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Database</span>
            <Select value={String(db)} onValueChange={(v) => setDb(Number(v))}>
              <SelectTrigger data-testid="db-selector" className="w-[110px] h-8 rounded-md font-mono text-xs bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-mono">
                {Array.from({ length: 16 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)} data-testid={`db-option-${i}`}>
                    db{i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <span className="text-muted-foreground">
              {ops} <span className="text-muted-foreground/70">ops/sec</span>
            </span>
            <span
              data-testid="connection-status"
              className={`flex items-center gap-2 font-medium ${online ? "text-foreground" : "text-destructive"}`}
            >
              <Circle weight="fill" size={8} className={online ? "text-success" : "text-destructive"} />
              {online ? "Connected" : "Offline"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { Plus };
