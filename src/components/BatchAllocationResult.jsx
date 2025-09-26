import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Copy, Package, TrendingUp, AlertCircle, Download } from 'lucide-react'
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
      {/* サマリー情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            一括配分結果
          </CardTitle>
          <CardDescription>
            在庫全体を目標金額以上のセットに自動分割しました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">作成セット数</div>
              <div className="text-2xl font-bold text-blue-700">
                {result.totalSets}
              </div>
              <div className="text-xs text-blue-500">
                理論上限: {result.theoreticalMax} ({result.efficiency}%)
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">配分総額</div>
              <div className="text-lg font-bold text-green-700">
                {formatAmount(result.totalAllocated)}
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">平均あまり</div>
              <div className="text-lg font-bold text-orange-700">
                {formatAmount(Math.round(averageExcess))}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">未配分</div>
              <div className="text-lg font-bold text-gray-700">
                {formatAmount(result.totalUnallocated)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ソート・操作パネル */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">並び替え:</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              全配分をコピー
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* セット一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSets.map((set, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  セット{index + 1}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopySet(generateSetCopyText(set, index))}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  コピー
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {set.count}件
                </Badge>
                <Badge variant={set.excess <= targetAmount * 0.1 ? "default" : "outline"}>
                  効率 {set.efficiency}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 金額サマリー */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">合計金額</span>
                  <span className="font-bold text-green-600">
                    {formatAmount(set.sum)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">あまり</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {formatAmount(set.excess)}
                  </span>
                </div>
              </div>

              {/* コード一覧 */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {set.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center text-sm p-2 bg-white rounded border">
                    <span className="font-mono text-xs">{item.code}</span>
                    <span className="font-semibold">{formatAmount(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 未配分在庫 */}
      {result.unallocated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              未配分在庫
            </CardTitle>
            <CardDescription>
              目標金額に達しないため配分されなかったギフトコード
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-orange-50 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-orange-700">未配分合計</span>
                <span className="text-lg font-bold text-orange-700">
                  {formatAmount(result.totalUnallocated)}
                </span>
              </div>
              <div className="text-sm text-orange-600 mt-1">
                {result.unallocated.length}件のコード
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {result.unallocated.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span className="font-mono text-xs">{item.code}</span>
                  <span className="font-semibold">{formatAmount(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
