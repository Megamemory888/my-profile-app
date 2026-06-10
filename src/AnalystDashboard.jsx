import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

// ── Colour constants ──────────────────────────────────────────────────────────
const BG     = "#0F172A";
const CARD   = "#1E293B";
const BORDER = "rgba(148,163,184,0.1)";
const TEXT   = "#F1F5F9";
const MUTED  = "#94A3B8";

const CRIME_COLORS = {
  "Drug Trafficking":"#8B5CF6","International Drug Smuggling":"#7C3AED",
  "Money Laundering":"#3B82F6","Fraud / Scam":"#06B6D4","Identity Fraud":"#0EA5E9",
  "Tax Evasion":"#10B981","Bribery":"#34D399","Counterfeit Operations":"#6EE7B7",
  "Assault":"#EF4444","Aggravated Assault":"#DC2626","Domestic Violence":"#F87171",
  "Murder / Manslaughter":"#7F1D1D","Sexual Offence":"#EC4899",
  "Theft":"#F59E0B","Burglary":"#D97706","Vehicle Theft":"#B45309",
  "Robbery":"#F97316","Armed Robbery":"#EA580C",
  "Organized Crime Activity":"#991B1B","Smuggling":"#BE185D","Extortion":"#9333EA",
  "Cybercrime":"#14B8A6","Illegal Firearm Possession":"#6366F1",
  "Other":"#6B7280",
};

const CRIME_CATEGORIES = [
  { label:"Drugs",          color:"#8B5CF6", offences:["Drug Trafficking","International Drug Smuggling"] },
  { label:"Financial",      color:"#3B82F6", offences:["Money Laundering","Fraud / Scam","Identity Fraud","Tax Evasion","Bribery","Counterfeit Operations"] },
  { label:"Violence",       color:"#EF4444", offences:["Assault","Aggravated Assault","Domestic Violence","Murder / Manslaughter","Sexual Offence"] },
  { label:"Property",       color:"#F59E0B", offences:["Theft","Burglary","Vehicle Theft","Robbery","Armed Robbery"] },
  { label:"Organised Crime",color:"#DC2626", offences:["Organized Crime Activity","Smuggling","Extortion"] },
  { label:"Cyber",          color:"#14B8A6", offences:["Cybercrime"] },
  { label:"Firearms",       color:"#6366F1", offences:["Illegal Firearm Possession"] },
  { label:"Other",          color:"#6B7280", offences:[] },
];

const RISK_COLORS  = { Severe:"#EF4444", High:"#F97316", Moderate:"#EAB308", Low:"#22C55E" };
const RISK_ORDER   = ["Severe","High","Moderate","Low"];
const RISK_SORT    = { Severe:0, High:1, Moderate:2, Low:3 };

const STATUS_COLORS = {
  "Wanted":"#EF4444","In Custody":"#F97316","Released":"#22C55E",
  "Under Investigation":"#60A5FA","Deported":"#8B5CF6","Deceased":"#6B7280",
};

function getCat(offence) {
  return CRIME_CATEGORIES.find(c => c.offences.includes(offence))
      || CRIME_CATEGORIES[CRIME_CATEGORIES.length - 1];
}

// ── Badge pill ────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:99,
      fontSize:10, fontWeight:600, whiteSpace:"nowrap",
      color, background:color+"22", border:`1px solid ${color}44`,
    }}>{label}</span>
  );
}

