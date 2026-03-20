import { useState, useRef, useEffect } from "react";

const C = {
  bg:"#000000", surface:"#1C1C1E", surface2:"#2C2C2E", surface3:"#3A3A3C",
  divider:"rgba(255,255,255,.1)", text:"#FFFFFF", textSub:"rgba(235,235,245,.8)",
  textMuted:"#8E8E93", accent:"#FFD60A", danger:"#FF453A", green:"#32D74B",
  blue:"#0A84FF", chevron:"#48484A",
};

// Inject contenteditable placeholder style once
if(typeof document!=="undefined") {
  const _st=document.createElement("style");
  _st.textContent=[
    // Placeholder
    `[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:rgba(142,142,147,.6);pointer-events:none;}`,
    // Bullet list override — • in accent colour
    `[contenteditable] ul:not([data-checklist]){list-style:none;padding-left:0;margin:2px 0;}`,
    `[contenteditable] ul:not([data-checklist]) li{display:flex;align-items:baseline;gap:8px;padding:1px 0;color:rgba(235,235,245,.88);font-size:17px;line-height:1.75;}`,
    `[contenteditable] ul:not([data-checklist]) li::before{content:"•";color:#FFD60A;font-size:18px;flex-shrink:0;line-height:1.75;}`,
    // Numbered list
    `[contenteditable] ol{list-style:decimal;padding-left:28px;margin:2px 0;}`,
    `[contenteditable] ol li{color:rgba(235,235,245,.88);font-size:17px;line-height:1.75;padding:1px 0;}`,
    `[contenteditable] ol li::marker{color:rgba(235,235,245,.5);}`,
    // Checklist — circle before each li
    `[contenteditable] ul[data-checklist]{list-style:none;padding-left:0;margin:2px 0;}`,
    `[contenteditable] ul[data-checklist] li{display:flex;align-items:center;gap:10px;padding:2px 0;font-size:17px;color:rgba(235,235,245,.88);line-height:1.75;cursor:text;}`,
    `[contenteditable] ul[data-checklist] li::before{content:"";display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;min-width:20px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:transparent;cursor:pointer;flex-shrink:0;transition:background .15s,border-color .15s;}`,
    `[contenteditable] ul[data-checklist] li[data-checked="true"]::before{background:#FFD60A;border-color:#FFD60A;content:"✓";color:#000;font-size:12px;font-weight:700;}`,
    `[contenteditable] ul[data-checklist] li[data-checked="true"]{text-decoration:line-through;opacity:0.5;}`,
    // Heading styles — scoped to contenteditable so they never bleed outside
    `[contenteditable] h1{font-size:24px;font-weight:800;font-family:Georgia,serif;color:#fff;margin:4px 0 2px;line-height:1.3;}`,
    `[contenteditable] h2{font-size:20px;font-weight:700;font-family:-apple-system,sans-serif;color:#fff;margin:4px 0 2px;line-height:1.4;}`,
    `[contenteditable] h3{font-size:17px;font-weight:600;font-family:-apple-system,sans-serif;color:rgba(235,235,245,.9);margin:2px 0;line-height:1.75;}`,
    `[contenteditable] p{font-size:17px;font-weight:400;font-family:-apple-system,sans-serif;color:rgba(235,235,245,.88);margin:0;line-height:1.75;}`,
    `[contenteditable] blockquote{border-left:3px solid rgba(160,160,165,.55);margin:4px 0;padding:2px 0 2px 14px;font-style:italic;color:rgba(180,180,185,.85);font-size:17px;line-height:1.75;}`,
  ].join("");
  document.head.appendChild(_st);

  // Global click listener — toggles checklist items when their ::before circle is clicked
  // We detect clicks in the left ~30px of a checklist li (where the circle renders)
  document.addEventListener("mousedown",(e)=>{
    const li=e.target.closest?.("ul[data-checklist] li");
    if(!li) return;
    const rect=li.getBoundingClientRect();
    // Click is within the circle area (left 30px of the li)
    if(e.clientX-rect.left<30){
      e.preventDefault();
      const checked=li.dataset.checked!=="true";
      li.dataset.checked=checked?"true":"false";
      // Save HTML after toggle
      const editor=li.closest("[contenteditable]");
      if(editor&&editor._reactFiber===undefined){
        // Trigger a synthetic input event so React state updates
        const ev=new Event("input",{bubbles:true});
        editor.dispatchEvent(ev);
      }
    }
  },true);
}

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
  if (!cover || typeof cover !== "object") return C.surface;
  if (cover.type === "palette") return cover.bg || C.surface;
  if (cover.type === "image")   return cover.src ? `url(${cover.src}) center/cover no-repeat` : C.surface;
  if (cover.type === "youtube") return cover.videoId ? `url(${ytThumb(cover.videoId)}) center/cover no-repeat` : C.surface;
  return C.surface;
}

// ─── Safe localStorage persistence ───────────────────────────────────────
const STORE_KEY = "notes_app_v1";

