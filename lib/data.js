export const OFFICER_PASSWORD = "Officer@2026";
export const ADMIN = { email: "admin@gov.in", password: "Admin@2026" };
export const DEMO_CITIZEN = { email: "ramesh.kumar@gov.in", password: "Citizen@2026" };

export const WARDS = Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`);

export const WORKFLOWS = {
  complaint: ["Submitted", "Routed to department", "Assigned to officer", "In progress", "Resolved"],
  application: ["Submitted", "Documents verified", "Under officer review", "Approved", "Issued"]
};

export const DEPTS = {
  "Revenue Department": { slug: "revenue", system: "e-District portal", type: "Legacy SOAP/XML" },
  "Water Board": { slug: "water", system: "Jal Seva portal", type: "Modern REST/JSON" },
  "Electricity Board": { slug: "electricity", system: "Billing & CRM", type: "Legacy CSV batch" },
  "Public Works Department": { slug: "pwd", system: "PWD grievance MIS", type: "Modern REST/JSON" },
  "Police Department": { slug: "police", system: "Crime & complaint system", type: "Legacy SOAP/XML" },
  "Transport Department": { slug: "transport", system: "Licence & vehicle system", type: "Modern REST/JSON" },
  "Municipal Corporation": { slug: "municipal", system: "Nagar Seva portal", type: "Modern REST/JSON" },
  "Food & Civil Supplies": { slug: "food", system: "PDS portal", type: "Legacy CSV batch" },
  "District Administration": { slug: "district", system: "Public grievance portal", type: "Modern REST/JSON" }
};

export const SOURCES = {
  aadhaar: "Aadhaar eKYC (UIDAI, simulated)",
  income: "Income records (Revenue Dept)",
  caste: "Caste records (Revenue Dept)",
  address: "Address records (Revenue Dept)",
  family: "Family records (Revenue Dept)",
  licence: "Licence records (Transport Dept)",
  property: "Property records (Municipal Corp)"
};

export const ALL_SOURCES = Object.values(SOURCES);

export const SERVICES = {
  water_supply: { name: "Water supply problem", dept: "Water Board", kind: "complaint", sla: 3, keywords: ["water","paani","pani","tanker","pipeline","nal","handpump","hand pump","पानी","जल"], sources: [], extras: [] },
  road_repair: { name: "Road / pothole repair", dept: "Public Works Department", kind: "complaint", sla: 7, keywords: ["road","sadak","pothole","gadde","bridge","pul","rasta","सड़क","गड्ढा"], sources: [], extras: [] },
  electricity_complaint: { name: "Electricity / power fault", dept: "Electricity Board", kind: "complaint", sla: 2, keywords: ["electricity","bijli","power","taar","transformer","street light","streetlight","light","बिजली"], sources: [], extras: [] },
  police_complaint: { name: "Police complaint", dept: "Police Department", kind: "complaint", sla: 3, keywords: ["police","thana","fir","theft","chori","stolen","robbery","cheating","fraud","पुलिस","चोरी"], sources: [], extras: [] },
  criminal_activity: { name: "Report criminal activity", dept: "Police Department", kind: "complaint", sla: 1, keywords: ["criminal","crime","gunda","drugs","nasha","violence","suspicious","illegal","weapon","hathiyar","harassment","maar peet","fight","अपराध"], sources: [], extras: [] },
  sanitation: { name: "Garbage / drainage", dept: "Municipal Corporation", kind: "complaint", sla: 5, keywords: ["garbage","kooda","kachra","naali","drain","sewage","gandagi","badbu","safai","कचरा","नाली"], sources: [], extras: [] },
  income_certificate: { name: "Income certificate", dept: "Revenue Department", kind: "application", sla: 10, keywords: ["income","aay","aamdani","income certificate","आय"], sources: [SOURCES.aadhaar,SOURCES.income], extras: [{label:"Purpose", options:["Scholarship","Job / exam","Loan","Other"]}] },
  caste_certificate: { name: "Caste certificate", dept: "Revenue Department", kind: "application", sla: 12, keywords: ["caste","jati","jaati","obc","caste certificate","जाति"], sources: [SOURCES.aadhaar,SOURCES.caste], extras: [{label:"Purpose", options:["Education","Job / exam","Other"]}] },
  residence_certificate: { name: "Residence certificate", dept: "Revenue Department", kind: "application", sla: 8, keywords: ["residence","residential","niwas","nivas","domicile","address proof","निवास"], sources: [SOURCES.aadhaar,SOURCES.address], extras: [{label:"Purpose", options:["School / college","Job / exam","Other"]}] },
  driving_licence: { name: "Driving licence", dept: "Transport Department", kind: "application", sla: 15, keywords: ["license","licence","driving","dl","driving licence","लाइसेंस"], sources: [SOURCES.aadhaar,SOURCES.licence], extras: [{label:"Licence type", options:["Learner's licence","Permanent licence (new)","Renewal"]}] },
  ration_card: { name: "Ration card", dept: "Food & Civil Supplies", kind: "application", sla: 12, keywords: ["ration","pds","rashan","ration card","राशन"], sources: [SOURCES.aadhaar,SOURCES.family], extras: [{label:"Card type", options:["New","Add family member","Correction"]}] },
  birth_certificate: { name: "Birth certificate", dept: "Municipal Corporation", kind: "application", sla: 7, keywords: ["birth","janm","birth certificate","जन्म"], sources: [SOURCES.aadhaar], extras: [{label:"Child's name"}, {label:"Child's date of birth"}] },
  new_water_connection: { name: "New water connection", dept: "Water Board", kind: "application", sla: 14, keywords: ["water connection","new water connection","nal connection","pipeline connection"], sources: [SOURCES.aadhaar,SOURCES.property], extras: [{label:"Connection type", options:["Domestic","Commercial"]}] },
  new_electricity_connection: { name: "New electricity connection", dept: "Electricity Board", kind: "application", sla: 14, keywords: ["electricity connection","bijli connection","new meter","meter","new connection"], sources: [SOURCES.aadhaar,SOURCES.property], extras: [{label:"Load type", options:["Domestic","Commercial","Agriculture"]}] },
  general_grievance: { name: "Other / general grievance", dept: "District Administration", kind: "complaint", sla: 10, keywords: [], sources: [], extras: [] }
};

export const QUICK = ["water_supply","road_repair","electricity_complaint","police_complaint","income_certificate","caste_certificate","residence_certificate","driving_licence"];

export function profileFor(name,email,father,mobile,aadhaar,ward,dob="1995-04-12",income="180000",category="OBC",occupation="Self-employed") {
  return {
    full_name:name, father_name:father, dob, gender:["Sunita Devi","Pooja Kumari","Meena Yadav"].includes(name) ? "Female" : "Male",
    mobile, email, aadhaar, address:`House 12, Main Road, ${ward}`, ward, pin:"800001",
    district:"Patna", category, occupation, income
  };
}

export function createSeedStore() {
  const store = {
    users: {}, officers: {}, apps: [], audit: [], events: [], connectors: {},
    stats: { dup_blocked: 0, autofilled: 0 },
    sla: Object.fromEntries(Object.entries(SERVICES).map(([k,v]) => [k,v.sla])),
    seq: 2800
  };

  Object.entries(DEPTS).forEach(([dept,info]) => {
    store.connectors[dept] = { up:true };
    store.officers[`${info.slug}.officer@gov.in`] = {
      password: OFFICER_PASSWORD, name:`${dept} Officer`, dept
    };
  });

  const people = [
    [DEMO_CITIZEN.email,"Ramesh Kumar","Mohan Kumar","9876501234","234567890123","Ward 7"],
    ["sunita@example.in","Sunita Devi","Raj Kishore","9876501235","345678901234","Ward 7"],
    ["amit@example.in","Amit Singh","Ravi Singh","9876501236","456789012345","Ward 7"],
    ["pooja@example.in","Pooja Kumari","Sanjay Prasad","9876501237","567890123456","Ward 3"],
    ["rahul@example.in","Rahul Verma","Dinesh Verma","98765","678901234567","Ward 3"],
    ["meena@example.in","Meena Yadav","Bhola Yadav","9876501239","234567890123","Ward 4"],
    ["vikash@example.in","Vikash Kumar","Ajay Kumar","9876501240","789012345678","Ward 5"]
  ];
  people.forEach(([email,name,father,mob,aad,ward]) => {
    store.users[email] = { password:DEMO_CITIZEN.password, profile:profileFor(name,email,father,mob,aad,ward), consents:{} };
  });

  const seeds = [
    [DEMO_CITIZEN.email,"income_certificate","Income certificate for scholarship","Ward 7",{Purpose:"Scholarship"},30,2],
    [DEMO_CITIZEN.email,"road_repair","Big pothole near our lane causing accidents","Ward 7",{},20,1],
    ["sunita@example.in","water_supply","Paani 4 din se band hai, tanker bhi nahi aa raha","Ward 7",{},100,1],
    ["amit@example.in","water_supply","No water supply for 3 days, tanker not coming","Ward 7",{},40,1],
    ["meena@example.in","water_supply","Water pipeline leaking and no water in the morning","Ward 7",{},8,0],
    ["pooja@example.in","road_repair","Sadak par bade gadde hain, bike slip ho rahi hai","Ward 3",{},70,1],
    ["rahul@example.in","road_repair","Big potholes on main road near school, dangerous","Ward 3",{},60,1],
    ["vikash@example.in","criminal_activity","Suspicious people selling drugs near the school gate","Ward 5",{},6,0],
    ["sunita@example.in","police_complaint","Mobile phone stolen near market, want to file FIR","Ward 2",{},12,1],
    ["meena@example.in","sanitation","Garbage not collected for 10 days, bad smell","Ward 4",{},150,1],
    ["pooja@example.in","sanitation","Kooda nahi uthaya gaya, naali ka paani bhi beh raha hai","Ward 4",{},30,2],
    ["amit@example.in","electricity_complaint","Bijli ka taar latak raha hai, kabhi bhi haadsa ho sakta hai","Ward 4",{},5,1],
    ["vikash@example.in","caste_certificate","Caste certificate for exam form","Ward 5",{"Purpose":"Job / exam"},25,1],
    ["rahul@example.in","driving_licence","Learner's licence","Ward 3",{"Licence type":"Learner's licence"},15,0],
    ["meena@example.in","ration_card","Add family member","Ward 4",{"Card type":"Add family member"},200,3]
  ];

  seeds.forEach(([email,key,text,ward,extras,hours,status]) => {
    addApplication(store,email,key,text,ward,extras,hours,status);
  });

  store.stats.dup_blocked = 0;
  store.audit = store.audit.slice(-40);
  store.events = store.events.slice(-40);
  return store;
}

function addApplication(store,email,key,text,ward,extras,hours,status) {
  const svc = SERVICES[key];
  store.seq += 1;
  const created = new Date(Date.now() - hours*60*60*1000).toISOString();
  const app = {
    id:`OG-${store.seq}`, citizen:email, service:key, dept:svc.dept, kind:svc.kind,
    text, ward, extras:extras || {}, sources:[...svc.sources], urgency: urgencyFor(key,text),
    status:Math.min(4,status), created, history:[
      {time:created,text:"Submitted by citizen"},
      {time:created,text:`${neededFields(svc.kind).length} fields auto-filled from master profile`}
    ],
    queued:false, payload: JSON.stringify({applicationId:`OG-${store.seq}`,serviceCode:key,department:svc.dept,description:text},null,2),
    ack:`${DEPTS[svc.dept].slug.toUpperCase()}-ACK-${1000+store.seq%9000}`, has_photo:false
  };
  store.apps.push(app);
  store.stats.autofilled += neededFields(svc.kind).length;
  audit(store,"system","system","application.created",`${app.id} ${svc.name}`);
  event(store,"application.created",app,svc.name);
}

function audit(store,actor,role,action,detail="") {
  store.audit.push({time:new Date().toISOString(),actor,role,action,detail});
}
function event(store,topic,app,detail="") {
  store.events.push({time:new Date().toISOString(),topic,app_id:app?.id || "",citizen:app?.citizen || "",dept:app?.dept || "",detail});
}

export function neededFields(kind) {
  return kind === "complaint" ? ["full_name","mobile","address","ward"] : ["full_name","father_name","dob","mobile","address","aadhaar","pin","district"];
}

export function maskAadhaar(value="") {
  const digits = String(value).replace(/\D/g,"");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
}

export function validateProfile(p) {
  const issues=[];
  if ((p.full_name || "").trim().length < 3) issues.push("Name is too short");
  if (!/^[6-9]\d{9}$/.test(p.mobile || "")) issues.push("Mobile must be 10 digits starting with 6-9");
  if (!/^\d{12}$/.test(p.aadhaar || "")) issues.push("Aadhaar must be 12 digits");
  if (!/^\d{6}$/.test(p.pin || "")) issues.push("PIN code must be 6 digits");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email || "")) issues.push("Email looks invalid");
  if (!p.dob || Number.isNaN(Date.parse(p.dob))) issues.push("Date of birth is required");
  if (!(p.address || "").trim()) issues.push("Address is required");
  return issues;
}

export function routeKeywords(query) {
  const q = ` ${String(query).toLowerCase().replace(/[^\w\u0900-\u097F ]/g," ")} `;
  const scores={};
  Object.entries(SERVICES).forEach(([key,svc]) => {
    let score=0;
    svc.keywords.forEach(kw => {
      if (q.includes(` ${kw} `) || (kw.length >= 5 && q.includes(kw))) score += 1 + kw.split(" ").length;
    });
    if (score) scores[key]=score;
  });
  return Object.entries(scores).sort((a,b)=>b[1]-a[1]);
}

export function urgencyFor(serviceKey,text) {
  const svc=SERVICES[serviceKey];
  if (svc.kind==="application") return 2;
  let base={criminal_activity:4,police_complaint:3,electricity_complaint:3,water_supply:3}[serviceKey] || 2;
  if (["danger","accident","fire","weapon","hathiyar","injur","emergency","gun","death","live wire","khatra","haadsa","sparking","latak","days"].some(w=>String(text).toLowerCase().includes(w))) base++;
  return Math.min(5,base);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value));
}

export function dueDate(store,app) {
  const d=new Date(app.created);
  d.setDate(d.getDate() + Number(store.sla[app.service] || SERVICES[app.service].sla));
  return d;
}

export function isOverdue(store,app) {
  return app.status < 4 && new Date() > dueDate(store,app);
}

function tokens(text) {
  const stop=new Set("the a an is are was of in on at to for and or my our not no hai hain ka ki ke se mein me par nahi ho raha rahi rha hamare mere yaha here there it this that with from have has been since near very".split(" "));
  return new Set(String(text).toLowerCase().match(/[\w\u0900-\u097F]+/g)?.filter(w=>!stop.has(w)&&w.length>2) || []);
}

function jaccard(a,b) {
  const A=tokens(a),B=tokens(b);
  const union=new Set([...A,...B]);
  return union.size ? [...A].filter(x=>B.has(x)).length/union.size : 0;
}

export function groupComplaints(apps) {
  const list=apps.filter(a=>a.kind==="complaint" && a.status<4);
  const groups=[];
  list.forEach(app=>{
    let target=null;
    for(const g of groups) {
      const first=g[0];
      if(first.service===app.service && (first.ward===app.ward || jaccard(first.text,app.text)>=0.3)) { target=g; break; }
    }
    if(target) target.push(app); else groups.push([app]);
  });
  return groups.sort((a,b)=>b.length-a.length);
}

export function groupSummary(group) {
  const wards=[...new Set(group.map(a=>a.ward))].join(", ");
  return `${group.length} citizens report "${SERVICES[group[0].service].name}" in ${wards}. Highest urgency ${Math.max(...group.map(a=>a.urgency))}/5.`;
}

export function canonicalPayload(store,app) {
  const user=store.users[app.citizen];
  const p=user?.profile || {};
  return {
    applicationId:app.id,serviceCode:app.service,serviceName:SERVICES[app.service].name,
    department:app.dept,kind:app.kind,priority:app.urgency,
    citizen:{name:p.full_name,dob:p.dob,mobile:p.mobile,address:p.address,ward:app.ward,aadhaarRef:maskAadhaar(p.aadhaar)},
    description:app.text,extras:app.extras,consentedSources:app.sources,submittedAt:app.created
  };
}

export function payloadFor(type,canon) {
  if(type.startsWith("Modern")) return JSON.stringify(canon,null,2);
  const flat={};
  const walk=(obj,prefix="")=>{
    Object.entries(obj||{}).forEach(([k,v])=>{
      const key=prefix+k;
      if(v && typeof v==="object" && !Array.isArray(v)) walk(v,key+".");
      else flat[key]=Array.isArray(v)?v.join("; "):v;
    });
  };
  walk(canon);
  if(type.includes("SOAP")) {
    const body=Object.entries(flat).map(([k,v])=>`    <${k.replace(/\./g,"_")}>${String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</${k.replace(/\./g,"_")}>`).join("\n");
    return `<soap:Envelope>\n  <soap:Body>\n   <SubmitRequest>\n${body}\n   </SubmitRequest>\n  </soap:Body>\n</soap:Envelope>`;
  }
  const headers=Object.keys(flat).join(",");
  const values=Object.values(flat).map(v=>`"${String(v).replaceAll('"','""')}"`).join(",");
  return `${headers}\n${values}`;
}
