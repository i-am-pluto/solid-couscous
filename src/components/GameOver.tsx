import { useGameStore } from '../store/gameStore'

export function GameOver() {
  const { resetBattle, setMode, player, selectedBoss } = useGameStore()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)' }}
    >
      <div className="text-center max-w-sm px-4">
        <div className="text-6xl mb-4">💀</div>
        <h1 className="font-game text-2xl text-red-500 mb-2"
          style={{ textShadow: '0 0 20px #ff0040, 0 0 40px #ff0040' }}>
          GAME OVER
        </h1>
        <p className="font-game text-xs text-gray-400 mb-6">
          {selectedBoss?.name} has defeated you!
        </p>

        <div className="bg-black bg-opacity-60 rounded-xl p-4 mb-6 border border-red-900">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="font-game text-lg text-purple-400">LVL {player.level}</div>
              <div className="font-game text-xs text-gray-500">LEVEL</div>
            </div>
            <div className="text-center">
              <div className="font-game text-lg text-green-400">{player.solvedQuestions.length}</div>
              <div className="font-game text-xs text-gray-500">SOLVED</div>
            </div>
          </div>
          <div className="mt-3 font-game text-xs text-red-400 text-center">
            💡 Solve more questions to unlock better gear!
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={resetBattle}
            className="font-game text-sm py-3 px-6 rounded-lg border-2 border-red-500 text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(200,30,30,0.4), rgba(100,10,10,0.8))',
              boxShadow: '0 0 20px rgba(255,0,0,0.3)',
            }}
          >
            🔄 TRY AGAIN
          </button>

          <button
            onClick={() => setMode('worldmap')}
            className="font-game text-xs py-2 px-4 rounded-lg border border-cyan-700 text-cyan-300 transition-all hover:bg-cyan-900 hover:bg-opacity-30"
          >
            🗺 WORLD MAP
          </button>
        </div>
      </div>
    </div>
  )
}
