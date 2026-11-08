import { type Session, streak, longestStreak, GOALS } from "@/lib/speakcoach";

export type LevelInfo = {
  level: number;
  title: string;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

export const LEVELS: { level: number; title: string; minXp: number; maxXp: number }[] = [
  { level: 1, title: "Beginner Speaker", minXp: 0, maxXp: 200 },
  { level: 2, title: "Novice Speaker", minXp: 200, maxXp: 500 },
  { level: 3, title: "Developing Voice", minXp: 500, maxXp: 1000 },
  { level: 4, title: "Intermediate Orator", minXp: 1000, maxXp: 2000 },
  { level: 5, title: "Advanced Communicator", minXp: 2000, maxXp: 3500 },
  { level: 6, title: "Expert Speaker", minXp: 3500, maxXp: 5000 },
  { level: 7, title: "Master Speaker", minXp: 5000, maxXp: 10000 },
];

export function calculateSessionXP(session: Session): number {
  let xp = 50; // Base completion
  if (session.analysis.overall >= 80) xp += 25;
  if (session.analysis.overall >= 90) xp += 50;
  if (session.analysis.fillerCount === 0) xp += 30;
  if (session.scenarioId?.startsWith("custom-")) xp += 20;
  return xp;
}

export function totalXP(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + calculateSessionXP(s), 0);
}

export function xpLevel(totalXp: number): LevelInfo {
  const current = LEVELS.find((l) => totalXp >= l.minXp && totalXp < l.maxXp) || LEVELS[LEVELS.length - 1];
  const span = current.maxXp - current.minXp;
  const inLevel = Math.max(0, totalXp - current.minXp);
  const progressPercent = Math.min(100, Math.round((inLevel / span) * 100));

  return {
    level: current.level,
    title: current.title,
    currentXp: totalXp,
    nextLevelXp: current.maxXp,
    progressPercent,
  };
}

export type Badge = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  check: (sessions: Session[]) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: "first-take",
    title: "First Take",
    emoji: "🎤",
    description: "Complete your very first speaking session.",
    check: (sessions) => sessions.length >= 1,
  },
  {
    id: "on-fire",
    title: "On Fire",
    emoji: "🔥",
    description: "Maintain a 5-day speaking practice streak.",
    check: (sessions) => streak(sessions) >= 5 || longestStreak(sessions) >= 5,
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    emoji: "⚡",
    description: "Complete practice sessions on 7 consecutive days.",
    check: (sessions) => streak(sessions) >= 7 || longestStreak(sessions) >= 7,
  },
  {
    id: "diamond-tongue",
    title: "Diamond Tongue",
    emoji: "💎",
    description: "Deliver a stellar performance scoring 90+ overall.",
    check: (sessions) => sessions.some((s) => s.analysis.overall >= 90),
  },
  {
    id: "filler-free",
    title: "Filler-Free",
    emoji: "🚫",
    description: "Complete an answer with exactly zero filler words.",
    check: (sessions) => sessions.some((s) => s.analysis.fillerCount === 0),
  },
  {
    id: "sharpshooter",
    title: "Sharpshooter",
    emoji: "🎯",
    description: "Score 80+ across 5 distinct scenarios.",
    check: (sessions) => {
      const distinctScenarios = new Set(
        sessions.filter((s) => s.analysis.overall >= 80).map((s) => s.scenarioId)
      );
      return distinctScenarios.size >= 5;
    },
  },
  {
    id: "polyglot",
    title: "Versatile Orator",
    emoji: "📚",
    description: "Practice at least one scenario across all 5 goal categories.",
    check: (sessions) => {
      const goals = new Set(sessions.map((s) => s.goal));
      return GOALS.every((g) => goals.has(g.id));
    },
  },
  {
    id: "century-club",
    title: "Century Club",
    emoji: "🏆",
    description: "Amass 1,000 XP in your speaking journey.",
    check: (sessions) => totalXP(sessions) >= 1000,
  },
  {
    id: "pro-speaker",
    title: "Master Speaker",
    emoji: "👑",
    description: "Amass 5,000 XP through sustained deliberate practice.",
    check: (sessions) => totalXP(sessions) >= 5000,
  },
];

export function earnedBadges(sessions: Session[]): Badge[] {
  return BADGES.filter((b) => b.check(sessions));
}

export type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  check: (todaySessions: Session[]) => boolean;
};

const DAILY_CHALLENGES: Omit<DailyChallenge, "id">[] = [
  {
    title: "Clarity Champion",
    description: "Score 75+ overall on any scenario today.",
    xpReward: 100,
    check: (sessions) => sessions.some((s) => s.analysis.overall >= 75),
  },
  {
    title: "Pacing Precision",
    description: "Maintain an ideal pace score (80+) on a practice drill today.",
    xpReward: 100,
    check: (sessions) => sessions.some((s) => (s.analysis.metrics.find((m) => m.id === "pace")?.score ?? 0) >= 80),
  },
  {
    title: "Minimal Clutter",
    description: "Complete any session with 2 or fewer filler words.",
    xpReward: 100,
    check: (sessions) => sessions.some((s) => s.analysis.fillerCount <= 2),
  },
  {
    title: "Double Down",
    description: "Complete at least 2 practice sessions today.",
    xpReward: 100,
    check: (sessions) => sessions.length >= 2,
  },
  {
    title: "Interview Ready",
    description: "Complete an interview prep scenario today.",
    xpReward: 100,
    check: (sessions) => sessions.some((s) => s.goal === "interview"),
  },
  {
    title: "Presentation Power",
    description: "Complete a presentation or pitch drill today.",
    xpReward: 100,
    check: (sessions) => sessions.some((s) => s.goal === "presentation" || s.goal === "sales"),
  },
  {
    title: "Endurance Speaker",
    description: "Deliver an answer lasting over 60 seconds.",
    xpReward: 100,
    check: (sessions) => sessions.some((s) => s.durationSec >= 60),
  },
];

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const dayIndex = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const challenge = DAILY_CHALLENGES[Math.abs(dayIndex) % DAILY_CHALLENGES.length];
  const dateStr = date.toISOString().split("T")[0];
  return {
    ...challenge,
    id: `challenge-${dateStr}`,
  };
}

export function isChallengeCompleted(challenge: DailyChallenge, sessions: Session[]): boolean {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter((s) => s.createdAt >= startOfDay.getTime());
  return challenge.check(todaySessions);
}
