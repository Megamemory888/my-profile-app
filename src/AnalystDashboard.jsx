import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

// ── Fiji Government Colour Palette ────────────────────────────────────────────
const NAVY      = "#0F2747";   // primary navy
const NAVY_DARK = "#091A33";   // header background
const SLATE     = "#5B6675";   // secondary / muted text
const LIGHT     = "#F5F7FA";   // page background
const CARD      = "#FFFFFF";
const BORDER    = "#D9E1EA";
const TEXT      = "#1B2A3B";   // primary text

// Risk — only place for strong colour in the UI
const RISK_C  = { Severe:"#C62828", High:"#F57C00", Moderate:"#E65100", Low:"#2E7D32" };
const RISK_ORDER = ["Severe","High","Moderate","Low"];
const RISK_SORT  = { Severe:0, High:1, Moderate:2, Low:3 };

const STATUS_C = {
  "Wanted":"#C62828","In Custody":"#5B6675","Released":"#2E7D32",
  "Under Investigation":"#1565C0","Deported":"#37474F","Deceased":"#78909C",
};

// Crime categories — navy/slate palette (colour reduced)
const CRIME_CATEGORIES = [
  { label:"Drugs",          color:"#1565C0", offences:["Drug Trafficking","International Drug Smuggling"] },
  { label:"Financial",      color:"#0F4C75", offences:["Money Laundering","Fraud / Scam","Identity Fraud","Tax Evasion","Bribery","Counterfeit Operations"] },
  { label:"Violence",       color:"#C62828", offences:["Assault","Aggravated Assault","Domestic Violence","Murder / Manslaughter","Sexual Offence"] },
  { label:"Property",       color:"#5D4037", offences:["Theft","Burglary","Vehicle Theft","Robbery","Armed Robbery"] },
  { label:"Organised Crime",color:"#37474F", offences:["Organized Crime Activity","Smuggling","Extortion"] },
  { label:"Cyber",          color:"#2E7D32", offences:["Cybercrime"] },
  { label:"Firearms",       color:"#E65100", offences:["Illegal Firearm Possession"] },
  { label:"Other",          color:"#5B6675", offences:[] },
];

function getCat(o) {
  return CRIME_CATEGORIES.find(c => c.offences.includes(o)) || CRIME_CATEGORIES[CRIME_CATEGORIES.length - 1];
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:3,
      fontSize:9, fontWeight:700, whiteSpace:"nowrap",
      color, background:color+"15", border:`1px solid ${color}40`,
      letterSpacing:"0.06em", textTransform:"uppercase",
    }}>{label}</span>
  );
}

// ── Photo Avatar ──────────────────────────────────────────────────────────────
function Avatar({ src, name, size=64, risk }) {
  const borderColor = RISK_C[risk] || BORDER;
  if (src) return (
    <img src={src} alt={name}
      style={{width:size, height:size, borderRadius:4, objectFit:"cover",
        objectPosition:"top center", border:`2px solid ${borderColor}`,
        flexShrink:0, display:"block"}}/>
  );
  const initials = (name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{width:size, height:size, borderRadius:4, background:`${NAVY}14`,
      border:`2px solid ${borderColor}`, display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:size*0.28, fontWeight:700, color:NAVY,
      flexShrink:0, letterSpacing:"0.02em"}}>
      {initials}
    </div>
  );
}

// ── SVG Donut ─────────────────────────────────────────────────────────────────
function DonutChart({ segments, total, size=130 }) {
  const r=50, cx=size/2, cy=size/2, circ=2*Math.PI*r;
  let cum=0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={13}/>
      {segments.filter(s=>s.value>0).map((seg,i)=>{
        const pct=seg.value/total, dash=pct*circ, rot=(cum/total)*360-90;
        cum+=seg.value;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={13}
          strokeDasharray={`${dash} ${circ-dash}`}
          style={{transform:`rotate(${rot}deg)`, transformOrigin:`${cx}px ${cy}px`, transition:"stroke-dasharray 0.6s"}}/>;
      })}
      <text x={cx} y={cy-7} textAnchor="middle" fill={TEXT} fontSize="20" fontWeight="700" fontFamily="monospace">{total}</text>
      <text x={cx} y={cy+9} textAnchor="middle" fill={SLATE} fontSize="8" letterSpacing="0.14em">TOTAL</text>
    </svg>
  );
}

