import 'dotenv/config'
import { Db, MongoClient, ObjectId } from 'mongodb'

let clientInstance: MongoClient | null = null
let database: Db
let initPromise: Promise<Db> | null = null

export function getClient(): MongoClient {
  if (!clientInstance) {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/suwasetha_inventory?replicaSet=rs0'
    clientInstance = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })
  }
  return clientInstance
}

export const client = new Proxy({} as MongoClient, {
  get(_target, prop) {
    const instance = getClient() as any
    const value = instance[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  }
})

export async function initializeDatabase() {
  if (database) return database
  if (!initPromise) {
    initPromise = (async () => {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/suwasetha_inventory?replicaSet=rs0'
      const databaseName = process.env.MONGODB_DATABASE || 'suwasetha_inventory'
      const mongoClient = getClient()
      await mongoClient.connect()
      database = mongoClient.db(databaseName)
      await ensureIndexes()
      return database
    })().catch(err => {
      initPromise = null
      throw err
    })
  }
  return initPromise
}

export function db(): Db {
  if (!database) throw new Error('MongoDB has not been initialized.')
  return database
}

export const oid = (value: string | ObjectId) => value instanceof ObjectId ? value : new ObjectId(value)
export const id = (value: any) => String(value instanceof ObjectId ? value : value?._id ?? value?.id ?? value)

async function ensureIndexes() {
  const alerts = database.collection('alerts')
  const alertIndexes = await alerts.indexes().catch(() => [])
  const legacyAlertIndex = alertIndexes.find(index => index.name === 'batchId_1_type_1_checkpoint_1')
  if (legacyAlertIndex) await alerts.dropIndex(legacyAlertIndex.name!).catch(() => {})
  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('categories').createIndex({ nameEn: 1 }, { unique: true }),
    database.collection('suppliers').createIndex({ name: 1 }, { unique: true }),
    database.collection('medicines').createIndex({ code: 1 }, { unique: true }),
    database.collection('batches').createIndex({ medicineId: 1, batchNumber: 1 }, { unique: true }),
    database.collection('batches').createIndex({ medicineId: 1, status: 1, expiryDate: 1, availableQuantity: 1 }),
    database.collection('dispenseEntries').createIndex({ businessDate: 1 }),
    database.collection('stockMovements').createIndex({ createdAt: -1 }),
    alerts.createIndex({ medicineId: 1, type: 1, status: 1 }),
    alerts.createIndex(
      { batchId: 1, type: 1, checkpoint: 1 },
      { name: 'unique_batch_alert_checkpoint', unique: true, partialFilterExpression: { batchId: { $type: 'objectId' }, checkpoint: { $type: 'number' } } }
    ),
    database.collection('notificationSettings').createIndex({ profileId: 1 }, { unique: true }),
    database.collection('auditEvents').createIndex({ createdAt: -1 })
  ])
}

export const now = () => new Date()
