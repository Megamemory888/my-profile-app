import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

// ── Colour tokens — Government Light Theme ────────────────────────────────────
const NAV_BG   = "#1B3A6B";   // dark navy header / sidebar accents
const NAV_TEXT = "#FFFFFF";
const BG       = "#F0F4F8";   // light blue-grey page background
const CARD     = "#FFFFFF";
const BORDER   = "#D1DCE8";
const TEXT     = "#1E293B";
const MUTED    = "#64748B";
const ACCENT   = "#1B3A6B";

const CRIME_COLORS = {
  "Drug Trafficking":"#7C3AED","International Drug Smuggling":"#6D28D9",
  "Money Laundering":"#1D4ED8","Fraud / Scam":"#0369A1","Identity Fraud":"#0284C7",
  "Tax Evasion":"#0F766E","Bribery":"#059669","Counterfeit Operations":"#047857",
  "Assault":"#DC2626","Aggravated Assault":"#B91C1C","Domestic Violence":"#EF4444",
  "Murder / Manslaughter":"#7F1D1D","Sexual Offence":"#BE185D",
  "Theft":"#D97706","Burglary":"#B45309","Vehicle Theft":"#92400E",
  "Robbery":"#EA580C","Armed Robbery":"#C2410C",
  "Organized Crime Activity":"#991B1B","Smuggling":"#9D174D","Extortion":"#7E22CE",
  "Cybercrime":"#0D9488","Illegal Firearm Possession":"#4338CA",
  "Other":"#64748B",
};

const CRIME_CATEGORIES = [
  { label:"Drugs",          color:"#7C3AED", offences:["Drug Trafficking","International Drug Smuggling"] },
  { label:"Financial",      color:"#1D4ED8", offences:["Money Laundering","Fraud / Scam","Identity Fraud","Tax Evasion","Bribery","Counterfeit Operations"] },
  { label:"Violence",       color:"#DC2626", offences:["Assault","Aggravated Assault","Domestic Violence","Murder / Manslaughter","Sexual Offence"] },
  { label:"Property",       color:"#D97706", offences:["Theft","Burglary","Vehicle Theft","Robbery","Armed Robbery"] },
  { label:"Organised Crime",color:"#991B1B", offences:["Organized Crime Activity","Smuggling","Extortion"] },
  { label:"Cyber",          color:"#0D9488", offences:["Cybercrime"] },
  { label:"Firearms",       color:"#4338CA", offences:["Illegal Firearm Possession"] },
  { label:"Other",          color:"#64748B", offences:[] },
];

const RISK_COLORS  = { Severe:"#DC2626", High:"#EA580C", Moderate:"#CA8A04", Low:"#16A34A" };
const RISK_ORDER   = ["Severe","High","Moderate","Low"];
const RISK_SORT    = { Severe:0, High:1, Moderate:2, Low:3 };

const STATUS_COLORS = {
  "Wanted":"#DC2626","In Custody":"#EA580C","Released":"#16A34A",
  "Under Investigation":"#2563EB","Deported":"#7C3AED","Deceased":"#64748B",
};

function getCat(o) {
  return CRIME_CATEGORIES.find(c => c.offences.includes(o)) || CRIME_CATEGORIES[CRIME_CATEGORIES.length-1];
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 9px", borderRadius:4,
      fontSize:10, fontWeight:600, whiteSpace:"nowrap",
      color, background:color+"18", border:`1px solid ${color}44`,
      letterSpacing:"0.02em",
    }}>{label}</span>
  );
}

