import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const STATIONS = ["Suva Central","Nausori","Lautoka","Nadi","Ba","Labasa","Savusavu","Sigatoka","Rakiraki","Levuka","Nasinu","Valelevu","Nabua","Other"];
const RANKS = ["Constable","Senior Constable","Corporal","Sergeant","Senior Sergeant","Inspector","Senior Inspector","Superintendent","Other"];
const NATIONALITIES = ["Fijian","Australian","New Zealander","Indian","Chinese","American","British","Other"];
const OFFENCE_TYPES = ["Assault","Theft","Burglary","Robbery","Armed Robbery","Fraud / Scam","Sexual Offence","Domestic Violence","Drug Offence","Vandalism / Property Damage","Trespassing","Kidnapping / Abduction","Cybercrime","Murder / Manslaughter","Missing Person","Other"];
const ACCIDENT_TYPES = ["Head-on Collision","Rear-end Collision","Side Collision","Single Vehicle","Hit and Run","Pedestrian Struck","Cyclist Struck","Rollover","Other"];
const ROAD_CONDITIONS = ["Dry — Good","Wet — Rain","Foggy / Low visibility","Night — Poor lighting","Roadworks","Other"];
const REPORT_TYPES = [
  { id:"complaint",    label:"Victim / Complaint",   icon:"👤", color:"#1447C4", bg:"#E8EFFD", desc:"Person reporting a crime committed against them" },
  { id:"accident",     label:"Traffic Accident",      icon:"🚗", color:"#B45309", bg:"#FEF3C7", desc:"Road traffic accident or vehicle incident" },
  { id:"crime_scene",  label:"Crime Scene Report",    icon:"🔍", color:"#6B21A8", bg:"#F3E8FF", desc:"Officer documenting an active or discovered crime scene" },
  { id:"witness",      label:"Witness Statement",     icon:"👁", color:"#166534", bg:"#DCFCE7", desc:"Recording what a witness observed" },
];

const STATUS_STYLE = {
  "New":                { bg:"#E8EFFD", text:"#1447C4", border:"#93B4F0" },
  "Under Investigation":{ bg:"#FEF3C7", text:"#92400E", border:"#FCD34D" },
  "Referred":           { bg:"#F3E8FF", text:"#6B21A8", border:"#C084FC" },
  "Closed":             { bg:"#DCFCE7", text:"#166534", border:"#6EE7B7" },
};

const C = {
  bg:"#EDEEF2", surface:"#FFFFFF", surface2:"#F3F4F8",
  nav:"#0F2044", navMuted:"rgba(255,255,255,0.45)",
  border:"#D8DCE8", border2:"#BFC5D5",
  text:"#0F172A", text2:"#374151", text3:"#6B7280",
  accent:"#1447C4", accentL:"#E8EFFD",
};

const inp = { padding:"8px 10px", fontSize:13, borderRadius:4, border:`1px solid ${C.border2}`, background:C.surface, color:C.text, fontFamily:"inherit", width:"100%", boxSizing:"border-box" };
const btnSm = { display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", fontSize:12, fontWeight:500, borderRadius:4, border:`1px solid ${C.border2}`, background:C.surface, color:C.text2, cursor:"pointer", whiteSpace:"nowrap" };
const btnBlue = { ...btnSm, background:C.accent, color:"#fff", border:`1px solid ${C.accent}`, fontWeight:600 };
const btnGhost = { ...btnSm, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.8)" };

function Field({ label, required, children, full=false, hint="" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, gridColumn:full?"1/-1":"auto" }}>
      <label style={{ fontSize:11, fontWeight:600, color:C.text2, letterSpacing:"0.04em", textTransform:"uppercase" }}>
        {label}{required&&<span style={{color:"#DC2626",marginLeft:3}}>*</span>}
      </label>
      {children}
      {hint&&<span style={{fontSize:10,color:C.text3,marginTop:1}}>{hint}</span>}
    </div>
  );
}

function Section({ title, icon, color="#374151", children }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", marginBottom:16 }}>
      <div style={{ padding:"9px 16px", borderBottom:`1px solid ${C.border}`, background:"#F8F9FC", display:"flex", alignItems:"center", gap:7 }}>
        <span style={{fontSize:15}}>{icon}</span>
        <span style={{ fontSize:11, fontWeight:700, color, letterSpacing:"0.08em", textTransform:"uppercase" }}>{title}</span>
      </div>
      <div style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {children}
      </div>
    </div>
  );
}

function Badge({ label, style:s={} }) {
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:99, fontSize:11, fontWeight:600, background:s.bg||"#eee", color:s.text||"#333", border:`1px solid ${s.border||"#ccc"}` }}>{label}</span>;
}

