import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export function QuestionModal() {
  const {
    currentQuestion,
    pendingGearUnlock,
    answerQuestion,
    answerResult,
    questionTimer,
    setQuestionTimer,
    player,
  } = useGameStore()

  const [selected, setSelected] = useState<'a' | 'b' | 'c' | 'd' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!currentQuestion) return
    setSelected(null)
    setSubmitted(false)
    setQuestionTimer(currentQuestion.timeLimit)

    let current = currentQuestion.timeLimit
    timerRef.current = setInterval(() => {
      current -= 1
      setQuestionTimer(current)
      if (current <= 0) {
        clearInterval(timerRef.current!)
        if (!submitted) handleTimeUp()
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentQuestion?.id])

  const handleTimeUp = () => {
    if (!submitted) {
      setSubmitted(true)
      // Pick wrong answer
      const wrong = (['a', 'b', 'c', 'd'] as const).find(a => a !== currentQuestion?.correctAnswer) || 'a'
      answerQuestion(wrong)
    }
  }

  const handleSubmit = (choice: 'a' | 'b' | 'c' | 'd') => {
    if (submitted) return
    setSelected(choice)
    setSubmitted(true)
    if (timerRef.current) clearInterval(timerRef.current)
    answerQuestion(choice)
  }

  if (!currentQuestion || !pendingGearUnlock) return null

  const timerPct = (questionTimer / currentQuestion.timeLimit) * 100
  const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 25 ? '#f59e0b' : '#ef4444'
  const difficultyColor: Record<string, string> = {
    easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444', extreme: '#bf00ff'
  }
  const categoryEmojis: Record<string, string> = {
    arrays: '📋', strings: '📝', hashmaps: '#️⃣', twopointers: '👆', slidingwindow: '🪟',
    binarysearch: '🔍', linkedlist: '⛓️', trees: '🌲', graphs: '🕸️', dp: '🧮',
    backtracking: '🔙', heaps: '⛰️', tries: '🌳', greedy: '💰', bitmanipulation: '⚡',
  }

  const isCorrect = answerResult === 'correct'
  const isWrong = answerResult === 'wrong'

  const choices = [
    { key: 'a' as const, text: currentQuestion.choices.a },
    { key: 'b' as const, text: currentQuestion.choices.b },
    { key: 'c' as const, text: currentQuestion.choices.c },
    { key: 'd' as const, text: currentQuestion.choices.d },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)',
          border: `2px solid ${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#7c3aed'}`,
          boxShadow: `0 0 40px ${isCorrect ? '#22c55e44' : isWrong ? '#ef444444' : '#7c3aed44'}`,
        }}
      >
        {/* Result overlay */}
        {(isCorrect || isWrong) && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
            style={{ background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}
          >
            <div className="text-6xl mb-3 animate-bounce">
              {isCorrect ? '✅' : '❌'}
            </div>
            <div className="font-game text-xl" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
              {isCorrect ? 'CORRECT!' : 'WRONG!'}
            </div>
            {isCorrect && (
              <div className="mt-2 font-game text-sm text-yellow-400">
                🎒 {pendingGearUnlock.emoji} {pendingGearUnlock.name} UNLOCKED!
              </div>
            )}
            {isWrong && (
              <div className="mt-2 font-game text-xs text-red-300">
                💔 You took damage!
              </div>
            )}
            <div className="mt-3 font-game text-xs text-gray-400 max-w-sm text-center px-4 leading-relaxed">
              {currentQuestion.explanation}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{categoryEmojis[currentQuestion.category] || '❓'}</span>
              <span className="font-game text-xs uppercase" style={{ color: difficultyColor[currentQuestion.difficulty] }}>
                {currentQuestion.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {player.streak > 0 && (
                <span className="font-game text-xs text-orange-400">🔥 {player.streak} streak</span>
              )}
              <div className="font-game text-sm" style={{ color: timerColor }}>
                ⏱ {questionTimer}s
              </div>
            </div>
          </div>

          {/* Timer bar */}
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${timerPct}%`, backgroundColor: timerColor, boxShadow: `0 0 6px ${timerColor}` }}
            />
          </div>

          {/* Gear reward preview */}
          <div
            className="flex items-center gap-3 p-2.5 rounded-lg mb-3"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}
          >
            <span className="text-2xl">{pendingGearUnlock.emoji}</span>
            <div>
              <div className="font-game text-xs text-yellow-400">REWARD: {pendingGearUnlock.name}</div>
              <div className="font-game text-xs text-gray-400 mt-0.5"
                style={{ fontSize: '9px' }}>
                ATK +{pendingGearUnlock.attackBonus} · DEF +{pendingGearUnlock.defenseBonus} · SPD +{pendingGearUnlock.speedBonus}
                {pendingGearUnlock.specialAbility && ` · ✨ ${pendingGearUnlock.specialAbility}`}
              </div>
            </div>
          </div>

          {/* Question title */}
          <h3 className="font-game text-sm text-white mb-2">
            {currentQuestion.title}
          </h3>

          {/* Question text */}
          <p className="text-gray-300 text-sm leading-relaxed mb-4 font-mono">
            {currentQuestion.description}
          </p>
        </div>

        {/* Choices */}
        <div className="px-5 pb-5 grid grid-cols-1 gap-2">
          {choices.map(({ key, text }) => {
            let btnStyle = {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
            }

            if (submitted) {
              if (key === currentQuestion.correctAnswer) {
                btnStyle = {
                  background: 'rgba(34,197,94,0.2)',
                  border: '1px solid #22c55e',
                  color: '#22c55e',
                }
              } else if (key === selected && key !== currentQuestion.correctAnswer) {
                btnStyle = {
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                }
              }
            } else if (key === selected) {
              btnStyle = {
                background: 'rgba(124,58,237,0.3)',
                border: '1px solid #7c3aed',
                color: '#c4b5fd',
              }
            }

            return (
              <button
                key={key}
                onClick={() => handleSubmit(key)}
                disabled={submitted}
                className="w-full text-left px-4 py-3 rounded-lg transition-all duration-150
                  font-mono text-sm hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
                style={btnStyle}
              >
                <span className="font-game text-xs mr-3 uppercase" style={{ color: 'inherit', opacity: 0.7 }}>
                  [{key.toUpperCase()}]
                </span>
                {text}
                {submitted && key === currentQuestion.correctAnswer && ' ✓'}
                {submitted && key === selected && key !== currentQuestion.correctAnswer && ' ✗'}
              </button>
            )
          })}
        </div>

        {/* LC link */}
        {currentQuestion.leetcodeUrl && !submitted && (
          <div className="px-5 pb-4 text-center">
            <a
              href={currentQuestion.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-game text-xs text-orange-400 hover:text-orange-300 underline"
              style={{ fontSize: '9px' }}
            >
              📎 View on LeetCode (no cheating! 😈)
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
