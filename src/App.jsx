import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

const OFFENCES = ["Aggravated Assault","Armed Robbery","Bribery","Burglary","Counterfeit Operations","Cybercrime","Domestic Violence","Drug Trafficking","Extortion","Fraud","Human Trafficking","Identity Fraud","Illegal Firearm Possession","Insurance Fraud","Kidnapping","Money Laundering","Organized Crime Activity","Smuggling","Tax Evasion","Vehicle Theft"];
const OCCUPATIONS = ["Accountant","Business Owner","Construction Worker","Dock Worker","Farmer","Fisherman","Hotel Staff","IT Technician","Mechanic","Nightclub Operator","Retail Manager","Security Guard","Taxi Driver","Warehouse Supervisor"];
const LOCATIONS = ["Ba","Labasa","Lautoka","Levuka","Nadi","Nausori","Rakiraki","Savusavu","Sigatoka","Suva"];
const BEH = ["Financially motivated offender","Frequent cross-border travel","History of violent escalation","Known to operate in groups","Maintains low public profile","Repeat offender with regional links","Suspected gang affiliations","Technically skilled offender"];
const PSY = ["Avoids direct confrontation when possible","Calculated and methodical","Displays anti-social behaviour patterns","High adaptability","Impulsive under pressure","Manipulative tendencies observed"];
const RELATIONSHIP_TYPES = ["Known Associate","Gang Member","Family Member","Business Partner","Supplier","Distributor","Co-offender","Suspected Link","Informant","Other"];

