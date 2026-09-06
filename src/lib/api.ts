export type Role = 'administrator'|'storekeeper'|'dispenser'|'auditor'
export type Session = { token:string; user:{id:string;name:string;email:string;role:Role;preferredLanguage?:'en'|'si';mustChangePassword?:boolean} }
const base=import.meta.env.VITE_API_URL||'/api'

async function request<T>(path:string,options:RequestInit={},token?:string):Promise<T>{
  const response=await fetch(`${base}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers}})
  const text=await response.text()
  let data:any={}
  try{ data=JSON.parse(text) }catch{}
  if(!response.ok){
    const errMsg = data.message || data.error || (text && !text.includes('<!DOCTYPE') ? text.slice(0, 150) : `Request failed (${response.status})`)
    throw new Error(errMsg)
  }
  return data
}
export const api={
  login:(email:string,password:string)=>request<Session>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
  changePassword:(token:string,currentPassword:string,newPassword:string)=>request<Session>('/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})},token),
  requestReset:(email:string)=>request<{ok:boolean;message:string}>('/auth/request-reset',{method:'POST',body:JSON.stringify({email})}),
  dashboard:(token:string)=>request<any>('/dashboard',{},token), medicines:(token:string)=>request<any[]>('/medicines',{},token),
  categories:(token:string)=>request<any[]>('/categories',{},token),
  createMedicine:(token:string,body:any)=>request('/medicines',{method:'POST',body:JSON.stringify(body)},token),
  updateMedicine:(token:string,id:string,body:any)=>request(`/medicines/${id}`,{method:'PATCH',body:JSON.stringify(body)},token),
  suppliers:(token:string)=>request<any[]>('/suppliers',{},token), movements:(token:string)=>request<any[]>('/movements',{},token),
  alerts:(token:string)=>request<any[]>('/alerts',{},token), users:(token:string)=>request<any[]>('/users',{},token), audit:(token:string)=>request<any[]>('/audit',{},token),
  issue:(token:string,body:any)=>request('/issues',{method:'POST',body:JSON.stringify(body)},token),
  receive:(token:string,body:any)=>request('/receipts',{method:'POST',body:JSON.stringify(body)},token),
  acknowledge:(token:string,id:string)=>request(`/alerts/${id}/acknowledge`,{method:'PATCH'},token),
  createUser:(token:string,body:any)=>request('/users',{method:'POST',body:JSON.stringify(body)},token),
  updateUser:(token:string,id:string,body:any)=>request(`/users/${id}`,{method:'PATCH',body:JSON.stringify(body)},token),
  adminResetPassword:(token:string,id:string,temporaryPassword:string)=>request<{ok:boolean;message:string}>(`/users/${id}/reset-password`,{method:'POST',body:JSON.stringify({temporaryPassword})},token),
  deleteUser:(token:string,id:string)=>request(`/users/${id}`,{method:'DELETE'},token)
}
