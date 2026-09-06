# Suwasetha Indigenous Medicine Inventory

A bilingual English/Sinhala inventory application backed entirely by MongoDB. It tracks medicines by batch and expiry, deducts outgoing stock using FEFO, warns about low or expiring stock, applies staff roles, and preserves a movement history.

## Stack

- React and Vite responsive interface
- Node/Express API
- MongoDB with the official Node.js driver
- JWT login with bcrypt password hashes
- Optional Resend email alerts

## Quick start

1. Install Node.js 22+ and MongoDB 7+.
2. On Windows, run `npm run db:start` and `npm run db:init` to start the included isolated local replica-set instance. Docker users can run `docker compose up -d` instead.
3. Copy `.env.example` to `.env`, then replace the JWT secret and administrator values.
4. Run `npm install`, `npm run db:seed`, and `npm run dev`.
5. Open `http://localhost:5173` and sign in with the administrator configured in `.env`.

The seed command creates the collections, indexes and dummy catalogue when they are missing. No SQL database or Supabase connection is used.

This is an inventory system only—not a patient record, diagnosis, prescription, or clinical-decision system. An authorized practitioner must review sample names, Sinhala spelling, units, and reorder levels before real use.

See [MongoDB setup](docs/MONGODB_SETUP.md), [deployment](docs/DEPLOYMENT.md), and [operations](docs/OPERATIONS.md).
