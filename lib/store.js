import {
  ADMIN, DEPTS, DEMO_CITIZEN, OFFICER_PASSWORD, SERVICES, WORKFLOWS,
  ALL_SOURCES, createSeedStore, validateProfile, routeKeywords, urgencyFor,
  neededFields, canonicalPayload, payloadFor, groupComplaints, dueDate, isOverdue
} from "./data";

export const STORAGE_KEY = "onegovai-prototype-v1";

export function loadStore() {
  if (typeof window === "undefined") return createSeedStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const fresh = createSeedStore();
  saveStore(fresh);
  return fresh;
}

export function saveStore(store) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

export function resetStore() {
  if (typeof window !== "undefined") {
    const fresh = createSeedStore();
    saveStore(fresh);
    return fresh;
  }
  return createSeedStore();
}

export function loginCitizen(store,email,password) {
  const u=store.users[email.trim().toLowerCase()];
  return u && u.password===password ? {role:"citizen",user:u.email || email.trim().toLowerCase(),dept:null} : null;
}

export function loginOfficer(store,email,password,dept) {
  const o=store.officers[email.trim().toLowerCase()];
  return o && o.password===password && o.dept===dept ? {role:"officer",user:email.trim().toLowerCase(),dept} : null;
}

export function loginAdmin(email,password) {
  return email.trim().toLowerCase()===ADMIN.email && password===ADMIN.password ? {role:"admin",user:ADMIN.email,dept:null} : null;
}

function addAudit(store,actor,role,action,detail="") {
  store.audit.unshift({time:new Date().toISOString(),actor,role,action,detail});
  store.audit=store.audit.slice(0,100);
}

function addEvent(store,topic,app,detail="") {
  store.events.unshift({
    time:new Date().toISOString(),topic,app_id:app?.id||"",citizen:app?.citizen||"",
    dept:app?.dept||"",detail
  });
  store.events=store.events.slice(0,100);
}

function connectorAck(dept) {
  const slug=DEPTS[dept].slug.toUpperCase();
  return `${slug}-ACK-${1000+Math.floor(Math.random()*9000)}`;
}

export function createApplication(store,email,key,text,ward,extras={},granted=[]) {
  const svc=SERVICES[key];
  const missing=svc.sources.filter(s=>!store.users[email]?.consents?.[s]?.granted && !granted.includes(s));
  if(missing.length) return {ok:false,type:"consent",missing};

  granted.forEach(source=>{
    if(svc.sources.includes(source)) grantConsent(store,email,source);
  });

  const duplicate=store.apps.find(a=>a.citizen===email && a.service===key && a.status<4 &&
    (svc.kind==="application" || similarity(a.text,text)>=0.7));
  if(duplicate) {
    store.stats.dup_blocked++;
    addAudit(store,email,"citizen","duplicate.blocked",`${key} already open as ${duplicate.id}`);
    addEvent(store,"duplicate.blocked",duplicate,"Duplicate submission prevented");
    return {ok:false,type:"duplicate",app:duplicate};
  }

  store.seq++;
  const app={
    id:`OG-${store.seq}`,citizen:email,service:key,dept:svc.dept,kind:svc.kind,
    text:(text||svc.name).trim(),ward,extras,sources:[...svc.sources],
    urgency:urgencyFor(key,text),status:0,created:new Date().toISOString(),history:[],
    queued:false,payload:"",ack:"",has_photo:false
  };

  addHistory(app,"Submitted by citizen");
  const count=neededFields(svc.kind).filter(f=>store.users[email]?.profile?.[f]).length;
  store.stats.autofilled += count;
  addHistory(app,`${count} fields auto-filled from master profile`);
  store.apps.unshift(app);
  addAudit(store,email,"citizen","application.created",`${app.id} ${svc.name} -> ${app.dept}`);
  addEvent(store,"application.created",app,svc.name);
  deliver(store,app);
  return {ok:true,app};
}

function addHistory(app,text) {
  app.history.push({time:new Date().toISOString(),text});
}

function deliver(store,app) {
  const info=DEPTS[app.dept];
  if(!store.connectors[app.dept]?.up) {
    app.queued=true;
    addHistory(app,`Queued for retry: simulated connector outage`);
    addAudit(store,"connector","system","connector.failed",`${app.id} -> ${app.dept}`);
    addEvent(store,"connector.failed",app,"Delivery delayed");
    return false;
  }
  const canon=canonicalPayload(store,app);
  app.payload=payloadFor(info.type,canon);
  app.ack=connectorAck(app.dept);
  app.queued=false;
  app.status=Math.max(app.status,1);
  addHistory(app,`Routed to ${app.dept} via ${info.type} connector (${app.ack})`);
  addEvent(store,"application.routed",app,app.ack);
  return true;
}

export function retryQueued(store,dept,actor="admin") {
  let count=0;
  store.apps.filter(a=>a.dept===dept && a.queued).forEach(app=>{
    if(deliver(store,app)) {
      count++;
      addAudit(store,actor,"admin","connector.retry_ok",app.id);
      addEvent(store,"connector.retry_ok",app,"Delivered after retry");
    }
  });
  return count;
}

export function setStatus(store,appId,newStatus,actor,role="officer") {
  const app=store.apps.find(a=>a.id===appId);
  if(!app) return;
  const next=Math.max(0,Math.min(4,newStatus));
  if(next===app.status) return;
  app.status=next;
  const step=WORKFLOWS[app.kind][next];
  addHistory(app,`Status: ${step} (by ${actor})`);
  addAudit(store,actor,role,"status.changed",`${app.id} -> ${step}`);
  addEvent(store,"status.changed",app,step);
}

export function grantConsent(store,email,source) {
  if(!store.users[email]) return;
  store.users[email].consents[source]={granted:true,time:new Date().toISOString()};
  addAudit(store,email,"citizen","consent.granted",source);
  addEvent(store,"consent.granted",{citizen:email},"Consent granted");
}

export function revokeConsent(store,email,source) {
  if(!store.users[email]) return;
  store.users[email].consents[source]={granted:false,time:new Date().toISOString()};
  addAudit(store,email,"citizen","consent.revoked",source);
  addEvent(store,"consent.revoked",{citizen:email},"Consent revoked");
}

export function updateProfile(store,email,profile) {
  const issues=validateProfile(profile);
  if(issues.length) return {ok:false,issues};
  store.users[email].profile={...store.users[email].profile,...profile};
  addAudit(store,email,"citizen","profile.updated","Master profile updated");
  return {ok:true};
}

function similarity(a,b) {
  const stop=new Set("the a an is are was of in on at to for and or my our not no hai hain ka ki ke se mein me par nahi ho raha rahi rha hamare mere yaha here there it this that with from have has been since near very".split(" "));
  const A=new Set(String(a).toLowerCase().match(/[\w\u0900-\u097F]+/g)?.filter(w=>!stop.has(w)&&w.length>2)||[]);
  const B=new Set(String(b).toLowerCase().match(/[\w\u0900-\u097F]+/g)?.filter(w=>!stop.has(w)&&w.length>2)||[]);
  const union=new Set([...A,...B]);
  return union.size?[...A].filter(x=>B.has(x)).length/union.size:0;
}

export { groupComplaints, dueDate, isOverdue };
