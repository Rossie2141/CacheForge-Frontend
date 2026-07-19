import { Lightning, ChartLineUp, Terminal, Database } from "@phosphor-icons/react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function Login() {
  const handleLogin = () => {
    
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    { icon: Database, title: "Full data-type support", desc: "Strings, lists, sets, hashes and sorted sets across 16 logical databases." },
    { icon: Terminal, title: "Web-based CLI", desc: "A familiar redis-cli in the browser, with command history and inline results." },
    { icon: ChartLineUp, title: "Live telemetry", desc: "Throughput, hit-rate, memory and keyspace metrics updated in real time." },
  ];

  console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Left: brand + value props */}
      <div className="relative hidden lg:flex flex-col justify-between p-14 border-r border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
            <Lightning weight="fill" className="text-background" size={18} />
          </div>
          <span className="font-head font-bold text-lg tracking-tight">CacheForge</span>
        </div>

        <div className="max-w-md space-y-10">
          <div className="space-y-4">
            <h1 className="font-head text-[2.75rem] leading-[1.08] font-extrabold tracking-tighter">
              A faster way to run<br />and inspect your cache.
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              CacheForge gives you a private in-memory data store with a clean
              management console — browse keys, run commands and watch metrics live.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-4">
                  <div className="mt-0.5 w-9 h-9 rounded-md border border-border bg-card flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{f.title}</div>
                    <div className="text-muted-foreground text-sm leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-muted-foreground text-xs">© 2026 CacheForge · v1.0.0</div>
      </div>

      {/* Right: sign in */}
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8 fade-up">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
              <Lightning weight="fill" className="text-background" size={18} />
            </div>
            <span className="font-head font-bold text-lg tracking-tight">CacheForge</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-head text-2xl font-bold tracking-tight">Sign in to your workspace</h2>
            <p className="text-muted-foreground text-sm">Continue with your Google account to get started.</p>
          </div>

          <button
            data-testid="google-login-button"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-medium text-sm py-2.5 rounded-md hover:bg-foreground/90 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.3 14.7 2.3 12 2.3 6.98 2.3 2.9 6.38 2.9 11.4S6.98 20.5 12 20.5c5.2 0 8.64-3.66 8.64-8.8 0-.6-.06-1.05-.15-1.5H12z"/>
            </svg>
            Continue with Google
          </button>

          <div className="border-t border-border pt-6">
            <p className="text-muted-foreground text-xs leading-relaxed">
              By continuing you agree to run CacheForge in a secure, 7-day session.
              Your workspace and data stay private to your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