// ── SVG Donut ─────────────────────────────────────────────────────────────────
function DonutChart({ segments, total, size=136 }) {
  const r=50, cx=size/2, cy=size/2, circ=2*Math.PI*r;
  let cum=0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={16}/>
      {segments.filter(s=>s.value>0).map((seg,i)=>{
        const pct=seg.value/total, dash=pct*circ, rot=(cum/total)*360-90;
        cum+=seg.value;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={16}
          strokeDasharray={`${dash} ${circ-dash}`}
          style={{ transform:`rotate(${rot}deg)`, transformOrigin:`${cx}px ${cy}px`, transition:"stroke-dasharray 0.6s" }}/>;
      })}
      <text x={cx} y={cy-8} textAnchor="middle" fill={TEXT} fontSize="22" fontWeight="700" fontFamily="monospace">{total}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={MUTED} fontSize="9" letterSpacing="0.12em" fontFamily="Inter,sans-serif">PROFILES</text>
    </svg>
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
    gangs:     profiles.filter(p=>p.gang_affiliation&&p.gang_affiliation!=="No Gang Affiliation").length,
  }),[profiles]);

  const crimeBreakdown=useMemo(()=>
    CRIME_CATEGORIES.map(cat=>({...cat,
      count:profiles.filter(p=>cat.offences.length?cat.offences.includes(p.primary_offence):!CRIME_CATEGORIES.slice(0,-1).some(c=>c.offences.includes(p.primary_offence))).length
    })).filter(c=>c.count>0).sort((a,b)=>b.count-a.count),
  [profiles]);

  const maxCount=Math.max(...crimeBreakdown.map(c=>c.count),1);

  const riskBreakdown=useMemo(()=>
    RISK_ORDER.map(r=>({label:r,value:profiles.filter(p=>p.risk===r).length,color:RISK_COLORS[r]})).filter(r=>r.value>0),
  [profiles]);

  const tableRows=useMemo(()=>{
    let r=profiles;
    if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>p.name?.toLowerCase().includes(q)||p.alias?.toLowerCase().includes(q)||p.id?.toLowerCase().includes(q)||p.location?.toLowerCase().includes(q)||p.primary_offence?.toLowerCase().includes(q));}
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
    ?<span style={{color:ACCENT,marginLeft:3}}>{sortDir==="asc"?"↑":"↓"}</span>
    :<span style={{color:"#CBD5E1",marginLeft:3}}>↕</span>;
  const hasFilters=search||riskFilter||catFilters.size>0;
  const clearAll=()=>{setSearch("");setRiskFilter(null);setCatFilters(new Set());};

  if(loading) return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${BORDER}`,borderTopColor:ACCENT,animation:"spin 0.9s linear infinite"}}/>
      <div style={{color:MUTED,fontSize:12}}>Loading intelligence data…</div>
    </div>
  );

  const INSP=330;

  return(
    <div style={{background:BG,minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",color:TEXT}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#F1F5F9}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
        input::placeholder{color:#94A3B8}
        input:focus{border-color:${ACCENT}!important;outline:none;box-shadow:0 0 0 2px ${ACCENT}22}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        .prof-row:hover td{background:#EEF4FF!important;cursor:pointer}
        th{user-select:none;cursor:pointer}
        th:hover{color:${ACCENT}!important}
      `}</style>

      {/* ── TOP BAR (navy) */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:52,zIndex:400,background:NAV_BG,display:"flex",alignItems:"center",padding:"0 20px",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,0.18)"}}>
        <div style={{width:34,height:34,borderRadius:6,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🛡️</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:NAV_TEXT,letterSpacing:"0.05em"}}>NCIC</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Intelligence Centre · Fiji</div>
        </div>
        <div style={{width:1,height:28,background:"rgba(255,255,255,0.18)",marginLeft:4}}/>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.75)",fontWeight:500}}>Crime Intelligence Dashboard</div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#4ADE80",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:10,color:"#4ADE80",letterSpacing:"0.08em",fontWeight:600}}>LIVE</span>
        </div>
        <div style={{fontFamily:"monospace",fontSize:11,color:"rgba(255,255,255,0.6)",minWidth:64,textAlign:"right"}}>{time}</div>
        <div style={{width:1,height:28,background:"rgba(255,255,255,0.18)"}}/>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontFamily:"monospace"}}>{profiles.length} records</span>
        <button onClick={onLogout}
          style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.85)",fontSize:10,padding:"5px 12px",borderRadius:5,cursor:"pointer"}}>
          Sign out
        </button>
      </div>

      {/* ── KPI STRIP (white bar under nav) */}
      <div style={{position:"fixed",top:52,left:0,right:0,height:68,zIndex:300,background:CARD,borderBottom:`2px solid ${BORDER}`,display:"flex",alignItems:"stretch",boxShadow:"0 2px 6px rgba(0,0,0,0.06)"}}>
        {[
          {l:"Total Profiles",    v:stats.total,     c:ACCENT},
          {l:"Wanted",            v:stats.wanted,    c:"#DC2626"},
          {l:"In Custody",        v:stats.inCustody, c:"#EA580C"},
          {l:"Severe Risk",       v:stats.severe,    c:"#B91C1C"},
          {l:"High Risk",         v:stats.high,      c:"#CA8A04"},
          {l:"Foreign Nationals", v:stats.foreign,   c:"#7C3AED"},
          {l:"Gang-Affiliated",   v:stats.gangs,     c:"#BE185D"},
        ].map((s,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRight:`1px solid ${BORDER}`,padding:"0 6px",borderTop:`3px solid ${s.c}`}}>
            <div style={{fontSize:26,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:9,color:MUTED,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:4,textAlign:"center"}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── BODY */}
      <div style={{paddingTop:120,display:"flex",minHeight:"100vh"}}>

        {/* LEFT SIDEBAR */}
        <div style={{width:216,flexShrink:0,position:"sticky",top:120,alignSelf:"flex-start",height:"calc(100vh - 120px)",overflowY:"auto",borderRight:`1px solid ${BORDER}`,padding:"16px 12px",background:CARD}}>

          <div style={{fontSize:9,fontWeight:700,color:ACCENT,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`2px solid ${ACCENT}`}}>Category Filter</div>
          {CRIME_CATEGORIES.map(cat=>{
            const cnt=profiles.filter(p=>cat.offences.length?cat.offences.includes(p.primary_offence):!CRIME_CATEGORIES.slice(0,-1).some(c=>c.offences.includes(p.primary_offence))).length;
            if(!cnt) return null;
            const on=catFilters.has(cat.label);
            return(
              <div key={cat.label} onClick={()=>toggleCat(cat.label)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",marginBottom:2,background:on?`${cat.color}12`:"transparent",border:`1px solid ${on?cat.color+"66":"transparent"}`,transition:"all 0.15s",opacity:catFilters.size>0&&!on?0.4:1}}>
                <div style={{width:8,height:8,borderRadius:2,background:cat.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:on?cat.color:TEXT,flex:1,fontWeight:on?600:400}}>{cat.label}</span>
                <span style={{fontSize:10,color:cat.color,fontFamily:"monospace",fontWeight:700}}>{cnt}</span>
              </div>
            );
          })}
          {catFilters.size>0&&(
            <button onClick={()=>setCatFilters(new Set())}
              style={{marginTop:8,width:"100%",padding:"5px",background:`${ACCENT}10`,border:`1px solid ${ACCENT}40`,borderRadius:4,color:ACCENT,fontSize:10,cursor:"pointer",fontWeight:600}}>
              Clear filter
            </button>
          )}

          <div style={{height:1,background:BORDER,margin:"14px 0"}}/>

          <div style={{fontSize:9,fontWeight:700,color:ACCENT,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`2px solid ${ACCENT}`}}>Risk Level</div>
          {RISK_ORDER.map(r=>(
            <div key={r} onClick={()=>setRiskFilter(riskFilter===r?null:r)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",marginBottom:2,background:riskFilter===r?`${RISK_COLORS[r]}12`:"transparent",border:`1px solid ${riskFilter===r?RISK_COLORS[r]+"55":"transparent"}`,transition:"all 0.15s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:RISK_COLORS[r],flexShrink:0}}/>
              <span style={{fontSize:11,color:riskFilter===r?RISK_COLORS[r]:TEXT,flex:1,fontWeight:riskFilter===r?600:400}}>{r}</span>
              <span style={{fontSize:10,color:RISK_COLORS[r],fontFamily:"monospace",fontWeight:700}}>{profiles.filter(p=>p.risk===r).length}</span>
            </div>
          ))}

          <div style={{height:1,background:BORDER,margin:"14px 0"}}/>
          <div style={{fontSize:9,color:MUTED,textAlign:"center",letterSpacing:"0.06em",lineHeight:1.8}}>
            READ-ONLY · ANALYST VIEW<br/>NCIC FIJI · OFFICIAL
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,padding:"20px 22px",paddingRight:selected?INSP+22:22,transition:"padding-right 0.25s ease",minWidth:0}}>

          {/* CHARTS */}
          <div style={{display:"flex",gap:18,marginBottom:20}}>

            {/* Bar chart */}
            <div style={{flex:2,background:CARD,borderRadius:8,padding:"18px 22px",border:`1px solid ${BORDER}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:10,fontWeight:700,color:ACCENT,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,paddingBottom:8,borderBottom:`2px solid ${ACCENT}`}}>
                Crime Category Breakdown
              </div>
              {crimeBreakdown.map(cat=>(
                <div key={cat.label} style={{marginBottom:12,cursor:"pointer"}} onClick={()=>toggleCat(cat.label)}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:catFilters.has(cat.label)?cat.color:TEXT,fontWeight:catFilters.has(cat.label)?600:400}}>{cat.label}</span>
                    <span style={{fontSize:12,color:cat.color,fontFamily:"monospace",fontWeight:700}}>{cat.count}</span>
                  </div>
                  <div style={{height:8,background:"#F1F5F9",borderRadius:4,overflow:"hidden",border:`1px solid ${BORDER}`}}>
                    <div style={{height:"100%",borderRadius:4,background:cat.color,width:`${(cat.count/maxCount)*100}%`,transition:"width 0.8s ease"}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut */}
            <div style={{flex:1,background:CARD,borderRadius:8,padding:"18px 22px",border:`1px solid ${BORDER}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:ACCENT,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,paddingBottom:8,borderBottom:`2px solid ${ACCENT}`,alignSelf:"stretch"}}>
                Risk Distribution
              </div>
              <DonutChart segments={riskBreakdown} total={stats.total}/>
              <div style={{marginTop:14,width:"100%"}}>
                {riskBreakdown.map(r=>(
                  <div key={r.label} onClick={()=>setRiskFilter(riskFilter===r.label?null:r.label)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",cursor:"pointer",borderBottom:`1px solid ${BORDER}`}}>
                    <div style={{width:10,height:10,borderRadius:2,background:r.color,flexShrink:0}}/>
                    <span style={{fontSize:11,color:riskFilter===r.label?r.color:TEXT,flex:1,fontWeight:riskFilter===r.label?600:400}}>{r.label}</span>
                    <span style={{fontSize:11,color:r.color,fontFamily:"monospace",fontWeight:700}}>{r.value}</span>
                    <span style={{fontSize:10,color:MUTED,fontFamily:"monospace",minWidth:30,textAlign:"right"}}>{Math.round(r.value/stats.total*100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div style={{background:CARD,borderRadius:8,border:`1px solid ${BORDER}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{padding:"12px 20px",borderBottom:`2px solid ${ACCENT}`,display:"flex",alignItems:"center",gap:12,background:ACCENT,borderRadius:"8px 8px 0 0"}}>
              <div style={{flex:1,fontSize:11,fontWeight:700,color:NAV_TEXT,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                Criminal Profiles
                <span style={{marginLeft:8,color:"rgba(255,255,255,0.75)",fontFamily:"monospace"}}>{tableRows.length}</span>
                {tableRows.length!==profiles.length&&<span style={{color:"rgba(255,255,255,0.5)"}}> / {profiles.length}</span>}
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search name, ID, offence, location…"
                style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:5,padding:"6px 12px",color:NAV_TEXT,fontSize:11,width:280}}/>
              {hasFilters&&(
                <button onClick={clearAll}
                  style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:NAV_TEXT,fontSize:10,padding:"6px 14px",borderRadius:5,cursor:"pointer",fontWeight:600}}>
                  Clear all
                </button>
              )}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#F8FAFC",borderBottom:`1px solid ${BORDER}`}}>
                    {[
                      {key:"id",             label:"ID",      w:90},
                      {key:"name",           label:"Name",    w:165},
                      {key:"risk",           label:"Risk",    w:105},
                      {key:"status",         label:"Status",  w:150},
                      {key:"primary_offence",label:"Primary Offence",w:"auto"},
                      {key:"nationality_type",label:"Nat.",   w:80},
                      {key:"convictions",    label:"Conv.",   w:65},
                      {key:"location",       label:"Location",w:130},
                    ].map(col=>(
                      <th key={col.key} onClick={()=>handleSort(col.key)}
                        style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",width:col.w,whiteSpace:"nowrap"}}>
                        {col.label}<SortIcon col={col.key}/>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length===0?(
                    <tr><td colSpan={8} style={{padding:44,textAlign:"center",color:MUTED,fontSize:13}}>No profiles match your filters</td></tr>
                  ):tableRows.map(p=>(
                    <tr key={p.id} className="prof-row"
                      onClick={()=>setSelected(selected?.id===p.id?null:p)}
                      style={{borderBottom:`1px solid ${BORDER}`,background:selected?.id===p.id?"#EEF4FF":"transparent",transition:"background 0.1s"}}>
                      <td style={{padding:"10px 14px",fontFamily:"monospace",fontSize:11,color:MUTED}}>{p.id}</td>
                      <td style={{padding:"10px 14px"}}>
                        <div style={{fontSize:12,fontWeight:600,color:TEXT}}>{p.name}</div>
                        {p.alias&&<div style={{fontSize:10,color:MUTED,marginTop:1}}>aka {p.alias}</div>}
                      </td>
                      <td style={{padding:"10px 14px"}}><Badge label={p.risk} color={RISK_COLORS[p.risk]||MUTED}/></td>
                      <td style={{padding:"10px 14px"}}><Badge label={p.status||"–"} color={STATUS_COLORS[p.status]||MUTED}/></td>
                      <td style={{padding:"10px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:TEXT}}>
                          <div style={{width:6,height:6,borderRadius:1,background:CRIME_COLORS[p.primary_offence]||"#64748B",flexShrink:0}}/>
                          {p.primary_offence}
                        </div>
                      </td>
                      <td style={{padding:"10px 14px",fontSize:10,color:p.nationality_type==="Foreign National"?"#7C3AED":MUTED,fontWeight:p.nationality_type==="Foreign National"?600:400}}>
                        {p.nationality_type==="Foreign National"?"🌍 Foreign":"Local"}
                      </td>
                      <td style={{padding:"10px 14px",fontFamily:"monospace",fontSize:11,color:(p.convictions||0)>2?"#DC2626":MUTED,textAlign:"center",fontWeight:(p.convictions||0)>2?700:400}}>
                        {p.convictions||0}
                      </td>
                      <td style={{padding:"10px 14px",fontSize:11,color:MUTED}}>{p.location||"–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT INSPECTOR */}
      {selected&&(
        <div style={{position:"fixed",top:120,right:0,bottom:0,width:INSP,background:CARD,borderLeft:`2px solid ${BORDER}`,padding:"18px 16px",overflowY:"auto",zIndex:350,animation:"slideIn 0.2s ease",boxShadow:"-4px 0 16px rgba(0,0,0,0.08)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${ACCENT}`}}>
            <div style={{fontSize:10,fontWeight:700,color:ACCENT,letterSpacing:"0.12em",textTransform:"uppercase"}}>Profile Detail</div>
            <button onClick={()=>setSelected(null)}
              style={{background:"#F1F5F9",border:`1px solid ${BORDER}`,color:MUTED,width:26,height:26,borderRadius:5,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
              ✕
            </button>
          </div>

          <div style={{background:`linear-gradient(135deg,${CRIME_COLORS[selected.primary_offence]||"#64748B"}0D,#EEF4FF)`,border:`1px solid ${CRIME_COLORS[selected.primary_offence]||"#64748B"}33`,borderRadius:8,padding:16,marginBottom:18}}>
            {selected.photo_url&&(
              <img src={selected.photo_url} alt=""
                style={{width:58,height:58,borderRadius:7,objectFit:"cover",objectPosition:"top center",marginBottom:12,border:`2px solid ${BORDER}`}}/>
            )}
            <div style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:3}}>{selected.name}</div>
            {selected.alias&&<div style={{fontSize:11,color:MUTED,marginBottom:12}}>aka {selected.alias}</div>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Badge label={selected.risk} color={RISK_COLORS[selected.risk]||MUTED}/>
              <Badge label={selected.status||"–"} color={STATUS_COLORS[selected.status]||MUTED}/>
              {selected.nationality_type==="Foreign National"&&<Badge label="Foreign" color="#7C3AED"/>}
              {selected.gang_affiliation&&selected.gang_affiliation!=="No Gang Affiliation"&&<Badge label="Gang" color="#DC2626"/>}
            </div>
          </div>

          {[
            ["Case ID",        selected.id],
            ["Primary Offence",selected.primary_offence],
            ["Category",       getCat(selected.primary_offence).label],
            ["Secondary",      selected.secondary_offence],
            ["Location",       selected.location],
            ["Gender",         selected.gender],
            ["Date of Birth",  selected.dob],
            ["Arrest Year",    selected.arrest_year?.toString()],
            ["Convictions",    selected.convictions!=null?`${selected.convictions} prior conviction${selected.convictions!==1?"s":""}`:null],
            ["Nationality",    selected.nationality_type],
            ["Gang",           selected.gang_affiliation&&selected.gang_affiliation!=="No Gang Affiliation"?selected.gang_affiliation:null],
            ["Deportation",    selected.deportation_status&&selected.deportation_status!=="Not Deported"?selected.deportation_status:null],
          ].filter(([,v])=>v).map(([label,val])=>(
            <div key={label} style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${BORDER}`}}>
              <div style={{fontSize:9,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3,fontWeight:600}}>{label}</div>
              <div style={{fontSize:12,color:TEXT,lineHeight:1.5}}>{val}</div>
            </div>
          ))}

          <div style={{marginTop:4,padding:"10px 12px",borderRadius:7,background:`${getCat(selected.primary_offence).color}0D`,border:`1px solid ${getCat(selected.primary_offence).color}44`}}>
            <div style={{fontSize:9,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Crime Category</div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:8,height:8,borderRadius:2,background:getCat(selected.primary_offence).color}}/>
              <span style={{fontSize:12,color:getCat(selected.primary_offence).color,fontWeight:700}}>{getCat(selected.primary_offence).label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
