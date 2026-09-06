export type Role = 'administrator'|'storekeeper'|'dispenser'|'auditor'
export type Session = { token:string; user:{id:string;name:string;email:string;role:Role;preferredLanguage?:'en'|'si';mustChangePassword?:boolean} }
const base=import.meta.env.VITE_API_URL||'/api'

async function request<T>(path:string,options:RequestInit={},token?:string):Promise<T>{
  const response=await fetch(`${base}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers}})
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data.message||'Request failed')
  return data
}
export const api={
  login:(email:string,password:string)=>request<Session>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
  dashboard:(token:string)=>request<any>('/dashboard',{},token), medicines:(token:string)=>request<any[]>('/medicines',{},token),
  categories:(token:string)=>request<any[]>('/categories',{},token),
  createMedicine:(token:string,body:any)=>request('/medicines',{method:'POST',body:JSON.stringify(body)},token),
  updateMedicine:(token:string,id:string,body:any)=>request(`/medicines/${id}`,{method:'PATCH',body:JSON.stringify(body)},token),
  suppliers:(token:string)=>request<any[]>('/suppliers',{},token), movements:(token:string)=>request<any[]>('/movements',{},token),
  alerts:(token:string)=>request<any[]>('/alerts',{},token), users:(token:string)=>request<any[]>('/users',{},token), audit:(token:string)=>request<any[]>('/audit',{},token),
  issue:(token:string,body:any)=>request('/issues',{method:'POST',body:JSON.stringify(body)},token),
  receive:(token:string,body:any)=>request('/receipts',{method:'POST',body:JSON.stringify(body)},token),
  acknowledge:(token:string,id:string)=>request(`/alerts/${id}/acknowledge`,{method:'PATCH'},token),
  createUser:(token:string,body:any)=>request('/users',{method:'POST',body:JSON.stringify(body)},token)
}
