import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { FIREBASE_CONFIG } from './constants'

export const firebaseApp = initializeApp(FIREBASE_CONFIG)
export const firebaseDatabase = getDatabase(firebaseApp)

export const auth = getAuth()
signInAnonymously(auth)

export function waitForAuthReady () {
  return new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve()
        unsubscribe()
      }
    })
  })
}
