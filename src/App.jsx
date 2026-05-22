import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const OFFENCES = ["Aggravated Assault","Armed Robbery","Bribery","Burglary","Counterfeit Operations","Cybercrime","Domestic Violence","Drug Trafficking","Extortion","Fraud","Human Trafficking","Identity Fraud","Illegal Firearm Possession","Insurance Fraud","Kidnapping","Money Laundering","Organized Crime Activity","Smuggling","Tax Evasion","Vehicle Theft"];
const OCCUPATIONS = ["Accountant","Business Owner","Construction Worker","Dock Worker","Farmer","Fisherman","Hotel Staff","IT Technician","Mechanic","Nightclub Operator","Retail Manager","Security Guard","Taxi Driver","Warehouse Supervisor"];
const LOCATIONS = ["Ba","Labasa","Lautoka","Levuka","Nadi","Nausori","Rakiraki","Savusavu","Sigatoka","Suva"];
const BEH = ["Financially motivated offender","Frequent cross-border travel","History of violent escalation","Known to operate in groups","Maintains low public profile","Repeat offender with regional links","Suspected gang affiliations","Technically skilled offender"];
const PSY = ["Avoids direct confrontation when possible","Calculated and methodical","Displays anti-social behaviour patterns","High adaptability","Impulsive under pressure","Manipulative tendencies observed"];
const RISK_STYLE = { Low:{bg:"#E6F9EC",text:"#1A5C2A",border:"#A3D9B1"}, Moderate:{bg:"#FFF3E0",text:"#7A4500",border:"#F5C07A"}, High:{bg:"#FFF0E6",text:"#7A2E00",border:"#F5A07A"}, Severe:{bg:"#FDEAEA",text:"#7A1A1A",border:"#F0A0A0"} };
const STATUS_STYLE = { "Wanted":{bg:"#FDEAEA",text:"#8B1A1A",border:"#F0A0A0"}, "In Custody":{bg:"#E6F0FF",text:"#1A3A7A",border:"#A0BDEF"}, "Released on Parole":{bg:"#FFF8E6",text:"#6B4500",border:"#E8C97A"}, "Sentence Completed":{bg:"#E6F9EC",text:"#1A5C2A",border:"#A3D9B1"}, "Under Investigation":{bg:"#F0EDFF",text:"#3A2A8B",border:"#B0A0EF"} };
const inp = { padding:"7px 10px",fontSize:12,borderRadius:8,border:"1px solid #1e2130",background:"#0a0c14",color:"#c0c4d0",fontFamily:"inherit",width:"100%",boxSizing:"border-box" };
const btnSm = { display:"inline-flex",alignItems:"center",gap:4,padding:"6px 12px",fontSize:12,fontWeight:600,borderRadius:8,border:"1px solid #2a2d38",background:"#1a1d26",color:"#c0c4d0",cursor:"pointer" };
const btnGreen = { ...btnSm,background:"#39FF8F",color:"#040507",border:"1px solid #39FF8F",fontWeight:700 };

const btnRed = { ...btnSm,color:"#FF5555",border:"1px solid #3a1a1a",background:"#1a0f0f" };
function Badge({ label, style:s={} }) {
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 9px",borderRadius:99,fontSize:10,fontWeight:600,background:s.bg||"#eee",color:s.text||"#333",border:`1px solid ${s.border||"#ccc"}`,whiteSpace:"nowrap"}}>{label}</span>;
}

