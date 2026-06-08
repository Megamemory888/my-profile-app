import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const OFFENCES = ["Aggravated Assault","Armed Robbery","Bribery","Burglary","Counterfeit Operations","Cybercrime","Domestic Violence","Drug Trafficking","Extortion","Fraud","Human Trafficking","Identity Fraud","Illegal Firearm Possession","Insurance Fraud","Kidnapping","Money Laundering","Organized Crime Activity","Smuggling","Tax Evasion","Vehicle Theft"];
const OCCUPATIONS = ["Accountant","Business Owner","Construction Worker","Dock Worker","Farmer","Fisherman","Hotel Staff","IT Technician","Mechanic","Nightclub Operator","Retail Manager","Security Guard","Taxi Driver","Warehouse Supervisor"];
const LOCATIONS = ["Ba","Labasa","Lautoka","Levuka","Nadi","Nausori","Rakiraki","Savusavu","Sigatoka","Suva"];
const BEH = ["Financially motivated offender","Frequent cross-border travel","History of violent escalation","Known to operate in groups","Maintains low public profile","Repeat offender with regional links","Suspected gang affiliations","Technically skilled offender"];
const PSY = ["Avoids direct confrontation when possible","Calculated and methodical","Displays anti-social behaviour patterns","High adaptability","Impulsive under pressure","Manipulative tendencies observed"];
const RELATIONSHIP_TYPES = ["Known Associate","Gang Member","Family Member","Business Partner","Supplier","Distributor","Co-offender","Suspected Link","Informant","Other"];

const VISA_TYPES = ["Tourist Visa","Work Visa","Student Visa","Business Visa","Transit Visa","Diplomatic Visa","No Visa / Illegal Entry","Overstayed Visa","Unknown"];
const PORTS_OF_ENTRY = ["Nadi International Airport","Suva Port","Lautoka Port","Savusavu Port","Levuka Port","Land Border","Illegal / Undetected Entry","Unknown"];
const IMMIGRATION_STATUSES = ["Legal — Valid Visa","Overstayed Visa","Illegal Entry","Awaiting Deportation","Deported","Released on Bail","Unknown"];
const COUNTRIES = ["Australia","China","New Zealand","United States","United Kingdom","India","Solomon Islands","Vanuatu","Tonga","Samoa","Papua New Guinea","Philippines","Indonesia","Malaysia","Thailand","Mexico","Colombia","Brazil","Russia","Japan","South Korea","Hong Kong","Taiwan","Fiji (Returnee)","Other — See Notes"];

const GANG_AFFILIATIONS = [
  "No Gang Affiliation","Unknown Affiliation",
  "— LOCAL FIJI GANGS —",
  "Fiji Rebels MC — Suva Chapter","Fiji Rebels MC — Nadi Chapter","Ronin Brotherhood MC","Eight Demons MC","Independent Local Network",
  "— AUSTRALIAN OMCGs —",
  "Hells Angels MC","Bandidos MC","Comancheros MC","Coffin Cheaters MC","Gypsy Jokers MC","Outlaws MC","Red Devils MC",
  "— NEW ZEALAND GANGS —",
  "Mongrel Mob","Black Power NZ","Head Hunters MC","Killer Beez",
  "— ASIAN ORGANISED CRIME —",
  "14K Triad","Yakuza","Sun Yee On Triad","Wo Shing Wo Triad","Asian Syndicate — Unspecified",
  "— LATIN AMERICAN CARTELS —",
  "Sinaloa Cartel","Other Latin American Syndicate",
  "— PACIFIC NETWORKS —",
  "PNG Raskol Gang Network","Tongan Criminal Network","Solomon Islands Network","Pacific Islander Network — Unspecified",
];
const GANG_ROLES = ["Unknown Role","Leader / Boss","Lieutenant / Second in Command","Enforcer","Drug Courier","Money Launderer","Recruiter","Lookout / Spotter","Weapons Handler","Accountant / Financier","Street Dealer","Associate / Prospect"];
const VESSEL_ROLES = ["Not Applicable","Captain / Skipper","Vessel Crew Member","Navigator","Engineer / Mechanic","Loader / Unloader","Security / Armed Guard","Transport Coordinator","Shore Contact","Boat Owner","Financier of Vessel"];
const ADDITIONAL_CHARGES = ["None","Unlawful Importation of Narcotics","Unlawful Possession of Narcotics","Unlawful Entry into Fiji","Overstaying Visa","Use of False Documents","Money Laundering","Conspiracy to Traffic Drugs","Possession of Firearm Without Licence","Unlawful Possession of Ammunition","Assault on Police Officer","Resisting Arrest","Obstruction of Justice","Bribery of a Public Official","Theft / Robbery","Receiving Stolen Property","Multiple Charges — See Notes"];
const FIREARM_TYPES = ["No Firearms","Unknown","Pistol / Handgun","Semi-Automatic Rifle","Automatic Rifle / Machine Gun","Shotgun","Sniper Rifle","Improvised Firearm","Multiple Firearms — See Notes"];

