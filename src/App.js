import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthCallback from "@/components/AuthCallback";
import Login from "@/pages/Login";
import DashboardLayout from "@/components/DashboardLayout";
import Overview from "@/pages/Overview";
import KeyBrowser from "@/pages/KeyBrowser";
import CliConsole from "@/pages/CliConsole";
import PubSub from "@/pages/PubSub";
import Settings from "@/pages/Settings";
import { DbProvider } from "@/context/DbContext";

const AsciiLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <span className="font-mono text-muted-foreground text-sm">
      initializing cacheforge<span className="term-caret ml-0.5" />
    </span>
  </div>
);

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AsciiLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <DbProvider>
              <DashboardLayout />
            </DbProvider>
          </Protected>
        }
      >
        <Route index element={<Overview />} />
        <Route path="keys" element={<KeyBrowser />} />
        <Route path="cli" element={<CliConsole />} />
        <Route path="pubsub" element={<PubSub />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" theme="dark" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
