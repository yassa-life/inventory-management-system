import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'
import { categories, medicines } from './seed-data.js'
import { client, db, initializeDatabase, now } from './db.js'


export async function seed(){
  await initializeDatabase();const database=db(),categoryIds:any[]=[]
  await database.collection('medicines').updateMany({baseUnit:'gram'},{$set:{baseUnit:'g',updatedAt:now()}})
  await database.collection('medicines').updateMany({baseUnit:'millilitre'},{$set:{baseUnit:'mL',updatedAt:now()}})
  for(const [nameEn,nameSi] of categories){await database.collection('categories').updateOne({nameEn},{$setOnInsert:{nameEn,nameSi,active:true,createdAt:now(),updatedAt:now()}},{upsert:true});categoryIds.push((await database.collection('categories').findOne({nameEn}))!._id)}
  await database.collection('suppliers').updateOne({name:'Sri Lanka Ayurvedic Drugs Corporation'},{$setOnInsert:{name:'Sri Lanka Ayurvedic Drugs Corporation',phone:'011 285 0229',active:true,createdAt:now(),updatedAt:now()}},{upsert:true});const supplier=await database.collection('suppliers').findOne({name:'Sri Lanka Ayurvedic Drugs Corporation'})
  for(const [code,nameEn,nameSi,categoryNumber,baseUnit,reorderThreshold] of medicines){await database.collection('medicines').updateOne({code},{$setOnInsert:{code,nameEn,nameSi,categoryId:categoryIds[Number(categoryNumber)-1],baseUnit,reorderThreshold:Number(reorderThreshold),active:true,createdAt:now(),updatedAt:now()}},{upsert:true});const medicine=await database.collection('medicines').findOne({code});if(!await database.collection('batches').findOne({medicineId:medicine!._id})){const index=Number(categoryNumber)+code.charCodeAt(code.length-1),expiry=index%8===0?addDays(now(),6):index%7===0?addDays(now(),28):addDays(now(),180+index*7),quantity=index%6===0?Number(reorderThreshold)*.7:Number(reorderThreshold)*3;await database.collection('batches').insertOne({medicineId:medicine!._id,supplierId:supplier!._id,batchNumber:`DEMO-${code}-01`,receivedQuantity:quantity,availableQuantity:quantity,receivedDate:addDays(now(),-30),expiryDate:expiry,status:'available',createdAt:now(),updatedAt:now()})}}
  const users=[[process.env.ADMIN_NAME||'System Administrator',process.env.ADMIN_EMAIL||'admin@suwasetha.local',process.env.ADMIN_PASSWORD||'ChangeMe123!','administrator','en'],['Kasun Silva','store@suwasetha.local','Storekeeper123!','storekeeper','en'],['Nimali Perera','dispense@suwasetha.local','Dispenser123!','dispenser','si'],['Ayesha Fernando','audit@suwasetha.local','Auditor123!','auditor','en']]
  for(const [name,email,password,role,preferredLanguage] of users){if(!await database.collection('users').findOne({email})){const result=await database.collection('users').insertOne({name,email,passwordHash:await bcrypt.hash(password,12),role,preferredLanguage,active:true,mustChangePassword:true,createdAt:now(),updatedAt:now()});if(role==='administrator'||role==='storekeeper')await database.collection('notificationSettings').insertOne({profileId:result.insertedId,lowStockEmail:true,expiryEmail:true,createdAt:now(),updatedAt:now()})}}
}

if(process.argv[1]?.endsWith('seed.ts'))seed().then(async()=>{console.log('MongoDB seed complete');await client.close()}).catch(error=>{console.error(error);process.exit(1)})
