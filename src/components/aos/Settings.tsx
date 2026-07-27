import { useState } from "react";
import { useAOS, getCurrentUser, dailyCheckIn, todayISO, logout, registerUser, loginUser, loginWithRecovery } from "@/lib/aos";

export function SettingsView() {
  useAOS();
  const user = getCurrentUser();
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"none" | "login" | "register" | "recover">("none");
  const [u, setU] = useState("");
  const [pw, setPw] = useState("");
  const [rc, setRc] = useState("");

  if (!user) return null;
  const checkedInToday = user.lastCheckIn === todayISO();

  const check = () => {
    const r = dailyCheckIn();
    if (r.got > 0) setMsg(`+${r.got} 🐥  streak: ${r.streak}${r.gift ? " · 🎁 rare card gift!" : ""}`);
    else setMsg("Already checked in today!");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="font-bold mb-2">Daily Check-in</div>
        <div className="text-sm text-muted-foreground mb-3">7-day streak = free rare card 🎁</div>
        <div className="flex items-center justify-between">
          <div>Streak: <b>{user.checkInStreak}</b> days</div>
          <button
            onClick={check}
            disabled={checkedInToday}
            className="px-4 py-2 rounded-full bg-green font-medium disabled:opacity-50"
          >
            {checkedInToday ? "✓ Checked in" : "Check in +🐥"}
          </button>
        </div>
        {msg && <div className="mt-2 text-sm">{msg}</div>}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="font-bold mb-2">Account</div>
        <div className="text-sm mb-2">Logged in as <b>{user.profile.username}</b></div>
        <div className="text-xs mb-2 rounded-lg bg-yellow/40 p-2">
          <div className="font-semibold">Recovery code:</div>
          <code className="break-all">{user.recoveryCode}</code>
          <button onClick={() => { navigator.clipboard.writeText(user.recoveryCode); setMsg("Copied!"); }} className="ml-2 underline">copy</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMode("register")} className="px-3 py-1.5 rounded-full bg-pink text-sm">Register / new account</button>
          <button onClick={() => setMode("login")} className="px-3 py-1.5 rounded-full bg-blue text-sm">Log in</button>
          <button onClick={() => setMode("recover")} className="px-3 py-1.5 rounded-full bg-purple text-sm">Use recovery code</button>
          <button onClick={() => { logout(); setMsg("Logged out"); }} className="px-3 py-1.5 rounded-full bg-destructive/70 text-destructive-foreground text-sm">Log out</button>
        </div>

        {mode !== "none" && (
          <div className="mt-3 space-y-2">
            {mode === "recover" ? (
              <>
                <input value={rc} onChange={(e) => setRc(e.target.value)} placeholder="Recovery code" className="w-full p-2 rounded-lg border" />
                <button onClick={() => { const r = loginWithRecovery(rc.trim()); setMsg(r ? "Welcome back!" : "Invalid code"); setMode("none"); }} className="w-full py-2 rounded-lg bg-primary text-primary-foreground">Recover</button>
              </>
            ) : (
              <>
                <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Username" className="w-full p-2 rounded-lg border" />
                <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Password" className="w-full p-2 rounded-lg border" />
                <button
                  onClick={() => {
                    if (mode === "register") {
                      if (!u || !pw) { setMsg("Enter username & password"); return; }
                      registerUser(u, pw);
                      setMsg("Account created!");
                    } else {
                      const r = loginUser(u, pw);
                      setMsg(r ? "Welcome back!" : "Invalid login");
                    }
                    setU(""); setPw(""); setMode("none");
                  }}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  {mode === "register" ? "Create account" : "Log in"}
                </button>
              </>
            )}
            <button onClick={() => setMode("none")} className="w-full py-1 text-muted-foreground text-sm">Cancel</button>
          </div>
        )}
      </div>

    </div>
  );
}
