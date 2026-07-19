import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Database, Lightning, Memory, Target, ClockCountdown, Command,
} from "@phosphor-icons/react";

const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};
const fmtUptime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
};

const Stat = ({ icon: Icon, label, value, sub, testid }) => (
  <div data-testid={testid} className="border border-border rounded-lg bg-card p-5 hover:bg-accent/30 transition-colors">
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <Icon size={15} /> {label}
    </div>
    <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
  </div>
);

export default function Overview() {
  const [m, setM] = useState(null);
  const [series, setSeries] = useState([]);
  const tick = useRef(0);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await api.get("/metrics");
        if (!active) return;
        setM(res.data);
        tick.current += 1;
        setSeries((prev) => [...prev.slice(-29), { t: tick.current, ops: res.data.ops_per_sec }]);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { active = false; clearInterval(id); };
  }, []);

  if (!m) {
    return <div className="font-mono text-sm text-muted-foreground">loading metrics<span className="term-caret ml-0.5" /></div>;
  }

  const pie = [
    { name: "hits", value: m.hits, color: "#3b82f6" },
    { name: "misses", value: m.misses, color: "#3f3f46" },
  ];
  const hasPie = m.hits + m.misses > 0;

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-head text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time telemetry for your cache instance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Database} label="Total Keys" value={m.total_keys} sub={`${m.per_db.length} active dbs`} testid="stat-keys" />
        <Stat icon={Lightning} label="Ops / sec" value={m.ops_per_sec} sub={`${m.total_commands} total cmds`} testid="stat-ops" />
        <Stat icon={Memory} label="Memory" value={fmtBytes(m.used_memory_bytes)} sub="estimated usage" testid="stat-memory" />
        <Stat icon={Target} label="Hit Rate" value={`${m.hit_rate}%`} sub={`${m.hits} hits · ${m.misses} miss`} testid="stat-hitrate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ops chart */}
        <div className="lg:col-span-2 border border-border rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
            <Lightning size={15} /> Throughput (ops/sec)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series}>
              <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis stroke="hsl(0 0% 45%)" tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }} width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                labelStyle={{ display: "none" }}
              />
              <Line type="monotone" dataKey="ops" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hit / miss */}
        <div className="border border-border rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
            <Target size={15} /> Cache Hits
          </div>
          {hasPie ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="none">
                  {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
              No reads yet — run a GET command
            </div>
          )}
          <div className="flex justify-center gap-4 text-xs mt-2">
            <span className="text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "#3b82f6" }} /> hits {m.hits}</span>
            <span className="text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "#3f3f46" }} /> misses {m.misses}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Command stats */}
        <div className="border border-border rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
            <Command size={15} /> Top Commands
          </div>
          <div className="space-y-2 font-mono text-sm">
            {m.command_stats.length === 0 && <div className="text-muted-foreground text-xs">no commands yet</div>}
            {m.command_stats.map((c) => (
              <div key={c.command} className="flex justify-between items-center">
                <span className="text-foreground">{c.command}</span>
                <span className="text-muted-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Keyspace */}
        <div className="border border-border rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
            <Database size={15} /> Keyspace
          </div>
          <div className="space-y-2 font-mono text-sm">
            {m.per_db.length === 0 && <div className="text-muted-foreground text-xs">empty</div>}
            {m.per_db.map((d) => (
              <div key={d.db} className="flex justify-between">
                <span className="text-muted-foreground">db{d.db}</span>
                <span className="text-foreground">{d.keys} keys <span className="text-muted-foreground">· {d.expires} ttl</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Slowlog + uptime */}
        <div className="border border-border rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
            <ClockCountdown size={15} /> Instance
          </div>
          <div className="font-mono text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">uptime</span><span>{fmtUptime(m.uptime_sec)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">clients</span><span>{m.connected_clients}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">expired</span><span>{m.expired_keys}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">version</span><span>1.0.0</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
