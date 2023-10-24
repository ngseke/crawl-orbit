import { type CrawlTarget } from './CrawlOptions'

export interface Task {
  name: string
  url: string
  targets: CrawlTarget[]
  interval: number
  createdAt: number
}
