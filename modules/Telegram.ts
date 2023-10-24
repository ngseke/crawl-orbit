import { taskJsonExample, type Task, validateTaskJson } from './Task'
import TelegramBot from 'node-telegram-bot-api'
import { validateInterval, validateSelector, validateUrl } from './validate'
import { bold, code, italic, pre, underline } from './html'
import { VERSION } from './constants'
import { intervalInlineKeyboard, targetSelectorInlineKeyboard } from './keyboard'

type StateType =
  | 'default'
  | 'addTaskJson'
  | 'addTaskAskName'
  | 'addTaskAskUrl'
  | 'addTaskAskTarget'
  | 'addTaskAskTargetMatchString'
  | 'addTaskAskInterval'
  | 'addTaskReview'

interface State {
  type: StateType
  taskDraft?: Partial<Task>
}

interface Listeners {
  onAddTask?: (id: number, task: Task) => Promise<void>
}

enum Command {
  Start = '/start',
  Create = '/create',
  CreateJson = '/createjson',
  Skip = '/skip',
  Save = '/save',
  Yes = '/yes',
  No = '/no',
  Abort = '/abort',
  Exit = '/exit',
  Quit = '/quit'
}

export class Telegram {
  bot: TelegramBot
  stateMachine = new Map<number, State>()

  listeners: Listeners

  constructor (token: string, listeners: Listeners = {}) {
    this.bot = new TelegramBot(token, { polling: true })
    this.listeners = listeners
  }

  startListener () {
    const { bot } = this

    bot.on('text', async (message) => {
      const chatId = message.chat.id
      const text = message.text?.trim() ?? ''
      this.handleMessage(chatId, text)
    })

    bot.on('callback_query', async (query) => {
      this.handleQuery(query)
    })
  }

  async sendHtmlMessage (chatId: number, message: string) {
    if (!message.trim()) return
    return await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
  }

  async sendMatchedMessage (chatId: number, task: Task) {
    const lines = [
      '🪐 Matched!',
      '',
      `URL: ${bold(task.url)}`,
      `Targets: ${code(JSON.stringify(task.targets))}`,
    ]

    await this.sendHtmlMessage(chatId, lines.join('\n'))
  }

  private clearTaskDraft (chatId: number) {
    const state = this.getState(chatId)
    delete state.taskDraft
  }

  private initTaskDraft (chatId: number) {
    const state = this.getState(chatId)
    state.taskDraft = {}
  }

  private getState (chatId: number) {
    const { stateMachine } = this
    if (!stateMachine.has(chatId)) {
      stateMachine.set(chatId, { type: 'default' })
    }

    const state = stateMachine.get(chatId)
    if (!state) throw new Error('`state` should be initiate first!')
    return state
  }

  private getTaskDraft (chatId: number) {
    const state = this.getState(chatId)

    const { taskDraft } = state
    if (!taskDraft) throw new Error('`taskDraft` should be initiated first!')
    return taskDraft
  }

  private async handleSaveTargets (chatId: number) {
    const state = this.getState(chatId)
    if (!state.taskDraft?.targets?.length) {
      await this.sendHtmlMessage(chatId, '🚫 Must have at least 1 target.')
      await this.sendCurrentStateQuestion(chatId)
      return false
    }
    await this.sendCurrentTaskDraftPreview(chatId)

    state.type = 'addTaskReview'
    await this.sendCurrentStateQuestion(chatId)
  }