// ── SVG Donut chart ───────────────────────────────────────────────────────────
function DonutChart({ segments, total, size = 148 }) {
  const r    = 50;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  let cum    = 0;
  const valid = segments.filter(s => s.value > 0);

  return (
    <svg width={size} height={size} style={{ overflow:"visible" }}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={18}/>
      {valid.map((seg, i) => {
        const pct  = seg.value / total;
        const dash = pct * circ;
        const rot  = (cum / total) * 360 - 90;
        cum += seg.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={18}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="butt"
            style={{ transform:`rotate(${rot}deg)`,
                     transformOrigin:`${cx}px ${cy}px`,
                     transition:"stroke-dasharray 0.6s ease" }}
          />
        );
      })}
      <text x={cx} y={cy - 7} textAnchor="middle"
        fill={TEXT} fontSize="22" fontWeight="700" fontFamily="monospace">{total}</text>
      <text x={cx} y={cy + 11} textAnchor="middle"
        fill={MUTED} fontSize="9" letterSpacing="0.12em"
        fontFamily="Inter,sans-serif">PROFILES</text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalystDashboard({ onLogout }) {
  const [profiles,      setProfiles]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [time,          setTime]          = useState("");
  const [search,        setSearch]        = useState("");
  const [catFilters,    setCatFilters]    = useState(new Set());
  const [riskFilter,    setRiskFilter]    = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [sortCol,       setSortCol]       = useState("risk");
  const [sortDir,       setSortDir]       = useState("asc");

  // Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-FJ",{hour12:false}));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch data
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("criminal_profiles")
        .select("id,name,alias,risk,status,primary_offence,secondary_offence,nationality_type,deportation_status,gang_affiliation,convictions,location,photo_url,dob,gender,arrest_year")
        .order("risk");
      if (data) setProfiles(data);
      setLoading(false);
    };
    load();
  }, []);

  // Summary stats
  const stats = useMemo(() => ({
    total:     profiles.length,
    wanted:    profiles.filter(p => p.status === "Wanted").length,
    inCustody: profiles.filter(p => p.status === "In Custody").length,
    severe:    profiles.filter(p => p.risk === "Severe").length,
    high:      profiles.filter(p => p.risk === "High").length,
    foreign:   profiles.filter(p => p.nationality_type === "Foreign National").length,
    gangs:     profiles.filter(p => p.gang_affiliation && p.gang_affiliation !== "No Gang Affiliation").length,
  }), [profiles]);

  // Crime category breakdown
  const crimeBreakdown = useMemo(() =>
    CRIME_CATEGORIES.map(cat => ({
      ...cat,
      count: profiles.filter(p =>
        cat.offences.length
          ? cat.offences.includes(p.primary_offence)
          : !CRIME_CATEGORIES.slice(0,-1).some(c => c.offences.includes(p.primary_offence))
      ).length,
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count),
  [profiles]);

  const maxCount = Math.max(...crimeBreakdown.map(c => c.count), 1);

  // Risk breakdown for donut
  const riskBreakdown = useMemo(() =>
    RISK_ORDER.map(r => ({ label:r, value:profiles.filter(p=>p.risk===r).length, color:RISK_COLORS[r] }))
              .filter(r => r.value > 0),
  [profiles]);

  // Filtered + sorted table rows
  const tableRows = useMemo(() => {
    let result = profiles;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.alias?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.primary_offence?.toLowerCase().includes(q)
      );
    }
    if (catFilters.size > 0)
      result = result.filter(p => catFilters.has(getCat(p.primary_offence).label));
    if (riskFilter)
      result = result.filter(p => p.risk === riskFilter);

    return [...result].sort((a, b) => {
      let av, bv;
      if      (sortCol === "risk")        { av = RISK_SORT[a.risk] ?? 9;  bv = RISK_SORT[b.risk] ?? 9; }
      else if (sortCol === "convictions") { av = a.convictions || 0;      bv = b.convictions || 0; }
      else if (sortCol === "name")        { av = a.name || "";             bv = b.name || ""; }
      else                                { av = a[sortCol] || "";         bv = b[sortCol] || ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [profiles, search, catFilters, riskFilter, sortCol, sortDir]);

  const toggleCat = label => setCatFilters(prev => {
    const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n;
  });

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) =>
    sortCol === col
      ? <span style={{ color:"#818CF8", marginLeft:3 }}>{sortDir==="asc"?"↑":"↓"}</span>
      : <span style={{ color:"rgba(255,255,255,0.2)", marginLeft:3 }}>↕</span>;

  const hasFilters = search || riskFilter || catFilters.size > 0;
  const clearAll   = () => { setSearch(""); setRiskFilter(null); setCatFilters(new Set()); };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background:BG, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:44,height:44, borderRadius:"50%", border:"2px solid rgba(99,102,241,0.25)", borderTopColor:"#6366F1", animation:"spin 1s linear infinite" }}/>
      <div style={{ color:MUTED, fontSize:12, letterSpacing:"0.1em" }}>Loading intelligence data…</div>
    </div>
  );

  const INSP = 324;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
        ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.35);border-radius:3px}
        input::placeholder{color:#475569}
        input:focus{border-color:rgba(99,102,241,0.5)!important;outline:none}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        .prof-row:hover td{background:rgba(99,102,241,0.07)!important;cursor:pointer}
        th{user-select:none;cursor:pointer}
        th:hover{color:#a5b4fc!important}
      `}</style>

      {/* ── TOP BAR */}
      <div style={{ position:"fixed",top:0,left:0,right:0,height:52,zIndex:400, background:"rgba(15,23,42,0.97)",borderBottom:`1px solid ${BORDER}`,backdropFilter:"blur(14px)", display:"flex",alignItems:"center",padding:"0 20px",gap:12 }}>
        <div style={{ width:34,height:34,borderRadius:7, background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)", display:"flex",alignItems:"center",justifyContent:"center",fontSize:17 }}>🛡️</div>
        <div>
          <div style={{ fontSize:13,fontWeight:700,letterSpacing:"0.05em" }}>NCIC</div>
          <div style={{ fontSize:9,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase" }}>Intelligence Centre · Fiji</div>
        </div>
        <div style={{ width:1,height:28,background:BORDER,marginLeft:4 }}/>
        <div style={{ fontSize:11,color:MUTED }}>Crime Intelligence Dashboard</div>
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:"#22C55E",animation:"pulse 2s infinite" }}/>
          <span style={{ fontSize:10,color:"#22C55E",letterSpacing:"0.08em",fontWeight:600 }}>LIVE</span>
        </div>
        <div style={{ fontFamily:"monospace",fontSize:11,color:MUTED,minWidth:64,textAlign:"right" }}>{time}</div>
        <div style={{ width:1,height:28,background:BORDER }}/>
        <span style={{ fontSize:10,color:MUTED,fontFamily:"monospace" }}>{profiles.length} records</span>
        <button onClick={onLogout}
          style={{ background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:MUTED,fontSize:10,padding:"5px 12px",borderRadius:5,cursor:"pointer" }}>
          Sign out
        </button>
      </div>

      {/* ── KPI STRIP */}
      <div style={{ position:"fixed",top:52,left:0,right:0,height:64,zIndex:300, background:"rgba(15,23,42,0.95)",borderBottom:`1px solid ${BORDER}`, display:"flex",alignItems:"stretch" }}>
        {[
          { l:"Total Profiles",    v:stats.total,     c:"#60A5FA" },
          { l:"Wanted",            v:stats.wanted,    c:"#EF4444" },
          { l:"In Custody",        v:stats.inCustody, c:"#F97316" },
          { l:"Severe Risk",       v:stats.severe,    c:"#DC2626" },
          { l:"High Risk",         v:stats.high,      c:"#F59E0B" },
          { l:"Foreign Nationals", v:stats.foreign,   c:"#8B5CF6" },
          { l:"Gang-Affiliated",   v:stats.gangs,     c:"#EC4899" },
        ].map((s,i) => (
          <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center", borderRight:`1px solid ${BORDER}`,padding:"0 6px" }}>
            <div style={{ fontSize:26,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:9,color:MUTED,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:4,textAlign:"center" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── BODY (flex row) */}
      <div style={{ paddingTop:116,display:"flex",minHeight:"100vh" }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width:220,flexShrink:0,position:"sticky",top:116,alignSelf:"flex-start", height:"calc(100vh - 116px)",overflowY:"auto", borderRight:`1px solid ${BORDER}`,padding:"16px 12px",background:"rgba(15,23,42,0.85)" }}>

          <div style={{ fontSize:9,fontWeight:600,color:MUTED,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>Category Filter</div>
          {CRIME_CATEGORIES.map(cat => {
            const cnt = profiles.filter(p => cat.offences.length
              ? cat.offences.includes(p.primary_offence)
              : !CRIME_CATEGORIES.slice(0,-1).some(c => c.offences.includes(p.primary_offence))).length;
            if (!cnt) return null;
            const on = catFilters.has(cat.label);
            return (
              <div key={cat.label} onClick={() => toggleCat(cat.label)}
                style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,cursor:"pointer",marginBottom:2, background:on?`${cat.color}18`:"transparent",border:`1px solid ${on?cat.color+"44":"transparent"}`, transition:"all 0.15s",opacity:catFilters.size>0&&!on?0.35:1 }}>
                <div style={{ width:8,height:8,borderRadius:2,background:cat.color,flexShrink:0 }}/>
                <span style={{ fontSize:11,color:on?TEXT:MUTED,flex:1 }}>{cat.label}</span>
                <span style={{ fontSize:10,color:cat.color,fontFamily:"monospace",fontWeight:600 }}>{cnt}</span>
              </div>
            );
          })}
          {catFilters.size > 0 && (
            <button onClick={() => setCatFilters(new Set())}
              style={{ marginTop:8,width:"100%",padding:"5px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:4,color:"#818CF8",fontSize:10,cursor:"pointer" }}>
              Clear category filter
            </button>
          )}

          <div style={{ height:1,background:BORDER,margin:"16px 0" }}/>

          <div style={{ fontSize:9,fontWeight:600,color:MUTED,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>Risk Filter</div>
          {RISK_ORDER.map(r => (
            <div key={r} onClick={() => setRiskFilter(riskFilter===r?null:r)}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,cursor:"pointer",marginBottom:2, background:riskFilter===r?`${RISK_COLORS[r]}18`:"transparent",border:`1px solid ${riskFilter===r?RISK_COLORS[r]+"44":"transparent"}`, transition:"all 0.15s" }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:RISK_COLORS[r],flexShrink:0 }}/>
              <span style={{ fontSize:11,color:riskFilter===r?TEXT:MUTED,flex:1 }}>{r}</span>
              <span style={{ fontSize:10,color:RISK_COLORS[r],fontFamily:"monospace" }}>{profiles.filter(p=>p.risk===r).length}</span>
            </div>
          ))}

          <div style={{ height:1,background:BORDER,margin:"16px 0" }}/>
          <div style={{ fontSize:9,color:"rgba(255,255,255,0.18)",textAlign:"center",letterSpacing:"0.06em",lineHeight:1.8 }}>
            READ-ONLY · ANALYST VIEW<br/>NCIC FIJI · CONFIDENTIAL
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1,padding:"22px 24px",paddingRight:selected?INSP+24:24,transition:"padding-right 0.25s ease",minWidth:0 }}>

          {/* ── CHARTS ROW */}
          <div style={{ display:"flex",gap:20,marginBottom:22 }}>

            {/* Horizontal Bar Chart */}
            <div style={{ flex:2,background:CARD,borderRadius:10,padding:"20px 24px",border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:10,fontWeight:600,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:18 }}>
                Crime Category Breakdown
              </div>
              {crimeBreakdown.map(cat => (
                <div key={cat.label} style={{ marginBottom:11 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                    <span style={{ fontSize:12,color:catFilters.has(cat.label)?TEXT:MUTED, fontWeight:catFilters.has(cat.label)?600:400 }}>
                      {cat.label}
                    </span>
                    <span style={{ fontSize:12,color:cat.color,fontFamily:"monospace",fontWeight:600 }}>{cat.count}</span>
                  </div>
                  <div style={{ height:7,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden",cursor:"pointer" }}
                    onClick={() => toggleCat(cat.label)}>
                    <div style={{ height:"100%",borderRadius:4,background:cat.color, width:`${(cat.count/maxCount)*100}%`,
                      boxShadow:`0 0 10px ${cat.color}55`,transition:"width 0.8s ease" }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut + Risk Legend */}
            <div style={{ flex:1,background:CARD,borderRadius:10,padding:"20px 24px",border:`1px solid ${BORDER}`,display:"flex",flexDirection:"column",alignItems:"center" }}>
              <div style={{ fontSize:10,fontWeight:600,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:18,alignSelf:"flex-start" }}>
                Risk Distribution
              </div>
              <DonutChart segments={riskBreakdown} total={stats.total}/>
              <div style={{ marginTop:18,width:"100%" }}>
                {riskBreakdown.map(r => (
                  <div key={r.label}
                    onClick={() => setRiskFilter(riskFilter===r.label?null:r.label)}
                    style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 0",cursor:"pointer",borderBottom:`1px solid ${BORDER}` }}>
                    <div style={{ width:10,height:10,borderRadius:2,background:r.color,flexShrink:0 }}/>
                    <span style={{ fontSize:11,color:riskFilter===r.label?TEXT:MUTED,flex:1 }}>{r.label}</span>
                    <span style={{ fontSize:11,color:r.color,fontFamily:"monospace",fontWeight:600 }}>{r.value}</span>
                    <span style={{ fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:"monospace",minWidth:32,textAlign:"right" }}>
                      {Math.round(r.value/stats.total*100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── PROFILE TABLE */}
          <div style={{ background:CARD,borderRadius:10,border:`1px solid ${BORDER}` }}>

            {/* Table controls */}
            <div style={{ padding:"14px 20px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ flex:1,fontSize:11,fontWeight:600,color:MUTED,letterSpacing:"0.08em",textTransform:"uppercase" }}>
                Criminal Profiles
                <span style={{ marginLeft:8,color:"#818CF8",fontFamily:"monospace" }}>{tableRows.length}</span>
                {tableRows.length !== profiles.length &&
                  <span style={{ color:"rgba(255,255,255,0.2)" }}> / {profiles.length}</span>}
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name, ID, offence, location…"
                style={{ background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,borderRadius:6, padding:"7px 13px",color:TEXT,fontSize:11,width:290 }}/>
              {hasFilters && (
                <button onClick={clearAll}
                  style={{ background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",color:"#818CF8",fontSize:10,padding:"7px 14px",borderRadius:5,cursor:"pointer",whiteSpace:"nowrap" }}>
                  Clear all
                </button>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
                    {[
                      { key:"id",              label:"ID",       w:90  },
                      { key:"name",            label:"Name",     w:165 },
                      { key:"risk",            label:"Risk",     w:105 },
                      { key:"status",          label:"Status",   w:145 },
                      { key:"primary_offence", label:"Primary Offence", w:"auto" },
                      { key:"nationality_type",label:"Nat.",     w:80  },
                      { key:"convictions",     label:"Conv.",    w:65  },
                      { key:"location",        label:"Location", w:130 },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)}
                        style={{ padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:600,color:MUTED, letterSpacing:"0.1em",textTransform:"uppercase",width:col.w,whiteSpace:"nowrap" }}>
                        {col.label}<SortIcon col={col.key}/>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding:44,textAlign:"center",color:MUTED,fontSize:13 }}>
                      No profiles match your filters
                    </td></tr>
                  ) : tableRows.map(p => (
                    <tr key={p.id} className="prof-row"
                      onClick={() => setSelected(selected?.id===p.id ? null : p)}
                      style={{ borderBottom:`1px solid ${BORDER}`, background:selected?.id===p.id?"rgba(99,102,241,0.1)":"transparent", transition:"background 0.1s" }}>
                      <td style={{ padding:"10px 14px",fontFamily:"monospace",fontSize:11,color:MUTED }}>{p.id}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ fontSize:12,fontWeight:500,color:TEXT }}>{p.name}</div>
                        {p.alias && <div style={{ fontSize:10,color:MUTED,marginTop:1 }}>aka {p.alias}</div>}
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <Badge label={p.risk} color={RISK_COLORS[p.risk]||MUTED}/>
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <Badge label={p.status||"–"} color={STATUS_COLORS[p.status]||MUTED}/>
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:MUTED }}>
                          <div style={{ width:6,height:6,borderRadius:1,background:CRIME_COLORS[p.primary_offence]||"#6B7280",flexShrink:0 }}/>
                          {p.primary_offence}
                        </div>
                      </td>
                      <td style={{ padding:"10px 14px",fontSize:10, color:p.nationality_type==="Foreign National"?"#A78BFA":MUTED }}>
                        {p.nationality_type==="Foreign National" ? "🌍 Foreign" : "Local"}
                      </td>
                      <td style={{ padding:"10px 14px",fontFamily:"monospace",fontSize:11, color:(p.convictions||0)>2?"#F87171":MUTED, textAlign:"center" }}>
                        {p.convictions||0}
                      </td>
                      <td style={{ padding:"10px 14px",fontSize:11,color:MUTED }}>{p.location||"–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT INSPECTOR PANEL */}
      {selected && (
        <div style={{ position:"fixed",top:116,right:0,bottom:0,width:INSP, background:"rgba(13,20,38,0.99)",borderLeft:`1px solid ${BORDER}`, padding:"18px 16px",overflowY:"auto",zIndex:350,animation:"slideIn 0.2s ease" }}>

          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <div style={{ fontSize:9,fontWeight:600,color:MUTED,letterSpacing:"0.12em",textTransform:"uppercase" }}>Profile Detail</div>
            <button onClick={() => setSelected(null)}
              style={{ background:"rgba(255,255,255,0.07)",border:`1px solid ${BORDER}`,color:MUTED, width:26,height:26,borderRadius:5,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>
              ✕
            </button>
          </div>

          {/* Photo + name card */}
          <div style={{ background:`linear-gradient(135deg,${CRIME_COLORS[selected.primary_offence]||"#6B7280"}18,rgba(99,102,241,0.08))`, border:`1px solid ${CRIME_COLORS[selected.primary_offence]||"#6B7280"}35`,borderRadius:9,padding:16,marginBottom:18 }}>
            {selected.photo_url && (
              <img src={selected.photo_url} alt=""
                style={{ width:58,height:58,borderRadius:7,objectFit:"cover",objectPosition:"top center", marginBottom:12,border:`2px solid ${CRIME_COLORS[selected.primary_offence]||"#6B7280"}55` }}/>
            )}
            <div style={{ fontSize:16,fontWeight:700,marginBottom:3 }}>{selected.name}</div>
            {selected.alias && <div style={{ fontSize:11,color:MUTED,marginBottom:12 }}>aka {selected.alias}</div>}
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              <Badge label={selected.risk} color={RISK_COLORS[selected.risk]||MUTED}/>
              <Badge label={selected.status||"–"} color={STATUS_COLORS[selected.status]||MUTED}/>
              {selected.nationality_type==="Foreign National" && <Badge label="Foreign" color="#A78BFA"/>}
              {selected.gang_affiliation && selected.gang_affiliation!=="No Gang Affiliation" && <Badge label="Gang" color="#F87171"/>}
            </div>
          </div>

          {/* Detail rows */}
          {[
            ["Case ID",        selected.id],
            ["Primary Offence",selected.primary_offence],
            ["Category",       getCat(selected.primary_offence).label],
            ["Secondary",      selected.secondary_offence],
            ["Location",       selected.location],
            ["Gender",         selected.gender],
            ["Date of Birth",  selected.dob],
            ["Arrest Year",    selected.arrest_year?.toString()],
            ["Convictions",    selected.convictions!=null ? `${selected.convictions} prior conviction${selected.convictions!==1?"s":""}` : null],
            ["Nationality",    selected.nationality_type],
            ["Gang",           selected.gang_affiliation && selected.gang_affiliation!=="No Gang Affiliation" ? selected.gang_affiliation : null],
            ["Deportation",    selected.deportation_status && selected.deportation_status!=="Not Deported" ? selected.deportation_status : null],
          ].filter(([,v]) => v).map(([label,val]) => (
            <div key={label} style={{ marginBottom:13,paddingBottom:13,borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:9,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:12,color:TEXT,lineHeight:1.5 }}>{val}</div>
            </div>
          ))}

          {/* Crime category tag */}
          <div style={{ marginTop:4,padding:"10px 12px",borderRadius:7, background:`${CRIME_COLORS[selected.primary_offence]||"#6B7280"}12`, border:`1px solid ${CRIME_COLORS[selected.primary_offence]||"#6B7280"}30` }}>
            <div style={{ fontSize:9,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5 }}>Crime Category</div>
            <div style={{ display:"flex",alignItems:"center",gap:7 }}>
              <div style={{ width:8,height:8,borderRadius:2,background:getCat(selected.primary_offence).color }}/>
              <span style={{ fontSize:12,color:getCat(selected.primary_offence).color,fontWeight:600 }}>
                {getCat(selected.primary_offence).label}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
