import { useState, useRef, useEffect } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────
const C = {
  bg:"#000000", surface:"#1C1C1E", surface2:"#2C2C2E", surface3:"#3A3A3C",
  divider:"rgba(255,255,255,.1)", text:"#FFFFFF", textSub:"rgba(235,235,245,.8)",
  textMuted:"#8E8E93", accent:"#FFD60A", danger:"#FF453A", green:"#32D74B",
  blue:"#0A84FF", chevron:"#48484A",
};

// ─── Folder colour themes ─────────────────────────────────────────────────
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

// ─── Note cover palettes ──────────────────────────────────────────────────
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

const INIT_FOLDERS = [
  { id:"notes",    name:"Notes",    colorId:"gold"   },
  { id:"journals", name:"Journals", colorId:"blue"   },
  { id:"ideas",    name:"Ideas",    colorId:"violet" },
];
const INIT_NOTES = [
  { id:"n1", folderId:"notes",    title:"CHE 412 Exam prep",   body:"Static Characteristics: Are concerned with the steady state behaviour of instruments.", cover:null, starred:false, trashed:false, ts:makeTs(0), pinned:false },
  { id:"n2", folderId:"journals", title:"Entry 17032026",      body:"I think this will be my new journal and notes app.", cover:{type:"palette",...PALETTES[0]}, starred:false, trashed:false, ts:makeTs(1), pinned:false },
  { id:"n3", folderId:"notes",    title:"Movies Watchlist",    body:"Inception (Mind-bending thriller)\nInterstellar\nDune Part 2", cover:null, starred:true, trashed:false, ts:makeTs(1), pinned:false },
];

function coverBg(cover) {
  if(!cover) return C.surface;
  if(cover.type==="palette") return cover.bg;
  if(cover.type==="image")   return `url(${cover.src}) center/cover no-repeat`;
  if(cover.type==="youtube") return `url(${ytThumb(cover.videoId)}) center/cover no-repeat`;
  return C.surface;
}
function coverAccent(cover) {
  if(!cover||cover.type!=="palette") return C.accent;
  return cover.accent;
}