  private async handleMessage (chatId: number, message: string) {
    const send = (message: string) => this.sendHtmlMessage(chatId, message)
    const state = this.getState(chatId)

    if (([
      Command.Start,
      Command.Abort,
      Command.Exit,
      Command.Quit,
    ] as string[]).includes(message)) {
      state.type = 'default'
      this.clearTaskDraft(chatId)
      await this.sendCurrentStateQuestion(chatId)
      return
    }

    if (message === Command.Create) {
      state.type = 'addTaskAskName'
      this.clearTaskDraft(chatId)

      await send(`[${italic(`type ${bold(Command.Abort)} to discard the draft and exit.`)}]`)
      await this.sendCurrentStateQuestion(chatId)
      this.initTaskDraft(chatId)
      return
    }

    if (message === Command.CreateJson) {
      state.type = 'addTaskJson'
      this.clearTaskDraft(chatId)

      await send(`[${italic(`type ${bold(Command.Abort)} to discard the draft and exit.`)}]`)
      await this.sendCurrentStateQuestion(chatId)
      this.initTaskDraft(chatId)
      return
    }

    if (state.type === 'addTaskJson') {
      try {
        validateTaskJson(message)
        state.taskDraft = { ...JSON.parse(message) }
        await this.sendCurrentTaskDraftPreview(chatId)
        state.type = 'addTaskReview'
        await this.sendCurrentStateQuestion(chatId)
      } catch (err) {
        await send((err as Error).message)
      }
      return
    }

    const taskDraft = this.getTaskDraft(chatId)

    if (state.type === 'addTaskAskName') {
      taskDraft.name = message
      await this.sendCurrentTaskDraftPreview(chatId)

      state.type = 'addTaskAskUrl'
      await this.sendCurrentStateQuestion(chatId)
      return
    }

    if (state.type === 'addTaskAskUrl') {
      try {
        validateUrl(message)
        taskDraft.url = message
        await this.sendCurrentTaskDraftPreview(chatId)

        state.type = 'addTaskAskInterval'
        await this.sendCurrentStateQuestion(chatId)
      } catch (err) {
        await send((err as Error).message)
      }
      return
    }

    if (state.type === 'addTaskAskInterval') {
      try {
        validateInterval(message)
        taskDraft.interval = Number(message)
        await this.sendCurrentTaskDraftPreview(chatId)

        state.type = 'addTaskAskTarget'
        await this.sendCurrentStateQuestion(chatId)
      } catch (err) {
        await send((err as Error).message)
      }
      return
    }

    if (state.type === 'addTaskAskTarget') {
      taskDraft.targets ??= []
      if (message === Command.Save) {
        await this.handleSaveTargets(chatId)
        return
      }

      try {
        validateSelector(message)
        taskDraft.targets.push({ selector: message })
        await this.sendCurrentTaskDraftPreview(chatId)

        state.type = 'addTaskAskTargetMatchString'
        await this.sendCurrentStateQuestion(chatId)
      } catch (err) {
        await send((err as Error).message)
      }

      return
    }

    if (state.type === 'addTaskAskTargetMatchString') {
      if (!taskDraft.targets) throw new Error('`taskDraft.targets` should be initiated first!')
      const lastTarget = taskDraft.targets?.at(-1)

      if (!lastTarget) throw new Error('can\'t find `lastTarget`!')

      if (message === Command.Skip) {
        state.type = 'addTaskAskTarget'
        await this.sendCurrentTaskDraftPreview(chatId)
        await this.sendCurrentStateQuestion(chatId)
        return
      }

      if (message === Command.Save) {
        await this.handleSaveTargets(chatId)
        return
      }

      lastTarget.matchString = message
      await this.sendCurrentTaskDraftPreview(chatId)

      state.type = 'addTaskAskTarget'
      await this.sendCurrentStateQuestion(chatId)
      return
    }

    if (state.type === 'addTaskReview') {
      if (message === Command.Yes) {
        await this.listeners.onAddTask?.(chatId, taskDraft as Task)
        state.type = 'default'
        this.clearTaskDraft(chatId)
        await send('✅ created Successfully!')
      } else if (message === Command.No) {
        state.type = 'default'
        this.clearTaskDraft(chatId)
        await this.sendCurrentStateQuestion(chatId)
      }
      return
    }

    if (message.startsWith('/')) {
      await send('unknown command!')
      return
    }

    await this.sendCurrentStateQuestion(chatId)
  }

