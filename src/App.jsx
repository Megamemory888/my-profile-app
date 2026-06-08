import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import OfficerPortal from "./OfficerPortal";

const OFFENCES = ["Aggravated Assault","Armed Robbery","Bribery","Burglary","Counterfeit Operations","Cybercrime","Domestic Violence","Drug Trafficking","Extortion","Fraud","Human Trafficking","Identity Fraud","Illegal Firearm Possession","Insurance Fraud","International Drug Smuggling","Kidnapping","Money Laundering","Organized Crime Activity","Smuggling","Tax Evasion","Vehicle Theft"];
const OCCUPATIONS = ["Accountant","Business Owner","Construction Worker","Dock Worker","Farmer","Fisherman","Hotel Staff","IT Technician","Mechanic","Nightclub Operator","Retail Manager","Security Guard","Taxi Driver","Warehouse Supervisor"];
const LOCATIONS = ["Ba","Labasa","Lautoka","Levuka","Nadi","Nausori","Rakiraki","Savusavu","Sigatoka","Suva"];
const BEH = ["Financially motivated offender","Frequent cross-border travel","History of violent escalation","Known to operate in groups","Maintains low public profile","Repeat offender with regional links","Suspected gang affiliations","Technically skilled offender"];
const PSY = ["Avoids direct confrontation when possible","Calculated and methodical","Displays anti-social behaviour patterns","High adaptability","Impulsive under pressure","Manipulative tendencies observed"];
const RELATIONSHIP_TYPES = ["Known Associate","Gang Member","Family Member","Business Partner","Supplier","Distributor","Co-offender","Suspected Link","Informant","Other"];

const NATIONALITIES = [
  "Fijian",
  "Australian","New Zealander","Papua New Guinean","Samoan","Tongan","Vanuatuan","Solomon Islander","i-Kiribati","Tuvaluan","Cook Islander",
  "Ecuadorian","Mexican","Colombian","American","Brazilian","Peruvian","Chilean","Venezuelan",
  "British","French","Dutch","Spanish","Italian","German","Portuguese",
  "Chinese","Indian","Filipino","Indonesian","Thai","Malaysian","Sri Lankan",
  "Other",
];

const GANG_GROUPS = [
  { group: "Ecuador", gangs: ["Los Choneros","Los Lobos","Tiguerones","Chone Killers"] },
  { group: "Mexico / Cartels", gangs: ["Sinaloa Cartel","Jalisco New Generation Cartel (CJNG)","Gulf Cartel","Los Zetas Remnants","Cartel del Noreste"] },
  { group: "Australia / New Zealand", gangs: ["Coconut Cartel","Mongrel Mob","Black Power","Comancheros","Head Hunters","King Cobras"] },
  { group: "United States", gangs: ["MS-13","18th Street Gang","Mexican Mafia","Bloods","Crips","Latin Kings"] },
  { group: "Local / Unknown", gangs: ["Local Syndicate","Unknown Gang","Independent Operator"] },
];

const DEPORTEE_SOURCES = ["Australia","New Zealand","United States","United Kingdom","Canada","Other"];
const ENTRY_METHODS = ["Air — Commercial Flight","Air — Charter / Private","Sea — Cargo Ship","Sea — Private Vessel","Unknown"];
const VISA_STATUSES = ["Tourist Visa","Work Visa","Student Visa","Overstayed Visa","No Visa (Illegal Entry)","Diplomatic","Transit","Unknown"];
const GANG_RANKS = ["Leader / Boss","Lieutenant","Enforcer","Member","Associate","Prospect","Unknown"];

