import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useDb } from "@/context/DbContext";
import { useAuth } from "@/context/AuthContext";
import { Warning, Trash, User } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { db } = useDb();
  const { user } = useAuth();
  const [flushing, setFlushing] = useState(false);

  const flush = async () => {
    setFlushing(true);
    try {
      await api.post("/cache/flush", null, { params: { db_idx: db } });
      toast.success(`db${db} flushed`);
    } catch { toast.error("Flush failed"); }
    finally { setFlushing(false); }
  };

  return (
    <div className="fade-up max-w-3xl">
      <div className="mb-6">
        <h1 className="font-head text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">instance & account configuration</p>
      </div>

      <div className="space-y-4">
        <div className="border border-border rounded-md bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
            <User size={15} /> Account
          </div>
          <div className="font-mono text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">name</span><span>{user?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">email</span><span>{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">user id</span><span className="text-primary">{user?.user_id}</span></div>
          </div>
        </div>

        <div className="border border-border rounded-md bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
            Instance
          </div>
          <div className="font-mono text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">engine</span><span>CacheForge 1.0.0</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">databases</span><span>16 (db0 – db15)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">persistence</span><span className="text-warning">in-memory</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">data types</span><span>string · list · set · hash · zset</span></div>
          </div>
        </div>

        <div className="border border-destructive/40 rounded-md bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-destructive mb-2">
            <Warning size={15} /> Danger Zone
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently remove all keys from the currently selected database (db{db}). This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button data-testid="flush-db-button" variant="outline" disabled={flushing}
                className="rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 gap-2">
                <Trash size={15} /> Flush db{db}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border rounded-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-head">Flush db{db}?</AlertDialogTitle>
                <AlertDialogDescription className="font-mono text-sm">
                  All keys in db{db} will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-md border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction data-testid="confirm-flush-button" onClick={flush}
                  className="rounded-md bg-destructive text-destructive-foreground hover:bg-primary/90">
                  Flush
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
