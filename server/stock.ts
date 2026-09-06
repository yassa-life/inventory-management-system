export type StockBatch = { id:string | number; available:number; expiryDate:string; status:string }
export type Allocation = { batchId:string | number; quantity:number }

export function allocateFefo(batches:StockBatch[], requested:number, businessDate:string):Allocation[]{
  if(!Number.isFinite(requested)||requested<=0) throw new Error('Quantity must be greater than zero.')
  const usable=batches
    .filter(b=>b.status==='available'&&b.expiryDate>=businessDate&&b.available>0)
    .sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate)||String(a.id).localeCompare(String(b.id)))
  const total=usable.reduce((sum,b)=>sum+b.available,0)
  if(total<requested) throw new Error(`Only ${total} units are available.`)
  let remaining=requested;const result:Allocation[]=[]
  for(const batch of usable){if(remaining<=0)break;const quantity=Math.min(batch.available,remaining);result.push({batchId:batch.id,quantity});remaining-=quantity}
  return result
}
