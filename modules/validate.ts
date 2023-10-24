import { JSDOM } from 'jsdom'

const tenMinuteInMs = 1000 * 60 * 10
export const intervalMinimum = tenMinuteInMs

export function validateInterval (value: unknown) {
  const numericValue = Number(value)
  if (
    Number.isNaN(numericValue) ||
    !Number.isInteger(numericValue) ||
    numericValue <= 0
  ) {
    throw new TypeError('should be a valid positive integer!')
  }

  if (numericValue < intervalMinimum) {
    throw new TypeError(`should greater than ${intervalMinimum}!`)
  }

  return true
}

export function validateUrl (value: unknown) {
  try {
    return Boolean(new URL(String(value)))
  } catch (err) {
    throw new TypeError('invalid URL format!')
  }
}

export function validateSelector (value: unknown) {
  const maybeSelector = String(value)
  const dom = new JSDOM('')
  const document = dom.window.document

  try {
    document.querySelector(maybeSelector)
  } catch (err) {
    try {
      document.evaluate(maybeSelector, document, null, 7, null)
    } catch (err) {
      throw new TypeError('invalid selector format! it should be a CSS selector or an XPath expression.')
    }
  }

  return true
}