const OFFENCE_COLOR = {
  "Aggravated Assault":           { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Armed Robbery":                { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Domestic Violence":            { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Kidnapping":                   { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Human Trafficking":            { bg:"#FDEAEA", text:"#7A1A1A", border:"#F0A0A0", dot:"#E24B4A" },
  "Illegal Firearm Possession":   { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Drug Trafficking":             { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "International Drug Smuggling": { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Organized Crime Activity":     { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Smuggling":                    { bg:"#FAECE7", text:"#4A1B0C", border:"#F0997B", dot:"#D85A30" },
  "Fraud":                        { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Bribery":                      { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Cybercrime":                   { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Counterfeit Operations":       { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Identity Fraud":               { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Insurance Fraud":              { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Money Laundering":             { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Tax Evasion":                  { bg:"#FAEEDA", text:"#412402", border:"#FAC775", dot:"#BA7517" },
  "Extortion":                    { bg:"#EEEDFE", text:"#26215C", border:"#AFA9EC", dot:"#534AB7" },
  "Burglary":                     { bg:"#E6F1FB", text:"#042C53", border:"#85B7EB", dot:"#185FA5" },
  "Vehicle Theft":                { bg:"#E6F1FB", text:"#042C53", border:"#85B7EB", dot:"#185FA5" },
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
  bg:"#EDEEF2", surface:"#FFFFFF", surface2:"#F3F4F8",
  nav:"#0F2044", navText:"#FFFFFF", navMuted:"rgba(255,255,255,0.5)",
  navAccent:"#1A3A6B",
  border:"#D8DCE8", border2:"#BFC5D5",
  text:"#0F172A", text2:"#374151", text3:"#6B7280",
  accent:"#1447C4", accentL:"#E8EFFD",
  green:"#166534", greenL:"#DCFCE7",
  orange:"#92400E", orangeL:"#FEF3C7",
  classified:"#7C0000",
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
  if (r.photo_url) return <img src={r.photo_url} alt="" style={{width:size,height:size,borderRadius:3,objectFit:"cover",border:`2px solid ${rs.border||C.border}`,flexShrink:0}} />;
  return <div style={{width:size,height:size,borderRadius:3,flexShrink:0,background:rs.bg||C.accentL,color:rs.text||C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.3),fontWeight:700,border:`2px solid ${rs.border||C.border}`,letterSpacing:"0.05em"}}>{ini}</div>;
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
    const intlTags = [r.is_foreign_national&&`<span class="tag tag-intl">🌍 Foreign National</span>`, r.is_deportee&&`<span class="tag tag-deportee">✈️ Deportee — ${r.deported_from||""}</span>`, r.gang_affiliation&&`<span class="tag tag-gang">⚠️ ${r.gang_affiliation}${r.gang_rank?` · ${r.gang_rank}`:""}</span>`].filter(Boolean).join(" ");
    return `
      <div class="profile-card">
        <div class="card-header">
          <div class="header-left">
            ${r.photo_url ? `<img src="${r.photo_url}" class="photo" alt="">` : `<div class="initials">${r.name?.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase()}</div>`}
            <div class="header-info">
              <div class="profile-id">${r.id}</div>
              <div class="profile-name">${r.name}</div>
              <div class="profile-sub">${r.alias||"—"} · ${r.occupation||"—"} · ${r.nationality||"Fijian"}</div>
              ${intlTags?`<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">${intlTags}</div>`:""}
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
          ${r.is_foreign_national||r.is_deportee?`
          <div class="section"><div class="section-title" style="background:#E6F1FB;color:#042C53">🌍 International Profile</div>
            <div class="grid2" style="padding:10px 14px">
              ${r.country_of_origin?`<div class="field"><span class="label">Country of Origin</span><span class="value">${r.country_of_origin}</span></div>`:""}
              ${r.passport_number?`<div class="field"><span class="label">Passport No.</span><span class="value">${r.passport_number}</span></div>`:""}
              ${r.visa_status?`<div class="field"><span class="label">Visa Status</span><span class="value">${r.visa_status}</span></div>`:""}
              ${r.entry_method?`<div class="field"><span class="label">Entry Method</span><span class="value">${r.entry_method}</span></div>`:""}
              ${r.is_deportee?`<div class="field"><span class="label">Deported From</span><span class="value">${r.deported_from||"—"}</span></div>`:""}
              ${r.deportation_year?`<div class="field"><span class="label">Deportation Year</span><span class="value">${r.deportation_year}</span></div>`:""}
              ${r.known_routes?`<div class="field full"><span class="label">Known Routes</span><span class="value">${r.known_routes}</span></div>`:""}
              ${r.international_links?`<div class="field full"><span class="label">International Links</span><span class="value">${r.international_links}</span></div>`:""}
            </div>
          </div>`:""}
          ${r.gang_affiliation?`
          <div class="section"><div class="section-title" style="background:#FDEAEA;color:#7A1A1A">⚠️ Gang / Club Affiliation</div>
            <div class="grid2" style="padding:10px 14px">
              <div class="field"><span class="label">Gang / Club</span><span class="value" style="font-weight:700">${r.gang_affiliation}</span></div>
              ${r.gang_rank?`<div class="field"><span class="label">Rank / Role</span><span class="value">${r.gang_rank}</span></div>`:""}
            </div>
          </div>`:""}
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
        <div class="card-footer"><span>CONFIDENTIAL — National Criminal Intelligence Centre</span><span>Printed: ${now}</span></div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FCCI Report — ${profiles.length} profile${profiles.length!==1?"s":""}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#f0f2f5;color:#1a1d23;font-size:13px}
  .cover{background:#1C2B4A;color:white;padding:40px 48px;margin-bottom:24px}.cover-title{font-size:24px;font-weight:700}.cover-sub{font-size:13px;opacity:0.7;margin-top:4px}
  .cover-meta{margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2);display:flex;gap:40px}.cover-meta-item{font-size:12px}.cover-meta-item b{display:block;font-size:20px;font-weight:700;margin-bottom:2px}
  .profile-card{background:white;margin:0 24px 24px;border-radius:10px;overflow:hidden;border:1px solid #dde1e9;page-break-after:always;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
  .card-header{background:#1C2B4A;padding:18px 20px;display:flex;justify-content:space-between;align-items:flex-start}
  .header-left{display:flex;gap:14px;align-items:flex-start}.photo{width:64px;height:64px;border-radius:4px;object-fit:cover;border:2px solid rgba(255,255,255,0.3)}
  .initials{width:64px;height:64px;border-radius:4px;background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
  .profile-id{font-size:10px;color:rgba(255,255,255,0.6);font-family:monospace}.profile-name{font-size:18px;font-weight:700;color:white}.profile-sub{font-size:12px;color:rgba(255,255,255,0.65);margin-top:3px}
  .header-badges{display:flex;flex-direction:column;gap:5px;align-items:flex-end}.badge{padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600}
  .tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600}.tag-intl{background:#E6F1FB;color:#042C53}.tag-deportee{background:#FAEEDA;color:#412402}.tag-gang{background:#FDEAEA;color:#7A1A1A}
  .card-body{padding:20px;display:flex;flex-direction:column;gap:16px}.section{border:1px solid #e8eaee;border-radius:8px;overflow:hidden}
  .section-title{background:#f4f5f7;padding:7px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#7b8794;border-bottom:1px solid #e8eaee}
  .grid2{display:grid;grid-template-columns:1fr 1fr;padding:10px 14px;gap:6px}.field{display:flex;flex-direction:column;gap:2px}.field.full{grid-column:1/-1}
  .label{font-size:10px;color:#7b8794;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}.value{font-size:13px;color:#1a1d23;font-weight:500}
  .offence-block{margin:12px 14px 0;padding:10px 14px;border-radius:6px}.case-notes{padding:12px 14px;font-size:12px;color:#4a5568;line-height:1.7;white-space:pre-wrap;background:#fafbfc}
  .card-footer{background:#f4f5f7;padding:8px 20px;display:flex;justify-content:space-between;font-size:10px;color:#7b8794;border-top:1px solid #dde1e9}
  @media print{body{background:white}.profile-card{margin:0;border-radius:0;box-shadow:none}.no-print{display:none!important}}</style></head>
  <body>
  <div class="cover"><div style="font-size:32px;margin-bottom:12px">🛡️</div><div class="cover-title">Criminal Intelligence Report</div><div class="cover-sub">National Criminal Intelligence Centre — CONFIDENTIAL</div>
  <div class="cover-meta">
    <div class="cover-meta-item"><b>${profiles.length}</b>Profile${profiles.length!==1?"s":""}</div>
    <div class="cover-meta-item"><b>${now}</b>Date printed</div>
    <div class="cover-meta-item"><b>${profiles.filter(p=>p.status==="Wanted").length}</b>Wanted</div>
    <div class="cover-meta-item"><b>${profiles.filter(p=>p.is_foreign_national).length}</b>Foreign Nationals</div>
    <div class="cover-meta-item"><b>${profiles.filter(p=>p.is_deportee).length}</b>Deportees</div>
    <div class="cover-meta-item"><b>${profiles.filter(p=>p.gang_affiliation).length}</b>Gang Affiliated</div>
  </div></div>
  <div style="text-align:right;padding:0 24px 12px" class="no-print">
    <button onclick="window.print()" style="background:#1C2B4A;color:white;border:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-right:8px">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()" style="background:#f0f2f5;color:#4a5568;border:1px solid #dde1e9;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer">Close</button>
  </div>
  ${rows}</body></html>`;

  const win = window.open("","_blank","width=900,height=800");
  win.document.write(html); win.document.close();
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email||!password){ setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    const { error:err } = await supabase.auth.signInWithPassword({ email, password });
    if (err){ setError("Invalid credentials. Access denied."); setLoading(false); return; }
    onLogin(); setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Left panel — branding */}
      <div style={{flex:1,background:"linear-gradient(160deg,#0A1628 0%,#0F2044 45%,#1A3A6B 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px",position:"relative",overflow:"hidden"}}>

        {/* Background pattern */}
        <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px)"}}/>

        {/* Logo */}
        <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom:24}}>
            <path d="M48 4L8 20V48C8 68 26 84 48 92C70 84 88 68 88 48V20L48 4Z" fill="#1A3A6B" stroke="#2A5EC4" strokeWidth="2.5"/>
            <path d="M48 12L16 25V48C16 64 30 78 48 85C66 78 80 64 80 48V25L48 12Z" fill="#0F2044" stroke="#3B6FD4" strokeWidth="1.5"/>
            <circle cx="48" cy="46" r="16" fill="none" stroke="#60A5FA" strokeWidth="2"/>
            <path d="M40 46L45 51L56 40" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M28 38H68" stroke="#2A5EC4" strokeWidth="1" opacity="0.5"/>
            <path d="M28 54H68" stroke="#2A5EC4" strokeWidth="1" opacity="0.5"/>
            <circle cx="48" cy="20" r="3" fill="#60A5FA" opacity="0.6"/>
          </svg>

          <div style={{fontSize:11,fontWeight:700,color:"#F87171",letterSpacing:"0.22em",textTransform:"uppercase",marginBottom:10}}>CLASSIFIED</div>
          <div style={{fontSize:28,fontWeight:700,color:"#fff",lineHeight:1.2,letterSpacing:"0.01em",marginBottom:6}}>National Criminal<br/>Intelligence Centre</div>
          <div style={{width:48,height:2,background:"#2A5EC4",margin:"14px auto",borderRadius:2}}/>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",letterSpacing:"0.08em",textTransform:"uppercase"}}>NCIC · Secure Access Portal</div>

          <div style={{marginTop:48,display:"flex",flexDirection:"column",gap:10}}>
            {[
              {icon:"🛡️", text:"Criminal Profile Intelligence"},
              {icon:"📋", text:"Incident Reporting System"},
              {icon:"🔗", text:"Associate & Gang Network Tracking"},
              {icon:"🌍", text:"International & Deportee Registry"},
            ].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"rgba(255,255,255,0.05)",borderRadius:4,border:"1px solid rgba(255,255,255,0.07)"}}>
                <span style={{fontSize:14}}>{f.icon}</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.55)",letterSpacing:"0.02em"}}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#1447C4,#2A5EC4,#60A5FA,#2A5EC4,#1447C4)"}}/>
      </div>

      {/* Right panel — login form */}
      <div style={{width:420,background:"#F3F4F8",display:"flex",flexDirection:"column",justifyContent:"center",padding:"48px 40px",position:"relative"}}>

        {/* Top classified bar */}
        <div style={{position:"absolute",top:0,left:0,right:0,background:"#7C0000",padding:"5px 20px",textAlign:"center"}}>
          <span style={{fontSize:10,fontWeight:700,color:"#fff",letterSpacing:"0.15em",textTransform:"uppercase"}}>⚠ AUTHORISED PERSONNEL ONLY ⚠</span>
        </div>

        <div style={{marginTop:20}}>
          <div style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:4,letterSpacing:"0.01em"}}>Secure Sign In</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:32}}>Enter your credentials to access the system</div>

          {error && (
            <div style={{background:"#FEE2E2",border:"1px solid #FECACA",color:"#991B1B",padding:"10px 14px",borderRadius:4,fontSize:12,marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
              <span>⚠</span>{error}
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em"}}>Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&login()}
                placeholder="user@ncic.gov"
                style={{padding:"10px 12px",fontSize:13,borderRadius:4,border:"1px solid #BFC5D5",background:"#fff",color:"#0F172A",fontFamily:"inherit",width:"100%",outline:"none"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em"}}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&login()}
                placeholder="••••••••"
                style={{padding:"10px 12px",fontSize:13,borderRadius:4,border:"1px solid #BFC5D5",background:"#fff",color:"#0F172A",fontFamily:"inherit",width:"100%",outline:"none"}}/>
            </div>

            <button onClick={login} disabled={loading}
              style={{background:loading?"#6B7280":"#1447C4",color:"#fff",border:"none",borderRadius:4,padding:"12px",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",letterSpacing:"0.02em",marginTop:4,transition:"background 0.2s"}}>
              {loading ? "Authenticating…" : "Sign In →"}
            </button>
          </div>

          <div style={{marginTop:28,padding:"14px 16px",background:"rgba(20,71,196,0.06)",border:"1px solid rgba(20,71,196,0.15)",borderRadius:4}}>
            <div style={{fontSize:11,fontWeight:600,color:"#1447C4",marginBottom:4,letterSpacing:"0.04em",textTransform:"uppercase"}}>Access Levels</div>
            <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>
              <div>🔵 <strong>Admin / Analyst</strong> — Full intelligence database access</div>
              <div>🟢 <strong>Police Officer</strong> — Incident reporting portal</div>
            </div>
          </div>
        </div>

        <div style={{position:"absolute",bottom:20,left:40,right:40,textAlign:"center"}}>
          <div style={{fontSize:10,color:"#9CA3AF",letterSpacing:"0.04em"}}>Unauthorised access is strictly prohibited and may result in criminal prosecution.</div>
        </div>
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
    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      supabase.from("profile_associates").select("id, relationship_type, associate_id, criminal_profiles!profile_associates_associate_id_fkey(id,name,risk,status,primary_offence,photo_url,is_foreign_national,is_deportee,gang_affiliation)").eq("profile_id", profileId),
      supabase.from("profile_associates").select("id, relationship_type, profile_id, criminal_profiles!profile_associates_profile_id_fkey(id,name,risk,status,primary_offence,photo_url,is_foreign_national,is_deportee,gang_affiliation)").eq("associate_id", profileId),
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
      .select("id,name,risk,status,primary_offence,photo_url,is_foreign_national,gang_affiliation")
      .neq("id", profileId)
      .or(`name.ilike.%${q}%,id.ilike.%${q}%,alias.ilike.%${q}%`)
      .limit(8);
    setSearchResults(data||[]);
    setSearching(false);
  };

  const linkAssociate = async (associateProfile) => {
    const already = associates.find(a => a.profile?.id === associateProfile.id);
    if (already) { alert("Already linked as associate."); return; }
    const { error } = await supabase.from("profile_associates").insert([{
      profile_id: profileId, associate_id: associateProfile.id, relationship_type: relType,
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

      {showAdd && (
        <div style={{background:C.accentL,border:`1px solid #85B7EB`,borderRadius:8,padding:"10px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:600,color:C.accent,marginBottom:6}}>Search for a profile to link:</div>
          <input ref={searchRef} type="text" value={searchQ} onChange={e=>handleSearch(e.target.value)}
            placeholder="Type name, alias or ID..." style={{...inp,marginBottom:6}} autoFocus/>
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
                  style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:C.surface,borderRadius:6,cursor:"pointer",border:`1px solid ${C.border}`}}
                  onMouseOver={e=>e.currentTarget.style.background=C.surface2}
                  onMouseOut={e=>e.currentTarget.style.background=C.surface}>
                  <Avatar r={r} size={28}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {r.name} {r.is_foreign_national&&<span style={{fontSize:10}}>🌍</span>}
                    </div>
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
                  <div style={{fontSize:12,fontWeight:600,color:C.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:"underline",cursor:"pointer"}}>
                    {r.name} {r.is_foreign_national&&<span style={{fontSize:11}}>🌍</span>}
                  </div>
                  <div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>{r.id}</div>
                  <div style={{fontSize:10,color:C.text2,marginTop:1}}>{relType}{r.gang_affiliation&&<span style={{marginLeft:4,color:"#7A1A1A"}}>⚠️ {r.gang_affiliation}</span>}</div>
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
    nationality:record.nationality||"Fijian",
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
    // International fields
    is_foreign_national: record.is_foreign_national||false,
    country_of_origin: record.country_of_origin||"",
    passport_number: record.passport_number||"",
    visa_status: record.visa_status||"",
    entry_method: record.entry_method||"",
    known_routes: record.known_routes||"",
    international_links: record.international_links||"",
    // Deportee fields
    is_deportee: record.is_deportee||false,
    deported_from: record.deported_from||"",
    deportation_year: record.deportation_year||"",
    // Gang fields
    gang_affiliation: record.gang_affiliation||"",
    gang_rank: record.gang_rank||"",
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
      nationality:f.nationality, location:f.location, occupation:f.occupation,
      primary_offence:f.primary_offence, secondary_offence:f.secondary_offence,
      arrest_year:f.arrest_year, sentence:f.sentence, risk:f.risk, status:f.status,
      associates:f.associates, convictions:f.convictions, behaviour:f.behaviour,
      psych:f.psych, photo_url, thumb_url,
      home_address:f.home_address, phone_number:f.phone_number,
      vehicle_registration:f.vehicle_registration, family_members:f.family_members,
      medical_conditions:f.medical_conditions, release_date:f.release_date,
      case_notes:f.case_notes,
      is_foreign_national:f.is_foreign_national,
      country_of_origin:f.is_foreign_national?f.country_of_origin:null,
      passport_number:f.is_foreign_national?f.passport_number:null,
      visa_status:f.is_foreign_national?f.visa_status:null,
      entry_method:f.is_foreign_national?f.entry_method:null,
      known_routes:f.is_foreign_national?f.known_routes:null,
      international_links:f.is_foreign_national?f.international_links:null,
      is_deportee:f.is_deportee,
      deported_from:f.is_deportee?f.deported_from:null,
      deportation_year:f.is_deportee&&f.deportation_year?Number(f.deportation_year):null,
      gang_affiliation:f.gang_affiliation||null,
      gang_rank:f.gang_affiliation?f.gang_rank:null,
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
      <div style={{background:C.surface,borderRadius:12,width:600,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.nav}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{isNew?"New Criminal Profile":"Edit Profile"}</div>
            {!isNew&&<div style={{fontSize:11,color:C.navMuted,marginTop:1}}>ID: {record.id}</div>}
          </div>
          <button onClick={onClose} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"4px 10px"}}>✕ Close</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"18px 20px",display:"flex",flexDirection:"column",gap:18,background:C.bg}}>

          {/* Biometrics */}
          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="🔬">Biometric data</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:C.text2,marginBottom:8}}>Profile photo</div>
                <label style={{display:"block",cursor:"pointer"}}>
                  <div style={{border:`1.5px dashed ${C.border2}`,borderRadius:8,padding:12,textAlign:"center",minHeight:90,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,background:C.surface2}}>
                    {(f.photoData||f.photo_url)?<img src={f.photoData||f.photo_url} alt="" style={{width:64,height:64,borderRadius:3,objectFit:"cover",border:`2px solid ${C.accent}`}}/>:<><div style={{fontSize:26}}>📷</div><div style={{fontSize:11,color:C.text3}}>Click to upload</div></>}
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

          {/* Personal details */}
          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="👤">Personal details</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {fg("Full Name *","name")} {fg("Alias","alias")}
              {fg("Gender","gender","text",["Male","Female"])} {fg("Date of birth","dob","date")}
              {fg("Nationality","nationality","text",NATIONALITIES)} {fg("Location","location","text",LOCATIONS)}
              {fg("Occupation","occupation","text",OCCUPATIONS)}
              {fg("📞 Phone","phone_number")} {fg("🚗 Vehicle","vehicle_registration")}
              <div style={{gridColumn:"1/-1"}}>{fg("🏠 Address","home_address","text",null,true)}</div>
              {fg("👨‍👩‍👧 Family","family_members")} {fg("🏥 Medical","medical_conditions")}
            </div>
          </div>

          {/* International / Deportee */}
          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="🌏">International Profile</SectionLabel>
            <div style={{display:"flex",gap:20,marginBottom:14}}>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"8px 14px",borderRadius:8,border:`2px solid ${f.is_foreign_national?C.accent:C.border}`,background:f.is_foreign_national?C.accentL:C.surface2,flex:1}}>
                <input type="checkbox" checked={f.is_foreign_national} onChange={e=>set("is_foreign_national",e.target.checked)} style={{width:15,height:15,accentColor:C.accent}}/>
                <div><div style={{fontSize:12,fontWeight:700,color:f.is_foreign_national?C.accent:C.text}}>🌍 Foreign National</div><div style={{fontSize:10,color:C.text3}}>Not a Fijian citizen</div></div>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"8px 14px",borderRadius:8,border:`2px solid ${f.is_deportee?"#BA7517":C.border}`,background:f.is_deportee?"#FAEEDA":C.surface2,flex:1}}>
                <input type="checkbox" checked={f.is_deportee} onChange={e=>set("is_deportee",e.target.checked)} style={{width:15,height:15,accentColor:"#BA7517"}}/>
                <div><div style={{fontSize:12,fontWeight:700,color:f.is_deportee?"#633806":C.text}}>✈️ Deportee</div><div style={{fontSize:10,color:C.text3}}>Deported back to Fiji</div></div>
              </label>
            </div>

            {f.is_foreign_national && (
              <div style={{background:C.accentL,border:`1px solid #85B7EB`,borderRadius:8,padding:"12px",marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:10,letterSpacing:"0.06em"}}>🌍 FOREIGN NATIONAL DETAILS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Country of Origin</label>
                    <select value={f.country_of_origin} onChange={e=>set("country_of_origin",e.target.value)} style={inp}>
                      <option value="">— Select —</option>
                      {NATIONALITIES.filter(n=>n!=="Fijian").map(n=><option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Passport Number</label>
                    <input value={f.passport_number} onChange={e=>set("passport_number",e.target.value)} style={inp} placeholder="Passport / travel doc no."/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Visa Status</label>
                    <select value={f.visa_status} onChange={e=>set("visa_status",e.target.value)} style={inp}>
                      <option value="">— Select —</option>
                      {VISA_STATUSES.map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Entry Method</label>
                    <select value={f.entry_method} onChange={e=>set("entry_method",e.target.value)} style={inp}>
                      <option value="">— Select —</option>
                      {ENTRY_METHODS.map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Known Smuggling Routes</label>
                    <textarea value={f.known_routes} onChange={e=>set("known_routes",e.target.value)} rows={2} placeholder="e.g. Ecuador → Pacific → Fiji → Australia" style={{...inp,resize:"vertical"}}/>
                  </div>
                  <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>International Links / Contacts</label>
                    <textarea value={f.international_links} onChange={e=>set("international_links",e.target.value)} rows={2} placeholder="Known cartel contacts, overseas associates..." style={{...inp,resize:"vertical"}}/>
                  </div>
                </div>
              </div>
            )}

            {f.is_deportee && (
              <div style={{background:"#FAEEDA",border:`1px solid #FAC775`,borderRadius:8,padding:"12px"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#633806",marginBottom:10,letterSpacing:"0.06em"}}>✈️ DEPORTEE DETAILS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Deported From</label>
                    <select value={f.deported_from} onChange={e=>set("deported_from",e.target.value)} style={inp}>
                      <option value="">— Select country —</option>
                      {DEPORTEE_SOURCES.map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Deportation Year</label>
                    <input type="number" value={f.deportation_year} onChange={e=>set("deportation_year",e.target.value)} style={inp} placeholder="e.g. 2022"/>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Criminal record */}
          <div style={{background:C.surface,borderRadius:10,padding:"16px",border:`1px solid ${C.border}`}}>
            <SectionLabel icon="⚖️">Criminal record</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {fg("Primary offence","primary_offence","text",OFFENCES)} {fg("Secondary offence","secondary_offence","text",OFFENCES)}
              {fg("Arrest year","arrest_year","number")} {fg("Sentence (years)","sentence","number")}
              {fg("Risk level","risk","text",["Low","Moderate","High","Severe"])} {fg("Status","status","text",["Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"])}
              {fg("Associates","associates","number")} {fg("Convictions","convictions","number")}
              {fg("📅 Release date","release_date","date")}
              <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:11,fontWeight:600,color:C.text2}}>⚠️ Gang / Club Affiliation</label>
                <select value={f.gang_affiliation} onChange={e=>set("gang_affiliation",e.target.value)} style={inp}>
                  <option value="">None / Not Affiliated</option>
                  {GANG_GROUPS.map(g=>(
                    <optgroup key={g.group} label={`── ${g.group} ──`}>
                      {g.gangs.map(name=><option key={name} value={name}>{name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              {f.gang_affiliation && (
                <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:11,fontWeight:600,color:C.text2}}>Gang Rank / Role</label>
                  <select value={f.gang_rank} onChange={e=>set("gang_rank",e.target.value)} style={inp}>
                    <option value="">— Select rank —</option>
                    {GANG_RANKS.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
              )}
              <div style={{gridColumn:"1/-1"}}>{fg("Behavioural notes","behaviour","text",BEH,true)}</div>
              <div style={{gridColumn:"1/-1"}}>{fg("Psychological profile","psych","text",PSY,true)}</div>
            </div>
          </div>

          {/* Case notes */}
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
  const [userRole, setUserRole] = useState(null);   // 'admin' | 'officer' | null
  const [officerProfile, setOfficerProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [db, setDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [fRisk, setFRisk] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fGender, setFGender] = useState("");
  const [fForeign, setFForeign] = useState(false);
  const [fDeportee, setFDeportee] = useState(false);
  const [fGang, setFGang] = useState("");
  const [sortCol, setSortCol] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState("table");
  const [selId, setSelId] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [dpTab, setDpTab] = useState("details");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2800); };

  const loadRole = async (uid) => {
    if (!uid) { setUserRole(null); setOfficerProfile(null); return; }
    const { data } = await supabase.from("user_roles").select("*").eq("user_id", uid).single();
    if (data) {
      setUserRole(data.role);
      if (data.role === "officer") setOfficerProfile({ ...data, user_id: uid });
    } else {
      // No role record = treat as admin (backwards compatible with existing admins)
      setUserRole("admin");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user??null);
      loadRole(session?.user?.id??null).then(()=>setAuthLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user??null);
      loadRole(session?.user?.id??null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); setUserRole(null); setOfficerProfile(null); showToast("Signed out."); };

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
    if (query && !`${r.id} ${r.name} ${r.alias} ${r.gang_affiliation||""} ${r.country_of_origin||""}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (fRisk && r.risk!==fRisk) return false;
    if (fStatus && r.status!==fStatus) return false;
    if (fLocation && r.location!==fLocation) return false;
    if (fGender && r.gender!==fGender) return false;
    if (fForeign && !r.is_foreign_national) return false;
    if (fDeportee && !r.is_deportee) return false;
    if (fGang && r.gang_affiliation!==fGang) return false;
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

  const navigateToProfile = (id) => {
    setSelId(id); setDpTab("details");
    setTimeout(() => {
      const el = document.getElementById(`row-${id}`);
      if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
    }, 100);
  };

  const sel = db.find(r=>r.id===selId)||null;
  const wanted = db.filter(r=>r.status==="Wanted").length;
  const inCustody = db.filter(r=>r.status==="In Custody").length;
  const severe = db.filter(r=>r.risk==="Severe").length;
  const foreignCount = db.filter(r=>r.is_foreign_national).length;
  const deporteeCount = db.filter(r=>r.is_deportee).length;
  const gangCount = db.filter(r=>r.gang_affiliation).length;

  if (authLoading) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0A1628 0%,#0F2044 45%,#1A3A6B 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <svg width="56" height="56" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 4L8 20V48C8 68 26 84 48 92C70 84 88 68 88 48V20L48 4Z" fill="#1A3A6B" stroke="#2A5EC4" strokeWidth="2.5"/>
        <circle cx="48" cy="46" r="16" fill="none" stroke="#60A5FA" strokeWidth="2"/>
        <path d="M40 46L45 51L56 40" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Inter',system-ui,sans-serif"}}>Authenticating…</div>
    </div>
  );

  // Not logged in → show login cover
  if (!user) return <LoginPage onLogin={()=>{}} />;

  // Officer role → Officer Portal
  if (userRole === "officer" && officerProfile) {
    return <OfficerPortal user={user} officer={officerProfile} onLogout={logout}/>;
  }

  // Still loading role → brief wait
  if (userRole === null) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0A1628 0%,#0F2044 100%)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:12,letterSpacing:"0.1em",fontFamily:"'Inter',system-ui,sans-serif"}}>
      LOADING…
    </div>
  );

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
  });

  const filterToggle = (active, onClick, label) => (
    <button onClick={onClick} style={{...btnSm,height:32,background:active?C.accent:C.surface,color:active?"#fff":C.text2,border:`1px solid ${active?C.accent:C.border2}`,fontWeight:active?600:400}}>
      {label}
    </button>
  );

  return (
    <div style={{fontFamily:"'Inter',system-ui,-apple-system,sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:4px} .rh:hover{background:#EAF0FC!important} .rs-row{background:#DDE9F8!important;border-left:3px solid ${C.accent}!important} .sel-row{background:#EEF4FB!important} .ch:hover{border-color:${C.accent}!important} input[type=checkbox]{cursor:pointer;width:15px;height:15px;accent-color:${C.accent}}`}</style>

      {toast&&<div style={{position:"fixed",bottom:24,right:24,background:"#0F2044",color:"#fff",padding:"11px 20px",borderRadius:6,fontWeight:500,fontSize:13,zIndex:200,boxShadow:"0 6px 20px rgba(0,0,0,0.25)",letterSpacing:"0.01em",border:"1px solid rgba(255,255,255,0.1)"}}>{toast}</div>}
      {modal&&<Modal record={modal.record} onSave={saveRecord} onClose={()=>setModal(null)} allIds={db.map(r=>r.id)}/>}

      {/* Classification Banner */}
      <div style={{background:"#7C0000",padding:"3px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:16,position:"sticky",top:0,zIndex:51}}>
        <span style={{fontSize:10,fontWeight:700,color:"#fff",letterSpacing:"0.18em",textTransform:"uppercase"}}>⚠ CLASSIFIED — AUTHORISED PERSONNEL ONLY ⚠</span>
      </div>

      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",padding:"0 24px",height:58,background:C.nav,gap:14,position:"sticky",top:22,zIndex:50,borderBottom:"3px solid #2A5EC4"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,borderRight:"1px solid rgba(255,255,255,0.12)",paddingRight:16}}>
          <div style={{width:36,height:36,borderRadius:4,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,border:"1px solid rgba(255,255,255,0.15)"}}>🛡️</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"0.02em",lineHeight:1.2}}>NCIC</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:"0.06em",textTransform:"uppercase"}}>Criminal Intelligence</div>
          </div>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:"#fff",letterSpacing:"0.01em"}}>National Criminal Intelligence Centre System</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",letterSpacing:"0.04em"}}>SECURE DATABASE — FY2026</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",borderRight:"1px solid rgba(255,255,255,0.12)",paddingRight:10}}><span style={{color:"rgba(255,255,255,0.3)",fontSize:10,marginRight:4,letterSpacing:"0.05em",textTransform:"uppercase"}}>Admin:</span>{user.email}</div>
          <button onClick={logout} style={{...btnSm,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.75)",fontSize:11}}>Sign out</button>
          <button onClick={()=>setModal({record:{}})} style={{...btnBlue,background:"#1A56DB",border:"1px solid #1447C4",fontSize:12,fontWeight:600,padding:"7px 16px"}}>+ New Profile</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:C.nav,borderBottom:`1px solid rgba(255,255,255,0.06)`}}>
        <div style={{padding:"10px 16px",borderRight:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>Total Profiles</div>
          <div style={{fontSize:24,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>{db.length}</div>
        </div>
        {[
          {l:"Wanted",       v:wanted,        accent:"#F87171", border:"#B91C1C"},
          {l:"In Custody",   v:inCustody,     accent:"#60A5FA", border:"#1D4ED8"},
          {l:"Severe Risk",  v:severe,        accent:"#FB923C", border:"#C2410C"},
          {l:"Foreign Natl", v:foreignCount,  accent:"#38BDF8", border:"#0369A1"},
          {l:"Deportees",    v:deporteeCount, accent:"#FBBF24", border:"#B45309"},
          {l:"Gang Linked",  v:gangCount,     accent:"#F472B6", border:"#9D174D"},
        ].map(k=>(
          <div key={k.l} style={{padding:"10px 16px",borderRight:"1px solid rgba(255,255,255,0.08)",borderLeft:`3px solid ${k.border}`}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{k.l}</div>
            <div style={{fontSize:24,fontWeight:700,color:k.accent,letterSpacing:"-0.02em"}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,flexWrap:"wrap",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.text3,fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, alias, gang, ID..." style={{...inp,paddingLeft:30,width:230,height:32,fontSize:12}}/>
        </div>
        {[
          {v:fRisk,  s:setFRisk,     opts:["All risk","Low","Moderate","High","Severe"]},
          {v:fStatus,s:setFStatus,   opts:["All statuses","Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"]},
          {v:fLocation,s:setFLocation,opts:["All locations",...LOCATIONS]},
          {v:fGender,s:setFGender,   opts:["All genders","Male","Female"]},
        ].map((f,i)=>(
          <select key={i} value={f.v} onChange={e=>f.s(e.target.value.startsWith("All ")?"":e.target.value)} style={{...inp,height:32,width:"auto",cursor:"pointer",fontSize:12}}>
            {f.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        {/* Gang filter */}
        <select value={fGang} onChange={e=>setFGang(e.target.value)} style={{...inp,height:32,width:"auto",cursor:"pointer",fontSize:12}}>
          <option value="">All gangs</option>
          {GANG_GROUPS.map(g=>(
            <optgroup key={g.group} label={g.group}>
              {g.gangs.map(name=><option key={name} value={name}>{name}</option>)}
            </optgroup>
          ))}
        </select>
        {filterToggle(fForeign, ()=>setFForeign(p=>!p), "🌍 Foreign")}
        {filterToggle(fDeportee, ()=>setFDeportee(p=>!p), "✈️ Deportees")}
        <button onClick={()=>{setQuery("");setFRisk("");setFStatus("");setFLocation("");setFGender("");setFForeign(false);setFDeportee(false);setFGang("");}} style={{...btnSm,height:32}}>Clear</button>
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
      <div style={{display:"flex",height:"calc(100vh - 22px - 58px - 44px - 52px)"}}>
        <div style={{flex:1,overflow:"auto"}}>
          {loading?(
            <div style={{padding:48,textAlign:"center",color:C.accent}}>Loading profiles...</div>
          ):filtered.length===0?(
            <div style={{padding:48,textAlign:"center",color:C.text3}}>No profiles found.</div>
          ):view==="table"?(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#1B2D4F",borderBottom:"none"}}>
                  <th style={{padding:"9px 12px",width:36}}><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll}/></th>
                  {[["id","Case ID"],["",""],["name","Name"],["",""],["risk","Risk"],["status","Status"],["primary_offence","Offence"],["location","Loc."],["arrest_year","Year"],["",""]].map(([col,label],i)=>(
                    <th key={i} onClick={col?()=>handleSort(col):undefined} style={{padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:sortCol===col?"#93C5FD":"rgba(255,255,255,0.45)",letterSpacing:"0.09em",textTransform:"uppercase",cursor:col?"pointer":"default",userSelect:"none",whiteSpace:"nowrap",borderRight:i<9?"1px solid rgba(255,255,255,0.06)":"none",background:"transparent"}}>
                      {label}{col&&sortCol===col&&<span style={{marginLeft:3,color:"#60A5FA"}}>{sortAsc?"↑":"↓"}</span>}
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
                      <td style={{padding:"8px 6px",fontWeight:600,color:C.text,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {r.name}
                        <div style={{display:"flex",gap:3,marginTop:2,flexWrap:"wrap"}}>
                          {r.is_foreign_national&&<span style={{fontSize:9,background:"#E6F1FB",color:"#042C53",padding:"1px 5px",borderRadius:3,fontWeight:600}}>🌍 INTL</span>}
                          {r.is_deportee&&<span style={{fontSize:9,background:"#FAEEDA",color:"#633806",padding:"1px 5px",borderRadius:3,fontWeight:600}}>✈️ DEP</span>}
                          {r.gang_affiliation&&<span style={{fontSize:9,background:"#FDEAEA",color:"#7A1A1A",padding:"1px 5px",borderRadius:3,fontWeight:600}}>⚠️ GANG</span>}
                        </div>
                      </td>
                      <td style={{padding:"8px 6px"}}><Badge label={r.risk} style={RISK_STYLE[r.risk]}/></td>
                      <td style={{padding:"8px 6px"}}><Badge label={r.status} style={STATUS_STYLE[r.status]}/></td>
                      <td style={{padding:"8px 6px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:oc.text||C.text2}}>{oc.dot&&<span style={{width:7,height:7,borderRadius:"50%",background:oc.dot}}/>}{r.primary_offence}</span></td>
                      <td style={{padding:"8px 6px",color:C.text2,fontSize:11}}>{r.location}</td>
                      <td style={{padding:"8px 6px",color:C.text3,fontSize:11,fontFamily:"monospace"}}>{r.arrest_year}</td>
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
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
                      <Badge label={r.risk} style={RISK_STYLE[r.risk]}/><Badge label={r.status} style={STATUS_STYLE[r.status]}/>
                    </div>
                    {(r.is_foreign_national||r.is_deportee||r.gang_affiliation)&&(
                      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>
                        {r.is_foreign_national&&<span style={{fontSize:9,background:"#E6F1FB",color:"#042C53",padding:"2px 6px",borderRadius:3,fontWeight:700}}>🌍 Foreign</span>}
                        {r.is_deportee&&<span style={{fontSize:9,background:"#FAEEDA",color:"#633806",padding:"2px 6px",borderRadius:3,fontWeight:700}}>✈️ Deportee</span>}
                        {r.gang_affiliation&&<span style={{fontSize:9,background:"#FDEAEA",color:"#7A1A1A",padding:"2px 6px",borderRadius:3,fontWeight:700}}>⚠️ Gang</span>}
                      </div>
                    )}
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
        <div style={{width:320,borderLeft:`1px solid ${C.border}`,background:C.surface,flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {!sel?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,padding:24,background:C.surface2}}>
              <div style={{width:64,height:64,borderRadius:4,background:C.border,display:"flex",alignItems:"center",justifyContent:"center",opacity:0.3}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <p style={{fontSize:12,textAlign:"center",color:C.text3,lineHeight:1.6}}>Select a profile from the list<br/>to view full details</p>
            </div>
          ):(
            <>
              <div style={{background:C.nav,padding:"14px 14px 12px",flexShrink:0,borderBottom:"2px solid #2A5EC4"}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
                  <Avatar r={sel} size={54}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",fontFamily:"monospace",letterSpacing:"0.08em",marginBottom:2}}>{sel.id}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.3}}>{sel.name}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:2}}>{sel.alias||"—"} · {sel.nationality||"Fijian"}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:1}}>{sel.occupation||"—"}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  <Badge label={`${sel.risk} risk`} style={RISK_STYLE[sel.risk]}/>
                  <Badge label={sel.status} style={STATUS_STYLE[sel.status]}/>
                  {sel.is_foreign_national&&<Badge label="🌍 Foreign" style={{bg:"#E6F1FB",text:"#042C53",border:"#85B7EB"}}/>}
                  {sel.is_deportee&&<Badge label={`✈️ Dep. ${sel.deported_from||""}`} style={{bg:"#FAEEDA",text:"#412402",border:"#FAC775"}}/>}
                  {sel.gang_affiliation&&<Badge label={`⚠️ ${sel.gang_affiliation}`} style={{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0"}}/>}
                </div>
              </div>

              <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
                <button style={tabStyle(dpTab==="details")} onClick={()=>setDpTab("details")}>Details</button>
                <button style={tabStyle(dpTab==="intl")} onClick={()=>setDpTab("intl")}>🌍 Intl</button>
                <button style={tabStyle(dpTab==="associates")} onClick={()=>setDpTab("associates")}>🔗 Links</button>
              </div>

              <div style={{flex:1,overflowY:"auto"}}>
                {dpTab==="details"&&(
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                      {sel.thumb_url?<img src={sel.thumb_url} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover",border:`1px solid ${C.border2}`}}/>:<div style={{width:40,height:40,borderRadius:6,background:C.surface,border:`1px dashed ${C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.text3}}>🖐</div>}
                      <div style={{fontSize:11,lineHeight:1.6}}>
                        <div style={{color:sel.thumb_url?C.accent:C.text3,fontWeight:600}}>{sel.thumb_url?"✓ Fingerprint on file":"No fingerprint"}</div>
                        <div style={{color:C.text3}}>{sel.photo_url?"✓ Photo on file":"No photo"}</div>
                      </div>
                    </div>
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
                      <DPRow label="Convictions" value={sel.convictions}/>
                      {sel.gang_affiliation&&<>
                        <div style={{fontSize:10,fontWeight:700,color:"#7A1A1A",letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>⚠️ Gang Affiliation</div>
                        <DPRow label="Gang / Club" value={sel.gang_affiliation}/>
                        <DPRow label="Rank" value={sel.gang_rank}/>
                      </>}
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

                {dpTab==="intl"&&(
                  <div style={{padding:"12px 14px"}}>
                    {!sel.is_foreign_national && !sel.is_deportee && (
                      <div style={{fontSize:12,color:C.text3,fontStyle:"italic",textAlign:"center",padding:"24px 0"}}>No international profile data for this record.</div>
                    )}
                    {sel.is_foreign_national&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#042C53",letterSpacing:"0.08em",textTransform:"uppercase",padding:"6px 10px",background:"#E6F1FB",borderRadius:6,marginBottom:8}}>🌍 Foreign National</div>
                        <DPRow label="Country of Origin" value={sel.country_of_origin}/>
                        <DPRow label="Passport No." value={sel.passport_number}/>
                        <DPRow label="Visa Status" value={sel.visa_status}/>
                        <DPRow label="Entry Method" value={sel.entry_method}/>
                        {sel.known_routes&&<>
                          <div style={{fontSize:10,fontWeight:700,color:C.text3,marginTop:10,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Known Routes</div>
                          <div style={{fontSize:11,color:C.text2,lineHeight:1.6,background:C.surface2,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.border}`,marginBottom:8}}>{sel.known_routes}</div>
                        </>}
                        {sel.international_links&&<>
                          <div style={{fontSize:10,fontWeight:700,color:C.text3,marginTop:6,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>International Links</div>
                          <div style={{fontSize:11,color:C.text2,lineHeight:1.6,background:C.surface2,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.border}`}}>{sel.international_links}</div>
                        </>}
                      </div>
                    )}
                    {sel.is_deportee&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#412402",letterSpacing:"0.08em",textTransform:"uppercase",padding:"6px 10px",background:"#FAEEDA",borderRadius:6,marginBottom:8}}>✈️ Deportee</div>
                        <DPRow label="Deported From" value={sel.deported_from}/>
                        <DPRow label="Deportation Year" value={sel.deportation_year}/>
                      </div>
                    )}
                  </div>
                )}

                {dpTab==="associates"&&(
                  <div style={{padding:"12px 14px"}}>
                    <AssociatesPanel profileId={sel.id} onNavigate={navigateToProfile} canEdit={!!user}/>
                  </div>
                )}
              </div>

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
      <div style={{display:"flex",alignItems:"center",padding:"7px 20px",borderTop:`2px solid ${C.border}`,background:C.nav,gap:14,flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"0.04em"}}>{filtered.length} profiles · {wanted} wanted · {severe} severe risk · {foreignCount} foreign nationals · {deporteeCount} deportees</span>
        {selected.size>0&&<span style={{fontSize:10,color:"#60A5FA",fontWeight:600,letterSpacing:"0.04em"}}>{selected.size} selected</span>}
        <div style={{flex:1}}/>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:"0.06em",textTransform:"uppercase"}}>NCIC · National Criminal Intelligence Centre · FY2026 · CONFIDENTIAL</span>
      </div>
    </div>
  );
}
