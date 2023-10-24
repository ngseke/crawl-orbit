import { TELEGRAM_BOT_TOKEN } from './constants'
import { Schedular } from './Schedular'
import { Telegram } from './Telegram'
import { Database } from './database'
import { waitForAuthReady } from './firebase'
import { crawlJsdom } from './crawlJsdom'
import { type Task } from '../types/Task'

export class CrawlOrbit {
  schedular = new Schedular()
  database = new Database()
  telegram: Telegram

  constructor () {
    this.telegram = new Telegram(TELEGRAM_BOT_TOKEN, {
      onAddTask: this.handleAddTask.bind(this),
    })
  }

  generateJob (chatId: number, taskKey: string, task: Task) {
    const job = async () => {
      const { isMatched } = await crawlJsdom({
        url: task.url,
        targets: task.targets,
      })

      if (isMatched) {
        await this.telegram.sendMatchedMessage(chatId, task)
        this.schedular.removeSchedule(chatId, taskKey)
        this.database.removeTask(chatId, taskKey)
      }
    }

    return job
  }

  async start () {
    await waitForAuthReady()

    this.telegram.startListener()
    const group = await this.database.getEntireTasks() ?? {}
    Object.entries(group).forEach(([idString, tasks]) => {
      const chatId = Number(idString)
      Object.entries(tasks).forEach(([taskKey, task]) => {
        const job = this.generateJob(chatId, taskKey, task)
        this.schedular.addSchedule(chatId, taskKey, job, task.interval)
      })
      this.schedular.restartSchedules(chatId)
    })
  }

  async handleAddTask (chatId: number, task: Task) {
    const taskKey = await this.database.addTask(chatId, task)
    if (!taskKey) throw new Error('couldn\'t get `taskId`')

    const job = this.generateJob(chatId, taskKey, task)
    this.schedular.addSchedule(chatId, taskKey, job, task.interval)
    this.schedular.restartSchedules(chatId)
  }
}
