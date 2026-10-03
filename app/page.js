"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADMIN, ALL_SOURCES, DEPTS, DEMO_CITIZEN, QUICK, SERVICES, WARDS,
  WORKFLOWS, createSeedStore, formatDate, groupComplaints, groupSummary,
  isOverdue, maskAadhaar, routeKeywords, validateProfile
} from "../lib/data";
import {
  createApplication, grantConsent, loadStore, loginAdmin, loginCitizen,
  loginOfficer, resetStore, retryQueued, revokeConsent, saveStore, setStatus,
  updateProfile
} from "../lib/store";

function Brand() {
  return <div className="brand"><span className="brand-mark">OG</span><span>OneGovAI</span></div>;
}

function Button({ children, primary, danger, small, onClick, type="button", disabled }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn ${primary?"btn-primary":""} ${danger?"btn-danger":""} ${small?"btn-sm":""}`}>{children}</button>;
}

function Badge({ children, tone="gray" }) {
  return <span className={`badge ${tone==="green"?"badge-green":tone==="red"?"badge-red":tone==="amber"?"badge-amber":""}`}>{children}</span>;
}

function Field({label, children}) {
  return <div className="field"><label className="label">{label}</label>{children}</div>;
}

function AppCard({app, store, citizen=false, onAdvance, onResolve}) {
  const svc=SERVICES[app.service];
  const pct=Math.round(((app.status+1)/5)*100);
  const overdue=isOverdue(store,app);
  return (
    <div className="card">
      <div className="app-row">
        <div>
          <div className="small">{app.id} · {formatDate(app.created)}</div>
          <h3>{svc.name}</h3>
          <div className="small">{app.dept} · {app.ward} · Priority {app.urgency}/5</div>
          <p className="muted" style={{margin:"9px 0 0"}}>{app.text}</p>
        </div>
        <div style={{textAlign:"right"}}>
          <Badge tone={app.status===4?"green":overdue?"red":"gray"}>{WORKFLOWS[app.kind][app.status]}</Badge>
          {app.queued && <div style={{marginTop:6}}><Badge tone="amber">Queued</Badge></div>}
        </div>
      </div>
      <div className="progress"><span style={{width:`${pct}%`}} /></div>
      <div className="small">{app.status+1}/5 stages · {overdue ? "SLA overdue" : `SLA ${formatDate(new Date(new Date(app.created).getTime()+store.sla[app.service]*86400000))}`}</div>
      {citizen && <details style={{marginTop:13}}><summary className="small">View timeline</summary><Timeline app={app}/></details>}
      {!citizen && app.status<4 && (
        <div className="row-actions" style={{marginTop:12}}>
          <Button small onClick={()=>onAdvance(app.id)}>Advance</Button>
          <Button small primary onClick={()=>onResolve(app.id)}>Resolve</Button>
        </div>
      )}
    </div>
  );
}

function Timeline({app}) {
  return <div className="timeline">{(app.history||[]).map((h,i)=><div className="timeline-item" key={i}><div className="small">{formatDate(h.time)}</div><div>{h.text}</div></div>)}</div>;
}

export default function Home() {
  const [store,setStore]=useState(null);
  const [session,setSession]=useState(null);
  const [authMode,setAuthMode]=useState("citizen");
  const [authTab,setAuthTab]=useState("signin");
  const [loginEmail,setLoginEmail]=useState("");
  const [loginPassword,setLoginPassword]=useState("");
  const [dept,setDept]=useState(Object.keys(DEPTS)[0]);
  const [authError,setAuthError]=useState("");
  const [tab,setTab]=useState("home");

  useEffect(()=>{
    const loaded=loadStore();
    setStore(loaded);
    try {
      const saved=JSON.parse(localStorage.getItem("onegovai-session")||"null");
      if(saved) setSession(saved);
    } catch {}
  },[]);

  useEffect(()=>{
    if(store) saveStore(store);
  },[store]);

  useEffect(()=>{
    if(session) localStorage.setItem("onegovai-session",JSON.stringify(session));
    else if(typeof window!=="undefined") localStorage.removeItem("onegovai-session");
  },[session]);

  if(!store) return <div className="auth-wrap"><div className="auth-card"><Brand/><p className="muted">Loading prototype…</p></div></div>;

  function signIn(e) {
    e.preventDefault(); setAuthError("");
    let result=null;
    if(authMode==="citizen") result=loginCitizen(store,loginEmail,loginPassword);
    if(authMode==="officer") result=loginOfficer(store,loginEmail,loginPassword,dept);
    if(authMode==="admin") result=loginAdmin(loginEmail,loginPassword);
    if(!result) return setAuthError("The credentials do not match the selected account.");
    setSession(result); setTab(result.role==="citizen"?"home":"dashboard");
  }

  function signOut(){setSession(null);setTab("home");setLoginPassword("");}

  if(!session) {
    return <AuthScreen {...{
      authMode,setAuthMode,authTab,setAuthTab,loginEmail,setLoginEmail,loginPassword,setLoginPassword,
      dept,setDept,authError,setAuthError,onSubmit:signIn,store,setStore
    }}/>;
  }

  const who=session.role==="citizen"
    ? store.users[session.user]?.profile?.full_name
    : session.role==="officer" ? store.officers[session.user]?.name : "Administrator";

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand/>
        <div className="topbar-right"><span className="role-chip">{who} · {session.role}</span><Button small onClick={signOut}>Sign out</Button></div>
      </header>
      <main className="container">
        {session.role==="citizen"
          ? <CitizenView store={store} setStore={setStore} session={session} tab={tab} setTab={setTab}/>
          : session.role==="officer"
          ? <OfficerView store={store} setStore={setStore} session={session} tab={tab} setTab={setTab}/>
          : <AdminView store={store} setStore={setStore} tab={tab} setTab={setTab}/>}
        <div className="footer-note">OneGovAI is a prototype. Department systems and records shown here are simulated.</div>
      </main>
    </div>
  );
}

function AuthScreen({authMode,setAuthMode,authTab,setAuthTab,loginEmail,setLoginEmail,loginPassword,setLoginPassword,dept,setDept,authError,onSubmit}) {
  const [signup,setSignup]=useState({full_name:"",father_name:"",dob:"1998-01-01",mobile:"",email:"",aadhaar:"",pin:"",address:"",ward:"Ward 1",district:"Patna",category:"General",occupation:"",income:"",password:""});
  const [signupError,setSignupError]=useState("");
  const [signupDone,setSignupDone]=useState(false);


  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Brand/>
        <h1 className="auth-title">Government services, connected.</h1>
        <p className="auth-sub">One profile. One login. A single place to discover services, submit requests and track progress.</p>
        <div className="tabs">
          {[
            ["citizen","Citizen"],
            ["officer","Department officer"],
            ["admin","Admin"]
          ].map(([key,label])=><button key={key} className={`tab ${authMode===key?"active":""}`} onClick={()=>{setAuthMode(key);setAuthTab("signin");}}>{label}</button>)}
        </div>

        {authMode==="citizen" && <div className="tabs">
          <button className={`tab ${authTab==="signin"?"active":""}`} onClick={()=>setAuthTab("signin")}>Sign in</button>
          <button className={`tab ${authTab==="signup"?"active":""}`} onClick={()=>setAuthTab("signup")}>Create profile</button>
        </div>}

        {authMode==="citizen" && authTab==="signup" ? (
          <SignupForm signup={signup} setSignup={setSignup} error={signupError} setError={setSignupError} done={signupDone} setDone={setSignupDone}/>
        ) : (
          <form onSubmit={onSubmit}>
            {authMode==="officer" && <Field label="Department"><select className="select" value={dept} onChange={e=>setDept(e.target.value)}>{Object.keys(DEPTS).map(d=><option key={d}>{d}</option>)}</select></Field>}
            <Field label={authMode==="admin"?"Admin email":"Email address"}><input className="input" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="name@example.in" required/></Field>
            <Field label="Password"><input className="input" type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required/></Field>
            {authError && <div className="error" style={{marginBottom:14}}>{authError}</div>}
            <Button primary type="submit">Sign in</Button>
            <div className="notice" style={{marginTop:16}}>
              {authMode==="citizen" && <>Demo citizen: <b>{DEMO_CITIZEN.email}</b> / <b>{DEMO_CITIZEN.password}</b></>}
              {authMode==="officer" && <>Demo officer: <b>{DEPTS[dept].slug}.officer@gov.in</b> / <b>{OFFICER_PASSWORD}</b></>}
              {authMode==="admin" && <>Demo admin: <b>{ADMIN.email}</b> / <b>{ADMIN.password}</b></>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SignupForm({signup,setSignup,error,setError,done,setDone}) {
  function submit(e) {
    e.preventDefault();
    const issues=validateProfile(signup);
    if(!signup.password || signup.password.length<6) issues.push("Password must be at least 6 characters");
    if(issues.length) return setError(issues.join(". "));
    if(localStorage.getItem("onegovai-prototype-v1")) {
      const store=JSON.parse(localStorage.getItem("onegovai-prototype-v1"));
      if(store.users[signup.email.trim().toLowerCase()]) return setError("This email is already registered.");
      store.users[signup.email.trim().toLowerCase()]={password:signup.password,profile:{...signup,email:signup.email.trim().toLowerCase()},consents:{}};
      localStorage.setItem("onegovai-prototype-v1",JSON.stringify(store));
    }
    setDone(true);
  }
  if(done) return <div className="success">Profile created. Return to Sign in to continue.</div>;
  const update=(key,value)=>setSignup(v=>({...v,[key]:value}));
  return <form onSubmit={submit}>
    <div className="grid grid-2">
      <Field label="Full name"><input className="input" value={signup.full_name} onChange={e=>update("full_name",e.target.value)} required/></Field>
      <Field label="Father / guardian name"><input className="input" value={signup.father_name} onChange={e=>update("father_name",e.target.value)} required/></Field>
      <Field label="Date of birth"><input className="input" type="date" value={signup.dob} onChange={e=>update("dob",e.target.value)} required/></Field>
      <Field label="Gender"><select className="select" value={signup.gender||"Male"} onChange={e=>update("gender",e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></Field>
      <Field label="Mobile"><input className="input" value={signup.mobile} onChange={e=>update("mobile",e.target.value)} required/></Field>
      <Field label="Email"><input className="input" type="email" value={signup.email} onChange={e=>update("email",e.target.value)} required/></Field>
      <Field label="Aadhaar (demo)"><input className="input" value={signup.aadhaar} onChange={e=>update("aadhaar",e.target.value)} required/></Field>
      <Field label="PIN code"><input className="input" value={signup.pin} onChange={e=>update("pin",e.target.value)} required/></Field>
    </div>
    <Field label="Address"><input className="input" value={signup.address} onChange={e=>update("address",e.target.value)} required/></Field>
    <div className="grid grid-2">
      <Field label="Ward"><select className="select" value={signup.ward} onChange={e=>update("ward",e.target.value)}>{WARDS.map(w=><option key={w}>{w}</option>)}</select></Field>
      <Field label="District"><input className="input" value={signup.district} onChange={e=>update("district",e.target.value)}/></Field>
      <Field label="Category"><select className="select" value={signup.category} onChange={e=>update("category",e.target.value)}><option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option></select></Field>
      <Field label="Occupation"><input className="input" value={signup.occupation} onChange={e=>update("occupation",e.target.value)}/></Field>
    </div>
    <Field label="Password"><input className="input" type="password" value={signup.password} onChange={e=>update("password",e.target.value)} required/></Field>
    {error && <div className="error" style={{marginBottom:14}}>{error}</div>}
    <Button primary type="submit">Create profile</Button>
  </form>;
}

function CitizenView({store,setStore,session,tab,setTab}) {
  const [query,setQuery]=useState("");
  const [result,setResult]=useState(null);
  const [selected,setSelected]=useState(null);
  const [aiBusy,setAiBusy]=useState(false);
  const [aiNote,setAiNote]=useState("");
  const [form,setForm]=useState({});
  const [submitMsg,setSubmitMsg]=useState("");
  const [profileMsg,setProfileMsg]=useState("");

  const user=store.users[session.user];
  const profile=user.profile;
  const mine=store.apps.filter(a=>a.citizen===session.user);
  const events=store.events.filter(e=>e.citizen===session.user);

  function chooseService(key){setSelected(key);setResult(null);setSubmitMsg("");setForm({});}
  async function search() {
    if(!query.trim()) return;
    setAiBusy(true);setAiNote("");
    const ranked=routeKeywords(query);
    let top=ranked[0]?.[0]||"general_grievance";
    let summary="";
    try {
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"route",query,services:SERVICES})});
      const data=await res.json();
      if(data.ok){top=data.serviceKey;summary=data.summary||"";setAiNote("Gemini AI routing");}
      else setAiNote("Smart keyword routing");
    } catch { setAiNote("Smart keyword routing"); }
    setResult({top,others:ranked.filter(([k])=>k!==top).slice(0,3),summary});
    setSelected(top);setAiBusy(false);
  }

  function submit() {
    const svc=SERVICES[selected];
    const text=svc.kind==="complaint"?(form.description||"").trim():(form.notes||svc.name);
    if(svc.kind==="complaint"&&!text) return setSubmitMsg("Describe the problem before submitting.");
    const extras={};
    svc.extras.forEach(x=>{extras[x.label]=form[x.label]||"";});
    const granted=svc.sources.filter(s=>form[`consent:${s}`]);
    const res=createApplication(store,session.user,selected,text,form.ward||profile.ward,extras,granted);
    if(!res.ok) {
      if(res.type==="consent") return setSubmitMsg(`Consent required: ${res.missing.join(", ")}`);
      if(res.type==="duplicate") return setSubmitMsg(`An open request already exists: ${res.app.id}`);
    }
    setStore({...store});setSubmitMsg(`Submitted successfully. Ticket ${res.app.id}.`);setTab("applications");
  }

  return <>
    <nav className="tabs">
      {[["home","Home"],["applications","My applications"],["notifications","Notifications"],["profile","Profile & consent"]].map(([k,l])=><button key={k} className={`tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>)}
    </nav>
    {tab==="home" && <CitizenHome {...{profile,query,setQuery,result,selected,chooseService,search,aiBusy,aiNote,setForm,form,submit,submitMsg}}/>}
    {tab==="applications" && <Applications mine={mine} store={store}/>}
    {tab==="notifications" && <Notifications events={events}/>}
    {tab==="profile" && <ProfileView store={store} setStore={setStore} email={session.user} user={user} message={profileMsg} setMessage={setProfileMsg}/>}
  </>;
}

