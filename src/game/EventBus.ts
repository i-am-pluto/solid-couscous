// Simple event bus for Phaser <-> React communication
type Handler = (...args: unknown[]) => void

class EventBus {
  private listeners: Map<string, Handler[]> = new Map()

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(handler)
  }

  off(event: string, handler: Handler) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      this.listeners.set(event, handlers.filter(h => h !== handler))
    }
  }

  emit(event: string, ...args: unknown[]) {
    const handlers = this.listeners.get(event) || []
    handlers.forEach(h => h(...args))
  }
}

export const eventBus = new EventBus()

// Event names used in game
export const EVENTS = {
  // Phaser → React
  GEAR_NEEDED: 'gear_needed',        // { gear: GearItem, question: Question }
  BOSS_DEFEATED: 'boss_defeated',    // { boss: Boss, xpReward: number }
  PLAYER_DAMAGED: 'player_damaged',  // { amount: number }
  BOSS_DAMAGED: 'boss_damaged',      // { amount: number, bossHp: number }
  BOSS_PHASE_CHANGE: 'boss_phase',   // { phase: 1|2|3 }
  COMBO_UPDATE: 'combo_update',      // { combo: number }
  SCORE_UPDATE: 'score_update',      // { score: number }

  // React → Phaser
  GEAR_EQUIPPED: 'gear_equipped',    // { gear: GearItem }
  RESUME_BATTLE: 'resume_battle',
  PLAYER_DIED: 'player_died',
}
