import { type CrawlTarget } from '../types/CrawlOptions'
import { code } from './html'
import { intervalMinimum, validateSelector } from './validate'
import Ajv, { type JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

export interface Task {
  name: string
  url: string
  interval: number
  targets: CrawlTarget[]
  createdAt?: number
}

export const taskJsonExample = `
{
  "name": "My task",
  "url": "https://google.com",
  "interval": 3600000,
  "targets": [
    {
      "selector": "div",
      "matchString": "Gmail"
    }
  ]
}`

const ajv = new Ajv()
addFormats(ajv)
ajv.addKeyword({
  keyword: 'selectorOrXpath',
  schemaType: 'boolean',
  type: 'string',
  validate: (value: boolean, data: string) => {
    try {
      validateSelector(data)
    } catch (err) {
      return false
    }
    return true
  },
})

const taskSchema: JSONSchemaType<Task> = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    url: { type: 'string', format: 'uri' },
    interval: { type: 'integer', minimum: intervalMinimum },
    targets: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['selector'],
        properties: {
          selector: { type: 'string', selectorOrXpath: true },
          matchString: { type: 'string', nullable: true },
        },
      },
    },
    createdAt: { type: 'number', nullable: true },
  },
  required: ['name', 'interval', 'url', 'targets'],
  additionalProperties: false,
}

export function validateTaskJson (value: string) {
  let parsed
  try {
    parsed = JSON.parse(value) as Task
  } catch (err) {
    throw new Error('it should be a valid JSON string!')
  }

  const validate = ajv.compile(taskSchema)
  if (!validate(parsed)) {
    throw new Error(
      validate.errors?.map(
        error => `${code(error.instancePath)}: ${error.message}`
      ).join('\n')
    )
  }

  return true
}
