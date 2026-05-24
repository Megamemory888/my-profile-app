import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const OFFENCES = ["Aggravated Assault","Armed Robbery","Bribery","Burglary","Counterfeit Operations","Cybercrime","Domestic Violence","Drug Trafficking","Extortion","Fraud","Human Trafficking","Identity Fraud","Illegal Firearm Possession","Insurance Fraud","Kidnapping","Money Laundering","Organized Crime Activity","Smuggling","Tax Evasion","Vehicle Theft"];
const OCCUPATIONS = ["Accountant","Business Owner","Construction Worker","Dock Worker","Farmer","Fisherman","Hotel Staff","IT Technician","Mechanic","Nightclub Operator","Retail Manager","Security Guard","Taxi Driver","Warehouse Supervisor"];
const LOCATIONS = ["Ba","Labasa","Lautoka","Levuka","Nadi","Nausori","Rakiraki","Savusavu","Sigatoka","Suva"];
const BEH = ["Financially motivated offender","Frequent cross-border travel","History of violent escalation","Known to operate in groups","Maintains low public profile","Repeat offender with regional links","Suspected gang affiliations","Technically skilled offender"];
const PSY = ["Avoids direct confrontation when possible","Calculated and methodical","Displays anti-social behaviour patterns","High adaptability","Impulsive under pressure","Manipulative tendencies observed"];

