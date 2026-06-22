import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { LibSQLStore } from '@mastra/libsql'
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
import { transcriptionAgent } from './agents/transcription-agent'
import { transcriptionRoutes } from './routes/transcription-routes'
import { chatRoute } from '@mastra/ai-sdk'

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, transcriptionAgent },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: 'file:./mastra.db'
    }),
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
  }),
  server: {
    cors: {
      origin: '*', // Restrict this to your app's origin in production
      allowMethods: ['*'],
      allowHeaders: ['*']
    },
    apiRoutes: [
      chatRoute({
        path: '/chat/:agentId'
      }),
      ...transcriptionRoutes
    ]
  }
})
