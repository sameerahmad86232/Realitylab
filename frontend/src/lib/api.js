export async function api(path,{body,signal}={}){
  let response;
  try{response=await fetch(`/api/${path}`,{method:body?'POST':'GET',headers:body instanceof FormData?undefined:body?{'Content-Type':'application/json'}:undefined,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,signal});}catch(error){if(error.name==='AbortError')throw error;throw Error('Cannot reach the app server. Start the full app with npm run dev from the repository root.');}
  let data;try{data=await response.json();}catch{throw Error('The app server returned an unreadable response. Check that the API is running.');}
  if(!response.ok)throw Object.assign(Error(data.error?.message||'Request failed.'),{status:response.status});
  return data;
}
