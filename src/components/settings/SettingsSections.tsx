import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Key, Copy } from "lucide-react";

const db = supabase as any;

/* ---------------- Profile ---------------- */
export const ProfileSection = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ full_name: "", department: "", job_title: "" });
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", department: profile.department ?? "", job_title: profile.job_title ?? "" });
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = profile
      ? await db.from("profiles").update(form).eq("user_id", user.id)
      : await db.from("profiles").insert({ ...form, user_id: user.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.auth.updateUser({ data: { full_name: form.full_name } });
    qc.invalidateQueries({ queryKey: ["my-profile"] });
    toast.success("Profile saved");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: e2 } = await db.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
    if (e2) return toast.error(e2.message);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
    toast.success("Avatar updated");
  };

  const initials = (form.full_name || user?.email || "?").split(/[\s@]/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">{initials}</div>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Change Avatar</Button>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF or WebP. Max 2MB</p>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Full Name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input value={user?.email ?? ""} disabled className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Department</Label>
          <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Job Title</Label>
          <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className="h-9" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="premium" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </div>
    </div>
  );
};

/* ---------------- Security ---------------- */
export const SecuritySection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const changePassword = async () => {
    if (pw.next.length < 6) return toast.error("New password must be at least 6 characters");
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user!.email!, password: pw.current });
    if (authErr) { setBusy(false); return toast.error("Current password is incorrect"); }
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password changed");
    setOpen(false);
    setPw({ current: "", next: "", confirm: "" });
  };

  const signOutOthers = async () => {
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) toast.error(error.message);
    else toast.success("All other devices have been signed out");
  };

  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    navigate("/auth");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div>
          <p className="font-medium text-sm">Password</p>
          <p className="text-xs text-muted-foreground">Signed in as {user?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Change</Button>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div>
          <p className="font-medium text-sm">Other sessions</p>
          <p className="text-xs text-muted-foreground">Sign out every other browser or device</p>
        </div>
        <Button variant="outline" size="sm" onClick={signOutOthers}>Sign out others</Button>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div>
          <p className="font-medium text-sm">All sessions</p>
          <p className="text-xs text-muted-foreground">Sign out everywhere, including here</p>
        </div>
        <Button variant="destructive" size="sm" onClick={signOutAll}>Sign out all</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Enter your current password, then choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <Input type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <Input type="password" placeholder="Confirm new password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={changePassword} disabled={busy}>{busy ? "Saving..." : "Update password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------------- Notifications ---------------- */
const NOTIF_TYPES = [
  { key: "run_completed", title: "Experiment / run completed" },
  { key: "model_deployed", title: "Model deployed" },
  { key: "deploy_drift", title: "Drift detected" },
  { key: "mention", title: "Team activity & mentions" },
  { key: "weekly_report", title: "Weekly reports" },
  { key: "incident", title: "Security & incident alerts" },
];

export const NotificationsSection = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: prefs } = useQuery({
    queryKey: ["notif-prefs", user?.id],
    enabled: !!user,
    queryFn: async () => (await db.from("notification_preferences").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const types: Record<string, boolean> = prefs?.types ?? {};

  const toggle = async (key: string, value: boolean) => {
    const next = { ...types, [key]: value };
    const { error } = prefs
      ? await db.from("notification_preferences").update({ types: next }).eq("user_id", user!.id)
      : await db.from("notification_preferences").insert({ user_id: user!.id, types: next });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notif-prefs"] });
    toast.success("Preference saved");
  };

  return (
    <div className="space-y-2">
      {NOTIF_TYPES.map((n) => (
        <div key={n.key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
          <p className="text-sm">{n.title}</p>
          <Switch checked={types[n.key] ?? true} onCheckedChange={(v) => toggle(n.key, v)} />
        </div>
      ))}
    </div>
  );
};

/* ---------------- API keys ---------------- */
const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const ApiKeysSection = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  const { data: keys = [] } = useQuery({
    queryKey: ["api-tokens", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await db.from("api_token").select("id,name,token_hash,created_at,last_used_at,revoked_at,expires_at").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const create = async () => {
    if (!name.trim()) return toast.error("Give the key a name");
    const { data: ua } = await db.from("user_account").select("tenant_id").eq("id", user!.id).maybeSingle();
    if (!ua?.tenant_id) return toast.error("Your account is not linked to a workspace yet");
    const raw = new Uint8Array(24);
    crypto.getRandomValues(raw);
    const token = "fed_" + Array.from(raw).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await db.from("api_token").insert({
      tenant_id: ua.tenant_id, user_id: user!.id, name: name.trim(), token_hash: await sha256(token), scopes: ["read"],
    });
    if (error) return toast.error(error.message);
    setCreated(token);
    setName("");
    qc.invalidateQueries({ queryKey: ["api-tokens"] });
  };

  const revoke = async (id: string) => {
    const { error } = await db.from("api_token").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["api-tokens"] });
    toast.success("Key revoked");
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="premium" size="sm" onClick={() => { setCreated(null); setOpen(true); }}>Create Key</Button>
      </div>
      <div className="space-y-2">
        {keys.length === 0 && <p className="text-xs text-muted-foreground">No API keys yet.</p>}
        {keys.map((k: any) => (
          <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-primary" />{k.name}
                {k.revoked_at && <Badge variant="secondary" className="text-xs">Revoked</Badge>}
              </p>
              <p className="text-xs font-mono text-muted-foreground">fed_****{String(k.token_hash).slice(-6)} · created {new Date(k.created_at).toLocaleDateString()}</p>
            </div>
            {!k.revoked_at && (
              <Button variant="destructive" size="sm" className="h-7" onClick={() => revoke(k.id)}>Revoke</Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{created ? "Copy your new key" : "Create API key"}</DialogTitle>
            <DialogDescription>
              {created ? "This key is shown only once. Store it somewhere safe." : "Name the key after where you will use it."}
            </DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="flex gap-2">
              <Input readOnly value={created} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(created); toast.success("Copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input placeholder="e.g. CI/CD pipeline" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <DialogFooter>
            {created ? <Button onClick={() => setOpen(false)}>Done</Button> : <Button onClick={create}>Create</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ---------------- Theme ---------------- */
export const ThemeButtons = () => {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("fed-theme") ?? "light");
  const apply = (t: string) => {
    localStorage.setItem("fed-theme", t);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(t);
    setTheme(t);
  };
  return (
    <div className="flex items-center gap-1">
      <Button variant={theme === "dark" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => apply("dark")}>Dark</Button>
      <Button variant={theme === "light" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => apply("light")}>Light</Button>
    </div>
  );
};