function CitizenHome({profile,query,setQuery,result,selected,chooseService,search,aiBusy,aiNote,setForm,form,submit,submitMsg}) {
  const set=(k,v)=>setForm(x=>({...x,[k]:v}));
  const svc=selected?SERVICES[selected]:null;
  return <>
    <div className="hero">
      <div className="hero-kicker">OneGovAI service discovery</div>
      <h1>Government services, in one place.</h1>
      <p>Describe what you need in English, Hindi or Hinglish. OneGovAI identifies the relevant department and prepares a single request.</p>
      <div className="search-row">
        <input className="input" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Example: mere area mein paani nahi aa raha"/>
        <Button primary onClick={search} disabled={aiBusy}>{aiBusy?"Finding…":"Find service"}</Button>
      </div>
    </div>
    <div className="quick-row">{["water problem","pothole on road","income certificate","police complaint","driving licence"].map(x=><button className="quick" key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div>

    {result && <div className="card result" style={{marginBottom:18}}>
      <Badge tone="green">{aiNote}</Badge>
      <h3 style={{marginTop:9}}>{SERVICES[result.top].name}</h3>
      <div className="muted">{SERVICES[result.top].dept} · {SERVICES[result.top].kind}</div>
      {result.summary && <p className="muted">{result.summary}</p>}
      {result.others.length>0 && <div className="quick-row" style={{marginBottom:0}}>{result.others.map(([k])=><button className="quick" key={k} onClick={()=>chooseService(k)}>{SERVICES[k].name}</button>)}</div>}
    </div>}

    <div className="section-head"><h2>Common services</h2><span className="small">Select a service directly</span></div>
    <div className="service-grid">
      {QUICK.map(k=><button className="service-btn" key={k} onClick={()=>chooseService(k)}><div className="service-name">{SERVICES[k].name}</div><div className="service-dept">{SERVICES[k].dept}</div></button>)}
    </div>
    <details style={{marginTop:12}}><summary className="small">View all services</summary><div className="service-grid" style={{marginTop:10}}>{Object.keys(SERVICES).map(k=><button className="service-btn" key={k} onClick={()=>chooseService(k)}><div className="service-name">{SERVICES[k].name}</div><div className="service-dept">{SERVICES[k].dept}</div></button>)}</div></details>

    {svc && <div className="card" style={{marginTop:22}}>
      <div className="section-head"><div><h2>{svc.name}</h2><div className="small">{svc.dept} · SLA {svc.sla} days</div></div><Badge>{svc.kind}</Badge></div>
      <div className="notice" style={{marginBottom:15}}>Profile fields are reused for this request. Only consented sources are included.</div>
      <div className="table-wrap" style={{marginBottom:18}}><table><tbody>
        {["full_name","mobile","address","ward"].map(f=><tr key={f}><th>{f.replaceAll("_"," ")}</th><td>{f==="aadhaar"?maskAadhaar(profile[f]):profile[f]}</td></tr>)}
      </tbody></table></div>
      {svc.kind==="complaint" ? <Field label="Describe the problem"><textarea className="textarea" value={form.description||""} onChange={e=>set("description",e.target.value)} placeholder="Describe the issue"/></Field> : <Field label="Notes"><input className="input" value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder={svc.name}/></Field>}
      {svc.kind==="complaint" && <Field label="Problem area"><select className="select" value={form.ward||profile.ward} onChange={e=>set("ward",e.target.value)}>{WARDS.map(w=><option key={w}>{w}</option>)}</select></Field>}
      {svc.extras.map(x=><Field key={x.label} label={x.label}>{x.options?<select className="select" value={form[x.label]||x.options[0]} onChange={e=>set(x.label,e.target.value)}>{x.options.map(o=><option key={o}>{o}</option>)}</select>:<input className="input" value={form[x.label]||""} onChange={e=>set(x.label,e.target.value)}/>}</Field>)}
      {svc.sources.length>0 && <div style={{margin:"16px 0"}}><div className="label">Consent</div>{svc.sources.map(s=><label key={s} style={{display:"block",margin:"9px 0",fontSize:13}}><input type="checkbox" checked={!!profile && !!(storeSafeConsentPlaceholder(form,s))} onChange={e=>set(`consent:${s}`,e.target.checked)}/> Allow {s}</label>)}</div>}
      {submitMsg && <div className={submitMsg.startsWith("Submitted")?"success":"error"} style={{marginBottom:14}}>{submitMsg}</div>}
      <Button primary onClick={submit}>Submit request</Button>
    </div>}
  </>;
}

function storeSafeConsentPlaceholder(form,s){return form[`consent:${s}`]||false}

function Applications({mine,store}) {
  return <><div className="section-head"><h2>My applications</h2><span className="small">{mine.length} request(s)</span></div>{mine.length?mine.map(a=><div key={a.id} style={{marginBottom:12}}><AppCard app={a} store={store} citizen/></div>):<div className="empty">No requests yet.</div>}</>;
}

function Notifications({events}) {
  const labels={"application.created":"Request submitted","application.routed":"Routed to department","status.changed":"Status update","consent.granted":"Consent granted","consent.revoked":"Consent revoked","duplicate.blocked":"Duplicate prevented","connector.failed":"Delivery delayed","connector.retry_ok":"Delivered after retry"};
  return <><div className="section-head"><h2>Notifications</h2><span className="small">{events.length}</span></div>{events.length?events.slice(0,30).map((e,i)=><div className="card" key={i} style={{marginBottom:9}}><b>{labels[e.topic]||e.topic}</b><div className="small">{e.detail} · {formatDate(e.time)}</div></div>):<div className="empty">No notifications yet.</div>}</>;
}

function ProfileView({store,setStore,email,user,message,setMessage}) {
  const [p,setP]=useState({...user.profile});
  function save(){const r=updateProfile(store,email,p);if(!r.ok)return setMessage(r.issues.join(". "));setStore({...store});setMessage("Profile updated.");}
  return <>
    <div className="section-head"><h2>Profile & consent</h2><span className="small">Master profile</span></div>
    <div className="card">
      <div className="grid grid-2">
        {["full_name","father_name","mobile","pin","address"].map(k=><Field key={k} label={k.replaceAll("_"," ")}><input className="input" value={p[k]||""} onChange={e=>setP({...p,[k]:e.target.value})}/></Field>)}
      </div>
      {message && <div className={message==="Profile updated."?"success":"error"} style={{marginBottom:14}}>{message}</div>}
      <Button primary onClick={save}>Save profile</Button>
    </div>
    <hr/>
    <div className="section-head"><h2>Consent manager</h2><span className="small">Changes are logged</span></div>
    <div className="grid grid-2">{ALL_SOURCES.map(s=>{const allowed=!!user.consents?.[s]?.granted;return <div className="card" key={s}><b>{s}</b><div className="small" style={{margin:"7px 0 12px"}}>{allowed?"Allowed":"Not allowed"}</div>{allowed?<Button small danger onClick={()=>{revokeConsent(store,email,s);setStore({...store})}}>Revoke</Button>:<Button small onClick={()=>{grantConsent(store,email,s);setStore({...store})}}>Allow</Button>}</div>})}</div>
  </>;
}

function OfficerView({store,setStore,session,tab,setTab}) {
  const dept=session.dept;
  const [groupSummaryState,setGroupSummaryState]=useState({});
  const apps=store.apps.filter(a=>a.dept===dept&&!a.queued);
  const open=apps.filter(a=>a.status<4);
  const groups=groupComplaints(open);
  const multi=groups.filter(g=>g.length>1);
  const info=DEPTS[dept];
  const advance=id=>{setStatus(store,id,store.apps.find(a=>a.id===id).status+1,session.user);setStore({...store})};
  const resolve=id=>{setStatus(store,id,4,session.user);setStore({...store})};
  return <>
    <nav className="tabs"><button className={`tab ${tab==="dashboard"?"active":""}`} onClick={()=>setTab("dashboard")}>Requests</button><button className={`tab ${tab==="groups"?"active":""}`} onClick={()=>setTab("groups")}>AI groups</button><button className={`tab ${tab==="analytics"?"active":""}`} onClick={()=>setTab("analytics")}>Analytics</button></nav>
    <div className="section-head"><div><h2>{dept}</h2><div className="small">{info.system} · {info.type}</div></div><Badge tone="green">Connected</Badge></div>
    {tab==="dashboard" && <><div className="grid grid-4" style={{marginBottom:18}}><Metric label="Open requests" value={open.length}/><Metric label="Urgent" value={open.filter(a=>a.urgency>=4).length}/><Metric label="SLA overdue" value={open.filter(a=>isOverdue(store,a)).length}/><Metric label="Resolved" value={apps.filter(a=>a.status===4).length}/></div>{apps.length?apps.sort((a,b)=>b.urgency-a.urgency).map(a=><div key={a.id} style={{marginBottom:10}}><AppCard app={a} store={store} onAdvance={advance} onResolve={resolve}/><details className="card" style={{marginTop:-1,borderTop:0,borderRadius:"0 0 14px 14px"}}><summary className="small">Citizen data and timeline</summary><p className="small">Citizen: {store.users[a.citizen]?.profile?.full_name} · {store.users[a.citizen]?.profile?.mobile}</p><p className="small">Address: {store.users[a.citizen]?.profile?.address} · Aadhaar: {maskAadhaar(store.users[a.citizen]?.profile?.aadhaar)}</p><Timeline app={a}/></details></div>):<div className="empty">No requests.</div>}</>}
    {tab==="groups" && <><div className="notice" style={{marginBottom:18}}>Similar open complaints are grouped by service, ward and text similarity for bulk action.</div>{multi.length?multi.map((g,i)=><div className="card" key={i} style={{marginBottom:12}}><h3>{g.length} similar complaints</h3><div className="small">{SERVICES[g[0].service].name} · {groupSummary(g)}</div><details style={{marginTop:12}}><summary className="small">View complaints</summary>{g.map(a=><div key={a.id} style={{padding:"10px 0",borderBottom:"1px solid var(--line)"}}><b>{a.id}</b> · {a.text}<div className="small">{a.ward} · priority {a.urgency}/5</div></div>)}</details><div className="row-actions" style={{marginTop:13}}><Button small onClick={()=>{const texts=g.map(a=>a.text);setGroupSummaryState({...groupSummaryState,[i]:texts.length?`Common issue: ${SERVICES[g[0].service].name} reported by ${texts.length} citizens in ${[...new Set(g.map(a=>a.ward))].join(", ")}.`:""})}}>Generate summary</Button><Button small onClick={()=>{g.forEach(a=>setStatus(store,a.id,a.status+1,session.user));setStore({...store})}}>Advance all</Button><Button small primary onClick={()=>{g.forEach(a=>setStatus(store,a.id,4,session.user));setStore({...store})}}>Resolve all</Button></div>{groupSummaryState[i]&&<div className="success" style={{marginTop:10}}>{groupSummaryState[i]}</div>}</div>):<div className="empty">No multi-request groups right now.</div>}</>}
    {tab==="analytics" && <Analytics apps={apps}/>}
  </>;
}

function Metric({label,value}){return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>}

function Analytics({apps}) {
  const byService=Object.entries(apps.reduce((a,x)=>(a[x.service]=(a[x.service]||0)+1,a),{}));
  const byStage=Object.entries(apps.reduce((a,x)=>(a[WORKFLOWS[x.kind][x.status]]=(a[WORKFLOWS[x.kind][x.status]]||0)+1,a),{}));
  return <div className="grid grid-2"><div className="card"><h3>Requests by service</h3>{byService.map(([k,v])=><div key={k} style={{margin:"12px 0"}}><div className="small">{SERVICES[k].name} · {v}</div><div className="progress"><span style={{width:`${Math.max(8,v/apps.length*100)}%`}}/></div></div>)}</div><div className="card"><h3>Requests by stage</h3>{byStage.map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--line)"}}><span>{k}</span><b>{v}</b></div>)}</div></div>;
}

function AdminView({store,setStore,tab,setTab}) {
  const apps=store.apps;
  const [filter,setFilter]=useState("");
  const total=apps.length;
  const overdue=apps.filter(a=>isOverdue(store,a)).length;
  const up=Object.values(store.connectors).filter(c=>c.up).length;
  return <>
    <nav className="tabs">{[["dashboard","Monitoring"],["connectors","Connectors"],["workflow","Workflow"],["audit","Audit log"],["quality","Data quality"],["demo","Demo controls"]].map(([k,l])=><button key={k} className={`tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>)}</nav>
    {tab==="dashboard" && <><div className="grid grid-4"><Metric label="Total requests" value={total}/><Metric label="Open" value={apps.filter(a=>a.status<4).length}/><Metric label="SLA compliance" value={`${total?Math.round((total-overdue)/total*100):100}%`}/><Metric label="Connectors up" value={`${up}/${Object.keys(store.connectors).length}`}/></div><div className="grid grid-4" style={{marginTop:14}}><Metric label="Duplicates blocked" value={store.stats.dup_blocked}/><Metric label="Fields auto-filled" value={store.stats.autofilled}/><Metric label="Queued" value={apps.filter(a=>a.queued).length}/><Metric label="Active consents" value={Object.values(store.users).reduce((n,u)=>n+Object.values(u.consents||{}).filter(c=>c.granted).length,0)}/></div><hr/><div className="section-head"><h2>Recent events</h2></div><EventTable events={store.events.slice(0,15)}/></>}
    {tab==="connectors" && <ConnectorView store={store} setStore={setStore}/>}
    {tab==="workflow" && <WorkflowView store={store} setStore={setStore}/>}
    {tab==="audit" && <><div className="field"><input className="input" placeholder="Filter actor, action or detail" value={filter} onChange={e=>setFilter(e.target.value)}/></div><EventTable events={store.audit.filter(e=>`${e.actor} ${e.action} ${e.detail}`.toLowerCase().includes(filter.toLowerCase()))}/></>}
    {tab==="quality" && <QualityView store={store}/>}
    {tab==="demo" && <div className="card"><h3>Reset prototype data</h3><p className="muted">Restore the seeded demo accounts, applications, connectors and metrics on this browser.</p><Button danger onClick={()=>setStore(resetStore())}>Reset demo data</Button></div>}
  </>;
}

function EventTable({events}) {
  return <div className="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Reference</th><th>Department</th><th>Detail</th></tr></thead><tbody>{events.length?events.map((e,i)=><tr key={i}><td>{formatDate(e.time)}</td><td>{e.topic||e.action}</td><td>{e.app_id||e.actor||"—"}</td><td>{e.dept||"—"}</td><td>{e.detail}</td></tr>):<tr><td colSpan="5">No records.</td></tr>}</tbody></table></div>;
}

function ConnectorView({store,setStore}) {
  return <div className="grid">{Object.entries(DEPTS).map(([dept,info])=>{const up=store.connectors[dept].up;const queued=store.apps.filter(a=>a.dept===dept&&a.queued);return <div className="card" key={dept}><div className="section-head"><div><h3>{dept}</h3><div className="small">{info.system} · {info.type}</div></div><Badge tone={up?"green":"red"}>{up?"Healthy":"Down"}</Badge></div><label style={{display:"flex",gap:8,alignItems:"center",fontSize:13}}><input type="checkbox" checked={!up} onChange={e=>{store.connectors[dept].up=!e.target.checked;setStore({...store})}}/> Simulate outage</label>{queued.length>0&&<div style={{marginTop:12}}><Badge tone="amber">{queued.length} queued</Badge> <Button small onClick={()=>{retryQueued(store,dept);setStore({...store})}}>Retry queued</Button></div>}</div>})}</div>;
}

function WorkflowView({store,setStore}) {
  return <div className="grid grid-2">{Object.entries(SERVICES).map(([key,svc])=><div className="card" key={key}><b>{svc.name}</b><div className="small">{svc.dept} · {WORKFLOWS[svc.kind].join(" → ")}</div><div style={{display:"flex",gap:8,alignItems:"center",marginTop:10}}><span className="small">SLA days</span><input className="input" style={{maxWidth:100}} type="number" min="1" max="60" value={store.sla[key]} onChange={e=>{store.sla[key]=Number(e.target.value);setStore({...store})}}/></div></div>)}</div>;
}

function QualityView({store}) {
  const rows=[];
  Object.entries(store.users).forEach(([email,u])=>{
    const p=u.profile;
    if(!/^[6-9]\d{9}$/.test(p.mobile||"")) rows.push([email,"Invalid mobile"]);
    if(!/^\d{12}$/.test(p.aadhaar||"")) rows.push([email,"Invalid Aadhaar"]);
    if(!/^\d{6}$/.test(p.pin||"")) rows.push([email,"Invalid PIN"]);
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email||"")) rows.push([email,"Invalid email"]);
  });
  const byAad={};
  Object.entries(store.users).forEach(([email,u])=>{byAad[u.profile.aadhaar]=(byAad[u.profile.aadhaar]||[]).concat(email)});
  Object.entries(byAad).forEach(([aad,emails])=>{if(aad&&emails.length>1) rows.push([emails.join(", "),`Same Aadhaar ${maskAadhaar(aad)}`])});
  return <><div className="metric" style={{marginBottom:14}}><div className="metric-label">Issues found</div><div className="metric-value">{rows.length}</div></div>{rows.length?<div className="table-wrap"><table><thead><tr><th>Citizen</th><th>Issue</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody></table></div>:<div className="success">No data-quality issues detected.</div>}</>;
}
