import { useGameStore } from '../store/gameStore'
import { getBossesByWorld } from '../game/data/bosses'
import { getWorldById } from '../game/data/worlds'

export function VictoryScreen() {
  const { selectedBoss, selectedWorld, player, setMode, startBattle } = useGameStore()

  if (!selectedBoss || !selectedWorld) return null

  const worldBosses = getBossesByWorld(selectedWorld.id)
  const nextBoss = worldBosses.find(b => b.order === selectedBoss.order + 1)
  const allWorldBossesDefeated = worldBosses.every(b => player.defeatedBosses.includes(b.id))
  const nextWorld = allWorldBossesDefeated ? getWorldById(
    ['forest','desert','ice','lava','sky','cyber','void'].find(
      (_, i) => ['forest','desert','ice','lava','sky','cyber','void'][i] !== selectedWorld.id
        && ['forest','desert','ice','lava','sky','cyber','void'].indexOf(selectedWorld.id) < i + 1
    ) || ''
  ) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div className="text-center max-w-lg px-4">
        {/* Victory title */}
        <div className="text-6xl mb-4 animate-bounce">🏆</div>
        <h1 className="font-game text-2xl text-yellow-400 mb-2"
          style={{ textShadow: '0 0 20px #ffd700, 0 0 40px #ff8800' }}>
          VICTORY!
        </h1>
        <p className="font-game text-sm text-white mb-1">
          {selectedBoss.name} defeated!
        </p>
        <p className="font-game text-xs text-gray-400 mb-6">
          {selectedBoss.title}
        </p>

        {/* Rewards */}
        <div className="bg-black bg-opacity-50 rounded-xl p-4 mb-6 border border-yellow-800">
          <h3 className="font-game text-xs text-yellow-400 mb-3">⚡ REWARDS</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-game text-lg text-purple-400">+{selectedBoss.xpReward}</div>
              <div className="font-game text-xs text-gray-500">XP</div>
            </div>
            <div className="text-center">
              <div className="font-game text-lg text-yellow-400">+{selectedBoss.order * 50}</div>
              <div className="font-game text-xs text-gray-500">GOLD</div>
            </div>
            <div className="text-center">
              <div className="font-game text-lg text-green-400">LVL {player.level}</div>
              <div className="font-game text-xs text-gray-500">LEVEL</div>
            </div>
          </div>
          {selectedBoss.dropGear && (
            <div className="mt-3 font-game text-xs text-purple-300 text-center">
              🎁 Rare drop unlocked! Check inventory.
            </div>
          )}
        </div>

        {/* XP bar */}
        <div className="mb-6">
          <div className="flex justify-between font-game text-xs text-gray-400 mb-1">
            <span>XP</span>
            <span>{player.xp}/{player.xpToNext}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(player.xp / player.xpToNext) * 100}%`,
                background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                boxShadow: '0 0 10px #7c3aed',
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {nextBoss && !allWorldBossesDefeated && (
            <button
              onClick={() => startBattle(selectedWorld, nextBoss)}
              className="font-game text-sm py-3 px-6 rounded-lg border-2 border-red-500 text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(200,30,30,0.4), rgba(100,10,10,0.8))',
                boxShadow: '0 0 20px rgba(255,0,0,0.3)',
              }}
            >
              ⚔ NEXT BOSS: {nextBoss.name}
            </button>
          )}

          {allWorldBossesDefeated && (
            <div className="font-game text-xs text-green-400 border border-green-700 rounded-lg p-3 mb-2">
              🌟 {selectedWorld.name} CLEARED! New world unlocked!
            </div>
          )}

          <button
            onClick={() => setMode('worldmap')}
            className="font-game text-xs py-2 px-6 rounded-lg border border-cyan-700 text-cyan-300 transition-all hover:bg-cyan-900 hover:bg-opacity-30"
          >
            🗺 WORLD MAP
          </button>

          <button
            onClick={() => setMode('menu')}
            className="font-game text-xs py-2 px-6 rounded-lg border border-gray-700 text-gray-400 transition-all hover:bg-gray-900"
          >
            🏠 MAIN MENU
          </button>
        </div>
      </div>
    </div>
  )
}
