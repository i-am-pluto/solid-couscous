import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { MainMenu } from './components/MainMenu'
import { WorldMap } from './components/WorldMap'
import { QuestionModal } from './components/QuestionModal'
import { GearInventory } from './components/GearInventory'
import { BattleHUD } from './components/BattleHUD'
import { VictoryScreen } from './components/VictoryScreen'
import { GameOver } from './components/GameOver'
import { Notification } from './components/Notification'
import { PhaserGame } from './game/PhaserGame'
import { eventBus, EVENTS } from './game/EventBus'
import { Boss, GearItem } from './types'
import { getQuestionByGearReward, QUESTIONS } from './lib/questions'

export default function App() {
  const {
    mode,
    showInventory,
    defeatBoss,
    takeDamage,
    showQuestion,
    setNotification,
    pendingGearUnlock,
    player,
  } = useGameStore()

  useEffect(() => {
    const handleBossDefeated = (data: unknown) => {
      const { boss, xpReward } = data as { boss: Boss; xpReward: number }
      defeatBoss(boss, xpReward)
      setNotification(`🏆 ${boss.name} defeated! +${xpReward} XP`, 'success')
    }

    const handlePlayerDamaged = (data: unknown) => {
      const { amount, fatal } = data as { amount: number; fatal?: boolean }
      if (!fatal) {
        takeDamage(amount)
      }
    }

    const handleGearNeeded = (data: unknown) => {
      const { gear } = data as { gear: GearItem }
      const question = getQuestionByGearReward(gear.id)
        || QUESTIONS.find(q => q.category === gear.category)

      if (question) {
        showQuestion(question, gear)
      } else {
        setNotification(`⚠ No question found for ${gear.name}!`, 'warning')
      }
    }

    eventBus.on(EVENTS.BOSS_DEFEATED, handleBossDefeated)
    eventBus.on(EVENTS.PLAYER_DAMAGED, handlePlayerDamaged)
    eventBus.on(EVENTS.GEAR_NEEDED, handleGearNeeded)

    return () => {
      eventBus.off(EVENTS.BOSS_DEFEATED, handleBossDefeated)
      eventBus.off(EVENTS.PLAYER_DAMAGED, handlePlayerDamaged)
      eventBus.off(EVENTS.GEAR_NEEDED, handleGearNeeded)
    }
  }, [])

  // Handle question answered → auto-equip gear
  useEffect(() => {
    if (mode === 'battle' && !pendingGearUnlock) {
      // Question was just answered, check for newly unlocked gear
      const newestGear = player.inventory[player.inventory.length - 1]
      if (newestGear) {
        const equippedSlot = player.equippedGear[newestGear.slot]
        if (!equippedSlot) {
          useGameStore.getState().equipGear(newestGear)
          eventBus.emit(EVENTS.GEAR_EQUIPPED, newestGear)
          eventBus.emit(EVENTS.RESUME_BATTLE)
        } else {
          eventBus.emit(EVENTS.RESUME_BATTLE)
        }
      }
    }
  }, [mode, pendingGearUnlock])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Phaser game — only rendered during battle */}
      {mode === 'battle' && (
        <PhaserGame
          onBossDefeated={(boss, xp) => defeatBoss(boss, xp)}
          onPlayerDamaged={(amount, fatal) => { if (!fatal) takeDamage(amount) }}
          onGearNeeded={(gear) => {
            const question = getQuestionByGearReward(gear.id)
              || QUESTIONS.find(q => q.category === gear.category)
            if (question) showQuestion(question, gear)
          }}
        />
      )}

      {/* React UI layer */}
      {mode === 'menu' && <MainMenu />}
      {mode === 'worldmap' && <WorldMap />}
      {mode === 'battle' && <BattleHUD />}
      {mode === 'victory' && <VictoryScreen />}
      {mode === 'gameover' && <GameOver />}

      {/* Overlays (can appear over battle) */}
      {mode === 'question' && <QuestionModal />}
      {showInventory && <GearInventory />}
      <Notification />
    </div>
  )
}
