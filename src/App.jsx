import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Copy, Calculator, Gift, Target } from 'lucide-react'
import { parseGiftCodeText, formatAmount, maskGiftCode } from './lib/parser.js'
import { bestComboDP } from './lib/allocator.js'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [targetAmount, setTargetAmount] = useState(158000)
  const [parsedCodes, setParsedCodes] = useState([])
  const [allocation, setAllocation] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // テキスト解析処理
  const handleParseText = () => {
    if (!inputText.trim()) return
    
    setIsProcessing(true)
    try {
      const result = parseGiftCodeText(inputText)
      setParsedCodes(result.codes.filter(c => c.isValid))
      setAllocation(null) // 前回の配分結果をクリア
    } catch (error) {
      console.error('解析エラー:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 最適配分計算
  const handleCalculateAllocation = () => {
    if (parsedCodes.length === 0) return
    
    setIsProcessing(true)
    try {
      const pool = parsedCodes.map(code => ({
        code: code.code,
        amount: code.amount
      }))
      
      const result = bestComboDP(pool, targetAmount, true)
      setAllocation(result)
    } catch (error) {
      console.error('配分計算エラー:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 結果をクリップボードにコピー
  const handleCopyResult = () => {
    if (!allocation || allocation.items.length === 0) return
    
    const resultText = allocation.items
      .map(item => `${item.code} ${formatAmount(item.amount)}`)
      .join('\n')
    
    navigator.clipboard.writeText(resultText)
  }

  // クリア処理
  const handleClear = () => {
    setInputText('')
    setParsedCodes([])
    setAllocation(null)
  }

  const totalParsedAmount = parsedCodes.reduce((sum, code) => sum + code.amount, 0)
  const diffAmount = allocation ? allocation.diff : 0
  const diffPercentage = allocation ? ((Math.abs(diffAmount) / targetAmount) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Appleギフトコード最適配分ツール
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ギフトコードを貼り付けて、指定した金額に最も近い組み合わせを自動で見つけます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 入力セクション */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  ギフトコード入力
                </CardTitle>
                <CardDescription>
                  ギフトコードと金額をテキストで貼り付けてください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="例:&#10;X9D5YZT5787Y57PG ¥50,000&#10;XAB123CD456EF789 ¥30,000&#10;..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleParseText}
                    disabled={!inputText.trim() || isProcessing}
                    className="flex-1"
                  >
                    解析実行
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleClear}
                  >
                    クリア
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  目標金額設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">¥</span>
                  <Input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="text-lg font-semibold"
                  />
                </div>
                <Button 
                  onClick={handleCalculateAllocation}
                  disabled={parsedCodes.length === 0 || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  最適配分を計算
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 結果セクション */}
          <div className="space-y-6">
            {/* 解析結果 */}
            {parsedCodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>解析結果</CardTitle>
                  <CardDescription>
                    {parsedCodes.length}件のギフトコードを認識しました
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">合計金額</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatAmount(totalParsedAmount)}
                      </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {parsedCodes.map((code, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span className="font-mono">{maskGiftCode(code.code)}</span>
                          <span className="font-semibold">{formatAmount(code.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 配分結果 */}
            {allocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    最適配分結果
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyResult}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      コピー
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* サマリー */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">配分金額</div>
                        <div className="text-lg font-bold text-green-700">
                          {formatAmount(allocation.sum)}
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm text-orange-600 font-medium">
                          誤差 ({diffPercentage}%)
                        </div>
                        <div className="text-lg font-bold text-orange-700">
                          {diffAmount >= 0 ? '+' : ''}{formatAmount(diffAmount)}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 選択されたコード一覧 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">選択されたギフトコード</h4>
                        <Badge variant="secondary">
                          {allocation.count}件
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {allocation.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-mono text-sm">{item.code}</span>
                            <span className="font-semibold">{formatAmount(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="text-center py-6 text-gray-500 text-sm">
          <p>動的計画法による最適解アルゴリズムを使用しています</p>
        </div>
      </div>
    </div>
  )
}

export default App
