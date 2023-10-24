export interface CrawlTarget {
  selector: string
  matchString?: string
}

export interface CrawlOptions {
  url: string
  targets: CrawlTarget[]
}
