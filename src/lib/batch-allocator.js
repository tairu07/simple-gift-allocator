// 一括配分アルゴリズム - 在庫全体を目標充足セットに分割

/**
 * 在庫全体を目標金額以上のセットに一括配分する
 * @param {Array} pool 利用可能なアイテムのプール [{code: string, amount: number}]
 * @param {number} targetYen 目標金額（円）
 * @returns {Object} 配分結果
 */
export function batchAllocate(pool, targetYen) {
  if (pool.length === 0) {
    return {
      sets: [],
      unallocated: [],
      totalSets: 0,
      totalAllocated: 0,
      totalUnallocated: 0,
      theoreticalMax: 0
    }
  }

  const totalAmount = pool.reduce((sum, item) => sum + item.amount, 0)
  const theoreticalMax = Math.floor(totalAmount / targetYen)
  
  console.log(`総額: ¥${totalAmount.toLocaleString()}, 目標: ¥${targetYen.toLocaleString()}, 理論上限: ${theoreticalMax}セット`)

  // 利用可能なアイテムのコピーを作成
  let availableItems = [...pool]
  const allocatedSets = []

  // セットを逐次作成
  while (availableItems.length > 0) {
    const bestSet = findBestSet(availableItems, targetYen)
    
    if (!bestSet || bestSet.items.length === 0) {
      // これ以上セットを作れない
      break
    }

    // セットを確定し、使用したアイテムを除去
    allocatedSets.push(bestSet)
    availableItems = removeUsedItems(availableItems, bestSet.items)
    
    console.log(`セット${allocatedSets.length}: ¥${bestSet.sum.toLocaleString()} (あまり: ¥${bestSet.excess.toLocaleString()})`)
  }

  // 局所最適化を実行
  const optimizedSets = localOptimization(allocatedSets, availableItems, targetYen)

  // 結果の計算
  const totalAllocated = optimizedSets.reduce((sum, set) => sum + set.sum, 0)
  const totalUnallocated = availableItems.reduce((sum, item) => sum + item.amount, 0)

  return {
    sets: optimizedSets,
    unallocated: availableItems,
    totalSets: optimizedSets.length,
    totalAllocated,
    totalUnallocated,
    theoreticalMax,
    efficiency: theoreticalMax > 0 ? (optimizedSets.length / theoreticalMax * 100).toFixed(1) : 0
  }
}

/**
 * 現在の在庫から最適な1セットを見つける
 * @param {Array} availableItems 利用可能なアイテム
 * @param {number} targetYen 目標金額
 * @returns {Object|null} 最適なセット
 */
function findBestSet(availableItems, targetYen) {
  // 1,000円単位に変換
  const unit = 1000
  const target = Math.round(targetYen / unit)
  
  const items = availableItems.map((item, i) => ({
    index: i,
    amount: Math.round(item.amount / unit),
    originalAmount: item.amount,
    code: item.code
  }))

  // 動的計画法でセットを探索
  const dpResult = findOptimalSetDP(items, target)
  
  if (!dpResult || dpResult.sum < target) {
    return null
  }

  // 実際の金額で結果を構築
  const selectedItems = dpResult.indices.map(i => availableItems[i])
  const actualSum = selectedItems.reduce((sum, item) => sum + item.amount, 0)
  
  return {
    items: selectedItems,
    sum: actualSum,
    excess: actualSum - targetYen,
    count: selectedItems.length,
    efficiency: (targetYen / actualSum * 100).toFixed(1)
  }
}

/**
 * 動的計画法による最適セット探索
 * @param {Array} items アイテム配列
 * @param {number} target 目標値（1,000円単位）
 * @returns {Object|null} 最適解
 */
function findOptimalSetDP(items, target) {
  const maxSum = items.reduce((sum, item) => sum + item.amount, 0)
  const limit = Math.min(maxSum, target + 50) // 上限を設定して計算量を制限

  // DP テーブル: 合計値 -> {pieces: 枚数, indices: 使用アイテムのインデックス配列}
  const dp = new Map()
  dp.set(0, { pieces: 0, indices: [] })

  // 各アイテムについて状態を更新
  for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
    const item = items[itemIdx]
    const snapshot = Array.from(dp.entries()).sort((a, b) => b[0] - a[0])
    
    for (const [currentSum, state] of snapshot) {
      const newSum = currentSum + item.amount
      if (newSum > limit) continue
      
      const newPieces = state.pieces + 1
      const current = dp.get(newSum)
      
      // より少ない枚数で到達できる場合、または同じ枚数でより良い組み合わせの場合は更新
      if (!current || newPieces < current.pieces) {
        dp.set(newSum, {
          pieces: newPieces,
          indices: [...state.indices, itemIdx]
        })
      }
    }
  }

  // 目標以上の最適解を探索
  let bestSum = null
  let bestState = null
  
  for (const [sum, state] of dp) {
    if (sum < target) continue
    
    // 評価基準: [超過分, 枚数, 合計値] の辞書順
    const excess = sum - target
    const key = [excess, state.pieces, sum]
    
    if (!bestSum || compareKeys(key, [bestSum - target, bestState.pieces, bestSum]) < 0) {
      bestSum = sum
      bestState = state
    }
  }

  if (!bestState) return null

  return {
    sum: bestSum,
    indices: bestState.indices,
    pieces: bestState.pieces
  }
}

/**
 * 使用したアイテムを利用可能リストから除去
 * @param {Array} availableItems 利用可能なアイテム
 * @param {Array} usedItems 使用したアイテム
 * @returns {Array} 残りのアイテム
 */
function removeUsedItems(availableItems, usedItems) {
  const usedCodes = new Set(usedItems.map(item => item.code))
  return availableItems.filter(item => !usedCodes.has(item.code))
}

/**
 * 局所最適化による改善
 * @param {Array} sets 配分されたセット
 * @param {Array} unallocated 未配分アイテム
 * @param {number} targetYen 目標金額
 * @returns {Array} 最適化されたセット
 */
function localOptimization(sets, unallocated, targetYen) {
  // 現在の実装では元のセットをそのまま返す
  // 将来的にセット間のアイテム交換による最適化を実装可能
  return sets
}

/**
 * キーの比較関数（辞書順）
 * @param {Array} a キーA
 * @param {Array} b キーB
 * @returns {number} 比較結果
 */
function compareKeys(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1
    if (a[i] > b[i]) return 1
  }
  return a.length - b.length
}

/**
 * セットを金額順でソート
 * @param {Array} sets セット配列
 * @param {string} order ソート順 ('asc' | 'desc')
 * @returns {Array} ソートされたセット
 */
export function sortSetsByAmount(sets, order = 'desc') {
  return [...sets].sort((a, b) => {
    return order === 'desc' ? b.sum - a.sum : a.sum - b.sum
  })
}

/**
 * セットを超過分（あまり）順でソート
 * @param {Array} sets セット配列
 * @param {string} order ソート順 ('asc' | 'desc')
 * @returns {Array} ソートされたセット
 */
export function sortSetsByExcess(sets, order = 'asc') {
  return [...sets].sort((a, b) => {
    return order === 'asc' ? a.excess - b.excess : b.excess - a.excess
  })
}

/**
 * セットを効率順でソート
 * @param {Array} sets セット配列
 * @param {string} order ソート順 ('asc' | 'desc')
 * @returns {Array} ソートされたセット
 */
export function sortSetsByEfficiency(sets, order = 'desc') {
  return [...sets].sort((a, b) => {
    const effA = parseFloat(a.efficiency)
    const effB = parseFloat(b.efficiency)
    return order === 'desc' ? effB - effA : effA - effB
  })
}