function sanitizeCover(cover) {
  if (!cover || typeof cover !== "object") return null;
  if (cover.type === "palette") {
    // cover.id may be undefined if saved by a broken older session — fall back safely
    const palette = (cover.id ? PALETTES.find(p => p.id === cover.id) : null) || PALETTES[0];
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
    if (Array.isArray(parsed.folders)) {
      parsed.folders = parsed.folders.map(f => ({
        ...f,
        colorId: FOLDER_COLORS.find(c => c.id === f.colorId) ? f.colorId : "gold",
      }));
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
  const p = { fill:"none", stroke:color, strokeWidth:1.6, strokeLinecap:"round", strokeLinejoin:"round" };
  const paths = {
    // ── Navigation / UI ──────────────────────────────────────────────────
    folder:      <><path {...p} d="M3 8a2 2 0 012-2h3.5l2 2.5H19a2 2 0 012 2V18a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></>,
    "folder-new":<><path {...p} d="M3 8a2 2 0 012-2h3.5l2 2.5H19a2 2 0 012 2V18a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/><line {...p} x1="12" y1="12" x2="12" y2="17"/><line {...p} x1="9.5" y1="14.5" x2="14.5" y2="14.5"/></>,
    compose:     <><path {...p} d="M12 20H4a1 1 0 01-1-1V5a1 1 0 011-1h8"/><path {...p} d="M15 3l6 6-9 9-4 1 1-4 9-9z"/></>,
    pin:         <><path {...p} d="M12 2l4 4-1 1-1.5-.5L9 11.5l.5 1.5-1 1-5-5 1-1L6 8.5 9.5 5l-.5-1.5L10 2l2 2z"/><line {...p} x1="6" y1="14" x2="3.5" y2="16.5"/></>,
    trash:       <><polyline {...p} points="3,6 5,6 21,6"/><path {...p} d="M8 6V4h8v2"/><path {...p} d="M6 6l1 14h10l1-14"/><line {...p} x1="10" y1="11" x2="10" y2="17"/><line {...p} x1="14" y1="11" x2="14" y2="17"/></>,
    settings:    <><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M20 12a8.5 8.5 0 00-.16-1.62l2.16-1.7-2-3.46-2.57.98A8 8 0 0016 4.88L15.5 2h-7l-.5 2.88a8 8 0 00-1.43 1.32L4 5.22l-2 3.46 2.16 1.7A8.5 8.5 0 004 12c0 .55.06 1.09.16 1.62L2 15.32l2 3.46 2.57-.98c.44.48.92.91 1.43 1.32L8.5 22h7l.5-2.88a8 8 0 001.43-1.32L20 18.78l2-3.46-2.16-1.7c.1-.53.16-1.07.16-1.62z"/></>,
    allnotes:    <><line {...p} x1="4" y1="6" x2="20" y2="6"/><line {...p} x1="4" y1="12" x2="20" y2="12"/><line {...p} x1="4" y1="18" x2="14" y2="18"/></>,
    search:      <><circle {...p} cx="11" cy="11" r="7"/><line {...p} x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    share:       <><path {...p} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><polyline {...p} points="16,6 12,2 8,6"/><line {...p} x1="12" y1="2" x2="12" y2="15"/></>,
    more:        <><circle {...p} fill={color} stroke="none" cx="5" cy="12" r="1.3"/><circle {...p} fill={color} stroke="none" cx="12" cy="12" r="1.3"/><circle {...p} fill={color} stroke="none" cx="19" cy="12" r="1.3"/></>,
    back:        <><polyline {...p} points="15,18 9,12 15,6"/></>,
    drive:       <><path {...p} d="M12 3L2 20h20L12 3z"/><line {...p} x1="2" y1="20" x2="22" y2="20"/><line {...p} x1="7.5" y1="12" x2="16.5" y2="12"/></>,
    sort:        <><line {...p} x1="3" y1="6" x2="21" y2="6"/><line {...p} x1="6" y1="12" x2="18" y2="12"/><line {...p} x1="9" y1="18" x2="15" y2="18"/></>,
    palette:     <><circle {...p} cx="12" cy="12" r="9"/><circle {...p} cx="9" cy="10" r="1.3" fill={color} stroke="none"/><circle {...p} cx="15" cy="10" r="1.3" fill={color} stroke="none"/><circle {...p} cx="12" cy="15" r="1.3" fill={color} stroke="none"/></>,
    check:       <><polyline {...p} points="20,6 9,17 4,12"/></>,
    image:       <><rect {...p} x="3" y="3" width="18" height="18" rx="2"/><circle {...p} cx="8.5" cy="8.5" r="1.5"/><polyline {...p} points="21,15 16,10 5,21"/></>,
    youtube:     <><rect {...p} x="2" y="5" width="20" height="14" rx="2.5"/><polygon {...p} fill={color} stroke="none" points="10,9 16,12 10,15"/></>,
    backup:      <><polyline {...p} points="8,17 12,13 16,17"/><line {...p} x1="12" y1="13" x2="12" y2="21"/><path {...p} d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></>,
    clock:       <><circle {...p} cx="12" cy="12" r="9"/><polyline {...p} points="12,7 12,12 15,15"/></>,
    az:          <><line {...p} x1="3" y1="7" x2="11" y2="7"/><line {...p} x1="3" y1="12" x2="8" y2="12"/><line {...p} x1="3" y1="17" x2="6" y2="17"/><path {...p} d="M14 8l3-4 3 4M17 4v10"/><rect {...p} x="14" y="15" width="6" height="5" rx="1"/></>,
    scan:        <><path {...p} d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><rect {...p} x="7" y="7" width="10" height="10" rx="1"/></>,
    move:        <><path {...p} d="M3 8a2 2 0 012-2h3.5l2 2.5H19a2 2 0 012 2V18a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/><polyline {...p} points="14,12 17,12"/><polyline {...p} points="15,10 17,12 15,14"/></>,
    rename:      <><path {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path {...p} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    screenshot:  <><rect {...p} x="3" y="3" width="18" height="18" rx="2"/><circle {...p} cx="12" cy="12" r="4"/><line {...p} x1="3" y1="9" x2="21" y2="9"/></>,
    copy:        <><rect {...p} x="9" y="9" width="13" height="13" rx="2"/><path {...p} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    filetext:    <><path {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline {...p} points="14,2 14,8 20,8"/><line {...p} x1="16" y1="13" x2="8" y2="13"/><line {...p} x1="16" y1="17" x2="8" y2="17"/></>,
    // ── Toolbar icons — all pure stroke lines ────────────────────────────
    // Lists tab icon: 3 lines with small circle dots
    "tb-lists":  <><circle {...p} cx="4" cy="7" r="1.2" fill={color} stroke="none"/><line {...p} x1="8" y1="7" x2="20" y2="7"/><circle {...p} cx="4" cy="12" r="1.2" fill={color} stroke="none"/><line {...p} x1="8" y1="12" x2="20" y2="12"/><circle {...p} cx="4" cy="17" r="1.2" fill={color} stroke="none"/><line {...p} x1="8" y1="17" x2="20" y2="17"/></>,
    // Text tab icon: T with size variation
    "tb-text":   <><path {...p} d="M4 6h16M12 6v12"/><line {...p} x1="8" y1="18" x2="16" y2="18"/></>,
    // Checkbox tab icon: circle with check
    "tb-check":  <><circle {...p} cx="12" cy="12" r="8"/><polyline {...p} points="9,12 11,14 15,10"/></>,
    // Cover/camera tab icon: minimal camera frame
    "tb-cover":  <><rect {...p} x="2" y="7" width="20" height="14" rx="2"/><path {...p} d="M16 7l-1.5-3h-5L8 7"/><circle {...p} cx="12" cy="14" r="3"/></>,
    // Dismiss keyboard icon
    "tb-kbd":    <><rect {...p} x="2" y="5" width="20" height="12" rx="2"/><line {...p} x1="6" y1="9" x2="8" y2="9"/><line {...p} x1="11" y1="9" x2="13" y2="9"/><line {...p} x1="16" y1="9" x2="18" y2="9"/><line {...p} x1="8" y1="13" x2="16" y2="13"/><polyline {...p} points="6,20 12,17 18,20"/></>,
    // Bullet list (in panel): circle dot + 3 lines
    "tb-bullet": <><circle {...p} cx="4" cy="7" r="1.3" fill={color} stroke="none"/><line {...p} x1="8" y1="7" x2="20" y2="7"/><circle {...p} cx="4" cy="12" r="1.3" fill={color} stroke="none"/><line {...p} x1="8" y1="12" x2="20" y2="12"/><circle {...p} cx="4" cy="17" r="1.3" fill={color} stroke="none"/><line {...p} x1="8" y1="17" x2="20" y2="17"/></>,
    // Numbered list (in panel): 1 2 3 + lines
    "tb-numbered":<><path {...p} d="M4 5h2v5H4"/><path {...p} d="M4 14h2a1 1 0 010 2H4m0 2h2"/><line {...p} x1="9" y1="7" x2="20" y2="7"/><line {...p} x1="9" y1="12" x2="20" y2="12"/><line {...p} x1="9" y1="17" x2="20" y2="17"/></>,
    // Quote (in panel): vertical accent bar
    "tb-quote":  <><line {...p} x1="4" y1="6" x2="4" y2="18" strokeWidth="2.5"/><line {...p} x1="9" y1="9" x2="20" y2="9"/><line {...p} x1="9" y1="14" x2="20" y2="14"/></>,
    // Link
    "tb-link":   <><path {...p} d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path {...p} d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    // Divider line
    "tb-divider":<><line {...p} x1="3" y1="12" x2="21" y2="12" strokeWidth="2"/></>,
    // Close panel (×)
    "tb-close":  <><line {...p} x1="6" y1="6" x2="18" y2="18"/><line {...p} x1="18" y1="6" x2="6" y2="18"/></>,
    // Text size row: Title/Heading/Sub/Body — represented as Aa
    "tb-title":  <><path {...p} d="M4 18L9 6l5 12"/><line {...p} x1="6" y1="14" x2="12" y2="14"/><path {...p} d="M15 10v8"/><path {...p} d="M15 8V6"/></>,
    // Bold: B
    bold:        <><path {...p} d="M7 4h6a4 4 0 010 8H7z"/><path {...p} d="M7 12h7a4 4 0 010 8H7z"/></>,
    // Italic: I (diagonal stroke)
    italic:      <><line {...p} x1="18" y1="4" x2="10" y2="4"/><line {...p} x1="14" y1="20" x2="6" y2="20"/><line {...p} x1="16" y1="4" x2="8" y2="20"/></>,
    // Underline: U
    underline:   <><path {...p} d="M7 3v8a5 5 0 0010 0V3"/><line {...p} x1="5" y1="21" x2="19" y2="21"/></>,
    // Strikethrough: line through middle of text shape
    strike:      <><line {...p} x1="4" y1="12" x2="20" y2="12" strokeWidth="2"/><path {...p} d="M16 6c-1-1.5-2.5-2-4-2s-4 .8-4 3c0 1.2.6 2 2 2.5"/><path {...p} d="M8 18c1 1.5 2.5 2 4 2s4-.8 4-3"/></>,
    // Undo / redo
    undo:        <><path {...p} d="M3 8h10a5 5 0 010 10H5"/><polyline {...p} points="7,4 3,8 7,12"/></>,
    redo:        <><path {...p} d="M21 8H11a5 5 0 000 10h8"/><polyline {...p} points="17,4 21,8 17,12"/></>,
    // Checklist (used in NoteListMenu)
    checklist:   <><circle {...p} cx="5" cy="7" r="2.5"/><polyline {...p} points="3.5,7 5,8.5 6.5,6"/><line {...p} x1="10" y1="7" x2="20" y2="7"/><circle {...p} cx="5" cy="14" r="2.5"/><line {...p} x1="10" y1="14" x2="20" y2="14"/><circle {...p} cx="5" cy="21" r="2.5"/><line {...p} x1="10" y1="21" x2="20" y2="21"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={s}>
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

// ─── Inline Media Panel (camera icon → insert image/YouTube into note body) ──
function InlineMediaPanel({ bodyRef, setBody, onClose }) {
  const [tab, setTab] = useState("gallery");
  const [urlVal, setUrlVal] = useState("");
  const [ytVal,  setYtVal]  = useState("");
  const [urlErr, setUrlErr] = useState("");
  const [ytErr,  setYtErr]  = useState("");
  const fileRef = useRef();

  // Insert an <img> element at cursor position in the contenteditable
  const insertAtCursor = (src, alt="image") => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    const img=document.createElement("img");
    img.src=src; img.alt=alt;
    img.style.cssText="max-width:100%;border-radius:10px;display:block;margin:6px 0;";
    const sel=window.getSelection();
    if(sel&&sel.rangeCount){
      const r=sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(img);
      r.setStartAfter(img);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    } else { el.appendChild(img); }
    if(el) setBody(el.innerHTML);
    onClose();
  };

  const TabBtn=({id,label})=>(
    <button onClick={()=>setTab(id)} style={{
      flex:1,padding:"7px 0",border:"none",cursor:"pointer",borderRadius:8,
      background:tab===id?C.surface2:"transparent",
      color:tab===id?C.accent:C.textMuted,
      fontWeight:tab===id?700:400,fontSize:13,
      fontFamily:"-apple-system,sans-serif",
    }}>{label}</button>
  );

  return (
    <div style={{background:"rgba(18,18,20,.98)",borderTop:`1px solid ${C.divider}`,padding:"12px 14px 10px"}}>
      {/* Tab row */}
      <div style={{display:"flex",gap:4,background:C.surface,borderRadius:10,padding:4,marginBottom:12}}>
        <TabBtn id="gallery" label="Gallery"/>
        <TabBtn id="url"     label="Image URL"/>
        <TabBtn id="youtube" label="YouTube"/>
      </div>

      {tab==="gallery"&&(
        <>
          <input ref={fileRef} type="file" accept="image/*" onChange={e=>{
            const f=e.target.files?.[0]; if(!f) return;
            const r=new FileReader();
            r.onload=ev=>insertAtCursor(ev.target.result);
            r.readAsDataURL(f);
          }} style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} style={{
            width:"100%",padding:"13px",borderRadius:12,
            border:`1.5px dashed rgba(255,255,255,.18)`,
            background:C.surface,cursor:"pointer",
            color:C.textSub,fontSize:15,fontWeight:500,
            fontFamily:"-apple-system,sans-serif",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          }}>
            <Icon name="image" size={18} color={C.textMuted}/>
            Choose from Gallery / Files
          </button>
        </>
      )}

      {tab==="url"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:8}}>
            <input
              value={urlVal} onChange={e=>setUrlVal(e.target.value)}
              onKeyDown={e=>{
                if(e.key!=="Enter") return;
                if(!/^https?:\/\//.test(urlVal)){setUrlErr("Must start with https://");return;}
                setUrlErr(""); insertAtCursor(urlVal.trim());
              }}
              placeholder="https://example.com/photo.jpg"
              style={{flex:1,padding:"10px 12px",borderRadius:10,
                border:`1.5px solid ${urlErr?C.danger:"rgba(255,255,255,.1)"}`,
                background:C.surface,color:C.text,fontSize:15,outline:"none",
                fontFamily:"-apple-system,sans-serif"}}
            />
            <button onClick={()=>{
              if(!/^https?:\/\//.test(urlVal)){setUrlErr("Must start with https://");return;}
              setUrlErr(""); insertAtCursor(urlVal.trim());
            }} style={{padding:"10px 16px",borderRadius:10,border:"none",background:C.blue,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:15}}>
              Insert
            </button>
          </div>
          {urlErr&&<p style={{margin:0,fontSize:13,color:C.danger,fontFamily:"-apple-system,sans-serif"}}>{urlErr}</p>}
        </div>
      )}

      {tab==="youtube"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <p style={{margin:"0 0 4px",fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>
            Paste a YouTube link to embed its thumbnail in the note.
          </p>
          <div style={{display:"flex",gap:8}}>
            <input
              value={ytVal} onChange={e=>setYtVal(e.target.value)}
              onKeyDown={e=>{
                if(e.key!=="Enter") return;
                const id=getYouTubeId(ytVal);
                if(!id){setYtErr("Couldn't find a YouTube video ID.");return;}
                setYtErr(""); insertAtCursor(ytThumb(id), "YouTube");
              }}
              placeholder="https://youtube.com/watch?v=…"
              style={{flex:1,padding:"10px 12px",borderRadius:10,
                border:`1.5px solid ${ytErr?C.danger:"rgba(255,255,255,.1)"}`,
                background:C.surface,color:C.text,fontSize:15,outline:"none",
                fontFamily:"-apple-system,sans-serif"}}
            />
            <button onClick={()=>{
              const id=getYouTubeId(ytVal);
              if(!id){setYtErr("Couldn't find a YouTube video ID.");return;}
              setYtErr(""); insertAtCursor(ytThumb(id), "YouTube");
            }} style={{padding:"10px 14px",borderRadius:10,border:"none",background:"#FF0000",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center"}}>
              <Icon name="youtube" size={18} color="#fff"/>
            </button>
          </div>
          {ytErr&&<p style={{margin:0,fontSize:13,color:C.danger,fontFamily:"-apple-system,sans-serif"}}>{ytErr}</p>}
        </div>
      )}

      {/* Close button */}
      <button onClick={onClose} style={{
        marginTop:10,width:"100%",padding:"8px",background:"rgba(255,255,255,.05)",
        border:"none",borderRadius:10,cursor:"pointer",
        color:C.textMuted,fontSize:13,fontFamily:"-apple-system,sans-serif",
      }}>Done</button>
    </div>
  );
}

// ─── Formatting toolbar ───────────────────────────────────────────────────
// Stores heading level as a data attribute on the line div, not as text markers.
// Inline bold/italic/underline/strike use execCommand — no markdown symbols ever appear.

function FormatToolbar({ bodyRef, body, setBody, keyDownRef, onOpenCover }) {
  const [tab, setTab] = useState(null);
  const [fmtState, setFmtState] = useState({ bold:false, italic:false, underline:false, strike:false });
  const [, redraw] = useState(0);

  // Update format state whenever selection changes
  const updateFmtState = () => {
    try {
      setFmtState({
        bold:      document.queryCommandState("bold"),
        italic:    document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike:    document.queryCommandState("strikeThrough"),
      });
    } catch(e) {}
  };

  // ── execCommand helpers ──────────────────────────────────────────────────
  const exec = (cmd, val=null) => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    document.execCommand(cmd, false, val);
    if(el) setBody(el.innerHTML);
    updateFmtState();
    redraw(n=>n+1);
  };

  // ── Heading tag — use execCommand formatBlock so only the current line changes ──
  // h1=Title, h2=Heading, h3=Sub, p=Body. CSS handles all visual styling.
  // This is the same approach used by every real editor (Notion, Quill, TipTap).
  const applyLineTag = (tag) => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    const blockTag = tag==="[T]"?"h1" : tag==="[H]"?"h2" : tag==="[S]"?"h3" : "p";
    document.execCommand("formatBlock", false, blockTag);
    if(el) setBody(el.innerHTML);
    redraw(n=>n+1);
  };

  // Detect active heading from cursor position
  const getActiveLineTag = () => {
    try {
      const sel=window.getSelection();
      if(!sel||!sel.rangeCount) return "";
      let n=sel.getRangeAt(0).startContainer;
      while(n&&n!==bodyRef.current){
        const tag=n.tagName;
        if(tag==="H1") return "[T]";
        if(tag==="H2") return "[H]";
        if(tag==="H3") return "[S]";
        if(tag==="P")  return "";
        n=n.parentNode;
      }
    } catch(e){}
    return "";
  };

  // ── Bullet list — native execCommand, CSS overrides bullet to • ──────────
  const insertBulletItem = () => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    document.execCommand("insertUnorderedList", false, null);
    if(el) setBody(el.innerHTML);
    redraw(n=>n+1);
  };

  // ── Numbered list — native execCommand ───────────────────────────────────
  const insertNumberedItem = () => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    document.execCommand("insertOrderedList", false, null);
    if(el) setBody(el.innerHTML);
    redraw(n=>n+1);
  };

  // ── Checkbox: Apple-style — uses a <ul data-checklist> list ─────────────
  // Each <li> is one checkbox item. The browser handles Enter/continuation
  // natively (same as bullet/numbered lists). CSS provides the circle toggle.
  // Two consecutive Enters on empty items exits the list (native execCommand behaviour).
  const insertCheckbox = () => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    // Insert a checklist list. We use insertUnorderedList and immediately
    // mark the resulting <ul> with data-checklist so CSS can style it differently.
    document.execCommand("insertUnorderedList", false, null);
    // Find the <ul> that now contains the cursor and mark it
    setTimeout(()=>{
      const sel=window.getSelection();
      if(!sel||!sel.rangeCount) return;
      let n=sel.getRangeAt(0).startContainer;
      while(n&&n.tagName!=="UL") n=n.parentNode;
      if(n&&n.tagName==="UL"&&!n.dataset.checklist){
        n.dataset.checklist="true";
        // Mark existing li items too
        n.querySelectorAll("li").forEach(li=>{ li.dataset.cbitem="true"; });
      }
      if(el) setBody(el.innerHTML);
      redraw(n2=>n2+1);
    },0);
  };

  // ── Quote: use native blockquote via execCommand ─────────────────────────
  // Notion / Apple-style: formatBlock wraps the current line in <blockquote>.
  // The browser handles cursor placement and Enter continuation natively.
  // Two Enters on an empty blockquote line exits it (native formatBlock behaviour).
  const insertQuote = () => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    // Toggle: if already in a blockquote, switch back to div (exit quote)
    const sel=window.getSelection();
    let inQuote=false;
    if(sel&&sel.rangeCount){
      let n=sel.getRangeAt(0).startContainer;
      while(n&&n!==el){ if(n.tagName==="BLOCKQUOTE"){ inQuote=true; break; } n=n.parentNode; }
    }
    document.execCommand("formatBlock", false, inQuote?"div":"blockquote");
    if(el) setBody(el.innerHTML);
    redraw(n=>n+1);
  };

  // ── Insert divider ────────────────────────────────────────────────────────
  const insertDivider = () => {
    const el=bodyRef.current; if(!el) return;
    el.focus();
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount) return;
    const hr=document.createElement("hr");
    hr.style.cssText="border:none;border-top:1px solid rgba(255,255,255,.2);margin:10px 0;";
    const r=sel.getRangeAt(0);
    r.deleteContents();
    r.insertNode(hr);
    const after=document.createRange();
    after.setStartAfter(hr);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    if(el) setBody(el.innerHTML);
  };

  // ── Enter key: checklist item marking only ───────────────────────────────
  // Quote (blockquote) and bullet/numbered lists are handled natively by the browser.
  // We only need to mark new checklist <li> items after Enter so CSS styles them.
  const handleKeyDown = (e) => {
    if(e.key!=="Enter") return;
    const el=bodyRef.current; if(!el) return;
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount) return;
    const node=sel.getRangeAt(0).startContainer;

    // ── Are we inside a blockquote? ──────────────────────────────────────
    let bqNode=node;
    while(bqNode&&bqNode!==el){
      if(bqNode.tagName==="BLOCKQUOTE") break;
      bqNode=bqNode.parentNode;
    }
    if(bqNode&&bqNode.tagName==="BLOCKQUOTE"){
      // If the current line is empty, exit the blockquote
      const lineText=(bqNode.textContent||"").trim();
      if(lineText===""){
        e.preventDefault();
        document.execCommand("formatBlock", false, "div");
        if(el) setBody(el.innerHTML);
        return;
      }
      // Non-empty line: let browser create next blockquote line naturally
      return;
    }

    // ── Are we inside a checklist? ────────────────────────────────────────
    let liNode=node;
    while(liNode&&liNode.tagName!=="LI") liNode=liNode.parentNode;
    if(liNode&&liNode.tagName==="LI"){
      const ul=liNode.parentNode;
      if(ul&&ul.dataset&&ul.dataset.checklist==="true"){
        setTimeout(()=>{
          if(!el) return;
          el.querySelectorAll("ul[data-checklist] li").forEach(li=>{ li.dataset.cbitem="true"; });
          setBody(el.innerHTML);
        },0);
        return; // let browser handle Enter
      }
    }
    // All other cases: browser handles Enter naturally
  };

  // Expose both handlers on the ref
  if(keyDownRef){
    keyDownRef.current=handleKeyDown;
    keyDownRef.current.onSelChange=updateFmtState;
  }

  // Active states
  const activeTag=getActiveLineTag();

  const rowStyle=(bg=false)=>({
    display:"flex",alignItems:"center",justifyContent:"space-evenly",
    padding:"4px 8px",
    background:bg?"rgba(28,28,30,.98)":"rgba(18,18,20,.98)",
    borderTop:`1px solid ${C.divider}`,
  });

  const Btn=({icon,active,action,dim})=>{
    const col=active?C.accent:dim?"rgba(255,255,255,.3)":"rgba(255,255,255,.75)";
    return (
      <button
        onMouseDown={e=>{ e.preventDefault(); action(); }}
        style={{
          flex:1,display:"flex",alignItems:"center",justifyContent:"center",
          background:"none",border:"none",cursor:"pointer",borderRadius:8,padding:"9px 4px",
          borderBottom:active?`2.5px solid ${C.accent}`:"2.5px solid transparent",
        }}
      >
        <Icon name={icon} size={22} color={col}/>
      </button>
    );
  };

  const listsPanel=(
    <div style={rowStyle(true)}>
      <Btn icon="tb-bullet"   active={false} action={insertBulletItem}/>
      <Btn icon="tb-numbered" active={false} action={insertNumberedItem}/>
      <Btn icon="tb-quote"    active={false} action={insertQuote}/>
      <Btn icon="tb-divider"  active={false} action={insertDivider}/>
      <Btn icon="tb-close"    dim            action={()=>setTab(null)}/>
    </div>
  );

  const textPanel=(
    <div style={{background:"rgba(18,18,20,.98)",borderTop:`1px solid ${C.divider}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-evenly",padding:"6px 10px",borderBottom:`1px solid rgba(255,255,255,.06)`}}>
        {[["[T]","Title"],["[H]","Heading"],["[S]","Sub"],["","Body"]].map(([tag,label])=>{
          const isActive=activeTag===tag;
          return (
            <button key={label}
              onMouseDown={e=>{ e.preventDefault(); applyLineTag(tag); }}
              style={{
                flex:1,padding:"7px 4px",border:"none",cursor:"pointer",borderRadius:8,
                background:"none",
                color:isActive?C.accent:"rgba(255,255,255,.75)",
                fontSize:13,fontWeight:isActive?700:500,fontFamily:"-apple-system,sans-serif",
                borderBottom:isActive?`2.5px solid ${C.accent}`:"2.5px solid transparent",
              }}
            >{label}</button>
          );
        })}
        <button onMouseDown={e=>{ e.preventDefault(); setTab(null); }} style={{background:"none",border:"none",cursor:"pointer",padding:"7px 8px",display:"flex",alignItems:"center"}}>
          <Icon name="tb-close" size={18} color="rgba(255,255,255,.35)"/>
        </button>
      </div>
      {/* Bold/Italic/Underline/Strike — one tap on, one tap off */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-evenly",padding:"4px 8px"}}>
        <Btn icon="bold"      active={fmtState.bold}      action={()=>exec("bold")}/>
        <Btn icon="italic"    active={fmtState.italic}    action={()=>exec("italic")}/>
        <Btn icon="underline" active={fmtState.underline} action={()=>exec("underline")}/>
        <Btn icon="strike"    active={fmtState.strike}    action={()=>exec("strikeThrough")}/>
      </div>
    </div>
  );

  const tabBar=(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-evenly",padding:"4px 8px",background:"rgba(18,18,20,.98)",borderTop:`1px solid ${C.divider}`}}>
      <Btn icon="tb-lists" active={tab==="lists"} action={()=>setTab(t=>t==="lists"?null:"lists")}/>
      <Btn icon="tb-text"  active={tab==="text"}  action={()=>setTab(t=>t==="text"?null:"text")}/>
      <Btn icon="tb-check" active={false}         action={insertCheckbox}/>
      <Btn icon="tb-cover" active={tab==="media"} action={()=>setTab(t=>t==="media"?null:"media")}/>
      <Btn icon="tb-kbd"   dim                    action={()=>{ setTab(null); bodyRef.current?.blur(); }}/>
    </div>
  );

  return (
    <div>
      {tab==="lists" && listsPanel}
      {tab==="text"  && textPanel}
      {tab==="media" && <InlineMediaPanel bodyRef={bodyRef} setBody={setBody} onClose={()=>setTab(null)}/>}
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
            <p style={{margin:0,fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{(note.body||"").replace(/\n/g," ").slice(0,50)||"No additional text"}</p>
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
              border:(current?.type==="palette"&&current?.id===p.id)?`2px solid ${p.accent}`:`2px solid rgba(255,255,255,.08)`,
              boxShadow:(current?.type==="palette"&&current?.id===p.id)?`0 0 0 3px ${p.accent}30`:"none",
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
        // Divider — thin full-width line
        if(line.trim()==="---") return <div key={i} style={{height:1,background:"rgba(255,255,255,.18)",margin:"10px 0",borderRadius:1}}/>;
        // Quote block — bar taller, text slightly larger than body
        if(line.startsWith("| ")) return (
          <div key={i} style={{display:"flex",gap:12,marginBottom:4,paddingLeft:2}}>
            <div style={{width:4,minHeight:"100%",borderRadius:2,background:C.accent,flexShrink:0}}/>
            <span style={{fontSize:19,lineHeight:1.65,color:"rgba(235,235,245,.75)",fontStyle:"italic"}}>{renderInline(line.slice(2))}</span>
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
        // Bullet list — • indicator
        if(line.startsWith("- ")) return (
          <div key={i} style={{display:"flex",gap:10,marginBottom:2,alignItems:"flex-start"}}>
            <span style={{color:C.accent,fontSize:20,lineHeight:1.55,flexShrink:0,userSelect:"none"}}>•</span>
            <span style={{fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.85)"}}>{renderInline(line.slice(2))}</span>
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

// ─── Editor display layer renderer ───────────────────────────────────────
// Each line renders at EXACTLY the same height as a textarea line (17px * 1.75).
// No fontSize changes — only color/weight/style — so cursor never drifts.
function RichBodyEditor({ body }) {
  const LINE_H = "29.75px"; // 17 * 1.75 — matches textarea lineHeight
  const lines = (body||"").split("\n");
  return (
    <>
      {lines.map((line, i) => {
        // Divider --- : render as a thin line centered in the line's height
        if(line.trim()==="---") return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",margin:0}}>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,.25)",borderRadius:1}}/>
          </div>
        );

        // Quote | text
        if(line.startsWith("| ")) return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",gap:10,margin:0}}>
            <div style={{width:3,height:"70%",background:C.accent,borderRadius:2,flexShrink:0}}/>
            <span style={{color:"rgba(235,235,245,.75)",fontStyle:"italic",fontSize:17,lineHeight:LINE_H}}>{renderInline(line.slice(2))}</span>
          </div>
        );

        // Checkbox - [ ] / - [x]
        if(line.startsWith("- [ ] ")||line.startsWith("- [x] ")) {
          const done=line.startsWith("- [x] ");
          return (
            <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",gap:8,margin:0}}>
              <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${done?C.accent:"rgba(255,255,255,.35)"}`,background:done?C.accent:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {done&&<svg width="9" height="9" viewBox="0 0 12 12"><polyline fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" points="2,6 5,9 10,3"/></svg>}
              </div>
              <span style={{color:done?"rgba(235,235,245,.35)":"rgba(235,235,245,.85)",textDecoration:done?"line-through":"none",fontSize:17,lineHeight:LINE_H}}>{renderInline(line.slice(6))}</span>
            </div>
          );
        }

        // Bullet - text
        if(line.startsWith("- ")) return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",gap:8,margin:0}}>
            <span style={{color:C.accent,fontSize:18,lineHeight:LINE_H,flexShrink:0,userSelect:"none",marginTop:-1}}>•</span>
            <span style={{color:"rgba(235,235,245,.85)",fontSize:17,lineHeight:LINE_H}}>{renderInline(line.slice(2))}</span>
          </div>
        );

        // Numbered list
        const numMatch=line.match(/^(\d+)\. (.*)/);
        if(numMatch) return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",gap:6,margin:0}}>
            <span style={{color:"rgba(235,235,245,.5)",fontSize:17,lineHeight:LINE_H,flexShrink:0,minWidth:20}}>{numMatch[1]}.</span>
            <span style={{color:"rgba(235,235,245,.85)",fontSize:17,lineHeight:LINE_H}}>{renderInline(numMatch[2])}</span>
          </div>
        );

        // Title [T] — same line height, just bolder + larger font-size visually
        // We use fontSize:17 for line-height consistency but font-weight:800 + letter-spacing
        if(line.startsWith("[T]")) return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",margin:0}}>
            <span style={{fontSize:17,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",lineHeight:LINE_H,letterSpacing:"-0.3px"}}>
              {renderInline(line.slice(3))||"\u00A0"}
            </span>
          </div>
        );

        // Heading [H]
        if(line.startsWith("[H]")) return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",margin:0}}>
            <span style={{fontSize:17,fontWeight:700,color:"#fff",lineHeight:LINE_H}}>
              {renderInline(line.slice(3))||"\u00A0"}
            </span>
          </div>
        );

        // Subheading [S]
        if(line.startsWith("[S]")) return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",margin:0}}>
            <span style={{fontSize:17,fontWeight:600,color:"rgba(235,235,245,.9)",lineHeight:LINE_H}}>
              {renderInline(line.slice(3))||"\u00A0"}
            </span>
          </div>
        );

        // Empty line
        if(!line.trim()) return <div key={i} style={{height:LINE_H}}/>;

        // Full-line image
        const imgMatch=line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if(imgMatch) return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center"}}>
            <img src={imgMatch[2]} alt={imgMatch[1]||""} style={{height:"90%",maxWidth:"100%",borderRadius:4,objectFit:"cover"}}/>
          </div>
        );

        // Body text
        return (
          <div key={i} style={{height:LINE_H,display:"flex",alignItems:"center",margin:0}}>
            <span style={{fontSize:17,lineHeight:LINE_H,color:"rgba(235,235,245,.88)",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
              {renderInline(line)||"\u00A0"}
            </span>
          </div>
        );
      })}
    </>
  );
}

