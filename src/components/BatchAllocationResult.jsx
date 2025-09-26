import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Copy, Package, TrendingUp, AlertCircle, Download, BarChart3, Award, Target } from 'lucide-react'
import { formatAmount } from '../lib/parser.js'
import { sortSetsByAmount, sortSetsByExcess, sortSetsByEfficiency } from '../lib/batch-allocator.js'

export function BatchAllocationResult({ result, targetAmount, onCopySet, onCopyAll }) {
  const [sortBy, setSortBy] = useState('index')
  
  if (!result || result.totalSets === 0) {
    return null
  }

  // ソート処理
  const getSortedSets = () => {
    switch (sortBy) {
      case 'amount_desc':
        return sortSetsByAmount(result.sets, 'desc')
      case 'amount_asc':
        return sortSetsByAmount(result.sets, 'asc')
      case 'excess_asc':
        return sortSetsByExcess(result.sets, 'asc')
      case 'excess_desc':
        return sortSetsByExcess(result.sets, 'desc')
      case 'efficiency_desc':
        return sortSetsByEfficiency(result.sets, 'desc')
      case 'efficiency_asc':
        return sortSetsByEfficiency(result.sets, 'asc')
      default:
        return result.sets
    }
  }

  const sortedSets = getSortedSets()
  const totalExcess = result.sets.reduce((sum, set) => sum + set.excess, 0)
  const averageExcess = result.totalSets > 0 ? totalExcess / result.totalSets : 0

  // セット用のコピーテキスト生成
  const generateSetCopyText = (set, index) => {
    const lines = set.items.map(item => `${item.code} ${formatAmount(item.amount)}`)
    lines.push(`あまり ${formatAmount(set.excess)}`)
    return lines.join('\n')
  }

  // 全体用のコピーテキスト生成
  const generateAllCopyText = () => {
    const sections = []
    
    sortedSets.forEach((set, index) => {
      sections.push(`=== セット${index + 1} ===`)
      set.items.forEach(item => {
        sections.push(`${item.code} ${formatAmount(item.amount)}`)
      })
      sections.push(`あまり ${formatAmount(set.excess)}`)
      sections.push('') // 空行
    })

    if (result.unallocated.length > 0) {
      sections.push('=== 未配分在庫 ===')
      result.unallocated.forEach(item => {
        sections.push(`${item.code} ${formatAmount(item.amount)}`)
      })
      sections.push(`未配分合計 ${formatAmount(result.totalUnallocated)}`)
    }

    return sections.join('\n')
  }

  return (
    <div className="space-y-6">
      {/* プロフェッショナルサマリー */}
      <Card className="bg-gradient-to-r from-slate-800/80 to-blue-900/80 border-slate-600 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Award className="h-6 w-6 text-amber-400" />
            最適配分完了
          </CardTitle>
          <CardDescription className="text-slate-300">
            高精度アルゴリズムによる最適解を算出しました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-lg border border-blue-500/30">
              <div className="text-sm text-blue-300 font-medium mb-1">作成セット数</div>
              <div className="text-3xl font-bold text-white mb-1">
                {result.totalSets}
              </div>
              <div className="text-xs text-blue-400">
                効率: {result.efficiency}%
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-lg border border-emerald-500/30">
              <div className="text-sm text-emerald-300 font-medium mb-1">配分総額</div>
              <div className="text-xl font-bold text-white">
                {formatAmount(result.totalAllocated)}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-lg border border-amber-500/30">
              <div className="text-sm text-amber-300 font-medium mb-1">平均あまり</div>
              <div className="text-xl font-bold text-white">
                {formatAmount(Math.round(averageExcess))}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-slate-600/20 to-slate-800/20 rounded-lg border border-slate-500/30">
              <div className="text-sm text-slate-300 font-medium mb-1">未配分</div>
              <div className="text-xl font-bold text-white">
                {formatAmount(result.totalUnallocated)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作パネル */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-300">並び替え:</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-slate-900/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="index">作成順</SelectItem>
                  <SelectItem value="amount_desc">金額（高い順）</SelectItem>
                  <SelectItem value="amount_asc">金額（安い順）</SelectItem>
                  <SelectItem value="excess_asc">あまり（少ない順）</SelectItem>
                  <SelectItem value="excess_desc">あまり（多い順）</SelectItem>
                  <SelectItem value="efficiency_desc">効率（高い順）</SelectItem>
                  <SelectItem value="efficiency_asc">効率（低い順）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => onCopyAll(generateAllCopyText())}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
            >
              <Download className="h-4 w-4" />
              全配分をエクスポート
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* プロフェッショナルセット一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSets.map((set, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">
                  セット {index + 1}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopySet(generateSetCopyText(set, index))}
                  className="flex items-center gap-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Copy className="h-3 w-3" />
                  コピー
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-600/30">
                  {set.count}件
                </Badge>
                <Badge 
                  variant={set.excess <= targetAmount * 0.1 ? "default" : "outline"}
                  className={set.excess <= targetAmount * 0.1 
                    ? "bg-emerald-900/50 text-emerald-300 border-emerald-600/30" 
                    : "bg-amber-900/50 text-amber-300 border-amber-600/30"
                  }
                >
                  効率 {set.efficiency}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 金額サマリー */}
              <div className="p-3 bg-gradient-to-r from-slate-900/50 to-blue-900/30 rounded-lg border border-slate-600">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-300">合計金額</span>
                  <span className="font-bold text-emerald-400">
                    {formatAmount(set.sum)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">あまり</span>
                  <span className="text-sm font-semibold text-amber-400">
                    {formatAmount(set.excess)}
                  </span>
                </div>
              </div>

              {/* コード一覧 */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {set.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center text-sm p-2 bg-slate-900/30 rounded border border-slate-700">
                    <span className="font-mono text-xs text-slate-400">{item.code}</span>
                    <span className="font-semibold text-white">{formatAmount(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 未配分在庫 */}
      {result.unallocated.length > 0 && (
        <Card className="bg-slate-800/50 border-amber-600/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              未配分在庫
            </CardTitle>
            <CardDescription className="text-slate-400">
              目標金額に達しないため配分されなかったギフトコード
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg border border-amber-600/30 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-amber-300">未配分合計</span>
                <span className="text-lg font-bold text-amber-400">
                  {formatAmount(result.totalUnallocated)}
                </span>
              </div>
              <div className="text-sm text-amber-500 mt-1">
                {result.unallocated.length}件のコード
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {result.unallocated.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 bg-slate-900/30 rounded border border-slate-700">
                  <span className="font-mono text-xs text-slate-400">{item.code}</span>
                  <span className="font-semibold text-white">{formatAmount(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