const OFFENCE_COLOR = {
  "Aggravated Assault":    { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Armed Robbery":         { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Domestic Violence":     { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Kidnapping":            { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Human Trafficking":     { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Illegal Firearm Possession":{ bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Drug Trafficking":      { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Organized Crime Activity":{ bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Smuggling":             { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Fraud":                 { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Bribery":               { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Cybercrime":            { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Counterfeit Operations":{ bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Identity Fraud":        { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Insurance Fraud":       { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Money Laundering":      { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Tax Evasion":           { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Extortion":             { bg:"#EEEDFE", text:"#26215C", border:"#AFA9EC", dot:"#534AB7" },
  "Burglary":              { bg:"#E6F1FB", text:"#042C53", border:"#85B7EB", dot:"#185FA5" },
  "Vehicle Theft":         { bg:"#E6F1FB", text:"#042C53", border:"#85B7EB", dot:"#185FA5" },
};

const RISK_STYLE = {
  Low:      { bg:"#EAF3DE", text:"#27500A", border:"#97C459", dot:"#639922" },
  Moderate: { bg:"#FAEEDA", text:"#633806", border:"#EF9F27", dot:"#BA7517" },
  High:     { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  Severe:   { bg:"#FDEAEA", text:"#501313", border:"#F09595", dot:"#E24B4A" },
};
const STATUS_STYLE = {
  "Wanted":               { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0" },
  "In Custody":           { bg:"#E6F1FB", text:"#042C53", border:"#85B7EB" },
  "Released on Parole":   { bg:"#FAEEDA", text:"#412402", border:"#FAC775" },
  "Sentence Completed":   { bg:"#EAF3DE", text:"#173404", border:"#97C459" },
  "Under Investigation":  { bg:"#EEEDFE", text:"#26215C", border:"#AFA9EC" },
};

const C = {
  bg:      "#F4F5F7",
  surface: "#FFFFFF",
  surface2:"#F0F2F5",
  nav:     "#1C2B4A",
  navText: "#FFFFFF",
  navMuted:"rgba(255,255,255,0.55)",
  border:  "#DDE1E9",
  border2: "#C8CDD8",
  text:    "#1A1D23",
  text2:   "#4A5568",
  text3:   "#7B8794",
  accent:  "#1A56DB",
  accentL: "#EBF2FF",
};

const inp = { padding:"7px 10px",fontSize:12,borderRadius:6,border:`1px solid ${C.border2}`,background:C.surface,color:C.text,fontFamily:"inherit",width:"100%",boxSizing:"border-box" };
const btnSm = { display:"inline-flex",alignItems:"center",gap:5,padding:"6px 14px",fontSize:12,fontWeight:500,borderRadius:6,border:`1px solid ${C.border2}`,background:C.surface,color:C.text2,cursor:"pointer",whiteSpace:"nowrap" };
const btnBlue = { ...btnSm,background:C.accent,color:"#fff",border:`1px solid ${C.accent}`,fontWeight:600 };
const btnRed = { ...btnSm,color:"#7A1A1A",border:"1px solid #F0A0A0",background:"#FDEAEA" };

function Badge({ label, style:s={} }) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:500,background:s.bg||"#eee",color:s.text||"#333",border:`1px solid ${s.border||"#ccc"}`,whiteSpace:"nowrap"}}>
    {s.dot && <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>}
    {label}
  </span>;
}

function Avatar({ r, size=40 }) {
  const ini = r.name?.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
  const rs = RISK_STYLE[r.risk]||{};
  if (r.photo_url) return <img src={r.photo_url} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${rs.border||C.border}`,flexShrink:0}} />;
  return <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:rs.bg||C.accentL,color:rs.text||C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.3),fontWeight:600,border:`2px solid ${rs.border||C.border}`,letterSpacing:"0.05em"}}>{ini}</div>;
}

function ThumbCanvas({ value, onChange }) {
  const ref = useRef(); const draw = useRef(false); const last = useRef([0,0]);
  useEffect(()=>{
    const c=ref.current; if(!c)return;
    const ctx=c.getContext("2d"); ctx.fillStyle="#F8F9FA"; ctx.fillRect(0,0,c.width,c.height);
    if(value){const img=new Image(); img.onload=()=>ctx.drawImage(img,0,0,c.width,c.height); img.src=value;}
  },[]);
  const pos=(e)=>{const r=ref.current.getBoundingClientRect(),sx=ref.current.width/r.width,sy=ref.current.height/r.height,src=e.touches?e.touches[0]:e;return[(src.clientX-r.left)*sx,(src.clientY-r.top)*sy];};
  const start=(e)=>{draw.current=true;last.current=pos(e);};
  const move=(e)=>{if(!draw.current)return;e.preventDefault?.();const c=ref.current,ctx=c.getContext("2d"),[x,y]=pos(e);ctx.strokeStyle="#1A56DB";ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(...last.current);ctx.lineTo(x,y);ctx.stroke();last.current=[x,y];onChange(c.toDataURL());};
  const stop=()=>{draw.current=false;};
  const clear=()=>{const c=ref.current,ctx=c.getContext("2d");ctx.fillStyle="#F8F9FA";ctx.fillRect(0,0,c.width,c.height);onChange(null);};
  return (
    <div>
      <canvas ref={ref} width={200} height={120} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        style={{display:"block",width:"100%",borderRadius:6,cursor:"crosshair",border:`1px solid ${C.border2}`,background:"#F8F9FA"}} />
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <button onClick={clear} style={btnSm}>Clear</button>
        <label style={{...btnSm,cursor:"pointer"}}>Upload<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=ev=>{const c=ref.current,ctx=c.getContext("2d"),img=new Image();img.onload=()=>{ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);onChange(c.toDataURL());};img.src=ev.target.result;};fr.readAsDataURL(f);}}/></label>
      </div>
      <p style={{fontSize:10,color:C.text3,marginTop:4,textAlign:"center"}}>Draw or upload a scan</p>
    </div>
  );
}

async function uploadFile(dataUrl, folder, id) {
  if (!dataUrl) return null;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const path = `${folder}/${id}.${ext}`;
  const { error } = await supabase.storage.from("biometrics").upload(path, blob, { upsert:true });
  if (error) { console.error("Upload error:", error); return null; }
  return supabase.storage.from("biometrics").getPublicUrl(path).data.publicUrl;
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = async () => {
    if (!email || !password) { setError("Please enter email and password"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Incorrect email or password"); setLoading(false); return; }
    onLogin(); setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:C.surface,borderRadius:12,padding:"36px 32px",width:360,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:`1px solid ${C.border}`}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:12,background:C.nav,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:22}}>🛡️</div>
          <div style={{fontSize:20,fontWeight:700,color:C.text}}>Criminal Intelligence</div>
          <div style={{fontSize:12,color:C.text3,marginTop:4}}>Fiji Police Administration System</div>
        </div>
        {error && <div style={{background:"#FDEAEA",border:"1px solid #F0A0A0",color:"#7A1A1A",padding:"8px 12px",borderRadius:6,fontSize:12,marginBottom:16}}>{error}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <label style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.06em"}}>Email address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="officer@police.gov.fj" style={inp}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <label style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.06em"}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••" style={inp}/>
          </div>
          <button onClick={login} style={{...btnBlue,justifyContent:"center",padding:"10px",fontSize:13,marginTop:4}} disabled={loading}>
            {loading?"Signing in...":"Sign in to system"}
          </button>
        </div>
        <p style={{fontSize:11,color:C.text3,textAlign:"center",marginTop:20,lineHeight:1.5}}>Authorised personnel only. All access is logged and monitored.</p>
      </div>
    </div>
  );
}

function SectionLabel({ children, icon }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
      {icon && <span style={{fontSize:13}}>{icon}</span>}
      {children}
    </div>
  );
}

function Modal({ record, onSave, onClose, allIds }) {
  const isNew = !record.id;
  const [f, setF] = useState({
    name:record.name||"", alias:record.alias||"", gender:record.gender||"Male",
    dob:record.dob||"", location:record.location||"Suva", occupation:record.occupation||"Taxi Driver",
    primary_offence:record.primary_offence||"Fraud", secondary_offence:record.secondary_offence||"Bribery",
    arrest_year:record.arrest_year||2025, sentence:record.sentence||1,
    risk:record.risk||"Moderate", status:record.status||"Under Investigation",
    associates:record.associates||0, convictions:record.convictions||0,
    behaviour:record.behaviour||BEH[0], psych:record.psych||PSY[0],
    photo_url:record.photo_url||null, thumb_url:record.thumb_url||null,
    home_address:record.home_address||"", phone_number:record.phone_number||"",
    vehicle_registration:record.vehicle_registration||"", family_members:record.family_members||"",
    medical_conditions:record.medical_conditions||"", release_date:record.release_date||"",
    case_notes:record.case_notes||"",
    photoData:null, thumbData:null,
  });
  const [saving, setSaving] = useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const save = async () => {
    if (!f.name.trim()) { alert("Name is required"); return; }
    setSaving(true);
    const ids = allIds.map(i=>parseInt(i.split("-")[1])||0);
    const newId = record.id || ("FJ-" + (Math.max(0,...ids)+1));
    let photo_url = f.photo_url;
    let thumb_url = f.thumb_url;
    if (f.photoData) photo_url = await uploadFile(f.photoData, "photos", newId);
    if (f.thumbData) thumb_url = await uploadFile(f.thumbData, "thumbs", newId);
    const dbRecord = {
      id:newId, name:f.name, alias:f.alias, gender:f.gender, dob:f.dob,
      nationality:"Fijian", location:f.location, occupation:f.occupation,
      primary_offence:f.primary_offence, secondary_offence:f.secondary_offence,
      arrest_year:f.arrest_year, sentence:f.sentence, risk:f.risk, status:f.status,
      associates:f.associates, convictions:f.convictions, behaviour:f.behaviour,
      psych:f.psych, photo_url, thumb_url,
      home_address:f.home_address, phone_number:f.phone_number,
      vehicle_registration:f.vehicle_registration, family_members:f.family_members,
      medical_conditions:f.medical_conditions, release_date:f.release_date,
      case_notes:f.case_notes,
    };
    onSave(dbRecord); setSaving(false);
  };

  const fg=(label,key,type="text",opts=null,full=false,area=false)=>(
    <div style={{display:"flex",flexDirection:"column",gap:4,gridColumn:full?"1/-1":"auto"}}>
      <label style={{fontSize:11,fontWeight:600,color:C.text2,letterSpacing:"0.04em"}}>{label}</label>
      {area
        ? <textarea value={f[key]} onChange={e=>set(key,e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
        : opts
          ? <select value={f[key]} onChange={e=>set(key,e.target.value)} style={inp}>{opts.map(o=><option key={o}>{o}</option>)}</select>
          : <input type={type} value={f[key]} onChange={e=>set(key,type==="number"?Number(e.target.value):e.target.value)} style={inp}/>
      }
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 10px",backdropFilter:"blur(3px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:12,width:580,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.nav}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{isNew?"New Criminal Profile":"Edit Profile"}</div>
            {!isNew && <div style={{fontSize:11,color:C.navMuted,marginTop:1}}>ID: {record.id}</div>}
          </div>
          <button onClick={onClose} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"4px 10px"}}>✕ Close</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"18px 20px",display:"flex",flexDirection:"column",gap:18,background:C.bg}}>

          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="🔬">Biometric data</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:C.text2,marginBottom:8}}>Profile photo</div>
                <label style={{display:"block",cursor:"pointer"}}>
                  <div style={{border:`1.5px dashed ${C.border2}`,borderRadius:8,padding:12,textAlign:"center",minHeight:90,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,background:C.surface2}}>
                    {(f.photoData||f.photo_url)?<img src={f.photoData||f.photo_url} alt="" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.accent}`}}/>:<><div style={{fontSize:26}}>📷</div><div style={{fontSize:11,color:C.text3}}>Click to upload photo</div></>}
                  </div>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const fl=e.target.files[0];if(!fl)return;const fr=new FileReader();fr.onload=ev=>set("photoData",ev.target.result);fr.readAsDataURL(fl);}}/>
                </label>
                {(f.photoData||f.photo_url)&&<button onClick={()=>{set("photoData",null);set("photo_url",null);}} style={{...btnSm,marginTop:6,width:"100%",justifyContent:"center",color:"#7A1A1A",border:"1px solid #F0A0A0"}}>Remove photo</button>}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:C.text2,marginBottom:8}}>Thumbprint</div>
                <ThumbCanvas value={f.thumb_url} onChange={v=>set("thumbData",v)}/>
              </div>
            </div>
          </div>

          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="👤">Personal details</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {fg("Full Name *","name")} {fg("Alias / Nickname","alias")}
              {fg("Gender","gender","text",["Male","Female"])} {fg("Date of birth","dob","date")}
              {fg("Last known location","location","text",LOCATIONS)} {fg("Occupation","occupation","text",OCCUPATIONS)}
              {fg("📞 Phone number","phone_number")} {fg("🚗 Vehicle registration","vehicle_registration")}
              <div style={{gridColumn:"1/-1"}}>{fg("🏠 Home address","home_address","text",null,true)}</div>
              {fg("👨‍👩‍👧 Family members","family_members","text",null,false,false)}
              {fg("🏥 Medical conditions","medical_conditions","text",null,false,false)}
            </div>
          </div>

          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="⚖️">Criminal record</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {fg("Primary offence","primary_offence","text",OFFENCES)} {fg("Secondary offence","secondary_offence","text",OFFENCES)}
              {fg("Arrest year","arrest_year","number")} {fg("Sentence (years)","sentence","number")}
              {fg("Risk level","risk","text",["Low","Moderate","High","Severe"])} {fg("Current status","status","text",["Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"])}
              {fg("Known associates","associates","number")} {fg("Prior convictions","convictions","number")}
              {fg("📅 Release date","release_date","date")}
              <div style={{gridColumn:"1/-1"}}>{fg("Behavioural notes","behaviour","text",BEH,true)}</div>
              <div style={{gridColumn:"1/-1"}}>{fg("Psychological profile","psych","text",PSY,true)}</div>
            </div>
          </div>

          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="📝">Case notes</SectionLabel>
            <textarea value={f.case_notes} onChange={e=>set("case_notes",e.target.value)} rows={5} placeholder="Enter detailed case notes, incident history, investigation updates..." style={{...inp,resize:"vertical"}}/>
          </div>

        </div>
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end",background:C.surface}}>
          <button onClick={onClose} style={btnSm}>Cancel</button>
          <button onClick={save} style={btnBlue} disabled={saving}>{saving?"Saving...":isNew?"Add profile":"Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [db, setDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [fRisk, setFRisk] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fGender, setFGender] = useState("");
  const [sortCol, setSortCol] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState("table");
  const [selId, setSelId] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2800); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); showToast("Signed out successfully."); };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("criminal_profiles").select("*").order("created_at", { ascending:false });
    if (error) console.error("Load error:", error);
    setDb(data||[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("changes").on("postgres_changes",{event:"*",schema:"public",table:"criminal_profiles"},load).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const filtered = db.filter(r => {
    if (query && !`${r.id} ${r.name} ${r.alias}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (fRisk && r.risk!==fRisk) return false;
    if (fStatus && r.status!==fStatus) return false;
    if (fLocation && r.location!==fLocation) return false;
    if (fGender && r.gender!==fGender) return false;
    return true;
  }).sort((a,b) => {
    const va=a[sortCol]??"", vb=b[sortCol]??"";
    if (typeof va==="number") return sortAsc?va-vb:vb-va;
    return sortAsc?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va));
  });

  const handleSort=(col)=>{ if(sortCol===col)setSortAsc(p=>!p); else{setSortCol(col);setSortAsc(true);} };

  const saveRecord = async (form) => {
    const isNew = !modal.record.id;
    if (isNew) {
      const { error } = await supabase.from("criminal_profiles").insert([form]);
      if (error) { showToast("Error: " + error.message); return; }
      showToast("Profile added successfully.");
    } else {
      const { error } = await supabase.from("criminal_profiles").update(form).eq("id", modal.record.id);
      if (error) { showToast("Error: " + error.message); return; }
      showToast("Profile updated successfully.");
    }
    setModal(null); setSelId(form.id); load();
  };

  const deleteRecord = async (id) => {
    const r = db.find(x=>x.id===id);
    if (!r||!confirm(`Delete profile for ${r.name}?`)) return;
    const { error } = await supabase.from("criminal_profiles").delete().eq("id",id);
    if (error) { showToast("Error deleting profile"); return; }
    if (selId===id) setSelId(null);
    showToast("Profile deleted."); load();
  };

  const sel = db.find(r=>r.id===selId)||null;
  const wanted = db.filter(r=>r.status==="Wanted").length;
  const inCustody = db.filter(r=>r.status==="In Custody").length;
  const severe = db.filter(r=>r.risk==="Severe").length;
  const withPhoto = db.filter(r=>r.photo_url).length;
  const avgSen = db.length ? Math.round(db.reduce((s,r)=>s+(r.sentence||0),0)/db.length) : 0;

  if (authLoading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.accent,fontFamily:"system-ui"}}>Loading...</div>;

  const DPRow = ({label, value, icon}) => !value ? null : (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",fontSize:12,gap:8,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
      <span style={{color:C.text3,flexShrink:0,fontSize:11}}>{icon&&<span style={{marginRight:4}}>{icon}</span>}{label}</span>
      <span style={{fontWeight:500,color:C.text,textAlign:"right",maxWidth:160,wordBreak:"break-word"}}>{value}</span>
    </div>
  );

  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:${C.surface2}} ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:4px} .rh:hover{background:#EBF2FF!important} .rs{background:#EBF2FF!important;border-left:3px solid ${C.accent}!important} .ch:hover{border-color:${C.accent}!important;box-shadow:0 2px 8px rgba(26,86,219,0.12)!important} select,input{outline:none} select:focus,input:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px rgba(26,86,219,0.1)}`}</style>

      {toast && <div style={{position:"fixed",bottom:20,right:20,background:C.nav,color:"#fff",padding:"10px 18px",borderRadius:8,fontWeight:500,fontSize:13,zIndex:200,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{toast}</div>}
      {modal && !modal.isLogin && user && <Modal record={modal.record} onSave={saveRecord} onClose={()=>setModal(null)} allIds={db.map(r=>r.id)}/>}
      {modal?.isLogin && <LoginPage onLogin={()=>{ setModal(null); showToast("Welcome back!"); }} />}

      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",padding:"0 24px",height:56,background:C.nav,gap:12,position:"sticky",top:0,zIndex:50}}>
        <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🛡️</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2}}>Criminal Intelligence System</div>
          <div style={{fontSize:10,color:C.navMuted}}>Fiji Police Administration</div>
        </div>
        <div style={{flex:1}}/>
        {user ? (
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:11,color:C.navMuted}}>
              <span style={{color:"rgba(255,255,255,0.4)",marginRight:4}}>Logged in:</span>
              {user.email}
            </div>
            <button onClick={logout} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"}}>Sign out</button>
            <button onClick={()=>setModal({record:{}})} style={{...btnBlue,background:"#2563EB",border:"1px solid #1D4ED8"}}>+ New profile</button>
          </div>
        ) : (
          <button onClick={()=>setModal({isLogin:true})} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}>🔐 Admin login</button>
        )}
      </div>

      {/* KPI bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
        {[
          {l:"Wanted",v:wanted,c:"#A32D2D",bg:"#FDEAEA",icon:"🔴"},
          {l:"In custody",v:inCustody,c:"#042C53",bg:"#E6F1FB",icon:"🔵"},
          {l:"Severe risk",v:severe,c:"#4A1B0C",bg:"#FAECE7",icon:"🟠"},
          {l:"Photos on file",v:withPhoto,c:"#173404",bg:"#EAF3DE",icon:"🟢"},
          {l:"Avg sentence",v:`${avgSen} yrs`,c:"#26215C",bg:"#EEEDFE",icon:"🟣"},
        ].map(k=>(
          <div key={k.l} style={{padding:"14px 20px",borderRight:`1px solid ${C.border}`,background:k.bg}}>
            <div style={{fontSize:11,color:k.c,fontWeight:600,marginBottom:4,opacity:0.7}}>{k.icon} {k.l.toUpperCase()}</div>
            <div style={{fontSize:24,fontWeight:700,color:k.c,fontFamily:"system-ui",letterSpacing:"-0.02em"}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,flexWrap:"wrap"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.text3,fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, alias, ID..." style={{...inp,paddingLeft:30,width:220,height:32,fontSize:12}}/>
        </div>
        {[
          {v:fRisk,s:setFRisk,opts:["All risk levels","Low","Moderate","High","Severe"]},
          {v:fStatus,s:setFStatus,opts:["All statuses","Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"]},
          {v:fLocation,s:setFLocation,opts:["All locations",...LOCATIONS]},
          {v:fGender,s:setFGender,opts:["All genders","Male","Female"]},
        ].map((f,i)=>(
          <select key={i} value={f.v} onChange={e=>f.s(e.target.value.startsWith("All ")?"":e.target.value)} style={{...inp,height:32,width:"auto",cursor:"pointer",fontSize:12,paddingLeft:8}}>
            {f.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={()=>{setQuery("");setFRisk("");setFStatus("");setFLocation("");setFGender("");}} style={{...btnSm,height:32,fontSize:12}}>Clear filters</button>
        <div style={{flex:1}}/>
        <span style={{fontSize:12,color:C.text3}}>{filtered.length} of {db.length} profiles</span>
        <div style={{display:"flex",border:`1px solid ${C.border2}`,borderRadius:6,overflow:"hidden"}}>
          {[["table","⊞","Table"],["card","▦","Cards"]].map(([v,ico,lbl])=>(
            <button key={v} onClick={()=>setView(v)} title={lbl} style={{padding:"0 12px",height:32,background:view===v?C.accent:C.surface,color:view===v?"#fff":C.text3,border:"none",cursor:"pointer",fontSize:13,fontWeight:view===v?600:400}}>
              {ico}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{display:"flex",height:"calc(100vh - 56px - 70px - 52px)"}}>
        <div style={{flex:1,overflow:"auto"}}>
          {loading ? (
            <div style={{padding:48,textAlign:"center",color:C.accent,fontSize:14}}>Loading profiles...</div>
          ) : filtered.length===0 ? (
            <div style={{padding:48,textAlign:"center",color:C.text3,fontSize:13}}>No profiles found. Try adjusting your filters.</div>
          ) : view==="table" ? (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                  {[["id","Case ID"],["",""],["name","Full name"],["gender","Gender"],["risk","Risk level"],["status","Status"],["primary_offence","Primary offence"],["location","Location"],["arrest_year","Arrested"],["",""]].map(([col,label],i)=>(
                    <th key={i} onClick={col?()=>handleSort(col):undefined} style={{padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:sortCol===col?C.accent:C.text3,letterSpacing:"0.07em",textTransform:"uppercase",cursor:col?"pointer":"default",userSelect:"none",whiteSpace:"nowrap",borderRight:i<9?`1px solid ${C.border}`:"none",background:C.surface2}}>
                      {label}{col&&sortCol===col&&<span style={{marginLeft:3,color:C.accent}}>{sortAsc?"↑":"↓"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r=>{
                  const oc = OFFENCE_COLOR[r.primary_offence]||{};
                  return (
                  <tr key={r.id} onClick={()=>setSelId(r.id)} className={selId===r.id?"rs":"rh"} style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer",borderLeft:selId===r.id?`3px solid ${C.accent}`:"3px solid transparent"}}>
                    <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:C.text3,fontWeight:500}}>{r.id}</td>
                    <td style={{padding:"4px 6px"}}><Avatar r={r} size={28}/></td>
                    <td style={{padding:"8px 12px",fontWeight:600,color:C.text,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</td>
                    <td style={{padding:"8px 12px",color:C.text2,fontSize:11}}>{r.gender}</td>
                    <td style={{padding:"8px 12px"}}><Badge label={r.risk} style={RISK_STYLE[r.risk]}/></td>
                    <td style={{padding:"8px 12px"}}><Badge label={r.status} style={STATUS_STYLE[r.status]}/></td>
                    <td style={{padding:"8px 12px"}}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:oc.text||C.text2}}>
                        {oc.dot && <span style={{width:7,height:7,borderRadius:"50%",background:oc.dot,flexShrink:0}}/>}
                        {r.primary_offence}
                      </span>
                    </td>
                    <td style={{padding:"8px 12px",color:C.text2,fontSize:11}}>{r.location}</td>
                    <td style={{padding:"8px 12px",color:C.text3,fontSize:11,fontFamily:"monospace"}}>{r.arrest_year}</td>
                    <td style={{padding:"8px 10px"}}>
                      {user && (
                        <div style={{display:"flex",gap:2}}>
                          <button onClick={e=>{e.stopPropagation();setModal({record:r});}} style={{background:"none",border:`1px solid ${C.border}`,cursor:"pointer",padding:"3px 8px",color:C.text3,borderRadius:4,fontSize:11}} title="Edit">Edit</button>
                          <button onClick={e=>{e.stopPropagation();deleteRecord(r.id);}} style={{background:"none",border:"1px solid #F0A0A0",cursor:"pointer",padding:"3px 8px",color:"#A32D2D",borderRadius:4,fontSize:11}} title="Delete">Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,padding:16}}>
              {filtered.map(r=>{
                const oc = OFFENCE_COLOR[r.primary_offence]||{};
                return (
                <div key={r.id} onClick={()=>setSelId(r.id)} className="ch" style={{background:C.surface,border:`1px solid ${selId===r.id?C.accent:C.border}`,borderRadius:10,padding:14,cursor:"pointer",transition:"all 0.15s",borderTop:`3px solid ${oc.dot||C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <Avatar r={r} size={38}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>{r.id}</div>
                      <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                      <div style={{fontSize:11,color:C.text3}}>{r.location}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                    <Badge label={r.risk} style={RISK_STYLE[r.risk]}/><Badge label={r.status} style={STATUS_STYLE[r.status]}/>
                  </div>
                  <div style={{fontSize:11,padding:"5px 8px",borderRadius:5,background:oc.bg||C.surface2,color:oc.text||C.text2,border:`1px solid ${oc.border||C.border}`,display:"flex",alignItems:"center",gap:4}}>
                    {oc.dot && <span style={{width:6,height:6,borderRadius:"50%",background:oc.dot,flexShrink:0}}/>}
                    {r.primary_offence}
                  </div>
                  {r.thumb_url && <div style={{fontSize:10,color:C.text3,marginTop:6}}>🖐 Fingerprint on file</div>}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div style={{width:280,borderLeft:`1px solid ${C.border}`,background:C.surface,flexShrink:0,overflowY:"auto"}}>
          {!sel ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,padding:24}}>
              <div style={{fontSize:40,opacity:0.3}}>👤</div>
              <p style={{fontSize:12,textAlign:"center",color:C.text3,lineHeight:1.6}}>Select a profile from the list to view full details</p>
            </div>
          ) : (
            <div>
              {/* Profile header */}
              <div style={{background:C.nav,padding:"16px 16px 14px"}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
                  <Avatar r={sel} size={54}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.3}}>{sel.name}</div>
                    <div style={{fontSize:10,color:C.navMuted,fontFamily:"monospace",marginTop:2}}>{sel.id} · {sel.alias}</div>
                    <div style={{fontSize:11,color:C.navMuted,marginTop:2}}>{sel.occupation}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  <Badge label={`${sel.risk} risk`} style={RISK_STYLE[sel.risk]}/>
                  <Badge label={sel.status} style={STATUS_STYLE[sel.status]}/>
                </div>
              </div>

              {/* Biometric strip */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                {sel.thumb_url ? <img src={sel.thumb_url} alt="thumb" style={{width:42,height:42,borderRadius:6,objectFit:"cover",border:`1px solid ${C.border2}`}}/> : <div style={{width:42,height:42,borderRadius:6,background:C.surface,border:`1px dashed ${C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.text3}}>🖐</div>}
                <div style={{fontSize:11,lineHeight:1.6}}>
                  <div style={{color:sel.thumb_url?C.accent:C.text3,fontWeight:600}}>{sel.thumb_url?"✓ Fingerprint on file":"No fingerprint recorded"}</div>
                  <div style={{color:C.text3}}>{sel.photo_url?"✓ Photo on file":"No photo uploaded"}</div>
                </div>
              </div>

              {/* Offence highlight */}
              {sel.primary_offence && (()=>{const oc=OFFENCE_COLOR[sel.primary_offence]||{};return(
                <div style={{margin:"10px 14px",padding:"8px 12px",borderRadius:8,background:oc.bg||C.surface2,border:`1px solid ${oc.border||C.border}`,display:"flex",alignItems:"center",gap:6}}>
                  {oc.dot&&<span style={{width:8,height:8,borderRadius:"50%",background:oc.dot,flexShrink:0}}/>}
                  <div>
                    <div style={{fontSize:10,color:oc.text||C.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Primary offence</div>
                    <div style={{fontSize:12,fontWeight:600,color:oc.text||C.text}}>{sel.primary_offence}</div>
                    {sel.secondary_offence && <div style={{fontSize:11,color:oc.text||C.text3,marginTop:1}}>Also: {sel.secondary_offence}</div>}
                  </div>
                </div>
              );})()}

              <div style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:0}}>
                <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"8px 0 4px"}}>Personal</div>
                <DPRow label="Date of birth" value={sel.dob}/>
                <DPRow label="Gender" value={sel.gender}/>
                <DPRow label="Nationality" value={sel.nationality}/>
                <DPRow label="Phone" value={sel.phone_number} icon="📞"/>
                <DPRow label="Address" value={sel.home_address} icon="🏠"/>
                <DPRow label="Vehicle" value={sel.vehicle_registration} icon="🚗"/>
                <DPRow label="Family" value={sel.family_members} icon="👨‍👩‍👧"/>
                <DPRow label="Medical" value={sel.medical_conditions} icon="🏥"/>

                <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>Criminal record</div>
                <DPRow label="Arrest year" value={sel.arrest_year}/>
                <DPRow label="Sentence" value={`${sel.sentence} years`}/>
                <DPRow label="Release date" value={sel.release_date} icon="📅"/>
                <DPRow label="Associates" value={sel.associates}/>
                <DPRow label="Convictions" value={sel.convictions}/>

                <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>Profile assessment</div>
                <div style={{fontSize:11,color:C.text2,lineHeight:1.6,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>{sel.behaviour}</div>
                <div style={{fontSize:11,color:C.text3,fontStyle:"italic",lineHeight:1.6,padding:"6px 0"}}>{sel.psych}</div>

                {sel.case_notes && <>
                  <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 6px"}}>📝 Case notes</div>
                  <div style={{fontSize:11,color:C.text2,lineHeight:1.7,background:C.surface2,padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,whiteSpace:"pre-wrap",marginBottom:8}}>{sel.case_notes}</div>
                </>}
              </div>

              {user && (
                <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,background:C.surface}}>
                  <button onClick={()=>setModal({record:sel})} style={{...btnBlue,flex:1,justifyContent:"center"}}>Edit profile</button>
                  <button onClick={()=>deleteRecord(sel.id)} style={{...btnRed,flex:1,justifyContent:"center"}}>Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{display:"flex",alignItems:"center",padding:"8px 20px",borderTop:`1px solid ${C.border}`,background:C.surface,gap:16,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:C.text3}}>{filtered.length} profiles shown · {wanted} wanted · {severe} severe risk</span>
        <div style={{flex:1}}/>
        <span style={{fontSize:11,color:C.text3}}>Fiji Criminal Intelligence System · FY2026 · Confidential</span>
      </div>
    </div>
  );
}