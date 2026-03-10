import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { BattleScene } from './scenes/BattleScene'
import { useGameStore } from '../store/gameStore'
import { eventBus, EVENTS } from './EventBus'
import { GearItem, Boss } from '../types'

interface PhaserGameProps {
  onBossDefeated: (boss: Boss, xp: number) => void
  onPlayerDamaged: (amount: number, fatal: boolean) => void
  onGearNeeded: (gear: GearItem) => void
}

export function PhaserGame({ onBossDefeated, onPlayerDamaged, onGearNeeded }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { selectedBoss, selectedWorld, player } = useGameStore()

  useEffect(() => {
    if (!containerRef.current || !selectedBoss || !selectedWorld) return

    // Cleanup old game instance
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }

    const w = window.innerWidth
    const h = window.innerHeight

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: w,
      height: h,
      parent: containerRef.current,
      backgroundColor: selectedWorld.backgroundColor,
      // BootScene is listed first so Phaser auto-starts it (idle).
      // BattleScene is started manually below with boss data.
      scene: [BootScene, BattleScene],
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      fps: { target: 60, forceSetTimeOut: true },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: w,
        height: h,
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    // Collect all unlocked gear (equipped + inventory)
    const equippedValues = Object.values(player.equippedGear).filter(Boolean) as GearItem[]
    const inventoryUnlocked = player.inventory.filter(g => g.unlocked)
    const allGear = [...new Map([...equippedValues, ...inventoryUnlocked].map(g => [g.id, g])).values()]

    const battleData = {
      boss: selectedBoss,
      world: selectedWorld,
      playerHP: player.hp,
      playerMaxHP: player.maxHp,
      gear: allGear,
    }

    // Wait for Phaser to finish booting, then start BattleScene with data
    game.events.once(Phaser.Core.Events.READY, () => {
      game.scene.start('BattleScene', battleData)
    })

    // Event listeners
    const handleBossDefeated = (data: unknown) => {
      const { boss, xpReward } = data as { boss: Boss; xpReward: number }
      onBossDefeated(boss, xpReward)
    }
    const handlePlayerDamaged = (data: unknown) => {
      const { amount, fatal } = data as { amount: number; fatal?: boolean }
      onPlayerDamaged(amount, !!fatal)
    }
    const handleGearNeeded = (data: unknown) => {
      const { gear } = data as { gear: GearItem }
      onGearNeeded(gear)
    }

    eventBus.on(EVENTS.BOSS_DEFEATED, handleBossDefeated)
    eventBus.on(EVENTS.PLAYER_DAMAGED, handlePlayerDamaged)
    eventBus.on(EVENTS.GEAR_NEEDED, handleGearNeeded)

    return () => {
      eventBus.off(EVENTS.BOSS_DEFEATED, handleBossDefeated)
      eventBus.off(EVENTS.PLAYER_DAMAGED, handlePlayerDamaged)
      eventBus.off(EVENTS.GEAR_NEEDED, handleGearNeeded)
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [selectedBoss?.id, selectedWorld?.id])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
