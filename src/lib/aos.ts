// Archive of Stars — local state store (localStorage-based, guest-friendly)
import { useSyncExternalStore } from "react";

export type Rarity = "common" | "rare" | "ultra" | "impossible";

export interface Photocard {
  id: string;
  image: string; // data URL or URL
  rarity: Rarity;
  addedBy?: string; // admin id
}

export interface OwnedCard {
  uid: string; // unique instance id
  cardId: string;
  binderId: string;
  isNew: boolean;
  forTrade: boolean;
  forAdoption: boolean;
  ownedAt: number;
}

export interface Binder {
  id: string;
  name: string;
  color: string; // token name
}

export interface Profile {
  username: string;
  avatar?: string; // data URL
  emoji?: string;
  favGroup?: string;
  favMember?: string;
  wall: string[]; // owned card uids (max 5)
  spotify?: string;
}

export interface UserState {
  id: string;
  profile: Profile;
  recoveryCode: string;
  password?: string; // simple hashed-ish (not real security)
  chickens: number; // spin currency from daily check-in
  lastCheckIn?: string; // yyyy-mm-dd
  checkInStreak: number;
  lastSpin: number; // timestamp
  binders: Binder[];
  cards: OwnedCard[];
  createdAt: number;
}

export interface AdminState {
  library: Photocard[];
  bannedUsers: string[];
  visits: { date: string; count: number }[];
}

export interface AOSData {
  currentUserId?: string;
  users: Record<string, UserState>;
  admin: AdminState;
  adminUnlocked: boolean;
}

const KEY = "archive-of-stars-v1";
const ADMIN_PASSWORD = "atiny-admin";
const SPIN_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 70,
  rare: 50,
  ultra: 30,
  impossible: 10,
};

const PASTEL_COLORS = ["pink", "blue", "green", "yellow", "purple", "peach"];

// --- default seed cards (placeholder gradients as data URIs) ---
function seedCard(id: string, rarity: Rarity, hue: number): Photocard {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},80%,80%)'/><stop offset='1' stop-color='hsl(${(hue + 60) % 360},80%,70%)'/></linearGradient></defs><rect width='300' height='420' rx='24' fill='url(%23g)'/><text x='50%' y='52%' text-anchor='middle' font-family='sans-serif' font-size='42' fill='white' font-weight='bold'>★</text><text x='50%' y='64%' text-anchor='middle' font-family='sans-serif' font-size='16' fill='white'>${rarity}</text></svg>`;
  return {
    id,
    image: `data:image/svg+xml;utf8,${svg}`,
    rarity,
  };
}

// Only the shared manifest (public/cards/manifest.json) supplies cards.
// No placeholder gradients — players win the real photos the admin uploads.
const DEFAULT_LIBRARY: Photocard[] = [];

function defaultState(): AOSData {
  return {
    users: {},
    admin: {
      library: DEFAULT_LIBRARY,
      bannedUsers: [],
      visits: [],
    },
    adminUnlocked: false,
  };
}

// --- store ---
let state: AOSData = load();
const listeners = new Set<() => void>();

// Bundle the shared manifest at build time so every user — including brand
// new ones on their very first load — instantly has the full shared library
// available (no network wait, works offline). The runtime fetch below then
// layers on any live updates admins pushed to GitHub since the last deploy.
import sharedManifest from "../../public/cards/manifest.json";

function manifestCards(data: unknown): Photocard[] {
  const cards = (data as { cards?: Photocard[] })?.cards;
  if (!Array.isArray(cards)) return [];
  return cards
    .filter((c) => c && c.id && c.image && c.rarity)
    .map((c) => ({ id: c.id, image: c.image, rarity: c.rarity, addedBy: "shared" }));
}

function mergeLibrary(base: Photocard[], incoming: Photocard[]): Photocard[] {
  const byId = new Map<string, Photocard>();
  for (const c of base) byId.set(c.id, c);
  for (const c of incoming) byId.set(c.id, c); // incoming wins
  return Array.from(byId.values());
}

const BUNDLED_SHARED = manifestCards(sharedManifest);

function load(): AOSData {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = defaultState();
      s.admin.library = mergeLibrary(DEFAULT_LIBRARY, BUNDLED_SHARED);
      return s;
    }
    const parsed = JSON.parse(raw) as AOSData;
    const base = parsed.admin?.library?.length ? parsed.admin.library : DEFAULT_LIBRARY;
    parsed.admin = { ...parsed.admin, library: mergeLibrary(base, BUNDLED_SHARED) };
    return parsed;
  } catch {
    return defaultState();
  }
}

function save() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

