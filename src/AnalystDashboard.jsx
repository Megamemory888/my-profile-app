import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

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
  { label:"Organised Crime",color:"#991B1B", offences:["Organized Crime Activity","Smuggling","Extortion"] },
  { label:"Cyber",          color:"#14B8A6", offences:["Cybercrime"] },
  { label:"Firearms",       color:"#6366F1", offences:["Illegal Firearm Possession"] },
  { label:"Other",          color:"#6B7280", offences:[] },
];

const RISK_SIZE  = { Low:5, Moderate:8, High:12, Severe:18 };
const RISK_GLOW  = { Low:"#22C55E", Moderate:"#EAB308", High:"#F97316", Severe:"#EF4444" };
const RISK_ORDER = { Severe:0, High:1, Moderate:2, Low:3 };

function getCat(offence) {
  return CRIME_CATEGORIES.find(c => c.offences.includes(offence)) || CRIME_CATEGORIES[CRIME_CATEGORIES.length - 1];
}

export default function AnalystDashboard({ onLogout }) {
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const nodesRef    = useRef([]);
  const mouseRef    = useRef({ x:-999, y:-999 });
  const hoveredRef  = useRef(null);
  const camRef      = useRef({ ox:0, oy:0, vx:0.08, vy:0.055 });
  const initRef     = useRef(false);

  const [profiles,      setProfiles]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [hovered,       setHovered]       = useState(null);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [stats,         setStats]         = useState({});
  const [time,          setTime]          = useState("");

  // ── Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-FJ", { hour12:false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Load data
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("criminal_profiles")
        .select("id,name,alias,risk,status,primary_offence,secondary_offence,nationality_type,deportation_status,gang_affiliation,convictions,location,photo_url,dob,gender,arrest_year")
        .order("risk");
      if (data) {
        setProfiles(data);
        setStats({
          total:     data.length,
          wanted:    data.filter(p => p.status === "Wanted").length,
          inCustody: data.filter(p => p.status === "In Custody").length,
          severe:    data.filter(p => p.risk === "Severe").length,
          high:      data.filter(p => p.risk === "High").length,
          foreign:   data.filter(p => p.nationality_type === "Foreign National").length,
          gangs:     data.filter(p => p.gang_affiliation && p.gang_affiliation !== "No Gang Affiliation").length,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  // ── Build / rebuild nodes
  const buildNodes = useCallback((data, canvas) => {
    const W = canvas.offsetWidth || canvas.width;
    const H = canvas.offsetHeight || canvas.height;
    const prev = Object.fromEntries(nodesRef.current.map(n => [n.id, n]));
    nodesRef.current = data.map((p, i) => {
      const e = prev[p.id];
      return {
        id:      p.id,
        profile: p,
        x:  e?.x  ?? (W * 0.1 + Math.random() * W * 0.8),
        y:  e?.y  ?? (H * 0.1 + Math.random() * H * 0.8),
        vx: e?.vx ?? (Math.random() - 0.5) * 0.6,
        vy: e?.vy ?? (Math.random() - 0.5) * 0.6,
        size:  RISK_SIZE[p.risk]  || 6,
        color: CRIME_COLORS[p.primary_offence] || "#6B7280",
        glow:  RISK_GLOW[p.risk]  || "#6B7280",
        catIdx: CRIME_CATEGORIES.findIndex(c => c.offences.includes(p.primary_offence)),
      };
    });
  }, []);

  useEffect(() => {
    if (!profiles.length || !canvasRef.current || initRef.current) return;
    initRef.current = true;
    buildNodes(profiles, canvasRef.current);
  }, [profiles, buildNodes]);

  useEffect(() => {
    if (!canvasRef.current || loading) return;
    const filtered = activeFilters.size === 0
      ? profiles
      : profiles.filter(p => activeFilters.has(getCat(p.primary_offence).label));
    buildNodes(filtered, canvasRef.current);
  }, [activeFilters, profiles, buildNodes, loading]);

  // ── Animation loop
  useEffect(() => {
    if (loading || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = 4;
    const getClusterTarget = (catIdx, W, H, cam) => {
      const idx = catIdx < 0 ? CRIME_CATEGORIES.length - 1 : catIdx;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        x: W * 0.15 + col * (W * 0.22) + cam.ox * 0.25,
        y: H * 0.2  + row * (H * 0.38) + cam.oy * 0.2,
      };
    };

    let frameCount = 0;

    const animate = () => {
      frameCount++;
      const W = canvas.width;
      const H = canvas.height;
      const nodes = nodesRef.current;
      const cam   = camRef.current;

      // Camera drift
      cam.ox += cam.vx;
      cam.oy += cam.vy;
      if (Math.abs(cam.ox) > 50) cam.vx *= -1;
      if (Math.abs(cam.oy) > 35) cam.vy *= -1;

      // Background
      ctx.fillStyle = "rgba(6,8,21,0.18)";
      ctx.fillRect(0, 0, W, H);

      // ── Physics
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Cluster attraction
        const cl = getClusterTarget(n.catIdx, W, H, cam);
        n.vx += (cl.x - n.x) * 0.00018;
        n.vy += (cl.y - n.y) * 0.00018;

        // Centre gravity (weak)
        n.vx += (W / 2 - n.x) * 0.00005;
        n.vy += (H / 2 - n.y) * 0.00005;

        // Repulsion (only nearby, for perf)
        for (let j = i + 1; j < nodes.length; j++) {
          const m   = nodes[j];
          const dx  = n.x - m.x;
          const dy  = n.y - m.y;
          const d2  = dx * dx + dy * dy;
          const min = (n.size + m.size) * 5;
          if (d2 < min * min) {
            const d = Math.sqrt(d2) || 1;
            const f = (min - d) / d * 0.07;
            n.vx += dx * f;  n.vy += dy * f;
            m.vx -= dx * f;  m.vy -= dy * f;
          }
        }

        n.vx *= 0.965;
        n.vy *= 0.965;
        n.x  += n.vx;
        n.y  += n.vy;

        const pad = n.size + 2;
        if (n.x < pad)     { n.x = pad;     n.vx *= -0.4; }
        if (n.x > W - pad) { n.x = W - pad; n.vx *= -0.4; }
        if (n.y < pad)     { n.y = pad;     n.vy *= -0.4; }
        if (n.y > H - pad) { n.y = H - pad; n.vy *= -0.4; }
      }

      // ── Draw edges (same category, within range)
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n = nodes[i], m = nodes[j];
          if (n.catIdx !== m.catIdx) continue;
          const dx = n.x - m.x, dy = n.y - m.y;
          if (dx * dx + dy * dy > 160 * 160) continue;
          ctx.beginPath();
          ctx.strokeStyle = n.color;
          ctx.lineWidth   = 0.6;
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // ── Hover detection
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      let newHov = null;

      // Draw nodes (back-to-front by size so small nodes stay visible)
      const sorted = [...nodes].sort((a,b) => b.size - a.size);
      for (const n of sorted) {
        const dx   = mx - n.x, dy = my - n.y;
        const hit  = Math.sqrt(dx*dx + dy*dy) < n.size + 10;
        if (hit) newHov = n.profile;

        const isHov = hit;
        const gs    = isHov ? n.size * 5 : n.size * 2.8;

        // Glow halo
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, gs);
        grad.addColorStop(0, n.glow + (isHov ? "BB" : "55"));
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, gs, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, isHov ? n.size * 1.35 : n.size, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.strokeStyle = isHov ? "#fff" : "rgba(255,255,255,0.25)";
        ctx.lineWidth   = isHov ? 2 : 0.6;
        ctx.stroke();

        // Pulse ring for Severe / Wanted
        if (n.profile.risk === "Severe" || n.profile.status === "Wanted") {
          const t = (frameCount % 120) / 120;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.size + t * 14, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239,68,68,${0.7 - t * 0.7})`;
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }

        // Label on hover
        if (isHov) {
          ctx.font      = "bold 11px Inter, sans-serif";
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          const label   = n.profile.name.length > 16 ? n.profile.name.slice(0,15)+"…" : n.profile.name;
          const tw      = ctx.measureText(label).width + 12;
          const tx      = n.x, ty = n.y - n.size - 10;
          ctx.fillStyle = "rgba(6,8,21,0.85)";
          ctx.beginPath();
          ctx.roundRect(tx - tw/2, ty - 14, tw, 18, 3);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.fillText(label, tx, ty);
        }
      }

      if (newHov !== hoveredRef.current) {
        hoveredRef.current = newHov;
        setHovered(newHov || null);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [loading]);

  // ── Mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouseRef.current = { x:-999, y:-999 }; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => { canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mouseleave", onLeave); };
  }, [loading]);

  const toggleFilter = label => setActiveFilters(prev => {
    const next = new Set(prev);
    next.has(label) ? next.delete(label) : next.add(label);
    return next;
  });

  const crimeBreakdown = CRIME_CATEGORIES.map(cat => ({
    ...cat,
    count: profiles.filter(p => cat.offences.length
      ? cat.offences.includes(p.primary_offence)
      : !CRIME_CATEGORIES.slice(0,-1).some(c => c.offences.includes(p.primary_offence))).length
  })).filter(c => c.count > 0).sort((a,b) => b.count - a.count);

  const maxCount = Math.max(...crimeBreakdown.map(c => c.count), 1);

  const INSPECTOR_W = 310;
  const LEFT_W      = 230;

  if (loading) return (
    <div style={{ background:"#060815", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", border:"2px solid rgba(99,102,241,0.4)", borderTopColor:"#6366F1", animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:"#6366F1", fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", fontFamily:"monospace" }}>Loading intelligence data…</div>
    </div>
  );

  return (
    <div style={{ background:"#060815", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", color:"#fff", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}
        ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.4);border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      {/* ── TOP BAR */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:50, background:"rgba(6,8,21,0.96)", borderBottom:"1px solid rgba(99,102,241,0.18)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", padding:"0 20px", gap:14, zIndex:200 }}>
        <div style={{ width:30, height:30, borderRadius:5, background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🛡️</div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.06em" }}>NCIC</div>
          <div style={{ fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:"0.14em", textTransform:"uppercase" }}>Intelligence Visual Centre · Fiji</div>
        </div>
        <div style={{ width:1, height:24, background:"rgba(255,255,255,0.08)", marginLeft:4 }}/>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em", textTransform:"uppercase" }}>Crime Network Analysis</div>
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", animation:"pulse 2s infinite" }}/>
          <span style={{ fontSize:9, color:"#22C55E", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"monospace" }}>Live</span>
        </div>
        <div style={{ fontFamily:"monospace", fontSize:11, color:"rgba(255,255,255,0.4)", minWidth:60, textAlign:"right" }}>{time}</div>
        <div style={{ width:1, height:24, background:"rgba(255,255,255,0.08)" }}/>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"monospace" }}>{profiles.length} records</span>
        <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", fontSize:10, padding:"4px 10px", borderRadius:4, cursor:"pointer", letterSpacing:"0.04em" }}>Sign out</button>
      </div>

      {/* ── KPI BAR */}
      <div style={{ position:"fixed", top:50, left:LEFT_W, right:0, height:56, background:"rgba(6,8,21,0.92)", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", zIndex:150, backdropFilter:"blur(8px)" }}>
        {[
          { l:"Total Profiles",    v:stats.total,     c:"#60A5FA" },
          { l:"Wanted",            v:stats.wanted,    c:"#EF4444" },
          { l:"In Custody",        v:stats.inCustody, c:"#F97316" },
          { l:"Severe Risk",       v:stats.severe,    c:"#DC2626" },
          { l:"High Risk",         v:stats.high,      c:"#F59E0B" },
          { l:"Foreign Nationals", v:stats.foreign,   c:"#8B5CF6" },
          { l:"Gang-Affiliated",   v:stats.gangs,     c:"#EC4899" },
        ].map((s,i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRight:"1px solid rgba(255,255,255,0.04)", height:"100%", padding:"0 6px" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c, fontFamily:"monospace", lineHeight:1, textShadow:`0 0 12px ${s.c}88` }}>{s.v}</div>
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em", textTransform:"uppercase", marginTop:3, textAlign:"center" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── LEFT PANEL */}
      <div style={{ position:"fixed", top:50, left:0, bottom:0, width:LEFT_W, background:"rgba(6,8,21,0.97)", borderRight:"1px solid rgba(255,255,255,0.06)", padding:"14px 12px", overflowY:"auto", zIndex:150 }}>
        <div style={{ fontSize:8, fontWeight:700, color:"rgba(255,255,255,0.25)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Filter by Category</div>

        {CRIME_CATEGORIES.map(cat => {
          const count = profiles.filter(p => cat.offences.length
            ? cat.offences.includes(p.primary_offence)
            : !CRIME_CATEGORIES.slice(0,-1).some(c=>c.offences.includes(p.primary_offence))).length;
          if (!count) return null;
          const on = activeFilters.has(cat.label);
          return (
            <div key={cat.label} onClick={() => toggleFilter(cat.label)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 8px", borderRadius:5, cursor:"pointer", marginBottom:2, background:on?`${cat.color}18`:"transparent", border:`1px solid ${on?cat.color+"44":"transparent"}`, transition:"all 0.15s", opacity: activeFilters.size>0&&!on ? 0.3 : 1 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:cat.color, boxShadow:`0 0 5px ${cat.color}`, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)", flex:1 }}>{cat.label}</span>
              <span style={{ fontSize:10, color:cat.color, fontFamily:"monospace", fontWeight:600 }}>{count}</span>
            </div>
          );
        })}

        {activeFilters.size > 0 && (
          <button onClick={() => setActiveFilters(new Set())} style={{ marginTop:8, width:"100%", padding:"6px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:4, color:"#818CF8", fontSize:10, cursor:"pointer", letterSpacing:"0.04em" }}>
            Clear filters
          </button>
        )}

        <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"14px 0" }}/>

        <div style={{ fontSize:8, fontWeight:700, color:"rgba(255,255,255,0.25)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Risk Scale</div>
        {[["Severe","#EF4444",18],["High","#F97316",12],["Moderate","#EAB308",8],["Low","#22C55E",5]].map(([r,c,s])=>(
          <div key={r} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 8px", marginBottom:3 }}>
            <div style={{ width:s+2, height:s+2, borderRadius:"50%", background:c, boxShadow:`0 0 ${s}px ${c}`, flexShrink:0 }}/>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.55)", flex:1 }}>{r}</span>
            <span style={{ fontSize:10, color:c, fontFamily:"monospace" }}>{profiles.filter(p=>p.risk===r).length}</span>
          </div>
        ))}

        <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"14px 0" }}/>

        <div style={{ fontSize:8, fontWeight:700, color:"rgba(255,255,255,0.25)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Breakdown</div>
        {crimeBreakdown.map(cat=>(
          <div key={cat.label} style={{ marginBottom:9 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)" }}>{cat.label}</span>
              <span style={{ fontSize:9, color:cat.color, fontFamily:"monospace" }}>{cat.count}</span>
            </div>
            <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2 }}>
              <div style={{ height:"100%", borderRadius:2, background:cat.color, width:`${(cat.count/maxCount)*100}%`, boxShadow:`0 0 5px ${cat.color}80`, transition:"width 1s ease" }}/>
            </div>
          </div>
        ))}

        <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"14px 0" }}/>
        <div style={{ fontSize:8, color:"rgba(255,255,255,0.2)", textAlign:"center", letterSpacing:"0.06em", lineHeight:1.6 }}>
          READ-ONLY · ANALYST VIEW<br/>NCIC · CONFIDENTIAL
        </div>
      </div>

      {/* ── CANVAS */}
      <canvas ref={canvasRef}
        style={{ position:"fixed", top:106, left:LEFT_W, width:`calc(100vw - ${LEFT_W}px${hovered?` - ${INSPECTOR_W}px`:""})`, height:`calc(100vh - 106px)`, display:"block", cursor: hovered?"crosshair":"default" }}
      />

      {/* ── RIGHT INSPECTOR */}
      {hovered && (
        <div style={{ position:"fixed", top:106, right:0, bottom:0, width:INSPECTOR_W, background:"rgba(6,8,21,0.97)", borderLeft:"1px solid rgba(255,255,255,0.07)", padding:16, overflowY:"auto", zIndex:150, animation:"fadeSlide 0.18s ease" }}>
          <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12 }}>Profile Inspector</div>

          {/* Card */}
          <div style={{ background:`linear-gradient(135deg,${CRIME_COLORS[hovered.primary_offence]||"#6B7280"}1A,transparent)`, border:`1px solid ${CRIME_COLORS[hovered.primary_offence]||"#6B7280"}44`, borderRadius:8, padding:14, marginBottom:14 }}>
            {hovered.photo_url && (
              <img src={hovered.photo_url} alt="" style={{ width:54, height:54, borderRadius:4, objectFit:"cover", objectPosition:"top center", marginBottom:10, border:`2px solid ${CRIME_COLORS[hovered.primary_offence]||"#6B7280"}55` }}/>
            )}
            <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>{hovered.name}</div>
            {hovered.alias && <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:7 }}>aka {hovered.alias}</div>}
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:RISK_GLOW[hovered.risk]+"22", color:RISK_GLOW[hovered.risk], border:`1px solid ${RISK_GLOW[hovered.risk]}33`, fontWeight:700 }}>{hovered.risk}</span>
              <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.1)" }}>{hovered.status}</span>
              {hovered.nationality_type==="Foreign National" && <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:"#8B5CF618", color:"#A78BFA", border:"1px solid #8B5CF630" }}>🌍 Foreign</span>}
              {hovered.gang_affiliation && hovered.gang_affiliation!=="No Gang Affiliation" && <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:"#EF444418", color:"#F87171", border:"1px solid #EF444430" }}>⚠ Gang</span>}
            </div>
          </div>

          {[
            ["Case ID",         hovered.id],
            ["Primary Offence", hovered.primary_offence],
            ["Secondary",       hovered.secondary_offence],
            ["Location",        hovered.location],
            ["Gender",          hovered.gender],
            ["Date of Birth",   hovered.dob],
            ["Arrest Year",     hovered.arrest_year],
            ["Convictions",     hovered.convictions != null ? `${hovered.convictions} prior conviction${hovered.convictions!==1?"s":""}` : null],
            ["Gang",            hovered.gang_affiliation && hovered.gang_affiliation!=="No Gang Affiliation" ? hovered.gang_affiliation : null],
            ["Deportation",     hovered.deportation_status && hovered.deportation_status!=="Not Deported" ? hovered.deportation_status : null],
          ].filter(([,v]) => v).map(([l,v]) => (
            <div key={l} style={{ marginBottom:9, paddingBottom:9, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.4 }}>{v}</div>
            </div>
          ))}

          {/* Crime type tag */}
          <div style={{ marginTop:8, padding:"8px 10px", borderRadius:5, background:`${CRIME_COLORS[hovered.primary_offence]||"#6B7280"}15`, border:`1px solid ${CRIME_COLORS[hovered.primary_offence]||"#6B7280"}30` }}>
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Category</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:CRIME_COLORS[hovered.primary_offence]||"#6B7280", boxShadow:`0 0 5px ${CRIME_COLORS[hovered.primary_offence]||"#6B7280"}` }}/>
              <span style={{ fontSize:11, color:CRIME_COLORS[hovered.primary_offence]||"#6B7280", fontWeight:600 }}>{getCat(hovered.primary_offence).label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
