# ⚔️ LeetCode Fighter

**A gamified 2D browser fighting game that makes you a better LeetCoder.**

Beat bosses by solving LeetCode problems to unlock weapons and gear.

## 🎮 Gameplay

- **7 Worlds** × **3 Bosses each** = 21 bosses of increasing difficulty
- **25+ gear items** unlocked by solving categorized LeetCode questions
- **3 boss phases** — each boss gets faster, more aggressive, hits harder
- Bosses are **immune** to attacks without the required gear → forces you to solve questions

## ⚔️ Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Jump |
| `A` / `←` | Move Left |
| `D` / `→` | Move Right |
| `SPACE` | Attack |
| `SHIFT` | Dodge (brief invincibility) |
| `ESC` | Inventory |

## 📚 Worlds & Topics

| World | Topic |
|-------|-------|
| 🌲 Greenwood Forest | Arrays, Strings, HashMaps |
| 🏜️ Sand Dunes | Binary Search, Linked Lists, Sliding Window |
| 🧊 Frozen Tundra | Trees, BST, Recursion |
| 🌋 Volcanic Caverns | Graphs, BFS/DFS, Greedy |
| ☁️ Sky Kingdom | Dynamic Programming |
| 🤖 Cyber City | Heaps, Tries, Backtracking |
| 🌌 The Void Realm | All topics — final bosses |

## 🛠️ Tech Stack

- **Phaser 3** — 2D game engine with Arcade Physics
- **React 18** — UI overlays (question modal, inventory, world map)
- **Zustand** — Game state management
- **Supabase** — Cloud save + leaderboard (optional)
- **Tailwind CSS** — Styling
- **Vite** — Build tool
- **TypeScript** — Type safety

## 🚀 Setup

```bash
npm install
npm run dev
```

### Supabase (optional cloud saves)

1. Create a [Supabase](https://supabase.com) project (free tier)
2. Create `.env` from `.env.example`
3. Run this SQL in Supabase dashboard:

```sql
CREATE TABLE players (
  username TEXT PRIMARY KEY,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  defeated_bosses TEXT[] DEFAULT '{}',
  solved_questions TEXT[] DEFAULT '{}',
  unlocked_worlds TEXT[] DEFAULT '{"forest"}',
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Deploy to Vercel (free)

```bash
npx vercel
```

## 🏆 How It Works

1. Enter a world → fight a boss
2. Try to attack → "Boss is immune! Unlock [Gear Name]!"
3. Click "UNLOCK GEAR" → LeetCode multiple choice question
4. Answer correctly → get gear + XP + streak bonus
5. Wrong answer → take damage + streak reset
6. Equip gear → deal real damage to boss
7. Defeat boss → unlock next boss / world

**The harder the boss, the harder the questions needed to beat it.**
