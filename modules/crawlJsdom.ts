import axios from 'axios'
import { JSDOM } from 'jsdom'
import { type CrawlOptions } from '../types/CrawlOptions'

export async function crawlJsdom ({
  url,
  targets,
}: CrawlOptions) {
  const html = String((await axios.get(url)).data)
  const dom = new JSDOM(html)
  const document = dom.window.document

  function getElementsBySelector (selector: string) {
    try {
      return document.querySelectorAll(selector)
    } catch (e) {
      return null
    }
  }

  function getElementsByXPath (xpath: string) {
    try {
      const results = []
      const query = document.evaluate(xpath, document, null, 7, null)
      for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i))
      }
      return results
    } catch (e) {
      return null
    }
  }

  let isMatched = false
  for (const { selector, matchString } of targets) {
    const rawNodes =
      getElementsBySelector(selector) ??
      getElementsByXPath(selector)
    if (!rawNodes) continue

    const nodes = [...rawNodes]
      .filter((node): node is Exclude<typeof node, null> => Boolean(node))
    if (!nodes.length) continue

    isMatched = nodes
      .some(node => !matchString || node.textContent?.includes(matchString))

    if (isMatched) break
  }

  return { isMatched }
}
