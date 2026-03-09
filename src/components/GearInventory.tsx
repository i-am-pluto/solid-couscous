import { useGameStore } from '../store/gameStore'
import { GearItem } from '../types'
import { rarityColor } from '../game/data/gear'

export function GearInventory() {
  const { player, equipGear, toggleInventory, setNotification } = useGameStore()

  const slots = ['weapon', 'offhand', 'armor', 'boots', 'helm', 'special'] as const

  const handleEquip = (gear: GearItem) => {
    equipGear(gear)
    setNotification(`${gear.emoji} ${gear.name} equipped!`, 'success')
  }

  const categoryEmojis: Record<string, string> = {
    arrays: '📋', strings: '📝', hashmaps: '#️⃣', twopointers: '👆', slidingwindow: '🪟',
    binarysearch: '🔍', linkedlist: '⛓️', trees: '🌲', graphs: '🕸️', dp: '🧮',
    backtracking: '🔙', heaps: '⛰️', tries: '🌳', greedy: '💰', bitmanipulation: '⚡',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-4 pb-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="font-game text-lg text-yellow-400" style={{ textShadow: '0 0 10px #ffd700' }}>
            🎒 INVENTORY
          </h2>
          <button
            onClick={toggleInventory}
            className="font-game text-xs text-gray-400 hover:text-white border border-gray-600 px-3 py-1.5 rounded transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Equipped gear */}
        <div className="bg-black bg-opacity-60 rounded-xl p-4 mb-4 border border-yellow-900">
          <h3 className="font-game text-xs text-yellow-400 mb-3">⚔ EQUIPPED</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {slots.map(slot => {
              const equipped = player.equippedGear[slot]
              return (
                <div
                  key={slot}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border"
                  style={{
                    background: equipped ? `${equipped.color}22` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${equipped ? equipped.color + '44' : '#333'}`,
                    minHeight: '70px',
                  }}
                >
                  {equipped ? (
                    <>
                      <span className="text-2xl">{equipped.emoji}</span>
                      <span className="font-game text-white text-center leading-tight"
                        style={{ fontSize: '7px' }}>
                        {equipped.name.split(' ')[0]}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-700 text-lg">□</span>
                      <span className="font-game text-gray-700 capitalize" style={{ fontSize: '7px' }}>
                        {slot}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Total stats */}
          <div className="mt-3 flex gap-4 justify-center">
            <div className="font-game text-xs text-red-400">⚔ ATK: {player.totalAttack}</div>
            <div className="font-game text-xs text-blue-400">🛡 DEF: {player.totalDefense}</div>
            <div className="font-game text-xs text-green-400">❤ HP: {player.hp}/{player.maxHp}</div>
          </div>
        </div>

        {/* Inventory items */}
        <div className="bg-black bg-opacity-60 rounded-xl p-4 border border-gray-800">
          <h3 className="font-game text-xs text-gray-300 mb-3">
            ALL GEAR ({player.inventory.length} unlocked)
          </h3>

          {player.inventory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🗡️</div>
              <p className="font-game text-xs text-gray-500">
                No gear yet! Solve questions to unlock weapons.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {player.inventory.map(gear => {
                const isEquipped = player.equippedGear[gear.slot]?.id === gear.id
                return (
                  <button
                    key={gear.id}
                    onClick={() => !isEquipped && handleEquip(gear)}
                    disabled={isEquipped}
                    className={`relative text-left p-3 rounded-lg transition-all duration-200
                      ${!isEquipped ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}
                    style={{
                      background: isEquipped ? `${gear.color}22` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isEquipped ? gear.color : rarityColor[gear.rarity] + '44'}`,
                      boxShadow: isEquipped ? `0 0 12px ${gear.color}33` : 'none',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{gear.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-game text-xs text-white truncate">{gear.name}</span>
                          {isEquipped && (
                            <span className="font-game text-green-400 shrink-0" style={{ fontSize: '8px' }}>
                              ✓ EQ
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-0.5">
                          <span style={{ color: rarityColor[gear.rarity], fontSize: '8px' }}
                            className="font-game capitalize">
                            {gear.rarity}
                          </span>
                          <span className="font-game text-gray-500" style={{ fontSize: '8px' }}>
                            {categoryEmojis[gear.category]} {gear.category}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {gear.attackBonus > 0 && (
                            <span className="font-game text-red-400" style={{ fontSize: '8px' }}>
                              ⚔+{gear.attackBonus}
                            </span>
                          )}
                          {gear.defenseBonus > 0 && (
                            <span className="font-game text-blue-400" style={{ fontSize: '8px' }}>
                              🛡+{gear.defenseBonus}
                            </span>
                          )}
                          {gear.speedBonus !== 0 && (
                            <span className="font-game text-green-400" style={{ fontSize: '8px' }}>
                              💨{gear.speedBonus > 0 ? '+' : ''}{gear.speedBonus}
                            </span>
                          )}
                          {gear.specialAbility && (
                            <span className="font-game text-purple-400" style={{ fontSize: '8px' }}>
                              ✨ {gear.specialAbility}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