const OFFENCE_COLOR = {
  "Aggravated Assault":{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0",dot:"#E24B4A"},
  "Armed Robbery":{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0",dot:"#E24B4A"},
  "Domestic Violence":{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0",dot:"#E24B4A"},
  "Kidnapping":{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0",dot:"#E24B4A"},
  "Human Trafficking":{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0",dot:"#E24B4A"},
  "Illegal Firearm Possession":{bg:"#FAECE7",text:"#4A1B0C",border:"#F0997B",dot:"#D85A30"},
  "Drug Trafficking":{bg:"#FAECE7",text:"#4A1B0C",border:"#F0997B",dot:"#D85A30"},
  "Organized Crime Activity":{bg:"#FAECE7",text:"#4A1B0C",border:"#F0997B",dot:"#D85A30"},
  "Smuggling":{bg:"#FAECE7",text:"#4A1B0C",border:"#F0997B",dot:"#D85A30"},
  "Fraud":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Bribery":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Cybercrime":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Counterfeit Operations":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Identity Fraud":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Insurance Fraud":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Money Laundering":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Tax Evasion":{bg:"#FAEEDA",text:"#412402",border:"#FAC775",dot:"#BA7517"},
  "Extortion":{bg:"#EEEDFE",text:"#26215C",border:"#AFA9EC",dot:"#534AB7"},
  "Burglary":{bg:"#E6F1FB",text:"#042C53",border:"#85B7EB",dot:"#185FA5"},
  "Vehicle Theft":{bg:"#E6F1FB",text:"#042C53",border:"#85B7EB",dot:"#185FA5"},
};
const RISK_STYLE = {
  Low:{bg:"#EAF3DE",text:"#27500A",border:"#97C459",dot:"#639922"},
  Moderate:{bg:"#FAEEDA",text:"#633806",border:"#EF9F27",dot:"#BA7517"},
  High:{bg:"#FAECE7",text:"#4A1B0C",border:"#F0997B",dot:"#D85A30"},
  Severe:{bg:"#FDEAEA",text:"#501313",border:"#F09595",dot:"#E24B4A"},
};
const STATUS_STYLE = {
  "Wanted":{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0"},
  "In Custody":{bg:"#E6F1FB",text:"#042C53",border:"#85B7EB"},
  "Released on Parole":{bg:"#FAEEDA",text:"#412402",border:"#FAC775"},
  "Sentence Completed":{bg:"#EAF3DE",text:"#173404",border:"#97C459"},
  "Under Investigation":{bg:"#EEEDFE",text:"#26215C",border:"#AFA9EC"},
};

const C = {
  bg:"#F4F5F7",surface:"#FFFFFF",surface2:"#F0F2F5",
  nav:"#1C2B4A",navText:"#FFFFFF",navMuted:"rgba(255,255,255,0.55)",
  border:"#DDE1E9",border2:"#C8CDD8",
  text:"#1A1D23",text2:"#4A5568",text3:"#7B8794",
  accent:"#1A56DB",accentL:"#EBF2FF",
  foreign:"#2D1B69",foreignBg:"#EDE9FF",foreignBorder:"#C4B5FD",
};

const inp = {padding:"7px 10px",fontSize:12,borderRadius:6,border:`1px solid ${C.border2}`,background:C.surface,color:C.text,fontFamily:"inherit",width:"100%",boxSizing:"border-box"};
const btnSm = {display:"inline-flex",alignItems:"center",gap:5,padding:"6px 14px",fontSize:12,fontWeight:500,borderRadius:6,border:`1px solid ${C.border2}`,background:C.surface,color:C.text2,cursor:"pointer",whiteSpace:"nowrap"};
const btnBlue = {...btnSm,background:C.accent,color:"#fff",border:`1px solid ${C.accent}`,fontWeight:600};
const btnRed = {...btnSm,color:"#7A1A1A",border:"1px solid #F0A0A0",background:"#FDEAEA"};
const btnGreen = {...btnSm,background:"#1E7E34",color:"#fff",border:"1px solid #1E7E34",fontWeight:600};
const btnPurple = {...btnSm,background:"#2D1B69",color:"#fff",border:"1px solid #2D1B69",fontWeight:600};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Badge({label,style:s={}}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:500,background:s.bg||"#eee",color:s.text||"#333",border:`1px solid ${s.border||"#ccc"}`,whiteSpace:"nowrap"}}>
    {s.dot&&<span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>}{label}
  </span>;
}

function Avatar({r,size=40}) {
  const ini = r.name?.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
  const rs = RISK_STYLE[r.risk]||{};
  const isForeign = r.nationality_type==="Foreign National";
  if (r.photo_url) return <div style={{position:"relative",flexShrink:0}}>
    <img src={r.photo_url} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${isForeign?C.foreignBorder:rs.border||C.border}`}}/>
    {isForeign&&<span style={{position:"absolute",bottom:-2,right:-2,fontSize:10,background:C.foreignBg,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.foreignBorder}`}}>🌍</span>}
  </div>;
  return <div style={{position:"relative",flexShrink:0}}>
    <div style={{width:size,height:size,borderRadius:"50%",background:isForeign?C.foreignBg:rs.bg||C.accentL,color:isForeign?C.foreign:rs.text||C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.3),fontWeight:600,border:`2px solid ${isForeign?C.foreignBorder:rs.border||C.border}`,letterSpacing:"0.05em"}}>{ini}</div>
    {isForeign&&<span style={{position:"absolute",bottom:-2,right:-2,fontSize:10,background:C.foreignBg,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.foreignBorder}`}}>🌍</span>}
  </div>;
}

function ThumbCanvas({value,onChange}) {
  const ref=useRef(); const draw=useRef(false); const last=useRef([0,0]);
  useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext("2d");ctx.fillStyle="#F8F9FA";ctx.fillRect(0,0,c.width,c.height);if(value){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,c.width,c.height);img.src=value;}},[]);
  const pos=(e)=>{const r=ref.current.getBoundingClientRect(),sx=ref.current.width/r.width,sy=ref.current.height/r.height,src=e.touches?e.touches[0]:e;return[(src.clientX-r.left)*sx,(src.clientY-r.top)*sy];};
  const start=(e)=>{draw.current=true;last.current=pos(e);};
  const move=(e)=>{if(!draw.current)return;e.preventDefault?.();const c=ref.current,ctx=c.getContext("2d"),[x,y]=pos(e);ctx.strokeStyle="#1A56DB";ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(...last.current);ctx.lineTo(x,y);ctx.stroke();last.current=[x,y];onChange(c.toDataURL());};
  const stop=()=>{draw.current=false;};
  const clear=()=>{const c=ref.current,ctx=c.getContext("2d");ctx.fillStyle="#F8F9FA";ctx.fillRect(0,0,c.width,c.height);onChange(null);};
  return <div>
    <canvas ref={ref} width={200} height={120} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop} style={{display:"block",width:"100%",borderRadius:6,cursor:"crosshair",border:`1px solid ${C.border2}`,background:"#F8F9FA"}}/>
    <div style={{display:"flex",gap:6,marginTop:6}}>
      <button onClick={clear} style={btnSm}>Clear</button>
      <label style={{...btnSm,cursor:"pointer"}}>Upload<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=ev=>{const c=ref.current,ctx=c.getContext("2d"),img=new Image();img.onload=()=>{ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);onChange(c.toDataURL());};img.src=ev.target.result;};fr.readAsDataURL(f);}}/></label>
    </div>
  </div>;
}

async function uploadFile(dataUrl,folder,id) {
  if(!dataUrl)return null;
  const res=await fetch(dataUrl);const blob=await res.blob();
  const ext=blob.type.includes("png")?"png":"jpg";const path=`${folder}/${id}.${ext}`;
  const{error}=await supabase.storage.from("biometrics").upload(path,blob,{upsert:true});
  if(error){console.error("Upload error:",error);return null;}
  return supabase.storage.from("biometrics").getPublicUrl(path).data.publicUrl;
}

// ─── PRINT ───────────────────────────────────────────────────────────────────
function printProfiles(profiles) {
  const now = new Date().toLocaleString("en-FJ",{dateStyle:"long",timeStyle:"short"});
  const rows = profiles.map(r=>{
    const rs=RISK_STYLE[r.risk]||{};const ss=STATUS_STYLE[r.status]||{};const oc=OFFENCE_COLOR[r.primary_offence]||{};
    const isForeign=r.nationality_type==="Foreign National";
    return `<div class="profile-card">
      <div class="card-header" style="background:${isForeign?"#2D1B69":"#1C2B4A"}">
        <div class="header-left">
          ${r.photo_url?`<img src="${r.photo_url}" class="photo" alt="">`:`<div class="initials">${r.name?.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase()}</div>`}
          <div class="header-info">
            <div class="profile-id">${r.id} ${isForeign?'🌍 FOREIGN NATIONAL':''}</div>
            <div class="profile-name">${r.name}</div>
            <div class="profile-sub">${r.alias||"—"} · ${r.occupation||"—"} · ${r.nationality||"Fijian"}</div>
          </div>
        </div>
        <div class="header-badges">
          <span class="badge" style="background:${rs.bg};color:${rs.text};border:1px solid ${rs.border}">${r.risk} Risk</span>
          <span class="badge" style="background:${ss.bg};color:${ss.text};border:1px solid ${ss.border}">${r.status}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="section"><div class="section-title">Personal Details</div><div class="grid2">
          <div class="field"><span class="label">Date of birth</span><span class="value">${r.dob||"—"}</span></div>
          <div class="field"><span class="label">Gender</span><span class="value">${r.gender||"—"}</span></div>
          <div class="field"><span class="label">Nationality</span><span class="value">${r.nationality||"Fijian"}</span></div>
          <div class="field"><span class="label">Location</span><span class="value">${r.location||"—"}</span></div>
          ${r.phone_number?`<div class="field"><span class="label">Phone</span><span class="value">${r.phone_number}</span></div>`:""}
          ${r.vehicle_registration?`<div class="field"><span class="label">Vehicle</span><span class="value">${r.vehicle_registration}</span></div>`:""}
          ${r.home_address?`<div class="field full"><span class="label">Address</span><span class="value">${r.home_address}</span></div>`:""}
          ${r.family_members?`<div class="field full"><span class="label">Family</span><span class="value">${r.family_members}</span></div>`:""}
          ${r.medical_conditions?`<div class="field full"><span class="label">Medical</span><span class="value">${r.medical_conditions}</span></div>`:""}
        </div></div>
        ${isForeign?`<div class="section" style="border-color:#C4B5FD"><div class="section-title" style="background:#EDE9FF;color:#2D1B69">🌍 Foreign National Details</div><div class="grid2">
          <div class="field"><span class="label">Country of origin</span><span class="value">${r.country_of_origin||"—"}</span></div>
          <div class="field"><span class="label">Passport number</span><span class="value">${r.passport_number||"—"}</span></div>
          <div class="field"><span class="label">Visa type</span><span class="value">${r.visa_type||"—"}</span></div>
          <div class="field"><span class="label">Visa expiry</span><span class="value">${r.visa_expiry_date||"—"}</span></div>
          <div class="field"><span class="label">Port of entry</span><span class="value">${r.port_of_entry||"—"}</span></div>
          <div class="field"><span class="label">Date of entry</span><span class="value">${r.date_of_entry||"—"}</span></div>
          <div class="field"><span class="label">Immigration status</span><span class="value">${r.immigration_status||"—"}</span></div>
          <div class="field"><span class="label">Interpol flag</span><span class="value">${r.interpol_flag||"—"}</span></div>
          <div class="field"><span class="label">Deportation status</span><span class="value">${r.deportation_status||"—"}</span></div>
          ${r.home_country_contact?`<div class="field full"><span class="label">Home country contact</span><span class="value">${r.home_country_contact}</span></div>`:""}
          ${r.local_address_fiji?`<div class="field full"><span class="label">Local address in Fiji</span><span class="value">${r.local_address_fiji}</span></div>`:""}
        </div></div>`:""}
        <div class="section"><div class="section-title">Criminal Record</div>
          <div class="offence-block" style="background:${oc.bg||"#f5f5f5"};border:1px solid ${oc.border||"#ddd"}">
            <div style="color:${oc.dot||"#333"};font-size:11px;font-weight:700;text-transform:uppercase">Primary offence</div>
            <div style="color:${oc.text||"#333"};font-size:14px;font-weight:700;margin-top:2px">${r.primary_offence||"—"}</div>
            ${r.secondary_offence?`<div style="font-size:11px;margin-top:3px;color:${oc.text||"#666"}">Secondary: ${r.secondary_offence}</div>`:""}
          </div>
          <div class="grid2" style="margin-top:8px">
            <div class="field"><span class="label">Arrest year</span><span class="value">${r.arrest_year||"—"}</span></div>
            <div class="field"><span class="label">Sentence</span><span class="value">${r.sentence?r.sentence+" years":"—"}</span></div>
            ${r.release_date?`<div class="field"><span class="label">Release date</span><span class="value">${r.release_date}</span></div>`:""}
            <div class="field"><span class="label">Convictions</span><span class="value">${r.convictions??0}</span></div>
            ${r.additional_charges&&r.additional_charges!=="None"?`<div class="field full"><span class="label">Additional charges</span><span class="value">${r.additional_charges}</span></div>`:""}
          </div>
        </div>
        ${(r.gang_affiliation&&r.gang_affiliation!=="No Gang Affiliation")||r.gang_role||r.vessel_role?`
        <div class="section"><div class="section-title">Gang & Organisation</div><div class="grid2">
          ${r.gang_affiliation&&r.gang_affiliation!=="No Gang Affiliation"?`<div class="field full"><span class="label">Gang affiliation</span><span class="value">${r.gang_affiliation}</span></div>`:""}
          ${r.gang_role?`<div class="field"><span class="label">Role in gang</span><span class="value">${r.gang_role}</span></div>`:""}
          ${r.vessel_role&&r.vessel_role!=="Not Applicable"?`<div class="field"><span class="label">Vessel role</span><span class="value">${r.vessel_role}</span></div>`:""}
        </div></div>`:""}
        ${r.firearms_type&&r.firearms_type!=="No Firearms"?`
        <div class="section"><div class="section-title">🔫 Firearms</div><div class="grid2">
          <div class="field"><span class="label">Firearm type</span><span class="value">${r.firearms_type}</span></div>
          ${r.firearms_details?`<div class="field full"><span class="label">Details</span><span class="value">${r.firearms_details}</span></div>`:""}
        </div></div>`:""}
        ${r.case_notes?`<div class="section"><div class="section-title">Case Notes</div><div class="case-notes">${r.case_notes}</div></div>`:""}
        ${r.associates_list&&r.associates_list.length>0?`<div class="section"><div class="section-title">Known Associates (${r.associates_list.length})</div><div class="grid2" style="padding:10px 14px">${r.associates_list.map(a=>`<div class="field"><span class="label">${a.relationship_type}</span><span class="value">${a.name} (${a.id})</span></div>`).join("")}</div></div>`:""}
      </div>
      <div class="card-footer"><span>CONFIDENTIAL — Fiji Central Criminal Intelligence</span><span>Printed: ${now}</span></div>
    </div>`;
  }).join("");

  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FCCI Report</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#f0f2f5;color:#1a1d23;font-size:13px}
  .cover{background:#1C2B4A;color:white;padding:40px 48px;margin-bottom:24px}
  .cover-title{font-size:24px;font-weight:700}.cover-sub{font-size:13px;opacity:0.7;margin-top:4px}
  .cover-meta{margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2);display:flex;gap:40px}
  .cover-meta-item{font-size:12px}.cover-meta-item b{display:block;font-size:20px;font-weight:700;margin-bottom:2px}
  .profile-card{background:white;margin:0 24px 24px;border-radius:10px;overflow:hidden;border:1px solid #dde1e9;page-break-after:always}
  .card-header{padding:18px 20px;display:flex;justify-content:space-between;align-items:flex-start}
  .header-left{display:flex;gap:14px;align-items:center}.photo{width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3)}
  .initials{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
  .profile-id{font-size:10px;color:rgba(255,255,255,0.6);font-family:monospace}.profile-name{font-size:18px;font-weight:700;color:white}.profile-sub{font-size:12px;color:rgba(255,255,255,0.65);margin-top:3px}
  .header-badges{display:flex;flex-direction:column;gap:5px;align-items:flex-end}.badge{padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600}
  .card-body{padding:20px;display:flex;flex-direction:column;gap:16px}
  .section{border:1px solid #e8eaee;border-radius:8px;overflow:hidden}
  .section-title{background:#f4f5f7;padding:7px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#7b8794;border-bottom:1px solid #e8eaee}
  .grid2{display:grid;grid-template-columns:1fr 1fr;padding:10px 14px;gap:6px}
  .field{display:flex;flex-direction:column;gap:2px}.field.full{grid-column:1/-1}
  .label{font-size:10px;color:#7b8794;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}.value{font-size:13px;color:#1a1d23;font-weight:500}
  .offence-block{margin:12px 14px 0;padding:10px 14px;border-radius:6px}
  .case-notes{padding:12px 14px;font-size:12px;color:#4a5568;line-height:1.7;white-space:pre-wrap;background:#fafbfc}
  .card-footer{background:#f4f5f7;padding:8px 20px;display:flex;justify-content:space-between;font-size:10px;color:#7b8794;border-top:1px solid #dde1e9}
  @media print{body{background:white}.profile-card{margin:0;border-radius:0;box-shadow:none}.no-print{display:none!important}}</style></head>
  <body>
  <div class="cover"><div style="font-size:32px;margin-bottom:12px">🛡️</div><div class="cover-title">Criminal Intelligence Report</div><div class="cover-sub">Fiji Central Criminal Intelligence — CONFIDENTIAL</div>
  <div class="cover-meta"><div class="cover-meta-item"><b>${profiles.length}</b>Profile${profiles.length!==1?"s":""}</div><div class="cover-meta-item"><b>${now}</b>Printed</div><div class="cover-meta-item"><b>${profiles.filter(p=>p.nationality_type==="Foreign National").length}</b>Foreign nationals</div><div class="cover-meta-item"><b>${profiles.filter(p=>p.status==="Wanted").length}</b>Wanted</div></div></div>
  <div style="text-align:right;padding:0 24px 12px" class="no-print">
    <button onclick="window.print()" style="background:#1C2B4A;color:white;border:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-right:8px">🖨️ Print / Save PDF</button>
    <button onclick="window.close()" style="background:#f0f2f5;color:#4a5568;border:1px solid #dde1e9;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer">Close</button>
  </div>${rows}</body></html>`;

  const win=window.open("","_blank","width=900,height=800");
  win.document.write(html);win.document.close();
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage({onLogin}) {
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  const login=async()=>{
    if(!email||!password){setError("Please enter email and password");return;}
    setLoading(true);setError("");
    const{error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err){setError("Incorrect email or password");setLoading(false);return;}
    onLogin();setLoading(false);
  };
  const features=[
    {icon:"🗂️",title:"Criminal Profiles",desc:"Centralised database of persons of interest, suspects and known offenders across Fiji."},
    {icon:"🌏",title:"Foreign Nationals",desc:"Track foreign nationals, immigration status, visa overstays and deportation records."},
    {icon:"🔗",title:"Associate Networks",desc:"Map relationships between individuals, gang affiliations and organised crime networks."},
    {icon:"📊",title:"Intelligence Reports",desc:"Risk assessments, behavioural analysis and operational intelligence in one place."},
  ];
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      {/* Top classification banner */}
      <div style={{background:"#B91C1C",color:"#fff",textAlign:"center",padding:"7px",fontSize:11,fontWeight:700,letterSpacing:"0.15em",flexShrink:0}}>
        RESTRICTED — AUTHORISED PERSONNEL ONLY — NCIC CLASSIFIED SYSTEM
      </div>
      <div style={{flex:1,display:"flex"}}>
        {/* LEFT PANEL — branding + info */}
        <div style={{flex:"0 0 55%",background:"#0F2044",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"52px 56px",position:"relative",overflow:"hidden"}}>
          {/* Grid pattern */}
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(255,255,255,0.025) 0,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 48px)",pointerEvents:"none"}}/>
          {/* Glow */}
          <div style={{position:"absolute",top:-120,left:-120,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(26,86,219,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{position:"relative",zIndex:1}}>
            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:52}}>
              <div style={{width:56,height:56,borderRadius:14,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🛡️</div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"0.01em",lineHeight:1.2}}>NCIC Intelligence System</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:3}}>National Criminal Intelligence Centre</div>
              </div>
            </div>
            {/* Headline */}
            <div style={{fontSize:32,fontWeight:700,color:"#fff",lineHeight:1.25,marginBottom:16,maxWidth:440}}>
              Fiji's Central Criminal Intelligence Platform
            </div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.55)",lineHeight:1.7,maxWidth:420,marginBottom:48}}>
              A secure, role-based intelligence management system for authorised law enforcement personnel of the National Criminal Intelligence Centre.
            </div>
            {/* Features */}
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {features.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <div style={{width:36,height:36,borderRadius:9,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{f.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.9)",marginBottom:3}}>{f.title}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Footer */}
          <div style={{position:"relative",zIndex:1,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>© 2025 NCIC · Fiji Police Force</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",letterSpacing:"0.05em"}}>SYSTEM VERSION 2.4</div>
          </div>
        </div>

        {/* RIGHT PANEL — login form */}
        <div style={{flex:1,background:"#F4F5F7",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 32px"}}>
          <div style={{width:"100%",maxWidth:380}}>
            <div style={{marginBottom:36}}>
              <div style={{fontSize:22,fontWeight:700,color:"#1A1D23",marginBottom:8}}>Secure Sign In</div>
              <div style={{fontSize:13,color:"#7B8794"}}>Enter your credentials to access the system.</div>
            </div>
            {error&&<div style={{background:"#FDEAEA",border:"1px solid #F0A0A0",color:"#7A1A1A",padding:"10px 14px",borderRadius:7,fontSize:12,marginBottom:20}}>{error}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:"#4A5568",textTransform:"uppercase",letterSpacing:"0.07em"}}>Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="you@ncic.gov.fj" style={{padding:"11px 13px",fontSize:13,borderRadius:7,border:"1px solid #DDE1E9",background:"#fff",color:"#1A1D23",fontFamily:"inherit",width:"100%",boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:"#4A5568",textTransform:"uppercase",letterSpacing:"0.07em"}}>Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••" style={{padding:"11px 13px",fontSize:13,borderRadius:7,border:"1px solid #DDE1E9",background:"#fff",color:"#1A1D23",fontFamily:"inherit",width:"100%",boxSizing:"border-box",outline:"none"}}/>
              </div>
              <button onClick={login} disabled={loading} style={{background:"#1C2B4A",color:"#fff",border:"none",borderRadius:7,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:"0.05em",marginTop:4,opacity:loading?0.7:1}}>
                {loading?"AUTHENTICATING...":"SIGN IN"}
              </button>
            </div>
            <div style={{marginTop:28,padding:"16px",background:"#FFF8E6",border:"1px solid #FDE68A",borderRadius:7}}>
              <div style={{fontSize:11,fontWeight:700,color:"#92400E",letterSpacing:"0.06em",marginBottom:4}}>⚠ AUTHORISED ACCESS ONLY</div>
              <div style={{fontSize:11,color:"#92400E",lineHeight:1.5}}>This system contains classified law enforcement data. Unauthorised access is a criminal offence under the Fiji Crimes Act 2009.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({children,icon,color}) {
  return <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,color:color||C.text3,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
    {icon&&<span style={{fontSize:13}}>{icon}</span>}{children}
  </div>;
}

// ─── ASSOCIATES PANEL ────────────────────────────────────────────────────────
function AssociatesPanel({profileId,onNavigate,canEdit}) {
  const [associates,setAssociates]=useState([]);const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);const [searchQ,setSearchQ]=useState("");
  const [searchResults,setSearchResults]=useState([]);const [searching,setSearching]=useState(false);
  const [relType,setRelType]=useState("Known Associate");

  const loadAssociates=useCallback(async()=>{
    setLoading(true);
    const[{data:d1},{data:d2}]=await Promise.all([
      supabase.from("profile_associates").select("id,relationship_type,associate_id,criminal_profiles!profile_associates_associate_id_fkey(id,name,risk,status,primary_offence,photo_url,nationality_type)").eq("profile_id",profileId),
      supabase.from("profile_associates").select("id,relationship_type,profile_id,criminal_profiles!profile_associates_profile_id_fkey(id,name,risk,status,primary_offence,photo_url,nationality_type)").eq("associate_id",profileId),
    ]);
    const combined=[...(d1||[]).map(x=>({linkId:x.id,relType:x.relationship_type,profile:x.criminal_profiles})),...(d2||[]).map(x=>({linkId:x.id,relType:x.relationship_type,profile:x.criminal_profiles}))].filter(x=>x.profile);
    setAssociates(combined);setLoading(false);
  },[profileId]);

  useEffect(()=>{loadAssociates();},[loadAssociates]);

  const handleSearch=async(q)=>{
    setSearchQ(q);if(q.length<2){setSearchResults([]);return;}setSearching(true);
    const{data}=await supabase.from("criminal_profiles").select("id,name,risk,status,primary_offence,photo_url,nationality_type").neq("id",profileId).or(`name.ilike.%${q}%,id.ilike.%${q}%,alias.ilike.%${q}%`).limit(8);
    setSearchResults(data||[]);setSearching(false);
  };

  const linkAssociate=async(associateProfile)=>{
    if(associates.find(a=>a.profile?.id===associateProfile.id)){alert("Already linked.");return;}
    const{error}=await supabase.from("profile_associates").insert([{profile_id:profileId,associate_id:associateProfile.id,relationship_type:relType}]);
    if(error){alert("Error: "+error.message);return;}
    setShowAdd(false);setSearchQ("");setSearchResults([]);loadAssociates();
  };

  const removeAssociate=async(linkId)=>{
    if(!confirm("Remove this associate link?"))return;
    await supabase.from("profile_associates").delete().eq("id",linkId);loadAssociates();
  };

  return <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.1em",textTransform:"uppercase"}}>
        🔗 Associates {associates.length>0&&<span style={{background:C.accentL,color:C.accent,borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:700}}>{associates.length}</span>}
      </div>
      {canEdit&&<button onClick={()=>setShowAdd(s=>!s)} style={{...btnBlue,padding:"3px 10px",fontSize:11}}>{showAdd?"Cancel":"+ Link"}</button>}
    </div>
    {showAdd&&<div style={{background:C.accentL,border:`1px solid #85B7EB`,borderRadius:8,padding:"10px",marginBottom:10}}>
      <div style={{fontSize:11,fontWeight:600,color:C.accent,marginBottom:6}}>Search for a profile to link:</div>
      <input type="text" value={searchQ} onChange={e=>handleSearch(e.target.value)} placeholder="Type name, alias or ID..." style={{...inp,marginBottom:6}} autoFocus/>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        <label style={{fontSize:11,color:C.text2,flexShrink:0}}>Relationship:</label>
        <select value={relType} onChange={e=>setRelType(e.target.value)} style={{...inp,flex:1}}>{RELATIONSHIP_TYPES.map(r=><option key={r}>{r}</option>)}</select>
      </div>
      {searching&&<div style={{fontSize:11,color:C.text3}}>Searching...</div>}
      {searchResults.length>0&&<div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflowY:"auto"}}>
        {searchResults.map(r=><div key={r.id} onClick={()=>linkAssociate(r)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:C.surface,borderRadius:6,cursor:"pointer",border:`1px solid ${C.border}`}}>
          <Avatar r={r} size={28}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div><div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>{r.id}</div></div>
          <Badge label={r.risk} style={RISK_STYLE[r.risk]}/><span style={{fontSize:11,color:C.accent,fontWeight:600}}>+ Link</span>
        </div>)}
      </div>}
      {searchQ.length>=2&&!searching&&searchResults.length===0&&<div style={{fontSize:11,color:C.text3}}>No profiles found matching "{searchQ}"</div>}
    </div>}
    {loading?<div style={{fontSize:11,color:C.text3}}>Loading...</div>
    :associates.length===0?<div style={{fontSize:11,color:C.text3,fontStyle:"italic"}}>No associates linked yet.{canEdit&&" Click + Link to add."}</div>
    :<div style={{display:"flex",flexDirection:"column",gap:6}}>
      {associates.map(({linkId,relType,profile:r})=><div key={linkId} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",background:C.surface2,borderRadius:8,border:`1px solid ${C.border}`,position:"relative"}}>
        <div style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}} onClick={()=>onNavigate(r.id)}>
          <Avatar r={r} size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:C.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:"underline"}}>{r.name}</div>
            <div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>{r.id}</div>
            <div style={{fontSize:10,color:C.text2}}>{relType}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
          <Badge label={r.risk} style={RISK_STYLE[r.risk]}/>
          {r.nationality_type==="Foreign National"&&<span style={{fontSize:9,background:C.foreignBg,color:C.foreign,borderRadius:99,padding:"1px 6px",border:`1px solid ${C.foreignBorder}`}}>🌍 Foreign</span>}
        </div>
        {canEdit&&<button onClick={()=>removeAssociate(linkId)} style={{position:"absolute",top:4,right:4,background:"none",border:"none",cursor:"pointer",color:C.text3,fontSize:12,padding:"1px 4px"}} title="Remove">✕</button>}
      </div>)}
    </div>}
  </div>;
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({record,onSave,onClose,allIds}) {
  const isNew=!record.id;
  const [f,setF]=useState({
    name:record.name||"",alias:record.alias||"",gender:record.gender||"Male",
    dob:record.dob||"",location:record.location||"Suva",occupation:record.occupation||"Taxi Driver",
    primary_offence:record.primary_offence||"Fraud",secondary_offence:record.secondary_offence||"Bribery",
    arrest_year:record.arrest_year||2025,sentence:record.sentence||1,
    risk:record.risk||"Moderate",status:record.status||"Under Investigation",
    associates:record.associates||0,convictions:record.convictions||0,
    behaviour:record.behaviour||BEH[0],psych:record.psych||PSY[0],
    photo_url:record.photo_url||null,thumb_url:record.thumb_url||null,
    home_address:record.home_address||"",phone_number:record.phone_number||"",
    vehicle_registration:record.vehicle_registration||"",family_members:record.family_members||"",
    medical_conditions:record.medical_conditions||"",release_date:record.release_date||"",
    case_notes:record.case_notes||"",
    nationality_type:record.nationality_type||"Fijian",
    nationality:record.nationality||"Fijian",
    country_of_origin:record.country_of_origin||"",
    passport_number:record.passport_number||"",
    visa_type:record.visa_type||"Tourist Visa",
    visa_expiry_date:record.visa_expiry_date||"",
    port_of_entry:record.port_of_entry||"Nadi International Airport",
    date_of_entry:record.date_of_entry||"",
    immigration_status:record.immigration_status||"Legal — Valid Visa",
    interpol_flag:record.interpol_flag||"No",
    deportation_status:record.deportation_status||"Not Deported",
    home_country_contact:record.home_country_contact||"",
    local_address_fiji:record.local_address_fiji||"",
    gang_affiliation:record.gang_affiliation||"No Gang Affiliation",
    gang_role:record.gang_role||"Unknown Role",
    vessel_role:record.vessel_role||"Not Applicable",
    additional_charges:record.additional_charges||"None",
    firearms_type:record.firearms_type||"No Firearms",
    firearms_details:record.firearms_details||"",
    photoData:null,thumbData:null,
  });
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const isForeign=f.nationality_type==="Foreign National";

  const save=async()=>{
    if(!f.name.trim()){alert("Name is required");return;}
    setSaving(true);
    const ids=allIds.map(i=>parseInt(i.split("-")[1])||0);
    const newId=record.id||("FJ-"+(Math.max(0,...ids)+1));
    let photo_url=f.photo_url;let thumb_url=f.thumb_url;
    if(f.photoData)photo_url=await uploadFile(f.photoData,"photos",newId);
    if(f.thumbData)thumb_url=await uploadFile(f.thumbData,"thumbs",newId);
    const nd=(v)=>(!v||String(v).trim()==='')?null:v;
    const dbRecord={
      id:newId,name:f.name,alias:f.alias,gender:f.gender,dob:nd(f.dob),
      nationality:isForeign?f.country_of_origin:"Fijian",
      nationality_type:f.nationality_type,
      location:f.location,occupation:f.occupation,
      primary_offence:f.primary_offence,secondary_offence:f.secondary_offence,
      arrest_year:f.arrest_year,sentence:f.sentence,risk:f.risk,status:f.status,
      associates:f.associates,convictions:f.convictions,behaviour:f.behaviour,
      psych:f.psych,photo_url,thumb_url,
      home_address:f.home_address,phone_number:f.phone_number,
      vehicle_registration:f.vehicle_registration,family_members:f.family_members,
      medical_conditions:f.medical_conditions,release_date:nd(f.release_date),case_notes:f.case_notes,
      country_of_origin:f.country_of_origin,passport_number:f.passport_number,
      visa_type:isForeign?f.visa_type:null,visa_expiry_date:isForeign?nd(f.visa_expiry_date):null,
      port_of_entry:isForeign?f.port_of_entry:null,date_of_entry:isForeign?nd(f.date_of_entry):null,
      immigration_status:isForeign?f.immigration_status:null,
      interpol_flag:isForeign?f.interpol_flag:"No",
      deportation_status:isForeign?f.deportation_status:null,
      home_country_contact:isForeign?f.home_country_contact:null,
      local_address_fiji:isForeign?f.local_address_fiji:null,
      gang_affiliation:f.gang_affiliation,gang_role:f.gang_role,vessel_role:f.vessel_role,
      additional_charges:f.additional_charges,
      firearms_type:f.firearms_type,firearms_details:f.firearms_details,
    };
    onSave(dbRecord);setSaving(false);
  };

  const fg=(label,key,type="text",opts=null,area=false)=>(
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:11,fontWeight:600,color:C.text2,letterSpacing:"0.04em"}}>{label}</label>
      {area?<textarea value={f[key]} onChange={e=>set(key,e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
        :opts?<select value={f[key]} onChange={e=>set(key,e.target.value)} style={inp}>{opts.map(o=><option key={o} disabled={o.startsWith("—")}>{o}</option>)}</select>
        :<input type={type} value={f[key]} onChange={e=>set(key,type==="number"?Number(e.target.value):e.target.value)} style={inp}/>}
    </div>
  );

  return <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px 10px",backdropFilter:"blur(3px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.surface,borderRadius:12,width:600,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:isForeign?C.foreign:C.nav}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{isNew?"New Criminal Profile":"Edit Profile"}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:1}}>{isForeign?"🌍 Foreign National":""}{!isNew&&` · ${record.id}`}</div>
        </div>
        <button onClick={onClose} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"4px 10px"}}>✕ Close</button>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"16px 20px",display:"flex",flexDirection:"column",gap:16,background:C.bg}}>

        {/* Nationality Type Toggle */}
        <div style={{background:C.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <SectionLabel icon="🌏">Profile Type</SectionLabel>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{set("nationality_type","Fijian");set("nationality","Fijian");}} style={{...f.nationality_type==="Fijian"?btnBlue:btnSm,flex:1,justifyContent:"center"}}>🏝️ Fijian National</button>
            <button onClick={()=>set("nationality_type","Foreign National")} style={{...f.nationality_type==="Foreign National"?btnPurple:btnSm,flex:1,justifyContent:"center"}}>🌍 Foreign National</button>
          </div>
        </div>

        {/* Biometrics */}
        <div style={{background:C.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <SectionLabel icon="🔬">Biometric Data</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:C.text2,marginBottom:8}}>Profile photo</div>
              <label style={{display:"block",cursor:"pointer"}}>
                <div style={{border:`1.5px dashed ${C.border2}`,borderRadius:8,padding:12,textAlign:"center",minHeight:90,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,background:C.surface2}}>
                  {(f.photoData||f.photo_url)?<img src={f.photoData||f.photo_url} alt="" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:`2px solid ${isForeign?C.foreign:C.accent}`}}/>:<><div style={{fontSize:26}}>📷</div><div style={{fontSize:11,color:C.text3}}>Click to upload</div></>}
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

        {/* Personal */}
        <div style={{background:C.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <SectionLabel icon="👤">Personal Details</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {fg("Full Name *","name")} {fg("Alias / Nickname","alias")}
            {fg("Gender","gender","text",["Male","Female"])} {fg("Date of birth","dob","date")}
            {fg("Location","location","text",LOCATIONS)} {fg("Occupation","occupation","text",OCCUPATIONS)}
            {fg("📞 Phone","phone_number")} {fg("🚗 Vehicle","vehicle_registration")}
            <div style={{gridColumn:"1/-1"}}>{fg("🏠 Home address","home_address")}</div>
            {fg("👨‍👩‍👧 Family members","family_members")} {fg("🏥 Medical conditions","medical_conditions")}
          </div>
        </div>

        {/* Foreign National */}
        {isForeign&&<div style={{background:C.foreignBg,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.foreignBorder}`}}>
          <SectionLabel icon="🌍" color={C.foreign}>Foreign National Details</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {fg("Country of origin","country_of_origin","text",COUNTRIES)}
            {fg("Passport number","passport_number")}
            {fg("Visa type","visa_type","text",VISA_TYPES)}
            {fg("Visa expiry date","visa_expiry_date","date")}
            {fg("Port of entry","port_of_entry","text",PORTS_OF_ENTRY)}
            {fg("Date of entry to Fiji","date_of_entry","date")}
            {fg("Immigration status","immigration_status","text",IMMIGRATION_STATUSES)}
            {fg("Interpol flag","interpol_flag","text",["No","Yes — Active Red Notice","Yes — Wanted","Under Investigation"])}
            {fg("Deportation status","deportation_status","text",["Not Deported","Deportation Pending","Deported","Released on Bail","Absconded"])}
            <div style={{gridColumn:"1/-1"}}>{fg("Home country contact / Embassy","home_country_contact")}</div>
            <div style={{gridColumn:"1/-1"}}>{fg("Local address in Fiji","local_address_fiji")}</div>
          </div>
        </div>}

        {/* Criminal Record */}
        <div style={{background:C.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <SectionLabel icon="⚖️">Criminal Record</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {fg("Primary offence","primary_offence","text",OFFENCES)} {fg("Secondary offence","secondary_offence","text",OFFENCES)}
            {fg("Arrest year","arrest_year","number")} {fg("Sentence (years)","sentence","number")}
            {fg("Risk level","risk","text",["Low","Moderate","High","Severe"])} {fg("Status","status","text",["Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"])}
            {fg("Associates","associates","number")} {fg("Convictions","convictions","number")}
            {fg("📅 Release date","release_date","date")}
            {fg("Additional charges","additional_charges","text",ADDITIONAL_CHARGES)}
            <div style={{gridColumn:"1/-1"}}>{fg("Behavioural notes","behaviour","text",BEH)}</div>
            <div style={{gridColumn:"1/-1"}}>{fg("Psychological profile","psych","text",PSY)}</div>
          </div>
        </div>

        {/* Gang & Organisation */}
        <div style={{background:C.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <SectionLabel icon="🏴">Gang & Organisation</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{gridColumn:"1/-1"}}>{fg("Gang affiliation","gang_affiliation","text",GANG_AFFILIATIONS)}</div>
            {fg("Role in gang","gang_role","text",GANG_ROLES)}
            {fg("🚢 Vessel / transport role","vessel_role","text",VESSEL_ROLES)}
          </div>
        </div>

        {/* Firearms */}
        <div style={{background:C.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <SectionLabel icon="🔫">Firearms</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {fg("Firearm type","firearms_type","text",FIREARM_TYPES)}
            {f.firearms_type!=="No Firearms"&&fg("Details / Serial / Make","firearms_details")}
          </div>
        </div>

        {/* Case Notes */}
        <div style={{background:C.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <SectionLabel icon="📝">Case Notes</SectionLabel>
          <textarea value={f.case_notes} onChange={e=>set("case_notes",e.target.value)} rows={5} placeholder="Enter detailed case notes, incident history, investigation updates..." style={{...inp,resize:"vertical"}}/>
        </div>

      </div>
      <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end",background:C.surface}}>
        <button onClick={onClose} style={btnSm}>Cancel</button>
        <button onClick={save} style={isForeign?btnPurple:btnBlue} disabled={saving}>{saving?"Saving...":isNew?"Add profile":"Save changes"}</button>
      </div>
    </div>
  </div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);const [authLoading,setAuthLoading]=useState(true);
  const [db,setDb]=useState([]);const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState("");const [fRisk,setFRisk]=useState("");
  const [fStatus,setFStatus]=useState("");const [fLocation,setFLocation]=useState("");
  const [fGender,setFGender]=useState("");const [fNat,setFNat]=useState("");
  const [sortCol,setSortCol]=useState("created_at");const [sortAsc,setSortAsc]=useState(false);
  const [view,setView]=useState("table");const [selId,setSelId]=useState(null);
  const [modal,setModal]=useState(null);const [toast,setToast]=useState("");
  const [selected,setSelected]=useState(new Set());const [dpTab,setDpTab]=useState("details");

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2800);};

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);setAuthLoading(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>setUser(session?.user??null));
    return()=>subscription.unsubscribe();
  },[]);

  const logout=async()=>{await supabase.auth.signOut();showToast("Signed out.");};

  const load=async()=>{
    setLoading(true);
    const{data}=await supabase.from("criminal_profiles").select("*").order("created_at",{ascending:false});
    setDb(data||[]);setLoading(false);
  };

  useEffect(()=>{
    load();
    const ch=supabase.channel("changes").on("postgres_changes",{event:"*",schema:"public",table:"criminal_profiles"},load).subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  const filtered=db.filter(r=>{
    if(query&&!`${r.id} ${r.name} ${r.alias}`.toLowerCase().includes(query.toLowerCase()))return false;
    if(fRisk&&r.risk!==fRisk)return false;
    if(fStatus&&r.status!==fStatus)return false;
    if(fLocation&&r.location!==fLocation)return false;
    if(fGender&&r.gender!==fGender)return false;
    if(fNat&&r.nationality_type!==fNat)return false;
    return true;
  }).sort((a,b)=>{
    const va=a[sortCol]??"",vb=b[sortCol]??"";
    if(typeof va==="number")return sortAsc?va-vb:vb-va;
    return sortAsc?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va));
  });

  const handleSort=(col)=>{if(sortCol===col)setSortAsc(p=>!p);else{setSortCol(col);setSortAsc(true);}};
  const toggleSelect=(id,e)=>{e.stopPropagation();setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});};
  const toggleAll=()=>{selected.size===filtered.length?setSelected(new Set()):setSelected(new Set(filtered.map(r=>r.id)));};
  const handlePrint=()=>{const p=db.filter(r=>selected.has(r.id));if(!p.length){showToast("Select at least one profile.");return;}printProfiles(p);};
  const printCurrent=(r)=>printProfiles([r]);
  const navigateToProfile=(id)=>{setSelId(id);setDpTab("details");setTimeout(()=>{const el=document.getElementById(`row-${id}`);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});},100);};

  const saveRecord=async(form)=>{
    const isNew=!modal.record.id;
    if(isNew){const{error}=await supabase.from("criminal_profiles").insert([form]);if(error){showToast("Error: "+error.message);return;}showToast("Profile added.");}
    else{const{error}=await supabase.from("criminal_profiles").update(form).eq("id",modal.record.id);if(error){showToast("Error: "+error.message);return;}showToast("Profile updated.");}
    setModal(null);setSelId(form.id);load();
  };

  const deleteRecord=async(id)=>{
    const r=db.find(x=>x.id===id);if(!r||!confirm(`Delete ${r.name}?`))return;
    const{error}=await supabase.from("criminal_profiles").delete().eq("id",id);
    if(error){showToast("Error deleting");return;}
    if(selId===id)setSelId(null);setSelected(prev=>{const n=new Set(prev);n.delete(id);return n;});
    showToast("Profile deleted.");load();
  };

  const sel=db.find(r=>r.id===selId)||null;
  const wanted=db.filter(r=>r.status==="Wanted").length;
  const inCustody=db.filter(r=>r.status==="In Custody").length;
  const severe=db.filter(r=>r.risk==="Severe").length;
  const withPhoto=db.filter(r=>r.photo_url).length;
  const foreignNationals=db.filter(r=>r.nationality_type==="Foreign National").length;

  if(authLoading)return <div style={{minHeight:"100vh",background:"#0F2044",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.6)",fontSize:13,letterSpacing:"0.08em"}}>AUTHENTICATING...</div>;

  if(!user)return <LoginPage onLogin={()=>{}} />;
  }

  const DPRow=({label,value,icon})=>!value?null:(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",fontSize:12,gap:8,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
      <span style={{color:C.text3,flexShrink:0,fontSize:11}}>{icon&&<span style={{marginRight:4}}>{icon}</span>}{label}</span>
      <span style={{fontWeight:500,color:C.text,textAlign:"right",maxWidth:165,wordBreak:"break-word"}}>{value}</span>
    </div>
  );

  const tabStyle=(active)=>({padding:"7px 14px",fontSize:12,fontWeight:active?600:400,color:active?C.accent:C.text3,borderBottom:active?`2px solid ${C.accent}`:"2px solid transparent",cursor:"pointer",background:"none",border:"none",whiteSpace:"nowrap"});

  return <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap'); *{box-sizing:border-box;margin:0;padding:0} body{font-family:'DM Sans',system-ui,sans-serif!important} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:4px} .rh:hover{background:#EBF2FF!important} .rs-row{background:#EBF2FF!important;border-left:3px solid ${C.accent}!important} .sel-row{background:#F0F7FF!important} .ch:hover{border-color:${C.accent}!important} input[type=checkbox]{cursor:pointer;width:15px;height:15px;accent-color:${C.accent}}`}</style>

    {toast&&<div style={{position:"fixed",bottom:20,right:20,background:C.nav,color:"#fff",padding:"10px 18px",borderRadius:8,fontWeight:500,fontSize:13,zIndex:200,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{toast}</div>}
    {modal&&user&&<Modal record={modal.record} onSave={saveRecord} onClose={()=>setModal(null)} allIds={db.map(r=>r.id)}/>}

    {/* Nav */}
    <div style={{display:"flex",alignItems:"center",padding:"0 24px",height:56,background:C.nav,gap:12,position:"sticky",top:0,zIndex:50}}>
      <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🛡️</div>
      <div><div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2}}>Criminal Intelligence System</div><div style={{fontSize:10,color:C.navMuted}}>Fiji Central Criminal Intelligence</div></div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:11,color:C.navMuted}}><span style={{color:"rgba(255,255,255,0.4)",marginRight:4}}>Admin:</span>{user.email}</div>
        <button onClick={logout} style={{...btnSm,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"}}>Sign out</button>
        <button onClick={()=>setModal({record:{}})} style={{...btnBlue,background:"#2563EB",border:"1px solid #1D4ED8"}}>+ New profile</button>
      </div>
    </div>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
      {[
        {l:"Wanted",v:wanted,c:"#7A1A1A",bg:"#FDEAEA",icon:"🔴"},
        {l:"In custody",v:inCustody,c:"#042C53",bg:"#E6F1FB",icon:"🔵"},
        {l:"Severe risk",v:severe,c:"#4A1B0C",bg:"#FAECE7",icon:"🟠"},
        {l:"Photos on file",v:withPhoto,c:"#173404",bg:"#EAF3DE",icon:"🟢"},
        {l:"Foreign nationals",v:foreignNationals,c:C.foreign,bg:C.foreignBg,icon:"🌍"},
        {l:"Total profiles",v:db.length,c:"#26215C",bg:"#EEEDFE",icon:"🟣"},
      ].map(k=>(
        <div key={k.l} style={{padding:"12px 16px",borderRight:`1px solid ${C.border}`,background:k.bg}}>
          <div style={{fontSize:10,color:k.c,fontWeight:600,marginBottom:4,opacity:0.7}}>{k.icon} {k.l.toUpperCase()}</div>
          <div style={{fontSize:22,fontWeight:700,color:k.c,letterSpacing:"-0.02em"}}>{k.v}</div>
        </div>
      ))}
    </div>

    {/* Toolbar */}
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,flexWrap:"wrap"}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.text3,fontSize:14,pointerEvents:"none"}}>🔍</span>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, alias, ID..." style={{...inp,paddingLeft:30,width:210,height:32,fontSize:12}}/>
      </div>
      {[
        {v:fNat,s:setFNat,opts:["All nationalities","Fijian","Foreign National"]},
        {v:fRisk,s:setFRisk,opts:["All risk","Low","Moderate","High","Severe"]},
        {v:fStatus,s:setFStatus,opts:["All statuses","Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"]},
        {v:fLocation,s:setFLocation,opts:["All locations",...LOCATIONS]},
        {v:fGender,s:setFGender,opts:["All genders","Male","Female"]},
      ].map((f,i)=>(
        <select key={i} value={f.v} onChange={e=>f.s(e.target.value.startsWith("All ")?"":e.target.value)} style={{...inp,height:32,width:"auto",cursor:"pointer",fontSize:12}}>
          {f.opts.map(o=><option key={o}>{o}</option>)}
        </select>
      ))}
      <button onClick={()=>{setQuery("");setFRisk("");setFStatus("");setFLocation("");setFGender("");setFNat("");}} style={{...btnSm,height:32}}>Clear</button>
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
    <div style={{display:"flex",height:"calc(100vh - 56px - 73px - 52px)"}}>
      <div style={{flex:1,overflow:"auto"}}>
        {loading?<div style={{padding:48,textAlign:"center",color:C.accent}}>Loading profiles...</div>
        :filtered.length===0?<div style={{padding:48,textAlign:"center",color:C.text3}}>No profiles found.</div>
        :view==="table"?(
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                <th style={{padding:"9px 10px",width:36}}><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll}/></th>
                {[["id","Case ID"],["",""],["name","Name"],["nationality_type","Type"],["gender","Gender"],["risk","Risk"],["status","Status"],["primary_offence","Offence"],["location","Location"],["arrest_year","Year"],["",""]].map(([col,label],i)=>(
                  <th key={i} onClick={col?()=>handleSort(col):undefined} style={{padding:"9px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:sortCol===col?C.accent:C.text3,letterSpacing:"0.07em",textTransform:"uppercase",cursor:col?"pointer":"default",userSelect:"none",whiteSpace:"nowrap",borderRight:i<10?`1px solid ${C.border}`:"none",background:C.surface2}}>
                    {label}{col&&sortCol===col&&<span style={{marginLeft:3,color:C.accent}}>{sortAsc?"↑":"↓"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>{
                const oc=OFFENCE_COLOR[r.primary_offence]||{};const isSel=selected.has(r.id);const isForeign=r.nationality_type==="Foreign National";
                return <tr key={r.id} id={`row-${r.id}`} onClick={()=>setSelId(r.id)} className={selId===r.id?"rs-row":isSel?"sel-row":"rh"}
                  style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer",borderLeft:selId===r.id?`3px solid ${C.accent}`:isSel?`3px solid #85B7EB`:isForeign?`3px solid ${C.foreignBorder}`:"3px solid transparent"}}>
                  <td style={{padding:"8px 10px"}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={isSel} onChange={e=>toggleSelect(r.id,e)}/></td>
                  <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:10,color:C.text3}}>{r.id}</td>
                  <td style={{padding:"4px 6px"}}><Avatar r={r} size={28}/></td>
                  <td style={{padding:"8px 10px",fontWeight:600,color:C.text,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</td>
                  <td style={{padding:"8px 10px"}}>
                    {isForeign?<span style={{fontSize:10,background:C.foreignBg,color:C.foreign,borderRadius:99,padding:"2px 7px",border:`1px solid ${C.foreignBorder}`,fontWeight:600,whiteSpace:"nowrap"}}>🌍 Foreign</span>
                    :<span style={{fontSize:10,background:"#EAF3DE",color:"#173404",borderRadius:99,padding:"2px 7px",border:"1px solid #97C459",fontWeight:600}}>🏝️ Fijian</span>}
                  </td>
                  <td style={{padding:"8px 10px",color:C.text2,fontSize:11}}>{r.gender}</td>
                  <td style={{padding:"8px 10px"}}><Badge label={r.risk} style={RISK_STYLE[r.risk]}/></td>
                  <td style={{padding:"8px 10px"}}><Badge label={r.status} style={STATUS_STYLE[r.status]}/></td>
                  <td style={{padding:"8px 10px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:oc.text||C.text2}}>{oc.dot&&<span style={{width:7,height:7,borderRadius:"50%",background:oc.dot}}/>}{r.primary_offence}</span></td>
                  <td style={{padding:"8px 10px",color:C.text2,fontSize:11}}>{r.location}</td>
                  <td style={{padding:"8px 10px",color:C.text3,fontSize:11,fontFamily:"monospace"}}>{r.arrest_year}</td>
                  <td style={{padding:"8px 8px"}}>
                    <div style={{display:"flex",gap:2}}>
                      <button onClick={e=>{e.stopPropagation();printCurrent(r);}} style={{...btnSm,padding:"3px 6px",fontSize:11,background:"#EAF3DE",color:"#1E7E34",border:"1px solid #97C459"}}>🖨️</button>
                      {user&&<>
                        <button onClick={e=>{e.stopPropagation();setModal({record:r});}} style={{...btnSm,padding:"3px 6px",fontSize:11}}>Edit</button>
                        <button onClick={e=>{e.stopPropagation();deleteRecord(r.id);}} style={{...btnRed,padding:"3px 6px",fontSize:11}}>Del</button>
                      </>}
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:12,padding:16}}>
            {filtered.map(r=>{
              const oc=OFFENCE_COLOR[r.primary_offence]||{};const isSel=selected.has(r.id);const isForeign=r.nationality_type==="Foreign National";
              return <div key={r.id} onClick={()=>setSelId(r.id)} className="ch" style={{background:C.surface,border:`2px solid ${isSel?C.accent:selId===r.id?"#85B7EB":isForeign?C.foreignBorder:C.border}`,borderRadius:10,padding:14,cursor:"pointer",transition:"all 0.15s",borderTop:`3px solid ${oc.dot||C.border}`,position:"relative"}}>
                <input type="checkbox" checked={isSel} onChange={e=>toggleSelect(r.id,e)} style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}/>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <Avatar r={r} size={38}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:9,color:C.text3,fontFamily:"monospace"}}>{r.id}</div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                    <div style={{fontSize:10,color:C.text3}}>{r.location}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
                  <Badge label={r.risk} style={RISK_STYLE[r.risk]}/><Badge label={r.status} style={STATUS_STYLE[r.status]}/>
                  {isForeign&&<span style={{fontSize:9,background:C.foreignBg,color:C.foreign,borderRadius:99,padding:"2px 6px",border:`1px solid ${C.foreignBorder}`,fontWeight:600}}>🌍 Foreign</span>}
                </div>
                <div style={{fontSize:11,padding:"4px 8px",borderRadius:5,background:oc.bg||C.surface2,color:oc.text||C.text2,border:`1px solid ${oc.border||C.border}`,display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
                  {oc.dot&&<span style={{width:6,height:6,borderRadius:"50%",background:oc.dot}}/>}{r.primary_offence}
                </div>
                {r.gang_affiliation&&r.gang_affiliation!=="No Gang Affiliation"&&<div style={{fontSize:10,color:C.text3,marginBottom:4}}>🏴 {r.gang_affiliation}</div>}
                <button onClick={e=>{e.stopPropagation();printCurrent(r);}} style={{...btnSm,width:"100%",justifyContent:"center",fontSize:11,background:"#EAF3DE",color:"#1E7E34",border:"1px solid #97C459"}}>🖨️ Print</button>
              </div>;
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
            {/* Header */}
            <div style={{background:sel.nationality_type==="Foreign National"?C.foreign:C.nav,padding:"14px 14px 12px",flexShrink:0}}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:10}}>
                <Avatar r={sel} size={50}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2}}>{sel.name}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontFamily:"monospace",marginTop:2}}>{sel.id} · {sel.alias}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>{sel.occupation}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <Badge label={`${sel.risk} risk`} style={RISK_STYLE[sel.risk]}/>
                <Badge label={sel.status} style={STATUS_STYLE[sel.status]}/>
                {sel.nationality_type==="Foreign National"&&<span style={{fontSize:10,background:"rgba(255,255,255,0.15)",color:"#fff",borderRadius:99,padding:"2px 8px",border:"1px solid rgba(255,255,255,0.3)",fontWeight:600}}>🌍 Foreign National</span>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0,overflowX:"auto"}}>
              <button style={tabStyle(dpTab==="details")} onClick={()=>setDpTab("details")}>Details</button>
              <button style={tabStyle(dpTab==="criminal")} onClick={()=>setDpTab("criminal")}>⚖️ Criminal</button>
              {sel.nationality_type==="Foreign National"&&<button style={tabStyle(dpTab==="foreign")} onClick={()=>setDpTab("foreign")}>🌍 Foreign</button>}
              <button style={tabStyle(dpTab==="associates")} onClick={()=>setDpTab("associates")}>🔗 Associates</button>
            </div>

            {/* Tab content */}
            <div style={{flex:1,overflowY:"auto"}}>
              {dpTab==="details"&&<div>
                {/* Biometric strip */}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                  {sel.thumb_url?<img src={sel.thumb_url} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover",border:`1px solid ${C.border2}`}}/>:<div style={{width:40,height:40,borderRadius:6,background:C.surface,border:`1px dashed ${C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.text3}}>🖐</div>}
                  <div style={{fontSize:11,lineHeight:1.6}}>
                    <div style={{color:sel.thumb_url?C.accent:C.text3,fontWeight:600}}>{sel.thumb_url?"✓ Fingerprint on file":"No fingerprint"}</div>
                    <div style={{color:C.text3}}>{sel.photo_url?"✓ Photo on file":"No photo"}</div>
                  </div>
                </div>
                {/* Offence */}
                {sel.primary_offence&&(()=>{const oc=OFFENCE_COLOR[sel.primary_offence]||{};return <div style={{margin:"10px 14px",padding:"8px 12px",borderRadius:8,background:oc.bg||C.surface2,border:`1px solid ${oc.border||C.border}`,display:"flex",alignItems:"center",gap:6}}>
                  {oc.dot&&<span style={{width:8,height:8,borderRadius:"50%",background:oc.dot}}/>}
                  <div><div style={{fontSize:10,color:oc.text||C.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Primary offence</div>
                  <div style={{fontSize:12,fontWeight:600,color:oc.text||C.text}}>{sel.primary_offence}</div>
                  {sel.secondary_offence&&<div style={{fontSize:11,color:oc.text||C.text3}}>Also: {sel.secondary_offence}</div>}</div>
                </div>;})()}
                <div style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"8px 0 4px"}}>Personal</div>
                  <DPRow label="Date of birth" value={sel.dob}/><DPRow label="Gender" value={sel.gender}/>
                  <DPRow label="Nationality" value={sel.nationality}/><DPRow label="Phone" value={sel.phone_number} icon="📞"/>
                  <DPRow label="Address" value={sel.home_address} icon="🏠"/><DPRow label="Vehicle" value={sel.vehicle_registration} icon="🚗"/>
                  <DPRow label="Family" value={sel.family_members} icon="👨‍👩‍👧"/><DPRow label="Medical" value={sel.medical_conditions} icon="🏥"/>
                  {sel.case_notes&&<><div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 6px"}}>📝 Case notes</div>
                  <div style={{fontSize:11,color:C.text2,lineHeight:1.7,background:C.surface2,padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,whiteSpace:"pre-wrap",marginBottom:8}}>{sel.case_notes}</div></>}
                </div>
              </div>}

              {dpTab==="criminal"&&<div style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:0}}>
                <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"8px 0 4px"}}>Criminal record</div>
                <DPRow label="Arrest year" value={sel.arrest_year}/>
                <DPRow label="Sentence" value={`${sel.sentence} years`}/>
                <DPRow label="Release date" value={sel.release_date} icon="📅"/>
                <DPRow label="Associates" value={sel.associates}/>
                <DPRow label="Convictions" value={sel.convictions}/>
                {sel.additional_charges&&sel.additional_charges!=="None"&&<DPRow label="Additional charges" value={sel.additional_charges}/>}
                {sel.gang_affiliation&&sel.gang_affiliation!=="No Gang Affiliation"&&<>
                  <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>🏴 Gang & Organisation</div>
                  <DPRow label="Affiliation" value={sel.gang_affiliation}/>
                  <DPRow label="Role in gang" value={sel.gang_role}/>
                  {sel.vessel_role&&sel.vessel_role!=="Not Applicable"&&<DPRow label="Vessel role" value={sel.vessel_role} icon="🚢"/>}
                </>}
                {sel.firearms_type&&sel.firearms_type!=="No Firearms"&&<>
                  <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>🔫 Firearms</div>
                  <DPRow label="Type" value={sel.firearms_type}/>
                  <DPRow label="Details" value={sel.firearms_details}/>
                </>}
                <div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:"0.08em",textTransform:"uppercase",padding:"10px 0 4px"}}>Profile assessment</div>
                <div style={{fontSize:11,color:C.text2,lineHeight:1.6,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>{sel.behaviour}</div>
                <div style={{fontSize:11,color:C.text3,fontStyle:"italic",lineHeight:1.6,padding:"6px 0"}}>{sel.psych}</div>
              </div>}

              {dpTab==="foreign"&&sel.nationality_type==="Foreign National"&&<div style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:0}}>
                <div style={{fontSize:10,fontWeight:700,color:C.foreign,letterSpacing:"0.08em",textTransform:"uppercase",padding:"8px 0 4px"}}>🌍 Foreign National Details</div>
                <DPRow label="Country of origin" value={sel.country_of_origin}/>
                <DPRow label="Passport number" value={sel.passport_number}/>
                <DPRow label="Visa type" value={sel.visa_type}/>
                <DPRow label="Visa expiry" value={sel.visa_expiry_date}/>
                <DPRow label="Port of entry" value={sel.port_of_entry} icon="✈️"/>
                <DPRow label="Date of entry" value={sel.date_of_entry}/>
                <DPRow label="Immigration status" value={sel.immigration_status}/>
                <DPRow label="Interpol flag" value={sel.interpol_flag}/>
                <DPRow label="Deportation status" value={sel.deportation_status}/>
                <DPRow label="Home country contact" value={sel.home_country_contact}/>
                <DPRow label="Local address in Fiji" value={sel.local_address_fiji} icon="🏠"/>
              </div>}

              {dpTab==="associates"&&<div style={{padding:"12px 14px"}}>
                <AssociatesPanel profileId={sel.id} onNavigate={navigateToProfile} canEdit={!!user}/>
              </div>}
            </div>

            {/* Actions */}
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:6,background:C.surface,flexShrink:0}}>
              <button onClick={()=>printCurrent(sel)} style={{...btnGreen,justifyContent:"center",width:"100%"}}>🖨️ Print this profile</button>
              {user&&<div style={{display:"flex",gap:6}}>
                <button onClick={()=>setModal({record:sel})} style={{...btnBlue,flex:1,justifyContent:"center"}}>Edit</button>
                <button onClick={()=>deleteRecord(sel.id)} style={{...btnRed,flex:1,justifyContent:"center"}}>Delete</button>
              </div>}
            </div>
          </>
        )}
      </div>
    </div>

    {/* Footer */}
    <div style={{display:"flex",alignItems:"center",padding:"8px 20px",borderTop:`1px solid ${C.border}`,background:C.surface,gap:14,flexWrap:"wrap"}}>
      <span style={{fontSize:11,color:C.text3}}>{filtered.length} profiles · {wanted} wanted · {severe} severe risk · {foreignNationals} foreign nationals</span>
      {selected.size>0&&<span style={{fontSize:11,color:C.accent,fontWeight:600}}>{selected.size} selected</span>}
      <div style={{flex:1}}/>
      <span style={{fontSize:11,color:C.text3}}>Fiji Central Criminal Intelligence · FY2026 · Confidential</span>
    </div>
  </div>;
}