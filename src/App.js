import React, { useEffect, useMemo, useState } from "react";

// --- Simple in-memory store with localStorage persistence ---
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; }
};

// --- Small UI helpers ---
const Section = ({ title, children, actions }) => (
  <div className="w-full max-w-3xl mx-auto p-4"> 
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div>{actions}</div>
    </div>
    <div className="mt-3 bg-white rounded-2xl shadow p-4">{children}</div>
  </div>
);

const Pill = ({ children, active=false, onClick }) => (
  <button onClick={onClick} className={`px-3 py-1 rounded-full text-sm border transition ${active?"bg-black text-white border-black":"bg-white hover:bg-neutral-100 border-neutral-200"}`}>{children}</button>
);

const PrimaryBtn = (props) => (
  <button {...props} className={`px-4 py-2 rounded-xl shadow font-medium transition ${props.className||""} bg-black text-white hover:opacity-90 disabled:opacity-40`} />
);

// --- Screens ---
function Onboarding({ onDone }){
  const [nick, setNick] = useState( load("nick", "") );
  const [consent, setConsent] = useState( load("consent", false) );
  const canContinue = nick.trim().length>=2 && consent;
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome 👋</h1>
        <p className="text-neutral-600 mb-4">This prototype offers a <b>safe, anonymous</b> space for youth to track mood, chat with peers, and build resilience. No real data is sent to a server.</p>
        <label className="block text-sm font-medium">Pick an anonymous nickname</label>
        <input value={nick} onChange={e=>setNick(e.target.value)} placeholder="e.g., StarFox" className="mt-1 w-full border rounded-xl p-2"/>
        <label className="flex items-start gap-2 mt-4 text-sm">
          <input type="checkbox" checked={!!consent} onChange={e=>setConsent(e.target.checked)} />
          <span>I understand this is a <b>non-clinical</b> prototype and agree to community guidelines (be kind, no harm, seek professional help in emergencies).</span>
        </label>
        <PrimaryBtn disabled={!canContinue} onClick={()=>{ save("nick", nick); save("consent", true); onDone(); }} className="mt-5 w-full">Start</PrimaryBtn>
      </div>
      <p className="text-xs text-neutral-400 mt-4">If you are in danger or thinking about self-harm, contact local emergency services immediately.</p>
    </div>
  );
}

