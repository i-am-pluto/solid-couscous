import { useGameStore } from '../store/gameStore'
import { WORLDS } from '../game/data/worlds'
import { BOSSES, getBossesByWorld } from '../game/data/bosses'
import { World, Boss } from '../types'

export function WorldMap() {
  const { player, startBattle, setMode, selectedWorld, selectWorld, setNotification } = useGameStore()

  const handleWorldClick = (world: World) => {
    if (!player.unlockedWorlds.includes(world.id)) {
      const prevWorld = WORLDS.find(w => w.order === world.order - 1)
      setNotification(`🔒 Defeat all bosses in ${prevWorld?.name || 'previous world'} to unlock!`, 'warning')
      return
    }
    selectWorld(world)
  }

  const handleBossClick = (world: World, boss: Boss) => {
    if (!player.unlockedWorlds.includes(world.id)) return
    const prevBosses = BOSSES.filter(b => b.worldId === world.id && b.order < boss.order)
    const allPrevDefeated = prevBosses.every(b => player.defeatedBosses.includes(b.id))
    if (!allPrevDefeated) {
      setNotification(`⚔ Defeat the previous boss first!`, 'warning')
      return
    }
    startBattle(world, boss)
  }

  const getWorldProgress = (world: World): number => {
    const worldBosses = getBossesByWorld(world.id)
    const defeated = worldBosses.filter(b => player.defeatedBosses.includes(b.id))
    return worldBosses.length > 0 ? defeated.length / worldBosses.length : 0
  }

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #050010 0%, #0a0020 100%)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(0,245,255,0.2)' }}>
        <button
          onClick={() => setMode('menu')}
          className="font-game text-xs text-gray-400 hover:text-white transition-colors"
        >
          ← BACK
        </button>
        <h1 className="font-game text-sm text-cyan-300"
          style={{ textShadow: '0 0 10px #00f5ff' }}>
          ⚔ WORLD MAP
        </h1>
        <div className="font-game text-xs text-yellow-400">
          LVL {player.level}
        </div>
      </div>

      {/* World grid */}
      <div className="px-4 py-6 grid grid-cols-1 gap-6 max-w-4xl mx-auto">
        {WORLDS.map(world => {
          const isUnlocked = player.unlockedWorlds.includes(world.id)
          const progress = getWorldProgress(world)
          const isSelected = selectedWorld?.id === world.id
          const worldBosses = getBossesByWorld(world.id)

          return (
            <div
              key={world.id}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer
                ${isUnlocked ? 'hover:scale-[1.01]' : 'opacity-50 grayscale cursor-not-allowed'}`}
              style={{
                background: `linear-gradient(135deg, ${world.backgroundColor} 0%, ${world.platformColor}33 100%)`,
                border: `2px solid ${isSelected ? world.accentColor : isUnlocked ? world.accentColor + '44' : '#333'}`,
                boxShadow: isSelected ? `0 0 30px ${world.accentColor}66` : 'none',
              }}
              onClick={() => handleWorldClick(world)}
            >
              {/* World header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{world.emoji}</span>
                    <div>
                      <h2 className="font-game text-sm text-white">{world.name}</h2>
                      <p className="font-game text-xs mt-0.5" style={{ color: world.accentColor }}>
                        {world.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {!isUnlocked ? (
                      <span className="text-2xl">🔒</span>
                    ) : progress >= 1 ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="font-game text-xs text-gray-300">
                        {Math.round(progress * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {isUnlocked && (
                  <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress * 100}%`,
                        background: `linear-gradient(90deg, ${world.accentColor}, ${world.accentColor}88)`,
                        boxShadow: `0 0 8px ${world.accentColor}`,
                      }}
                    />
                  </div>
                )}

                <p className="mt-2 font-game text-xs text-gray-400 leading-relaxed">
                  {world.description}
                </p>
              </div>

              {/* Boss list */}
              {isUnlocked && (
                <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                  {worldBosses.map(boss => {
                    const isDefeated = player.defeatedBosses.includes(boss.id)
                    const prevBosses = worldBosses.filter(b => b.order < boss.order)
                    const canFight = prevBosses.every(b => player.defeatedBosses.includes(b.id))

                    return (
                      <button
                        key={boss.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBossClick(world, boss)
                        }}
                        disabled={!canFight}
                        className={`relative rounded-lg p-2.5 text-left transition-all duration-200
                          ${isDefeated
                            ? 'opacity-60'
                            : canFight
                              ? 'hover:scale-105 active:scale-95 cursor-pointer'
                              : 'opacity-30 cursor-not-allowed'
                          }`}
                        style={{
                          background: isDefeated
                            ? 'rgba(0,100,0,0.3)'
                            : canFight
                              ? `rgba(0,0,0,0.5)`
                              : 'rgba(0,0,0,0.3)',
                          border: `1px solid ${isDefeated ? '#00ff44' : canFight ? boss.color : '#333'}`,
                          boxShadow: canFight && !isDefeated ? `0 0 10px ${boss.color}44` : 'none',
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="font-game text-xs text-white leading-tight">
                              {boss.name}
                            </div>
                            <div className="font-game text-xs mt-0.5 leading-tight" style={{ color: boss.color, fontSize: '8px' }}>
                              {boss.title}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isDefeated ? (
                              <span className="text-green-400 text-sm">✓</span>
                            ) : canFight ? (
                              <span className="text-red-400 text-sm">⚔</span>
                            ) : (
                              <span className="text-gray-500 text-sm">🔒</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-0.5">
                          {boss.requiredGear.slice(0, 3).map(gearId => {
                            const hasGear = player.inventory.some(g => g.id === gearId && g.unlocked)
                            return (
                              <div
                                key={gearId}
                                className={`w-3 h-3 rounded-sm text-xs flex items-center justify-center`}
                                style={{ background: hasGear ? '#00ff4444' : '#ff000022', fontSize: '8px' }}
                                title={gearId}
                              >
                                {hasGear ? '✓' : '✗'}
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-1 font-game text-gray-500" style={{ fontSize: '8px' }}>
                          {boss.hp.toLocaleString()} HP · +{boss.xpReward} XP
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Lock overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔒</div>
                    <p className="font-game text-xs text-gray-400">
                      Level {world.minPlayerLevel} required
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
