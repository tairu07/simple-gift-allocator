// 配分アルゴリズム - 動的計画法による最適解の計算

/**
 * 動的計画法を使用して最適な組み合わせを見つける
 * @param {Array} pool 利用可能なアイテムのプール [{code: string, amount: number}]
 * @param {number} targetYen 目標金額（円）
 * @param {boolean} allowOver 目標を超過することを許可するか
 * @returns {Object} 最適な組み合わせの提案
 */
export function bestComboDP(pool, targetYen, allowOver = true) {
  if (pool.length === 0) {
    return { items: [], sum: 0, diff: -targetYen, count: 0 }
  }

  // 1,000円単位に丸めて計算量を削減
  const unit = 1000
  const target = Math.round(targetYen / unit)
  
  // アイテムを1,000円単位に変換
  const arr = pool.map((p, i) => ({ 
    i, 
    a: Math.round(p.amount / unit),
    originalAmount: p.amount 
  }))
  
  const maxA = arr.reduce((m, r) => Math.max(m, r.a), 0)
  const limit = allowOver ? target + maxA : target

  // DPテーブルのノード定義
  // DP テーブル: 合計値 -> 最小枚数での到達方法
  const dp = new Map()
  dp.set(0, { pieces: 0, prev: -1, idx: -1 })

  // 各アイテムについて状態を更新
  for (const r of arr) {
    // 現在の状態のスナップショットを取得（降順でソート）
    const snapshot = Array.from(dp.entries()).sort((a, b) => b[0] - a[0])
    
    for (const [s, node] of snapshot) {
      const ns = s + r.a // 新しい合計値
      if (ns > limit) continue
      
      const candPieces = node.pieces + 1
      const cur = dp.get(ns)
      
      // より少ない枚数で到達できる場合は更新
      if (!cur || candPieces < cur.pieces) {
        dp.set(ns, { pieces: candPieces, prev: s, idx: r.i })
      }
    }
  }

  // 最適解を探索
  let bestSum = null
  let bestKey = null
  
  for (const [s, node] of dp) {
    if (!allowOver && s > target) continue
    
    // 評価キー: [誤差の絶対値, 枚数, 合計値]
    // 辞書順比較で最適解を決定
    const key = JSON.stringify([
      Math.abs(s - target), 
      node.pieces, 
      s
    ])
    
    if (!bestKey || key < bestKey) {
      bestKey = key
      bestSum = s
    }
  }

  if (bestSum == null) {
    return { items: [], sum: 0, diff: -targetYen, count: 0 }
  }

  // 解の復元
  const chosen = []
  for (let s = bestSum; s !== 0; ) {
    const n = dp.get(s)
    chosen.push(n.idx)
    s = n.prev
  }
  
  chosen.reverse()
  const items = chosen.map(k => pool[k])
  const sum = chosen.reduce((acc, k) => acc + pool[k].amount, 0)
  
  return { 
    items, 
    sum, 
    diff: sum - targetYen,
    count: chosen.length
  }
}

/**
 * 簡単な貪欲法による近似解（高速だが最適解ではない）
 */
export function bestComboGreedy(pool, targetYen, allowOver = true) {
  if (pool.length === 0) {
    return { items: [], sum: 0, diff: -targetYen, count: 0 }
  }

  // 金額の降順でソート
  const sorted = [...pool].sort((a, b) => b.amount - a.amount)
  const selected = []
  let sum = 0

  for (const item of sorted) {
    const newSum = sum + item.amount
    
    if (!allowOver && newSum > targetYen) {
      continue
    }
    
    // 目標に近づく場合は追加
    if (Math.abs(newSum - targetYen) <= Math.abs(sum - targetYen)) {
      selected.push(item)
      sum = newSum
    }
  }

  return {
    items: selected,
    sum,
    diff: sum - targetYen,
    count: selected.length
  }
}