function MoodCheckin(){
  const [entries, setEntries] = useState(load("moodEntries", []));
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const add = () => {
    const next = [...entries, { id: Date.now(), date: new Date().toISOString(), mood, note }];
    setEntries(next); save("moodEntries", next); setNote("");
  };
  const avg = useMemo(()=> entries.length? (entries.reduce((a,b)=>a+b.mood,0)/entries.length).toFixed(1):"-");
  return (
    <Section title="Mood check-in">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map(v=> (
            <Pill key={v} active={mood===v} onClick={()=>setMood(v)}>{["😟","😕","😐","🙂","😄"][v-1]} {v}</Pill>
          ))}
        </div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a short note (optional)…" className="w-full border rounded-xl p-3" />
        <PrimaryBtn onClick={add}>Save check-in</PrimaryBtn>
        <div className="mt-2 text-sm text-neutral-600">Average mood: <b>{avg}</b> over {entries.length} check-ins.</div>
        <div className="mt-4">
          <h3 className="font-medium mb-2">History</h3>
          <div className="grid gap-2">
            {entries.slice().reverse().map(e=> (
              <div key={e.id} className="flex items-center justify-between border rounded-xl p-2">
                <div className="flex items-center gap-3"><span className="text-xl">{["😟","😕","😐","🙂","😄"][e.mood-1]}</span><span className="text-sm text-neutral-500">{new Date(e.date).toLocaleString()}</span></div>
                <div className="text-sm max-w-[60%] truncate">{e.note}</div>
              </div>
            ))}
            {!entries.length && <div className="text-sm text-neutral-400">No entries yet. Try a first check‑in above.</div>}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Chat(){
  const nick = load("nick","Guest");
  const [room, setRoom] = useState(load("chatRoom","general"));
  const [text, setText] = useState("");
  const [messages, setMessages] = useState(load("messages", [
    {room:"general", author:"Guide", msg:"Welcome! Be kind. If you feel unsafe, reach out to a professional."},
    {room:"study", author:"Luna", msg:"Exams stressing me out—any tips?"},
  ]));
  const rooms = [
    { id:"general", label:"General" },
    { id:"study", label:"Study stress" },
    { id:"social", label:"Friends & family" },
    { id:"sleep", label:"Sleep & habits" },
  ];
  const send = () => {
    if(!text.trim()) return;
    const next = [...messages, { room, author:nick, msg:text.trim() }];
    setMessages(next); save("messages", next); setText("");
  };
  useEffect(()=> save("chatRoom", room), [room]);
  return (
    <Section title="Anonymous peer chat" actions={<div className="flex gap-2">{rooms.map(r=> <Pill key={r.id} active={r.id===room} onClick={()=>setRoom(r.id)}>{r.label}</Pill>)}</div>}>
      <div className="h-80 overflow-auto border rounded-2xl p-3 bg-neutral-50">
        {messages.filter(m=>m.room===room).map((m,i)=> (
          <div key={i} className={`my-2 flex ${m.author===nick?"justify-end":"justify-start"}`}>
            <div className={`px-3 py-2 rounded-2xl max-w-[70%] ${m.author===nick?"bg-black text-white":"bg-white border"}`}>
              <div className="text-xs opacity-70 mb-1">{m.author===nick?"You":m.author}</div>
              <div className="text-sm leading-snug">{m.msg}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a supportive message…" className="flex-1 border rounded-xl p-2"/>
        <PrimaryBtn onClick={send}>Send</PrimaryBtn>
      </div>
      <p className="text-xs text-neutral-500 mt-3">Safety note: This is a peer space, not therapy. If you or someone is at risk, contact emergency services.</p>
    </Section>
  );
}

function Challenges(){
  const starter = [
    { id:1, title:"5‑minute breathing", desc:"Follow your breath for 5 minutes.", done:false },
    { id:2, title:"Gratitude note", desc:"Write 3 things you’re grateful for.", done:false },
    { id:3, title:"Reach out", desc:"Send a supportive text to a friend.", done:false },
  ];
  const [list, setList] = useState(load("challenges", starter));
  useEffect(()=> save("challenges", list), [list]);
  const toggle = (id) => setList(list.map(i=> i.id===id? {...i, done: !i.done}: i));
  return (
    <Section title="Resilience challenges">
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map(i=> (
          <div key={i.id} className={`p-4 rounded-2xl border shadow-sm ${i.done?"bg-green-50 border-green-200":"bg-white"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold">{i.title}</h4>
                <p className="text-sm text-neutral-600">{i.desc}</p>
              </div>
              <button onClick={()=>toggle(i.id)} className={`px-3 py-1 rounded-full text-sm ${i.done?"bg-green-600 text-white":"bg-neutral-900 text-white"}`}>{i.done?"Done":"Mark done"}</button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Resources(){
  const items = [
    { title:"When to seek professional help", desc:"Signs that it’s time to talk to a professional.", link:"#" },
    { title:"Sleep toolkit", desc:"Simple habits to improve sleep quality.", link:"#" },
    { title:"Study stress quick tips", desc:"Planning and breaks that actually work.", link:"#" },
  ];
  return (
    <Section title="Resources">
      <div className="space-y-3">
        {items.map((it,i)=> (
          <a key={i} href={it.link} className="block border rounded-2xl p-4 hover:bg-neutral-50">
            <div className="font-medium">{it.title}</div>
            <div className="text-sm text-neutral-600">{it.desc}</div>
          </a>
        ))}
        <div className="text-xs text-neutral-500">Note: Links are placeholders in this prototype.</div>
      </div>
    </Section>
  );
}

function Nav({ tab, setTab }){
  const tabs = [
    { id:"mood", label:"Mood" },
    { id:"chat", label:"Chat" },
    { id:"challenges", label:"Challenges" },
    { id:"resources", label:"Resources" },
  ];
  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center">
      <div className="bg-white/90 backdrop-blur border rounded-2xl shadow px-2 py-1 flex gap-1">
        {tabs.map(t=> (
          <Pill key={t.id} active={t.id===tab} onClick={()=>setTab(t.id)}>{t.label}</Pill>
        ))}
      </div>
    </div>
  );
}

export default function App(){
  const [ready, setReady] = useState(!!load("consent", false));
  const [tab, setTab] = useState("mood");
  if(!ready) return <Onboarding onDone={()=>setReady(true)} />;
  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <header className="w-full bg-white/80 backdrop-blur sticky top-0 border-b">
        <div className="max-w-3xl mx-auto p-4 flex items-center justify-between">
          <div className="font-bold">Youth Well‑Being (Prototype)</div>
          <div className="text-sm text-neutral-600">Hi, {load("nick","Guest")} 👋</div>
        </div>
      </header>

      {tab==="mood" && <MoodCheckin/>}
      {tab==="chat" && <Chat/>}
      {tab==="challenges" && <Challenges/>}
      {tab==="resources" && <Resources/>}

      <Nav tab={tab} setTab={setTab} />
    </div>
  );
}