const OFFENCE_COLOR = {
  "Aggravated Assault":        { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Armed Robbery":             { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Domestic Violence":         { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Kidnapping":                { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Human Trafficking":         { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Illegal Firearm Possession":{ bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Drug Trafficking":          { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Organized Crime Activity":  { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Smuggling":                 { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Fraud":                     { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Bribery":                   { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Cybercrime":                { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Counterfeit Operations":    { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Identity Fraud":            { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Insurance Fraud":           { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Money Laundering":          { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Tax Evasion":               { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Extortion":                 { bg:"#EEEDFE", text:"#26215C", border:"#AFA9EC", dot:"#534AB7" },
  "Burglary":                  { bg:"#E6F1FB", text:"#042C53", border:"#85B7EB", dot:"#185FA5" },
  "Vehicle Theft":             { bg:"#E6F1FB", text:"#042C53", border:"#85B7EB", dot:"#185FA5" },
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
  bg:"#F4F5F7", surface:"#FFFFFF", surface2:"#F0F2F5",
  nav:"#1C2B4A", navText:"#FFFFFF", navMuted:"rgba(255,255,255,0.55)",
  border:"#DDE1E9", border2:"#C8CDD8",
  text:"#1A1D23", text2:"#4A5568", text3:"#7B8794",
  accent:"#1A56DB", accentL:"#EBF2FF",
};

const inp = { padding:"7px 10px",fontSize:12,borderRadius:6,border:`1px solid ${C.border2}`,background:C.surface,color:C.text,fontFamily:"inherit",width:"100%",boxSizing:"border-box" };
const btnSm = { display:"inline-flex",alignItems:"center",gap:5,padding:"6px 14px",fontSize:12,fontWeight:500,borderRadius:6,border:`1px solid ${C.border2}`,background:C.surface,color:C.text2,cursor:"pointer",whiteSpace:"nowrap" };
const btnBlue = { ...btnSm,background:C.accent,color:"#fff",border:`1px solid ${C.accent}`,fontWeight:600 };
const btnRed = { ...btnSm,color:"#7A1A1A",border:"1px solid #F0A0A0",background:"#FDEAEA" };
const btnGreen = { ...btnSm,background:"#1E7E34",color:"#fff",border:"1px solid #1E7E34",fontWeight:600 };

function Badge({ label, style:s={} }) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:500,background:s.bg||"#eee",color:s.text||"#333",border:`1px solid ${s.border||"#ccc"}`,whiteSpace:"nowrap"}}>
    {s.dot&&<span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>}{label}
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

// ─── PRINT FUNCTION ──────────────────────────────────────────────────────────
function printProfiles(profiles) {
  const now = new Date().toLocaleString("en-FJ", { dateStyle:"long", timeStyle:"short" });
  const rows = profiles.map(r => {
    const rs = RISK_STYLE[r.risk]||{};
    const ss = STATUS_STYLE[r.status]||{};
    const oc = OFFENCE_COLOR[r.primary_offence]||{};
    return `
      <div class="profile-card">
        <div class="card-header">
          <div class="header-left">
            ${r.photo_url ? `<img src="${r.photo_url}" class="photo" alt="">` : `<div class="initials">${r.name?.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase()}</div>`}
            <div class="header-info">
              <div class="profile-id">${r.id}</div>
              <div class="profile-name">${r.name}</div>
              <div class="profile-sub">${r.alias||"—"} · ${r.occupation||"—"}</div>
            </div>
          </div>
          <div class="header-badges">
            <span class="badge" style="background:${rs.bg};color:${rs.text};border:1px solid ${rs.border}">${r.risk} Risk</span>
            <span class="badge" style="background:${ss.bg};color:${ss.text};border:1px solid ${ss.border}">${r.status}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="section"><div class="section-title">Personal Details</div>
            <div class="grid2">
              <div class="field"><span class="label">Date of birth</span><span class="value">${r.dob||"—"}</span></div>
              <div class="field"><span class="label">Gender</span><span class="value">${r.gender||"—"}</span></div>
              <div class="field"><span class="label">Nationality</span><span class="value">${r.nationality||"Fijian"}</span></div>
              <div class="field"><span class="label">Location</span><span class="value">${r.location||"—"}</span></div>
              ${r.phone_number?`<div class="field"><span class="label">Phone</span><span class="value">${r.phone_number}</span></div>`:""}
              ${r.vehicle_registration?`<div class="field"><span class="label">Vehicle</span><span class="value">${r.vehicle_registration}</span></div>`:""}
              ${r.home_address?`<div class="field full"><span class="label">Address</span><span class="value">${r.home_address}</span></div>`:""}
              ${r.family_members?`<div class="field full"><span class="label">Family</span><span class="value">${r.family_members}</span></div>`:""}
              ${r.medical_conditions?`<div class="field full"><span class="label">Medical</span><span class="value">${r.medical_conditions}</span></div>`:""}
            </div>
          </div>
          <div class="section"><div class="section-title">Criminal Record</div>
            <div class="offence-block" style="background:${oc.bg||"#f5f5f5"};border:1px solid ${oc.border||"#ddd"}">
              <div style="color:${oc.dot||"#333"};font-size:11px;font-weight:700;text-transform:uppercase">Primary offence</div>
              <div style="color:${oc.text||"#333"};font-size:14px;font-weight:700;margin-top:2px">${r.primary_offence||"—"}</div>
              ${r.secondary_offence?`<div style="color:${oc.text||"#666"};font-size:11px;margin-top:3px">Secondary: ${r.secondary_offence}</div>`:""}
            </div>
            <div class="grid2" style="margin-top:8px">
              <div class="field"><span class="label">Arrest year</span><span class="value">${r.arrest_year||"—"}</span></div>
              <div class="field"><span class="label">Sentence</span><span class="value">${r.sentence?r.sentence+" years":"—"}</span></div>
              ${r.release_date?`<div class="field"><span class="label">Release date</span><span class="value">${r.release_date}</span></div>`:""}
              <div class="field"><span class="label">Convictions</span><span class="value">${r.convictions??0}</span></div>
            </div>
          </div>
          ${r.case_notes?`<div class="section"><div class="section-title">Case Notes</div><div class="case-notes">${r.case_notes}</div></div>`:""}
          ${r.associates_list&&r.associates_list.length>0?`<div class="section"><div class="section-title">Known Associates (${r.associates_list.length})</div><div class="grid2" style="padding:10px 14px">${r.associates_list.map(a=>`<div class="field"><span class="label">${a.relationship_type}</span><span class="value">${a.name} (${a.id})</span></div>`).join("")}</div></div>`:""}
        </div>
        <div class="card-footer"><span>CONFIDENTIAL — Fiji Central Criminal Intelligence</span><span>Printed: ${now}</span></div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FCCI Report — ${profiles.length} profile${profiles.length!==1?"s":""}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#f0f2f5;color:#1a1d23;font-size:13px}
  .cover{background:#1C2B4A;color:white;padding:40px 48px;margin-bottom:24px}.cover-title{font-size:24px;font-weight:700}.cover-sub{font-size:13px;opacity:0.7;margin-top:4px}
  .cover-meta{margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2);display:flex;gap:40px}.cover-meta-item{font-size:12px}.cover-meta-item b{display:block;font-size:20px;font-weight:700;margin-bottom:2px}
  .profile-card{background:white;margin:0 24px 24px;border-radius:10px;overflow:hidden;border:1px solid #dde1e9;page-break-after:always;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
  .card-header{background:#1C2B4A;padding:18px 20px;display:flex;justify-content:space-between;align-items:flex-start}
  .header-left{display:flex;gap:14px;align-items:center}.photo{width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3)}
  .initials{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
  .profile-id{font-size:10px;color:rgba(255,255,255,0.6);font-family:monospace}.profile-name{font-size:18px;font-weight:700;color:white}.profile-sub{font-size:12px;color:rgba(255,255,255,0.65);margin-top:3px}
  .header-badges{display:flex;flex-direction:column;gap:5px;align-items:flex-end}.badge{padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600}
  .card-body{padding:20px;display:flex;flex-direction:column;gap:16px}.section{border:1px solid #e8eaee;border-radius:8px;overflow:hidden}
  .section-title{background:#f4f5f7;padding:7px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#7b8794;border-bottom:1px solid #e8eaee}
  .grid2{display:grid;grid-template-columns:1fr 1fr;padding:10px 14px;gap:6px}.field{display:flex;flex-direction:column;gap:2px}.field.full{grid-column:1/-1}
  .label{font-size:10px;color:#7b8794;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}.value{font-size:13px;color:#1a1d23;font-weight:500}
  .offence-block{margin:12px 14px 0;padding:10px 14px;border-radius:6px}.case-notes{padding:12px 14px;font-size:12px;color:#4a5568;line-height:1.7;white-space:pre-wrap;background:#fafbfc}
  .card-footer{background:#f4f5f7;padding:8px 20px;display:flex;justify-content:space-between;font-size:10px;color:#7b8794;border-top:1px solid #dde1e9}
  @media print{body{background:white}.profile-card{margin:0;border-radius:0;box-shadow:none}.no-print{display:none!important}}</style></head>
  <body>
  <div class="cover"><div style="font-size:32px;margin-bottom:12px">🛡️</div><div class="cover-title">Criminal Intelligence Report</div><div class="cover-sub">Fiji Central Criminal Intelligence — CONFIDENTIAL</div>
  <div class="cover-meta"><div class="cover-meta-item"><b>${profiles.length}</b>Profile${profiles.length!==1?"s":""}</div><div class="cover-meta-item"><b>${now}</b>Date printed</div><div class="cover-meta-item"><b>${profiles.filter(p=>p.status==="Wanted").length}</b>Wanted</div></div></div>
  <div style="text-align:right;padding:0 24px 12px" class="no-print">
    <button onclick="window.print()" style="background:#1C2B4A;color:white;border:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-right:8px">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()" style="background:#f0f2f5;color:#4a5568;border:1px solid #dde1e9;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer">Close</button>
  </div>
  ${rows}</body></html>`;

  const win = window.open("","_blank","width=900,height=800");
  win.document.write(html); win.document.close();
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const login = async () => {
    if (!email||!password){setError("Please enter email and password");return;}
    setLoading(true);setError("");
    const {error} = await supabase.auth.signInWithPassword({email,password});
    if(error){setError("Incorrect email or password");setLoading(false);return;}
    onLogin();setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.surface,borderRadius:12,padding:"36px 32px",width:360,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:`1px solid ${C.border}`}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:12,background:C.nav,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:22}}>🛡️</div>
          <div style={{fontSize:20,fontWeight:700,color:C.text}}>Criminal Intelligence</div>
          <div style={{fontSize:12,color:C.text3,marginTop:4}}>Fiji Central Criminal Intelligence</div>
        </div>
        {error&&<div style={{background:"#FDEAEA",border:"1px solid #F0A0A0",color:"#7A1A1A",padding:"8px 12px",borderRadius:6,fontSize:12,marginBottom:16}}>{error}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <label style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.06em"}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} style={inp}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <label style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.06em"}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} style={inp}/>
          </div>
          <button onClick={login} style={{...btnBlue,justifyContent:"center",padding:"10px"}} disabled={loading}>{loading?"Signing in...":"Sign in"}</button>
        </div>
        <p style={{fontSize:11,color:C.text3,textAlign:"center",marginTop:20}}>Authorised personnel only.</p>
      </div>
    </div>
  );
}

function SectionLabel({ children, icon }) {
  return <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
    {icon&&<span style={{fontSize:13}}>{icon}</span>}{children}
  </div>;
}

// ─── ASSOCIATES PANEL ─────────────────────────────────────────────────────────
function AssociatesPanel({ profileId, onNavigate, canEdit }) {
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [relType, setRelType] = useState("Known Associate");
  const searchRef = useRef(null);

  const loadAssociates = useCallback(async () => {
    setLoading(true);
    // Load both directions: profiles where this is profile_id OR associate_id
    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      supabase.from("profile_associates").select("id, relationship_type, associate_id, criminal_profiles!profile_associates_associate_id_fkey(id,name,risk,status,primary_offence,photo_url)").eq("profile_id", profileId),
      supabase.from("profile_associates").select("id, relationship_type, profile_id, criminal_profiles!profile_associates_profile_id_fkey(id,name,risk,status,primary_offence,photo_url)").eq("associate_id", profileId),
    ]);
    const combined = [
      ...(d1||[]).map(x=>({ linkId:x.id, relType:x.relationship_type, profile: x.criminal_profiles })),
      ...(d2||[]).map(x=>({ linkId:x.id, relType:x.relationship_type, profile: x.criminal_profiles })),
    ].filter(x=>x.profile);
    setAssociates(combined);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { loadAssociates(); }, [loadAssociates]);

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("criminal_profiles")
      .select("id,name,risk,status,primary_offence,photo_url")
      .neq("id", profileId)
      .or(`name.ilike.%${q}%,id.ilike.%${q}%,alias.ilike.%${q}%`)
      .limit(8);
    setSearchResults(data||[]);
    setSearching(false);
  };

  const linkAssociate = async (associateProfile) => {
    // Check not already linked
    const already = associates.find(a => a.profile?.id === associateProfile.id);
    if (already) { alert("Already linked as associate."); return; }
    const { error } = await supabase.from("profile_associates").insert([{
      profile_id: profileId,
      associate_id: associateProfile.id,
      relationship_type: relType,
    }]);
    if (error) { alert("Error linking: " + error.message); return; }
    setShowAdd(false); setSearchQ(""); setSearchResults([]);
    loadAssociates();
  };

  const removeAssociate = async (linkId) => {
    if (!confirm("Remove this associate link?")) return;
    await supabase.from("profile_associates").delete().eq("id", linkId);
    loadAssociates();
  };

  return (
    <div style={{margin:"0 0 12px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.1em",textTransform:"uppercase"}}>
          🔗 Associates {associates.length>0&&<span style={{background:C.accentL,color:C.accent,borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:700}}>{associates.length}</span>}
        </div>
        {canEdit&&<button onClick={()=>setShowAdd(s=>!s)} style={{...btnBlue,padding:"3px 10px",fontSize:11}}>{showAdd?"Cancel":"+ Link"}</button>}
      </div>

      {/* Add associate search box */}
      {showAdd && (
        <div style={{background:C.accentL,border:`1px solid #85B7EB`,borderRadius:8,padding:"10px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:600,color:C.accent,marginBottom:6}}>Search for a profile to link:</div>
          <input
            ref={searchRef}
            type="text"
            value={searchQ}
            onChange={e=>handleSearch(e.target.value)}
            placeholder="Type name, alias or ID..."
            style={{...inp,marginBottom:6}}
            autoFocus
          />
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <label style={{fontSize:11,color:C.text2,flexShrink:0}}>Relationship:</label>
            <select value={relType} onChange={e=>setRelType(e.target.value)} style={{...inp,flex:1}}>
              {RELATIONSHIP_TYPES.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          {searching && <div style={{fontSize:11,color:C.text3,padding:"4px 0"}}>Searching...</div>}
          {searchResults.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflowY:"auto"}}>
              {searchResults.map(r=>(
                <div key={r.id} onClick={()=>linkAssociate(r)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:C.surface,borderRadius:6,cursor:"pointer",border:`1px solid ${C.border}`,transition:"background 0.1s"}}
                  onMouseOver={e=>e.currentTarget.style.background=C.surface2}
                  onMouseOut={e=>e.currentTarget.style.background=C.surface}>
                  <Avatar r={r} size={28}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                    <div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>{r.id}</div>
                  </div>
                  <Badge label={r.risk} style={RISK_STYLE[r.risk]}/>
                  <span style={{fontSize:11,color:C.accent,fontWeight:600}}>+ Link</span>
                </div>
              ))}
            </div>
          )}
          {searchQ.length >= 2 && !searching && searchResults.length === 0 && (
            <div style={{fontSize:11,color:C.text3,padding:"4px 0"}}>No profiles found matching "{searchQ}"</div>
          )}
        </div>
      )}

      {/* Associates list */}
      {loading ? (
        <div style={{fontSize:11,color:C.text3,padding:"4px 0"}}>Loading associates...</div>
      ) : associates.length === 0 ? (
        <div style={{fontSize:11,color:C.text3,fontStyle:"italic",padding:"4px 0"}}>No associates linked yet.{canEdit&&" Click + Link to add one."}</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {associates.map(({ linkId, relType, profile:r }) => (
            <div key={linkId} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",background:C.surface2,borderRadius:8,border:`1px solid ${C.border}`,position:"relative"}}>
              <div style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}} onClick={()=>onNavigate(r.id)}>
                <Avatar r={r} size={32}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:"underline",cursor:"pointer"}}>{r.name}</div>
                  <div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>{r.id}</div>
                  <div style={{fontSize:10,color:C.text2,marginTop:1}}>{relType}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                <Badge label={r.risk} style={RISK_STYLE[r.risk]}/>
                <Badge label={r.status} style={STATUS_STYLE[r.status]}/>
              </div>
              {canEdit && (
                <button onClick={()=>removeAssociate(linkId)}
                  style={{position:"absolute",top:4,right:4,background:"none",border:"none",cursor:"pointer",color:C.text3,fontSize:12,padding:"1px 4px",borderRadius:4}}
                  title="Remove link">✕</button>
              )}
            </div>
          ))}
        </div>
      )}
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
      {area ? <textarea value={f[key]} onChange={e=>set(key,e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
            : opts ? <select value={f[key]} onChange={e=>set(key,e.target.value)} style={inp}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                   : <input type={type} value={f[key]} onChange={e=>set(key,type==="number"?Number(e.target.value):e.target.value)} style={inp}/>}
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 10px",backdropFilter:"blur(3px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:12,width:580,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.nav}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{isNew?"New Criminal Profile":"Edit Profile"}</div>
            {!isNew&&<div style={{fontSize:11,color:C.navMuted,marginTop:1}}>ID: {record.id}</div>}
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
                    {(f.photoData||f.photo_url)?<img src={f.photoData||f.photo_url} alt="" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.accent}`}}/>:<><div style={{fontSize:26}}>📷</div><div style={{fontSize:11,color:C.text3}}>Click to upload</div></>}
                  </div>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const fl=e.target.files[0];if(!fl)return;const fr=new FileReader();fr.onload=ev=>set("photoData",ev.target.result);fr.readAsDataURL(fl);}}/>
                </label>
                {(f.photoData||f.photo_url)&&<button onClick={()=>{set("photoData",null);set("photo_url",null);}} style={{...btnRed,marginTop:6,width:"100%",justifyContent:"center"}}>Remove</button>}
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
              {fg("Full Name *","name")} {fg("Alias","alias")}
              {fg("Gender","gender","text",["Male","Female"])} {fg("Date of birth","dob","date")}
              {fg("Location","location","text",LOCATIONS)} {fg("Occupation","occupation","text",OCCUPATIONS)}
              {fg("📞 Phone","phone_number")} {fg("🚗 Vehicle","vehicle_registration")}
              <div style={{gridColumn:"1/-1"}}>{fg("🏠 Address","home_address","text",null,true)}</div>
              {fg("👨‍👩‍👧 Family","family_members")} {fg("🏥 Medical","medical_conditions")}
            </div>
          </div>
          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="⚖️">Criminal record</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {fg("Primary offence","primary_offence","text",OFFENCES)} {fg("Secondary offence","secondary_offence","text",OFFENCES)}
              {fg("Arrest year","arrest_year","number")} {fg("Sentence (years)","sentence","number")}
              {fg("Risk level","risk","text",["Low","Moderate","High","Severe"])} {fg("Status","status","text",["Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"])}
              {fg("Associates","associates","number")} {fg("Convictions","convictions","number")}
              {fg("📅 Release date","release_date","date")}
              <div style={{gridColumn:"1/-1"}}>{fg("Behavioural notes","behaviour","text",BEH,true)}</div>
              <div style={{gridColumn:"1/-1"}}>{fg("Psychological profile","psych","text",PSY,true)}</div>
            </div>
          </div>
          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="📝">Case notes</SectionLabel>
            <textarea value={f.case_notes} onChange={e=>set("case_notes",e.target.value)} rows={5} placeholder="Enter detailed case notes..." style={{...inp,resize:"vertical"}}/>
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
  const [selected, setSelected] = useState(new Set());
  const [dpTab, setDpTab] = useState("details");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2800); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user??null); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user??null));
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); showToast("Signed out."); };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("criminal_profiles").select("*").order("created_at", { ascending:false });
    setDb(data||[]); setLoading(false);
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

  const toggleSelect=(id,e)=>{ e.stopPropagation(); setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;}); };
  const toggleAll=()=>{ selected.size===filtered.length?setSelected(new Set()):setSelected(new Set(filtered.map(r=>r.id))); };

  const handlePrint=()=>{ const p=db.filter(r=>selected.has(r.id)); if(!p.length){showToast("Select at least one profile.");return;} printProfiles(p); };
  const printCurrent=(r)=>printProfiles([r]);

  const saveRecord = async (form) => {
    const isNew = !modal.record.id;
    if (isNew) {
      const {error} = await supabase.from("criminal_profiles").insert([form]);
      if(error){showToast("Error: "+error.message);return;}
      showToast("Profile added.");
    } else {
      const {error} = await supabase.from("criminal_profiles").update(form).eq("id",modal.record.id);
      if(error){showToast("Error: "+error.message);return;}
      showToast("Profile updated.");
    }
    setModal(null); setSelId(form.id); load();
  };

  const deleteRecord = async (id) => {
    const r=db.find(x=>x.id===id);
    if(!r||!confirm(`Delete ${r.name}?`))return;
    const {error} = await supabase.from("criminal_profiles").delete().eq("id",id);
    if(error){showToast("Error deleting");return;}
    if(selId===id)setSelId(null);
    setSelected(prev=>{const n=new Set(prev);n.delete(id);return n;});
    showToast("Profile deleted."); load();
  };

  // Navigate to an associate's profile
  const navigateToProfile = (id) => {
    setSelId(id);
    setDpTab("details");
    // Scroll to and highlight the row
    setTimeout(() => {
      const el = document.getElementById(`row-${id}`);
      if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
    }, 100);
  };

  const sel = db.find(r=>r.id===selId)||null;
  const wanted = db.filter(r=>r.status==="Wanted").length;
  const inCustody = db.filter(r=>r.status==="In Custody").length;
  const severe = db.filter(r=>r.risk==="Severe").length;
  const withPhoto = db.filter(r=>r.photo_url).length;
  const avgSen = db.length?Math.round(db.reduce((s,r)=>s+(r.sentence||0),0)/db.length):0;

  if (authLoading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.accent}}>Loading...</div>;

  const DPRow = ({label,value,icon}) => !value?null:(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",fontSize:12,gap:8,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
      <span style={{color:C.text3,flexShrink:0,fontSize:11}}>{icon&&<span style={{marginRight:4}}>{icon}</span>}{label}</span>
      <span style={{fontWeight:500,color:C.text,textAlign:"right",maxWidth:160,wordBreak:"break-word"}}>{value}</span>
    </div>
  );

  const tabStyle = (active) => ({
    padding:"7px 14px", fontSize:12, fontWeight:active?600:400,
    color:active?C.accent:C.text3,
    borderBottom:active?`2px solid ${C.accent}`:"2px solid transparent",
    cursor:"pointer", background:"none", border:"none",
    borderBottom:active?`2px solid ${C.accent}`:"2px solid transparent",
  });

  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:4px} .rh:hover{background:#EBF2FF!important} .rs-row{background:#EBF2FF!important;border-left:3px solid ${C.accent}!important} .sel-row{background:#F0F7FF!important} .ch:hover{border-color:${C.accent}!important} input[type=checkbox]{cursor:pointer;width:15px;height:15px;accent-color:${C.accent}}`}</style>

      {toast&&<div style={{position:"fixed",bottom:20,right:20,background:C.nav,color:"#fff",padding:"10px 18px",borderRadius:8,fontWeight:500,fontSize:13,zIndex:200,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{toast}</div>}
      {modal&&!modal.isLogin&&user&&<Modal record={modal.record} onSave={saveRecord} onClose={()=>setModal(null)} allIds={db.map(r=>r.id)}/>}
      {modal?.isLogin&&<LoginPage onLogin={()=>{setModal(null);showToast("Welcome back!");}}/>}

      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",padding:"0 24px",height:56,background:C.nav,gap:12,position:"sticky",top:0,zIndex:50}}>
        <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🛡️</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2}}>Criminal Intelligence System</div>
          <div style={{fontSize:10,color:C.navMuted}}>Fiji Central Criminal Intelligence</div>
        </div>
        <div style={{flex:1}}/>
        {user?(
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:11,color:C.navMuted}}><span style={{color:"rgba(255,255,255,0.4)",marginRight:4}}>Logged in:</span>{user.email}</div>
            <button onClick={logout} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"}}>Sign out</button>
            <button onClick={()=>setModal({record:{}})} style={{...btnBlue,background:"#2563EB",border:"1px solid #1D4ED8"}}>+ New profile</button>
          </div>
        ):(
          <button onClick={()=>setModal({isLogin:true})} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}>🔐 Admin login</button>
        )}
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
        {[{l:"Wanted",v:wanted,c:"#7A1A1A",bg:"#FDEAEA",icon:"🔴"},{l:"In custody",v:inCustody,c:"#042C53",bg:"#E6F1FB",icon:"🔵"},{l:"Severe risk",v:severe,c:"#4A1B0C",bg:"#FAECE7",icon:"🟠"},{l:"Photos on file",v:withPhoto,c:"#173404",bg:"#EAF3DE",icon:"🟢"},{l:"Avg sentence",v:`${avgSen} yrs`,c:"#26215C",bg:"#EEEDFE",icon:"🟣"}].map(k=>(
          <div key={k.l} style={{padding:"14px 20px",borderRight:`1px solid ${C.border}`,background:k.bg}}>
            <div style={{fontSize:11,color:k.c,fontWeight:600,marginBottom:4,opacity:0.7}}>{k.icon} {k.l.toUpperCase()}</div>
            <div style={{fontSize:24,fontWeight:700,color:k.c,letterSpacing:"-0.02em"}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,flexWrap:"wrap"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.text3,fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, alias, ID..." style={{...inp,paddingLeft:30,width:220,height:32,fontSize:12}}/>
        </div>
        {[{v:fRisk,s:setFRisk,opts:["All risk","Low","Moderate","High","Severe"]},{v:fStatus,s:setFStatus,opts:["All statuses","Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"]},{v:fLocation,s:setFLocation,opts:["All locations",...LOCATIONS]},{v:fGender,s:setFGender,opts:["All genders","Male","Female"]}].map((f,i)=>(
          <select key={i} value={f.v} onChange={e=>f.s(e.target.value.startsWith("All ")?"":e.target.value)} style={{...inp,height:32,width:"auto",cursor:"pointer",fontSize:12}}>
            {f.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={()=>{setQuery("");setFRisk("");setFStatus("");setFLocation("");setFGender("");}} style={{...btnSm,height:32}}>Clear</button>
        <div style={{flex:1}}/>
        {selected.size>0?(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:"#EBF2FF",border:`1px solid #85B7EB`,borderRadius:8}}>
            <span style={{fontSize:12,color:"#042C53",fontWeight:600}}>{selected.size} selected</span>
            <button onClick={handlePrint} style={{...btnGreen,height:30,fontSize:12}}>🖨️ Print selected</button>
            <button onClick={()=>setSelected(new Set())} style={{...btnSm,height:30,padding:"0 8px"}}>✕</button>
          </div>
        ):(
          <button onClick={()=>{if(filtered.length>0){setSelected(new Set(filtered.map(r=>r.id)));showToast(`${filtered.length} profiles selected.`);}}} style={{...btnSm,height:32}}>☑ Select all</button>
        )}
        <span style={{fontSize:12,color:C.text3}}>{filtered.length} profiles</span>
        <div style={{display:"flex",border:`1px solid ${C.border2}`,borderRadius:6,overflow:"hidden"}}>
          {[["table","⊞"],["card","▦"]].map(([v,ico])=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"0 12px",height:32,background:view===v?C.accent:C.surface,color:view===v?"#fff":C.text3,border:"none",cursor:"pointer",fontSize:13}}>{ico}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{display:"flex",height:"calc(100vh - 56px - 70px - 52px)"}}>
        <div style={{flex:1,overflow:"auto"}}>
          {loading?(
            <div style={{padding:48,textAlign:"center",color:C.accent}}>Loading profiles...</div>
          ):filtered.length===0?(
            <div style={{padding:48,textAlign:"center",color:C.text3}}>No profiles found.</div>
          ):view==="table"?(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                  <th style={{padding:"9px 12px",width:36}}><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll}/></th>
                  {[["id","Case ID"],["",""],["name","Name"],["gender","Gender"],["risk","Risk"],["status","Status"],["primary_offence","Offence"],["location","Location"],["arrest_year","Year"],["",""]].map(([col,label],i)=>(
                    <th key={i} onClick={col?()=>handleSort(col):undefined} style={{padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:sortCol===col?C.accent:C.text3,letterSpacing:"0.07em",textTransform:"uppercase",cursor:col?"pointer":"default",userSelect:"none",whiteSpace:"nowrap",borderRight:i<9?`1px solid ${C.border}`:"none",background:C.surface2}}>
                      {label}{col&&sortCol===col&&<span style={{marginLeft:3,color:C.accent}}>{sortAsc?"↑":"↓"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r=>{
                  const oc=OFFENCE_COLOR[r.primary_offence]||{};
                  const isSel=selected.has(r.id);
                  return (
                    <tr key={r.id} id={`row-${r.id}`} onClick={()=>setSelId(r.id)}
                      className={selId===r.id?"rs-row":isSel?"sel-row":"rh"}
                      style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer",borderLeft:selId===r.id?`3px solid ${C.accent}`:isSel?`3px solid #85B7EB`:"3px solid transparent"}}>
                      <td style={{padding:"8px 12px"}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={isSel} onChange={e=>toggleSelect(r.id,e)}/></td>
                      <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:C.text3}}>{r.id}</td>
                      <td style={{padding:"4px 6px"}}><Avatar r={r} size={28}/></td>
                      <td style={{padding:"8px 12px",fontWeight:600,color:C.text,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</td>
                      <td style={{padding:"8px 12px",color:C.text2,fontSize:11}}>{r.gender}</td>
                      <td style={{padding:"8px 12px"}}><Badge label={r.risk} style={RISK_STYLE[r.risk]}/></td>
                      <td style={{padding:"8px 12px"}}><Badge label={r.status} style={STATUS_STYLE[r.status]}/></td>
                      <td style={{padding:"8px 12px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:oc.text||C.text2}}>{oc.dot&&<span style={{width:7,height:7,borderRadius:"50%",background:oc.dot}}/>}{r.primary_offence}</span></td>
                      <td style={{padding:"8px 12px",color:C.text2,fontSize:11}}>{r.location}</td>
                      <td style={{padding:"8px 12px",color:C.text3,fontSize:11,fontFamily:"monospace"}}>{r.arrest_year}</td>
                      <td style={{padding:"8px 10px"}}>
                        <div style={{display:"flex",gap:2}}>
                          <button onClick={e=>{e.stopPropagation();printCurrent(r);}} style={{...btnSm,padding:"3px 7px",fontSize:11,background:"#EAF3DE",color:"#1E7E34",border:"1px solid #97C459"}}>🖨️</button>
                          {user&&<>
                            <button onClick={e=>{e.stopPropagation();setModal({record:r});}} style={{...btnSm,padding:"3px 7px",fontSize:11}}>Edit</button>
                            <button onClick={e=>{e.stopPropagation();deleteRecord(r.id);}} style={{...btnRed,padding:"3px 7px",fontSize:11}}>Del</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,padding:16}}>
              {filtered.map(r=>{
                const oc=OFFENCE_COLOR[r.primary_offence]||{};
                const isSel=selected.has(r.id);
                return (
                  <div key={r.id} id={`card-${r.id}`} onClick={()=>setSelId(r.id)} className="ch"
                    style={{background:C.surface,border:`2px solid ${isSel?C.accent:selId===r.id?"#85B7EB":C.border}`,borderRadius:10,padding:14,cursor:"pointer",transition:"all 0.15s",borderTop:`3px solid ${oc.dot||C.border}`,position:"relative"}}>
                    <input type="checkbox" checked={isSel} onChange={e=>toggleSelect(r.id,e)} style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}/>
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
                    <div style={{fontSize:11,padding:"5px 8px",borderRadius:5,background:oc.bg||C.surface2,color:oc.text||C.text2,border:`1px solid ${oc.border||C.border}`,display:"flex",alignItems:"center",gap:4,marginBottom:8}}>
                      {oc.dot&&<span style={{width:6,height:6,borderRadius:"50%",background:oc.dot}}/>}{r.primary_offence}
                    </div>
                    <button onClick={e=>{e.stopPropagation();printCurrent(r);}} style={{...btnSm,width:"100%",justifyContent:"center",fontSize:11,background:"#EAF3DE",color:"#1E7E34",border:"1px solid #97C459"}}>🖨️ Print</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div style={{width:300,borderLeft:`1px solid ${C.border}`,background:C.surface,flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {!sel?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,padding:24}}>
              <div style={{fontSize:40,opacity:0.3}}>👤</div>
              <p style={{fontSize:12,textAlign:"center",color:C.text3,lineHeight:1.6}}>Select a profile to view details</p>
            </div>
          ):(
            <>
              {/* Profile header */}
              <div style={{background:C.nav,padding:"14px 14px 12px",flexShrink:0}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:10}}>
                  <Avatar r={sel} size={50}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2}}>{sel.name}</div>
                    <div style={{fontSize:10,color:C.navMuted,fontFamily:"monospace",marginTop:2}}>{sel.id} · {sel.alias}</div>
                    <div style={{fontSize:11,color:C.navMuted,marginTop:2}}>{sel.occupation}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  <Badge label={`${sel.risk} risk`} style={RISK_STYLE[sel.risk]}/>
                  <Badge label={sel.status} style={STATUS_STYLE[sel.status]}/>
                </div>
              </div>

              {/* Tabs */}
              <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
                <button style={tabStyle(dpTab==="details")} onClick={()=>setDpTab("details")}>Details</button>
                <button style={tabStyle(dpTab==="associates")} onClick={()=>setDpTab("associates")}>🔗 Associates</button>
              </div>

              {/* Tab content */}
              <div style={{flex:1,overflowY:"auto"}}>
                {dpTab==="details"&&(
                  <div>
                    {/* Biometric strip */}
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                      {sel.thumb_url?<img src={sel.thumb_url} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover",border:`1px solid ${C.border2}`}}/>:<div style={{width:40,height:40,borderRadius:6,background:C.surface,border:`1px dashed ${C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.text3}}>🖐</div>}
                      <div style={{fontSize:11,lineHeight:1.6}}>
                        <div style={{color:sel.thumb_url?C.accent:C.text3,fontWeight:600}}>{sel.thumb_url?"✓ Fingerprint on file":"No fingerprint"}</div>
                        <div style={{color:C.text3}}>{sel.photo_url?"✓ Photo on file":"No photo"}</div>
                      </div>
                    </div>
                    {/* Offence highlight */}
                    {sel.primary_offence&&(()=>{const oc=OFFENCE_COLOR[sel.primary_offence]||{};return(
                      <div style={{margin:"10px 14px",padding:"8px 12px",borderRadius:8,background:oc.bg||C.surface2,border:`1px solid ${oc.border||C.border}`,display:"flex",alignItems:"center",gap:6}}>
                        {oc.dot&&<span style={{width:8,height:8,borderRadius:"50%",background:oc.dot}}/>}
                        <div>
                          <div style={{fontSize:10,color:oc.text||C.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Primary offence</div>
                          <div style={{fontSize:12,fontWeight:600,color:oc.text||C.text}}>{sel.primary_offence}</div>
                          {sel.secondary_offence&&<div style={{fontSize:11,color:oc.text||C.text3,marginTop:1}}>Also: {sel.secondary_offence}</div>}
                        </div>
                      </div>
                    );})()}
                    <div style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"8px 0 4px"}}>Personal</div>
                      <DPRow label="Date of birth" value={sel.dob}/><DPRow label="Gender" value={sel.gender}/>
                      <DPRow label="Phone" value={sel.phone_number} icon="📞"/><DPRow label="Address" value={sel.home_address} icon="🏠"/>
                      <DPRow label="Vehicle" value={sel.vehicle_registration} icon="🚗"/><DPRow label="Family" value={sel.family_members} icon="👨‍👩‍👧"/>
                      <DPRow label="Medical" value={sel.medical_conditions} icon="🏥"/>
                      <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>Criminal record</div>
                      <DPRow label="Arrest year" value={sel.arrest_year}/><DPRow label="Sentence" value={`${sel.sentence} years`}/>
                      <DPRow label="Release date" value={sel.release_date} icon="📅"/><DPRow label="Associates" value={sel.associates}/>
                      <DPRow label="Convictions" value={sel.convictions}/>
                      <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>Profile</div>
                      <div style={{fontSize:11,color:C.text2,lineHeight:1.6,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>{sel.behaviour}</div>
                      <div style={{fontSize:11,color:C.text3,fontStyle:"italic",lineHeight:1.6,padding:"6px 0"}}>{sel.psych}</div>
                      {sel.case_notes&&<>
                        <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 6px"}}>📝 Case notes</div>
                        <div style={{fontSize:11,color:C.text2,lineHeight:1.7,background:C.surface2,padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,whiteSpace:"pre-wrap",marginBottom:8}}>{sel.case_notes}</div>
                      </>}
                    </div>
                  </div>
                )}
                {dpTab==="associates"&&(
                  <div style={{padding:"12px 14px"}}>
                    <AssociatesPanel
                      profileId={sel.id}
                      onNavigate={navigateToProfile}
                      canEdit={!!user}
                    />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:6,background:C.surface,flexShrink:0}}>
                <button onClick={()=>printCurrent(sel)} style={{...btnGreen,justifyContent:"center",width:"100%"}}>🖨️ Print this profile</button>
                {user&&(
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setModal({record:sel})} style={{...btnBlue,flex:1,justifyContent:"center"}}>Edit</button>
                    <button onClick={()=>deleteRecord(sel.id)} style={{...btnRed,flex:1,justifyContent:"center"}}>Delete</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{display:"flex",alignItems:"center",padding:"8px 20px",borderTop:`1px solid ${C.border}`,background:C.surface,gap:14,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:C.text3}}>{filtered.length} profiles · {wanted} wanted · {severe} severe risk</span>
        {selected.size>0&&<span style={{fontSize:11,color:C.accent,fontWeight:600}}>{selected.size} selected</span>}
        <div style={{flex:1}}/>
        <span style={{fontSize:11,color:C.text3}}>Fiji Central Criminal Intelligence · FY2026 · Confidential</span>
      </div>
    </div>
  );
}