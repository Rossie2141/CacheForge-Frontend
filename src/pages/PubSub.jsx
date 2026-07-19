import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Broadcast, PaperPlaneTilt, Hash } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PubSub() {
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [channel, setChannel] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [ch, ms] = await Promise.all([
        api.get("/pubsub/channels"),
        api.get("/pubsub/messages", { params: active ? { channel: active } : {} }),
      ]);
      setChannels(ch.data.channels);
      setMessages(ms.data.messages);
    } catch {}
  }, [active]);

  useEffect(() => {
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, [load]);

  const publish = async () => {
    if (!channel.trim() || !msg.trim()) { toast.error("Channel and message required"); return; }
    try {
      await api.post("/pubsub/publish", { channel: channel.trim(), message: msg.trim() });
      toast.success(`Published to ${channel}`);
      setMsg("");
      load();
    } catch { toast.error("Publish failed"); }
  };

  return (
    <div className="fade-up">
      <div className="mb-6">
        <h1 className="font-head text-2xl font-bold tracking-tight">Pub / Sub</h1>
        <p className="text-muted-foreground text-sm mt-1">Publish messages and monitor live channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Publisher + channels */}
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <PaperPlaneTilt size={15} /> Publish
            </div>
            <Input data-testid="pubsub-channel-input" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="channel name" className="h-9 rounded-md font-mono bg-background" />
            <Input data-testid="pubsub-message-input" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && publish()} placeholder="message payload" className="h-9 rounded-md font-mono bg-background" />
            <Button data-testid="pubsub-publish-button" onClick={publish} className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <PaperPlaneTilt size={15} /> Publish
            </Button>
          </div>

          <div className="border border-border rounded-md bg-card p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
              <Hash size={15} /> Channels
            </div>
            <button data-testid="channel-all" onClick={() => setActive(null)}
              className={`w-full text-left font-mono text-sm px-2 py-1.5 rounded-md transition-colors ${!active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              * all channels
            </button>
            {channels.length === 0 && <div className="font-mono text-xs text-muted-foreground mt-2">no channels yet</div>}
            {channels.map((c) => (
              <button key={c.channel} data-testid={`channel-${c.channel}`} onClick={() => setActive(c.channel)}
                className={`w-full flex justify-between font-mono text-sm px-2 py-1.5 rounded-md transition-colors ${active === c.channel ? "bg-accent text-foreground" : "text-foreground hover:bg-accent"}`}>
                <span className="truncate">{c.channel}</span>
                <span className="text-muted-foreground">{c.messages}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message stream */}
        <div className="lg:col-span-2 border border-border rounded-lg bg-[#0a0a0a] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
            <Broadcast size={15} className="text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">
              stream · {active || "all"}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> live
            </span>
          </div>
          <div data-testid="pubsub-stream" className="p-4 font-mono text-sm h-[calc(100vh-260px)] min-h-[360px] overflow-auto space-y-1">
            {messages.length === 0 && <div className="text-muted-foreground">Waiting for messages…</div>}
            {messages.map((m, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-muted-foreground shrink-0">{new Date(m.at * 1000).toLocaleTimeString()}</span>
                <span className="text-[#60a5fa] shrink-0">{m.channel}</span>
                <span className="text-foreground break-all">{m.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
