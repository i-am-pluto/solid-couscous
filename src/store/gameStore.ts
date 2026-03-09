import { create } from 'zustand'
import { GameMode, PlayerState, GearItem, World, Boss, Question, BattleState } from '../types'
import { GEAR_ITEMS } from '../game/data/gear'
import { WORLDS } from '../game/data/worlds'
import { savePlayerLocal, loadPlayerLocal, savePlayerToCloud, getUsername } from '../lib/supabase'

const LEVEL_XP = (level: number) => level * 100 + level * level * 20

const DEFAULT_PLAYER: PlayerState = {
  hp: 150,
  maxHp: 150,
  level: 1,
  xp: 0,
  xpToNext: LEVEL_XP(1),
  gold: 0,
  inventory: [],
  equippedGear: {},
  solvedQuestions: [],
  defeatedBosses: [],
  unlockedWorlds: ['forest'],
  streak: 0,
  totalAttack: 10,
  totalDefense: 0,
  lives: 3,
}

interface GameStore {
  // State
  mode: GameMode
  player: PlayerState
  selectedWorld: World | null
  selectedBoss: Boss | null
  battleState: BattleState | null
  currentQuestion: Question | null
  pendingGearUnlock: GearItem | null
  username: string
  showInventory: boolean
  notification: { text: string; type: 'success' | 'error' | 'info' | 'warning' } | null
  questionTimer: number
  answerResult: 'correct' | 'wrong' | null
  streakBonus: number

  // Actions
  setMode: (mode: GameMode) => void
  selectWorld: (world: World) => void
  selectBoss: (boss: Boss) => void
  startBattle: (world: World, boss: Boss) => void
  showQuestion: (question: Question, gear: GearItem) => void
  answerQuestion: (answer: 'a' | 'b' | 'c' | 'd') => void
  dismissQuestion: () => void
  equipGear: (gear: GearItem) => void
  defeatBoss: (boss: Boss, xpReward: number) => void
  takeDamage: (amount: number) => void
  restoreHP: (amount: number) => void
  updateBattleState: (state: Partial<BattleState>) => void
  setUsername: (name: string) => void
  setNotification: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void
  clearNotification: () => void
  setQuestionTimer: (t: number) => void
  setAnswerResult: (r: 'correct' | 'wrong' | null) => void
  toggleInventory: () => void
  resetBattle: () => void
}

const computeTotals = (player: PlayerState): { totalAttack: number; totalDefense: number } => {
  let attack = 10 + player.level * 2
  let defense = 0
  Object.values(player.equippedGear).forEach(g => {
    if (g) {
      attack += g.attackBonus
      defense += g.defenseBonus
    }
  })
  return { totalAttack: attack, totalDefense: defense }
}