// ─── Minimal SVG Icons ────────────────────────────────────────────────────
const Icon = ({ name, size=20, color=C.textMuted, style:s }) => {
  const p = { fill:"none", stroke:color, strokeWidth:1.5, strokeLinecap:"round", strokeLinejoin:"round" };
  const paths = {
    folder:     <><path {...p} d="M3 7.5C3 6.4 3.9 5.5 5 5.5h3.5l1.5 2H17c1.1 0 2 .9 2 2V15c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7.5z"/></>,
    "folder-new":<><path {...p} d="M3 7.5C3 6.4 3.9 5.5 5 5.5h3.5l1.5 2H17c1.1 0 2 .9 2 2V15c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7.5z"/><path {...p} d="M10 10v4M8 12h4"/></>,
    compose:    <><path {...p} d="M14 3.5l3 3L7 16.5 3 17.5l1-4L14 3.5z"/></>,
    pin:        <><path {...p} d="M12 2.5l5 5-1 1-1.5-.5L10 13l.5 1.5-1 1-5-5 1-1 1.5.5 4.5-4.5-.5-1.5 1-1zM7 13.5l-3 3"/></>,
    trash:      <><polyline {...p} points="3,7 5,7 19,7"/><path {...p} d="M8 7V5h8v2M6 7l1 12h10l1-12"/><path {...p} d="M10 11v5M14 11v5"/></>,
    settings:   <><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    allnotes:   <><path {...p} d="M4 6h16M4 10h16M4 14h10"/></>,
    star:       <><polygon {...p} points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></>,
    "star-fill":<><polygon strokeWidth="0" fill={color} points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></>,
    search:     <><circle {...p} cx="11" cy="11" r="7"/><path {...p} d="M21 21l-4.35-4.35"/></>,
    share:      <><path {...p} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><polyline {...p} points="16,6 12,2 8,6"/><line {...p} x1="12" y1="2" x2="12" y2="15"/></>,
    more:       <><circle {...p} fill={color} stroke="none" cx="5" cy="12" r="1.2"/><circle {...p} fill={color} stroke="none" cx="12" cy="12" r="1.2"/><circle {...p} fill={color} stroke="none" cx="19" cy="12" r="1.2"/></>,
    back:       <><path {...p} d="M15 18l-6-6 6-6"/></>,
    drive:      <><path {...p} d="M12 2L2 19h20L12 2z" strokeWidth="1.3"/><path {...p} d="M2 19h20M7 12h10"/></>,
    sort:       <><path {...p} d="M3 6h18M6 12h12M9 18h6"/></>,
    palette:    <><circle {...p} cx="12" cy="12" r="9"/><circle {...p} cx="9" cy="10" r="1.2" fill={color} stroke="none"/><circle {...p} cx="15" cy="10" r="1.2" fill={color} stroke="none"/><circle {...p} cx="12" cy="15" r="1.2" fill={color} stroke="none"/></>,
    check:      <><polyline {...p} points="20,6 9,17 4,12"/></>,
    image:      <><rect {...p} x="3" y="3" width="18" height="18" rx="2"/><circle {...p} cx="8.5" cy="8.5" r="1.5"/><polyline {...p} points="21,15 16,10 5,21"/></>,
    youtube:    <><rect {...p} x="2" y="5" width="20" height="14" rx="2.5"/><polygon {...p} fill={color} stroke="none" points="10,9 16,12 10,15"/></>,
    backup:     <><polyline {...p} points="8,17 12,13 16,17"/><line {...p} x1="12" y1="13" x2="12" y2="21"/><path {...p} d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></>,
    clock:      <><circle {...p} cx="12" cy="12" r="9"/><polyline {...p} points="12,7 12,12 15,15"/></>,
    az:         <><path {...p} d="M4 7h8M4 12h5M4 17h3"/><path {...p} d="M15 8l3-3 3 3M18 5v9M15 14h3v3h-3v-3z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={s}>
      {paths[name]}
    </svg>
  );
};

// helper: get folder colour object
const folderColor = f => FOLDER_COLORS.find(c=>c.id===f?.colorId) || FOLDER_COLORS[0];

