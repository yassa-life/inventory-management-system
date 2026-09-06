# MongoDB setup

## Local database

Stock issuing updates several batch and ledger documents atomically, so MongoDB must run as a replica set. On Windows with MongoDB Community Server installed, start and initialize the app's isolated one-node replica set:

```text
npm run db:start
npm run db:init
```

Use this local connection:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27018/suwasetha_inventory?replicaSet=rs0
```

The isolated data files are stored under `.mongodb/` and do not alter other databases in the normal MongoDB Windows service. Docker users can instead run `docker compose up -d` and use port `27017`.

In MongoDB Compass, create a connection with `mongodb://127.0.0.1:27018/?replicaSet=rs0`. Open the `suwasetha_inventory` database to see the application collections and records. A Compass connection to the default `27017` port shows the separate Windows-service databases instead.

Run `npm run db:seed` to create indexes and insert categories, medicines, batches, role accounts, and notification settings. The seed is idempotent and does not duplicate records.

## Existing MongoDB installation

Enable a replica set in the MongoDB configuration, restart MongoDB, and initialize it once with `rs.initiate()`. Use MongoDB Compass or `mongosh` to confirm the `rs0` replica set is healthy before starting the API.

## MongoDB Atlas

Create a dedicated Atlas project and cluster, add an application database user, restrict network access to the API host, and copy the `mongodb+srv://...` connection string into `MONGODB_URI`. Do not expose this URI to the React frontend or prefix it with `VITE_`.

Before real hospital use, enable automated backups, test a restore, configure monitoring and alerts, and document who owns database recovery.

## Collections

The application creates `users`, `categories`, `suppliers`, `medicines`, `batches`, `dispenseEntries`, `stockMovements`, `alerts`, `notificationSettings`, and `auditEvents`. Relationships use ObjectId references and are resolved by the API.
