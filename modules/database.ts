import { ref, set, get, push, child } from 'firebase/database'
import { firebaseDatabase } from './firebase'
import { type Task } from '../types/Task'

export class Database {
  tasksRef = ref(firebaseDatabase, 'tasks')

  async addTask (id: number, task: Task) {
    const ref = child(this.tasksRef, String(id))
    const { key } = await push(ref, task)
    return key
  }

  async removeTask (id: number, taskKey: string) {
    const ref = child(child(this.tasksRef, String(id)), taskKey)
    await set(ref, null)
  }

  async getTasks (id: number) {
    const ref = child(this.tasksRef, String(id))
    const snippet = await get(ref)
    return snippet.val() as Record<string, Task>
  }

  async getEntireTasks () {
    const snippet = await get(this.tasksRef)
    return snippet.val() as Record<string, Record<string, Task>>
  }
}