// ─── Shared Row component ─────────────────────────────────────────────────
function Row({ left, label, sub, badge, onTap, noBorder, danger, rightEl }) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onTap}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:14,
        padding:"13px 16px",
        borderBottom: noBorder?"none":`1px solid ${C.divider}`,
        cursor:onTap?"pointer":"default",
        background:hov&&onTap?"rgba(255,255,255,.03)":"transparent",
        transition:"background .1s",
      }}>
      {left && <div style={{flexShrink:0,display:"flex",alignItems:"center"}}>{left}</div>}
      <div style={{flex:1,minWidth:0}}>
        <span style={{fontSize:17,color:danger?C.danger:C.text,fontFamily:"-apple-system,sans-serif",display:"block"}}>
          {label}
        </span>
        {sub && <span style={{fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{sub}</span>}
      </div>
      {rightEl && rightEl}
      {badge!=null && <span style={{fontSize:16,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>{badge}</span>}
      {onTap && <Icon name="back" size={18} color={C.chevron} style={{transform:"rotate(180deg)"}}/>}
    </div>
  );
}

const Card = ({ children, style }) => (
  <div style={{background:C.surface,borderRadius:13,overflow:"hidden",marginBottom:8,...style}}>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Folders
// ═══════════════════════════════════════════════════════════════════════════
function FoldersScreen({ folders, notes, sortBy, onOpenFolder, onNewFolder, onNewNote, onOpenSystem, onOpenSettings }) {
  const count = id => notes.filter(n=>!n.trashed&&(id==="all"?true:n.folderId===id)).length;
  const pinnedCount = notes.filter(n=>!n.trashed&&n.pinned).length;
  const trashCount  = notes.filter(n=>n.trashed).length;

  // sort folders
  const sorted = [...folders].sort((a,b)=>{
    if(sortBy==="name")  return a.name.localeCompare(b.name);
    if(sortBy==="count") return count(b.id)-count(a.id);
    if(sortBy==="color") return (FOLDER_COLORS.findIndex(c=>c.id===a.colorId))-(FOLDER_COLORS.findIndex(c=>c.id===b.colorId));
    return 0; // manual
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"52px 20px 0",display:"flex",justifyContent:"flex-end"}}>
        <button style={{background:"none",border:"none",color:C.accent,fontSize:17,cursor:"pointer"}}>Edit</button>
      </div>
      <div style={{padding:"6px 20px 14px"}}>
        <h1 style={{margin:"0 0 14px",fontSize:34,fontWeight:700,color:C.text,letterSpacing:-.5}}>Folders</h1>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 16px 120px"}}>
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"0 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>My Folders</p>
        <Card>
          <Row
            left={<Icon name="allnotes" size={20} color={C.accent}/>}
            label="All Notes" badge={count("all")}
            onTap={()=>onOpenSystem("all")}/>
          {sorted.map((f,i)=>{
            const fc = folderColor(f);
            return (
              <Row key={f.id}
                left={
                  <div style={{
                    width:28,height:28,borderRadius:7,
                    background:fc.bg,
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    <Icon name="folder" size={16} color={fc.dot}/>
                  </div>
                }
                label={f.name} badge={count(f.id)}
                onTap={()=>onOpenFolder(f)}
                noBorder={i===sorted.length-1}/>
            );
          })}
        </Card>

        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"14px 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>Smart Folders</p>
        <Card>
          <Row left={<Icon name="pin" size={20} color={C.textMuted}/>}  label="Pinned"           badge={pinnedCount} onTap={()=>onOpenSystem("pinned")}/>
          <Row left={<Icon name="trash" size={20} color={C.textMuted}/>} label="Recently Deleted" badge={trashCount}  onTap={()=>onOpenSystem("trash")}/>
          <Row left={<Icon name="settings" size={20} color={C.textMuted}/>} label="Settings" onTap={onOpenSettings} noBorder/>
        </Card>
      </div>

      {/* Bottom toolbar */}
      <div style={{
        position:"fixed",bottom:0,left:0,right:0,maxWidth:480,margin:"0 auto",
        background:"rgba(0,0,0,.88)",backdropFilter:"blur(20px)",
        borderTop:`1px solid ${C.divider}`,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"12px 28px 32px",
      }}>
        <button onClick={onNewFolder} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
          <Icon name="folder-new" size={26} color={C.accent}/>
        </button>
        <button onClick={onNewNote} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
          <Icon name="compose" size={26} color={C.accent}/>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Note List
// ═══════════════════════════════════════════════════════════════════════════
function NoteListScreen({ folder, allFolders, notes, onBack, onOpenNote, onNewNote, trashView, pinnedView }) {
  const [search,setSearch]=useState("");

  const visible = notes.filter(n=>{
    if(trashView)  return n.trashed;
    if(pinnedView) return !n.trashed&&n.pinned;
    if(!folder)    return !n.trashed;
    return !n.trashed&&n.folderId===folder.id;
  }).filter(n=>{
    if(!search) return true;
    const q=search.toLowerCase();
    return n.title.toLowerCase().includes(q)||n.body.toLowerCase().includes(q);
  }).sort((a,b)=>b.ts-a.ts);

  const groups=[];
  visible.forEach(n=>{
    const label=trashView?"Recently Deleted":groupLabel(n.ts);
    const last=groups[groups.length-1];
    if(last&&last.label===label) last.items.push(n);
    else groups.push({label,items:[n]});
  });

  const getFolderName = fid=>allFolders.find(f=>f.id===fid)?.name||"Notes";
  const title = trashView?"Recently Deleted":pinnedView?"Pinned":folder?.name||"All Notes";
  const fc = folder ? folderColor(folder) : null;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"52px 16px 0"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:17,display:"flex",alignItems:"center",gap:2,padding:0}}>
          <Icon name="back" size={20} color={C.accent}/>
          <span>Folders</span>
        </button>
        <Icon name="more" size={22} color={C.accent}/>
      </div>

      <div style={{padding:"6px 20px 12px"}}>
        <h1 style={{margin:"0 0 12px",fontSize:34,fontWeight:700,color:fc?folderColor(folder).dot:C.text,letterSpacing:-.5}}>{title}</h1>
        <div style={{background:C.surface2,borderRadius:10,display:"flex",alignItems:"center",gap:8,padding:"8px 12px"}}>
          <Icon name="search" size={16} color={C.textMuted}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search"
            style={{border:"none",background:"transparent",outline:"none",fontSize:17,color:C.text,flex:1,fontFamily:"-apple-system,sans-serif"}}/>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
        {groups.length===0&&(
          <div style={{textAlign:"center",paddingTop:80,color:C.textMuted,fontSize:16}}>No notes</div>
        )}
        {groups.map(g=>(
          <div key={g.label}>
            <p style={{fontSize:15,fontWeight:600,color:C.textMuted,margin:"16px 20px 6px"}}>{g.label}</p>
            <Card style={{marginInline:16}}>
              {g.items.map((n,i)=>(
                <NoteRow key={n.id} note={n}
                  folderName={getFolderName(n.folderId)}
                  showFolder={!folder||trashView||pinnedView}
                  noBorder={i===g.items.length-1}
                  onTap={()=>onOpenNote(n)}/>
              ))}
            </Card>
          </div>
        ))}
      </div>

      <div style={{
        position:"fixed",bottom:0,left:0,right:0,maxWidth:480,margin:"0 auto",
        background:"rgba(0,0,0,.88)",backdropFilter:"blur(20px)",
        borderTop:`1px solid ${C.divider}`,
        display:"flex",justifyContent:"center",alignItems:"center",
        padding:"10px 28px 32px",position:"fixed",
      }}>
        <span style={{fontSize:14,color:C.textMuted}}>{visible.length} Note{visible.length!==1?"s":""}</span>
        {!trashView&&(
          <button onClick={onNewNote} style={{position:"absolute",right:24,bottom:28,background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
            <Icon name="compose" size={26} color={C.accent}/>
          </button>
        )}
      </div>
    </div>
  );
}

function NoteRow({ note, folderName, showFolder, noBorder, onTap }) {
  const [pressed,setPressed]=useState(false);
  const hasCover=!!note.cover;
  return (
    <div onClick={onTap}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)}
      style={{
        display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
        borderBottom:noBorder?"none":`1px solid ${C.divider}`,
        background:pressed?"rgba(255,255,255,.04)":"transparent",
        cursor:"pointer",transition:"background .1s",
      }}>
      {hasCover&&(
        <div style={{
          width:44,height:44,borderRadius:8,flexShrink:0,
          background:coverBg(note.cover),
          boxShadow:"inset 0 0 0 1px rgba(255,255,255,.07)",
          overflow:"hidden",
        }}/>
      )}
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:17,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"-apple-system,sans-serif"}}>
          {note.title||"New Note"}
        </p>
        <p style={{margin:"2px 0 0",fontSize:15,color:C.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"-apple-system,sans-serif"}}>
          <span>{fmtTime(note.ts)}&nbsp;&nbsp;</span>
          <span style={{opacity:.7}}>{note.body.replace(/\n/g," ").slice(0,50)||"No additional text"}</span>
        </p>
        {showFolder&&(
          <p style={{margin:"3px 0 0",fontSize:13,color:C.textMuted,display:"flex",alignItems:"center",gap:4}}>
            <Icon name="folder" size={12} color={C.textMuted}/> {folderName}
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Settings
// ═══════════════════════════════════════════════════════════════════════════
function SettingsScreen({ onBack, sortBy, onSortBy }) {
  const [backupState, setBackupState] = useState("idle"); // idle | connecting | done | error
  const [lastBackup,  setLastBackup]  = useState(null);

  const handleBackup = () => {
    setBackupState("connecting");
    // Simulate OAuth + upload flow (real implementation needs Google OAuth + Drive API)
    setTimeout(()=>{
      setBackupState("done");
      setLastBackup(new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}));
      setTimeout(()=>setBackupState("idle"),3000);
    },2200);
  };

  const SortOption = ({ id, label, icon }) => (
    <Row
      left={<Icon name={icon} size={20} color={sortBy===id?C.accent:C.textMuted}/>}
      label={label}
      rightEl={sortBy===id ? <Icon name="check" size={18} color={C.accent}/> : null}
      onTap={()=>onSortBy(id)}
      noBorder={id==="color"}
    />
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

        {/* Google Drive Backup */}
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"0 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>Backup</p>
        <Card>
          <div style={{padding:"16px 16px 8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:"rgba(10,132,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon name="drive" size={20} color="#4A90D9"/>
              </div>
              <div>
                <p style={{margin:0,fontSize:17,color:C.text,fontWeight:500}}>Google Drive</p>
                <p style={{margin:0,fontSize:13,color:C.textMuted}}>
                  {lastBackup ? `Last backup today at ${lastBackup}` : "Never backed up"}
                </p>
              </div>
            </div>
            <button
              onClick={handleBackup}
              disabled={backupState==="connecting"}
              style={{
                width:"100%",padding:"12px",borderRadius:10,border:"none",cursor:"pointer",
                background: backupState==="done"   ? "rgba(50,215,75,.2)"  :
                            backupState==="error"  ? "rgba(255,67,58,.2)"  :
                            backupState==="connecting"?"rgba(255,255,255,.06)":"rgba(10,132,255,.18)",
                color:       backupState==="done"  ? C.green :
                             backupState==="error" ? C.danger :
                             backupState==="connecting"?C.textMuted:C.blue,
                fontSize:15,fontWeight:600,
                fontFamily:"-apple-system,sans-serif",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                transition:"all .2s",
              }}>
              <Icon name={backupState==="done"?"check":backupState==="connecting"?"clock":"backup"}
                size={18}
                color={backupState==="done"?C.green:backupState==="connecting"?C.textMuted:C.blue}/>
              {backupState==="connecting" ? "Connecting to Google Drive…" :
               backupState==="done"       ? "Backup complete" :
               backupState==="error"      ? "Backup failed — tap to retry" :
               "Back up to Google Drive"}
            </button>
            <p style={{margin:"10px 0 8px",fontSize:12,color:C.textMuted,lineHeight:1.5}}>
              All notes and folders will be exported as a JSON file to your Google Drive. A Google sign-in prompt will appear when you tap the button.
            </p>
          </div>
        </Card>

        {/* Sort metric */}
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"20px 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>Sort Folders By</p>
        <Card>
          <SortOption id="manual" label="Manual Order"     icon="sort"   />
          <SortOption id="name"   label="Name (A → Z)"     icon="az"     />
          <SortOption id="count"  label="Note Count"        icon="allnotes"/>
          <SortOption id="color"  label="Colour Theme"      icon="palette"/>
        </Card>

        {/* About */}
        <p style={{fontSize:13,fontWeight:600,color:C.textMuted,margin:"20px 4px 6px",letterSpacing:.3,textTransform:"uppercase"}}>About</p>
        <Card>
          <Row label="Version"   rightEl={<span style={{color:C.textMuted,fontSize:15}}>1.0.0</span>} noBorder/>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN — Editor
// ═══════════════════════════════════════════════════════════════════════════
function EditorScreen({ note, allFolders, onSave, onBack }) {
  const [title,setTitle]=useState(note.title);
  const [body,setBody]=useState(note.body);
  const [cover,setCover]=useState(note.cover);
  const [showCoverPicker,setShowCoverPicker]=useState(false);
  const [showVideo,setShowVideo]=useState(false);
  const bodyRef=useRef();

  useEffect(()=>{ if(!showCoverPicker) setTimeout(()=>bodyRef.current?.focus(),80); },[showCoverPicker]);

  const save=()=>onSave({...note,title,body,cover,ts:Date.now()});
  const done=()=>{save();onBack();};

  const edBg=cover?.type==="palette"?cover.bg:"#000000";
  const edAccent=coverAccent(cover);
  const hasMedia=cover?.type==="image"||cover?.type==="youtube";

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:edBg,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:480,margin:"0 auto"}}>
      {/* Nav */}
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"52px 16px 10px",
        background:hasMedia?"rgba(0,0,0,.65)":edBg,
        backdropFilter:hasMedia?"blur(16px)":"none",gap:12,
      }}>
        <button onClick={done} style={{background:"none",border:"none",cursor:"pointer",color:edAccent,fontSize:17,display:"flex",alignItems:"center",gap:2,padding:0}}>
          <Icon name="back" size={20} color={edAccent}/> Folders
        </button>
        <div style={{display:"flex",alignItems:"center",gap:18}}>
          <button onClick={()=>setShowCoverPicker(s=>!s)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
            <Icon name="palette" size={20} color={edAccent}/>
          </button>
          {cover?.type==="youtube"&&(
            <button onClick={()=>setShowVideo(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
              <Icon name="youtube" size={20} color={showVideo?"#FF3B30":"#FF0000"}/>
            </button>
          )}
          <button style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}>
            <Icon name="share" size={20} color={edAccent}/>
          </button>
          <Icon name="more" size={22} color={edAccent}/>
          <button onClick={done} style={{background:"none",border:"none",cursor:"pointer",color:edAccent,fontSize:17,padding:0}}>Done</button>
        </div>
      </div>

      {/* Cover picker */}
      {showCoverPicker&&(
        <div style={{
          overflowY:"auto",maxHeight:"52vh",
          background:hasMedia?"rgba(0,0,0,.82)":edBg,
          backdropFilter:hasMedia?"blur(16px)":"none",
          padding:"0 20px 16px",borderBottom:`1px solid rgba(255,255,255,.08)`,
        }}>
          <CoverPickerPanel current={cover} onChange={c=>{setCover(c);setShowVideo(false);}}/>
        </div>
      )}

      {/* Cover strip */}
      {cover&&!showCoverPicker&&(
        <div style={{padding:"10px 20px 0",flexShrink:0}}>
          <div style={{height:110,borderRadius:14,overflow:"hidden",position:"relative",background:coverBg(cover)}}>
            {cover.type==="youtube"&&showVideo&&(
              <iframe src={`https://www.youtube.com/embed/${cover.videoId}?autoplay=1&rel=0`}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}}
                allow="autoplay;encrypted-media" allowFullScreen title="cover"/>
            )}
            {!showVideo&&hasMedia&&<div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.1),rgba(0,0,0,.5))"}}/>}
            {!showVideo&&<span style={{position:"absolute",bottom:10,left:14,fontFamily:"Georgia,serif",fontWeight:700,fontSize:16,color:edAccent,textShadow:hasMedia?"0 1px 6px rgba(0,0,0,.9)":"none"}}>{title||"Untitled"}</span>}
            {cover.type==="youtube"&&!showVideo&&(
              <div style={{position:"absolute",top:8,right:10,background:"rgba(255,0,0,.85)",borderRadius:4,fontSize:9,fontWeight:700,color:"#fff",padding:"2px 5px"}}>▶ YT</div>
            )}
          </div>
        </div>
      )}

      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"
        style={{border:"none",outline:"none",background:"transparent",fontSize:28,fontWeight:700,color:edAccent,padding:cover?"8px 20px 2px":"16px 20px 2px",fontFamily:"Georgia,serif",textShadow:hasMedia?"0 1px 8px rgba(0,0,0,.9)":"none"}}/>

      <textarea ref={bodyRef} value={body} onChange={e=>setBody(e.target.value)} placeholder="Start writing…"
        style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:17,lineHeight:1.75,color:hasMedia?"rgba(255,255,255,.88)":cover?.type==="palette"?`${cover.accent}bb`:"rgba(235,235,245,.8)",padding:"4px 20px 40px",resize:"none",fontFamily:"-apple-system,sans-serif",textShadow:hasMedia?"0 1px 4px rgba(0,0,0,.8)":"none"}}/>
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

// ─── New Folder Modal ─────────────────────────────────────────────────────
function NewFolderModal({ onClose, onCreate }) {
  const [name,setName]=useState("");
  const [colorId,setColorId]=useState("gold");

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.78)",backdropFilter:"blur(10px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#1C1C1E",borderRadius:"20px 20px 0 0",padding:"20px 20px 44px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,.8)"}}>
        <div style={{width:36,height:4,background:C.surface2,borderRadius:2,margin:"0 auto 20px"}}/>
        <h3 style={{margin:"0 0 16px",fontSize:18,fontWeight:700,color:C.text,fontFamily:"-apple-system,sans-serif"}}>New Folder</h3>

        {/* Colour picker */}
        <p style={{margin:"0 0 8px",fontSize:13,color:C.textMuted,fontFamily:"-apple-system,sans-serif"}}>Colour</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
          {FOLDER_COLORS.map(fc=>(
            <button key={fc.id} onClick={()=>setColorId(fc.id)} style={{
              width:32,height:32,borderRadius:"50%",border:"none",cursor:"pointer",
              background:fc.dot,
              boxShadow:colorId===fc.id?`0 0 0 2px #000, 0 0 0 4px ${fc.dot}`:"none",
              transition:"box-shadow .15s",
            }}/>
          ))}
        </div>

        {/* Preview */}
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
          <button onClick={()=>{if(name.trim())onCreate({id:uid(),name:name.trim(),colorId});onClose();}}
            style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:C.accent,cursor:"pointer",fontSize:17,fontWeight:700,color:"#000",fontFamily:"-apple-system,sans-serif"}}>Create</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [folders,setFolders]=useState(INIT_FOLDERS);
  const [notes,setNotes]=useState(INIT_NOTES);
  const [stack,setStack]=useState([{screen:"folders"}]);
  const [showNewFolder,setShowNewFolder]=useState(false);
  const [sortBy,setSortBy]=useState("manual");

  const top=stack[stack.length-1];
  const push=f=>setStack(s=>[...s,f]);
  const pop=()=>setStack(s=>s.length>1?s.slice(0,-1):s);

  const saveNote=u=>setNotes(p=>p.map(n=>n.id===u.id?u:n));

  const createNote=folderId=>{
    const n={id:uid(),folderId,title:"",body:"",cover:null,starred:false,trashed:false,ts:Date.now(),pinned:false};
    setNotes(p=>[n,...p]);
    push({screen:"editor",note:n});
  };

  const handleNewNoteFromList=()=>{
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
          onOpenSettings={()=>push({screen:"settings"})}/>
      )}
      {top.screen==="list"&&(
        <NoteListScreen folder={top.folder||null} allFolders={folders} notes={notes}
          trashView={top.sysFolder==="trash"} pinnedView={top.sysFolder==="pinned"}
          onBack={pop} onOpenNote={n=>push({screen:"editor",note:n})}
          onNewNote={handleNewNoteFromList}/>
      )}
      {top.screen==="editor"&&(
        <EditorScreen note={top.note} allFolders={folders} onSave={saveNote} onBack={pop}/>
      )}
      {top.screen==="settings"&&(
        <SettingsScreen onBack={pop} sortBy={sortBy} onSortBy={id=>{setSortBy(id);}}/>
      )}
      {showNewFolder&&(
        <NewFolderModal onClose={()=>setShowNewFolder(false)}
          onCreate={f=>{setFolders(p=>[...p,f]);setShowNewFolder(false);}}/>
      )}
    </div>
  );
}
