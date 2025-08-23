// Lightweight calculator service for arithmetic expressions
// Supports +, -, *, /, ^, parentheses, and percentages. Also recognizes basic word operators.

function normalizeExpression(input: string): string | null {
  let s = input.trim().toLowerCase()

  // Remove a leading wake word like "calc" or "calculate"
  s = s.replace(/^\s*(calc(ulate)?|compute|evaluate)\s*/i, '')

  // Remove common question prefixes
  s = s.replace(/^\s*(what(?:'s| is)\s+)?/i, '')

  // Replace word operators with symbols
  s = s
    .replace(/plus/gi, '+')
    .replace(/minus/gi, '-')
    .replace(/times|x|multiplied\s+by/gi, '*')
    .replace(/divided\s+by|over/gi, '/')

  // Exponent phrases
  // "12 squared" -> "12 ** 2"
  s = s.replace(/(\d+(?:\.\d+)?)\s*squared\b/gi, '($1**2)')
  // "12 cubed" -> "12 ** 3"
  s = s.replace(/(\d+(?:\.\d+)?)\s*cubed\b/gi, '($1**3)')
  // "12 to the power of 3" -> "12 ** 3"
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:to\s+the\s+power\s+of|power|raised\s+to)\s*(\d+(?:\.\d+)?)/gi, '($1**$2)')

  // Roots
  // "square root of 9" -> "(9)**0.5"
  s = s.replace(/square\s+root\s+of\s*(\d+(?:\.\d+)?)/gi, '($1)**0.5')
  // "cube root of 27" -> "(27)**(1/3)"
  s = s.replace(/cube\s+root\s+of\s*(\d+(?:\.\d+)?)/gi, '($1)**(1/3)')

  // Normalize 'percent' keyword to '%'
  s = s.replace(/percent\b/gi, '%')

  // Convert 'x% of y' into '(x/100)*y' (with or without spaces, and allow parentheses)
  s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, '($1/100)*$2')
  s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*\(([^)]+)\)/gi, '($1/100)*($2)')

  // Handle percentage: 12.5% => (12.5/100)
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')

  // Interpret 'of' as multiplication ONLY when surrounded by numeric/paren tokens
  // e.g., '(0.125) of 240' -> '(0.125) * 240'
  s = s.replace(/(?<=[)\d])\s*of\s*(?=[(\d])/gi, '*')

  // Remove thousands separators
  s = s.replace(/(?<=\d),(?=\d)/g, '')

  // Replace caret with JS exponentiation
  s = s.replace(/\^/g, '**')

  // If the entire input is not math-y but a sentence, try to extract an expression portion
  // Keep digits, operators, parentheses and dots/commas
  const maybe = s.match(/[\d\s()+\-*/.,**]+/g)?.join('') || s
  const expr = maybe.replace(/,/g, '')

  // Validate allowed characters strictly
  if (!/^[\d\s()+\-*/.**]+$/.test(expr)) return null

  return expr
}

export function getCalcResult(raw: string): string {
  try {
    const expr = normalizeExpression(raw)
    if (!expr) return 'Please provide a valid arithmetic expression.'

    // Basic sanity: ensure at least one operator
    if (!/[+\-*/]|\*\*/.test(expr)) {
      // If it's just a number, echo it back
      const num = Number(expr.trim())
      if (Number.isFinite(num)) return String(num)
      return 'Please provide a valid arithmetic expression.'
    }

    // Safe eval: new Function with prior strict whitelist
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${expr});`)
    const val = fn()

    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return 'That expression did not evaluate to a finite number.'
    }

    // Format: up to 6 decimals, trim trailing zeros
    const formatted = Number(val.toFixed(6)).toString()
    return `${expr.replace(/\*\*/g, '^')} = ${formatted}`
  } catch (e) {
    return 'I could not evaluate that expression. Check parentheses and operators.'
  }
}
