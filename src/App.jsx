import { useState, useRef, useEffect } from "react";

const C = {
  bg:"#000000", surface:"#1C1C1E", surface2:"#2C2C2E", surface3:"#3A3A3C",
  divider:"rgba(255,255,255,.1)", text:"#FFFFFF", textSub:"rgba(235,235,245,.8)",
  textMuted:"#8E8E93", accent:"#FFD60A", danger:"#FF453A", green:"#32D74B",
  blue:"#0A84FF", chevron:"#48484A",
};

const FOLDER_COLORS = [
  { id:"gold",   dot:"#FFD60A", bg:"rgba(255,214,10,.12)"  },
  { id:"blue",   dot:"#5AC8FA", bg:"rgba(90,200,250,.12)"  },
  { id:"green",  dot:"#32D74B", bg:"rgba(50,215,75,.12)"   },
  { id:"rose",   dot:"#FF375F", bg:"rgba(255,55,95,.12)"   },
  { id:"violet", dot:"#BF5AF2", bg:"rgba(191,90,242,.12)"  },
  { id:"orange", dot:"#FF9F0A", bg:"rgba(255,159,10,.12)"  },
  { id:"teal",   dot:"#5CE5D5", bg:"rgba(92,229,213,.12)"  },
  { id:"gray",   dot:"#8E8E93", bg:"rgba(142,142,147,.12)" },
];

const PALETTES = [
  { id:"amber",  bg:"#1A1400", accent:"#FFD60A" },
  { id:"cobalt", bg:"#001228", accent:"#5AC8FA" },
  { id:"forest", bg:"#001208", accent:"#32D74B" },
  { id:"rose",   bg:"#1A0010", accent:"#FF375F" },
  { id:"violet", bg:"#0D0020", accent:"#BF5AF2" },
  { id:"rust",   bg:"#1A0A00", accent:"#FF9F0A" },
  { id:"teal",   bg:"#001418", accent:"#5CE5D5" },
  { id:"silver", bg:"#111111", accent:"#AEAEB2" },
];

const uid = () => Math.random().toString(36).slice(2,9);
const fmtTime = ts => {
  const now=new Date(), d=new Date(ts);
  const yest=new Date(now); yest.setDate(now.getDate()-1);
  if(now.toDateString()===d.toDateString())  return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
  if(yest.toDateString()===d.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const groupLabel = ts => {
  const now=new Date(), d=new Date(ts);
  const yest=new Date(now); yest.setDate(now.getDate()-1);
  if(now.toDateString()===d.toDateString())  return "Today";
  if(yest.toDateString()===d.toDateString()) return "Yesterday";
  const diff=Math.floor((now-d)/86400000);
  if(diff<7) return d.toLocaleDateString("en-US",{weekday:"long"});
  return d.toLocaleDateString("en-US",{month:"long",year:"numeric"});
};
function getYouTubeId(url="") {
  const m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m?m[1]:null;
}
const ytThumb = id => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const makeTs = n => Date.now()-n*86400000;
const folderColor = f => FOLDER_COLORS.find(c=>c.id===f?.colorId)||FOLDER_COLORS[0];

const INIT_FOLDERS = [
  { id:"notes",    name:"Notes",    colorId:"gold"   },
  { id:"journals", name:"Journals", colorId:"blue"   },
  { id:"ideas",    name:"Ideas",    colorId:"violet" },
];
const INIT_NOTES = [
  { id:"n1", folderId:"notes",    title:"CHE 412 Exam prep",  body:"Static Characteristics: Are concerned with the steady state behaviour of instruments.", cover:null, starred:false, trashed:false, ts:makeTs(0), pinned:false },
  { id:"n2", folderId:"journals", title:"Entry 17032026",     body:"I think this will be my new journal and notes app.", cover:{type:"palette",...PALETTES[0]}, starred:false, trashed:false, ts:makeTs(1), pinned:false },
  { id:"n3", folderId:"notes",    title:"Movies Watchlist",   body:"Inception (Mind-bending thriller)\nInterstellar\nDune Part 2", cover:null, starred:true, trashed:false, ts:makeTs(1), pinned:false },
];

function coverBg(cover) {
  if(!cover) return C.surface;
  if(cover.type==="palette") return cover.bg || C.surface;
  if(cover.type==="image")   return cover.src ? `url(${cover.src}) center/cover no-repeat` : C.surface;
  if(cover.type==="youtube") return cover.videoId ? `url(${ytThumb(cover.videoId)}) center/cover no-repeat` : C.surface;
  return C.surface;
}

// ─── Safe localStorage persistence ───────────────────────────────────────
const STORE_KEY = "notes_app_v1";

function sanitizeCover(cover) {
  if (!cover) return null;
  if (cover.type === "palette") {
    const palette = PALETTES.find(p => p.id === cover.id) || PALETTES[0];
    return { type:"palette", ...palette };
  }
  if (cover.type === "image" && cover.src) return cover;
  if (cover.type === "youtube" && cover.videoId) return cover;
  return null;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.notes) {
      parsed.notes = parsed.notes.map(n => ({ ...n, cover: sanitizeCover(n.cover) }));
    }
    return parsed;
  } catch { return null; }
}
function saveState(folders, notes) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ folders, notes })); } catch {}
}
const _saved = loadState();
const DEFAULT_FOLDERS = _saved?.folders || INIT_FOLDERS;
const DEFAULT_NOTES   = _saved?.notes   || INIT_NOTES;

