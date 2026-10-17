// src/lib/mongodb.ts
// One connection, reused across warm serverless invocations. Only read when something needs the database,
// so the site builds and the games run with no database configured.

import { MongoClient, type Db } from 'mongodb'

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not defined')
  // In development, keep one across hot reloads.
  if (process.env.NODE_ENV === 'development') {
    global._mongoClientPromise ||= new MongoClient(uri).connect()
    return global._mongoClientPromise
  }
  global._mongoClientPromise ||= new MongoClient(uri).connect()
  return global._mongoClientPromise
}

export async function getDb(): Promise<Db> {
  return (await client()).db(process.env.MONGODB_DB || 'pradeep-site')
}