// --- shared library (GitHub-hosted manifest fetched at runtime) ---
// Deploys ship /cards/manifest.json with the site; admin edits that file in
// GitHub, Netlify redeploys, and every player pulls the new library on load.
export async function loadSharedLibrary() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/cards/manifest.json", { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    const remote = manifestCards(data);
    if (!remote.length) return;
    state = {
      ...state,
      admin: { ...state.admin, library: mergeLibrary(state.admin.library, remote) },
    };
    save();
  } catch {
    // offline / missing manifest — bundled shared library is already loaded
  }
}


if (typeof window !== "undefined") {
  loadSharedLibrary();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAOS(): AOSData {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

// --- helpers ---
function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function makeRecoveryCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) out += "-";
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// --- current user ---
export function getCurrentUser(): UserState | null {
  return state.currentUserId ? state.users[state.currentUserId] || null : null;
}

export function ensureGuest(): UserState {
  const existing = getCurrentUser();
  if (existing) return existing;
  return registerUser("guest_" + Math.random().toString(36).slice(2, 6), undefined, true);
}

export function registerUser(username: string, password?: string, guest = false): UserState {
  const id = uid("u_");
  const user: UserState = {
    id,
    profile: {
      username,
      wall: [],
    },
    recoveryCode: makeRecoveryCode(),
    password,
    chickens: 3, // starter
    checkInStreak: 0,
    lastSpin: 0,
    binders: [
      { id: uid("b_"), name: "My First Binder", color: "pink" },
      { id: uid("b_"), name: "Favorites", color: "purple" },
    ],
    cards: [],
    createdAt: Date.now(),
  };
  state = { ...state, currentUserId: id, users: { ...state.users, [id]: user } };
  bumpVisit();
  save();
  return user;
}

export function loginUser(username: string, password: string): UserState | null {
  const found = Object.values(state.users).find(
    (u) => u.profile.username === username && u.password === password,
  );
  if (!found) return null;
  state = { ...state, currentUserId: found.id };
  bumpVisit();
  save();
  return found;
}

export function loginWithRecovery(code: string): UserState | null {
  const found = Object.values(state.users).find((u) => u.recoveryCode === code);
  if (!found) return null;
  state = { ...state, currentUserId: found.id };
  save();
  return found;
}

export function logout() {
  state = { ...state, currentUserId: undefined, adminUnlocked: false };
  save();
}

function bumpVisit() {
  const today = todayISO();
  const visits = [...state.admin.visits];
  const last = visits[visits.length - 1];
  if (last?.date === today) last.count += 1;
  else visits.push({ date: today, count: 1 });
  state = { ...state, admin: { ...state.admin, visits } };
}

// --- daily check-in ---
export function dailyCheckIn(): { got: number; streak: number; gift?: OwnedCard } {
  const user = getCurrentUser();
  if (!user) return { got: 0, streak: 0 };
  const today = todayISO();
  if (user.lastCheckIn === today) return { got: 0, streak: user.checkInStreak };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = user.lastCheckIn === yesterday ? user.checkInStreak + 1 : 1;
  const got = 1;
  let gift: OwnedCard | undefined;
  const updated: UserState = {
    ...user,
    chickens: user.chickens + got,
    lastCheckIn: today,
    checkInStreak: streak,
  };
  if (streak === 7) {
    const rares = state.admin.library.filter((c) => c.rarity === "rare");
    if (rares.length) {
      const chosen = rares[Math.floor(Math.random() * rares.length)];
      gift = {
        uid: uid("oc_"),
        cardId: chosen.id,
        binderId: updated.binders[0].id,
        isNew: !updated.cards.some((c) => c.cardId === chosen.id),
        forTrade: false,
        forAdoption: false,
        ownedAt: Date.now(),
      };
      updated.cards = [...updated.cards, gift];
    }
  }
  state = { ...state, users: { ...state.users, [user.id]: updated } };
  save();
  return { got, streak, gift };
}

// --- spin ---
export function canSpin(): { ok: boolean; reason?: string; secondsLeft?: number } {
  const user = getCurrentUser();
  if (!user) return { ok: false, reason: "No user" };
  if (state.adminUnlocked) return { ok: true };
  if (user.chickens > 0) return { ok: true };
  const elapsed = Date.now() - user.lastSpin;
  if (elapsed >= SPIN_COOLDOWN_MS) return { ok: true };
  return {
    ok: false,
    reason: "Wait for cooldown or get chickens",
    secondsLeft: Math.ceil((SPIN_COOLDOWN_MS - elapsed) / 1000),
  };
}

export function spinWheel(): { card: Photocard; owned: OwnedCard; isDupe: boolean } | null {
  const user = getCurrentUser();
  if (!user) return null;
  const check = canSpin();
  if (!check.ok) return null;

  // weighted random
  const lib = state.admin.library;
  if (!lib.length) return null;
  const weighted = lib.map((c) => ({ card: c, w: RARITY_WEIGHTS[c.rarity] }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let chosen = weighted[0].card;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) {
      chosen = x.card;
      break;
    }
  }

  const isDupe = user.cards.some((c) => c.cardId === chosen.id);
  const owned: OwnedCard = {
    uid: uid("oc_"),
    cardId: chosen.id,
    binderId: user.binders[0].id,
    isNew: !isDupe,
    forTrade: false,
    forAdoption: false,
    ownedAt: Date.now(),
  };

  const updated: UserState = { ...user };
  if (!state.adminUnlocked) {
    if (user.chickens > 0) updated.chickens = user.chickens - 1;
    else updated.lastSpin = Date.now();
  }
  updated.cards = [...user.cards, owned];
  state = { ...state, users: { ...state.users, [user.id]: updated } };
  save();
  return { card: chosen, owned, isDupe };
}

// --- card actions ---
function updateUser(fn: (u: UserState) => UserState) {
  const user = getCurrentUser();
  if (!user) return;
  const next = fn(user);
  state = { ...state, users: { ...state.users, [user.id]: next } };
  save();
}

export function moveCard(cardUid: string, toBinderId: string) {
  updateUser((u) => ({
    ...u,
    cards: u.cards.map((c) => (c.uid === cardUid ? { ...c, binderId: toBinderId, isNew: false } : c)),
  }));
}

export function markSeen(cardUid: string) {
  updateUser((u) => ({
    ...u,
    cards: u.cards.map((c) => (c.uid === cardUid ? { ...c, isNew: false } : c)),
  }));
}

export function toggleTrade(cardUid: string) {
  updateUser((u) => ({
    ...u,
    cards: u.cards.map((c) => (c.uid === cardUid ? { ...c, forTrade: !c.forTrade, forAdoption: false } : c)),
  }));
}

export function toggleAdoption(cardUid: string) {
  updateUser((u) => ({
    ...u,
    cards: u.cards.map((c) => (c.uid === cardUid ? { ...c, forAdoption: !c.forAdoption, forTrade: false } : c)),
  }));
}

export function removeCard(cardUid: string) {
  updateUser((u) => ({
    ...u,
    cards: u.cards.filter((c) => c.uid !== cardUid),
    profile: { ...u.profile, wall: u.profile.wall.filter((w) => w !== cardUid) },
  }));
}

export function toggleWall(cardUid: string) {
  updateUser((u) => {
    const has = u.profile.wall.includes(cardUid);
    let wall = has ? u.profile.wall.filter((w) => w !== cardUid) : [...u.profile.wall, cardUid];
    if (wall.length > 5) wall = wall.slice(0, 5);
    return { ...u, profile: { ...u.profile, wall } };
  });
}

// --- binders ---
export function addBinder(name: string, color = "pink") {
  updateUser((u) => ({ ...u, binders: [...u.binders, { id: uid("b_"), name, color }] }));
}

export function renameBinder(id: string, name: string, color?: string) {
  updateUser((u) => ({
    ...u,
    binders: u.binders.map((b) => (b.id === id ? { ...b, name, color: color || b.color } : b)),
  }));
}

export function deleteBinder(id: string) {
  updateUser((u) => {
    if (u.binders.length <= 1) return u;
    const fallback = u.binders.find((b) => b.id !== id)!.id;
    return {
      ...u,
      binders: u.binders.filter((b) => b.id !== id),
      cards: u.cards.map((c) => (c.binderId === id ? { ...c, binderId: fallback } : c)),
    };
  });
}

// --- profile ---
export function updateProfile(patch: Partial<Profile>) {
  updateUser((u) => ({ ...u, profile: { ...u.profile, ...patch } }));
}

// --- admin ---
export function tryAdminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    state = { ...state, adminUnlocked: true };
    save();
    return true;
  }
  return false;
}

export function adminLogout() {
  state = { ...state, adminUnlocked: false };
  save();
}

export function adminAddPhotocard(image: string, rarity: Rarity) {
  const card: Photocard = { id: uid("card_"), image, rarity };
  state = { ...state, admin: { ...state.admin, library: [...state.admin.library, card] } };
  save();
}

export function adminRemovePhotocard(cardId: string) {
  state = {
    ...state,
    admin: { ...state.admin, library: state.admin.library.filter((c) => c.id !== cardId) },
  };
  save();
}

export function adminBanUser(userId: string) {
  state = {
    ...state,
    admin: { ...state.admin, bannedUsers: [...state.admin.bannedUsers, userId] },
  };
  save();
}

export function getLibraryCard(cardId: string): Photocard | undefined {
  return state.admin.library.find((c) => c.id === cardId);
}

export { PASTEL_COLORS, RARITY_WEIGHTS };
