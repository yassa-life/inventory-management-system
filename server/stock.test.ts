import { describe, expect, it } from 'vitest'
import { allocateFefo } from './stock'

describe('FEFO stock allocation',()=>{
  const batches=[{id:1,available:5,expiryDate:'2027-01-01',status:'available'},{id:2,available:4,expiryDate:'2026-11-01',status:'available'},{id:3,available:20,expiryDate:'2026-08-01',status:'available'},{id:4,available:9,expiryDate:'2026-10-01',status:'quarantined'}]
  it('uses the earliest usable expiry first',()=>expect(allocateFefo(batches,7,'2026-09-06')).toEqual([{batchId:2,quantity:4},{batchId:1,quantity:3}]))
  it('excludes expired and quarantined batches',()=>expect(allocateFefo(batches,5,'2026-09-06')).toEqual([{batchId:2,quantity:4},{batchId:1,quantity:1}]))
  it('rejects insufficient stock atomically',()=>expect(()=>allocateFefo(batches,10,'2026-09-06')).toThrow('Only 9 units'))
  it('rejects zero and negative issues',()=>expect(()=>allocateFefo(batches,0,'2026-09-06')).toThrow())
})
