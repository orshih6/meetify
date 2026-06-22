import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { DuckDBStore } from '@mastra/duckdb'
import { MastraCompositeStore } from '@mastra/core/storage'
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter
} from '@mastra/observability'
import { weatherWorkflow } from './workflows/weather-workflow'
import { weatherAgent } from './agents/weather-agent'
import { meetingSummaryAgent } from './agents/meeting-summary-agent'
import { createLibSQLStore } from './storage'

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, meetingSummaryAgent },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: createLibSQLStore(),
    domains: {
      observability: await new DuckDBStore().getStore('observability')
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info'
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
          new MastraPlatformExporter() // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter() // Redacts sensitive data like passwords, tokens, keys
        ]
      }
    }
  })
})