// ─── REPORT FORM ─────────────────────────────────────────────────────────────
function ReportForm({ officer, onSubmitted, onCancel }) {
  const [step, setStep] = useState(0); // 0=type select, 1=form
  const [reportType, setReportType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [suspectSearch, setSuspectSearch] = useState("");
  const [suspectResults, setSuspectResults] = useState([]);
  const [linkedSuspect, setLinkedSuspect] = useState(null);

  const [f, setF] = useState({
    incident_date:"", incident_time:"", incident_location:"", incident_location_detail:"",
    complainant_name:"", complainant_dob:"", complainant_gender:"Male",
    complainant_phone:"", complainant_address:"", complainant_nationality:"Fijian",
    complainant_occupation:"", complainant_email:"",
    offence_type:"Assault", incident_description:"",
    property_stolen:"", property_value:"",
    injuries_reported:false, injuries_description:"",
    weapons_involved:false, weapons_description:"",
    vehicle_reg_1:"", vehicle_driver_1:"", vehicle_reg_2:"", vehicle_driver_2:"",
    accident_type:"Head-on Collision", road_conditions:"Dry — Good",
    fatalities:"0",
    suspect_known:false, suspect_name:"", suspect_description:"",
    suspect_last_seen:"", suspect_vehicle:"",
    witness_1_name:"", witness_1_phone:"", witness_1_statement:"",
    witness_2_name:"", witness_2_phone:"", witness_2_statement:"",
    evidence_collected:"", evidence_photos:false, evidence_cctv:false,
    status:"New", referred_to:"", follow_up_notes:"",
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const searchSuspect = async (q) => {
    setSuspectSearch(q);
    if (q.length < 2) { setSuspectResults([]); return; }
    const { data } = await supabase.from("criminal_profiles")
      .select("id,name,alias,risk,status,primary_offence,photo_url,gang_affiliation")
      .or(`name.ilike.%${q}%,id.ilike.%${q}%,alias.ilike.%${q}%`).limit(6);
    setSuspectResults(data||[]);
  };

  const submit = async () => {
    if (!f.incident_date) { alert("Please enter the incident date."); return; }
    if (!f.incident_location) { alert("Please enter the incident location."); return; }
    setSaving(true);

    // Generate ID
    const year = new Date().getFullYear();
    const { count } = await supabase.from("incident_reports").select("*", {count:"exact",head:true}).like("id", `IR-${year}-%`);
    const newId = `IR-${year}-${String((count||0)+1).padStart(5,"0")}`;

    const record = {
      id: newId,
      report_type: reportType,
      officer_user_id: officer.user_id,
      officer_name: officer.full_name,
      officer_badge: officer.badge_number,
      officer_station: officer.station,
      officer_rank: officer.rank,
      ...f,
      suspect_profile_id: linkedSuspect?.id || null,
      property_value: f.property_value ? Number(f.property_value) : null,
      fatalities: Number(f.fatalities)||0,
    };

    const { error } = await supabase.from("incident_reports").insert([record]);
    setSaving(false);
    if (error) { alert("Error saving report: " + error.message); return; }
    onSubmitted(newId);
  };

  const RISK_COLOR = { Low:"#166534", Moderate:"#92400E", High:"#B45309", Severe:"#991B1B" };
  const RISK_BG = { Low:"#DCFCE7", Moderate:"#FEF3C7", High:"#FFEDD5", Severe:"#FEE2E2" };

  if (step === 0) return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"32px 24px" }}>
      <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:6 }}>New Incident Report</div>
      <div style={{ fontSize:13, color:C.text3, marginBottom:24 }}>Select the type of report you are taking:</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {REPORT_TYPES.map(rt=>(
          <div key={rt.id} onClick={()=>{ setReportType(rt.id); setStep(1); }}
            style={{ background:C.surface, border:`2px solid ${C.border}`, borderRadius:6, padding:"20px 18px", cursor:"pointer", transition:"all 0.15s" }}
            onMouseOver={e=>{ e.currentTarget.style.borderColor=rt.color; e.currentTarget.style.background=rt.bg; }}
            onMouseOut={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.surface; }}>
            <div style={{ fontSize:28, marginBottom:10 }}>{rt.icon}</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>{rt.label}</div>
            <div style={{ fontSize:12, color:C.text3, lineHeight:1.5 }}>{rt.desc}</div>
          </div>
        ))}
      </div>
      <button onClick={onCancel} style={{ ...btnSm, marginTop:20 }}>← Back to dashboard</button>
    </div>
  );

  const rt = REPORT_TYPES.find(r=>r.id===reportType);

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"24px" }}>
      {/* Form header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${C.border}` }}>
        <div style={{ width:44, height:44, borderRadius:4, background:rt.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, border:`1px solid ${rt.color}30` }}>{rt.icon}</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{rt.label}</div>
          <div style={{ fontSize:11, color:C.text3 }}>Fill in all available details — fields marked * are required</div>
        </div>
        <button onClick={()=>setStep(0)} style={{ ...btnSm, marginLeft:"auto" }}>← Change type</button>
      </div>

      {/* Incident Details */}
      <Section title="Incident Details" icon="📋" color="#1447C4">
        <Field label="Date of Incident" required>
          <input type="date" value={f.incident_date} onChange={e=>set("incident_date",e.target.value)} style={inp}/>
        </Field>
        <Field label="Time of Incident">
          <input type="time" value={f.incident_time} onChange={e=>set("incident_time",e.target.value)} style={inp}/>
        </Field>
        <Field label="Location" required full>
          <input type="text" value={f.incident_location} onChange={e=>set("incident_location",e.target.value)} placeholder="Street, suburb, area..." style={inp}/>
        </Field>
        <Field label="Location Details" full hint="Landmark, building name, GPS coordinates, etc.">
          <input type="text" value={f.incident_location_detail} onChange={e=>set("incident_location_detail",e.target.value)} placeholder="e.g. Near Suva Market, outside ANZ Bank..." style={inp}/>
        </Field>
        {(reportType==="complaint"||reportType==="crime_scene") && (
          <Field label="Offence Type" required>
            <select value={f.offence_type} onChange={e=>set("offence_type",e.target.value)} style={inp}>
              {OFFENCE_TYPES.map(o=><option key={o}>{o}</option>)}
            </select>
          </Field>
        )}
      </Section>

      {/* Complainant / Victim */}
      {(reportType==="complaint"||reportType==="crime_scene") && (
        <Section title="Complainant / Victim Details" icon="👤" color="#166534">
          <Field label="Full Name" required>
            <input value={f.complainant_name} onChange={e=>set("complainant_name",e.target.value)} placeholder="Full legal name" style={inp}/>
          </Field>
          <Field label="Gender">
            <select value={f.complainant_gender} onChange={e=>set("complainant_gender",e.target.value)} style={inp}>
              {["Male","Female","Other"].map(g=><option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Date of Birth">
            <input type="date" value={f.complainant_dob} onChange={e=>set("complainant_dob",e.target.value)} style={inp}/>
          </Field>
          <Field label="Nationality">
            <select value={f.complainant_nationality} onChange={e=>set("complainant_nationality",e.target.value)} style={inp}>
              {NATIONALITIES.map(n=><option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Phone Number">
            <input value={f.complainant_phone} onChange={e=>set("complainant_phone",e.target.value)} placeholder="e.g. 9751234" style={inp}/>
          </Field>
          <Field label="Occupation">
            <input value={f.complainant_occupation} onChange={e=>set("complainant_occupation",e.target.value)} style={inp}/>
          </Field>
          <Field label="Home Address" full>
            <input value={f.complainant_address} onChange={e=>set("complainant_address",e.target.value)} placeholder="Full address" style={inp}/>
          </Field>
          <Field label="Email" full>
            <input type="email" value={f.complainant_email} onChange={e=>set("complainant_email",e.target.value)} placeholder="Optional" style={inp}/>
          </Field>
        </Section>
      )}

      {/* Witness Details */}
      {reportType==="witness" && (
        <Section title="Witness Details" icon="👁" color="#166534">
          <Field label="Witness Full Name" required>
            <input value={f.witness_1_name} onChange={e=>set("witness_1_name",e.target.value)} style={inp}/>
          </Field>
          <Field label="Witness Phone">
            <input value={f.witness_1_phone} onChange={e=>set("witness_1_phone",e.target.value)} style={inp}/>
          </Field>
          <Field label="Witness Statement" full>
            <textarea value={f.witness_1_statement} onChange={e=>set("witness_1_statement",e.target.value)} rows={5} placeholder="Detailed account of what the witness observed..." style={{...inp,resize:"vertical"}}/>
          </Field>
        </Section>
      )}

      {/* Accident Details */}
      {reportType==="accident" && (
        <Section title="Vehicle & Accident Details" icon="🚗" color="#B45309">
          <Field label="Accident Type" required>
            <select value={f.accident_type} onChange={e=>set("accident_type",e.target.value)} style={inp}>
              {ACCIDENT_TYPES.map(a=><option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Road Conditions">
            <select value={f.road_conditions} onChange={e=>set("road_conditions",e.target.value)} style={inp}>
              {ROAD_CONDITIONS.map(r=><option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Vehicle 1 — Registration">
            <input value={f.vehicle_reg_1} onChange={e=>set("vehicle_reg_1",e.target.value)} placeholder="e.g. LT 1234" style={inp}/>
          </Field>
          <Field label="Vehicle 1 — Driver Name">
            <input value={f.vehicle_driver_1} onChange={e=>set("vehicle_driver_1",e.target.value)} style={inp}/>
          </Field>
          <Field label="Vehicle 2 — Registration">
            <input value={f.vehicle_reg_2} onChange={e=>set("vehicle_reg_2",e.target.value)} placeholder="e.g. FN 5678" style={inp}/>
          </Field>
          <Field label="Vehicle 2 — Driver Name">
            <input value={f.vehicle_driver_2} onChange={e=>set("vehicle_driver_2",e.target.value)} style={inp}/>
          </Field>
          <Field label="Fatalities / Deaths">
            <input type="number" min="0" value={f.fatalities} onChange={e=>set("fatalities",e.target.value)} style={inp}/>
          </Field>
          <Field label="Injuries">
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 10px",border:`1px solid ${f.injuries_reported?"#DC2626":C.border2}`,borderRadius:4,background:f.injuries_reported?"#FEF2F2":C.surface2}}>
              <input type="checkbox" checked={f.injuries_reported} onChange={e=>set("injuries_reported",e.target.checked)} style={{accentColor:"#DC2626",width:15,height:15}}/>
              <span style={{fontSize:12,fontWeight:600,color:f.injuries_reported?"#DC2626":C.text2}}>Injuries reported</span>
            </label>
          </Field>
          {f.injuries_reported && (
            <Field label="Injury Details" full>
              <textarea value={f.injuries_description} onChange={e=>set("injuries_description",e.target.value)} rows={3} placeholder="Describe injuries to persons involved..." style={{...inp,resize:"vertical"}}/>
            </Field>
          )}
          <Field label="Witness Name">
            <input value={f.witness_1_name} onChange={e=>set("witness_1_name",e.target.value)} style={inp}/>
          </Field>
          <Field label="Witness Phone">
            <input value={f.witness_1_phone} onChange={e=>set("witness_1_phone",e.target.value)} style={inp}/>
          </Field>
        </Section>
      )}

      {/* Incident Description */}
      {reportType!=="witness" && (
        <Section title="Incident Description" icon="📝" color="#374151">
          <Field label="Full Description" required full hint="Include everything relevant — sequence of events, details observed, actions taken">
            <textarea value={f.incident_description} onChange={e=>set("incident_description",e.target.value)} rows={6} placeholder={reportType==="accident"?"Describe how the accident occurred, road markings, traffic conditions...":"Describe what happened in detail — chronological order where possible..."} style={{...inp,resize:"vertical"}}/>
          </Field>
          {(reportType==="complaint"||reportType==="crime_scene") && <>
            <Field label="Property Stolen / Damaged">
              <input value={f.property_stolen} onChange={e=>set("property_stolen",e.target.value)} placeholder="Describe items..." style={inp}/>
            </Field>
            <Field label="Estimated Value (FJD)">
              <input type="number" value={f.property_value} onChange={e=>set("property_value",e.target.value)} placeholder="0.00" style={inp}/>
            </Field>
            <Field label="Injuries">
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 10px",border:`1px solid ${f.injuries_reported?"#DC2626":C.border2}`,borderRadius:4,background:f.injuries_reported?"#FEF2F2":C.surface2}}>
                <input type="checkbox" checked={f.injuries_reported} onChange={e=>set("injuries_reported",e.target.checked)} style={{accentColor:"#DC2626",width:15,height:15}}/>
                <span style={{fontSize:12,fontWeight:600,color:f.injuries_reported?"#DC2626":C.text2}}>Person(s) injured</span>
              </label>
            </Field>
            <Field label="Weapons">
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 10px",border:`1px solid ${f.weapons_involved?"#DC2626":C.border2}`,borderRadius:4,background:f.weapons_involved?"#FEF2F2":C.surface2}}>
                <input type="checkbox" checked={f.weapons_involved} onChange={e=>set("weapons_involved",e.target.checked)} style={{accentColor:"#DC2626",width:15,height:15}}/>
                <span style={{fontSize:12,fontWeight:600,color:f.weapons_involved?"#DC2626":C.text2}}>Weapons involved</span>
              </label>
            </Field>
            {f.injuries_reported && (
              <Field label="Injury Description" full>
                <textarea value={f.injuries_description} onChange={e=>set("injuries_description",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
              </Field>
            )}
            {f.weapons_involved && (
              <Field label="Weapons Description" full>
                <textarea value={f.weapons_description} onChange={e=>set("weapons_description",e.target.value)} rows={2} placeholder="Type of weapon, description..." style={{...inp,resize:"vertical"}}/>
              </Field>
            )}
          </>}
        </Section>
      )}

      {/* Suspect */}
      {reportType!=="witness" && (
        <Section title="Suspect Information" icon="🔎" color="#6B21A8">
          <div style={{gridColumn:"1/-1"}}>
            <div style={{display:"flex",gap:12,marginBottom:12}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 14px",borderRadius:4,border:`2px solid ${f.suspect_known?C.accent:C.border}`,background:f.suspect_known?C.accentL:C.surface2,flex:1}}>
                <input type="checkbox" checked={f.suspect_known} onChange={e=>set("suspect_known",e.target.checked)} style={{accentColor:C.accent,width:15,height:15}}/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:f.suspect_known?C.accent:C.text}}>Suspect is known</div>
                  <div style={{fontSize:10,color:C.text3}}>Identity is known or suspected</div>
                </div>
              </label>
            </div>

            {f.suspect_known ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Field label="Suspect Name">
                  <input value={f.suspect_name} onChange={e=>set("suspect_name",e.target.value)} style={inp}/>
                </Field>
                <Field label="Last Seen">
                  <input value={f.suspect_last_seen} onChange={e=>set("suspect_last_seen",e.target.value)} placeholder="Location / time last seen" style={inp}/>
                </Field>
                <Field label="Suspect Vehicle">
                  <input value={f.suspect_vehicle} onChange={e=>set("suspect_vehicle",e.target.value)} placeholder="Vehicle reg, colour, make..." style={inp}/>
                </Field>
                <Field label="" >
                  <div/>
                </Field>
                {/* Link to existing criminal profile */}
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.text2,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Link to Criminal Profile Database</div>
                  {linkedSuspect ? (
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#FEF2F2",border:"1px solid #F0A0A0",borderRadius:4}}>
                      {linkedSuspect.photo_url && <img src={linkedSuspect.photo_url} alt="" style={{width:36,height:36,borderRadius:3,objectFit:"cover"}}/>}
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#991B1B"}}>{linkedSuspect.name}</div>
                        <div style={{fontSize:10,color:"#B91C1C",fontFamily:"monospace"}}>{linkedSuspect.id} · {linkedSuspect.primary_offence}</div>
                        {linkedSuspect.gang_affiliation&&<div style={{fontSize:10,color:"#7C0000"}}>⚠️ {linkedSuspect.gang_affiliation}</div>}
                      </div>
                      <button onClick={()=>setLinkedSuspect(null)} style={{...btnSm,color:"#991B1B",border:"1px solid #F0A0A0",background:"none",padding:"4px 8px"}}>Remove</button>
                    </div>
                  ) : (
                    <div style={{position:"relative"}}>
                      <input value={suspectSearch} onChange={e=>searchSuspect(e.target.value)}
                        placeholder="Search criminal profile by name or ID..." style={{...inp,paddingRight:100}}/>
                      {suspectResults.length > 0 && (
                        <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,zIndex:10,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
                          {suspectResults.map(r=>(
                            <div key={r.id} onClick={()=>{ setLinkedSuspect(r); setSuspectSearch(""); setSuspectResults([]); }}
                              style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",cursor:"pointer",borderBottom:`1px solid ${C.border}`}}
                              onMouseOver={e=>e.currentTarget.style.background=C.accentL}
                              onMouseOut={e=>e.currentTarget.style.background="none"}>
                              {r.photo_url&&<img src={r.photo_url} alt="" style={{width:30,height:30,borderRadius:3,objectFit:"cover"}}/>}
                              <div style={{flex:1}}>
                                <div style={{fontSize:12,fontWeight:600,color:C.text}}>{r.name}</div>
                                <div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>{r.id} · {r.status}</div>
                              </div>
                              <span style={{fontSize:11,color:C.accent,fontWeight:600}}>Link</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Field label="Suspect Description (Unknown)" full hint="Physical description, clothing, distinguishing features...">
                <textarea value={f.suspect_description} onChange={e=>set("suspect_description",e.target.value)} rows={3} placeholder="e.g. Male, approx 25-30 years, dark complexion, medium build, wearing blue shirt and black shorts, last seen running towards Cumming Street..." style={{...inp,resize:"vertical"}}/>
              </Field>
            )}
          </div>
        </Section>
      )}

      {/* Additional Witnesses */}
      {reportType!=="witness" && (
        <Section title="Additional Witnesses" icon="👥" color="#374151">
          <Field label="Witness Name">
            <input value={f.witness_1_name} onChange={e=>set("witness_1_name",e.target.value)} style={inp}/>
          </Field>
          <Field label="Witness Phone">
            <input value={f.witness_1_phone} onChange={e=>set("witness_1_phone",e.target.value)} style={inp}/>
          </Field>
          <Field label="Witness Statement" full>
            <textarea value={f.witness_1_statement} onChange={e=>set("witness_1_statement",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
          </Field>
          <Field label="2nd Witness Name">
            <input value={f.witness_2_name} onChange={e=>set("witness_2_name",e.target.value)} style={inp}/>
          </Field>
          <Field label="2nd Witness Phone">
            <input value={f.witness_2_phone} onChange={e=>set("witness_2_phone",e.target.value)} style={inp}/>
          </Field>
        </Section>
      )}

      {/* Evidence */}
      <Section title="Evidence Collected" icon="🔬" color="#374151">
        <Field label="Evidence Description" full>
          <textarea value={f.evidence_collected} onChange={e=>set("evidence_collected",e.target.value)} rows={3} placeholder="List all physical evidence collected, bagged, or noted at scene..." style={{...inp,resize:"vertical"}}/>
        </Field>
        <Field label="Photographs taken?">
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 10px",border:`1px solid ${f.evidence_photos?C.accent:C.border2}`,borderRadius:4,background:f.evidence_photos?C.accentL:C.surface2}}>
            <input type="checkbox" checked={f.evidence_photos} onChange={e=>set("evidence_photos",e.target.checked)} style={{accentColor:C.accent,width:15,height:15}}/>
            <span style={{fontSize:12,fontWeight:600,color:f.evidence_photos?C.accent:C.text2}}>Photos taken at scene</span>
          </label>
        </Field>
        <Field label="CCTV footage?">
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 10px",border:`1px solid ${f.evidence_cctv?C.accent:C.border2}`,borderRadius:4,background:f.evidence_cctv?C.accentL:C.surface2}}>
            <input type="checkbox" checked={f.evidence_cctv} onChange={e=>set("evidence_cctv",e.target.checked)} style={{accentColor:C.accent,width:15,height:15}}/>
            <span style={{fontSize:12,fontWeight:600,color:f.evidence_cctv?C.accent:C.text2}}>CCTV footage available</span>
          </label>
        </Field>
      </Section>

      {/* Referral */}
      <Section title="Referral & Follow-up" icon="📤" color="#374151">
        <Field label="Refer to Division">
          <select value={f.referred_to} onChange={e=>set("referred_to",e.target.value)} style={inp}>
            <option value="">— No referral —</option>
            {["CID — Criminal Investigation Department","Traffic Division","Drug Squad","Anti-Corruption Unit","Immigration","Interpol Liaison","Other Station"].map(d=><option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Initial Status">
          <select value={f.status} onChange={e=>set("status",e.target.value)} style={inp}>
            {["New","Under Investigation","Referred","Closed"].map(s=><option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Follow-up Notes" full>
          <textarea value={f.follow_up_notes} onChange={e=>set("follow_up_notes",e.target.value)} rows={3} placeholder="Any immediate actions taken, persons arrested, items seized..." style={{...inp,resize:"vertical"}}/>
        </Field>
      </Section>

      {/* Submit */}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        <button onClick={onCancel} style={btnSm}>Cancel</button>
        <button onClick={submit} style={{...btnBlue,padding:"10px 28px",fontSize:13}} disabled={saving}>
          {saving ? "Submitting..." : "✓ Submit Report"}
        </button>
      </div>
    </div>
  );
}

// ─── REPORTS LIST ─────────────────────────────────────────────────────────────
function ReportsList({ officer, viewAll }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [query, setQuery] = useState("");
  const [fType, setFType] = useState("");
  const [fStatus, setFStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("incident_reports").select("*").order("created_at",{ascending:false});
    if (!viewAll) q = q.eq("officer_user_id", officer.user_id);
    const { data } = await q;
    setReports(data||[]);
    setLoading(false);
  }, [officer, viewAll]);

  useEffect(()=>{ load(); },[load]);

  const filtered = reports.filter(r=>{
    if (query && !`${r.id} ${r.complainant_name||""} ${r.incident_location||""} ${r.offence_type||""}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (fType && r.report_type !== fType) return false;
    if (fStatus && r.status !== fStatus) return false;
    return true;
  });

  const TYPE_LABEL = { complaint:"Victim / Complaint", accident:"Traffic Accident", crime_scene:"Crime Scene", witness:"Witness Statement" };
  const TYPE_ICON = { complaint:"👤", accident:"🚗", crime_scene:"🔍", witness:"👁" };

  if (sel) return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"24px" }}>
      <button onClick={()=>setSel(null)} style={{...btnSm,marginBottom:16}}>← Back to list</button>
      <div style={{ background:C.nav, borderRadius:6, padding:"16px 20px", marginBottom:16, borderBottom:"2px solid #2A5EC4" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"monospace", letterSpacing:"0.08em", marginBottom:3 }}>{sel.id}</div>
            <div style={{ fontSize:17, fontWeight:700, color:"#fff" }}>{TYPE_ICON[sel.report_type]} {TYPE_LABEL[sel.report_type]}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{sel.incident_date} · {sel.incident_location}</div>
          </div>
          <Badge label={sel.status} style={STATUS_STYLE[sel.status]}/>
        </div>
      </div>

      {[
        { title:"Reported by", data:[[sel.officer_name, "Officer"],[sel.officer_badge,"Badge"],[sel.officer_station,"Station"],[sel.officer_rank,"Rank"]] },
        sel.complainant_name&&{ title:"Complainant / Victim", data:[[sel.complainant_name,"Name"],[sel.complainant_dob,"DOB"],[sel.complainant_phone,"Phone"],[sel.complainant_address,"Address"],[sel.complainant_nationality,"Nationality"],[sel.complainant_occupation,"Occupation"]] },
        { title:"Incident", data:[[sel.incident_date,"Date"],[sel.incident_time,"Time"],[sel.incident_location,"Location"],[sel.incident_location_detail,"Detail"],[sel.offence_type,"Offence"],[sel.injuries_reported?"Yes":"No","Injuries"],[sel.weapons_involved?"Yes":"No","Weapons"]] },
        sel.accident_type&&{ title:"Accident Details", data:[[sel.accident_type,"Type"],[sel.road_conditions,"Road"],[sel.vehicle_reg_1,"Vehicle 1 Reg"],[sel.vehicle_driver_1,"Vehicle 1 Driver"],[sel.vehicle_reg_2,"Vehicle 2 Reg"],[sel.vehicle_driver_2,"Vehicle 2 Driver"],[sel.fatalities,"Fatalities"]] },
        (sel.suspect_known||sel.suspect_description)&&{ title:"Suspect", data:[[sel.suspect_name||"Unknown — see description","Name"],[sel.suspect_description,"Description"],[sel.suspect_profile_id,"Linked Profile ID"],[sel.suspect_last_seen,"Last Seen"],[sel.suspect_vehicle,"Vehicle"]] },
        sel.witness_1_name&&{ title:"Witness", data:[[sel.witness_1_name,"Name"],[sel.witness_1_phone,"Phone"]] },
        { title:"Evidence", data:[[sel.evidence_photos?"Yes":"No","Photos taken"],[sel.evidence_cctv?"Yes":"No","CCTV"],[sel.evidence_collected,"Description"]] },
        { title:"Referral", data:[[sel.referred_to||"None","Referred to"],[sel.status,"Status"],[sel.follow_up_notes,"Notes"]] },
      ].filter(Boolean).map((s,i)=>(
        <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", marginBottom:12 }}>
          <div style={{ padding:"8px 14px", background:"#F8F9FC", borderBottom:`1px solid ${C.border}`, fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.08em", textTransform:"uppercase" }}>{s.title}</div>
          <div style={{ padding:"12px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
            {s.data.filter(([v])=>v).map(([v,l],j)=>(
              <div key={j} style={{ display:"flex", flexDirection:"column", gap:1 }}>
                <span style={{ fontSize:10, color:C.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{l}</span>
                <span style={{ fontSize:12, color:C.text, fontWeight:500, lineHeight:1.5 }}>{v}</span>
              </div>
            ))}
          </div>
          {s.title==="Incident"&&sel.incident_description&&(
            <div style={{ padding:"0 14px 12px" }}>
              <div style={{ fontSize:10, color:C.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 }}>Full Description</div>
              <div style={{ fontSize:12, color:C.text2, lineHeight:1.7, background:C.surface2, padding:"10px 12px", borderRadius:4, border:`1px solid ${C.border}`, whiteSpace:"pre-wrap" }}>{sel.incident_description}</div>
            </div>
          )}
          {s.title==="Witness"&&sel.witness_1_statement&&(
            <div style={{ padding:"0 14px 12px" }}>
              <div style={{ fontSize:10, color:C.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 }}>Statement</div>
              <div style={{ fontSize:12, color:C.text2, lineHeight:1.7, background:C.surface2, padding:"10px 12px", borderRadius:4, border:`1px solid ${C.border}`, whiteSpace:"pre-wrap" }}>{sel.witness_1_statement}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding:"16px 24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:C.text3, fontSize:13, pointerEvents:"none" }}>🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ID, name, location..." style={{...inp,paddingLeft:30,width:220,height:34,fontSize:12}}/>
        </div>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={{...inp,height:34,width:"auto",fontSize:12}}>
          <option value="">All report types</option>
          {Object.entries(TYPE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{...inp,height:34,width:"auto",fontSize:12}}>
          <option value="">All statuses</option>
          {["New","Under Investigation","Referred","Closed"].map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={load} style={{...btnSm,height:34}}>↻ Refresh</button>
        <span style={{ fontSize:12, color:C.text3, marginLeft:"auto" }}>{filtered.length} reports</span>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:"center", color:C.text3 }}>Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:40, textAlign:"center", color:C.text3 }}>No reports found.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(r=>(
            <div key={r.id} onClick={()=>setSel(r)}
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, borderLeft:`3px solid ${REPORT_TYPES.find(t=>t.id===r.report_type)?.color||C.border}` }}
              onMouseOver={e=>e.currentTarget.style.background="#F0F4FC"}
              onMouseOut={e=>e.currentTarget.style.background=C.surface}>
              <div style={{ fontSize:22 }}>{TYPE_ICON[r.report_type]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:10, color:C.text3, fontFamily:"monospace" }}>{r.id}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:C.text }}>{TYPE_LABEL[r.report_type]}</span>
                </div>
                <div style={{ fontSize:12, color:C.text2, marginTop:2 }}>
                  {r.complainant_name ? `Complainant: ${r.complainant_name} · ` : ""}{r.incident_location} · {r.incident_date}
                </div>
                {r.offence_type && <div style={{ fontSize:11, color:C.text3, marginTop:1 }}>{r.offence_type}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                <Badge label={r.status} style={STATUS_STYLE[r.status]}/>
                <span style={{ fontSize:10, color:C.text3 }}>{r.officer_station}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN OFFICER PORTAL ─────────────────────────────────────────────────────
export default function OfficerPortal({ user, officer, onLogout }) {
  const [view, setView] = useState("dashboard"); // 'dashboard', 'new', 'my_reports', 'all_reports'
  const [successId, setSuccessId] = useState(null);
  const [stats, setStats] = useState({ total:0, today:0, myReports:0 });

  useEffect(()=>{
    const loadStats = async () => {
      const today = new Date().toISOString().slice(0,10);
      const [{ count:total }, { count:today_count }, { count:mine }] = await Promise.all([
        supabase.from("incident_reports").select("*",{count:"exact",head:true}),
        supabase.from("incident_reports").select("*",{count:"exact",head:true}).gte("created_at",today),
        supabase.from("incident_reports").select("*",{count:"exact",head:true}).eq("officer_user_id",officer.user_id),
      ]);
      setStats({ total:total||0, today:today_count||0, myReports:mine||0 });
    };
    loadStats();
  },[officer, view]);

  const handleSubmitted = (id) => { setSuccessId(id); setView("success"); };

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Classification */}
      <div style={{ background:"#7C0000", padding:"3px 24px", textAlign:"center" }}>
        <span style={{ fontSize:10, fontWeight:700, color:"#fff", letterSpacing:"0.18em", textTransform:"uppercase" }}>⚠ CLASSIFIED — AUTHORISED PERSONNEL ONLY ⚠</span>
      </div>

      {/* Nav */}
      <div style={{ display:"flex", alignItems:"center", padding:"0 24px", height:58, background:C.nav, gap:14, borderBottom:"3px solid #2A5EC4", position:"sticky", top:22, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, borderRight:"1px solid rgba(255,255,255,0.12)", paddingRight:16 }}>
          <div style={{ width:36, height:36, borderRadius:4, background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:"1px solid rgba(255,255,255,0.15)" }}>🛡️</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.02em" }}>NCIC</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.06em", textTransform:"uppercase" }}>Officer Portal</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>Incident Reporting System</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.04em" }}>{officer.station} · Badge {officer.badge_number}</div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", borderRight:"1px solid rgba(255,255,255,0.12)", paddingRight:12, marginRight:4 }}>
          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:10, marginRight:4 }}>Officer:</span>{officer.full_name} · {officer.rank}
        </div>
        <button onClick={()=>setView("new")} style={{ ...btnBlue, background:"#1447C4", border:"1px solid #1035A0", fontSize:12, padding:"7px 16px" }}>+ New Report</button>
        <button onClick={onLogout} style={btnGhost}>Sign out</button>
      </div>

      {/* Nav tabs */}
      <div style={{ display:"flex", background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
        {[
          { id:"dashboard", label:"Dashboard" },
          { id:"my_reports", label:"My Reports" },
          { id:"all_reports", label:"All Station Reports" },
        ].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{ padding:"12px 16px", fontSize:13, fontWeight:view===t.id?600:400, color:view===t.id?C.accent:C.text3, borderBottom:view===t.id?`2px solid ${C.accent}`:"2px solid transparent", background:"none", border:"none", cursor:"pointer", marginBottom:"-1px" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Success */}
        {view==="success" && (
          <div style={{ padding:"40px 24px", textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#DCFCE7", border:"3px solid #6EE7B7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}>✓</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#166534", marginBottom:6 }}>Report Submitted</div>
            <div style={{ fontSize:13, color:C.text3, marginBottom:4 }}>Reference number: <strong style={{ fontFamily:"monospace", color:C.text }}>{successId}</strong></div>
            <div style={{ fontSize:12, color:C.text3, marginBottom:24 }}>The incident report has been saved to the database.</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={()=>setView("new")} style={{ ...btnBlue, padding:"9px 20px" }}>+ New Report</button>
              <button onClick={()=>setView("my_reports")} style={{ ...btnSm, padding:"9px 20px" }}>View my reports</button>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {view==="dashboard" && (
          <div style={{ padding:"24px" }}>
            <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:4 }}>Welcome, {officer.full_name}</div>
            <div style={{ fontSize:13, color:C.text3, marginBottom:20 }}>{officer.rank} · {officer.station} · Badge No. {officer.badge_number}</div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
              {[
                { l:"My Reports", v:stats.myReports, color:"#1447C4", bg:"#E8EFFD" },
                { l:"Station Total", v:stats.total, color:"#166534", bg:"#DCFCE7" },
                { l:"Submitted Today", v:stats.today, color:"#B45309", bg:"#FEF3C7" },
              ].map(s=>(
                <div key={s.l} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"18px 20px", borderLeft:`4px solid ${s.color}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:s.color, letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:4 }}>{s.l}</div>
                  <div style={{ fontSize:32, fontWeight:700, color:s.color }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:12 }}>Submit a New Report</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {REPORT_TYPES.map(rt=>(
                <div key={rt.id} onClick={()=>setView("new")}
                  style={{ background:C.surface, border:`2px solid ${C.border}`, borderRadius:6, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}
                  onMouseOver={e=>{ e.currentTarget.style.borderColor=rt.color; e.currentTarget.style.background=rt.bg; }}
                  onMouseOut={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.surface; }}>
                  <div style={{ fontSize:24 }}>{rt.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{rt.label}</div>
                    <div style={{ fontSize:11, color:C.text3, lineHeight:1.4 }}>{rt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Report */}
        {view==="new" && <ReportForm officer={officer} onSubmitted={handleSubmitted} onCancel={()=>setView("dashboard")}/>}

        {/* My Reports */}
        {view==="my_reports" && <ReportsList officer={officer} viewAll={false}/>}

        {/* All Station Reports */}
        {view==="all_reports" && <ReportsList officer={officer} viewAll={true}/>}
      </div>

      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", padding:"7px 24px", background:C.nav, borderTop:`2px solid ${C.border}`, marginTop:24 }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em", textTransform:"uppercase" }}>NCIC · National Criminal Intelligence Centre · Officer Portal · FY2026 · CONFIDENTIAL</span>
      </div>
    </div>
  );
}
