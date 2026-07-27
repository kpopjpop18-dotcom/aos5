import { useState } from "react";
import { useAOS, tryAdminLogin, adminLogout, adminAddPhotocard, adminRemovePhotocard, adminBanUser, todayISO, Rarity } from "@/lib/aos";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const s = useAOS();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  if (!s.adminUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="font-bold text-lg">Admin access</div>
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Admin password" className="w-full p-2 rounded-lg border" />
          {err && <div className="text-destructive text-sm">{err}</div>}
          <button onClick={() => { if (tryAdminLogin(pw)) { setErr(""); } else setErr("Wrong password"); }} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium">Unlock</button>
          <button onClick={onClose} className="w-full py-1 text-muted-foreground text-sm">Cancel</button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onClose={onClose} />;
}

function AdminDashboard({ onClose }: { onClose: () => void }) {
  const s = useAOS();
  const [rarity, setRarity] = useState<Rarity>("common");
  const totalUsers = Object.keys(s.users).length;
  const today = todayISO();
  const todayVisits = s.admin.visits.find((v) => v.date === today)?.count ?? 0;

  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      const r = new FileReader();
      r.onload = () => adminAddPhotocard(r.result as string, rarity);
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 bg-white/80 backdrop-blur p-4 flex items-center justify-between border-b">
        <div className="font-bold">Admin Dashboard</div>
        <div className="flex gap-2">
          <button onClick={() => { adminLogout(); }} className="text-sm text-muted-foreground underline">Lock</button>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>
      </div>
      <div className="p-4 space-y-4 pb-24">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Users" value={totalUsers} bg="pink" />
          <Stat label="Today logins" value={todayVisits} bg="blue" />
          <Stat label="Cards in library" value={s.admin.library.length} bg="green" />
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="font-bold mb-2">Add photocards to shared library</div>
          <div className="text-xs text-muted-foreground mb-2">Uploaded cards become available to every player. (For GitHub sync, cards are stored locally in this MVP; wire a backend to persist across devices.)</div>
          <div className="flex gap-2 mb-2 flex-wrap">
            {(["common", "rare", "ultra", "impossible"] as Rarity[]).map((r) => (
              <button key={r} onClick={() => setRarity(r)} className={`px-3 py-1.5 rounded-full text-sm ${rarity === r ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {r}
              </button>
            ))}
          </div>
          <label className="block">
            <input type="file" multiple accept="image/*" onChange={upload} className="hidden" />
            <div className="w-full p-6 rounded-xl border-2 border-dashed text-center cursor-pointer bg-yellow/30">
              📤 Tap to upload photocard images
            </div>
          </label>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="font-bold mb-2">Library ({s.admin.library.length})</div>
          <div className="grid grid-cols-4 gap-2">
            {s.admin.library.map((c) => (
              <div key={c.id} className="relative">
                <img src={c.image} alt="" width={300} height={400} loading="lazy" decoding="async" draggable={false} className="w-full aspect-[3/4] rounded-lg object-cover select-none" />
                <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">{c.rarity}</div>
                <button onClick={() => { if (confirm("Remove?")) adminRemovePhotocard(c.id); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="font-bold mb-2">Users</div>
          <div className="space-y-1">
            {Object.values(s.users).map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm py-1">
                <div>
                  {u.profile.username}
                  {s.admin.bannedUsers.includes(u.id) && <span className="ml-2 text-destructive text-xs">banned</span>}
                </div>
                <button onClick={() => adminBanUser(u.id)} className="text-xs text-destructive underline">ban</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="font-bold mb-2">Login history</div>
          <div className="text-sm space-y-0.5 max-h-40 overflow-y-auto">
            {s.admin.visits.slice().reverse().map((v) => (
              <div key={v.date} className="flex justify-between"><span>{v.date}</span><span>{v.count}</span></div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-purple/40 p-4 text-sm">
          <b>Admin perks:</b> unlimited spins (no cooldown/chickens consumed while unlocked).
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <div className="rounded-2xl p-3 shadow text-center" style={{ background: `var(--color-${bg})` }}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
