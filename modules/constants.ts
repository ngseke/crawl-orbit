import packageJson from '../package.json'

import * as dotenv from 'dotenv'
dotenv.config()

export const VERSION = packageJson.version
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
export const FIREBASE_CONFIG = (() => {
  try {
    return JSON.parse(process.env.FIREBASE_CONFIG ?? '') ?? {}
  } catch (e) {
    return {}
  }
})()
