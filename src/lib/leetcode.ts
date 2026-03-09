import { GEAR_ITEMS } from '../game/data/gear'
import { QUESTIONS } from './questions'
import { GearItem } from '../types'

// Map LeetCode problem slugs → gear IDs
// When a user has solved these on LC, they get the gear automatically
const LC_SLUG_TO_GEAR: Record<string, string> = {
  'two-sum':                          'wooden_sword',
  'best-time-to-buy-and-sell-stock':  'wooden_sword',
  'contains-duplicate':               'forest_boots',
  'maximum-subarray':                 'wooden_sword',
  'product-of-array-except-self':     'forest_boots',
  'valid-anagram':                    'leather_armor',
  'valid-palindrome':                 'leather_armor',
  'longest-common-prefix':            'leather_armor',
  'reverse-words-in-a-string':        'leather_armor',
  'group-anagrams':                   'hash_shield',
  'top-k-frequent-elements':          'hash_shield',
  '3sum':                             'iron_dagger',
  'container-with-most-water':        'iron_dagger',
  'longest-substring-without-repeating-characters': 'desert_helm',
  'minimum-window-substring':         'desert_helm',
  'binary-search':                    'silver_bow',
  'find-minimum-in-rotated-sorted-array': 'silver_bow',
  'search-in-rotated-sorted-array':   'silver_bow',
  'reverse-linked-list':              'chain_whip',
  'linked-list-cycle':                'chain_whip',
  'merge-two-sorted-lists':           'chain_whip',
  'remove-nth-node-from-end-of-list': 'chain_whip',
  'invert-binary-tree':               'tree_staff',
  'maximum-depth-of-binary-tree':     'tree_staff',
  'binary-tree-level-order-traversal':'ice_gauntlets',
  'validate-binary-search-tree':      'crystal_armor',
  'lowest-common-ancestor-of-a-binary-search-tree': 'crystal_armor',
  'number-of-islands':                'graph_crossbow',
  'clone-graph':                      'graph_crossbow',
  'course-schedule':                  'lava_shield',
  'pacific-atlantic-water-flow':      'volcanic_boots',
  'jump-game':                        'greedy_knife',
  'climbing-stairs':                  'dp_lance',
  'house-robber':                     'dp_lance',
  'coin-change':                      'sky_wings',
  'longest-increasing-subsequence':   'memoize_helm',
  'word-break':                       'memoize_helm',
  'subsets':                          'backtrack_cloak',
  'combination-sum':                  'backtrack_cloak',
  'n-queens':                         'backtrack_cloak',
  'find-median-from-data-stream':     'cyber_gun',
  'k-closest-points-to-origin':       'cyber_gun',
  'implement-trie-prefix-tree':       'trie_rifle',
  'word-search-ii':                   'trie_rifle',
  'single-number':                    'void_armor',
  'number-of-1-bits':                 'void_armor',
}

export interface LCSyncResult {
  solvedCount: number
  newGearUnlocked: GearItem[]
  alreadyHad: string[]
  error?: string
}

// Fetch solved problems using alfa-leetcode-api (public, no auth needed)
export async function syncLeetCodeProgress(
  username: string,
  currentGearIds: string[]
): Promise<LCSyncResult> {
  if (!username || username.trim() === '') {
    return { solvedCount: 0, newGearUnlocked: [], alreadyHad: [], error: 'No username provided' }
  }

  try {
    // Use the public alfa-leetcode-api which returns solved problem slugs
    const response = await fetch(
      `https://alfa-leetcode-api.onrender.com/${username.trim()}/solved`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    // The API returns { solvedProblem, easySolved, mediumSolved, hardSolved, solvedProblems: [{title, titleSlug, difficulty}] }
    const solvedSlugs: string[] = (data.solvedProblems || []).map(
      (p: { titleSlug: string }) => p.titleSlug
    )

    const newGear: GearItem[] = []
    const alreadyHad: string[] = []

    for (const slug of solvedSlugs) {
      const gearId = LC_SLUG_TO_GEAR[slug]
      if (!gearId) continue

      const gear = GEAR_ITEMS.find(g => g.id === gearId)
      if (!gear) continue

      if (currentGearIds.includes(gearId)) {
        alreadyHad.push(gear.name)
      } else {
        newGear.push({ ...gear, unlocked: true })
      }
    }

    return {
      solvedCount: data.solvedProblem || solvedSlugs.length,
      newGearUnlocked: newGear,
      alreadyHad,
    }
  } catch (err) {
    // Fallback: try leetcode-stats-api (only gives counts, not slugs, so limited)
    try {
      const fallback = await fetch(
        `https://leetcode-stats-api.herokuapp.com/${username.trim()}`,
        { signal: AbortSignal.timeout(8000) }
      )
      const d = await fallback.json()
      if (d.status === 'success') {
        return {
          solvedCount: d.totalSolved || 0,
          newGearUnlocked: [],
          alreadyHad: [],
          error: 'Could not fetch specific problems — only count available. Use the in-game questions to unlock gear.',
        }
      }
    } catch {}

    return {
      solvedCount: 0,
      newGearUnlocked: [],
      alreadyHad: [],
      error: 'Could not connect to LeetCode API. Check your username and try again.',
    }
  }
}

// Get all gear that corresponds to solved LC problems (for display)
export function getGearForSolvedProblems(solvedSlugs: string[]): string[] {
  return [...new Set(solvedSlugs.map(s => LC_SLUG_TO_GEAR[s]).filter(Boolean))]
}

// Get the LC problem slug for a gear item (for display)
export function getLCSlugForGear(gearId: string): string | undefined {
  return Object.entries(LC_SLUG_TO_GEAR).find(([, g]) => g === gearId)?.[0]
}

export const MAPPED_PROBLEMS_COUNT = Object.keys(LC_SLUG_TO_GEAR).length
