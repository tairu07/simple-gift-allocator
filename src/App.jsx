import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Copy, Calculator, Target, Zap, BarChart3, Diamond, TrendingUp } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* プロフェッショナルヘッダー */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-slate-600 rounded-xl shadow-lg">
              <Diamond className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              ギフトコード配分マスター
            </h1>
          </div>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            高精度アルゴリズムによる最適配分システム - プロフェッショナルな効率性を実現
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>動的計画法</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>最適化エンジン</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>高速処理</span>
            </div>
          </div>
        </div>

        {/* 入力・設定セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Copy className="h-5 w-5 text-blue-400" />
                データ入力
              </CardTitle>
              <CardDescription className="text-slate-400">
                ギフトコードと金額をテキストで入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="例:&#10;X9D5YZT5787Y57PG ¥50,000&#10;XAB123CD456EF789 ¥30,000&#10;..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] font-mono text-sm bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleParseText}
                  disabled={!inputText.trim() || isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  解析実行
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClear}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  クリア
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5 text-emerald-400" />
                配分設定
              </CardTitle>
              <CardDescription className="text-slate-400">
                各セットの目標金額を設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">¥</span>
                <Input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="text-lg font-semibold bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              
              {parsedCodes.length > 0 && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-600 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">在庫総額:</span>
                    <span className="font-semibold text-emerald-400">{formatAmount(totalParsedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">理論上限:</span>
                    <span className="font-semibold text-blue-400">{theoreticalMax}セット</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">効率予測:</span>
                    <span className="font-semibold text-amber-400">最適化実行中...</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBatchAllocation}
                disabled={parsedCodes.length === 0 || isProcessing}
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                最適配分を実行
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 解析結果表示 */}
        {parsedCodes.length > 0 && !batchResult && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">解析結果</CardTitle>
              <CardDescription className="text-slate-400">
                {parsedCodes.length}件のギフトコードを認識しました
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-900/50 to-slate-900/50 rounded-lg border border-slate-600">
                  <span className="font-medium text-slate-300">合計金額</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatAmount(totalParsedAmount)}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {parsedCodes.map((code, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-900/30 rounded text-sm border border-slate-700">
                      <span className="font-mono text-slate-400">{maskGiftCode(code.code)}</span>
                      <span className="font-semibold text-white">{formatAmount(code.amount)}</span>
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

        {/* プロフェッショナルフッター */}
        <div className="text-center py-6 text-slate-400 text-sm border-t border-slate-700">
          <p className="mb-2">高精度動的計画法アルゴリズム搭載 - エンタープライズグレードの最適化エンジン</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span>© 2025 ギフトコード配分マスター</span>
            <span>•</span>
            <span>Professional Edition</span>
            <span>•</span>
            <span>Powered by Advanced AI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
