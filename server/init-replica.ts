import { MongoClient } from 'mongodb'

const host = '127.0.0.1'
const port = 27018
const client = new MongoClient(`mongodb://${host}:${port}/?directConnection=true`, {
  serverSelectionTimeoutMS: 8000,
})

try {
  await client.connect()
  const admin = client.db('admin')
  try {
    await admin.command({ replSetGetStatus: 1 })
    console.log('MongoDB replica set is already initialized.')
  } catch (error: any) {
    if (error?.codeName !== 'NotYetInitialized') throw error
    await admin.command({
      replSetInitiate: {
        _id: 'rs0',
        members: [{ _id: 0, host: `${host}:${port}` }],
      },
    })
    console.log('MongoDB replica set initialized.')
  }
} finally {
  await client.close()
}