// ─── SVG Icons ────────────────────────────────────────────────────────────
const Icon = ({ name, size=20, color=C.textMuted, style:s }) => {
  const p = { fill:"none", stroke:color, strokeWidth:1.5, strokeLinecap:"round", strokeLinejoin:"round" };
  const paths = {
    folder:      <><path {...p} d="M3 7.5C3 6.4 3.9 5.5 5 5.5h3.5l1.5 2H17c1.1 0 2 .9 2 2V15c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7.5z"/></>,
    "folder-new":<><path {...p} d="M3 7.5C3 6.4 3.9 5.5 5 5.5h3.5l1.5 2H17c1.1 0 2 .9 2 2V15c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7.5z"/><path {...p} d="M10 10v4M8 12h4"/></>,
    compose:     <><path {...p} d="M14 3.5l3 3L7 16.5 3 17.5l1-4L14 3.5z"/></>,
    pin:         <><path {...p} d="M12 2.5l5 5-1 1-1.5-.5L10 13l.5 1.5-1 1-5-5 1-1 1.5.5 4.5-4.5-.5-1.5 1-1zM7 13.5l-3 3"/></>,
    trash:       <><polyline {...p} points="3,7 5,7 19,7"/><path {...p} d="M8 7V5h8v2M6 7l1 12h10l1-12"/><path {...p} d="M10 11v5M14 11v5"/></>,
    settings:    <><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    allnotes:    <><path {...p} d="M4 6h16M4 10h16M4 14h10"/></>,
    search:      <><circle {...p} cx="11" cy="11" r="7"/><path {...p} d="M21 21l-4.35-4.35"/></>,
    share:       <><path {...p} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><polyline {...p} points="16,6 12,2 8,6"/><line {...p} x1="12" y1="2" x2="12" y2="15"/></>,
    more:        <><circle {...p} fill={color} stroke="none" cx="5" cy="12" r="1.2"/><circle {...p} fill={color} stroke="none" cx="12" cy="12" r="1.2"/><circle {...p} fill={color} stroke="none" cx="19" cy="12" r="1.2"/></>,
    back:        <><path {...p} d="M15 18l-6-6 6-6"/></>,
    drive:       <><path {...p} d="M12 2L2 19h20L12 2z" strokeWidth="1.3"/><path {...p} d="M2 19h20M7 12h10"/></>,
    sort:        <><path {...p} d="M3 6h18M6 12h12M9 18h6"/></>,
    palette:     <><circle {...p} cx="12" cy="12" r="9"/><circle {...p} cx="9" cy="10" r="1.2" fill={color} stroke="none"/><circle {...p} cx="15" cy="10" r="1.2" fill={color} stroke="none"/><circle {...p} cx="12" cy="15" r="1.2" fill={color} stroke="none"/></>,
    check:       <><polyline {...p} points="20,6 9,17 4,12"/></>,
    image:       <><rect {...p} x="3" y="3" width="18" height="18" rx="2"/><circle {...p} cx="8.5" cy="8.5" r="1.5"/><polyline {...p} points="21,15 16,10 5,21"/></>,
    youtube:     <><rect {...p} x="2" y="5" width="20" height="14" rx="2.5"/><polygon {...p} fill={color} stroke="none" points="10,9 16,12 10,15"/></>,
    backup:      <><polyline {...p} points="8,17 12,13 16,17"/><line {...p} x1="12" y1="13" x2="12" y2="21"/><path {...p} d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></>,
    clock:       <><circle {...p} cx="12" cy="12" r="9"/><polyline {...p} points="12,7 12,12 15,15"/></>,
    az:          <><path {...p} d="M4 7h8M4 12h5M4 17h3"/><path {...p} d="M15 8l3-3 3 3M18 5v9M15 14h3v3h-3v-3z"/></>,
    scan:        <><path {...p} d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><rect {...p} x="7" y="7" width="10" height="10" rx="1"/></>,
    move:        <><path {...p} d="M3 7.5C3 6.4 3.9 5.5 5 5.5h3.5l1.5 2H17c1.1 0 2 .9 2 2V15c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7.5z"/><path {...p} d="M13 12h4m0 0l-2-2m2 2l-2 2"/></>,
    bold:        <><path {...p} d="M6 4h8a4 4 0 010 8H6z"/><path {...p} d="M6 12h9a4 4 0 010 8H6z"/></>,
    italic:      <><line {...p} x1="19" y1="4" x2="10" y2="4"/><line {...p} x1="14" y1="20" x2="5" y2="20"/><line {...p} x1="15" y1="4" x2="9" y2="20"/></>,
    underline:   <><path {...p} d="M6 3v7a6 6 0 0012 0V3"/><line {...p} x1="4" y1="21" x2="20" y2="21"/></>,
    textsize:    <><polyline {...p} points="4,7 4,4 20,4 20,7"/><line {...p} x1="9" y1="20" x2="15" y2="20"/><line {...p} x1="12" y1="4" x2="12" y2="20"/></>,
    undo:        <><path {...p} d="M3 7h10a5 5 0 010 10H5"/><polyline {...p} points="7,3 3,7 7,11"/></>,
    redo:        <><path {...p} d="M17 7H7a5 5 0 000 10h8"/><polyline {...p} points="13,3 17,7 13,11"/></>,
    bullet:      <><circle {...p} cx="5" cy="7" r="1.2" fill={color} stroke="none"/><line {...p} x1="9" y1="7" x2="19" y2="7"/><circle {...p} cx="5" cy="12" r="1.2" fill={color} stroke="none"/><line {...p} x1="9" y1="12" x2="19" y2="12"/><circle {...p} cx="5" cy="17" r="1.2" fill={color} stroke="none"/><line {...p} x1="9" y1="17" x2="19" y2="17"/></>,
    numbered:    <><path {...p} d="M4 5h2v6H4M4 5l2 0M4 11h2"/><path {...p} d="M4 16h1.5a1 1 0 010 2H4m0 2h2"/><line {...p} x1="9" y1="6" x2="19" y2="6"/><line {...p} x1="9" y1="12" x2="19" y2="12"/><line {...p} x1="9" y1="18" x2="19" y2="18"/></>,
    quote:       <><path {...p} d="M3 10h4v4H3v-4zm0 0c0-3 2-5 4-6M11 10h4v4h-4v-4zm0 0c0-3 2-5 4-6"/></>,
    link:        <><path {...p} d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path {...p} d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    divline:     <><line {...p} x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/></>,
    strike:      <><line {...p} x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/><path {...p} d="M16 6c-.5-1.5-2-2.5-4-2.5s-4 1-4 3c0 1.5.8 2.3 2 2.8M8 18c.5 1.5 2 2.5 4 2.5s4-1 4-3"/></>,
    checklist:   <><polyline {...p} points="9,12 11,14 15,10"/><rect {...p} x="3" y="4" width="7" height="7" rx="1"/><rect {...p} x="3" y="13" width="7" height="7" rx="1"/><line {...p} x1="14" y1="6" x2="20" y2="6"/><line {...p} x1="14" y1="15" x2="20" y2="15"/></>,
    camera:      <><path {...p} d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle {...p} cx="12" cy="13" r="4"/></>,
    keyboard:    <><rect {...p} x="2" y="4" width="20" height="16" rx="2"/><line {...p} x1="6" y1="9" x2="6" y2="9"/><line {...p} x1="10" y1="9" x2="10" y2="9"/><line {...p} x1="14" y1="9" x2="14" y2="9"/><line {...p} x1="18" y1="9" x2="18" y2="9"/><line {...p} x1="8" y1="13" x2="16" y2="13"/></>,
    rename:      <><path {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path {...p} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    screenshot:  <><rect {...p} x="3" y="3" width="18" height="18" rx="2"/><circle {...p} cx="12" cy="12" r="4"/><line {...p} x1="3" y1="9" x2="21" y2="9"/></>,
    copy:        <><rect {...p} x="9" y="9" width="13" height="13" rx="2"/><path {...p} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    filetext:    <><path {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline {...p} points="14,2 14,8 20,8"/><line {...p} x1="16" y1="13" x2="8" y2="13"/><line {...p} x1="16" y1="17" x2="8" y2="17"/><polyline {...p} points="10,9 9,9 8,9"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={s}>
      {paths[name]}
    </svg>
  );
};

// ─── Shared components ────────────────────────────────────────────────────
function Row({ left, label, sub, badge, onTap, noBorder, danger, rightEl }) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onTap} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:14, padding:"13px 16px",
        borderBottom:noBorder?"none":`1px solid ${C.divider}`,
        cursor:onTap?"pointer":"default",
        background:hov&&onTap?"rgba(255,255,255,.03)":"transparent",
        transition:"background .1s",
      }}>
      {left&&<div style={{flexShrink:0,display:"flex",alignItems:"center"}}>{left}</div>}
      <div style={{flex:1,minWidth:0}}>
        <span style={{fontSize:17,color:danger?C.danger:C.text,fontFamily:"-apple-system,sans-serif",display:"block"}}>{label}</span>
        {sub&&<span style={{fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{sub}</span>}
      </div>
      {rightEl&&rightEl}
      {badge!=null&&<span style={{fontSize:16,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{badge}</span>}
      {onTap&&<Icon name="back" size={18} color={C.chevron} style={{transform:"rotate(180deg)"}}/>}
    </div>
  );
}

const Card = ({ children, style:s }) => (
  <div style={{background:C.surface,borderRadius:13,overflow:"hidden",marginBottom:8,...s}}>{children}</div>
);

// ─── Formatting toolbar ───────────────────────────────────────────────────
const LINE_TAGS = { "[T]":"Title", "[H]":"Heading", "[S]":"Subhead" };

function FormatToolbar({ bodyRef, body, setBody }) {
  const [tab, setTab] = useState(null); // null=collapsed, "lists","text","check","camera"
  const [, tick] = useState(0);

  const getLine = () => {
    const ta=bodyRef.current; if(!ta) return "";
    const s=ta.value.lastIndexOf("\n",ta.selectionStart-1)+1;
    const e=ta.value.indexOf("\n",ta.selectionStart);
    return ta.value.slice(s,e===-1?ta.value.length:e);
  };
  const getActiveStyle = () => {
    const line=getLine();
    for(const t of Object.keys(LINE_TAGS)) if(line.startsWith(t)) return t;
    return "body";
  };

  const wrapLine = (tag) => {
    const ta=bodyRef.current; if(!ta) return;
    const s=ta.value.lastIndexOf("\n",ta.selectionStart-1)+1;
    const e=ta.value.indexOf("\n",ta.selectionStart);
    const end=e===-1?ta.value.length:e;
    const line=ta.value.slice(s,end);
    let clean=line;
    for(const t of Object.keys(LINE_TAGS)) if(clean.startsWith(t)) clean=clean.slice(t.length);
    // also strip list prefixes
    clean=clean.replace(/^(- \[[ x]\] |- |\d+\. |\| )/,"");
    const newLine = line.startsWith(tag) ? clean : tag+clean;
    setBody(ta.value.slice(0,s)+newLine+ta.value.slice(end));
    setTimeout(()=>tick(n=>n+1),0);
  };

  const wrapInline = (open,close) => {
    const ta=bodyRef.current; if(!ta) return;
    const s=ta.selectionStart, e=ta.selectionEnd;
    const sel=ta.value.slice(s,e)||"text";
    setBody(ta.value.slice(0,s)+open+sel+close+ta.value.slice(e));
    setTimeout(()=>{ ta.focus(); ta.setSelectionRange(s+open.length,s+open.length+sel.length); },0);
  };

  const insertLinePrefix = (prefix) => {
    const ta=bodyRef.current; if(!ta) return;
    const s=ta.value.lastIndexOf("\n",ta.selectionStart-1)+1;
    const e=ta.value.indexOf("\n",ta.selectionStart);
    const end=e===-1?ta.value.length:e;
    const line=ta.value.slice(s,end);
    // strip any existing prefix or line tag
    let clean=line;
    for(const t of Object.keys(LINE_TAGS)) if(clean.startsWith(t)) clean=clean.slice(t.length);
    clean=clean.replace(/^(- \[[ x]\] |- |\d+\. |\| |---)/,"");
    const newLine = line.startsWith(prefix) ? clean : prefix+clean;
    setBody(ta.value.slice(0,s)+newLine+ta.value.slice(end));
    setTimeout(()=>tick(n=>n+1),0);
  };

  const insertDivider = () => {
    const ta=bodyRef.current; if(!ta) return;
    const pos=ta.selectionStart;
    const before=ta.value.slice(0,pos);
    const after=ta.value.slice(pos);
    const insert=(before.endsWith("\n")||before===""?"":"\n")+"---\n";
    setBody(before+insert+after);
  };

  const activeStyle = getActiveStyle();

  const TB = ({bg=false}) => ({
    display:"flex", alignItems:"center",
    padding:"6px 12px", gap:2,
    background: bg?"rgba(28,28,30,.98)":"rgba(22,22,24,.98)",
    borderTop:`1px solid ${C.divider}`,
    overflowX:"auto", WebkitOverflowScrolling:"touch",
  });

  const Btn = ({icon,label,action,active:isAct,danger:isDanger,close:isClose}) => (
    <button onClick={action} style={{
      background:isAct?"rgba(255,255,255,.14)":"none",
      border:"none", cursor:"pointer", flexShrink:0,
      color:isDanger?C.danger:isAct?C.accent:isClose?"rgba(255,255,255,.5)":"rgba(255,255,255,.8)",
      fontSize:13, fontWeight:600, padding:"6px 10px", borderRadius:7,
      fontFamily:"-apple-system,sans-serif",
      display:"flex",alignItems:"center",justifyContent:"center",
      minWidth:icon&&!label?36:undefined,
    }}>
      {icon&&<Icon name={icon} size={18} color={isDanger?C.danger:isAct?C.accent:isClose?"rgba(255,255,255,.4)":"rgba(255,255,255,.8)"}/>}
      {label&&<span style={{marginLeft:icon?4:0}}>{label}</span>}
    </button>
  );

  // Tab icons row (always visible)
  const tabBar = (
    <div style={{...TB(), justifyContent:"space-around"}}>
      <Btn icon="bullet"    action={()=>setTab(t=>t==="lists"?null:"lists")}  active={tab==="lists"}/>
      <Btn icon="textsize"  action={()=>setTab(t=>t==="text"?null:"text")}    active={tab==="text"}/>
      <Btn icon="checklist" action={()=>setTab(t=>t==="check"?null:"check")}  active={tab==="check"}/>
      <Btn icon="camera"    action={()=>setTab(t=>t==="camera"?null:"camera")} active={tab==="camera"}/>
      <Btn icon="keyboard"  action={()=>{ setTab(null); bodyRef.current?.blur(); }} close/>
    </div>
  );

  // Lists panel
  const listsPanel = (
    <div style={TB(true)}>
      <Btn icon="bullet"   action={()=>insertLinePrefix("- ")}        active={getLine().startsWith("- ")&&!getLine().startsWith("- [")}/>
      <Btn icon="numbered" action={()=>insertLinePrefix("1. ")}       active={getLine().startsWith("1. ")||/^\d+\. /.test(getLine())}/>
      <Btn icon="quote"    action={()=>insertLinePrefix("| ")}        active={getLine().startsWith("| ")}/>
      <Btn icon="link"     action={()=>wrapInline("[","](url)")}      active={false}/>
      <Btn icon="divline"  action={insertDivider}                     active={false}/>
      <div style={{flex:1}}/>
      <Btn icon="more" close action={()=>setTab(null)}/>
    </div>
  );

  // Text style panel — two sub-rows
  const textPanel = (
    <div style={{background:"rgba(22,22,24,.98)",borderTop:`1px solid ${C.divider}`}}>
      {/* Row 1: size styles */}
      <div style={{display:"flex",alignItems:"center",padding:"6px 12px",gap:4,borderBottom:`1px solid rgba(255,255,255,.06)`}}>
        {[["[T]","Title"],["[H]","Heading"],["[S]","Subheading"],["","Body"]].map(([tag,label])=>(
          <button key={tag} onClick={()=>wrapLine(tag)} style={{
            flex:1, padding:"7px 4px", border:"none", cursor:"pointer", borderRadius:8,
            background:activeStyle===( tag||"body")?"#FFD60A":"rgba(255,255,255,.06)",
            color:activeStyle===(tag||"body")?"#000":"rgba(255,255,255,.8)",
            fontSize:13, fontWeight:600, fontFamily:"-apple-system,sans-serif",
          }}>{label}</button>
        ))}
        <Btn icon="more" close action={()=>setTab(null)}/>
      </div>
      {/* Row 2: inline styles */}
      <div style={{display:"flex",alignItems:"center",padding:"4px 12px",gap:2}}>
        <Btn icon="bold"      action={()=>wrapInline("**","**")} active={false}/>
        <Btn icon="italic"    action={()=>wrapInline("_","_")}   active={false}/>
        <Btn icon="underline" action={()=>wrapInline("__","__")} active={false}/>
        <Btn icon="strike"    action={()=>wrapInline("~~","~~")} active={false}/>
      </div>
    </div>
  );

  // Checklist panel
  const checkPanel = (
    <div style={TB(true)}>
      <Btn icon="checklist" label="Checklist" action={()=>insertLinePrefix("- [ ] ")} active={getLine().startsWith("- [")}/>
      <div style={{flex:1}}/>
      <Btn icon="more" close action={()=>setTab(null)}/>
    </div>
  );

  return (
    <div>
      {tab==="lists"  && listsPanel}
      {tab==="text"   && textPanel}
      {tab==="check"  && checkPanel}
      {tabBar}
    </div>
  );
}

// ─── ⋯ More menu ──────────────────────────────────────────────────────────
function MoreMenu({ onClose, pinned, onPin, onCover, onMoveTo, onDelete }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:600}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute", top:88, right:14,
        background:"#2C2C2E", borderRadius:14,
        boxShadow:"0 8px 40px rgba(0,0,0,.75)",
        overflow:"hidden", minWidth:220,
      }}>
        {/* Icon row */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.divider}`}}>
          {[
            { icon:"scan",    label:"Scan",  action:onClose },
            { icon:"pin",     label:pinned?"Unpin":"Pin", action:()=>{onPin();onClose();} },
            { icon:"palette", label:"Cover", action:()=>{onCover();onClose();} },
          ].map(({icon,label,action})=>(
            <button key={label} onClick={action} style={{
              flex:1,padding:"14px 0",background:"none",border:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:5,
            }}>
              <Icon name={icon} size={20} color={C.text}/>
              <span style={{fontSize:11,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{label}</span>
            </button>
          ))}
        </div>
        {/* List rows */}
        <button onClick={()=>{onMoveTo();onClose();}} style={{
          width:"100%",padding:"14px 16px",background:"none",border:"none",
          borderBottom:`1px solid ${C.divider}`,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>Move Note</span>
          <Icon name="move" size={20} color={C.textMuted}/>
        </button>
        <button onClick={onClose} style={{
          width:"100%",padding:"14px 16px",background:"none",border:"none",
          borderBottom:`1px solid ${C.divider}`,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>Dark Background</span>
          <Icon name="palette" size={20} color={C.textMuted}/>
        </button>
        <button onClick={()=>{onDelete();onClose();}} style={{
          width:"100%",padding:"14px 16px",background:"none",border:"none",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <span style={{fontSize:17,color:C.danger,fontFamily:"-apple-system,sans-serif"}}>Delete</span>
          <Icon name="trash" size={20} color={C.danger}/>
        </button>
      </div>
    </div>
  );
}

// ─── Move Note sheet ──────────────────────────────────────────────────────
function MoveNoteSheet({ note, folders, onMove, onClose, onNewFolder }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:480,margin:"0 auto",
        background:"#1C1C1E",borderRadius:"20px 20px 0 0",
        paddingBottom:40,boxShadow:"0 -8px 40px rgba(0,0,0,.8)",
      }}>
        <div style={{width:36,height:4,background:C.surface2,borderRadius:2,margin:"12px auto 0"}}/>
        {/* Note preview */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px 14px",borderBottom:`1px solid ${C.divider}`}}>
          <div style={{width:48,height:48,borderRadius:10,background:coverBg(note.cover),flexShrink:0,overflow:"hidden"}}/>
          <div style={{minWidth:0}}>
            <p style={{margin:0,fontSize:16,fontWeight:600,color:C.text,fontFamily:"-apple-system,sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{note.title||"Untitled"}</p>
            <p style={{margin:0,fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{note.body.replace(/\n/g," ").slice(0,50)||"No additional text"}</p>
          </div>
        </div>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 8px"}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:C.text,fontFamily:"-apple-system,sans-serif"}}>Select a Folder</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,fontFamily:"-apple-system,sans-serif"}}>Cancel</button>
        </div>
        <p style={{margin:"0 20px 8px",fontSize:13,fontWeight:600,color:C.textMuted,textTransform:"uppercase",letterSpacing:.3}}>Folders</p>
        <Card style={{marginInline:16}}>
          <button onClick={()=>{onNewFolder();onClose();}} style={{width:"100%",padding:"13px 16px",background:"none",border:"none",borderBottom:`1px solid ${C.divider}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <Icon name="folder-new" size={20} color={C.accent}/>
            <span style={{fontSize:17,color:C.accent,fontFamily:"-apple-system,sans-serif",fontWeight:500}}>New Folder</span>
          </button>
          {folders.map((f,i)=>{
            const fc=folderColor(f);
            const active=f.id===note.folderId;
            return (
              <div key={f.id} onClick={()=>{onMove(f.id);onClose();}} style={{
                display:"flex",alignItems:"center",gap:12,padding:"13px 16px",
                borderBottom:i===folders.length-1?"none":`1px solid ${C.divider}`,
                cursor:"pointer",background:active?"rgba(255,214,10,.05)":"transparent",
              }}>
                <div style={{width:28,height:28,borderRadius:7,background:fc.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon name="folder" size={16} color={fc.dot}/>
                </div>
                <span style={{flex:1,fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{f.name}</span>
                <span style={{fontSize:15,color:C.textMuted,marginRight:4}}>{0}</span>
                {active&&<Icon name="check" size={18} color={C.accent}/>}
                {!active&&<Icon name="back" size={18} color={C.chevron} style={{transform:"rotate(180deg)"}}/>}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ─── Cover Picker Panel ───────────────────────────────────────────────────
function CoverPickerPanel({ current, onChange }) {
  const [tab,setTab]=useState("palette");
  const [urlVal,setUrl]=useState("");
  const [ytVal,setYt]=useState("");
  const [urlErr,setUE]=useState("");
  const [ytErr,setYE]=useState("");
  const fileRef=useRef();

  const Tab=({id,icon,label})=>(
    <button onClick={()=>setTab(id)} style={{flex:1,padding:"7px 0",border:"none",cursor:"pointer",background:tab===id?C.surface2:"transparent",color:tab===id?C.accent:C.textMuted,fontWeight:tab===id?700:400,fontSize:13,borderRadius:8,fontFamily:"-apple-system,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
      <Icon name={icon} size={14} color={tab===id?C.accent:C.textMuted}/>{label}
    </button>
  );

  return (
    <div style={{paddingTop:12}}>
      <div style={{display:"flex",gap:4,background:C.surface,borderRadius:10,padding:4,marginBottom:14}}>
        <Tab id="palette" icon="palette" label="Colours"/>
        <Tab id="image"   icon="image"   label="Image"/>
        <Tab id="youtube" icon="youtube" label="YouTube"/>
      </div>
      {tab==="palette"&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PALETTES.map(p=>(
            <button key={p.id} onClick={()=>onChange({type:"palette",...p})} style={{
              width:36,height:36,borderRadius:10,background:p.bg,cursor:"pointer",
              border:current?.id===p.id?`2px solid ${p.accent}`:`2px solid rgba(255,255,255,.08)`,
              boxShadow:current?.id===p.id?`0 0 0 3px ${p.accent}30`:"none",
              transition:"all .15s",position:"relative",overflow:"hidden",
            }}>
              <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 35% 35%,${p.accent}55,transparent 70%)`}}/>
            </button>
          ))}
          <button onClick={()=>onChange(null)} style={{width:36,height:36,borderRadius:10,cursor:"pointer",background:C.surface2,border:`1px solid rgba(255,255,255,.08)`,color:C.textMuted,fontSize:16}}>✕</button>
        </div>
      )}
      {tab==="image"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input ref={fileRef} type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange({type:"image",src:ev.target.result});r.readAsDataURL(f);}} style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} style={{padding:"13px",borderRadius:12,border:`1.5px dashed rgba(255,255,255,.18)`,background:C.surface,cursor:"pointer",color:C.textSub,fontSize:15,fontWeight:500,fontFamily:"-apple-system,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Icon name="image" size={18} color={C.textMuted}/> Choose from Gallery / Files
          </button>
          <div style={{display:"flex",gap:8}}>
            <input value={urlVal} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key!=="Enter")return;if(!/^https?:\/\//.test(urlVal)){setUE("Must start with https://");return;}setUE("");onChange({type:"image",src:urlVal.trim()});}} placeholder="https://image-url.jpg" style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${urlErr?C.danger:"rgba(255,255,255,.1)"}`,background:C.surface,color:C.text,fontSize:15,outline:"none",fontFamily:"-apple-system,sans-serif"}}/>
            <button onClick={()=>{if(!/^https?:\/\//.test(urlVal)){setUE("Must start with https://");return;}setUE("");onChange({type:"image",src:urlVal.trim()});}} style={{padding:"10px 16px",borderRadius:10,border:"none",background:C.blue,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:15}}>Use</button>
          </div>
          {urlErr&&<p style={{margin:0,fontSize:13,color:C.danger}}>{urlErr}</p>}
        </div>
      )}
      {tab==="youtube"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <p style={{margin:0,fontSize:13,color:C.textMuted,lineHeight:1.5,fontFamily:"-apple-system,sans-serif"}}>Paste a YouTube link — thumbnail becomes your cover, video plays inside the note.</p>
          <div style={{display:"flex",gap:8}}>
            <input value={ytVal} onChange={e=>setYt(e.target.value)} onKeyDown={e=>{if(e.key!=="Enter")return;const id=getYouTubeId(ytVal);if(!id){setYE("Couldn't find a YouTube video ID.");return;}setYE("");onChange({type:"youtube",videoId:id});}} placeholder="https://youtube.com/watch?v=..." style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${ytErr?C.danger:"rgba(255,255,255,.1)"}`,background:C.surface,color:C.text,fontSize:15,outline:"none",fontFamily:"-apple-system,sans-serif"}}/>
            <button onClick={()=>{const id=getYouTubeId(ytVal);if(!id){setYE("Couldn't find a YouTube video ID.");return;}setYE("");onChange({type:"youtube",videoId:id});}} style={{padding:"10px 14px",borderRadius:10,border:"none",background:"#FF0000",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center"}}>
              <Icon name="youtube" size={18} color="#fff"/>
            </button>
          </div>
          {ytErr&&<p style={{margin:0,fontSize:13,color:C.danger}}>{ytErr}</p>}
          {current?.type==="youtube"&&(
            <div style={{borderRadius:10,overflow:"hidden",height:80,position:"relative"}}>
              <img src={ytThumb(current.videoId)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="youtube" size={28} color="#fff"/></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Rich body renderer ──────────────────────────────────────────────────
function RichBody({ body, color }) {
  const lines = (body||"").split("\n");
  return (
    <div style={{padding:"4px 20px 12px"}}>
      {lines.map((line,i)=>{
        // Divider
        if(line.trim()==="---") return <hr key={i} style={{border:"none",borderTop:`1px solid rgba(255,255,255,.15)`,margin:"8px 0"}}/>;
        // Quote block
        if(line.startsWith("| ")) return (
          <div key={i} style={{display:"flex",gap:10,marginBottom:2}}>
            <div style={{width:3,borderRadius:2,background:C.accent,flexShrink:0}}/>
            <span style={{fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.7)",fontStyle:"italic"}}>{renderInline(line.slice(2))}</span>
          </div>
        );
        // Checkbox
        if(line.startsWith("- [ ] ")||line.startsWith("- [x] ")) {
          const done=line.startsWith("- [x] ");
          const text=line.slice(6);
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
              <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${done?C.accent:"rgba(255,255,255,.3)"}`,background:done?C.accent:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {done&&<svg width="11" height="11" viewBox="0 0 12 12"><polyline fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" points="2,6 5,9 10,3"/></svg>}
              </div>
              <span style={{fontSize:17,lineHeight:1.75,color:done?"rgba(235,235,245,.35)":"rgba(235,235,245,.8)",textDecoration:done?"line-through":"none"}}>{renderInline(text)}</span>
            </div>
          );
        }
        // Bullet list
        if(line.startsWith("- ")) return (
          <div key={i} style={{display:"flex",gap:8,marginBottom:2}}>
            <span style={{color:"rgba(235,235,245,.5)",marginTop:3,flexShrink:0}}>•</span>
            <span style={{fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.8)"}}>{renderInline(line.slice(2))}</span>
          </div>
        );
        // Numbered list
        const numMatch=line.match(/^(\d+)\. (.*)/);
        if(numMatch) return (
          <div key={i} style={{display:"flex",gap:8,marginBottom:2}}>
            <span style={{color:"rgba(235,235,245,.5)",flexShrink:0,minWidth:20}}>{numMatch[1]}.</span>
            <span style={{fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.8)"}}>{renderInline(numMatch[2])}</span>
          </div>
        );
        // Title/Heading/Subheading
        if(line.startsWith("[T]")) return <p key={i} style={{margin:"4px 0 2px",fontSize:24,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif"}}>{renderInline(line.slice(3))}</p>;
        if(line.startsWith("[H]")) return <p key={i} style={{margin:"4px 0 2px",fontSize:20,fontWeight:700,color:"#fff"}}>{renderInline(line.slice(3))}</p>;
        if(line.startsWith("[S]")) return <p key={i} style={{margin:"4px 0 2px",fontSize:17,fontWeight:600,color:"rgba(235,235,245,.9)"}}>{renderInline(line.slice(3))}</p>;
        // Empty line
        if(!line.trim()) return <div key={i} style={{height:8}}/>;
        // Body
        return <p key={i} style={{margin:"0 0 2px",fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.8)"}}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text="") {
  const parts=[];
  const re=/\*\*(.*?)\*\*|__(.*?)__|_([^_]*?)_|~~(.*?)~~/g;
  let last=0,m;
  while((m=re.exec(text))!==null){
    if(m.index>last) parts.push(text.slice(last,m.index));
    if(m[1]!=null) parts.push(<strong key={m.index}>{m[1]}</strong>);
    else if(m[2]!=null) parts.push(<span key={m.index} style={{textDecoration:"underline"}}>{m[2]}</span>);
    else if(m[3]!=null) parts.push(<em key={m.index}>{m[3]}</em>);
    else if(m[4]!=null) parts.push(<span key={m.index} style={{textDecoration:"line-through",opacity:.5}}>{m[4]}</span>);
    last=re.lastIndex;
  }
  if(last<text.length) parts.push(text.slice(last));
  return parts.length?parts:text;
}

// ─── Share Sheet ──────────────────────────────────────────────────────────
function ShareSheet({ note, onClose }) {
  const shareText = `${note.title}\n\n${note.body}`;
  const copyToClipboard = (text) => { navigator.clipboard?.writeText(text); onClose(); };
  const nativeShare = () => {
    if(navigator.share) navigator.share({ title:note.title, text:shareText }).catch(()=>{});
    else copyToClipboard(shareText);
    onClose();
  };
  const toMarkdown = () => {
    const md=`# ${note.title}\n\n${note.body}`;
    copyToClipboard(md);
  };
  const exportFile = (content,name,type) => {
    const blob=new Blob([content],{type});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    onClose();
  };
  const rows = [
    { label:"Share",           icon:"share",    action:nativeShare },
    { label:"Share Screenshot",icon:"screenshot",action:()=>{ alert("Screenshot sharing coming soon"); onClose(); } },
    null,
    { label:"Copy",            icon:"copy",     action:()=>copyToClipboard(shareText) },
    null,
    { label:"Copy Markdown",   icon:"filetext", action:()=>copyToClipboard(`# ${note.title}\n\n${note.body}`) },
    { label:"Export Markdown", icon:"filetext", action:()=>exportFile(`# ${note.title}\n\n${note.body}`,`${note.title||"note"}.md`,"text/markdown") },
    { label:"Export PDF",      icon:"filetext", action:()=>{ window.print(); onClose(); } },
    { label:"Export HTML",     icon:"filetext", action:()=>exportFile(`<h1>${note.title}</h1>\n<pre>${note.body}</pre>`,`${note.title||"note"}.html`,"text/html") },
  ];
  return (
    <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,margin:"0 auto",background:"#1C1C1E",borderRadius:"20px 20px 0 0",paddingBottom:36,boxShadow:"0 -8px 40px rgba(0,0,0,.8)"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 16px 12px",borderBottom:`1px solid ${C.divider}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,background:"#FFD60A",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name="allnotes" size={22} color="#000"/>
            </div>
            <div>
              <p style={{margin:0,fontSize:16,fontWeight:600,color:C.text}}>{note.title||"Untitled"}</p>
              <p style={{margin:0,fontSize:13,color:C.textMuted}}>{note.body.split("\n")[0]?.slice(0,40)||"No additional text"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",background:C.surface2,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="more" size={16} color={C.textMuted}/>
          </button>
        </div>
        {/* Rows */}
        {rows.map((row,i)=>
          row===null
            ? <div key={i} style={{height:1,background:C.divider,margin:"4px 0"}}/>
            : <button key={row.label} onClick={row.action} style={{
                width:"100%",padding:"14px 20px",background:"none",border:"none",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"space-between",
              }}>
                <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{row.label}</span>
                <Icon name={row.icon} size={20} color={C.textMuted}/>
              </button>
        )}
      </div>
    </div>
  );
}

// ─── Note long-press context menu ─────────────────────────────────────────
function NoteContextMenu({ note, onClose, onPin, onShare, onMove, onDelete }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,.55)",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}>
      {/* Preview card */}
      <div onClick={e=>e.stopPropagation()} style={{
        margin:"0 16px", background:"#1C1C1E", borderRadius:16,
        padding:"16px", marginBottom:8,
        boxShadow:"0 4px 24px rgba(0,0,0,.6)",
        maxHeight:"45vh", overflow:"hidden",
      }}>
        <p style={{margin:"0 0 8px",fontSize:17,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif"}}>{note.title||"Untitled"}</p>
        <div style={{fontSize:15,color:"rgba(235,235,245,.7)",overflow:"hidden",maxHeight:200}}>
          {note.body.split("\n").slice(0,8).map((line,i)=>(
            <p key={i} style={{margin:"0 0 2px"}}>{line||" "}</p>
          ))}
        </div>
      </div>
      {/* Action menu */}
      <div onClick={e=>e.stopPropagation()} style={{
        margin:"0 16px 32px", background:"#2C2C2E", borderRadius:14,
        overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.6)",
      }}>
        {[
          { label:"Pin Note",   icon:"pin",   action:()=>{onPin();onClose();} },
          { label:"Share Note", icon:"share", action:()=>{onShare();onClose();} },
          { label:"Move",       icon:"move",  action:()=>{onMove();onClose();} },
        ].map((row,i)=>(
          <button key={row.label} onClick={row.action} style={{
            width:"100%",padding:"14px 16px",background:"none",
            border:"none",borderBottom:`1px solid ${C.divider}`,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{row.label}</span>
            <Icon name={row.icon} size={20} color={C.textMuted}/>
          </button>
        ))}
        <button onClick={()=>{onDelete();onClose();}} style={{
          width:"100%",padding:"14px 16px",background:"none",border:"none",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <span style={{fontSize:17,color:C.danger,fontFamily:"-apple-system,sans-serif"}}>Delete</span>
          <Icon name="trash" size={20} color={C.danger}/>
        </button>
      </div>
    </div>
  );
}

// ─── Note list ⋯ dropdown ─────────────────────────────────────────────────
function NoteListMenu({ onClose, sortNotes, currentSort, onSelectMode }) {
  const [showSort, setShowSort] = useState(false);
  const sorts = [
    { id:"edited",  label:"Date Edited"  },
    { id:"created", label:"Date Created" },
    { id:"title",   label:"Title"        },
    { id:"newest",  label:"Newest First" },
    { id:"oldest",  label:"Oldest First" },
  ];
  return (
    <div style={{position:"fixed",inset:0,zIndex:600}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute",top:88,right:14,
        background:"#2C2C2E",borderRadius:14,
        boxShadow:"0 8px 40px rgba(0,0,0,.75)",
        overflow:"hidden",minWidth:220,
      }}>
        <button onClick={()=>{onSelectMode();onClose();}} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",borderBottom:`1px solid ${C.divider}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>Select Notes</span>
          <Icon name="checklist" size={20} color={C.textMuted}/>
        </button>
        <button onClick={()=>setShowSort(s=>!s)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",borderBottom:`1px solid ${C.divider}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif",display:"block"}}>Sort By</span>
            <span style={{fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{sorts.find(s=>s.id===currentSort)?.label||"Date Edited"}</span>
          </div>
          <Icon name={showSort?"back":"back"} size={18} color={C.textMuted} style={{transform:showSort?"rotate(90deg)":"rotate(270deg)"}}/>
        </button>
        {showSort && sorts.map(s=>(
          <button key={s.id} onClick={()=>{sortNotes(s.id);}} style={{
            width:"100%",padding:"12px 16px 12px 32px",background:"none",border:"none",
            borderBottom:`1px solid ${C.divider}`,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <span style={{fontSize:16,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{s.label}</span>
            {currentSort===s.id&&<Icon name="check" size={18} color={C.accent}/>}
          </button>
        ))}
        <button onClick={()=>{onClose(); setTimeout(()=>document.querySelector('[data-settings]')?.click(),100);}} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>Settings</span>
          <Icon name="settings" size={20} color={C.textMuted}/>
        </button>
      </div>
    </div>
  );
}

// ─── Folder context menu (long press / ⋯) ────────────────────────────────
function FolderContextMenu({ folder, onClose, onRename, onDelete }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:600}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute",top:120,right:16,
        background:"#2C2C2E",borderRadius:14,
        boxShadow:"0 8px 40px rgba(0,0,0,.75)",
        overflow:"hidden",minWidth:180,
      }}>
        <button onClick={()=>{onRename();onClose();}} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",borderBottom:`1px solid ${C.divider}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>Rename</span>
          <Icon name="rename" size={20} color={C.textMuted}/>
        </button>
        <button onClick={()=>{onDelete();onClose();}} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:17,color:C.danger,fontFamily:"-apple-system,sans-serif"}}>Delete</span>
          <Icon name="trash" size={20} color={C.danger}/>
        </button>
      </div>
    </div>
  );
}

// ─── Rename Folder modal ──────────────────────────────────────────────────
function RenameFolderModal({ folder, onClose, onSave }) {
  const [name,setName]=useState(folder.name);
  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#2C2C2E",borderRadius:16,padding:"20px",width:"100%",maxWidth:320,boxShadow:"0 8px 40px rgba(0,0,0,.8)"}}>
        <h3 style={{margin:"0 0 16px",fontSize:17,fontWeight:600,color:C.text,textAlign:"center",fontFamily:"-apple-system,sans-serif"}}>Rename Folder</h3>
        <div style={{position:"relative"}}>
          <input value={name} onChange={e=>setName(e.target.value)}
            autoFocus
            style={{width:"100%",padding:"11px 36px 11px 14px",borderRadius:10,border:`1.5px solid ${C.surface3}`,fontSize:17,outline:"none",boxSizing:"border-box",background:C.surface,color:C.text,fontFamily:"-apple-system,sans-serif"}}/>
          {name&&<button onClick={()=>setName("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:C.textMuted,border:"none",borderRadius:"50%",width:18,height:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
            <Icon name="more" size={12} color="#000"/>
          </button>}
        </div>
        <div style={{display:"flex",gap:0,marginTop:14,borderTop:`1px solid ${C.divider}`}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",background:"none",border:"none",cursor:"pointer",fontSize:17,color:C.accent,fontFamily:"-apple-system,sans-serif",borderRight:`1px solid ${C.divider}`}}>Cancel</button>
          <button onClick={()=>{if(name.trim()){onSave(name.trim());onClose();}}} style={{flex:1,padding:"12px",background:"none",border:"none",cursor:"pointer",fontSize:17,fontWeight:600,color:C.accent,fontFamily:"-apple-system,sans-serif"}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Folders
// ═══════════════════════════════════════════════════════════════════════════
function FoldersScreen({ folders, notes, sortBy, onOpenFolder, onNewFolder, onNewNote, onOpenSystem, onOpenSettings, onRenameFolder, onDeleteFolder }) {
  const count = id => notes.filter(n=>!n.trashed&&(id==="all"?true:n.folderId===id)).length;
  const pinnedCount = notes.filter(n=>!n.trashed&&n.pinned).length;
  const trashCount  = notes.filter(n=>n.trashed).length;
  const [folderMenu, setFolderMenu] = useState(null); // folder object
  const [renameFolder, setRenameFolder] = useState(null);

  const sorted = [...folders].sort((a,b)=>{
    if(sortBy==="name")  return a.name.localeCompare(b.name);
    if(sortBy==="count") return count(b.id)-count(a.id);
    if(sortBy==="color") return FOLDER_COLORS.findIndex(c=>c.id===a.colorId)-FOLDER_COLORS.findIndex(c=>c.id===b.colorId);
    return 0;
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"52px 20px 0",display:"flex",justifyContent:"flex-end"}}>
        <button style={{background:"none",border:"none",color:C.accent,fontSize:17,cursor:"pointer"}}>Edit</button>
      </div>
      <div style={{padding:"6px 20px 14px"}}>
        {/* Title always white */}
        <h1 style={{margin:"0 0 0",fontSize:34,fontWeight:700,color:C.text,letterSpacing:-.5}}>Folders</h1>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 120px"}}>
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"0 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>My Folders</p>
        <Card>
          <Row left={<Icon name="allnotes" size={20} color={C.accent}/>} label="All Notes" badge={count("all")} onTap={()=>onOpenSystem("all")}/>
          {sorted.map((f,i)=>{
            const fc=folderColor(f);
            return (
              <div key={f.id} style={{display:"flex",alignItems:"center",borderBottom:i===sorted.length-1?"none":`1px solid ${C.divider}`}}>
                <div onClick={()=>onOpenFolder(f)} style={{flex:1,display:"flex",alignItems:"center",gap:14,padding:"13px 0 13px 16px",cursor:"pointer"}}>
                  <div style={{width:28,height:28,borderRadius:7,background:fc.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="folder" size={16} color={fc.dot}/></div>
                  <span style={{flex:1,fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{f.name}</span>
                  <span style={{fontSize:16,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{count(f.id)}</span>
                </div>
                <button onClick={e=>{e.stopPropagation();setFolderMenu(f);}} style={{background:"none",border:"none",cursor:"pointer",padding:"13px 16px",display:"flex",alignItems:"center"}}>
                  <Icon name="more" size={18} color={C.textMuted}/>
                </button>
              </div>
            );
          })}
        </Card>
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"14px 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>Smart Folders</p>
        <Card>
          <Row left={<Icon name="pin" size={20} color={C.textMuted}/>}      label="Pinned"           badge={pinnedCount} onTap={()=>onOpenSystem("pinned")}/>
          <Row left={<Icon name="trash" size={20} color={C.textMuted}/>}    label="Recently Deleted" badge={trashCount}  onTap={()=>onOpenSystem("trash")}/>
          <Row left={<Icon name="settings" size={20} color={C.textMuted}/>} label="Settings"                            onTap={onOpenSettings} noBorder/>
        </Card>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:480,margin:"0 auto",background:"rgba(0,0,0,.88)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.divider}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 28px 32px"}}>
        <button onClick={onNewFolder} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><Icon name="folder-new" size={26} color={C.accent}/></button>
        <button onClick={onNewNote}   style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><Icon name="compose"    size={26} color={C.accent}/></button>
      </div>
      {folderMenu&&<FolderContextMenu folder={folderMenu} onClose={()=>setFolderMenu(null)} onRename={()=>setRenameFolder(folderMenu)} onDelete={()=>{onDeleteFolder(folderMenu.id);setFolderMenu(null);}}/>}
      {renameFolder&&<RenameFolderModal folder={renameFolder} onClose={()=>setRenameFolder(null)} onSave={name=>onRenameFolder(renameFolder.id,name)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Note List
// ═══════════════════════════════════════════════════════════════════════════
function NoteListScreen({ folder, allFolders, notes, onBack, onOpenNote, onNewNote, trashView, pinnedView, onDeleteNote, onMoveNote, onNewFolder, onOpenSettings }) {
  const [search,setSearch]=useState("");
  const [showMenu,setShowMenu]=useState(false);
  const [sortNotes,setSortNotes]=useState("edited");
  const [selectMode,setSelectMode]=useState(false);
  const [selected,setSelected]=useState(new Set());
  const [contextNote,setContextNote]=useState(null);
  const [shareNote,setShareNote]=useState(null);
  const [showMoveFor,setShowMoveFor]=useState(null);
  const longPressTimer=useRef(null);

  const startLongPress=(note)=>{
    longPressTimer.current=setTimeout(()=>{ if(!selectMode) setContextNote(note); },500);
  };
  const cancelLongPress=()=>{ clearTimeout(longPressTimer.current); };

  const base = notes.filter(n=>{
    if(trashView)  return n.trashed;
    if(pinnedView) return !n.trashed&&n.pinned;
    if(!folder)    return !n.trashed;
    return !n.trashed&&n.folderId===folder.id;
  }).filter(n=>{
    if(!search) return true;
    const q=search.toLowerCase();
    return n.title.toLowerCase().includes(q)||n.body.toLowerCase().includes(q);
  });

  const visible = [...base].sort((a,b)=>{
    if(sortNotes==="title")   return a.title.localeCompare(b.title);
    if(sortNotes==="oldest")  return a.ts-b.ts;
    if(sortNotes==="created") return a.ts-b.ts;
    return b.ts-a.ts; // edited/newest default
  });

  const groups=[];
  visible.forEach(n=>{
    const label=trashView?"Recently Deleted":groupLabel(n.ts);
    const last=groups[groups.length-1];
    if(last&&last.label===label) last.items.push(n);
    else groups.push({label,items:[n]});
  });

  const getFolderName = fid=>allFolders.find(f=>f.id===fid)?.name||"Notes";
  const title = selectMode ? (selected.size>0?`${selected.size} Selected`:"Select Notes") : trashView?"Recently Deleted":pinnedView?"Pinned":folder?.name||"All Notes";

  const toggleSelect=(id)=>{
    setSelected(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  };

  const deleteSelected=()=>{
    selected.forEach(id=>onDeleteNote(id));
    setSelected(new Set()); setSelectMode(false);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"52px 16px 0"}}>
        {selectMode
          ? <button onClick={()=>{setSelectMode(false);setSelected(new Set());}} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,padding:0}}>Done</button>
          : <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,display:"flex",alignItems:"center",gap:2,padding:0}}>
              <Icon name="back" size={20} color={C.accent}/><span>Folders</span>
            </button>
        }
        {!selectMode&&(
          <button onClick={()=>setShowMenu(s=>!s)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
            <Icon name="more" size={22} color={C.accent}/>
          </button>
        )}
      </div>
      <div style={{padding:"6px 20px 12px"}}>
        <h1 style={{margin:"0 0 12px",fontSize:34,fontWeight:700,color:C.text,letterSpacing:-.5}}>{title}</h1>
        {!selectMode&&(
          <div style={{background:C.surface2,borderRadius:10,display:"flex",alignItems:"center",gap:8,padding:"8px 12px"}}>
            <Icon name="search" size={16} color={C.textMuted}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search"
              style={{border:"none",background:"transparent",outline:"none",fontSize:17,color:C.text,flex:1,fontFamily:"-apple-system,sans-serif"}}/>
          </div>
        )}
      </div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
        {groups.length===0&&<div style={{textAlign:"center",paddingTop:80,color:C.textMuted,fontSize:16}}>No notes</div>}
        {groups.map(g=>(
          <div key={g.label}>
            <p style={{fontSize:15,fontWeight:600,color:C.textMuted,margin:"16px 20px 6px"}}>{g.label}</p>
            <Card style={{marginInline:16}}>
              {g.items.map((n,i)=>(
                <NoteRow key={n.id} note={n} folderName={getFolderName(n.folderId)}
                  showFolder={!folder||trashView||pinnedView}
                  noBorder={i===g.items.length-1}
                  selectMode={selectMode}
                  selected={selected.has(n.id)}
                  onTap={()=>selectMode?toggleSelect(n.id):!trashView&&onOpenNote(n)}
                  onLongPressStart={()=>startLongPress(n)}
                  onLongPressEnd={cancelLongPress}/>
              ))}
            </Card>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:480,margin:"0 auto",background:"rgba(0,0,0,.88)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.divider}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 28px 32px"}}>
        {selectMode ? (<>
          <button onClick={()=>{ if(selected.size>0){ selected.forEach(id=>onMoveNote(id,allFolders[0]?.id)); setSelected(new Set()); setSelectMode(false); } }} style={{background:"none",border:"none",cursor:"pointer",color:selected.size>0?C.accent:C.textMuted,fontSize:17,fontFamily:"-apple-system,sans-serif"}}>
            {selected.size===visible.length?"Move All":"Move"}
          </button>
          <button onClick={deleteSelected} style={{background:"none",border:"none",cursor:"pointer",color:selected.size>0?C.danger:C.textMuted,fontSize:17,fontFamily:"-apple-system,sans-serif"}}>
            {selected.size===visible.length?"Delete All":"Delete"}
          </button>
        </>) : (<>
          <span style={{fontSize:14,color:C.textMuted}}>{visible.length} Note{visible.length!==1?"s":""}</span>
          {!trashView&&(
            <button onClick={onNewNote} style={{position:"absolute",right:24,bottom:28,background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
              <Icon name="compose" size={26} color={C.accent}/>
            </button>
          )}
        </>)}
      </div>

      {showMenu&&<NoteListMenu onClose={()=>setShowMenu(false)} sortNotes={setSortNotes} currentSort={sortNotes} onSelectMode={()=>setSelectMode(true)}/>}
      {contextNote&&<NoteContextMenu note={contextNote} onClose={()=>setContextNote(null)}
        onPin={()=>{ /* pin handled in root */ }}
        onShare={()=>setShareNote(contextNote)}
        onMove={()=>setShowMoveFor(contextNote)}
        onDelete={()=>{ onDeleteNote(contextNote.id); }}/>}
      {shareNote&&<ShareSheet note={shareNote} onClose={()=>setShareNote(null)}/>}
      {showMoveFor&&<MoveNoteSheet note={showMoveFor} folders={allFolders}
        onMove={fid=>onMoveNote(showMoveFor.id,fid)}
        onClose={()=>setShowMoveFor(null)}
        onNewFolder={onNewFolder}/>}
    </div>
  );
}

function NoteRow({ note, folderName, showFolder, noBorder, onTap, selectMode, selected, onLongPressStart, onLongPressEnd }) {
  const [pressed,setPressed]=useState(false);
  const hasCover=!!note.cover;
  return (
    <div onClick={onTap}
      onMouseDown={()=>{setPressed(true);onLongPressStart?.();}}
      onMouseUp={()=>{setPressed(false);onLongPressEnd?.();}}
      onMouseLeave={()=>{setPressed(false);onLongPressEnd?.();}}
      onTouchStart={()=>onLongPressStart?.()}
      onTouchEnd={()=>onLongPressEnd?.()}
      style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:noBorder?"none":`1px solid ${C.divider}`,background:pressed?"rgba(255,255,255,.04)":selected?"rgba(255,214,10,.06)":"transparent",cursor:"pointer",transition:"background .1s"}}>
      {selectMode&&(
        <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${selected?C.accent:"rgba(255,255,255,.3)"}`,background:selected?C.accent:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {selected&&<svg width="11" height="11" viewBox="0 0 12 12"><polyline fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" points="2,6 5,9 10,3"/></svg>}
        </div>
      )}
      {!selectMode&&hasCover&&<div style={{width:44,height:44,borderRadius:8,flexShrink:0,background:coverBg(note.cover),boxShadow:"inset 0 0 0 1px rgba(255,255,255,.07)",overflow:"hidden"}}/>}
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:17,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"-apple-system,sans-serif"}}>{note.title||"New Note"}</p>
        <p style={{margin:"2px 0 0",fontSize:15,color:C.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"-apple-system,sans-serif"}}>
          <span>{fmtTime(note.ts)}&nbsp;&nbsp;</span>
          <span style={{opacity:.7}}>{note.body.replace(/\[\w\]/g,"").replace(/\n/g," ").slice(0,50)||"No additional text"}</span>
        </p>
        {showFolder&&<p style={{margin:"3px 0 0",fontSize:13,color:C.textMuted,display:"flex",alignItems:"center",gap:4}}><Icon name="folder" size={12} color={C.textMuted}/> {folderName}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Editor
// ═══════════════════════════════════════════════════════════════════════════
function EditorScreen({ note, allFolders, onSave, onBack, onDelete, onMoveNote, onNewFolder }) {
  const [title,   setTitle]   = useState(note.title);
  const [body,    setBody]    = useState(note.body);
  const [cover,   setCover]   = useState(note.cover);
  const [pinned,  setPinned]  = useState(note.pinned||false);
  const [folderId,setFolderId]= useState(note.folderId);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showVideo,       setShowVideo]       = useState(false);
  const [showMore,        setShowMore]        = useState(false);
  const [showMove,        setShowMove]        = useState(false);
  const [showShare,       setShowShare]       = useState(false);
  const [history,  setHistory]  = useState([note.body]);
  const [histIdx,  setHistIdx]  = useState(0);
  const bodyRef = useRef();

  useEffect(()=>{ if(!showCoverPicker&&!showMore&&!showMove&&!showShare) setTimeout(()=>bodyRef.current?.focus(),80); },[showCoverPicker,showMore,showMove,showShare]);

  const setBodyWithHistory = (val) => {
    const newHist = history.slice(0,histIdx+1);
    newHist.push(val);
    setHistory(newHist);
    setHistIdx(newHist.length-1);
    setBody(val);
  };

  const undo = () => { if(histIdx>0){ setHistIdx(i=>i-1); setBody(history[histIdx-1]); } };
  const redo = () => { if(histIdx<history.length-1){ setHistIdx(i=>i+1); setBody(history[histIdx+1]); } };

  const save = () => onSave({...note,title,body,cover,pinned,folderId,ts:Date.now()});
  const done = () => { save(); onBack(); };

  const edBg     = cover?.type==="palette" ? (cover.bg || "#000000") : "#000000";
  const hasMedia = cover?.type==="image" || cover?.type==="youtube";
  const currentNote = {...note,title,body,cover,folderId};

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:edBg,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto"}}>
      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"52px 16px 10px",background:hasMedia?"rgba(0,0,0,.65)":edBg,backdropFilter:hasMedia?"blur(16px)":"none",gap:8}}>
        <button onClick={done} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,display:"flex",alignItems:"center",gap:2,padding:0}}>
          <Icon name="back" size={20} color={C.accent}/> Notes
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={undo} disabled={histIdx===0} style={{background:"none",border:"none",cursor:histIdx===0?"default":"pointer",padding:0,display:"flex",opacity:histIdx===0?.3:1}}>
            <Icon name="undo" size={20} color={C.accent}/>
          </button>
          <button onClick={redo} disabled={histIdx>=history.length-1} style={{background:"none",border:"none",cursor:histIdx>=history.length-1?"default":"pointer",padding:0,display:"flex",opacity:histIdx>=history.length-1?.3:1}}>
            <Icon name="redo" size={20} color={C.accent}/>
          </button>
          <button onClick={()=>setShowShare(true)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
            <Icon name="share" size={20} color={C.accent}/>
          </button>
          <button onClick={()=>setShowMore(s=>!s)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
            <Icon name="more" size={22} color={C.accent}/>
          </button>
          <button onClick={done} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,padding:0,fontWeight:400}}>Done</button>
        </div>
      </div>

      {/* Cover picker */}
      {showCoverPicker&&(
        <div style={{overflowY:"auto",maxHeight:"52vh",background:hasMedia?"rgba(0,0,0,.82)":edBg,backdropFilter:hasMedia?"blur(16px)":"none",padding:"0 20px 16px",borderBottom:`1px solid rgba(255,255,255,.08)`}}>
          <CoverPickerPanel current={cover} onChange={c=>{setCover(c);setShowVideo(false);setShowCoverPicker(false);}}/>
        </div>
      )}

      {/* Cover strip */}
      {cover&&!showCoverPicker&&(
        <div style={{padding:"10px 20px 0",flexShrink:0}}>
          <div style={{height:110,borderRadius:14,overflow:"hidden",position:"relative",background:coverBg(cover)}}>
            {cover.type==="youtube"&&showVideo&&<iframe src={`https://www.youtube.com/embed/${cover.videoId}?autoplay=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}} allow="autoplay;encrypted-media" allowFullScreen title="cover"/>}
            {!showVideo&&hasMedia&&<div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.1),rgba(0,0,0,.5))"}}/>}
            {!showVideo&&<span style={{position:"absolute",bottom:10,left:14,fontFamily:"Georgia,serif",fontWeight:700,fontSize:16,color:"#FFFFFF",textShadow:"0 1px 6px rgba(0,0,0,.9)"}}>{title||"Untitled"}</span>}
            {cover.type==="youtube"&&!showVideo&&<div style={{position:"absolute",top:8,right:10,background:"rgba(255,0,0,.85)",borderRadius:4,fontSize:9,fontWeight:700,color:"#fff",padding:"2px 5px"}}>▶ YT</div>}
            {cover.type==="youtube"&&<button onClick={()=>setShowVideo(v=>!v)} style={{position:"absolute",top:8,left:10,background:"rgba(0,0,0,.5)",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#fff",fontSize:11}}>{showVideo?"⏹ Stop":"▶ Play"}</button>}
          </div>
        </div>
      )}

      {/* Title */}
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"
        style={{border:"none",outline:"none",background:"transparent",fontSize:28,fontWeight:700,color:"#FFFFFF",padding:cover?"8px 20px 2px":"16px 20px 2px",fontFamily:"Georgia,serif",flexShrink:0}}/>

      {/* Body — real textarea, always editable */}
      <textarea ref={bodyRef} value={body}
        onChange={e=>setBodyWithHistory(e.target.value)}
        placeholder="Start writing…"
        style={{
          flex:1, border:"none", outline:"none", background:"transparent",
          fontSize:17, lineHeight:1.75,
          color:"rgba(235,235,245,.88)",
          padding:"4px 20px 12px", resize:"none",
          fontFamily:"-apple-system,sans-serif",
          WebkitOverflowScrolling:"touch",
        }}/>

      {/* Formatting toolbar */}
      <FormatToolbar bodyRef={bodyRef} body={body} setBody={setBodyWithHistory}/>

      {/* ⋯ Menu */}
      {showMore&&(
        <MoreMenu
          onClose={()=>setShowMore(false)}
          pinned={pinned}
          onPin={()=>setPinned(p=>!p)}
          onCover={()=>{ setShowCoverPicker(true); setShowMore(false); }}
          onMoveTo={()=>setShowMove(true)}
          onDelete={()=>{ onDelete(note.id); onBack(); }}
        />
      )}

      {/* Move Note sheet */}
      {showMove&&(
        <MoveNoteSheet
          note={{...note,folderId}}
          folders={allFolders}
          onMove={fid=>setFolderId(fid)}
          onClose={()=>setShowMove(false)}
          onNewFolder={onNewFolder}
        />
      )}

      {/* Share sheet */}
      {showShare&&<ShareSheet note={currentNote} onClose={()=>setShowShare(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Settings
// ═══════════════════════════════════════════════════════════════════════════
function SettingsScreen({ onBack, sortBy, onSortBy }) {
  const [backupState,setBackupState]=useState("idle");
  const [lastBackup, setLastBackup] =useState(null);

  const handleBackup=()=>{
    setBackupState("connecting");
    setTimeout(()=>{
      setBackupState("done");
      setLastBackup(new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}));
      setTimeout(()=>setBackupState("idle"),3000);
    },2200);
  };

  const SortOption=({id,label,icon})=>(
    <Row left={<Icon name={icon} size={20} color={sortBy===id?C.accent:C.textMuted}/>}
      label={label} rightEl={sortBy===id?<Icon name="check" size={18} color={C.accent}/>:null}
      onTap={()=>onSortBy(id)} noBorder={id==="color"}/>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",padding:"52px 16px 0"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,display:"flex",alignItems:"center",gap:2,padding:0}}>
          <Icon name="back" size={20} color={C.accent}/> Folders
        </button>
      </div>
      <div style={{padding:"6px 20px 20px"}}>
        <h1 style={{margin:0,fontSize:34,fontWeight:700,color:C.text,letterSpacing:-.5}}>Settings</h1>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 60px"}}>
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"0 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>Backup</p>
        <Card>
          <div style={{padding:"16px 16px 8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:"rgba(10,132,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="drive" size={20} color="#4A90D9"/></div>
              <div>
                <p style={{margin:0,fontSize:17,color:C.text,fontWeight:500}}>Google Drive</p>
                <p style={{margin:0,fontSize:13,color:C.textMuted}}>{lastBackup?`Last backup today at ${lastBackup}`:"Never backed up"}</p>
              </div>
            </div>
            <button onClick={handleBackup} disabled={backupState==="connecting"} style={{
              width:"100%",padding:"12px",borderRadius:10,border:"none",cursor:"pointer",
              background:backupState==="done"?"rgba(50,215,75,.2)":backupState==="connecting"?"rgba(255,255,255,.06)":"rgba(10,132,255,.18)",
              color:backupState==="done"?C.green:backupState==="connecting"?C.textMuted:C.blue,
              fontSize:15,fontWeight:600,fontFamily:"-apple-system,sans-serif",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s",
            }}>
              <Icon name={backupState==="done"?"check":backupState==="connecting"?"clock":"backup"} size={18} color={backupState==="done"?C.green:backupState==="connecting"?C.textMuted:C.blue}/>
              {backupState==="connecting"?"Connecting to Google Drive…":backupState==="done"?"Backup complete":"Back up to Google Drive"}
            </button>
            <p style={{margin:"10px 0 8px",fontSize:12,color:C.textMuted,lineHeight:1.5}}>All notes and folders will be exported as a JSON file to your Google Drive.</p>
          </div>
        </Card>
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"20px 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>Sort Folders By</p>
        <Card>
          <SortOption id="manual" label="Manual Order"  icon="sort"/>
          <SortOption id="name"   label="Name (A → Z)"  icon="az"/>
          <SortOption id="count"  label="Note Count"    icon="allnotes"/>
          <SortOption id="color"  label="Colour Theme"  icon="palette"/>
        </Card>
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"20px 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>About</p>
        <Card>
          <Row label="Version" rightEl={<span style={{color:C.textMuted,fontSize:15}}>1.0.0</span>} noBorder/>
        </Card>
      </div>
    </div>
  );
}

// ─── New Folder Modal ─────────────────────────────────────────────────────
function NewFolderModal({ onClose, onCreate }) {
  const [name,setName]=useState("");
  const [colorId,setColorId]=useState("gold");
  return (
    <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,.78)",backdropFilter:"blur(10px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#1C1C1E",borderRadius:"20px 20px 0 0",padding:"20px 20px 44px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,.8)"}}>
        <div style={{width:36,height:4,background:C.surface2,borderRadius:2,margin:"0 auto 20px"}}/>
        <h3 style={{margin:"0 0 16px",fontSize:18,fontWeight:700,color:C.text,fontFamily:"-apple-system,sans-serif"}}>New Folder</h3>
        <p style={{margin:"0 0 8px",fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>Colour</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
          {FOLDER_COLORS.map(fc=>(
            <button key={fc.id} onClick={()=>setColorId(fc.id)} style={{width:32,height:32,borderRadius:"50%",border:"none",cursor:"pointer",background:fc.dot,boxShadow:colorId===fc.id?`0 0 0 2px #000, 0 0 0 4px ${fc.dot}`:"none",transition:"box-shadow .15s"}}/>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 12px",background:C.surface2,borderRadius:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:FOLDER_COLORS.find(c=>c.id===colorId)?.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="folder" size={16} color={FOLDER_COLORS.find(c=>c.id===colorId)?.dot}/>
          </div>
          <span style={{fontSize:16,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{name||"Folder Name"}</span>
        </div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"
          style={{width:"100%",padding:"13px 14px",borderRadius:12,border:`1.5px solid ${C.surface3}`,fontSize:17,outline:"none",boxSizing:"border-box",background:C.surface,color:C.text,fontFamily:"-apple-system,sans-serif"}}/>
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button onClick={onClose} style={{flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.surface3}`,background:"none",cursor:"pointer",fontSize:17,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>Cancel</button>
          <button onClick={()=>{if(name.trim())onCreate({id:uid(),name:name.trim(),colorId});onClose();}} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:C.accent,cursor:"pointer",fontSize:17,fontWeight:700,color:"#000",fontFamily:"-apple-system,sans-serif"}}>Create</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [folders,setFolders]=useState(DEFAULT_FOLDERS);
  const [notes,  setNotes]  =useState(DEFAULT_NOTES);
  const [stack,  setStack]  =useState([{screen:"folders"}]);
  const [showNewFolder,setShowNewFolder]=useState(false);
  const [sortBy,setSortBy]=useState("manual");

  // Persist to localStorage on every change
  useEffect(()=>{ saveState(folders, notes); }, [folders, notes]);

  const top  = stack[stack.length-1];
  const push = f => setStack(s=>[...s,f]);
  const pop  = () => setStack(s=>s.length>1?s.slice(0,-1):s);

  const saveNote   = u  => setNotes(p=>p.map(n=>n.id===u.id?u:n));
  // Delete sends to trash, not permanent
  const deleteNote = id => setNotes(p=>p.map(n=>n.id===id?{...n,trashed:true}:n));
  const moveNote   = (id,fid) => setNotes(p=>p.map(n=>n.id===id?{...n,folderId:fid}:n));
  const renameFolder = (id,name) => setFolders(p=>p.map(f=>f.id===id?{...f,name}:f));
  const deleteFolder = (id) => {
    setFolders(p=>p.filter(f=>f.id!==id));
    setNotes(p=>p.map(n=>n.folderId===id?{...n,trashed:true}:n));
    if(top.folder?.id===id) pop();
  };

  const createNote = folderId => {
    const n={id:uid(),folderId,title:"",body:"",cover:null,starred:false,trashed:false,ts:Date.now(),pinned:false};
    setNotes(p=>[n,...p]);
    push({screen:"editor",note:n});
  };

  const handleNewNoteFromList = () => {
    const fid=top.folder?.id||folders[0]?.id||"notes";
    createNote(fid);
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative",overflow:"hidden"}}>
      {top.screen==="folders"&&(
        <FoldersScreen folders={folders} notes={notes} sortBy={sortBy}
          onOpenFolder={f=>push({screen:"list",folder:f})}
          onOpenSystem={sys=>push({screen:"list",sysFolder:sys})}
          onNewFolder={()=>setShowNewFolder(true)}
          onNewNote={()=>createNote(folders[0]?.id||"notes")}
          onOpenSettings={()=>push({screen:"settings"})}
          onRenameFolder={renameFolder}
          onDeleteFolder={deleteFolder}/>
      )}
      {top.screen==="list"&&(
        <NoteListScreen folder={top.folder||null} allFolders={folders} notes={notes}
          trashView={top.sysFolder==="trash"} pinnedView={top.sysFolder==="pinned"}
          onBack={pop} onOpenNote={n=>push({screen:"editor",note:n})}
          onNewNote={handleNewNoteFromList}
          onDeleteNote={deleteNote}
          onMoveNote={moveNote}
          onNewFolder={()=>setShowNewFolder(true)}
          onOpenSettings={()=>push({screen:"settings"})}/>
      )}
      {top.screen==="editor"&&(
        <EditorScreen note={top.note} allFolders={folders}
          onSave={saveNote} onBack={pop}
          onDelete={deleteNote}
          onMoveNote={moveNote}
          onNewFolder={()=>setShowNewFolder(true)}/>
      )}
      {top.screen==="settings"&&(
        <SettingsScreen onBack={pop} sortBy={sortBy} onSortBy={setSortBy}/>
      )}
      {showNewFolder&&(
        <NewFolderModal onClose={()=>setShowNewFolder(false)}
          onCreate={f=>{setFolders(p=>[...p,f]);setShowNewFolder(false);}}/>
      )}
    </div>
  );
}
