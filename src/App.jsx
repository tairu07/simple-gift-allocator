import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Copy, Calculator, Gift, Target, Zap } from 'lucide-react'
import { parseGiftCodeText, formatAmount, maskGiftCode } from './lib/parser.js'
import { batchAllocate } from './lib/batch-allocator.js'
import { BatchAllocationResult } from './components/BatchAllocationResult.jsx'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [targetAmount, setTargetAmount] = useState(158000)
  const [parsedCodes, setParsedCodes] = useState([])
  const [batchResult, setBatchResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // テキスト解析処理
  const handleParseText = () => {
    if (!inputText.trim()) return
    
    setIsProcessing(true)
    try {
      const result = parseGiftCodeText(inputText)
      setParsedCodes(result.codes.filter(c => c.isValid))
      setBatchResult(null) // 前回の配分結果をクリア
    } catch (error) {
      console.error('解析エラー:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 一括配分計算
  const handleBatchAllocation = () => {
    if (parsedCodes.length === 0) return
    
    setIsProcessing(true)
    try {
      const pool = parsedCodes.map(code => ({
        code: code.code,
        amount: code.amount
      }))
      
      console.log('一括配分開始:', { pool: pool.length, target: targetAmount })
      const result = batchAllocate(pool, targetAmount)
      console.log('一括配分完了:', result)
      setBatchResult(result)
    } catch (error) {
      console.error('配分計算エラー:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // セット単位でのコピー
  const handleCopySet = (text) => {
    navigator.clipboard.writeText(text)
    console.log('セットをコピーしました')
  }

  // 全配分のコピー
  const handleCopyAll = (text) => {
    navigator.clipboard.writeText(text)
    console.log('全配分をコピーしました')
  }

  // クリア処理
  const handleClear = () => {
    setInputText('')
    setParsedCodes([])
    setBatchResult(null)
  }

  const totalParsedAmount = parsedCodes.reduce((sum, code) => sum + code.amount, 0)
  const theoreticalMax = totalParsedAmount > 0 ? Math.floor(totalParsedAmount / targetAmount) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Appleギフトコード最適配分ツール
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            ギフトコードを貼り付けて、指定した金額以上のセットを在庫が続く限り自動で作成します
          </p>
        </div>

        {/* 入力・設定セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <CardDescription>
                各セットの最低金額を設定してください
              </CardDescription>
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
              
              {parsedCodes.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>在庫総額:</span>
                    <span className="font-semibold">{formatAmount(totalParsedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>理論上限:</span>
                    <span className="font-semibold">{theoreticalMax}セット</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBatchAllocation}
                disabled={parsedCodes.length === 0 || isProcessing}
                className="w-full"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                一括配分を実行
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 解析結果表示 */}
        {parsedCodes.length > 0 && !batchResult && (
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

        {/* 一括配分結果表示 */}
        {batchResult && (
          <BatchAllocationResult
            result={batchResult}
            targetAmount={targetAmount}
            onCopySet={handleCopySet}
            onCopyAll={handleCopyAll}
          />
        )}

        {/* フッター */}
        <div className="text-center py-6 text-gray-500 text-sm">
          <p>動的計画法による最適解アルゴリズムで在庫全体を効率的に配分します</p>
        </div>
      </div>
    </div>
  )
}

export default App
