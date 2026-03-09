export type GameMode = 'menu' | 'worldmap' | 'battle' | 'question' | 'victory' | 'gameover' | 'inventory'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'

export type GearSlot = 'weapon' | 'offhand' | 'armor' | 'boots' | 'helm' | 'special'

export type QuestionCategory =
  | 'arrays'
  | 'strings'
  | 'hashmaps'
  | 'twopointers'
  | 'slidingwindow'
  | 'binarysearch'
  | 'linkedlist'
  | 'trees'
  | 'graphs'
  | 'dp'
  | 'backtracking'
  | 'heaps'
  | 'tries'
  | 'greedy'
  | 'bitmanipulation'

export interface GearItem {
  id: string
  name: string
  emoji: string
  slot: GearSlot
  category: QuestionCategory
  difficulty: Difficulty
  attackBonus: number
  defenseBonus: number
  speedBonus: number
  specialAbility?: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  worldRequired: number
  unlocked: boolean
  color: string
}

export interface Question {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  category: QuestionCategory
  gearReward: string  // GearItem id
  timeLimit: number   // seconds
  choices: {
    a: string
    b: string
    c: string
    d: string
  }
  correctAnswer: 'a' | 'b' | 'c' | 'd'
  explanation: string
  leetcodeUrl?: string
}

export interface BossAttackPattern {
  type: 'projectile' | 'charge' | 'slam' | 'laser' | 'summon' | 'teleport'
  damage: number
  cooldown: number
  speed: number
  color: string
  width?: number
  height?: number
}

export interface Boss {
  id: string
  name: string
  title: string
  hp: number
  phase2HP: number  // % threshold
  phase3HP: number  // % threshold
  baseSpeed: number
  attackDamage: number
  defenseRating: number
  color: string
  eyeColor: string
  size: number
  requiredGear: string[]  // gear ids needed to deal full damage
  attackPatterns: BossAttackPattern[]
  worldId: string
  order: number
  xpReward: number
  description: string
  weakGear: string[]  // gear that does 2x damage
  dropGear?: string   // rare gear dropped on defeat
}

export interface World {
  id: string
  name: string
  subtitle: string
  order: number
  backgroundColor: string
  platformColor: string
  accentColor: string
  skyGradient: [string, string]
  bosses: string[]  // boss ids
  minPlayerLevel: number
  description: string
  emoji: string
  unlocked: boolean
  theme: 'forest' | 'desert' | 'ice' | 'lava' | 'sky' | 'cyber' | 'void'
}

export interface PlayerState {
  hp: number
  maxHp: number
  level: number
  xp: number
  xpToNext: number
  gold: number
  inventory: GearItem[]
  equippedGear: Partial<Record<GearSlot, GearItem>>
  solvedQuestions: string[]
  defeatedBosses: string[]
  unlockedWorlds: string[]
  streak: number
  totalAttack: number
  totalDefense: number
  lives: number
}

export interface BattleState {
  playerHP: number
  playerMaxHP: number
  bossHP: number
  bossMaxHP: number
  bossPhase: 1 | 2 | 3
  score: number
  combo: number
  timeElapsed: number
  isPlayerAttacking: boolean
  isBossAttacking: boolean
  gearNeeded: GearItem | null
  activeEffects: string[]
}

export interface LeaderboardEntry {
  username: string
  level: number
  defeatedBosses: number
  solvedQuestions: number
  totalScore: number
  streak: number
}
