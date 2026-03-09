import { createClient } from '@supabase/supabase-js'
import { PlayerState, LeaderboardEntry } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const PLAYER_KEY = 'lc_fighter_player'
const USERNAME_KEY = 'lc_fighter_username'

// Local storage fallback (works without Supabase configured)
export const savePlayerLocal = (state: Partial<PlayerState>) => {
  try {
    const existing = loadPlayerLocal()
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ ...existing, ...state }))
  } catch (e) {
    console.warn('Could not save to localStorage', e)
  }
}

export const loadPlayerLocal = (): Partial<PlayerState> | null => {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const getUsername = (): string => {
  return localStorage.getItem(USERNAME_KEY) || 'Warrior'
}

export const setUsername = (name: string) => {
  localStorage.setItem(USERNAME_KEY, name)
}

// Supabase operations (graceful fail if not configured)
export const savePlayerToCloud = async (state: PlayerState, username: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL) return

  try {
    await supabase.from('players').upsert({
      username,
      level: state.level,
      xp: state.xp,
      defeated_bosses: state.defeatedBosses,
      solved_questions: state.solvedQuestions,
      unlocked_worlds: state.unlockedWorlds,
      streak: state.streak,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'username' })
  } catch (e) {
    console.warn('Cloud save failed, using local storage', e)
  }
}

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  if (!import.meta.env.VITE_SUPABASE_URL) return []

  try {
    const { data } = await supabase
      .from('players')
      .select('username, level, defeated_bosses, solved_questions, streak')
      .order('level', { ascending: false })
      .limit(20)

    return (data || []).map(r => ({
      username: r.username,
      level: r.level,
      defeatedBosses: r.defeated_bosses?.length || 0,
      solvedQuestions: r.solved_questions?.length || 0,
      totalScore: r.level * 100 + (r.defeated_bosses?.length || 0) * 500,
      streak: r.streak || 0,
    }))
  } catch {
    return []
  }
}

// SQL to create tables (run in Supabase dashboard):
/*
CREATE TABLE players (
  username TEXT PRIMARY KEY,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  defeated_bosses TEXT[] DEFAULT '{}',
  solved_questions TEXT[] DEFAULT '{}',
  unlocked_worlds TEXT[] DEFAULT '{"forest"}',
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
*/