// ── Intel Section Heading ─────────────────────────────────────────────────────
function IntelSection({ title }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:7, margin:"14px 0 8px"}}>
      <div style={{width:3, height:11, background:NAVY, borderRadius:2, flexShrink:0}}/>
      <div style={{fontSize:8, fontWeight:700, color:SLATE, letterSpacing:"0.18em", textTransform:"uppercase"}}>{title}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AnalystDashboard({ onLogout }) {
  const [profiles,   setProfiles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [time,       setTime]       = useState("");
  const [search,     setSearch]     = useState("");
  const [catFilters, setCatFilters] = useState(new Set());
  const [riskFilter, setRiskFilter] = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [sortCol,    setSortCol]    = useState("risk");
  const [sortDir,    setSortDir]    = useState("asc");

  useEffect(()=>{
    const tick=()=>setTime(new Date().toLocaleTimeString("en-FJ",{hour12:false}));
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const load=async()=>{
      const{data}=await supabase.from("criminal_profiles")
        .select("id,name,alias,risk,status,primary_offence,secondary_offence,nationality_type,deportation_status,gang_affiliation,convictions,location,photo_url,dob,gender,arrest_year")
        .order("risk");
      if(data) setProfiles(data);
      setLoading(false);
    };
    load();
  },[]);

  const stats=useMemo(()=>({
    total:     profiles.length,
    wanted:    profiles.filter(p=>p.status==="Wanted").length,
    inCustody: profiles.filter(p=>p.status==="In Custody").length,
    severe:    profiles.filter(p=>p.risk==="Severe").length,
    high:      profiles.filter(p=>p.risk==="High").length,
    foreign:   profiles.filter(p=>p.nationality_type==="Foreign National").length,
    photos:    profiles.filter(p=>p.photo_url).length,
  }),[profiles]);

  const crimeBreakdown=useMemo(()=>
    CRIME_CATEGORIES.map(cat=>({...cat,
      count:profiles.filter(p=>cat.offences.length
        ?cat.offences.includes(p.primary_offence)
        :!CRIME_CATEGORIES.slice(0,-1).some(c=>c.offences.includes(p.primary_offence))).length
    })).filter(c=>c.count>0).sort((a,b)=>b.count-a.count),
  [profiles]);

  const maxCount=Math.max(...crimeBreakdown.map(c=>c.count),1);

  const riskBreakdown=useMemo(()=>
    RISK_ORDER.map(r=>({label:r,value:profiles.filter(p=>p.risk===r).length,color:RISK_C[r]})).filter(r=>r.value>0),
  [profiles]);

  const tableRows=useMemo(()=>{
    let r=profiles;
    if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>
      p.name?.toLowerCase().includes(q)||p.alias?.toLowerCase().includes(q)||
      p.id?.toLowerCase().includes(q)||p.location?.toLowerCase().includes(q)||
      p.primary_offence?.toLowerCase().includes(q));}
    if(catFilters.size>0) r=r.filter(p=>catFilters.has(getCat(p.primary_offence).label));
    if(riskFilter) r=r.filter(p=>p.risk===riskFilter);
    return [...r].sort((a,b)=>{
      let av,bv;
      if(sortCol==="risk"){av=RISK_SORT[a.risk]??9;bv=RISK_SORT[b.risk]??9;}
      else if(sortCol==="convictions"){av=a.convictions||0;bv=b.convictions||0;}
      else{av=a[sortCol]||"";bv=b[sortCol]||"";}
      return av<bv?(sortDir==="asc"?-1:1):av>bv?(sortDir==="asc"?1:-1):0;
    });
  },[profiles,search,catFilters,riskFilter,sortCol,sortDir]);

  const toggleCat=label=>setCatFilters(prev=>{const n=new Set(prev);n.has(label)?n.delete(label):n.add(label);return n;});
  const handleSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");}};
  const SortIcon=({col})=>sortCol===col
    ?<span style={{color:NAVY,marginLeft:3,fontSize:8}}>{sortDir==="asc"?"▲":"▼"}</span>
    :<span style={{color:"#CBD5E1",marginLeft:3,fontSize:8}}>⬍</span>;
  const hasFilters=search||riskFilter||catFilters.size>0;
  const clearAll=()=>{setSearch("");setRiskFilter(null);setCatFilters(new Set());};

  if(loading) return(
    <div style={{background:LIGHT,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${BORDER}`,borderTopColor:NAVY,animation:"spin 0.9s linear infinite"}}/>
      <div style={{color:SLATE,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase"}}>Loading Intelligence Data…</div>
    </div>
  );

  const INSP = 340;

  // KPI strip — white cards, coloured indicator only
  const KPI_ITEMS = [
    { label:"TOTAL PROFILES",    value:stats.total,     dot:NAVY      },
    { label:"WANTED",            value:stats.wanted,    dot:"#C62828" },
    { label:"IN CUSTODY",        value:stats.inCustody, dot:"#5B6675" },
    { label:"SEVERE RISK",       value:stats.severe,    dot:"#C62828" },
    { label:"HIGH RISK",         value:stats.high,      dot:"#F57C00" },
    { label:"FOREIGN NATIONALS", value:stats.foreign,   dot:"#1565C0" },
    { label:"PHOTOS ON FILE",    value:stats.photos,    dot:"#2E7D32" },
  ];

  return(
    <div style={{background:LIGHT,minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",color:TEXT}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${LIGHT}}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
        input::placeholder{color:#94A3B8}
        input:focus{border-color:${NAVY}!important;outline:none;box-shadow:0 0 0 2px ${NAVY}1A}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        .prof-row:hover td{background:#EDF3F9!important;cursor:pointer}
        th{user-select:none;cursor:pointer}
        th:hover{color:${NAVY}!important}
        .insp-field{display:flex;justify-content:space-between;align-items:flex-start;gap:10;padding:7px 0;border-bottom:1px solid ${BORDER}}
        .insp-field:last-child{border-bottom:none}
      `}</style>

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:58,zIndex:400,
        background:NAVY_DARK,display:"flex",alignItems:"center",padding:"0 18px",
        gap:12,boxShadow:"0 2px 12px rgba(0,0,0,0.35)"}}>
        <div style={{width:38,height:38,borderRadius:4,background:"rgba(255,255,255,0.08)",
          border:"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:20,flexShrink:0}}>🇫🇯</div>
        <div style={{borderRight:"1px solid rgba(255,255,255,0.12)",paddingRight:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#FFFFFF",letterSpacing:"0.07em",lineHeight:1.25}}>
            FIJI CENTRAL CRIMINAL INTELLIGENCE SYSTEM
          </div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.45)",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:2}}>
            Republic of Fiji · Ministry of Home Affairs &amp; Immigration
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#4ADE80",animation:"pulse 2.5s infinite"}}/>
          <span style={{fontSize:8,color:"#4ADE80",letterSpacing:"0.12em",fontWeight:700,textTransform:"uppercase"}}>System Online</span>
        </div>
        <div style={{width:1,height:22,background:"rgba(255,255,255,0.12)",margin:"0 6px"}}/>
        <div style={{fontFamily:"monospace",fontSize:11,color:"rgba(255,255,255,0.45)",minWidth:58,textAlign:"right"}}>{time}</div>
        <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",letterSpacing:"0.08em",textTransform:"uppercase"}}>{profiles.length} RECORDS</div>
        <button onClick={onLogout}
          style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",
            color:"rgba(255,255,255,0.65)",fontSize:8,padding:"5px 12px",borderRadius:3,
            cursor:"pointer",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}}>
          Sign Out
        </button>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div style={{position:"fixed",top:58,left:0,right:0,height:70,zIndex:300,
        background:CARD,borderBottom:`1px solid ${BORDER}`,display:"flex",
        alignItems:"stretch",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        {KPI_ITEMS.map((s,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",borderRight:`1px solid ${BORDER}`,padding:"0 8px",
            position:"relative"}}>
            {/* 3px coloured bar at top — the only colour on these cards */}
            <div style={{position:"absolute",top:0,left:4,right:4,height:3,background:s.dot,borderRadius:"0 0 2px 2px"}}/>
            <div style={{fontSize:22,fontWeight:700,color:TEXT,fontFamily:"monospace",lineHeight:1,marginTop:4}}>{s.value}</div>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
              <div style={{fontSize:7.5,color:SLATE,letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div style={{paddingTop:128,display:"flex",minHeight:"100vh"}}>

        {/* LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div style={{width:208,flexShrink:0,position:"sticky",top:128,alignSelf:"flex-start",
          height:"calc(100vh - 128px)",overflowY:"auto",borderRight:`1px solid ${BORDER}`,
          padding:"14px 10px",background:CARD}}>

          <div style={{fontSize:7.5,fontWeight:700,color:NAVY,letterSpacing:"0.18em",
            textTransform:"uppercase",marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${BORDER}`}}>
            Crime Category
          </div>
          {CRIME_CATEGORIES.map(cat=>{
            const cnt=profiles.filter(p=>cat.offences.length
              ?cat.offences.includes(p.primary_offence)
              :!CRIME_CATEGORIES.slice(0,-1).some(c=>c.offences.includes(p.primary_offence))).length;
            if(!cnt) return null;
            const on=catFilters.has(cat.label);
            return(
              <div key={cat.label} onClick={()=>toggleCat(cat.label)}
                style={{display:"flex",alignItems:"center",gap:7,padding:"5px 6px",borderRadius:3,
                  cursor:"pointer",marginBottom:1,background:on?`${NAVY}0D`:"transparent",
                  border:`1px solid ${on?NAVY+"30":"transparent"}`,transition:"all 0.12s",
                  opacity:catFilters.size>0&&!on?0.35:1}}>
                <div style={{width:3,height:13,borderRadius:1,background:cat.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:on?NAVY:TEXT,flex:1,fontWeight:on?600:400}}>{cat.label}</span>
                <span style={{fontSize:10,color:SLATE,fontFamily:"monospace"}}>{cnt}</span>
              </div>
            );
          })}
          {catFilters.size>0&&(
            <button onClick={()=>setCatFilters(new Set())}
              style={{marginTop:6,width:"100%",padding:"4px",background:`${NAVY}0A`,
                border:`1px solid ${NAVY}28`,borderRadius:3,color:NAVY,fontSize:8,
                cursor:"pointer",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>
              Clear Filter
            </button>
          )}

          <div style={{height:1,background:BORDER,margin:"12px 0"}}/>

          <div style={{fontSize:7.5,fontWeight:700,color:NAVY,letterSpacing:"0.18em",
            textTransform:"uppercase",marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${BORDER}`}}>
            Risk Level
          </div>
          {RISK_ORDER.map(r=>{
            const cnt=profiles.filter(p=>p.risk===r).length;
            if(!cnt) return null;
            const on=riskFilter===r;
            return(
              <div key={r} onClick={()=>setRiskFilter(on?null:r)}
                style={{display:"flex",alignItems:"center",gap:7,padding:"5px 6px",borderRadius:3,
                  cursor:"pointer",marginBottom:1,background:on?`${RISK_C[r]}12`:"transparent",
                  border:`1px solid ${on?RISK_C[r]+"44":"transparent"}`,transition:"all 0.12s"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:RISK_C[r],flexShrink:0}}/>
                <span style={{fontSize:11,color:on?RISK_C[r]:TEXT,flex:1,fontWeight:on?600:400}}>{r}</span>
                <span style={{fontSize:10,color:RISK_C[r],fontFamily:"monospace",fontWeight:700}}>{cnt}</span>
              </div>
            );
          })}

          <div style={{height:1,background:BORDER,margin:"14px 0"}}/>
          <div style={{fontSize:7.5,color:SLATE,textAlign:"center",letterSpacing:"0.08em",lineHeight:2.2,textTransform:"uppercase"}}>
            Read-Only Access<br/>Analyst Clearance<br/>NCIC · Official
          </div>
        </div>

        {/* MAIN CONTENT ──────────────────────────────────────────────────── */}
        <div style={{flex:1,padding:"18px 20px",paddingRight:selected?INSP+20:20,
          transition:"padding-right 0.25s ease",minWidth:0}}>

          {/* CHARTS ROW */}
          <div style={{display:"flex",gap:16,marginBottom:18}}>

            {/* Crime Breakdown */}
            <div style={{flex:2,background:CARD,borderRadius:4,padding:"16px 18px",
              border:`1px solid ${BORDER}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,
                paddingBottom:8,borderBottom:`1px solid ${BORDER}`}}>
                <div style={{width:3,height:12,background:NAVY,borderRadius:1}}/>
                <div style={{fontSize:8,fontWeight:700,color:NAVY,letterSpacing:"0.14em",textTransform:"uppercase"}}>
                  Crime Category Distribution
                </div>
              </div>
              {crimeBreakdown.map(cat=>(
                <div key={cat.label} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>toggleCat(cat.label)}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:3,height:10,background:cat.color,borderRadius:1}}/>
                      <span style={{fontSize:11,color:catFilters.has(cat.label)?NAVY:TEXT,fontWeight:catFilters.has(cat.label)?600:400}}>{cat.label}</span>
                    </div>
                    <span style={{fontSize:11,color:SLATE,fontFamily:"monospace"}}>{cat.count}</span>
                  </div>
                  <div style={{height:6,background:"#EEF1F5",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:2,width:`${(cat.count/maxCount)*100}%`,
                      background:catFilters.has(cat.label)?NAVY:cat.color,
                      opacity:catFilters.has(cat.label)?1:0.7,transition:"width 0.8s ease"}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Donut */}
            <div style={{flex:1,background:CARD,borderRadius:4,padding:"16px 18px",
              border:`1px solid ${BORDER}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
              display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,
                paddingBottom:8,borderBottom:`1px solid ${BORDER}`,alignSelf:"stretch"}}>
                <div style={{width:3,height:12,background:NAVY,borderRadius:1}}/>
                <div style={{fontSize:8,fontWeight:700,color:NAVY,letterSpacing:"0.14em",textTransform:"uppercase"}}>
                  Risk Distribution
                </div>
              </div>
              <DonutChart segments={riskBreakdown} total={stats.total}/>
              <div style={{marginTop:12,width:"100%"}}>
                {riskBreakdown.map(r=>(
                  <div key={r.label} onClick={()=>setRiskFilter(riskFilter===r.label?null:r.label)}
                    style={{display:"flex",alignItems:"center",gap:7,padding:"6px 0",
                      cursor:"pointer",borderBottom:`1px solid ${BORDER}`}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:r.color,flexShrink:0}}/>
                    <span style={{fontSize:11,color:riskFilter===r.label?r.color:TEXT,flex:1,fontWeight:riskFilter===r.label?600:400}}>{r.label}</span>
                    <span style={{fontSize:11,color:r.color,fontFamily:"monospace",fontWeight:700}}>{r.value}</span>
                    <span style={{fontSize:9,color:SLATE,fontFamily:"monospace",minWidth:28,textAlign:"right"}}>{Math.round(r.value/stats.total*100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div style={{background:CARD,borderRadius:4,border:`1px solid ${BORDER}`,
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>

            {/* Table toolbar */}
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${BORDER}`,
              display:"flex",alignItems:"center",gap:10,background:"#F8FAFC",
              borderRadius:"4px 4px 0 0"}}>
              <div style={{width:3,height:14,background:NAVY,borderRadius:1,flexShrink:0}}/>
              <div style={{flex:1}}>
                <span style={{fontSize:9,fontWeight:700,color:NAVY,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                  Criminal Intelligence Records
                </span>
                <span style={{marginLeft:8,fontSize:10,color:SLATE,fontFamily:"monospace"}}>
                  {tableRows.length}
                  {tableRows.length!==profiles.length&&<span style={{color:"#CBD5E1"}}> / {profiles.length}</span>}
                </span>
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search name, ID, offence, location…"
                style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:3,
                  padding:"5px 10px",color:TEXT,fontSize:11,width:260}}/>
              {hasFilters&&(
                <button onClick={clearAll}
                  style={{background:"transparent",border:`1px solid ${BORDER}`,color:SLATE,
                    fontSize:8,padding:"5px 12px",borderRadius:3,cursor:"pointer",
                    fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>
                  Clear All
                </button>
              )}
            </div>

            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#F8FAFC",borderBottom:`1px solid ${BORDER}`}}>
                    <th style={{padding:"8px 10px 8px 14px",width:80,textAlign:"center",
                      fontSize:8,fontWeight:700,color:SLATE,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                      Photo
                    </th>
                    {[
                      {key:"id",              label:"Case ID",       w:95},
                      {key:"name",            label:"Subject",       w:155},
                      {key:"risk",            label:"Risk",          w:110},
                      {key:"status",          label:"Status",        w:145},
                      {key:"primary_offence", label:"Primary Offence",w:"auto"},
                      {key:"nationality_type",label:"Origin",        w:70},
                      {key:"convictions",     label:"Conv.",         w:58},
                      {key:"location",        label:"Location",      w:115},
                    ].map(col=>(
                      <th key={col.key} onClick={()=>handleSort(col.key)}
                        style={{padding:"8px 12px",textAlign:"left",fontSize:8,fontWeight:700,
                          color:SLATE,letterSpacing:"0.1em",textTransform:"uppercase",
                          width:col.w,whiteSpace:"nowrap"}}>
                        {col.label}<SortIcon col={col.key}/>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length===0?(
                    <tr><td colSpan={9} style={{padding:44,textAlign:"center",color:SLATE,fontSize:12}}>
                      No profiles match the current filters
                    </td></tr>
                  ):tableRows.map(p=>(
                    <tr key={p.id} className="prof-row"
                      onClick={()=>setSelected(selected?.id===p.id?null:p)}
                      style={{borderBottom:`1px solid ${BORDER}`,
                        background:selected?.id===p.id?"#EDF3F9":"transparent",
                        transition:"background 0.1s"}}>
                      <td style={{padding:"8px 10px 8px 14px",textAlign:"center"}}>
                        <Avatar src={p.photo_url} name={p.name} size={52} risk={p.risk}/>
                      </td>
                      <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:10,color:SLATE}}>{p.id}</td>
                      <td style={{padding:"8px 12px"}}>
                        <div style={{fontSize:12,fontWeight:600,color:TEXT}}>{p.name}</div>
                        {p.alias&&<div style={{fontSize:10,color:SLATE,marginTop:1,fontStyle:"italic"}}>aka {p.alias}</div>}
                      </td>
                      <td style={{padding:"8px 12px"}}>
                        <div style={{display:"inline-flex",alignItems:"center",gap:5}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:RISK_C[p.risk]||SLATE,flexShrink:0}}/>
                          <span style={{fontSize:10,fontWeight:600,color:RISK_C[p.risk]||SLATE}}>{p.risk}</span>
                        </div>
                      </td>
                      <td style={{padding:"8px 12px"}}>
                        <Badge label={p.status||"–"} color={STATUS_C[p.status]||SLATE}/>
                      </td>
                      <td style={{padding:"8px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:TEXT}}>
                          <div style={{width:3,height:10,borderRadius:1,background:getCat(p.primary_offence).color,flexShrink:0}}/>
                          {p.primary_offence}
                        </div>
                      </td>
                      <td style={{padding:"8px 12px",fontSize:10,
                        color:p.nationality_type==="Foreign National"?"#1565C0":SLATE,
                        fontWeight:p.nationality_type==="Foreign National"?600:400}}>
                        {p.nationality_type==="Foreign National"?"Foreign":"Local"}
                      </td>
                      <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,textAlign:"center",
                        color:(p.convictions||0)>2?"#C62828":SLATE,
                        fontWeight:(p.convictions||0)>2?700:400}}>
                        {p.convictions||0}
                      </td>
                      <td style={{padding:"8px 12px",fontSize:11,color:SLATE}}>{p.location||"–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTELLIGENCE BRIEFING PANEL ─────────────────────────────────────── */}
      {selected&&(
        <div style={{position:"fixed",top:128,right:0,bottom:0,width:INSP,background:CARD,
          borderLeft:`1px solid ${BORDER}`,overflowY:"auto",zIndex:350,
          animation:"slideIn 0.2s ease",boxShadow:"-4px 0 16px rgba(0,0,0,0.08)"}}>

          {/* Panel nav */}
          <div style={{background:NAVY_DARK,padding:"11px 14px",display:"flex",
            justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div>
              <div style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.45)",
                letterSpacing:"0.18em",textTransform:"uppercase"}}>Intelligence Brief</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.28)",letterSpacing:"0.08em",marginTop:2}}>
                NCIC · ANALYST READ-ONLY
              </div>
            </div>
            <button onClick={()=>setSelected(null)}
              style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",
                color:"rgba(255,255,255,0.55)",width:24,height:24,borderRadius:3,cursor:"pointer",
                fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
              ✕
            </button>
          </div>

          <div style={{padding:"16px 14px"}}>

            {/* ── PHOTO + IDENTITY ── */}
            <div style={{textAlign:"center",marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${BORDER}`}}>
              {selected.photo_url ? (
                <img src={selected.photo_url} alt={selected.name}
                  style={{width:110,height:132,objectFit:"cover",objectPosition:"top center",
                    borderRadius:4,border:`2px solid ${BORDER}`,marginBottom:10,
                    boxShadow:"0 3px 10px rgba(0,0,0,0.13)",display:"inline-block"}}/>
              ) : (
                <div style={{width:110,height:132,borderRadius:4,background:`${NAVY}0C`,
                  border:`2px solid ${BORDER}`,display:"inline-flex",alignItems:"center",
                  justifyContent:"center",marginBottom:10,boxShadow:"0 2px 6px rgba(0,0,0,0.06)"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:26,color:`${NAVY}35`,marginBottom:4}}>👤</div>
                    <div style={{fontSize:7,color:SLATE,letterSpacing:"0.12em",textTransform:"uppercase"}}>No Photo</div>
                  </div>
                </div>
              )}
              <div style={{fontSize:14,fontWeight:700,color:TEXT,letterSpacing:"0.05em",
                textTransform:"uppercase",lineHeight:1.25}}>{selected.name}</div>
              {selected.alias&&(
                <div style={{fontSize:10,color:SLATE,marginTop:3,fontStyle:"italic"}}>
                  "{selected.alias}"
                </div>
              )}
              <div style={{fontSize:8,color:SLATE,fontFamily:"monospace",marginTop:5,
                letterSpacing:"0.08em",textTransform:"uppercase"}}>
                CASE: {selected.id}
              </div>
            </div>

            {/* ── THREAT ASSESSMENT ── */}
            <IntelSection title="Threat Assessment"/>
            <div style={{background:`${RISK_C[selected.risk]||SLATE}09`,
              border:`1px solid ${RISK_C[selected.risk]||SLATE}28`,
              borderLeft:`3px solid ${RISK_C[selected.risk]||SLATE}`,
              borderRadius:3,padding:"10px 12px",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:RISK_C[selected.risk]||SLATE,flexShrink:0}}/>
                <span style={{fontSize:8,color:SLATE,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Risk Level</span>
                <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:RISK_C[selected.risk]||SLATE,textTransform:"uppercase"}}>
                  {selected.risk}
                </span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:9,height:9,borderRadius:2,background:STATUS_C[selected.status]||SLATE,flexShrink:0}}/>
                <span style={{fontSize:8,color:SLATE,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Status</span>
                <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,
                  color:STATUS_C[selected.status]||SLATE,textTransform:"uppercase"}}>
                  {selected.status||"Unknown"}
                </span>
              </div>
            </div>

            {/* ── CRIMINAL RECORD ── */}
            <IntelSection title="Criminal Record"/>
            {[
              ["Primary Offence",   selected.primary_offence],
              ["Category",          getCat(selected.primary_offence).label],
              ["Secondary Offence", selected.secondary_offence],
              ["Prior Convictions", selected.convictions!=null?`${selected.convictions}`:null],
            ].filter(([,v])=>v).map(([label,val])=>(
              <div key={label} className="insp-field">
                <div style={{fontSize:8,color:SLATE,letterSpacing:"0.08em",textTransform:"uppercase",
                  fontWeight:700,flexShrink:0,paddingTop:1,minWidth:90}}>{label}</div>
                <div style={{fontSize:11,color:label==="Prior Convictions"&&parseInt(val)>2?"#C62828":TEXT,
                  fontWeight:500,textAlign:"right",lineHeight:1.4}}>{val}</div>
              </div>
            ))}

            {/* ── IDENTIFICATION RECORDS ── */}
            <IntelSection title="Identification Records"/>
            <div style={{background:"#F8FAFC",border:`1px solid ${BORDER}`,borderRadius:3,
              padding:"2px 10px",marginBottom:12}}>
              {[
                { label:"Photograph",         on:!!selected.photo_url },
                { label:"Fingerprint",        on:false },
                { label:"Immigration Record", on:selected.nationality_type==="Foreign National" },
                { label:"Prior Arrest Record",on:(selected.convictions||0)>0 },
                { label:"Gang File",          on:!!(selected.gang_affiliation&&selected.gang_affiliation!=="No Gang Affiliation") },
              ].map(({label,on})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",
                  borderBottom:`1px solid ${BORDER}`}}>
                  <span style={{fontSize:13,color:on?"#2E7D32":"#C62828",width:16,
                    textAlign:"center",flexShrink:0,lineHeight:1}}>{on?"✓":"✗"}</span>
                  <span style={{fontSize:10,color:TEXT,flex:1}}>{label}</span>
                  <span style={{fontSize:8,color:on?"#2E7D32":"#C62828",fontWeight:700,
                    letterSpacing:"0.08em",textTransform:"uppercase"}}>{on?"ON FILE":"NO RECORD"}</span>
                </div>
              ))}
            </div>

            {/* ── PERSONAL DETAILS ── */}
            <IntelSection title="Personal Details"/>
            {[
              ["Nationality",   selected.nationality_type],
              ["Date of Birth", selected.dob],
              ["Gender",        selected.gender],
              ["Last Location", selected.location],
              ["Arrest Year",   selected.arrest_year?.toString()],
            ].filter(([,v])=>v).map(([label,val])=>(
              <div key={label} className="insp-field">
                <div style={{fontSize:8,color:SLATE,letterSpacing:"0.08em",textTransform:"uppercase",
                  fontWeight:700,flexShrink:0,paddingTop:1,minWidth:90}}>{label}</div>
                <div style={{fontSize:11,color:TEXT,fontWeight:500,textAlign:"right",lineHeight:1.4}}>{val}</div>
              </div>
            ))}

            {/* ── ADDITIONAL FLAGS (only if relevant) ── */}
            {(selected.gang_affiliation&&selected.gang_affiliation!=="No Gang Affiliation"
              ||selected.deportation_status&&selected.deportation_status!=="Not Deported") && (
              <>
                <IntelSection title="Additional Flags"/>
                {selected.gang_affiliation&&selected.gang_affiliation!=="No Gang Affiliation"&&(
                  <div className="insp-field">
                    <div style={{fontSize:8,color:SLATE,letterSpacing:"0.08em",textTransform:"uppercase",
                      fontWeight:700,flexShrink:0,paddingTop:1,minWidth:90}}>Gang Affiliation</div>
                    <div style={{fontSize:11,color:"#C62828",fontWeight:600,textAlign:"right"}}>{selected.gang_affiliation}</div>
                  </div>
                )}
                {selected.deportation_status&&selected.deportation_status!=="Not Deported"&&(
                  <div className="insp-field">
                    <div style={{fontSize:8,color:SLATE,letterSpacing:"0.08em",textTransform:"uppercase",
                      fontWeight:700,flexShrink:0,paddingTop:1,minWidth:90}}>Deportation</div>
                    <div style={{fontSize:11,color:SLATE,fontWeight:500,textAlign:"right"}}>{selected.deportation_status}</div>
                  </div>
                )}
              </>
            )}

            {/* Footer classification */}
            <div style={{marginTop:20,padding:"10px 12px",background:"#F8FAFC",
              border:`1px solid ${BORDER}`,borderRadius:3,textAlign:"center"}}>
              <div style={{fontSize:7.5,color:SLATE,letterSpacing:"0.1em",textTransform:"uppercase",lineHeight:2}}>
                OFFICIAL — RESTRICTED<br/>
                Authorised Access Only<br/>
                National Criminal Intelligence Centre · Fiji
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
