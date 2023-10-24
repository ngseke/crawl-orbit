export function validateInterval (value: unknown) {
  const min = 5000
  const numericValue = Number(value)
  if (
    Number.isNaN(numericValue) ||
    !Number.isInteger(numericValue) ||
    numericValue <= 0
  ) {
    throw new TypeError('should be a valid positive integer!')
  }

  if (numericValue < min) {
    throw new TypeError(`should greater than ${min}!`)
  }
}

export function validateUrl (value: unknown) {
  try {
    return new URL(String(value))
  } catch (err) {
    throw new TypeError('invalid URL format!')
  }
}
