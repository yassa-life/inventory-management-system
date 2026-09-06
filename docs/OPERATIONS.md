# Staff operations

## Roles

- Administrator: all stock, users, settings, reports, alerts, and audit records.
- Storekeeper: medicines, batches, receipts, corrections, alerts, and reports.
- Dispenser: view stock and record outgoing quantities.
- Auditor: read-only stock, movements, reports, alerts, and audit history.

## Receive stock

1. Open **Receive stock** and choose the medicine.
2. Enter the supplier batch number, number of packs, units per pack, received date, and expiry date.
3. Check the calculated base quantity and save.
4. Confirm the receipt appears in the movement ledger.

Never reuse a batch number for the same medicine. Quarantine damaged or uncertain stock instead of receiving it as available.

## Record today's outgoing stock

1. On the dashboard, select the medicine.
2. Enter only the total quantity that went out and an optional ward/reference note.
3. Save once. The API locks eligible rows and deducts the earliest-expiring usable batches first.
4. If stock is insufficient, nothing is deducted. Contact a Storekeeper rather than entering a false quantity.

Completed issues are not edited or deleted. A Storekeeper records a compensating correction so history remains auditable.

## Alerts

Low-stock alerts appear when usable stock reaches the medicine's reorder level. Expiry warnings appear at 90, 30, and 7 days; expired batches are excluded from issuing. An Administrator or Storekeeper acknowledges an alert after taking action. Restocking above the threshold resolves its low-stock alert.

## Daily controls

- Compare physical high-risk/low-stock items against the dashboard.
- Review new and failed alerts.
- Export the daily movement report.
- Investigate discrepancies; never alter database rows manually.

## Downtime

Record medicine, quantity, batch if known, time, and staff signature on the approved paper log. After service returns, a Storekeeper enters the backlog in chronological order and an Auditor compares the electronic ledger to the paper record.