export const useGameStore = create<GameStore>((set, get) => {
  // Load persisted state
  const saved = loadPlayerLocal()
  const savedGear = saved?.inventory || []
  const knownIds = new Set(savedGear.map((g: GearItem) => g.id))
  const inventory = GEAR_ITEMS.filter(g => knownIds.has(g.id)).map(g => ({ ...g, unlocked: true }))
  const equippedGear = saved?.equippedGear || {}
  const restoredPlayer: PlayerState = {
    ...DEFAULT_PLAYER,
    ...saved,
    inventory,
    equippedGear,
  }
  const totals = computeTotals(restoredPlayer)

  return {
    mode: 'menu',
    player: { ...restoredPlayer, ...totals },
    selectedWorld: null,
    selectedBoss: null,
    battleState: null,
    currentQuestion: null,
    pendingGearUnlock: null,
    username: getUsername(),
    showInventory: false,
    notification: null,
    questionTimer: 60,
    answerResult: null,
    streakBonus: 0,

    setMode: (mode) => set({ mode }),

    selectWorld: (world) => set({ selectedWorld: world, mode: 'worldmap' }),

    selectBoss: (boss) => set({ selectedBoss: boss }),

    startBattle: (world, boss) => {
      const { player } = get()
      set({
        selectedWorld: world,
        selectedBoss: boss,
        mode: 'battle',
        battleState: {
          playerHP: player.hp,
          playerMaxHP: player.maxHp,
          bossHP: boss.hp,
          bossMaxHP: boss.hp,
          bossPhase: 1,
          score: 0,
          combo: 0,
          timeElapsed: 0,
          isPlayerAttacking: false,
          isBossAttacking: false,
          gearNeeded: null,
          activeEffects: [],
        },
      })
    },

    showQuestion: (question, gear) => set({
      currentQuestion: question,
      pendingGearUnlock: gear,
      mode: 'question',
      questionTimer: question.timeLimit,
      answerResult: null,
    }),

    answerQuestion: (answer) => {
      const { currentQuestion, pendingGearUnlock, player } = get()
      if (!currentQuestion || !pendingGearUnlock) return

      const correct = answer === currentQuestion.correctAnswer

      if (correct) {
        const newGear = { ...pendingGearUnlock, unlocked: true }
        const existingIds = new Set(player.inventory.map(g => g.id))
        const newInventory = existingIds.has(newGear.id)
          ? player.inventory
          : [...player.inventory, newGear]

        const xpGain = { easy: 30, medium: 60, hard: 100, extreme: 200 }[currentQuestion.difficulty]
        const newXp = player.xp + xpGain
        const newStreak = player.streak + 1
        const newSolved = player.solvedQuestions.includes(currentQuestion.id)
          ? player.solvedQuestions
          : [...player.solvedQuestions, currentQuestion.id]

        let { level, xpToNext } = player
        let remainingXp = newXp
        while (remainingXp >= xpToNext) {
          remainingXp -= xpToNext
          level++
          xpToNext = LEVEL_XP(level)
        }

        const updatedPlayer: PlayerState = {
          ...player,
          inventory: newInventory,
          solvedQuestions: newSolved,
          xp: remainingXp,
          xpToNext,
          level,
          streak: newStreak,
        }
        const totals = computeTotals(updatedPlayer)
        const finalPlayer = { ...updatedPlayer, ...totals }

        set({ answerResult: 'correct', player: finalPlayer, streakBonus: newStreak })
        savePlayerLocal(finalPlayer)
        savePlayerToCloud(finalPlayer, get().username)

        setTimeout(() => {
          set({ mode: 'battle', currentQuestion: null, pendingGearUnlock: null, answerResult: null })
        }, 2500)
      } else {
        const dmgPenalty = { easy: 10, medium: 20, hard: 35, extreme: 50 }[currentQuestion.difficulty]
        const newHP = Math.max(1, player.hp - dmgPenalty)
        const newStreak = 0
        const updatedPlayer = { ...player, hp: newHP, streak: newStreak }
        set({ answerResult: 'wrong', player: updatedPlayer, streakBonus: 0 })
        savePlayerLocal(updatedPlayer)

        setTimeout(() => {
          set({ mode: 'battle', currentQuestion: null, pendingGearUnlock: null, answerResult: null })
        }, 2500)
      }
    },

    dismissQuestion: () => set({
      currentQuestion: null,
      pendingGearUnlock: null,
      mode: 'battle',
    }),

    equipGear: (gear) => {
      const { player } = get()
      const newEquipped = { ...player.equippedGear, [gear.slot]: gear }
      const updatedPlayer = { ...player, equippedGear: newEquipped }
      const totals = computeTotals(updatedPlayer)
      const finalPlayer = { ...updatedPlayer, ...totals }
      set({ player: finalPlayer })
      savePlayerLocal(finalPlayer)
    },

    defeatBoss: (boss, xpReward) => {
      const { player } = get()
      const newDefeated = [...new Set([...player.defeatedBosses, boss.id])]

      // Unlock next world
      const currentWorld = WORLDS.find(w => w.id === boss.worldId)
      const nextWorld = currentWorld ? WORLDS.find(w => w.order === currentWorld.order + 1) : null
      const newUnlocked = nextWorld && !player.unlockedWorlds.includes(nextWorld.id)
        ? [...player.unlockedWorlds, nextWorld.id]
        : player.unlockedWorlds

      const goldGain = boss.order * 50
      const newXp = player.xp + xpReward
      let { level, xpToNext } = player
      let remainingXp = newXp
      while (remainingXp >= xpToNext) {
        remainingXp -= xpToNext
        level++
        xpToNext = LEVEL_XP(level)
      }

      const updatedPlayer: PlayerState = {
        ...player,
        defeatedBosses: newDefeated,
        unlockedWorlds: newUnlocked,
        xp: remainingXp,
        xpToNext,
        level,
        gold: player.gold + goldGain,
        hp: Math.min(player.maxHp, player.hp + 50),
      }
      set({ player: updatedPlayer, mode: 'victory' })
      savePlayerLocal(updatedPlayer)
      savePlayerToCloud(updatedPlayer, get().username)
    },

    takeDamage: (amount) => {
      const { player, battleState } = get()
      const reducedDamage = Math.max(1, amount - Math.floor(player.totalDefense * 0.3))
      const newHP = Math.max(0, player.hp - reducedDamage)
      const updatedPlayer = { ...player, hp: newHP }
      const updatedBattle = battleState
        ? { ...battleState, playerHP: newHP }
        : null
      set({ player: updatedPlayer, battleState: updatedBattle })
      if (newHP <= 0) {
        const lives = player.lives - 1
        if (lives <= 0) {
          set({ mode: 'gameover', player: { ...updatedPlayer, lives: 0 } })
        } else {
          set({
            player: { ...updatedPlayer, lives, hp: Math.floor(player.maxHp * 0.5) },
            mode: 'gameover',
          })
        }
      }
    },

    restoreHP: (amount) => {
      const { player } = get()
      const newHP = Math.min(player.maxHp, player.hp + amount)
      set({ player: { ...player, hp: newHP } })
    },

    updateBattleState: (state) => {
      const { battleState } = get()
      if (battleState) set({ battleState: { ...battleState, ...state } })
    },

    setUsername: (name) => {
      set({ username: name })
      localStorage.setItem('lc_fighter_username', name)
    },

    setNotification: (text, type) => {
      set({ notification: { text, type } })
      setTimeout(() => set({ notification: null }), 3000)
    },

    clearNotification: () => set({ notification: null }),

    setQuestionTimer: (t) => set({ questionTimer: t }),

    setAnswerResult: (r) => set({ answerResult: r }),

    toggleInventory: () => set(s => ({ showInventory: !s.showInventory })),

    resetBattle: () => {
      const { player } = get()
      set({
        player: { ...player, hp: player.maxHp, lives: 3 },
        battleState: null,
        mode: 'worldmap',
      })
    },
  }
})
