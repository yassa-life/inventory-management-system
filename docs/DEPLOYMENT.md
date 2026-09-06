# Deployment guide

## Components

- `dist/` is the static React interface.
- `server/` is the Node API and the only component allowed to connect to MongoDB.

The browser must never receive `MONGODB_URI`, `JWT_SECRET`, or `RESEND_API_KEY`.

## Local verification

1. Start a MongoDB replica set.
2. Configure `.env` and run `npm run db:seed`.
3. Run `npm test` and `npm run build`.
4. Run `npm run dev` and test each role.

## Hosted environment

Deploy the frontend to Vercel with build command `npm run build` and output directory `dist`. Set `VITE_API_URL` to the HTTPS address of the separately hosted Node API.

Deploy the API to a Node 22 service with persistent environment variables and health checks. Set `MONGODB_URI` to a MongoDB Atlas or other managed MongoDB replica-set connection, use a unique production `JWT_SECRET`, and configure `CLIENT_ORIGIN` to the exact frontend origin. `/api/health` is the health-check endpoint.

Vercel Hobby is for personal/non-commercial use only. Use an approved business plan or other hospital-approved hosting before operational use.

## Go-live requirements

Require TLS, automated backups, a successful restore drill, application monitoring, verified email alerts, role-access tests, a named system owner, practitioner review of the catalogue, and a paper downtime procedure before treating the application as the authoritative stock record.
