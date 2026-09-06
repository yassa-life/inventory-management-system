import { app } from '../server/index.ts'
import { initializeDatabase } from '../server/db.ts'
import { seed } from '../server/seed.ts'

let isDbInitialized = false

export default async function handler(req: any, res: any) {
  try {
    if (!isDbInitialized) {
      await initializeDatabase()
      await seed().catch(err => console.warn('Seed warning:', err.message))
      isDbInitialized = true
    }
    return app(req, res)
  } catch (error: any) {
    console.error('Vercel API DB Initialization Error:', error)
    return res.status(500).json({
      message: `Database Connection Error: ${error?.message || 'Could not connect to MongoDB Atlas.'}`
    })
  }
}
