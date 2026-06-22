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
import { meetingSummaryAgent } from './agents/meeting-summary-agent'
import { meetingTitleAgent } from './agents/meeting-title-agent'
import { createLibSQLStore } from './storage'

export const mastra = new Mastra({
  agents: { meetingSummaryAgent, meetingTitleAgent },
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
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()]
      }
    }
  })
})
