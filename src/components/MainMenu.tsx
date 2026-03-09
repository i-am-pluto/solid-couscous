import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { syncLeetCodeProgress, MAPPED_PROBLEMS_COUNT } from '../lib/leetcode'

export function MainMenu() {
  const { setMode, username, setUsername, player, setNotification, grantGear } = useGameStore()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(username)
  const [lcUsername, setLcUsername] = useState(localStorage.getItem('lc_username') || '')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const handleNameSave = () => {
    if (nameInput.trim()) {
      setUsername(nameInput.trim())
      setEditingName(false)
    }
  }

  const handleLCSync = async () => {
    if (!lcUsername.trim()) {
      setSyncResult('Enter your LeetCode username first')
      return
    }
    setSyncing(true)
    setSyncResult(null)
    localStorage.setItem('lc_username', lcUsername.trim())

    try {
      const currentGearIds = player.inventory.map(g => g.id)
      const result = await syncLeetCodeProgress(lcUsername.trim(), currentGearIds)

      if (result.error && result.newGearUnlocked.length === 0) {
        setSyncResult(`⚠️ ${result.error}`)
      } else {
        // Use proper store action to add gear (handles persistence)
        if (result.newGearUnlocked.length > 0) {
          grantGear(result.newGearUnlocked)
        }

        if (result.newGearUnlocked.length > 0) {
          setSyncResult(
            `✅ Synced! Found ${result.solvedCount} solved problems.\n` +
            `🎒 Unlocked ${result.newGearUnlocked.length} new gear items:\n` +
            result.newGearUnlocked.map(g => `  ${g.emoji} ${g.name}`).join('\n')
          )
          setNotification(`🔓 ${result.newGearUnlocked.length} gear items unlocked from LC!`, 'success')
        } else {
          setSyncResult(
            `✅ Synced ${result.solvedCount} solved problems.\n` +
            (result.alreadyHad.length > 0
              ? `Already have gear for: ${result.alreadyHad.slice(0, 3).join(', ')}...`
              : 'Solve the mapped LC problems to unlock gear automatically!')
          )
        }
      }
    } catch {
      setSyncResult('❌ Sync failed. Try again.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0033 50%, #0a0a0f 100%)' }}>

      {/* Animated stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              backgroundColor: `hsl(${Math.random() * 60 + 200}, 80%, 70%)`,
              animation: `pulse ${1 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-6">
        <div className="text-6xl mb-3" style={{ filter: 'drop-shadow(0 0 20px rgba(0,245,255,0.8))' }}>
          ⚔️
        </div>
        <h1 className="text-4xl font-game text-white mb-2"
          style={{ textShadow: '0 0 20px #00f5ff, 0 0 40px #bf00ff' }}>
          LEETCODE
        </h1>
        <h2 className="text-2xl font-game mb-1" style={{ color: '#ffd700', textShadow: '0 0 10px #ffd700' }}>
          FIGHTER
        </h2>
        <p className="text-xs font-game text-gray-400">Beat Bosses. Solve Problems. Level Up.</p>
      </div>

      {/* Player card */}
      <div className="relative z-10 mb-4 bg-black bg-opacity-60 border border-purple-500 border-opacity-40 rounded-lg p-3 w-72 text-center"
        style={{ boxShadow: '0 0 20px rgba(191,0,255,0.2)' }}>
        {editingName ? (
          <div className="flex gap-2 items-center">
            <input value={nameInput} onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSave()}
              className="flex-1 bg-gray-900 border border-purple-500 text-white text-xs font-game px-2 py-1 rounded"
              maxLength={16} autoFocus />
            <button onClick={handleNameSave}
              className="text-xs font-game text-green-400 border border-green-500 px-2 py-1 rounded">✓</button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)}
            className="text-sm font-game text-cyan-300 hover:text-cyan-100 transition-colors">
            👤 {username}
          </button>
        )}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <div className="text-yellow-400 text-base font-game">{player.level}</div>
            <div className="text-gray-500 text-xs font-game" style={{ fontSize: '8px' }}>LVL</div>
          </div>
          <div>
            <div className="text-green-400 text-base font-game">{player.defeatedBosses.length}</div>
            <div className="text-gray-500 text-xs font-game" style={{ fontSize: '8px' }}>KILLS</div>
          </div>
          <div>
            <div className="text-purple-400 text-base font-game">{player.inventory.length}</div>
            <div className="text-gray-500 text-xs font-game" style={{ fontSize: '8px' }}>GEAR</div>
          </div>
        </div>
        {player.streak > 0 && (
          <div className="mt-1 text-orange-400 text-xs font-game" style={{ fontSize: '9px' }}>
            🔥 {player.streak} answer streak!
          </div>
        )}
      </div>

      {/* LeetCode Sync */}
      <div className="relative z-10 mb-4 bg-black bg-opacity-50 border border-orange-800 rounded-lg p-3 w-72"
        style={{ boxShadow: '0 0 10px rgba(255,102,0,0.15)' }}>
        <div className="font-game text-xs text-orange-400 mb-2">
          🔗 LEETCODE SYNC
        </div>
        <p className="font-game text-gray-500 mb-2" style={{ fontSize: '8px' }}>
          Enter your LC username to auto-unlock gear for problems you've already solved.
          ({MAPPED_PROBLEMS_COUNT} problems mapped)
        </p>
        <div className="flex gap-1">
          <input
            value={lcUsername}
            onChange={e => setLcUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLCSync()}
            placeholder="your_lc_username"
            className="flex-1 bg-gray-900 border border-orange-800 text-white text-xs font-game px-2 py-1.5 rounded placeholder-gray-600"
            style={{ fontSize: '10px' }}
          />
          <button
            onClick={handleLCSync}
            disabled={syncing}
            className="font-game text-xs px-2 py-1.5 rounded border border-orange-500 text-orange-300 transition-all
              hover:bg-orange-900 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: '9px', whiteSpace: 'nowrap' }}
          >
            {syncing ? '...' : '⚡ SYNC'}
          </button>
        </div>
        {syncResult && (
          <pre className="mt-2 text-gray-300 leading-relaxed"
            style={{ fontSize: '8px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {syncResult}
          </pre>
        )}
      </div>

      {/* Main buttons */}
      <div className="relative z-10 flex flex-col gap-2 w-72">
        <button
          onClick={() => setMode('worldmap')}
          className="font-game text-sm py-3 px-8 rounded border-2 border-cyan-400 text-white transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(0,150,200,0.4), rgba(0,50,100,0.8))',
            boxShadow: '0 0 20px rgba(0,245,255,0.4)',
            textShadow: '0 0 8px rgba(0,245,255,0.8)',
          }}
        >
          ⚔ PLAY
        </button>

        <button
          onClick={() => useGameStore.getState().toggleInventory()}
          className="font-game text-xs py-2 px-6 rounded border border-yellow-500 text-yellow-300 transition-all hover:bg-yellow-900 hover:bg-opacity-30"
        >
          🎒 INVENTORY ({player.inventory.length} items)
        </button>
      </div>

      <div className="absolute bottom-4 text-center">
        <p className="text-xs font-game text-gray-600">WASD/Arrows: Move · SPACE: Attack · SHIFT: Dodge</p>
        <p className="text-xs font-game text-gray-700 mt-0.5">
          No gear? Press SPACE near boss → answer the question → unlock it
        </p>
      </div>
    </div>
  )
}