  private async handleQuery (query: TelegramBot.CallbackQuery) {
    const chatId = query.message?.chat.id ?? 0
    const data = query.data ?? ''
    await this.bot.answerCallbackQuery(query.id)

    const send = (message: string) => this.sendHtmlMessage(chatId, message)
    const state = this.getState(chatId)
    const taskDraft = this.getTaskDraft(chatId)

    if (state.type === 'addTaskAskInterval') {
      try {
        validateInterval(data)
        taskDraft.interval = Number(data)
        await this.sendCurrentTaskDraftPreview(chatId)

        state.type = 'addTaskAskTarget'
        await this.sendCurrentStateQuestion(chatId)
      } catch (err) {
        await send((err as Error).message)
      }
      return
    }

    if (state.type === 'addTaskAskTarget') {
      taskDraft.targets ??= []
      if (data === Command.Save) {
        await this.handleSaveTargets(chatId)
        return
      }

      try {
        validateSelector(data)
        taskDraft.targets.push({ selector: data })
        await this.sendCurrentTaskDraftPreview(chatId)

        state.type = 'addTaskAskTargetMatchString'
        await this.sendCurrentStateQuestion(chatId)
      } catch (err) {
        await send((err as Error).message)
      }
    }
  }

  async sendCurrentStateQuestion (chatId: number) {
    const state = this.getState(chatId)
    const lines: string[] = []

    if (state.type === 'default') {
      lines.push(
        `  ˗ˏˋ [  ${italic(bold('Crawl Orbit'))}  ] ˎˊ˗  (v${VERSION})`,
        '',
        `${bold(Command.Create)} - Create a new task`,
        `${bold(Command.CreateJson)} - Create a new task in JSON format`,
      )
    }

    if (state.type === 'addTaskJson') {
      lines.push(
        '💬 Please provide your task in JSON format as following:',
        pre(taskJsonExample)
      )
    }

    if (state.type === 'addTaskAskName') {
      lines.push('💬 Name?', '')
    }

    if (state.type === 'addTaskAskUrl') {
      lines.push('💬 URL?', '')
    }

    if (state.type === 'addTaskAskInterval') {
      await this.bot.sendMessage(chatId, '💬 Interval? (in ms)', {
        reply_markup: {
          inline_keyboard: intervalInlineKeyboard,
        },
      })
      return
    }

    const targetFinishTip = `[${italic(`type ${bold(Command.Save)} to finish`)}]`
    const blank = underline('___?___')

    if (state.type === 'addTaskAskTarget') {
      const message = [
        '💬 Target?',
        ` ┌ ${bold(`Selector: ${blank}`)} ☚`,
        ' └ Match String: _______',
        '',
      ].join('\n')

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: targetSelectorInlineKeyboard,
        },
      })
      return
    }

    if (state.type === 'addTaskAskTargetMatchString') {
      lines.push(
        '💬 Target?',
        ' ┌ Selector: _______',
        ` └ ${bold(`Match String: ${blank}`)} ☚`,
        '',
        `[${italic(`type ${bold(Command.Skip)} to skip`)}]`,
        targetFinishTip
      )
    }

    if (state.type === 'addTaskReview') {
      lines.push(
        '💬 Confirm to create this task?',
        `${bold(Command.Yes)}`,
        `${bold(Command.No)} - Discard the draft`,
      )
    }

    await this.sendHtmlMessage(chatId, lines.join('\n'))
  }

  async sendCurrentTaskDraftPreview (chatId: number) {
    const send = (message: string) => this.sendHtmlMessage(chatId, message)
    const state = this.stateMachine.get(chatId)

    if (!state) {
      return await send('`state` not found')
    }

    const { taskDraft } = state
    if (!taskDraft) {
      return await send('`taskDraft` not found')
    }

    const lines: string[] = []

    if (taskDraft.name) {
      lines.push(`✓ Name: ${code(taskDraft.name)}`)
    }

    if (taskDraft.url) {
      lines.push(`✓ URL: ${code(taskDraft.url)}`)
    }

    if (taskDraft.interval) {
      lines.push(`✓ Interval: ${code(taskDraft.interval)}`)
    }

    if (taskDraft.targets) {
      lines.push(
        '✓ Target:',
        ...taskDraft.targets.map(({ selector, matchString }, index) => {
          const lines: string[] = [` ${bold(`#${index}`)}`]
          if (matchString) {
            lines.push(
              ` ├ Selector: ${code(selector)}`,
              ` └ Match String: ${code(matchString)}`
            )
          } else {
            lines.push(
              ` └ Selector: ${code(selector)}`
            )
          }
          return lines
        }).flat(1)
      )
    }

    await this.sendHtmlMessage(chatId, lines.join('\n'))
  }
}
