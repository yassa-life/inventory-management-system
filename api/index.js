// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
import { differenceInCalendarDays, format } from "date-fns";
import { z } from "zod";

// server/db.ts
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
var clientInstance = null;
var database;
var initPromise = null;
function getClient() {
  if (!clientInstance) {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27018/suwasetha_inventory?replicaSet=rs0";
    clientInstance = new MongoClient(uri, { serverSelectionTimeoutMS: 1e4 });
  }
  return clientInstance;
}
var client = new Proxy({}, {
  get(_target, prop) {
    const instance = getClient();
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  }
});
async function initializeDatabase() {
  if (database) return database;
  if (!initPromise) {
    initPromise = (async () => {
      const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27018/suwasetha_inventory?replicaSet=rs0";
      const databaseName = process.env.MONGODB_DATABASE || "suwasetha_inventory";
      const mongoClient = getClient();
      await mongoClient.connect();
      database = mongoClient.db(databaseName);
      await ensureIndexes();
      return database;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
function db() {
  if (!database) throw new Error("MongoDB has not been initialized.");
  return database;
}
var oid = (value) => value instanceof ObjectId ? value : new ObjectId(value);
var id = (value) => String(value instanceof ObjectId ? value : value?._id ?? value?.id ?? value);
async function ensureIndexes() {
  const alerts = database.collection("alerts");
  const alertIndexes = await alerts.indexes().catch(() => []);
  const legacyAlertIndex = alertIndexes.find((index) => index.name === "batchId_1_type_1_checkpoint_1");
  if (legacyAlertIndex) await alerts.dropIndex(legacyAlertIndex.name).catch(() => {
  });
  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("categories").createIndex({ nameEn: 1 }, { unique: true }),
    database.collection("suppliers").createIndex({ name: 1 }, { unique: true }),
    database.collection("medicines").createIndex({ code: 1 }, { unique: true }),
    database.collection("batches").createIndex({ medicineId: 1, batchNumber: 1 }, { unique: true }),
    database.collection("batches").createIndex({ medicineId: 1, status: 1, expiryDate: 1, availableQuantity: 1 }),
    database.collection("dispenseEntries").createIndex({ businessDate: 1 }),
    database.collection("stockMovements").createIndex({ createdAt: -1 }),
    alerts.createIndex({ medicineId: 1, type: 1, status: 1 }),
    alerts.createIndex(
      { batchId: 1, type: 1, checkpoint: 1 },
      { name: "unique_batch_alert_checkpoint", unique: true, partialFilterExpression: { batchId: { $type: "objectId" }, checkpoint: { $type: "number" } } }
    ),
    database.collection("notificationSettings").createIndex({ profileId: 1 }, { unique: true }),
    database.collection("auditEvents").createIndex({ createdAt: -1 })
  ]);
}
var now = () => /* @__PURE__ */ new Date();

// server/seed.ts
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";

// server/seed-data.ts
var categories = [
  ["Raw herbs / materials", "\u0D85\u0DB8\u0DD4 \u0D96\u0DC2\u0DB0 \u0DAF\u0DCA\u200D\u0DBB\u0DC0\u0DCA\u200D\u0DBA"],
  ["Choorna / powders", "\u0DA0\u0DD6\u0DBB\u0DCA\u0DAB / \u0D9A\u0DD4\u0DA9\u0DD4"],
  ["Tablets, capsules & pills", "\u0DB4\u0DD9\u0DAD\u0DD2, \u0D9A\u0DD0\u0DB4\u0DCA\u0DC3\u0DD2\u0DBA\u0DD4\u0DBD \u0DC3\u0DC4 \u0D9C\u0DD4\u0DBD\u0DD2"],
  ["Arishta & Asava", "\u0D85\u0DBB\u0DD2\u0DC2\u0DCA\u0DA7 \u0DC3\u0DC4 \u0D86\u0DC3\u0DC0"],
  ["Kwatha / Kashaya", "\u0D9A\u0DCA\u0DC0\u0DCF\u0DAE / \u0D9A\u0DC2\u0DCF\u0DBA"],
  ["Syrups", "\u0DC3\u0DD2\u0DBB\u0DB4\u0DCA"],
  ["Thaila / medicated oils", "\u0DAD\u0DDB\u0DBD / \u0D96\u0DC2\u0DB0\u0DD3\u0DBA \u0DAD\u0DD9\u0DBD\u0DCA"],
  ["Ghrita / medicated ghee", "\u0D9D\u0DD8\u0DAD / \u0D96\u0DC2\u0DB0\u0DD3\u0DBA \u0D9C\u0DD2\u0DAD\u0DD9\u0DBD\u0DCA"],
  ["Kalka, Leha & Modaka", "\u0D9A\u0DBD\u0DCA\u0D9A, \u0DBD\u0DDA\u0DC4 \u0DC3\u0DC4 \u0DB8\u0DDD\u0DAF\u0D9A"],
  ["Lepa / topical preparations", "\u0DBD\u0DDA\u0DB4 / \u0DB6\u0DCF\u0DC4\u0DD2\u0DBB \u0D86\u0DBD\u0DDA\u0DB4\u0DB1"],
  ["Gugul / resin preparations", "\u0D9C\u0DD4\u0D9C\u0DD4\u0DBD\u0DCA \u0DC3\u0D82\u0DBA\u0DDD\u0D9C"],
  ["Rasa preparations", "\u0DBB\u0DC3 \u0D96\u0DC2\u0DB0"],
  ["Balms, ointments & creams", "\u0DB6\u0DCF\u0DB8\u0DCA, \u0DB8\u0DBD\u0DB8\u0DCA \u0DC3\u0DC4 \u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DB8\u0DCA"],
  ["Peyawa / herbal drinks", "\u0DB4\u0DDA\u0DBA\u0DCF\u0DC0 / \u0D96\u0DC2\u0DB0\u0DD3\u0DBA \u0DB4\u0DCF\u0DB1\u0DBA\u0DB1\u0DCA"]
];
var medicines = [
  ["ARI-001", "Abhayarishtaya", "\u0D85\u0DB7\u0DBA\u0DCF\u0DBB\u0DD2\u0DC2\u0DCA\u0DA7\u0DBA", 4, "mL", 1e3],
  ["ARI-002", "Ashokarishtaya", "\u0D85\u0DC1\u0DDD\u0D9A\u0DCF\u0DBB\u0DD2\u0DC2\u0DCA\u0DA7\u0DBA", 4, "mL", 900],
  ["ARI-003", "Balarishtaya", "\u0DB6\u0DBD\u0DCF\u0DBB\u0DD2\u0DC2\u0DCA\u0DA7\u0DBA", 4, "mL", 800],
  ["ARI-004", "Dasamoolarishtaya", "\u0DAF\u0DC1\u0DB8\u0DD6\u0DBD\u0DCF\u0DBB\u0DD2\u0DC2\u0DCA\u0DA7\u0DBA", 4, "mL", 1e3],
  ["CHO-001", "Avipaththikara Choornaya", "\u0D85\u0DC0\u0DD2\u0DB4\u0DAD\u0DCA\u0DAD\u0DD2\u0D9A\u0DBB \u0DA0\u0DD6\u0DBB\u0DCA\u0DAB\u0DBA", 2, "g", 500],
  ["CHO-002", "Seethopaladi Choornaya", "\u0DC3\u0DD3\u0DAD\u0DDD\u0DB4\u0DBD\u0DCF\u0DAF\u0DD2 \u0DA0\u0DD6\u0DBB\u0DCA\u0DAB\u0DBA", 2, "g", 500],
  ["CHO-003", "Sudarshana Choornaya", "\u0DC3\u0DD4\u0DAF\u0DBB\u0DCA\u0DC1\u0DB1 \u0DA0\u0DD6\u0DBB\u0DCA\u0DAB\u0DBA", 2, "g", 400],
  ["CHO-004", "Thripala Choornaya", "\u0DAD\u0DCA\u200D\u0DBB\u0DD2\u0DB5\u0DBD\u0DCF \u0DA0\u0DD6\u0DBB\u0DCA\u0DAB\u0DBA", 2, "g", 600],
  ["TAB-001", "Aralu Tablets", "\u0D85\u0DBB\u0DC5\u0DD4 \u0DB4\u0DD9\u0DAD\u0DD2", 3, "tablet", 100],
  ["TAB-002", "Thripala Pethi", "\u0DAD\u0DCA\u200D\u0DBB\u0DD2\u0DB5\u0DBD\u0DCF \u0DB4\u0DD9\u0DAD\u0DD2", 3, "tablet", 120],
  ["CAP-001", "Suwadarani Capsules", "\u0DC3\u0DD4\u0DC0\u0DB0\u0DBB\u0DAB\u0DD3 \u0D9A\u0DD0\u0DB4\u0DCA\u0DC3\u0DD2\u0DBA\u0DD4\u0DBD", 3, "capsule", 100],
  ["SYR-001", "Dharani Syrup", "\u0DB0\u0DBB\u0DAB\u0DD3 \u0DC3\u0DD2\u0DBB\u0DB4\u0DCA", 6, "mL", 800],
  ["SYR-002", "Kantakari Syrup", "\u0D9A\u0DA7\u0D9A\u0DCF\u0DBB\u0DD3 \u0DC3\u0DD2\u0DBB\u0DB4\u0DCA", 6, "mL", 700],
  ["SYR-003", "Wasaka Syrup", "\u0DC0\u0DCF\u0DC3\u0D9A \u0DC3\u0DD2\u0DBB\u0DB4\u0DCA", 6, "mL", 900],
  ["THA-001", "Narayana Thailaya", "\u0DB1\u0DCF\u0DBB\u0DCF\u0DBA\u0DAB \u0DAD\u0DDB\u0DBD\u0DBA", 7, "mL", 600],
  ["THA-002", "Neelyadi Thailaya", "\u0DB1\u0DD3\u0DBD\u0DCA\u200D\u0DBA\u0DCF\u0DAF\u0DD2 \u0DAD\u0DDB\u0DBD\u0DBA", 7, "mL", 500],
  ["THA-003", "Pinda Thailaya", "\u0DB4\u0DD2\u0DAB\u0DCA\u0DA9 \u0DAD\u0DDB\u0DBD\u0DBA", 7, "mL", 500],
  ["THA-004", "Nirgundiyadi Thailaya", "\u0DB1\u0DD2\u0DBB\u0DCA\u0D9C\u0DD4\u0DAB\u0DCA\u0DA9\u0DCA\u200D\u0DBA\u0DCF\u0DAF\u0DD2 \u0DAD\u0DDB\u0DBD\u0DBA", 7, "mL", 500],
  ["LEH-001", "Chawanaprasha Lehaya", "\u0DA0\u0DC0\u0DB1\u0DB4\u0DCA\u200D\u0DBB\u0DCF\u0DC1 \u0DBD\u0DDA\u0DC4\u0DBA", 9, "g", 500],
  ["LEH-002", "Wasawa Lehaya", "\u0DC0\u0DCF\u0DC3\u0DCF\u0DC0 \u0DBD\u0DDA\u0DC4\u0DBA", 9, "g", 400],
  ["GUG-001", "Gokshuradi Gugul", "\u0D9C\u0DDD\u0D9A\u0DCA\u0DC2\u0DD4\u0DBB\u0DCF\u0DAF\u0DD2 \u0D9C\u0DD4\u0D9C\u0DD4\u0DBD\u0DCA", 11, "pill", 150],
  ["GUG-002", "Kanchanara Gugul", "\u0D9A\u0DCF\u0D82\u0DA0\u0DB1\u0DCF\u0DBB \u0D9C\u0DD4\u0D9C\u0DD4\u0DBD\u0DCA", 11, "pill", 120],
  ["GUG-003", "Yogaraja Gugul", "\u0DBA\u0DDD\u0D9C\u0DBB\u0DCF\u0DA2 \u0D9C\u0DD4\u0D9C\u0DD4\u0DBD\u0DCA", 11, "pill", 120],
  ["KAL-001", "Buddharaja Kalkaya", "\u0DB6\u0DD4\u0DAF\u0DCA\u0DB0\u0DBB\u0DCF\u0DA2 \u0D9A\u0DBD\u0DCA\u0D9A\u0DBA", 9, "g", 350],
  ["LEP-001", "Lakshadi Lepaya", "\u0DBD\u0DCF\u0D9A\u0DCA\u0DC2\u0DCF\u0DAF\u0DD2 \u0DBD\u0DDA\u0DB4\u0DBA", 10, "g", 300],
  ["PEY-001", "Paspanguwa / Peyawa", "\u0DB4\u0DC3\u0DCA\u0DB4\u0D82\u0D9C\u0DD4\u0DC0 / \u0DB4\u0DDA\u0DBA\u0DCF\u0DC0", 14, "packet", 80]
];

// server/seed.ts
async function seed() {
  await initializeDatabase();
  const database2 = db(), categoryIds = [];
  await database2.collection("medicines").updateMany({ baseUnit: "gram" }, { $set: { baseUnit: "g", updatedAt: now() } });
  await database2.collection("medicines").updateMany({ baseUnit: "millilitre" }, { $set: { baseUnit: "mL", updatedAt: now() } });
  for (const [nameEn, nameSi] of categories) {
    await database2.collection("categories").updateOne({ nameEn }, { $setOnInsert: { nameEn, nameSi, active: true, createdAt: now(), updatedAt: now() } }, { upsert: true });
    categoryIds.push((await database2.collection("categories").findOne({ nameEn }))._id);
  }
  await database2.collection("suppliers").updateOne({ name: "Sri Lanka Ayurvedic Drugs Corporation" }, { $setOnInsert: { name: "Sri Lanka Ayurvedic Drugs Corporation", phone: "011 285 0229", active: true, createdAt: now(), updatedAt: now() } }, { upsert: true });
  const supplier = await database2.collection("suppliers").findOne({ name: "Sri Lanka Ayurvedic Drugs Corporation" });
  for (const [code, nameEn, nameSi, categoryNumber, baseUnit, reorderThreshold] of medicines) {
    await database2.collection("medicines").updateOne({ code }, { $setOnInsert: { code, nameEn, nameSi, categoryId: categoryIds[Number(categoryNumber) - 1], baseUnit, reorderThreshold: Number(reorderThreshold), active: true, createdAt: now(), updatedAt: now() } }, { upsert: true });
    const medicine = await database2.collection("medicines").findOne({ code });
    if (!await database2.collection("batches").findOne({ medicineId: medicine._id })) {
      const index = Number(categoryNumber) + code.charCodeAt(code.length - 1), expiry = index % 8 === 0 ? addDays(now(), 6) : index % 7 === 0 ? addDays(now(), 28) : addDays(now(), 180 + index * 7), quantity = index % 6 === 0 ? Number(reorderThreshold) * 0.7 : Number(reorderThreshold) * 3;
      await database2.collection("batches").insertOne({ medicineId: medicine._id, supplierId: supplier._id, batchNumber: `DEMO-${code}-01`, receivedQuantity: quantity, availableQuantity: quantity, receivedDate: addDays(now(), -30), expiryDate: expiry, status: "available", createdAt: now(), updatedAt: now() });
    }
  }
  const users = [[process.env.ADMIN_NAME || "System Administrator", process.env.ADMIN_EMAIL || "admin@suwasetha.local", process.env.ADMIN_PASSWORD || "ChangeMe123!", "administrator", "en"], ["Kasun Silva", "store@suwasetha.local", "Storekeeper123!", "storekeeper", "en"], ["Nimali Perera", "dispense@suwasetha.local", "Dispenser123!", "dispenser", "si"], ["Ayesha Fernando", "audit@suwasetha.local", "Auditor123!", "auditor", "en"]];
  for (const [name, email, password, role, preferredLanguage] of users) {
    if (!await database2.collection("users").findOne({ email })) {
      const result = await database2.collection("users").insertOne({ name, email, passwordHash: await bcrypt.hash(password, 12), role, preferredLanguage, active: true, mustChangePassword: true, createdAt: now(), updatedAt: now() });
      if (role === "administrator" || role === "storekeeper") await database2.collection("notificationSettings").insertOne({ profileId: result.insertedId, lowStockEmail: true, expiryEmail: true, createdAt: now(), updatedAt: now() });
    }
  }
}
if (process.argv[1]?.endsWith("seed.ts")) seed().then(async () => {
  console.log("MongoDB seed complete");
  await client.close();
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

// server/stock.ts
function allocateFefo(batches, requested, businessDate) {
  if (!Number.isFinite(requested) || requested <= 0) throw new Error("Quantity must be greater than zero.");
  const usable = batches.filter((b) => b.status === "available" && b.expiryDate >= businessDate && b.available > 0).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate) || String(a.id).localeCompare(String(b.id)));
  const total = usable.reduce((sum, b) => sum + b.available, 0);
  if (total < requested) throw new Error(`Only ${total} units are available.`);
  let remaining = requested;
  const result = [];
  for (const batch of usable) {
    if (remaining <= 0) break;
    const quantity = Math.min(batch.available, remaining);
    result.push({ batchId: batch.id, quantity });
    remaining -= quantity;
  }
  return result;
}

// server/index.ts
var app = express();
var port = Number(process.env.API_PORT || 4e3);
var jwtSecret = process.env.JWT_SECRET || "development-only-secret-change-me";
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "100kb" }));
var today = () => format(now(), "yyyy-MM-dd");
function auth(req, res, next) {
  try {
    req.user = jwt.verify(req.headers.authorization?.replace(/^Bearer\s+/i, ""), jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: "Please sign in again." });
  }
}
function roles(...allowed) {
  return (req, res, next) => allowed.includes(req.user.role) ? next() : res.status(403).json({ message: "You do not have permission for this action." });
}
function publicDoc(value) {
  if (!value) return null;
  const copy = { ...value, id: id(value) };
  delete copy._id;
  delete copy.passwordHash;
  return copy;
}
async function medicineRows() {
  const database2 = db(), medicines2 = await database2.collection("medicines").find({ active: true }).sort({ nameEn: 1 }).toArray(), categories2 = await database2.collection("categories").find().toArray(), batches = await database2.collection("batches").find({ medicineId: { $in: medicines2.map((m) => m._id) } }).toArray(), suppliers = await database2.collection("suppliers").find().toArray();
  return medicines2.map((m) => {
    const own = batches.filter((b) => id(b.medicineId) === id(m)), usable = own.filter((b) => b.status === "available" && new Date(b.expiryDate) >= /* @__PURE__ */ new Date(`${today()}T00:00:00`) && b.availableQuantity > 0), available = usable.reduce((sum, b) => sum + Number(b.availableQuantity), 0), nearest = [...usable].sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate))[0]?.expiryDate, category = categories2.find((c) => id(c) === id(m.categoryId));
    return { ...publicDoc(m), Category: publicDoc(category), batches: own.map((b) => ({ ...publicDoc(b), Supplier: publicDoc(suppliers.find((s) => id(s) === id(b.supplierId))) })), available, nearestExpiry: nearest || null, lowStock: available <= Number(m.reorderThreshold) };
  });
}
async function alertRows() {
  const database2 = db(), alerts = await database2.collection("alerts").find().sort({ createdAt: -1 }).toArray(), medicines2 = await database2.collection("medicines").find().toArray(), batches = await database2.collection("batches").find().toArray();
  return alerts.map((a) => ({ ...publicDoc(a), Medicine: publicDoc(medicines2.find((m) => id(m) === id(a.medicineId))), Batch: publicDoc(batches.find((b) => id(b) === id(a.batchId))) }));
}
async function movementRows(limit = 250) {
  const database2 = db(), movements = await database2.collection("stockMovements").find().sort({ createdAt: -1 }).limit(limit).toArray(), batches = await database2.collection("batches").find({ _id: { $in: movements.map((m) => m.batchId) } }).toArray(), medicines2 = await database2.collection("medicines").find().toArray(), users = await database2.collection("users").find().toArray();
  return movements.map((m) => {
    const batch = batches.find((b) => id(b) === id(m.batchId)), medicine = medicines2.find((x) => id(x) === id(batch?.medicineId)), user = users.find((u) => id(u) === id(m.performedBy));
    return { ...publicDoc(m), Batch: batch ? { ...publicDoc(batch), Medicine: publicDoc(medicine) } : null, User: publicDoc(user) };
  });
}
async function ensureAlerts() {
  const database2 = db(), rows = await medicineRows();
  for (const med of rows) {
    if (med.lowStock) {
      if (!await database2.collection("alerts").findOne({ medicineId: oid(med.id), type: "low_stock", status: { $ne: "resolved" } })) await database2.collection("alerts").insertOne({ medicineId: oid(med.id), type: "low_stock", message: `${med.nameEn} is at ${med.available} ${med.baseUnit}; reorder level is ${med.reorderThreshold}.`, status: "unread", emailStatus: "pending", createdAt: now(), updatedAt: now() });
    } else await database2.collection("alerts").updateMany({ medicineId: oid(med.id), type: "low_stock", status: { $ne: "resolved" } }, { $set: { status: "resolved", updatedAt: now() } });
    for (const batch of med.batches) {
      if (Number(batch.availableQuantity) <= 0) continue;
      const days = differenceInCalendarDays(new Date(batch.expiryDate), now()), checkpoint = days < 0 ? 0 : days <= 7 ? 7 : days <= 30 ? 30 : days <= 90 ? 90 : null;
      if (days < 0 && batch.status !== "expired") await database2.collection("batches").updateOne({ _id: oid(batch.id) }, { $set: { status: "expired", updatedAt: now() } });
      if (checkpoint !== null) {
        const type = checkpoint === 0 ? "expired" : "expiring";
        if (!await database2.collection("alerts").findOne({ batchId: oid(batch.id), type, checkpoint })) await database2.collection("alerts").insertOne({ medicineId: oid(med.id), batchId: oid(batch.id), type, checkpoint, message: checkpoint === 0 ? `${med.nameEn} batch ${batch.batchNumber} has expired.` : `${med.nameEn} batch ${batch.batchNumber} expires in ${days} day${days === 1 ? "" : "s"}.`, status: "unread", emailStatus: "pending", createdAt: now(), updatedAt: now() });
      }
    }
  }
  void sendPendingAlertEmails();
}
async function sendPendingAlertEmails() {
  const key = process.env.RESEND_API_KEY, from = process.env.ALERT_FROM_EMAIL, recipients = (process.env.ALERT_RECIPIENTS || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!key || !from || !recipients.length) return;
  const collection = db().collection("alerts"), pending = await collection.find({ emailStatus: "pending", status: { $ne: "resolved" } }).limit(20).toArray();
  for (const alert of pending) {
    try {
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `inventory-alert-${id(alert)}` }, body: JSON.stringify({ from, to: recipients, reply_to: process.env.ALERT_REPLY_TO || void 0, subject: `Suwasetha inventory: ${alert.type.replace("_", " ")}`, text: `${alert.message}

Open ${process.env.APP_BASE_URL || "the inventory system"} to review this alert.` }) });
      if (!response.ok) throw new Error(await response.text());
      await collection.updateOne({ _id: alert._id }, { $set: { emailStatus: "sent", updatedAt: now() } });
    } catch (error) {
      await collection.updateOne({ _id: alert._id }, { $set: { emailStatus: "failed", updatedAt: now() } });
      console.error("Alert email failed:", error.message);
    }
  }
}
app.get("/api/health", (_req, res) => res.json({ ok: true, database: "mongodb" }));
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body), user = await db().collection("users").findOne({ email: body.email.toLowerCase() });
    if (!user || !user.active || !await bcrypt2.compare(body.password, user.passwordHash)) return res.status(401).json({ message: "Invalid email or password." });
    const safe = { id: id(user), role: user.role, email: user.email, name: user.name, preferredLanguage: user.preferredLanguage, mustChangePassword: user.mustChangePassword };
    res.json({ token: jwt.sign(safe, jwtSecret, { expiresIn: "8h" }), user: safe });
  } catch (e) {
    next(e);
  }
});
app.get("/api/me", auth, (req, res) => res.json(req.user));
app.get("/api/medicines", auth, async (_req, res, next) => {
  try {
    res.json(await medicineRows());
  } catch (e) {
    next(e);
  }
});
app.get("/api/categories", auth, async (_req, res, next) => {
  try {
    res.json((await db().collection("categories").find({ active: true }).sort({ nameEn: 1 }).toArray()).map(publicDoc));
  } catch (e) {
    next(e);
  }
});
var medicineInput = z.object({ code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()), nameEn: z.string().trim().min(2).max(150), nameSi: z.string().trim().min(1).max(150), categoryId: z.string().min(1), baseUnit: z.enum(["kg", "g", "L", "mL", "tablet", "capsule", "pill", "bottle", "packet", "jar", "tube"]), reorderThreshold: z.coerce.number().nonnegative(), active: z.boolean().optional() });
app.post("/api/medicines", auth, roles("administrator", "storekeeper"), async (req, res, next) => {
  try {
    const body = medicineInput.parse(req.body), category = await db().collection("categories").findOne({ _id: oid(body.categoryId) });
    if (!category) return res.status(400).json({ message: "Category not found." });
    const document = { ...body, categoryId: category._id, active: body.active ?? true, createdAt: now(), updatedAt: now() }, result = await db().collection("medicines").insertOne(document);
    await db().collection("auditEvents").insertOne({ actorId: oid(req.user.id), action: "medicine.created", entityType: "medicine", entityId: id(result.insertedId), details: { code: document.code }, createdAt: now() });
    res.status(201).json({ ...publicDoc({ ...document, _id: result.insertedId }), Category: publicDoc(category), batches: [], available: 0, nearestExpiry: null, lowStock: true });
  } catch (e) {
    next(e);
  }
});
app.patch("/api/medicines/:id", auth, roles("administrator", "storekeeper"), async (req, res, next) => {
  try {
    const body = medicineInput.parse(req.body), category = await db().collection("categories").findOne({ _id: oid(body.categoryId) });
    if (!category) return res.status(400).json({ message: "Category not found." });
    const changes = { ...body, categoryId: category._id, active: body.active ?? true, updatedAt: now() }, result = await db().collection("medicines").findOneAndUpdate({ _id: oid(req.params.id) }, { $set: changes }, { returnDocument: "after" });
    if (!result) return res.status(404).json({ message: "Medicine not found." });
    await db().collection("auditEvents").insertOne({ actorId: oid(req.user.id), action: "medicine.updated", entityType: "medicine", entityId: id(result), details: { code: changes.code }, createdAt: now() });
    res.json({ ...publicDoc(result), Category: publicDoc(category) });
  } catch (e) {
    next(e);
  }
});
app.get("/api/dashboard", auth, async (_req, res, next) => {
  try {
    await ensureAlerts();
    const medicines2 = await medicineRows(), alerts = (await alertRows()).filter((a) => a.status !== "resolved").slice(0, 8), movements = await movementRows(8), issued = await db().collection("dispenseEntries").aggregate([{ $match: { businessDate: today() } }, { $group: { _id: null, total: { $sum: "$requestedQuantity" } } }]).toArray();
    res.json({ stats: { medicines: medicines2.length, lowStock: medicines2.filter((m) => m.lowStock).length, expiring: medicines2.filter((m) => m.nearestExpiry && differenceInCalendarDays(new Date(m.nearestExpiry), now()) <= 90).length, issuedToday: issued[0]?.total || 0 }, medicines: medicines2, alerts, movements });
  } catch (e) {
    next(e);
  }
});
app.post("/api/issues", auth, roles("administrator", "dispenser"), async (req, res, next) => {
  const session = client.startSession();
  try {
    const body = z.object({ medicineId: z.string().min(1), quantity: z.coerce.number().positive(), note: z.string().max(500).optional() }).parse(req.body);
    let created;
    await session.withTransaction(async () => {
      const database2 = db(), medicine = await database2.collection("medicines").findOne({ _id: oid(body.medicineId) }, { session });
      if (!medicine) throw new Error("Medicine not found.");
      const batches = await database2.collection("batches").find({ medicineId: medicine._id, status: "available", availableQuantity: { $gt: 0 }, expiryDate: { $gte: /* @__PURE__ */ new Date(`${today()}T00:00:00`) } }, { session }).sort({ expiryDate: 1, _id: 1 }).toArray(), allocations = allocateFefo(batches.map((b) => ({ id: id(b), available: b.availableQuantity, expiryDate: format(b.expiryDate, "yyyy-MM-dd"), status: b.status })), body.quantity, today()), entry = { medicineId: medicine._id, staffId: oid(req.user.id), requestedQuantity: body.quantity, businessDate: today(), note: body.note, createdAt: now() };
      const entryResult = await database2.collection("dispenseEntries").insertOne(entry, { session });
      created = { ...entry, id: id(entryResult.insertedId) };
      for (const allocation of allocations) {
        const batch = batches.find((b) => id(b) === String(allocation.batchId)), result = await database2.collection("batches").updateOne({ _id: batch._id, availableQuantity: { $gte: allocation.quantity } }, { $inc: { availableQuantity: -allocation.quantity }, $set: { updatedAt: now() } }, { session });
        if (result.modifiedCount !== 1) throw new Error("Stock changed while issuing. Please retry.");
        await database2.collection("stockMovements").insertOne({ batchId: batch._id, performedBy: oid(req.user.id), dispenseEntryId: entryResult.insertedId, type: "issue", quantityDelta: -allocation.quantity, note: body.note, createdAt: now() }, { session });
      }
    });
    await ensureAlerts();
    res.status(201).json(created);
  } catch (e) {
    next(e);
  } finally {
    await session.endSession();
  }
});
app.post("/api/receipts", auth, roles("administrator", "storekeeper"), async (req, res, next) => {
  const session = client.startSession();
  try {
    const body = z.object({ medicineId: z.string().min(1), supplierId: z.string().optional(), batchNumber: z.string().min(2).max(80), packCount: z.coerce.number().positive(), packSize: z.coerce.number().positive(), receivedDate: z.string(), expiryDate: z.string() }).parse(req.body);
    if (body.expiryDate <= body.receivedDate) return res.status(400).json({ message: "Expiry date must be after the received date." });
    const quantity = body.packCount * body.packSize;
    let batch;
    await session.withTransaction(async () => {
      const database2 = db(), document = { medicineId: oid(body.medicineId), supplierId: body.supplierId ? oid(body.supplierId) : void 0, batchNumber: body.batchNumber, receivedQuantity: quantity, availableQuantity: quantity, receivedDate: new Date(body.receivedDate), expiryDate: new Date(body.expiryDate), status: "available", createdAt: now(), updatedAt: now() }, result = await database2.collection("batches").insertOne(document, { session });
      batch = { ...document, id: id(result.insertedId) };
      await database2.collection("stockMovements").insertOne({ batchId: result.insertedId, performedBy: oid(req.user.id), type: "receipt", quantityDelta: quantity, note: `${body.packCount} packs \xD7 ${body.packSize}`, createdAt: now() }, { session });
      await database2.collection("auditEvents").insertOne({ actorId: oid(req.user.id), action: "stock.received", entityType: "batch", entityId: id(result.insertedId), details: { quantity }, createdAt: now() }, { session });
    });
    await ensureAlerts();
    res.status(201).json(batch);
  } catch (e) {
    next(e);
  } finally {
    await session.endSession();
  }
});
app.get("/api/suppliers", auth, async (_req, res, next) => {
  try {
    res.json((await db().collection("suppliers").find({ active: true }).sort({ name: 1 }).toArray()).map(publicDoc));
  } catch (e) {
    next(e);
  }
});
app.get("/api/movements", auth, async (_req, res, next) => {
  try {
    res.json(await movementRows());
  } catch (e) {
    next(e);
  }
});
app.get("/api/alerts", auth, async (_req, res, next) => {
  try {
    await ensureAlerts();
    res.json(await alertRows());
  } catch (e) {
    next(e);
  }
});
app.patch("/api/alerts/:id/acknowledge", auth, roles("administrator", "storekeeper"), async (req, res, next) => {
  try {
    await db().collection("alerts").updateOne({ _id: oid(req.params.id) }, { $set: { status: "acknowledged", acknowledgedAt: now(), updatedAt: now() } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
app.post("/api/auth/change-password", auth, async (req, res, next) => {
  try {
    const body = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, "Password must be at least 8 characters.") }).parse(req.body), user = await db().collection("users").findOne({ _id: oid(req.user.id) });
    if (!user || !await bcrypt2.compare(body.currentPassword, user.passwordHash)) return res.status(400).json({ message: "Current password is incorrect." });
    const newHash = await bcrypt2.hash(body.newPassword, 12);
    await db().collection("users").updateOne({ _id: user._id }, { $set: { passwordHash: newHash, mustChangePassword: false, updatedAt: now() } });
    await db().collection("auditEvents").insertOne({ actorId: user._id, action: "user.password_changed", entityType: "profile", entityId: id(user._id), details: { email: user.email }, createdAt: now() });
    const safe = { id: id(user), role: user.role, email: user.email, name: user.name, preferredLanguage: user.preferredLanguage, mustChangePassword: false };
    res.json({ token: jwt.sign(safe, jwtSecret, { expiresIn: "8h" }), user: safe });
  } catch (e) {
    next(e);
  }
});
app.post("/api/auth/request-reset", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email() }).parse(req.body), user = await db().collection("users").findOne({ email: body.email.toLowerCase() });
    if (user) {
      await db().collection("alerts").insertOne({ type: "password_reset_request", message: `Password reset requested for ${user.name} (${user.email}).`, status: "unread", emailStatus: "pending", createdAt: now(), updatedAt: now() });
      await db().collection("auditEvents").insertOne({ actorId: user._id, action: "user.password_reset_requested", entityType: "profile", entityId: id(user._id), details: { email: user.email }, createdAt: now() });
    }
    res.json({ ok: true, message: "If your email is registered, your reset request has been sent to the System Administrator." });
  } catch (e) {
    next(e);
  }
});
app.get("/api/users", auth, roles("administrator"), async (_req, res, next) => {
  try {
    res.json((await db().collection("users").find().project({ passwordHash: 0 }).sort({ name: 1 }).toArray()).map(publicDoc));
  } catch (e) {
    next(e);
  }
});
app.post("/api/users", auth, roles("administrator"), async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(["administrator", "storekeeper", "dispenser", "auditor"]) }).parse(req.body), document = { name: body.name, email: body.email.toLowerCase(), passwordHash: await bcrypt2.hash(body.password, 12), role: body.role, preferredLanguage: "en", mustChangePassword: true, active: true, createdAt: now(), updatedAt: now() }, result = await db().collection("users").insertOne(document);
    await db().collection("auditEvents").insertOne({ actorId: oid(req.user.id), action: "user.created", entityType: "profile", entityId: id(result.insertedId), details: { email: body.email, role: body.role }, createdAt: now() });
    res.status(201).json(publicDoc({ ...document, _id: result.insertedId }));
  } catch (e) {
    next(e);
  }
});
app.patch("/api/users/:id", auth, roles("administrator"), async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2).optional(), email: z.string().email().optional(), role: z.enum(["administrator", "storekeeper", "dispenser", "auditor"]).optional(), active: z.boolean().optional(), preferredLanguage: z.enum(["en", "si"]).optional() }).parse(req.body);
    if (body.email) body.email = body.email.toLowerCase();
    const result = await db().collection("users").findOneAndUpdate({ _id: oid(req.params.id) }, { $set: { ...body, updatedAt: now() } }, { returnDocument: "after" });
    if (!result) return res.status(404).json({ message: "User not found." });
    await db().collection("auditEvents").insertOne({ actorId: oid(req.user.id), action: "user.updated", entityType: "profile", entityId: id(result), details: body, createdAt: now() });
    res.json(publicDoc(result));
  } catch (e) {
    next(e);
  }
});
app.post("/api/users/:id/reset-password", auth, roles("administrator"), async (req, res, next) => {
  try {
    const body = z.object({ temporaryPassword: z.string().min(8) }).parse(req.body), hash = await bcrypt2.hash(body.temporaryPassword, 12), result = await db().collection("users").findOneAndUpdate({ _id: oid(req.params.id) }, { $set: { passwordHash: hash, mustChangePassword: true, updatedAt: now() } }, { returnDocument: "after" });
    if (!result) return res.status(404).json({ message: "User not found." });
    await db().collection("auditEvents").insertOne({ actorId: oid(req.user.id), action: "user.password_reset", entityType: "profile", entityId: id(result), details: { email: result.email }, createdAt: now() });
    res.json({ ok: true, message: `Temporary password set for ${result.name}. They must change it on their next login.` });
  } catch (e) {
    next(e);
  }
});
app.delete("/api/users/:id", auth, roles("administrator"), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "You cannot delete your own active account." });
    const result = await db().collection("users").deleteOne({ _id: oid(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "User not found." });
    await db().collection("auditEvents").insertOne({ actorId: oid(req.user.id), action: "user.deleted", entityType: "profile", entityId: req.params.id, details: {}, createdAt: now() });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
app.get("/api/audit", auth, roles("administrator", "auditor"), async (_req, res, next) => {
  try {
    const events = await db().collection("auditEvents").find().sort({ createdAt: -1 }).limit(250).toArray();
    const users = await db().collection("users").find().toArray();
    res.json(events.map((event) => ({
      ...publicDoc(event),
      User: publicDoc(users.find((user) => id(user) === id(event.actorId)))
    })));
  } catch (error) {
    next(error);
  }
});
app.get("/api/reports/summary", auth, async (_req, res, next) => {
  try {
    res.json({ medicines: await medicineRows(), movements: await movementRows(1e3) });
  } catch (e) {
    next(e);
  }
});
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof z.ZodError) return res.status(400).json({ message: err.issues[0]?.message || "Invalid input." });
  if (err?.code === 11e3) return res.status(409).json({ message: "That email, code, or batch number already exists." });
  res.status(400).json({ message: err.message || "Something went wrong." });
});
async function start() {
  await initializeDatabase();
  await seed();
  app.listen(port, () => console.log(`API ready at http://localhost:${port} (MongoDB)`));
  setInterval(() => void ensureAlerts(), 6 * 60 * 60 * 1e3);
}
if (!process.env.VERCEL) {
  start().catch((error) => {
    console.error("Failed to start API:", error);
    process.exit(1);
  });
}

// api/index.ts
var isDbInitialized = false;
async function handler(req, res) {
  try {
    if (!isDbInitialized) {
      await initializeDatabase();
      await seed().catch((err) => console.warn("Seed warning:", err.message));
      isDbInitialized = true;
    }
    return app(req, res);
  } catch (error) {
    console.error("Vercel API DB Initialization Error:", error);
    return res.status(500).json({
      message: `Database Connection Error: ${error?.message || "Could not connect to MongoDB Atlas."}`
    });
  }
}
export {
  handler as default
};
