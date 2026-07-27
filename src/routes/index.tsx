import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureGuest, useAOS } from "@/lib/aos";
import { Wheel } from "@/components/aos/Wheel";
import { BinderView } from "@/components/aos/Binder";
import { ProfileView } from "@/components/aos/Profile";
import { SettingsView } from "@/components/aos/Settings";
import { AdminPanel } from "@/components/aos/Admin";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Archive of Stars — Photocard Collecting Game" },
      { name: "description", content: "Spin the wheel, collect pastel photocards, build your binder. A cozy K-pop photocard collecting game." },
      { property: "og:title", content: "Archive of Stars" },
      { property: "og:description", content: "Spin, collect, trade pastel photocards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Tab = "home" | "binder" | "profile" | "settings";

function App() {
  useAOS();
  const [tab, setTab] = useState<Tab>("home");
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    ensureGuest();
  }, []);

  return (
    <div className="min-h-screen w-full max-w-md mx-auto flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">
          <span className="text-primary">Archive</span> of Stars
        </h1>
        <button
          onClick={() => setShowAdmin(true)}
          aria-label="Admin"
          className="w-10 h-10 rounded-full bg-white/70 shadow flex items-center justify-center text-xl"
        >
          ⋮
        </button>
      </header>

      <main className="flex-1">
        {tab === "home" && (
          <div className="animate-in fade-in duration-300">
            <Wheel />
          </div>
        )}
        {tab === "binder" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <BinderView />
          </div>
        )}
        {tab === "profile" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <ProfileView />
          </div>
        )}
        {tab === "settings" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <SettingsView />
          </div>
        )}
      </main>

      <nav className="sticky bottom-0 bg-white/80 backdrop-blur border-t p-2 grid grid-cols-4 gap-2">
        <TabButton active={tab === "home"} onClick={() => setTab("home")} icon="🎡" label="Home" />
        <TabButton active={tab === "binder"} onClick={() => setTab("binder")} icon="📚" label="Binder" />
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon="👤" label="Profile" />
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon="⚙️" label="Settings" />
      </nav>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 rounded-2xl transition ${active ? "bg-primary text-primary-foreground scale-105" : "bg-transparent"}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