function Avatar({ r, size=40 }) {
  const ini = r.name?.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
  const rs = RISK_STYLE[r.risk]||{};
  if (r.photo_url) return <img src={r.photo_url} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${rs.border||"#333"}`,flexShrink:0}} />;
  return <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:rs.bg||"#1a1d26",color:rs.text||"#c0c4d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.3),fontWeight:700,border:`2px solid ${rs.border||"#333"}`}}>{ini}</div>;
}

function ThumbCanvas({ value, onChange }) {
  const ref = useRef(); const draw = useRef(false); const last = useRef([0,0]);
  useEffect(()=>{
    const c=ref.current; if(!c)return;
    const ctx=c.getContext("2d"); ctx.fillStyle="#0f1117"; ctx.fillRect(0,0,c.width,c.height);
    if(value){const img=new Image(); img.onload=()=>ctx.drawImage(img,0,0,c.width,c.height); img.src=value;}
  },[]);
  const pos=(e)=>{const r=ref.current.getBoundingClientRect(),sx=ref.current.width/r.width,sy=ref.current.height/r.height,src=e.touches?e.touches[0]:e;return[(src.clientX-r.left)*sx,(src.clientY-r.top)*sy];};
  const start=(e)=>{draw.current=true;last.current=pos(e);};
  const move=(e)=>{if(!draw.current)return;e.preventDefault?.();const c=ref.current,ctx=c.getContext("2d"),[x,y]=pos(e);ctx.strokeStyle="#39FF8F";ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(...last.current);ctx.lineTo(x,y);ctx.stroke();last.current=[x,y];onChange(c.toDataURL());};
  const stop=()=>{draw.current=false;};
  const clear=()=>{const c=ref.current,ctx=c.getContext("2d");ctx.fillStyle="#0f1117";ctx.fillRect(0,0,c.width,c.height);onChange(null);};
  return (
    <div>
      <canvas ref={ref} width={200} height={130} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        style={{display:"block",width:"100%",borderRadius:8,cursor:"crosshair",border:"1px solid rgba(57,255,143,0.3)",background:"#0f1117"}} />
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <button onClick={clear} style={btnSm}>Clear</button>
        <label style={{...btnSm,cursor:"pointer"}}>Upload<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=ev=>{const c=ref.current,ctx=c.getContext("2d"),img=new Image();img.onload=()=>{ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);onChange(c.toDataURL());};img.src=ev.target.result;};fr.readAsDataURL(f);}}/></label>
      </div>
      <p style={{fontSize:10,color:"#555",marginTop:4,textAlign:"center"}}>Draw or upload a scan</p>
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
    // Only send fields that exist in the database - no photoData or thumbData
    const dbRecord = {
      id: newId,
      name: f.name,
      alias: f.alias,
      gender: f.gender,
      dob: f.dob,
      nationality: "Fijian",
      location: f.location,
      occupation: f.occupation,
      primary_offence: f.primary_offence,
      secondary_offence: f.secondary_offence,
      arrest_year: f.arrest_year,
      sentence: f.sentence,
      risk: f.risk,
      status: f.status,
      associates: f.associates,
      convictions: f.convictions,
      behaviour: f.behaviour,
      psych: f.psych,
      photo_url: photo_url,
      thumb_url: thumb_url,
    };
    onSave(dbRecord);
    setSaving(false);
  };

  const fg=(label,key,type="text",opts=null)=>(
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontSize:10,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</label>
      {opts ? <select value={f[key]} onChange={e=>set(key,e.target.value)} style={inp}>{opts.map(o=><option key={o}>{o}</option>)}</select>
             : <input type={type} value={f[key]} onChange={e=>set(key,type==="number"?Number(e.target.value):e.target.value)} style={inp}/>}
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px 10px",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0d0f18",border:"1px solid #1e2130",borderRadius:16,width:540,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.9)"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #1e2130",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:700,color:"#e0e4f0"}}>{isNew?"New Profile":"Edit Profile"}</span>
          <button onClick={onClose} style={btnSm}>✕</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"14px 18px",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"#39FF8F",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,borderBottom:"1px solid #1a1f2e",paddingBottom:6}}>Biometric Data</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <div style={{fontSize:10,color:"#555",marginBottom:6,textTransform:"uppercase",fontWeight:600}}>Photo</div>
                <label style={{display:"block",cursor:"pointer"}}>
                  <div style={{border:"1px dashed #2a2d38",borderRadius:10,padding:10,textAlign:"center",minHeight:90,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                    {(f.photoData||f.photo_url) ? <img src={f.photoData||f.photo_url} alt="" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"2px solid #39FF8F"}}/> : <><div style={{fontSize:26}}>📷</div><div style={{fontSize:11,color:"#555"}}>Click to upload</div></>}
                  </div>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const fl=e.target.files[0];if(!fl)return;const fr=new FileReader();fr.onload=ev=>set("photoData",ev.target.result);fr.readAsDataURL(fl);}}/>
                </label>
                {(f.photoData||f.photo_url)&&<button onClick={()=>{set("photoData",null);set("photo_url",null);}} style={{...btnSm,marginTop:6,width:"100%",justifyContent:"center"}}>Remove</button>}
              </div>
              <div>
                <div style={{fontSize:10,color:"#555",marginBottom:6,textTransform:"uppercase",fontWeight:600}}>Thumbprint</div>
                <ThumbCanvas value={f.thumb_url} onChange={v=>set("thumbData",v)}/>
              </div>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"#39FF8F",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,borderBottom:"1px solid #1a1f2e",paddingBottom:6}}>Personal Details</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {fg("Full Name *","name")} {fg("Alias","alias")}
              {fg("Gender","gender","text",["Male","Female"])} {fg("Date of Birth","dob","date")}
              {fg("Location","location","text",LOCATIONS)} {fg("Occupation","occupation","text",OCCUPATIONS)}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"#39FF8F",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,borderBottom:"1px solid #1a1f2e",paddingBottom:6}}>Criminal Record</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {fg("Primary Offence","primary_offence","text",OFFENCES)} {fg("Secondary Offence","secondary_offence","text",OFFENCES)}
              {fg("Arrest Year","arrest_year","number")} {fg("Sentence (years)","sentence","number")}
              {fg("Risk Level","risk","text",["Low","Moderate","High","Severe"])} {fg("Status","status","text",["Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"])}
              {fg("Associates","associates","number")} {fg("Convictions","convictions","number")}
              <div style={{gridColumn:"1/-1"}}>{fg("Behavioural Notes","behaviour","text",BEH)}</div>
              <div style={{gridColumn:"1/-1"}}>{fg("Psychological Profile","psych","text",PSY)}</div>
            </div>
          </div>
        </div>
        <div style={{padding:"10px 18px",borderTop:"1px solid #1e2130",display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={btnSm}>Cancel</button>
          <button onClick={save} style={btnGreen} disabled={saving}>{saving?"Saving...":isNew?"Add Profile":"Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
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
      if (error) { console.error("Insert error:", error); showToast("❌ Error: " + error.message); return; }
      showToast("✅ Profile added!");
    } else {
      const { error } = await supabase.from("criminal_profiles").update(form).eq("id", modal.record.id);
      if (error) { console.error("Update error:", error); showToast("❌ Error: " + error.message); return; }
      showToast("✅ Profile updated!");
    }
    setModal(null);
    setSelId(form.id);
    load();
  };

  const deleteRecord = async (id) => {
    const r = db.find(x=>x.id===id);
    if (!r||!confirm(`Delete ${r.name}?`)) return;
    const { error } = await supabase.from("criminal_profiles").delete().eq("id",id);
    if (error) { showToast("❌ Error deleting"); return; }
    if (selId===id) setSelId(null);
    showToast("🗑 Profile deleted.");
    load();
  };

  const sel = db.find(r=>r.id===selId)||null;
  const wanted = db.filter(r=>r.status==="Wanted").length;
  const inCustody = db.filter(r=>r.status==="In Custody").length;
  const severe = db.filter(r=>r.risk==="Severe").length;
  const withPhoto = db.filter(r=>r.photo_url).length;
  const avgSen = db.length ? Math.round(db.reduce((s,r)=>s+(r.sentence||0),0)/db.length) : 0;

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#070910",minHeight:"100vh",color:"#c0c4d0"}}>
      <style>{`*{box-sizing:border-box} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#1e2130;border-radius:4px} .rh:hover{background:#0f1220!important} .rs{background:#0d1424!important} .ch:hover{border-color:#39FF8F!important} select option{background:#0d0f18}`}</style>

      {toast && <div style={{position:"fixed",bottom:20,right:20,background:"#39FF8F",color:"#040507",padding:"10px 18px",borderRadius:10,fontWeight:700,fontSize:12,zIndex:200,boxShadow:"0 8px 24px rgba(57,255,143,0.3)"}}>{toast}</div>}
      {modal && <Modal record={modal.record} onSave={saveRecord} onClose={()=>setModal(null)} allIds={db.map(r=>r.id)}/>}

      <div style={{display:"flex",alignItems:"center",padding:"0 20px",height:52,borderBottom:"1px solid #1a1f2e",background:"#070910",position:"sticky",top:0,zIndex:50,gap:12}}>
        <span style={{fontSize:18}}>🛡️</span>
        <span style={{fontSize:15,fontWeight:700,color:"#e0e4f0"}}>Criminal Intelligence</span>
        <span style={{fontSize:10,background:"rgba(57,255,143,0.12)",color:"#39FF8F",padding:"2px 8px",borderRadius:99,fontWeight:700,border:"1px solid rgba(57,255,143,0.2)"}}>FJ·2026</span>
        <div style={{flex:1}}/>
        <button onClick={()=>setModal({record:{}})} style={btnGreen}>+ New Profile</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",borderBottom:"1px solid #1a1f2e"}}>
        {[{l:"Wanted",v:wanted,c:"#FF5555"},{l:"In Custody",v:inCustody,c:"#5B9CF6"},{l:"Severe Risk",v:severe,c:"#FF9055"},{l:"Photos Filed",v:withPhoto,c:"#39FF8F"},{l:"Avg Sentence",v:`${avgSen}y`,c:"#A78BFA"}].map(k=>(
          <div key={k.l} style={{padding:"12px 16px",borderRight:"1px solid #1a1f2e"}}>
            <div style={{fontSize:22,fontWeight:700,color:k.c,fontFamily:"monospace"}}>{k.v}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderBottom:"1px solid #1a1f2e",background:"#09010c",flexWrap:"wrap"}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔍 Search name, alias, ID..." style={{...inp,width:200,height:30,fontSize:12}}/>
        {[
          {v:fRisk,s:setFRisk,opts:["All Risk","Low","Moderate","High","Severe"]},
          {v:fStatus,s:setFStatus,opts:["All Statuses","Wanted","In Custody","Released on Parole","Sentence Completed","Under Investigation"]},
          {v:fLocation,s:setFLocation,opts:["All Locations",...LOCATIONS]},
          {v:fGender,s:setFGender,opts:["All Genders","Male","Female"]},
        ].map((f,i)=>(
          <select key={i} value={f.v} onChange={e=>f.s(e.target.value.startsWith("All ")?"":e.target.value)} style={{...inp,height:30,width:"auto",cursor:"pointer",fontSize:12}}>
            {f.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={()=>{setQuery("");setFRisk("");setFStatus("");setFLocation("");setFGender("");}} style={btnSm}>Clear</button>
        <div style={{flex:1}}/>
        <div style={{display:"flex",border:"1px solid #1e2130",borderRadius:8,overflow:"hidden"}}>
          {["table","card"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{width:34,height:30,background:view===v?"#39FF8F":"#0a0c14",color:view===v?"#040507":"#555",border:"none",cursor:"pointer",fontSize:14}}>
              {v==="table"?"⊞":"▦"}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 52px - 58px - 48px)"}}>
        <div style={{flex:1,overflow:"auto"}}>
          {loading ? (
            <div style={{padding:48,textAlign:"center",color:"#39FF8F",fontSize:14}}>Loading profiles...</div>
          ) : filtered.length===0 ? (
            <div style={{padding:48,textAlign:"center",color:"#333"}}>🔎 No profiles found.</div>
          ) : view==="table" ? (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#0a0c14",borderBottom:"1px solid #1a1f2e"}}>
                  {[["id","ID"],["",""],["name","Name"],["gender","Gender"],["risk","Risk"],["status","Status"],["primary_offence","Offence"],["location","Location"],["arrest_year","Year"],["",""]].map(([col,label],i)=>(
                    <th key={i} onClick={col?()=>handleSort(col):undefined} style={{padding:"7px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:sortCol===col?"#39FF8F":"#444",letterSpacing:"0.08em",textTransform:"uppercase",cursor:col?"pointer":"default",userSelect:"none",whiteSpace:"nowrap",fontFamily:"monospace",borderRight:i<9?"1px solid #1a1f2e":"none"}}>
                      {label}{col&&sortCol===col&&<span style={{marginLeft:3,opacity:0.7}}>{sortAsc?"↑":"↓"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r=>(
                  <tr key={r.id} onClick={()=>setSelId(r.id)} className={selId===r.id?"rs":"rh"} style={{borderBottom:"1px solid #1a1f2e",cursor:"pointer"}}>
                    <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:10,color:"#555"}}>{r.id}</td>
                    <td style={{padding:"4px 6px"}}><Avatar r={r} size={26}/></td>
                    <td style={{padding:"7px 10px",fontWeight:600,color:"#d0d4e0",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</td>
                    <td style={{padding:"7px 10px",color:"#666"}}>{r.gender}</td>
                    <td style={{padding:"7px 10px"}}><Badge label={r.risk} style={RISK_STYLE[r.risk]}/></td>
                    <td style={{padding:"7px 10px"}}><Badge label={r.status} style={STATUS_STYLE[r.status]}/></td>
                    <td style={{padding:"7px 10px",color:"#888",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.primary_offence}</td>
                    <td style={{padding:"7px 10px",color:"#666"}}>{r.location}</td>
                    <td style={{padding:"7px 10px",color:"#444",fontFamily:"monospace",fontSize:11}}>{r.arrest_year}</td>
                    <td style={{padding:"7px 8px"}}>
                      <div style={{display:"flex",gap:2}}>
                        <button onClick={e=>{e.stopPropagation();setModal({record:r});}} style={{background:"none",border:"none",cursor:"pointer",padding:"3px 5px",color:"#555",borderRadius:4,fontSize:13}}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();deleteRecord(r.id);}} style={{background:"none",border:"none",cursor:"pointer",padding:"3px 5px",color:"#555",borderRadius:4,fontSize:13}}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:10,padding:12}}>
              {filtered.map(r=>(
                <div key={r.id} onClick={()=>setSelId(r.id)} className="ch" style={{background:selId===r.id?"#0d1424":"#0a0c14",border:`1px solid ${selId===r.id?"#39FF8F":"#1e2130"}`,borderRadius:12,padding:12,cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <Avatar r={r} size={36}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:9,color:"#444",fontFamily:"monospace"}}>{r.id}</div>
                      <div style={{fontSize:12,fontWeight:700,color:"#d0d4e0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <Badge label={r.risk} style={RISK_STYLE[r.risk]}/><Badge label={r.status} style={STATUS_STYLE[r.status]}/>
                  </div>
                  <div style={{fontSize:10,color:"#444",marginTop:6}}>{r.primary_offence} · {r.location}</div>
                  {r.thumb_url && <div style={{fontSize:10,color:"rgba(57,255,143,0.5)",marginTop:3}}>🖐 Print on file</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{width:255,borderLeft:"1px solid #1a1f2e",background:"#080a12",flexShrink:0,overflowY:"auto"}}>
          {!sel ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"#333",gap:8,padding:20}}>
              <div style={{fontSize:36}}>🔍</div>
              <p style={{fontSize:12,textAlign:"center",color:"#444",lineHeight:1.6}}>Select a profile to view details</p>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
              <div style={{padding:"14px 13px",borderBottom:"1px solid #1a1f2e"}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                  <Avatar r={sel} size={50}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#e0e4f0",lineHeight:1.2}}>{sel.name}</div>
                    <div style={{fontSize:10,color:"#444",fontFamily:"monospace",marginTop:2}}>{sel.id} · {sel.alias}</div>
                    <div style={{fontSize:11,color:"#555",marginTop:2}}>{sel.occupation}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                  <Badge label={`${sel.risk} Risk`} style={RISK_STYLE[sel.risk]}/><Badge label={sel.status} style={STATUS_STYLE[sel.status]}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#0a0c14",borderRadius:8,border:"1px solid #1a1f2e"}}>
                  {sel.thumb_url ? <img src={sel.thumb_url} alt="thumb" style={{width:40,height:40,borderRadius:6,objectFit:"cover",border:"1px solid rgba(57,255,143,0.3)"}}/> : <div style={{width:40,height:40,borderRadius:6,background:"#0f1117",border:"1px dashed #2a2d38",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🖐</div>}
                  <div style={{fontSize:10,color:"#555",lineHeight:1.6}}>
                    <div style={{color:sel.thumb_url?"#39FF8F":"#444",fontWeight:600}}>{sel.thumb_url?"✓ Thumbprint on file":"No thumbprint"}</div>
                    <div>{sel.photo_url?"✓ Photo on file":"No photo"}</div>
                  </div>
                </div>
              </div>
              <div style={{padding:"8px 13px",flex:1,display:"flex",flexDirection:"column",gap:5}}>
                {[["Date of birth",sel.dob],["Gender",sel.gender],["Nationality",sel.nationality],["Primary offence",sel.primary_offence],["Secondary offence",sel.secondary_offence],["Arrest year",sel.arrest_year],["Sentence",`${sel.sentence} years`],["Location",sel.location],["Associates",sel.associates],["Convictions",sel.convictions]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",fontSize:11,gap:8}}>
                    <span style={{color:"#444",flexShrink:0}}>{l}</span>
                    <span style={{fontWeight:600,color:"#888",textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{v}</span>
                  </div>
                ))}
                <div style={{height:0.5,background:"#1a1f2e",margin:"4px 0"}}/>
                <div style={{fontSize:11,color:"#666",lineHeight:1.5}}>{sel.behaviour}</div>
                <div style={{fontSize:11,color:"#444",fontStyle:"italic",lineHeight:1.5}}>{sel.psych}</div>
              </div>
              <div style={{padding:"8px 13px",borderTop:"1px solid #1a1f2e",display:"flex",gap:6}}>
                <button onClick={()=>setModal({record:sel})} style={{...btnGreen,flex:1,justifyContent:"center"}}>Edit</button>
                <button onClick={()=>deleteRecord(sel.id)} style={{...btnRed,flex:1,justifyContent:"center"}}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",padding:"6px 16px",borderTop:"1px solid #1a1f2e",background:"#070910",gap:14,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"#333",fontFamily:"monospace"}}>{filtered.length} of {db.length} profiles</span>
        <span style={{fontSize:11,color:"#333",fontFamily:"monospace"}}>{filtered.filter(r=>r.status==="Wanted").length} wanted in view</span>
        <div style={{flex:1}}/>
        <span style={{fontSize:10,color:"#222",fontFamily:"monospace"}}>Fiji Criminal Intelligence System · FY2026</span>
      </div>
    </div>
  );
}