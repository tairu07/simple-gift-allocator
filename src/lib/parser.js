// テキスト解析ライブラリ - ギフトコードの貼り付けテキストを解析

/**
 * 貼り付けられたテキストからギフトコードと金額を抽出
 * @param {string} rawText 貼り付けられたテキスト
 * @returns {Object} 解析結果
 */
export function parseGiftCodeText(rawText) {
  console.log('Raw input text:', rawText)
  
  // より柔軟な前処理 - ブラウザでの貼り付けを考慮
  let processedText = rawText
    .replace(/\r\n/g, '\n')  // Windows改行を統一
    .replace(/\r/g, '\n')    // Mac改行を統一
    .trim()

  console.log('Processed text:', processedText)
  
  // 改行がない場合、Xで始まるパターンで強制分割
  if (!processedText.includes('\n')) {
    // スペース区切りでXから始まる16桁パターンを検出して分割
    processedText = processedText.replace(/(\s+)(X[A-Z0-9]{15})/g, '\n$2')
  }
  
  const lines = processedText
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  console.log('Split lines:', lines)

  const codes = []
  const seenCodes = new Set()
  let duplicateCount = 0

  lines.forEach((line, index) => {
    const parsed = parseSingleLine(line, index + 1)
    
    if (parsed.isValid) {
      // 重複チェック
      if (seenCodes.has(parsed.code)) {
        parsed.isValid = false
        parsed.error = '重複したコードです'
        duplicateCount++
      } else {
        seenCodes.add(parsed.code)
      }
    }
    
    codes.push(parsed)
  })

  const validCodes = codes.filter(c => c.isValid)
  const totalAmount = validCodes.reduce((sum, c) => sum + c.amount, 0)

  return {
    codes,
    totalAmount,
    validCount: validCodes.length,
    invalidCount: codes.length - validCodes.length,
    duplicateCount
  }
}

/**
 * 単一行からギフトコードと金額を抽出
 */
function parseSingleLine(line, lineNumber) {
  console.log(`Parsing line ${lineNumber}:`, line)
  
  // より柔軟なパターン - 様々な形式に対応
  const patterns = [
    // "X9D5YZT5787Y57PG    ¥50,000" 形式（複数スペース対応）
    /([A-Z0-9]{16})\s+¥([0-9,]+)/i,
    // "X9D5YZT5787Y57PG¥50,000" 形式（スペースなし）
    /([A-Z0-9]{16})¥([0-9,]+)/i,
    // "X9D5YZT5787Y57PG 50,000" 形式（¥なし）
    /([A-Z0-9]{16})\s+([0-9,]+)/i,
    // 非常に柔軟なパターン（16桁英数字と数字を抽出）
    /([A-Z0-9]{16}).*?([0-9,]+)/i,
  ]

  for (const pattern of patterns) {
    const match = line.match(pattern)
    if (match) {
      const code = match[1].toUpperCase()
      const amountStr = match[2].replace(/,/g, '')
      const amount = parseInt(amountStr, 10)

      console.log(`Matched: code=${code}, amount=${amount}`)

      // バリデーション
      if (!isValidGiftCode(code)) {
        return {
          code,
          amount,
          lineNumber,
          isValid: false,
          error: 'ギフトコードの形式が正しくありません'
        }
      }

      if (!isValidAmount(amount)) {
        return {
          code,
          amount,
          lineNumber,
          isValid: false,
          error: '金額が正しくありません'
        }
      }

      return {
        code,
        amount,
        lineNumber,
        isValid: true
      }
    }
  }

  console.log(`No match for line: ${line}`)
  return {
    code: '',
    amount: 0,
    lineNumber,
    isValid: false,
    error: `認識できない形式です: ${line.substring(0, 50)}...`
  }
}

/**
 * ギフトコードの形式をバリデーション
 */
function isValidGiftCode(code) {
  // 16桁の英数字
  return /^[A-Z0-9]{16}$/i.test(code)
}

/**
 * 金額の妥当性をチェック
 */
function isValidAmount(amount) {
  // 正の整数で、一般的なギフトカード金額の範囲内（上限を200,000に拡張）
  return Number.isInteger(amount) && amount > 0 && amount <= 200000
}

/**
 * コードをマスク表示用に変換
 * @param {string} code ギフトコード
 * @param {boolean} showFull 全体を表示するか
 * @returns {string} マスクされたコード
 */
export function maskGiftCode(code, showFull = false) {
  if (showFull || code.length <= 4) {
    return code
  }
  
  // 最初の2文字と最後の2文字を表示、中間をマスク
  const start = code.substring(0, 2)
  const end = code.substring(code.length - 2)
  const maskLength = code.length - 4
  const mask = '*'.repeat(maskLength)
  
  return `${start}${mask}${end}`
}

/**
 * 金額をフォーマット
 */
export function formatAmount(amount) {
  return `¥${amount.toLocaleString()}`
}
