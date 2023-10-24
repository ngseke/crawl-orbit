export interface Schedule {
  timeout: NodeJS.Timeout
  callback: () => void
  interval: number
}

export class Schedular {
  group = new Map<number, Map<string, Schedule>>()

  addSchedule (
    id: number,
    taskKey: string,
    callback: () => void,
    interval: number
  ) {
    if (!this.group.has(id)) {
      this.group.set(id, new Map())
    }
    const tasks = this.group.get(id)
    if (!tasks) throw TypeError('tasks should be initialized first!')

    this.removeSchedule(id, taskKey)

    const timeout = setInterval(callback, interval)
    const schedule = { timeout, callback, interval }
    tasks.set(taskKey, schedule)
  }

  removeSchedule (id: number, taskKey: string) {
    const timeout = this.group.get(id)?.get(taskKey)
    clearInterval(timeout?.timeout)
    this.group.get(id)?.delete(taskKey)
  }

  restartSchedules (id: number) {
    const tasks = this.group.get(id)
    if (!tasks) return
    const oldTasks = new Map(tasks)
    oldTasks.forEach(({ callback, interval }, taskKey) => {
      this.removeSchedule(id, taskKey)
      this.addSchedule(id, taskKey, callback, interval)
      callback()
    })
  }
}
