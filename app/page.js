"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

const ROLES = ["Founder", "Product Manager", "Engineer", "Designer", "Marketing & Growth", "Investor", "Student", "Other"];
const LOOKING = ["Co-founder", "Hiring", "Job opportunities", "Investors / funding", "Customers / feedback", "Mentorship", "Just learning & meeting people"];

/* ————— matching logic ————— */
function keywords(text) {
  return (text || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
}

function scoreMatch(me, other) {
  let score = 0;
  const reasons = [];
  const myLook = me.looking || [];
  const theirLook = other.looking || [];

  if (myLook.includes("Co-founder")) {
    if (other.role === "Founder" || theirLook.includes("Co-founder")) {
      score += 5;
      reasons.push(`${other.name.split(" ")[0]} is ${other.role === "Founder" ? "a founder" : "also looking for a co-founder"}`);
    }
    if (me.role !== "Engineer" && other.role === "Engineer") { score += 2; reasons.push("complementary skills — they're technical"); }
    if (me.role === "Engineer" && ["Founder", "Product Manager", "Marketing & Growth"].includes(other.role)) { score += 2; reasons.push("complementary skills — they're on the business side"); }
  }
  if (myLook.includes("Hiring") && theirLook.includes("Job opportunities")) { score += 5; reasons.push(`they're open to opportunities (${other.role})`); }
  if (myLook.includes("Job opportunities") && theirLook.includes("Hiring")) { score += 5; reasons.push("they're hiring right now"); }
  if (myLook.includes("Investors / funding")) {
    if (other.role === "Investor") { score += 5; reasons.push("they're an investor"); }
    else if (other.role === "Founder") { score += 2; reasons.push("fellow founder — likely knows investors"); }
  }
  if (myLook.includes("Customers / feedback") && other.role !== me.role) score += 1;
  if (myLook.includes("Mentorship") && other.role === me.role) { score += 2; reasons.push(`same field (${other.role}) — good mentor fit`); }

  const overlap = keywords(me.offer).filter((w) => keywords(other.offer).includes(w));
  if (overlap.length) { score += overlap.length * 2; reasons.push(`you both mentioned “${overlap[0]}”`); }
  if (theirLook.includes("Just learning & meeting people")) score += 0.5;
  return { score, reason: reasons[0] || `worth meeting — ${(other.role || "guest").toLowerCase()} in the room` };
}

function topMatches(me, all) {
  return all
    .filter((a) => a.id !== me.id)
    .map((a) => ({ person: a, ...scoreMatch(me, a) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
}

/* ————— UI bits ————— */
function Sticker({ a, highlight, flag, onClick, selected }) {
  return (
    <div onClick={onClick} style={{
      background: "#FFFDF6", borderRadius: 10, overflow: "hidden",
      boxShadow: selected ? "0 0 0 3px #FFD23F, 0 6px 16px rgba(0,0,0,.35)" : "0 4px 12px rgba(0,0,0,.3)",
      transform: `rotate(${(a.id.charCodeAt(0) % 3) - 1}deg)`,
      cursor: onClick ? "pointer" : "default",
      position: "relative",
    }}>
      <div style={{ background: "#D62839", padding: "7px 12px 5px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "'Archivo Black'", color: "#FFFDF6", fontSize: 10, letterSpacing: 1.5 }}>HELLO I'M</span>
        <span style={{ fontFamily: "'Space Grotesk'", color: "rgba(255,253,246,.85)", fontSize: 10, fontWeight: 700 }}>{(a.role || "").toUpperCase()}</span>
      </div>
      {flag && (
        <div style={{ position: "absolute", top: 34, right: -4, background: "#FFD23F", color: "#1A1A2B", fontFamily: "'Archivo Black'", fontSize: 9, letterSpacing: 1, padding: "4px 8px", borderRadius: "4px 0 0 4px", boxShadow: "0 2px 6px rgba(0,0,0,.25)" }}>
          TALK TO
        </div>
      )}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 28, lineHeight: 1, color: "#1A1A2B", fontWeight: 600 }}>{a.name}</div>
        {a.offer && <div style={{ fontFamily: "'Space Grotesk'", fontSize: 13, color: "#3A3A4E", marginTop: 6, lineHeight: 1.35 }}>{a.offer}</div>}
        {(a.looking || []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {a.looking.map((l) => (
              <span key={l} style={{ fontFamily: "'Space Grotesk'", fontSize: 10.5, fontWeight: 700, color: "#D62839", border: "1.5px solid #D62839", borderRadius: 999, padding: "2px 8px" }}>
                {l === "Just learning & meeting people" ? "here to learn" : l.toLowerCase()}
              </span>
            ))}
          </div>
        )}
        {highlight && <div style={{ fontFamily: "'Space Grotesk'", fontSize: 12.5, marginTop: 8, background: "#FFF3C4", padding: "6px 8px", borderRadius: 6, color: "#1A1A2B" }}>→ {highlight}</div>}
        {a.linkedin && (
          <a href={a.linkedin.startsWith("http") ? a.linkedin : "https://" + a.linkedin} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ display: "inline-block", marginTop: 8, fontFamily: "'Space Grotesk'", fontSize: 12, fontWeight: 700, color: "#0A66C2", textDecoration: "none" }}>
            in/ LinkedIn ↗
          </a>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#FFFDF6", border: "none", borderRadius: 8,
  padding: "12px 12px", fontFamily: "'Space Grotesk'", fontSize: 15, color: "#1A1A2B", outline: "none",
};
const labelStyle = { fontFamily: "'Space Grotesk'", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#8B93B8", display: "block", marginBottom: 6, marginTop: 16 };

/* ————— main app ————— */
export default function App() {
  const [tab, setTab] = useState("checkin");
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("All");
  const [myId, setMyId] = useState(null);

  const [name, setName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [role, setRole] = useState("");
  const [looking, setLooking] = useState([]);
  const [offer, setOffer] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Event slug from URL: yourapp.vercel.app/?event=producttank-jul
  const event = useMemo(() => {
    if (typeof window === "undefined") return "demo";
    return new URLSearchParams(window.location.search).get("event") || "demo";
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendees?event=${encodeURIComponent(event)}`);
      const data = await res.json();
      setAttendees(data.attendees || []);
    } catch (e) { /* keep last known list */ }
    setLoading(false);
  }, [event]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 12000); // live room: poll every 12s
    return () => clearInterval(t);
  }, [refresh]);

  // remember who I am across reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`room-me-${event}`);
      if (saved) setMyId(saved);
    } catch (e) {}
  }, [event]);

  const rememberMe = (id) => {
    setMyId(id);
    try {
      if (id) localStorage.setItem(`room-me-${event}`, id);
      else localStorage.removeItem(`room-me-${event}`);
    } catch (e) {}
  };

  const toggleLooking = (l) => {
    setLooking((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : prev.length < 2 ? [...prev, l] : prev);
  };

  const checkIn = async () => {
    setErr("");
    if (!name.trim()) return setErr("Add your name — it goes on your badge.");
    if (!role) return setErr("Pick your role so people can filter for you.");
    setSaving(true);
    try {
      const res = await fetch("/api/attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, record: { name: name.trim(), linkedin: linkedin.trim(), role, looking, offer: offer.trim() } }),
      });
      const data = await res.json();
      if (data.record) {
        rememberMe(data.record.id);
        setAttendees((prev) => [...prev, data.record]);
        setTab("room");
      } else {
        setErr(data.error || "Couldn't save your check-in. Try again.");
      }
    } catch (e) {
      setErr("Couldn't save your check-in. Check your connection and try again.");
    }
    setSaving(false);
  };

  const removeMe = async () => {
    if (!myId) return;
    try {
      await fetch(`/api/attendees?event=${encodeURIComponent(event)}&id=${encodeURIComponent(myId)}`, { method: "DELETE" });
      setAttendees((prev) => prev.filter((a) => a.id !== myId));
      rememberMe(null);
    } catch (e) {}
  };

  const me = attendees.find((a) => a.id === myId);
  const roleCounts = attendees.reduce((m, a) => { m[a.role] = (m[a.role] || 0) + 1; return m; }, {});
  const visible = roleFilter === "All" ? attendees : attendees.filter((a) => a.role === roleFilter);
  const matches = me ? topMatches(me, attendees) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#1C2440", paddingBottom: 60, maxWidth: 520, margin: "0 auto" }}>
      {/* header */}
      <div style={{ padding: "26px 18px 14px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Archivo Black'", color: "#FFFDF6", fontSize: 26, lineHeight: 1.05, letterSpacing: -0.5 }}>
          WHO'S IN<br />THE ROOM<span style={{ color: "#FFD23F" }}>?</span>
        </div>
        <div style={{ fontFamily: "'Space Grotesk'", color: "#8B93B8", fontSize: 13, marginTop: 8 }}>
          {attendees.length === 0 ? "Check in to open the room" : `${attendees.length} ${attendees.length === 1 ? "person has" : "people have"} checked in`}
          {event !== "demo" && <span> · {event}</span>}
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 18px", marginBottom: 16 }}>
        {[["checkin", "Check in"], ["room", `Room (${attendees.length})`], ["matches", "My 3 people"]].map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); if (k !== "checkin") refresh(); }} style={{
            flex: 1, padding: "10px 4px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13,
            background: tab === k ? "#FFD23F" : "rgba(255,253,246,.08)",
            color: tab === k ? "#1A1A2B" : "#C9CEE4",
          }}>{label}</button>
        ))}
      </div>

      {/* CHECK IN */}
      {tab === "checkin" && (
        <div style={{ padding: "0 18px" }}>
          {myId && me ? (
            <div style={{ background: "rgba(255,253,246,.06)", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontFamily: "'Archivo Black'", color: "#FFD23F", fontSize: 16 }}>YOU'RE ON THE BOARD ✓</div>
              <div style={{ fontFamily: "'Space Grotesk'", color: "#C9CEE4", fontSize: 14, marginTop: 8 }}>
                Head to the Room tab to see everyone, or “My 3 people” for who to talk to first.
              </div>
              <button onClick={removeMe} style={{ marginTop: 14, background: "none", border: "1.5px solid #8B93B8", color: "#8B93B8", borderRadius: 8, padding: "8px 14px", fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Remove my check-in
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: "'Space Grotesk'", color: "#C9CEE4", fontSize: 13, lineHeight: 1.4, background: "rgba(255,210,63,.1)", border: "1px solid rgba(255,210,63,.35)", borderRadius: 8, padding: "10px 12px" }}>
                Your badge is visible to everyone at this event — share only what you're happy for the room to see.
              </div>

              <label style={labelStyle}>NAME *</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Chen" />

              <label style={labelStyle}>LINKEDIN URL</label>
              <input style={inputStyle} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourname" />
              <div style={{ fontFamily: "'Space Grotesk'", fontSize: 11.5, color: "#8B93B8", marginTop: 5 }}>
                LinkedIn app → your photo → ⋯ → Share profile → Copy link
              </div>

              <label style={labelStyle}>YOUR ROLE *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ROLES.map((r) => (
                  <button key={r} onClick={() => setRole(r)} style={{
                    padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600,
                    border: role === r ? "2px solid #FFD23F" : "1.5px solid rgba(255,253,246,.25)",
                    background: role === r ? "#FFD23F" : "transparent",
                    color: role === r ? "#1A1A2B" : "#C9CEE4",
                  }}>{r}</button>
                ))}
              </div>

              <label style={labelStyle}>LOOKING FOR TONIGHT (PICK UP TO 2)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {LOOKING.map((l) => (
                  <button key={l} onClick={() => toggleLooking(l)} style={{
                    padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600,
                    border: looking.includes(l) ? "2px solid #D62839" : "1.5px solid rgba(255,253,246,.25)",
                    background: looking.includes(l) ? "#D62839" : "transparent",
                    color: looking.includes(l) ? "#FFFDF6" : "#C9CEE4",
                  }}>{l}</button>
                ))}
              </div>

              <label style={labelStyle}>WHAT CAN YOU OFFER OR TALK ABOUT?</label>
              <input style={inputStyle} value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="e.g. 10 yrs fintech PM · raising pre-seed · hiring 2 engineers" />

              {err && <div style={{ fontFamily: "'Space Grotesk'", color: "#FF8A8A", fontSize: 13, marginTop: 12, fontWeight: 600 }}>{err}</div>}

              <button onClick={checkIn} disabled={saving} style={{
                width: "100%", marginTop: 20, padding: "15px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "#FFD23F", color: "#1A1A2B", fontFamily: "'Archivo Black'", fontSize: 15, letterSpacing: 1,
                opacity: saving ? 0.6 : 1,
              }}>{saving ? "PINNING YOUR BADGE…" : "CHECK ME IN →"}</button>
            </div>
          )}
        </div>
      )}

      {/* ROOM */}
      {tab === "room" && (
        <div style={{ padding: "0 18px" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, WebkitOverflowScrolling: "touch" }}>
            {["All", ...ROLES.filter((r) => roleCounts[r])].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                whiteSpace: "nowrap", padding: "7px 12px", borderRadius: 999, cursor: "pointer",
                fontFamily: "'Space Grotesk'", fontSize: 12.5, fontWeight: 700, border: "none",
                background: roleFilter === r ? "#FFD23F" : "rgba(255,253,246,.1)",
                color: roleFilter === r ? "#1A1A2B" : "#C9CEE4",
              }}>{r}{r !== "All" ? ` · ${roleCounts[r]}` : ""}</button>
            ))}
          </div>

          {loading && attendees.length === 0 && (
            <div style={{ fontFamily: "'Space Grotesk'", color: "#8B93B8", textAlign: "center", padding: 40 }}>Opening the room…</div>
          )}
          {!loading && attendees.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontFamily: "'Archivo Black'", color: "#FFFDF6", fontSize: 18 }}>THE ROOM IS EMPTY</div>
              <div style={{ fontFamily: "'Space Grotesk'", color: "#8B93B8", fontSize: 14, marginTop: 8 }}>Be the first badge on the board — check in.</div>
            </div>
          )}

          <div style={{ display: "grid", gap: 14, marginTop: 6 }}>
            {[...visible].sort((a, b) => b.t - a.t).map((a) => (
              <Sticker key={a.id} a={a} selected={a.id === myId} />
            ))}
          </div>

          <button onClick={refresh} style={{ width: "100%", marginTop: 18, padding: 12, borderRadius: 8, border: "1.5px solid rgba(255,253,246,.25)", background: "transparent", color: "#C9CEE4", fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ↻ Refresh — see who just walked in
          </button>
        </div>
      )}

      {/* MATCHES */}
      {tab === "matches" && (
        <div style={{ padding: "0 18px" }}>
          {!me && (
            <div>
              <div style={{ fontFamily: "'Space Grotesk'", color: "#C9CEE4", fontSize: 14, lineHeight: 1.45, marginBottom: 14 }}>
                {attendees.length === 0 ? "Nobody has checked in yet — once you check in and others join, your 3 suggested people appear here." : "Which badge is yours? Tap it and we'll pick your 3 people."}
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {attendees.map((a) => (
                  <Sticker key={a.id} a={a} onClick={() => rememberMe(a.id)} />
                ))}
              </div>
            </div>
          )}
          {me && (
            <div>
              <div style={{ fontFamily: "'Archivo Black'", color: "#FFFDF6", fontSize: 15, letterSpacing: 0.5, marginBottom: 4 }}>
                {me.name.split(" ")[0].toUpperCase()}, TALK TO THESE {Math.min(3, matches.length)} PEOPLE
              </div>
              <div style={{ fontFamily: "'Space Grotesk'", color: "#8B93B8", fontSize: 12.5, marginBottom: 16 }}>
                Ranked for what you said you're looking for{(me.looking || []).length ? `: ${me.looking.join(" + ").toLowerCase()}` : ""}.
                <button onClick={() => rememberMe(null)} style={{ background: "none", border: "none", color: "#FFD23F", fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0, marginLeft: 6 }}>Not you?</button>
              </div>
              {matches.length === 0 && (
                <div style={{ fontFamily: "'Space Grotesk'", color: "#8B93B8", textAlign: "center", padding: 30 }}>
                  You're the only one here so far — refresh once more people check in.
                </div>
              )}
              <div style={{ display: "grid", gap: 14 }}>
                {matches.map((m) => (
                  <Sticker key={m.person.id} a={m.person} flag highlight={m.reason} />
                ))}
              </div>
              {matches.length > 0 && (
                <div style={{ fontFamily: "'Caveat', cursive", color: "#FFD23F", fontSize: 22, textAlign: "center", marginTop: 22 }}>
                  Now go say hi — you have 90 minutes.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
