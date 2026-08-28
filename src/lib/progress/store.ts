/**
 * Local-only progress store. Backed by IndexedDB via Dexie.
 *
 * No accounts. No cloud. The user's data never leaves the device.
 *
 * CloudProgressStore can be added later by implementing the same interface.
 */
import Dexie, { type EntityTable } from 'dexie';
import type { Rating, Card as FsrsCard } from 'ts-fsrs';

export const PROGRESS_SCHEMA_VERSION = 1;

// ── Tables ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: 'singleton';
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string; // ISO yyyy-mm-dd
  dailyGoalXp: number;
  dailyGoalProgress: number; // resets daily
  totalSignsLearned: number;
  createdAt: string;
}

export interface SignMastery {
  signId: number; // PK — the mnsl.mn sign id
  state: 'new' | 'learning' | 'review' | 'mastered';
  fsrsCard: FsrsCard | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
}

export interface ReviewLog {
  id?: number; // auto-increment
  signId: number;
  rating: Rating;
  reviewedAt: string;
  prevState: SignMastery['state'];
  newState: SignMastery['state'];
}

export interface Mistake {
  signId: number;
  selectedAnswer: string;
  correctAnswer: string;
  exerciseType: string;
  at: string;
}

export interface Favorite {
  signId: number;
  addedAt: string;
}

export interface Achievement {
  id: string;
  unlockedAt: string;
}

export interface Settings {
  id: 'singleton';
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  autoplayVideos: boolean;
  showMongolianScript: boolean;
  dailyReviewGoal: number;
}

// ── Dexie database ──────────────────────────────────────────────────────

class MSLingoDB extends Dexie {
  profile!: EntityTable<UserProfile, 'id'>;
  mastery!: EntityTable<SignMastery, 'signId'>;
  reviews!: EntityTable<ReviewLog, 'id'>;
  mistakes!: EntityTable<Mistake, 'signId'>;
  favorites!: EntityTable<Favorite, 'signId'>;
  achievements!: EntityTable<Achievement, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('mslingo');
    this.version(PROGRESS_SCHEMA_VERSION).stores({
      profile: 'id',
      mastery: 'signId, state, nextReviewAt',
      reviews: '++id, signId, reviewedAt',
      mistakes: 'signId, at',
      favorites: 'signId, addedAt',
      achievements: 'id, unlockedAt',
      settings: 'id',
    });
  }
}

const db = new MSLingoDB();

// ── Default seeds ───────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  id: 'singleton',
  xp: 0,
  level: 1,
  streakDays: 0,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  dailyGoalXp: 30,
  dailyGoalProgress: 0,
  totalSignsLearned: 0,
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: Settings = {
  id: 'singleton',
  theme: 'system',
  reducedMotion: false,
  autoplayVideos: true,
  showMongolianScript: true,
  dailyReviewGoal: 20,
};

// Ensure singleton rows exist.
async function seed() {
  const p = await db.profile.get('singleton');
  if (!p) await db.profile.put(DEFAULT_PROFILE);
  const s = await db.settings.get('singleton');
  if (!s) await db.settings.put(DEFAULT_SETTINGS);
}

void seed();

// ── Store interface ─────────────────────────────────────────────────────

export interface ProgressStore {
  // Profile
  getProfile(): Promise<UserProfile>;
  updateProfile(patch: Partial<UserProfile>): Promise<UserProfile>;

  // Mastery
  getMastery(signId: number): Promise<SignMastery | undefined>;
  upsertMastery(m: SignMastery): Promise<void>;
  dueForReview(now?: Date): Promise<SignMastery[]>;
  newSigns(limit: number): Promise<number[]>;

  // Reviews
  logReview(r: Omit<ReviewLog, 'id'>): Promise<number>;

  // Mistakes
  recordMistake(m: Mistake): Promise<void>;
  getMistakes(limit?: number): Promise<Mistake[]>;

  // Favorites
  toggleFavorite(signId: number): Promise<boolean>;
  listFavorites(): Promise<number[]>;

  // Achievements
  unlockAchievement(id: string): Promise<boolean>;
  listAchievements(): Promise<Achievement[]>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  // Migrations
  migrate(fromVersion: number, toVersion: number): Promise<void>;
}

export class LocalProgressStore implements ProgressStore {
  async getProfile(): Promise<UserProfile> {
    const p = await db.profile.get('singleton');
    return p ?? DEFAULT_PROFILE;
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const next = { ...current, ...patch };
    await db.profile.put(next);
    return next;
  }

  async getMastery(signId: number): Promise<SignMastery | undefined> {
    return db.mastery.get(signId);
  }

  async upsertMastery(m: SignMastery): Promise<void> {
    await db.mastery.put(m);
  }

  async dueForReview(now: Date = new Date()): Promise<SignMastery[]> {
    const iso = now.toISOString();
    return db.mastery
      .where('nextReviewAt')
      .belowOrEqual(iso)
      .toArray();
  }

  async newSigns(limit: number): Promise<number[]> {
    const all = await db.mastery.toArray();
    const seen = new Set(all.map((m) => m.signId));
    const { signs } = await import('../../content/loader').then((m) => m.loadContent());
    return signs
      .filter((s) => !seen.has(s.id))
      .slice(0, limit)
      .map((s) => s.id);
  }

  async logReview(r: Omit<ReviewLog, 'id'>): Promise<number> {
    return (await db.reviews.add(r as ReviewLog)) as number;
  }

  async recordMistake(m: Mistake): Promise<void> {
    await db.mistakes.add(m);
  }

  async getMistakes(limit = 50): Promise<Mistake[]> {
    return db.mistakes.orderBy('at').reverse().limit(limit).toArray();
  }

  async toggleFavorite(signId: number): Promise<boolean> {
    const existing = await db.favorites.get(signId);
    if (existing) {
      await db.favorites.delete(signId);
      return false;
    }
    await db.favorites.put({ signId, addedAt: new Date().toISOString() });
    return true;
  }

  async listFavorites(): Promise<number[]> {
    const favs = await db.favorites.toArray();
    return favs.map((f) => f.signId);
  }

  async unlockAchievement(id: string): Promise<boolean> {
    const existing = await db.achievements.get(id);
    if (existing) return false;
    await db.achievements.put({ id, unlockedAt: new Date().toISOString() });
    return true;
  }

  async listAchievements(): Promise<Achievement[]> {
    return db.achievements.toArray();
  }

  async getSettings(): Promise<Settings> {
    const s = await db.settings.get('singleton');
    return s ?? DEFAULT_SETTINGS;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const next = { ...current, ...patch };
    await db.settings.put(next);
    return next;
  }

  async migrate(fromVersion: number, toVersion: number): Promise<void> {
    // Future schema migrations. Currently a no-op (v1 is initial).
    void fromVersion;
    void toVersion;
  }
}

export const progress: ProgressStore = new LocalProgressStore();

// Re-export the pure XP helper so callers can still import from here
export { xpToLevel } from '../xp';
