import { app } from '../server/index.ts'
import { initializeDatabase } from '../server/db.ts'
import { seed } from '../server/seed.ts'

let isDbInitialized = false

export default async function handler(req: any, res: any) {
  if (!isDbInitialized) {
    await initializeDatabase()
    await seed()
    isDbInitialized = true
  }
  return app(req, res)
}
