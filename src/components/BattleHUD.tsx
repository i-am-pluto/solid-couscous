import { useGameStore } from '../store/gameStore'
import { eventBus, EVENTS } from '../game/EventBus'
import { GearItem } from '../types'

export function BattleHUD() {
  const {
    battleState,
    player,
    selectedBoss,
    selectedWorld,
    setMode,
    toggleInventory,
  } = useGameStore()

  if (!battleState || !selectedBoss || !selectedWorld) return null

  const handleEquipAndResume = (gear: GearItem) => {
    eventBus.emit(EVENTS.GEAR_EQUIPPED, gear)
    eventBus.emit(EVENTS.RESUME_BATTLE)
  }

  const handleFlee = () => {
    eventBus.emit(EVENTS.RESUME_BATTLE)
    setMode('worldmap')
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top-left: Player name + lives */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="font-game text-xs text-cyan-300" style={{ textShadow: '0 0 6px #00f5ff' }}>
          {useGameStore.getState().username}
        </div>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: player.lives }).map((_, i) => (
            <span key={i} className="text-sm">❤️</span>
          ))}
          {Array.from({ length: 3 - player.lives }).map((_, i) => (
            <span key={i} className="text-sm opacity-30">❤️</span>
          ))}
        </div>
      </div>

      {/* Top-right: Level + score */}
      <div className="absolute top-4 right-4 text-right pointer-events-auto">
        <div className="font-game text-xs text-yellow-400">LVL {player.level}</div>
        <div className="font-game text-xs text-white mt-0.5">
          {battleState.score.toLocaleString()} PTS
        </div>
        {battleState.combo > 2 && (
          <div className="font-game text-xs text-orange-400 animate-pulse">
            🔥 {battleState.combo}x
          </div>
        )}
      </div>

      {/* Bottom-left: Equipped gear quick view */}
      <div className="absolute bottom-20 left-4 pointer-events-auto">
        <div className="flex gap-1">
          {Object.values(player.equippedGear).filter(Boolean).slice(0, 4).map((gear, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded flex items-center justify-center text-lg"
              style={{
                background: `${(gear as GearItem).color}22`,
                border: `1px solid ${(gear as GearItem).color}66`,
              }}
              title={(gear as GearItem).name}
            >
              {(gear as GearItem).emoji}
            </div>
          ))}
          <button
            onClick={toggleInventory}
            className="w-8 h-8 rounded flex items-center justify-center text-sm bg-black bg-opacity-50 border border-gray-600 hover:border-gray-400 pointer-events-auto transition-colors"
            title="Inventory"
          >
            🎒
          </button>
        </div>
      </div>

      {/* Flee button */}
      <div className="absolute bottom-20 right-4 pointer-events-auto">
        <button
          onClick={handleFlee}
          className="font-game text-xs text-red-400 border border-red-800 px-2 py-1 rounded hover:bg-red-900 hover:bg-opacity-30 transition-colors"
        >
          ← FLEE
        </button>
      </div>

      {/* Boss required gear preview */}
      {selectedBoss && (
        <div className="absolute top-20 left-4 pointer-events-none">
          <div className="font-game text-xs text-gray-500" style={{ fontSize: '8px' }}>
            BOSS WEAKNESS:
          </div>
          <div className="flex gap-1 mt-1">
            {selectedBoss.requiredGear.map(gearId => {
              const hasGear = player.inventory.some(g => g.id === gearId && g.unlocked)
              const isEquipped = Object.values(player.equippedGear).some(g => g?.id === gearId)
              return (
                <div
                  key={gearId}
                  className="w-6 h-6 rounded text-center"
                  style={{
                    fontSize: '10px',
                    background: isEquipped ? '#00ff4422' : hasGear ? '#ff880022' : '#ff000022',
                    border: `1px solid ${isEquipped ? '#00ff44' : hasGear ? '#ff8800' : '#ff0000'}`,
                    lineHeight: '24px',
                  }}
                  title={gearId}
                >
                  {isEquipped ? '✓' : hasGear ? '○' : '✗'}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
