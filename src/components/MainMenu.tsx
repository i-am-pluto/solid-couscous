import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function MainMenu() {
  const { setMode, username, setUsername, player } = useGameStore()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(username)

  const handleStart = () => {
    setMode('worldmap')
  }

  const handleNameSave = () => {
    if (nameInput.trim()) {
      setUsername(nameInput.trim())
      setEditingName(false)
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0033 50%, #0a0a0f 100%)' }}>

      {/* Animated stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: `hsl(${Math.random() * 60 + 200}, 80%, 70%)`,
              animation: `pulse ${1 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

      {/* Floating code snippets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        {['O(n)', 'O(1)', 'BFS', 'DFS', 'dp[i]', 'left++', 'right--', 'return', 'null', 'graph', 'heap', 'trie'].map((code, i) => (
          <div
            key={i}
            className="absolute text-green-400 text-xs font-game"
            style={{
              left: `${(i / 12) * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {code}
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-8">
        <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 20px rgba(0,245,255,0.8))' }}>
          ⚔️
        </div>
        <h1 className="text-4xl font-game text-white mb-2"
          style={{
            textShadow: '0 0 20px #00f5ff, 0 0 40px #00f5ff, 0 0 80px #bf00ff',
            letterSpacing: '0.05em',
          }}>
          LEETCODE
        </h1>
        <h2 className="text-2xl font-game mb-2"
          style={{
            color: '#ffd700',
            textShadow: '0 0 10px #ffd700, 0 0 30px #ff6600',
          }}>
          FIGHTER
        </h2>
        <p className="text-xs font-game text-gray-400">Code Your Way to Victory</p>
      </div>

      {/* Player stats preview */}
      <div className="relative z-10 mb-8 bg-black bg-opacity-60 border border-purple-500 border-opacity-40 rounded-lg p-4 min-w-64 text-center"
        style={{ boxShadow: '0 0 20px rgba(191,0,255,0.2)' }}>
        {editingName ? (
          <div className="flex gap-2 items-center">
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSave()}
              className="flex-1 bg-gray-900 border border-purple-500 text-white text-xs font-game px-2 py-1 rounded"
              maxLength={16}
              autoFocus
            />
            <button
              onClick={handleNameSave}
              className="text-xs font-game text-green-400 border border-green-500 px-2 py-1 rounded hover:bg-green-900"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-game text-cyan-300 hover:text-cyan-100 transition-colors"
          >
            👤 {username}
          </button>
        )}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <div className="text-yellow-400 text-lg font-game">{player.level}</div>
            <div className="text-gray-500 text-xs font-game">LVL</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 text-lg font-game">{player.defeatedBosses.length}</div>
            <div className="text-gray-500 text-xs font-game">KILLS</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 text-lg font-game">{player.solvedQuestions.length}</div>
            <div className="text-gray-500 text-xs font-game">SOLVED</div>
          </div>
        </div>
        {player.streak > 0 && (
          <div className="mt-2 text-orange-400 text-xs font-game">
            🔥 {player.streak} answer streak!
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="relative z-10 flex flex-col gap-3 min-w-48">
        <button
          onClick={handleStart}
          className="relative overflow-hidden font-game text-sm py-3 px-8 rounded border-2 border-cyan-400 text-white transition-all duration-200 hover:scale-105 active:scale-95"
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
          className="font-game text-xs py-2 px-6 rounded border border-yellow-500 text-yellow-300 transition-all duration-200 hover:bg-yellow-900 hover:bg-opacity-30"
        >
          🎒 INVENTORY ({player.inventory.length})
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-xs font-game text-gray-600">WASD/Arrows to move · SPACE to attack · SHIFT to dodge</p>
        <p className="text-xs font-game text-gray-700 mt-1">Solve LeetCode problems to unlock powerful gear</p>
      </div>
    </div>
  )
}