// ─── Inline rich renderer (used in note list read view) ───────────────────
function RichBodyInline({ body }) {
  const lines = (body||"").split("\n");
  return (
    <>
      {lines.map((line,i)=>{
        if(line.trim()==="---") return <div key={i} style={{height:1,background:"rgba(255,255,255,.18)",margin:"10px 0",borderRadius:1}}/>;
        if(line.startsWith("| ")) return (
          <div key={i} style={{display:"flex",gap:12,marginBottom:4}}>
            <div style={{width:4,borderRadius:2,background:C.accent,flexShrink:0,alignSelf:"stretch",minHeight:24}}/>
            <span style={{fontSize:19,lineHeight:1.75,color:"rgba(235,235,245,.75)",fontStyle:"italic"}}>{renderInline(line.slice(2))}</span>
          </div>
        );
        if(line.startsWith("- [x] ")||line.startsWith("- [ ] ")) {
          const done=line.startsWith("- [x] ");
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
              <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${done?C.accent:"rgba(255,255,255,.3)"}`,background:done?C.accent:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {done&&<svg width="11" height="11" viewBox="0 0 12 12"><polyline fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" points="2,6 5,9 10,3"/></svg>}
              </div>
              <span style={{fontSize:17,lineHeight:1.75,color:done?"rgba(235,235,245,.35)":"rgba(235,235,245,.85)",textDecoration:done?"line-through":"none"}}>{renderInline(line.slice(6))}</span>
            </div>
          );
        }
        if(line.startsWith("- ")) return (
          <div key={i} style={{display:"flex",gap:10,marginBottom:2,alignItems:"flex-start"}}>
            <span style={{color:C.accent,fontSize:20,lineHeight:1.55,flexShrink:0,userSelect:"none"}}>•</span>
            <span style={{fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.85)"}}>{renderInline(line.slice(2))}</span>
          </div>
        );
        const numMatch=line.match(/^(\d+)\. (.*)/);
        if(numMatch) return (
          <div key={i} style={{display:"flex",gap:8,marginBottom:2}}>
            <span style={{color:"rgba(235,235,245,.5)",flexShrink:0,minWidth:22,fontSize:17,lineHeight:1.75}}>{numMatch[1]}.</span>
            <span style={{fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.85)"}}>{renderInline(numMatch[2])}</span>
          </div>
        );
        if(line.startsWith("[T]")) return <p key={i} style={{margin:"6px 0 2px",fontSize:26,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",lineHeight:1.3}}>{renderInline(line.slice(3))||"\u00A0"}</p>;
        if(line.startsWith("[H]")) return <p key={i} style={{margin:"4px 0 2px",fontSize:21,fontWeight:700,color:"#fff",lineHeight:1.4}}>{renderInline(line.slice(3))||"\u00A0"}</p>;
        if(line.startsWith("[S]")) return <p key={i} style={{margin:"2px 0 2px",fontSize:18,fontWeight:600,color:"rgba(235,235,245,.9)",lineHeight:1.5}}>{renderInline(line.slice(3))||"\u00A0"}</p>;
        if(!line.trim()) return <div key={i} style={{height:"1.75em"}}/>;
        // Full-line inline image: ![alt](url)
        const imgMatch=line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if(imgMatch) return <img key={i} src={imgMatch[2]} alt={imgMatch[1]||"image"} style={{maxWidth:"100%",borderRadius:10,display:"block",margin:"6px 0"}}/>;
        return <p key={i} style={{margin:"0 0 2px",fontSize:17,lineHeight:1.75,color:"rgba(235,235,245,.85)"}}>{renderInline(line)}</p>;
      })}
    </>
  );
}

function renderInline(text="") {
  // Handle block images first: ![alt](url)
  const imgRe=/!\[([^\]]*)\]\(([^)]+)\)/g;
  if(imgRe.test(text)) {
    imgRe.lastIndex=0;
    const parts=[];
    let last=0, m;
    while((m=imgRe.exec(text))!==null) {
      if(m.index>last) parts.push(...renderSpans(text.slice(last,m.index)));
      parts.push(<img key={`img-${m.index}`} src={m[2]} alt={m[1]||"image"} style={{maxWidth:"100%",borderRadius:8,display:"block",margin:"4px 0"}}/>);
      last=imgRe.lastIndex;
    }
    if(last<text.length) parts.push(...renderSpans(text.slice(last)));
    return parts.length ? parts : [text];
  }
  return renderSpans(text);
}

// Tokenize inline markdown into styled React elements.
// Supports nesting: **_bold italic_**  ~~**strike bold**~~  etc.
// Markers in priority order: ** (bold), ~~ (strike), __ (underline), _ (italic)
// Find the first valid marker+close pair in text, respecting marker priority.
// Key rule: longer markers (**) take priority over shorter (_) at same position.
function findFirstMarker(text) {
  // Ordered by length desc so ** beats _ and __ beats _
  const markers = [
    { open:"**", close:"**", tag:"bold" },
    { open:"~~", close:"~~", tag:"strike" },
    { open:"__", close:"__", tag:"underline" },
    { open:"_",  close:"_",  tag:"italic" },
  ];
  let best = null;
  for(const m of markers) {
    let searchFrom = 0;
    while(searchFrom < text.length) {
      const oi = text.indexOf(m.open, searchFrom);
      if(oi === -1) break;
      // Make sure this isn't a prefix of a longer marker already found
      // e.g. don't match _ at position of __
      const after = oi + m.open.length;
      // For _ (single), skip if the char before or after is also _
      if(m.open === "_") {
        const prevChar = oi > 0 ? text[oi-1] : "";
        const nextChar = after < text.length ? text[after] : "";
        if(prevChar === "_" || nextChar === "_") { searchFrom = oi+1; continue; }
      }
      // Find matching close after the open
      const ci = text.indexOf(m.close, after);
      if(ci === -1) break;
      // For _ (single), skip if char before close is also _
      if(m.close === "_") {
        const prevChar = ci > 0 ? text[ci-1] : "";
        if(prevChar === "_") { searchFrom = oi+1; continue; }
      }
      // Valid pair found
      if(!best || oi < best.oi || (oi === best.oi && m.open.length > best.m.open.length)) {
        best = { m, oi, ci };
      }
      break;
    }
  }
  return best;
}

function renderSpans(text="", depth=0) {
  if(!text || depth>8) return [text];

  const found = findFirstMarker(text);
  if(!found) return [text];

  const { m, oi, ci } = found;
  const parts = [];
  if(oi > 0) parts.push(text.slice(0, oi));

  const inner = text.slice(oi + m.open.length, ci);
  const innerNodes = renderSpans(inner, depth+1);
  const key = `${m.tag}-${oi}-${depth}`;

  if(m.tag === "bold")      parts.push(<strong key={key}>{innerNodes}</strong>);
  else if(m.tag === "strike")    parts.push(<span key={key} style={{textDecoration:"line-through"}}>{innerNodes}</span>);
  else if(m.tag === "underline") parts.push(<span key={key} style={{textDecoration:"underline"}}>{innerNodes}</span>);
  else if(m.tag === "italic")    parts.push(<em key={key}>{innerNodes}</em>);

  const rest = text.slice(ci + m.close.length);
  if(rest) parts.push(...renderSpans(rest, depth));
  return parts;
}

function renderInlineText(text="") {
  return renderSpans(text);
}

// ─── Share Sheet ──────────────────────────────────────────────────────────
function ShareSheet({ note, onClose }) {
  const rawBody=(note.body||"").replace(/<br\s*\/?>/gi,"\n").replace(/<div>/gi,"\n").replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
  const shareText = `${note.title}\n\n${rawBody}`;
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
              <p style={{margin:0,fontSize:13,color:C.textMuted}}>{(note.body||"").split("\n")[0]?.slice(0,40)||"No additional text"}</p>
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

function NoteContextMenu({ note, onClose, onPin, onShare, onMove, onDelete, onRestore, onPurge, trashView }) {
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
          {(note.body||"").split("\n").slice(0,8).map((line,i)=>(
            <p key={i} style={{margin:"0 0 2px"}}>{line||" "}</p>
          ))}
        </div>
      </div>
      {/* Action menu */}
      <div onClick={e=>e.stopPropagation()} style={{
        margin:"0 16px 32px", background:"#2C2C2E", borderRadius:14,
        overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.6)",
      }}>
        {trashView ? (<>
          <button onClick={onRestore} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",borderBottom:`1px solid ${C.divider}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:17,color:C.accent,fontFamily:"-apple-system,sans-serif"}}>Restore</span>
            <Icon name="backup" size={20} color={C.accent}/>
          </button>
          <button onClick={onPurge} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:17,color:C.danger,fontFamily:"-apple-system,sans-serif"}}>Delete Permanently</span>
            <Icon name="trash" size={20} color={C.danger}/>
          </button>
        </>) : (<>
          {[
            { label:"Pin Note",   icon:"pin",   action:()=>{onPin();onClose();} },
            { label:"Share Note", icon:"share", action:()=>{onShare();onClose();} },
            { label:"Move",       icon:"move",  action:()=>{onMove();onClose();} },
          ].map((row)=>(
            <button key={row.label} onClick={row.action} style={{
              width:"100%",padding:"14px 16px",background:"none",
              border:"none",borderBottom:`1px solid ${C.divider}`,
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
            }}>
              <span style={{fontSize:17,color:C.text,fontFamily:"-apple-system,sans-serif"}}>{row.label}</span>
              <Icon name={row.icon} size={20} color={C.textMuted}/>
            </button>
          ))}
          <button onClick={()=>{onDelete();onClose();}} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:17,color:C.danger,fontFamily:"-apple-system,sans-serif"}}>Delete</span>
            <Icon name="trash" size={20} color={C.danger}/>
          </button>
        </>)}
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
      <div style={{padding:"52px 20px 0"}}>
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
function NoteListScreen({ folder, allFolders, notes, onBack, onOpenNote, onNewNote, trashView, pinnedView, onDeleteNote, onPurgeNote, onRestoreNote, onMoveNote, onPinNote, onNewFolder, onOpenSettings }) {
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
    return n.title.toLowerCase().includes(q)||(n.body||"").toLowerCase().includes(q);
  });

  const visible = [...base].sort((a,b)=>{
    if(sortNotes==="title")   return a.title.localeCompare(b.title);
    if(sortNotes==="oldest")  return a.ts-b.ts;
    if(sortNotes==="created") return a.ts-b.ts;
    return b.ts-a.ts;
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

  // Trash-specific bulk actions
  const purgeSelected=()=>{
    selected.forEach(id=>onPurgeNote?.(id));
    setSelected(new Set()); setSelectMode(false);
  };
  const restoreSelected=()=>{
    selected.forEach(id=>onRestoreNote?.(id));
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
        {selectMode ? (
          trashView ? (<>
            {/* Trash select mode: Restore | Delete Permanently */}
            <button onClick={restoreSelected} style={{background:"none",border:"none",cursor:"pointer",color:selected.size>0?C.accent:C.textMuted,fontSize:17,fontFamily:"-apple-system,sans-serif"}}>
              {selected.size===visible.length?"Restore All":"Restore"}
            </button>
            <button onClick={purgeSelected} style={{background:"none",border:"none",cursor:"pointer",color:selected.size>0?C.danger:C.textMuted,fontSize:17,fontFamily:"-apple-system,sans-serif"}}>
              {selected.size===visible.length?"Delete All":"Delete"}
            </button>
          </>) : (<>
            {/* Normal select mode: Move | Delete */}
            <button onClick={()=>{ if(selected.size>0){ selected.forEach(id=>onMoveNote(id,allFolders[0]?.id)); setSelected(new Set()); setSelectMode(false); } }} style={{background:"none",border:"none",cursor:"pointer",color:selected.size>0?C.accent:C.textMuted,fontSize:17,fontFamily:"-apple-system,sans-serif"}}>
              {selected.size===visible.length?"Move All":"Move"}
            </button>
            <button onClick={deleteSelected} style={{background:"none",border:"none",cursor:"pointer",color:selected.size>0?C.danger:C.textMuted,fontSize:17,fontFamily:"-apple-system,sans-serif"}}>
              {selected.size===visible.length?"Delete All":"Delete"}
            </button>
          </>)
        ) : (
          trashView ? (<>
            {/* Trash normal mode: note count + Select button */}
            <span style={{fontSize:14,color:C.textMuted}}>{visible.length} Note{visible.length!==1?"s":""}</span>
            {visible.length>0&&(
              <button onClick={()=>setSelectMode(true)} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,fontFamily:"-apple-system,sans-serif",padding:0}}>
                Select
              </button>
            )}
          </>) : (<>
            <span style={{fontSize:14,color:C.textMuted}}>{visible.length} Note{visible.length!==1?"s":""}</span>
            <button onClick={onNewNote} style={{position:"absolute",right:24,bottom:28,background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
              <Icon name="compose" size={26} color={C.accent}/>
            </button>
          </>)
        )}
      </div>

      {showMenu&&<NoteListMenu onClose={()=>setShowMenu(false)} sortNotes={setSortNotes} currentSort={sortNotes} onSelectMode={()=>setSelectMode(true)}/>}
      {contextNote&&<NoteContextMenu note={contextNote} onClose={()=>setContextNote(null)}
        onPin={()=>{ onPinNote?.(contextNote.id); setContextNote(null); }}
        onShare={()=>setShareNote(contextNote)}
        onMove={()=>setShowMoveFor(contextNote)}
        onDelete={()=>{ onDeleteNote(contextNote.id); setContextNote(null); }}
        onRestore={trashView?(()=>{ onRestoreNote?.(contextNote.id); setContextNote(null); }):null}
        onPurge={trashView?(()=>{ onPurgeNote?.(contextNote.id); setContextNote(null); }):null}
        trashView={trashView}/>}
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
          <span style={{opacity:.7}}>{(note.body||"").replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").slice(0,50)||"No additional text"}</span>
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
  const [title,   setTitle]   = useState(note?.title || "");
  const [body,    setBody]    = useState(note?.body || "");
  const [cover,   setCover]   = useState(note?.cover || null);
  const [pinned,  setPinned]  = useState(note?.pinned || false);
  const [folderId,setFolderId]= useState(note?.folderId || allFolders[0]?.id || "notes");
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showVideo,       setShowVideo]       = useState(false);
  const [showMore,        setShowMore]        = useState(false);
  const [showMove,        setShowMove]        = useState(false);
  const [showShare,       setShowShare]       = useState(false);
  const [history,  setHistory]  = useState([note?.body || ""]);
  const [histIdx,  setHistIdx]  = useState(0);
  const bodyRef = useRef();        // ref to contenteditable div
  const listKeyDownRef = useRef(null);

  // Sync contenteditable content when a different note is opened
  useEffect(()=>{
    if(!note) return;
    setTitle(note.title ?? "");
    setBody(note.body ?? "");
    setCover(note.cover ?? null);
    setPinned(note.pinned ?? false);
    setFolderId(note.folderId ?? allFolders[0]?.id ?? "notes");
    setHistory([note.body ?? ""]);
    setHistIdx(0);
    // Directly set contenteditable innerHTML to avoid cursor jumping on controlled re-render
    if(bodyRef.current) bodyRef.current.innerHTML = note.body ?? "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[note?.id]);

  useEffect(()=>{ if(!showCoverPicker&&!showMore&&!showMove&&!showShare) setTimeout(()=>bodyRef.current?.focus(),80); },[showCoverPicker,showMore,showMove,showShare]);

  const setBodyWithHistory = (val) => {
    const newHist = history.slice(0,histIdx+1);
    newHist.push(val);
    setHistory(newHist);
    setHistIdx(newHist.length-1);
    setBody(val);
    // Only update innerHTML if it actually differs (avoids cursor jump)
    if(bodyRef.current && bodyRef.current.innerHTML !== val) {
      bodyRef.current.innerHTML = val;
    }
  };

  const undo = () => {
    if(histIdx>0){
      const prev=history[histIdx-1];
      setHistIdx(i=>i-1);
      setBody(prev);
      if(bodyRef.current) bodyRef.current.innerHTML=prev;
    }
  };
  const redo = () => {
    if(histIdx<history.length-1){
      const next=history[histIdx+1];
      setHistIdx(i=>i+1);
      setBody(next);
      if(bodyRef.current) bodyRef.current.innerHTML=next;
    }
  };

  const save = () => onSave({...(note||{}),title,body,cover,pinned,folderId,ts:Date.now()});
  const done = () => { save(); onBack(); };

  const edBg     = (cover && cover.type === "palette") ? (cover.bg || "#000000") : "#000000";
  const hasMedia = cover && (cover.type === "image" || cover.type === "youtube");
  const currentNote = {...(note||{}),title,body,cover,folderId};

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:edBg,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto"}}>
      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"52px 16px 10px",background:hasMedia?"rgba(0,0,0,.65)":edBg,backdropFilter:hasMedia?"blur(16px)":"none",gap:8}}>
        <button onClick={done} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,display:"flex",alignItems:"center",gap:2,padding:0}}>
          <Icon name="back" size={20} color={C.accent}/> Notes
        </button>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
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

      {/* Body editor — contenteditable div: WYSIWYG, no markdown markers ever visible */}
      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        onInput={e=>{
          const html=e.currentTarget.innerHTML;
          setBodyWithHistory(html);
        }}
        onKeyDown={e=>listKeyDownRef.current?.(e)}
        onKeyUp={()=>listKeyDownRef.current?.onSelChange?.()}
        onMouseUp={()=>listKeyDownRef.current?.onSelChange?.()}
        data-placeholder="Start writing…"
        style={{
          flex:1,border:"none",outline:"none",background:"transparent",
          fontSize:17,lineHeight:1.75,
          color:"rgba(235,235,245,.88)",
          padding:"4px 20px 80px",
          fontFamily:"-apple-system,sans-serif",
          overflowY:"auto",
          WebkitOverflowScrolling:"touch",
          boxSizing:"border-box",
          whiteSpace:"pre-wrap",
          wordBreak:"break-word",
          minHeight:80,
        }}
      />

      {/* Formatting toolbar */}
      <FormatToolbar bodyRef={bodyRef} body={body} setBody={setBodyWithHistory} keyDownRef={listKeyDownRef} onOpenCover={()=>{ setShowCoverPicker(true); setShowMore(false); }}/>

      {/* ⋯ Menu */}
      {showMore&&(
        <MoreMenu
          onClose={()=>setShowMore(false)}
          pinned={pinned}
          onPin={()=>{
            const newPinned=!pinned;
            setPinned(newPinned);
            // Immediately persist so the Pinned folder reflects the change
            onSave({...note,title,body,cover,pinned:newPinned,folderId,ts:Date.now()});
          }}
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
  const previewColor = FOLDER_COLORS.find(c=>c.id===colorId) || FOLDER_COLORS[0];
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
          <div style={{width:28,height:28,borderRadius:7,background:previewColor.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="folder" size={16} color={previewColor.dot}/>
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

  const saveNote = u => {
    setNotes(p=>p.map(n=>n.id===u.id?u:n));
    // Keep the stack's note ref in sync so EditorScreen always sees the latest saved state
    setStack(s=>s.map(frame=>
      frame.screen==="editor" && frame.note?.id===u.id ? {...frame,note:u} : frame
    ));
  };
  // Delete sends to trash, not permanent
  const deleteNote  = id => setNotes(p=>p.map(n=>n.id===id?{...n,trashed:true}:n));
  // Permanently delete (only used from trash view)
  const purgeNote   = id => setNotes(p=>p.filter(n=>n.id!==id));
  // Restore from trash back to its folder
  const restoreNote = id => setNotes(p=>p.map(n=>n.id===id?{...n,trashed:false}:n));
  // Toggle pin — immediately persists so Pinned folder updates
  const pinNote = id => setNotes(p=>p.map(n=>n.id===id?{...n,pinned:!n.pinned}:n));
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
          onPurgeNote={purgeNote}
          onRestoreNote={restoreNote}
          onMoveNote={moveNote}
          onPinNote={pinNote}
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
