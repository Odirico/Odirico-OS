import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  primary: "#FF6044",
  primaryLight: "#FFF4F2",
  green: "#22A06B",
  greenLight: "#F0FBF6",
  red: "#D92D20",
  redLight: "#FEF3F2",
  orange: "#D97706",
  orangeLight: "#FFFBEB",
  navy: "#0F172A",
  navyMid: "#1E293B",
  navyLight: "#334155",
  slate: "#64748B",
  slateLight: "#94A3B8",
  border: "#E2E8F0",
  bg: "#F7F8FA",
  white: "#FFFFFF",
  text: "#0F172A",
  textSub: "#64748B",
  card: "#FFFFFF",
};

/* ─────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────── */
const Badge = ({ children, color = T.primary, bg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "2px 9px", borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    color, background: bg || color + "18",
  }}>{children}</span>
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: T.card, borderRadius: 14,
    border: `1px solid ${T.border}`,
    boxShadow: "0 1px 8px rgba(15,23,42,0.06)",
    padding: 18, ...style,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.18s",
  }}>{children}</div>
);

const Avatar = ({ name, size = 34, bg = "linear-gradient(135deg,#FF6044,#FF9E44)" }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, color: "#fff", fontSize: size * 0.38, flexShrink: 0,
  }}>{name[0].toUpperCase()}</div>
);

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const TICKETS = [
  { id: "P-1021", client: "Oncor", designer: "Mike", qa: "Sarah", status: "Issues Found", priority: "HIGH", issues: 3, daysInQA: 1.8, pole: "DP-001A", lastActivity: "1:30 PM" },
  { id: "P-1022", client: "AEP", designer: "Jake", qa: "Tom", status: "In QA", priority: "MED", issues: 0, daysInQA: 0.5, pole: "SP-034C", lastActivity: "2:15 PM" },
  { id: "P-1023", client: "Xcel", designer: "Lena", qa: "Sarah", status: "Approved", priority: "LOW", issues: 0, daysInQA: 2.1, pole: "TP-012B", lastActivity: "Yesterday" },
  { id: "P-1024", client: "Duke", designer: "Mike", qa: "Tom", status: "Rework", priority: "HIGH", issues: 5, daysInQA: 3.2, pole: "DP-087A", lastActivity: "11:45 AM" },
  { id: "P-1025", client: "PG&E", designer: "Aria", qa: "Sarah", status: "Submitted", priority: "MED", issues: 0, daysInQA: 0.1, pole: "SP-091D", lastActivity: "10:02 AM" },
  { id: "P-1026", client: "Oncor", designer: "Jake", qa: "Tom", status: "In QA", priority: "LOW", issues: 1, daysInQA: 0.8, pole: "TP-044A", lastActivity: "9:30 AM" },
];

const KANBAN_COLS = ["Submitted", "In QA", "Issues Found", "Rework", "Approved", "Rejected"];

const STATUS_COLOR = {
  "Submitted": T.slate,
  "In QA": "#2563EB",
  "Issues Found": T.red,
  "Rework": T.orange,
  "Approved": T.green,
  "Rejected": T.red,
};

const STEPS = ["Submitted", "In QA", "Issues Found", "Rework", "Approved"];
const STATUS_PROGRESS = { Rejected: "Issues Found" };
const STORAGE_KEY = "poleqa-prototype-state-v2";

const INITIAL_ISSUES = [
  { id: 1, title: "Missing guy wire", severity: "HIGH", category: "Material", assigned: "Mike", status: "Open" },
  { id: 2, title: "Clearance violation", severity: "HIGH", category: "Structural", assigned: "Sarah", status: "Open" },
  { id: 3, title: "Label mismatch on BOM", severity: "MED", category: "Documentation", assigned: "Mike", status: "In Progress" },
];

const INITIAL_COMMENTS = [
  { id: 1, author: "Sarah", time: "2:10 PM", text: "Clearance issue flagged on page 3, near crossarm section." },
  { id: 2, author: "Mike", time: "2:25 PM", text: "On it, will resubmit by EOD." },
  { id: 3, author: "Sarah", time: "2:41 PM", text: "Also check the guy wire on page 5 — missing from BOM." },
];

const TIMELINE = [
  { time: "12:02", label: "Submitted by Mike", type: "submit" },
  { time: "12:45", label: "QA Started — Sarah", type: "qa" },
  { time: "1:10", label: "3 Issues Added", type: "issue" },
  { time: "1:30", label: "Sent Back for Rework", type: "rework" },
];

const NAV = [
  { icon: "▣", label: "Dashboard", screen: "dashboard" },
  { icon: "⊞", label: "Kanban", screen: "kanban" },
  { icon: "✦", label: "QA Tickets", screen: "ticket" },
  { icon: "⬡", label: "Pole Library", screen: null },
  { icon: "📊", label: "Reports", screen: null },
  { icon: "⚙", label: "Settings", screen: null },
];

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
const ISSUE_LIBRARY = [
  { title: "Missing guy wire", severity: "HIGH", category: "Material" },
  { title: "Clearance violation", severity: "HIGH", category: "Structural" },
  { title: "Label mismatch on BOM", severity: "MED", category: "Documentation" },
  { title: "Anchor depth error", severity: "LOW", category: "Structural" },
  { title: "Assembly note mismatch", severity: "MED", category: "Documentation" },
];

const cloneEntries = (entries) => entries.map((entry) => ({ ...entry }));
const formatTime = (date = new Date()) =>
  date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const createTimelineEntry = (label, type = "note", time = formatTime()) => ({
  time,
  label,
  type,
});

function buildGenericIssues(ticket) {
  return Array.from({ length: ticket.issues }, (_, index) => {
    const template = ISSUE_LIBRARY[index % ISSUE_LIBRARY.length];
    return {
      id: Number(`${ticket.id.replace("P-", "")}${index + 1}`),
      title: template.title,
      severity: template.severity,
      category: template.category,
      assigned: ticket.designer,
      status: index === 0 ? "Open" : "In Progress",
    };
  });
}

function buildTicketComments(ticket) {
  if (ticket.id === "P-1021") return cloneEntries(INITIAL_COMMENTS);

  if (ticket.status === "Approved") {
    return [
      {
        id: Number(`${ticket.id.replace("P-", "")}1`),
        author: ticket.qa,
        time: ticket.lastActivity,
        text: "Final review complete. Approved for release.",
      },
    ];
  }

  if (ticket.issues > 0 || ticket.status === "Rework") {
    return [
      {
        id: Number(`${ticket.id.replace("P-", "")}1`),
        author: ticket.qa,
        time: "10:18 AM",
        text: `Flagged ${ticket.issues} issue${ticket.issues === 1 ? "" : "s"} for follow-up.`,
      },
      {
        id: Number(`${ticket.id.replace("P-", "")}2`),
        author: ticket.designer,
        time: ticket.lastActivity,
        text: "Reviewing notes now and preparing the next revision.",
      },
    ];
  }

  return [
    {
      id: Number(`${ticket.id.replace("P-", "")}1`),
      author: ticket.qa,
      time: ticket.lastActivity,
      text: "Ticket is queued for review.",
    },
  ];
}

function buildTicketTimeline(ticket) {
  if (ticket.id === "P-1021") return cloneEntries(TIMELINE);

  const timeline = [createTimelineEntry(`Submitted by ${ticket.designer}`, "submit", "9:10 AM")];

  if (ticket.status !== "Submitted") {
    timeline.push(createTimelineEntry(`QA Started - ${ticket.qa}`, "qa", "9:42 AM"));
  }

  if (ticket.issues > 0) {
    timeline.push(
      createTimelineEntry(
        `${ticket.issues} Issue${ticket.issues === 1 ? "" : "s"} Added`,
        "issue",
        "10:18 AM"
      )
    );
  }

  if (ticket.status === "Rework") {
    timeline.push(createTimelineEntry("Sent Back for Rework", "rework", ticket.lastActivity));
  }

  if (ticket.status === "Approved") {
    timeline.push(createTimelineEntry(`Approved by ${ticket.qa}`, "approve", ticket.lastActivity));
  }

  if (ticket.status === "Rejected") {
    timeline.push(createTimelineEntry(`Rejected by ${ticket.qa}`, "reject", ticket.lastActivity));
  }

  return timeline;
}

function buildTicketDetail(ticket) {
  return {
    issues: ticket.id === "P-1021" ? cloneEntries(INITIAL_ISSUES) : buildGenericIssues(ticket),
    comments: buildTicketComments(ticket),
    timeline: buildTicketTimeline(ticket),
  };
}

function createInitialTicketDetails() {
  return Object.fromEntries(TICKETS.map((ticket) => [ticket.id, buildTicketDetail(ticket)]));
}

function syncTicketWithDetail(ticket, detail) {
  const lastTimelineEvent = detail.timeline[detail.timeline.length - 1];
  return {
    ...ticket,
    issues: detail.issues.length,
    lastActivity: lastTimelineEvent?.time || ticket.lastActivity,
  };
}

function createInitialAppState() {
  const ticketDetails = createInitialTicketDetails();
  const tickets = TICKETS.map((ticket) => syncTicketWithDetail(ticket, ticketDetails[ticket.id]));

  return {
    authed: false,
    user: "",
    screen: "dashboard",
    lastScreen: "dashboard",
    openTicketId: tickets[0].id,
    tickets,
    ticketDetails,
  };
}

function loadStoredState() {
  const baseState = createInitialAppState();

  if (typeof window === "undefined") return baseState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState;

    const stored = JSON.parse(raw);
    if (!stored || typeof stored !== "object") return baseState;

    const storedTickets = new Map(
      Array.isArray(stored.tickets) ? stored.tickets.map((ticket) => [ticket.id, ticket]) : []
    );

    const ticketDetails = Object.fromEntries(
      baseState.tickets.map((ticket) => {
        const storedDetail = stored.ticketDetails?.[ticket.id];
        const baseDetail = baseState.ticketDetails[ticket.id];

        return [
          ticket.id,
          {
            issues: Array.isArray(storedDetail?.issues) ? storedDetail.issues : baseDetail.issues,
            comments: Array.isArray(storedDetail?.comments)
              ? storedDetail.comments
              : baseDetail.comments,
            timeline: Array.isArray(storedDetail?.timeline)
              ? storedDetail.timeline
              : baseDetail.timeline,
          },
        ];
      })
    );

    const tickets = baseState.tickets.map((ticket) => {
      const storedTicket = storedTickets.get(ticket.id);
      return syncTicketWithDetail({ ...ticket, ...(storedTicket || {}) }, ticketDetails[ticket.id]);
    });

    return {
      authed: Boolean(stored.authed),
      user: typeof stored.user === "string" ? stored.user : "",
      screen: ["dashboard", "kanban", "ticket"].includes(stored.screen)
        ? stored.screen
        : baseState.screen,
      lastScreen: ["dashboard", "kanban"].includes(stored.lastScreen)
        ? stored.lastScreen
        : baseState.lastScreen,
      openTicketId: tickets.some((ticket) => ticket.id === stored.openTicketId)
        ? stored.openTicketId
        : baseState.openTicketId,
      tickets,
      ticketDetails,
    };
  } catch {
    return baseState;
  }
}

function getStatusLabel(status, actor) {
  switch (status) {
    case "Approved":
      return `Approved by ${actor}`;
    case "Rejected":
      return `Rejected by ${actor}`;
    case "Rework":
      return `Sent back for rework by ${actor}`;
    default:
      return `Moved to ${status} by ${actor}`;
  }
}

function Sidebar({ screen, setScreen, user, ticketAlertCount = 0 }) {
  return (
    <div style={{
      width: 240, height: "100vh", background: T.navy,
      display: "flex", flexDirection: "column",
      boxShadow: "2px 0 24px rgba(0,0,0,0.18)", zIndex: 20, flexShrink: 0,
    }}>
      <div style={{ padding: "26px 20px 20px", borderBottom: "1px solid #1E293B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#FF6044,#FF9E44)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#fff",
          }}>⬡</div>
          <div>
            <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 16, letterSpacing: "-0.4px" }}>PoleQA</div>
            <div style={{ color: T.slate, fontSize: 10 }}>v2.4 · Enterprise</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {NAV.map(item => {
          const active = screen === item.screen;
          return (
            <div key={item.label} onClick={() => item.screen && setScreen(item.screen)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 9, marginBottom: 2,
                background: active ? "rgba(255,96,68,0.14)" : "transparent",
                color: active ? T.primary : T.slateLight,
                fontWeight: active ? 700 : 400, fontSize: 13.5,
                cursor: item.screen ? "pointer" : "default",
                opacity: item.screen ? 1 : 0.4,
                transition: "all 0.14s",
              }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 3, background: T.primary }} />}
              {item.label === "QA Tickets" && ticketAlertCount > 0 && (
                <span style={{ marginLeft: item.screen && !active ? "auto" : 0, background: T.red, color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                  {ticketAlertCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: "12px 10px" }}>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "#1E293B", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={user} size={32} />
          <div>
            <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 600 }}>{user}</div>
            <div style={{ color: T.slate, fontSize: 11 }}>QA Engineer</div>
          </div>
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: T.green }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOP HEADER
───────────────────────────────────────────── */
function TopHeader({ title, subtitle, user, notifs = 3 }) {
  const [showNotif, setShowNotif] = useState(false);
  return (
    <div style={{
      height: 72, background: T.white, borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", padding: "0 32px",
      justifyContent: "space-between", flexShrink: 0,
      boxShadow: "0 1px 8px rgba(15,23,42,0.05)",
    }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: "-0.5px" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: T.textSub, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }} onClick={() => setShowNotif(!showNotif)}>
          <button style={{
            width: 38, height: 38, borderRadius: "50%", border: `1.5px solid ${T.border}`,
            background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}>🔔</button>
          {notifs > 0 && <div style={{ position: "absolute", top: 4, right: 4, width: 9, height: 9, borderRadius: "50%", background: T.red, border: "2px solid #fff" }} />}
          {showNotif && (
            <div style={{
              position: "absolute", top: 46, right: 0, width: 300, background: "#fff",
              borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
              zIndex: 100, overflow: "hidden",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                Notifications <Badge color={T.red}>{notifs} new</Badge>
              </div>
              {[
                { icon: "⚠️", text: "P-1021 has 3 unresolved issues", time: "2m ago" },
                { icon: "🔁", text: "P-1024 sent back for rework", time: "18m ago" },
                { icon: "✅", text: "P-1023 approved by Tom", time: "1h ago" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? `1px solid ${T.border}` : "none", display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12 }}>
                  <span style={{ fontSize: 16 }}>{n.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: T.text, fontWeight: 500 }}>{n.text}</div>
                    <div style={{ color: T.textSub, marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Avatar name={user} size={36} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1: LOGIN
───────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("sarah@poleqa.io");
  const [pass, setPass] = useState("••••••••");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin("Sarah K."); }, 1100);
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.navy,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Decorative bg */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -180, right: -180, width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,96,68,0.14) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -120, left: -120, width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,160,107,0.1) 0%, transparent 70%)" }} />
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{
            position: "absolute", opacity: 0.06,
            left: `${(i * 137) % 100}%`, top: `${(i * 73) % 100}%`,
            width: 2, height: 2, borderRadius: "50%", background: "#FF6044",
          }} />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 80, zIndex: 1, padding: "0 40px" }}>
        {/* Left hero */}
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg,#FF6044,#FF9E44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⬡</div>
            <span style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>PoleQA</span>
          </div>
          <h1 style={{ color: "#F1F5F9", fontSize: 44, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-1.5px", margin: "0 0 16px" }}>
            Engineering QA,<br /><span style={{ color: T.primary }}>reimagined.</span>
          </h1>
          <p style={{ color: T.slateLight, fontSize: 16, lineHeight: 1.7, margin: 0 }}>
            From submittal to approval — everything lives in one place. No more email threads, no more Excel trackers.
          </p>

          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "⬡", label: "Visual PDF + Pole markup" },
              { icon: "✦", label: "Real-time issue tracking" },
              { icon: "▣", label: "Full audit trail & workflow" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,96,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, fontSize: 13 }}>{f.icon}</div>
                <span style={{ color: T.slateLight, fontSize: 14 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div style={{
          width: 400, background: "#1E293B", borderRadius: 20,
          border: "1px solid #334155", padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Sign in</div>
            <div style={{ color: T.slate, fontSize: 13 }}>Welcome back — your team is waiting.</div>
          </div>

          {[
            { label: "Email", value: email, setter: setEmail, type: "email" },
            { label: "Password", value: pass, setter: setPass, type: "password" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.slateLight, marginBottom: 6 }}>{f.label}</label>
              <input value={f.value} onChange={e => f.setter(e.target.value)} type={f.type}
                style={{
                  width: "100%", background: "#0F172A", border: "1.5px solid #334155",
                  borderRadius: 9, padding: "11px 14px", fontSize: 14, color: "#F1F5F9",
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }} />
            </div>
          ))}

          <button onClick={handleLogin} disabled={loading} style={{
            width: "100%", height: 46, borderRadius: 10, border: "none",
            background: loading ? "#334155" : "linear-gradient(135deg,#FF6044,#FF7A44)",
            color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "default" : "pointer",
            marginTop: 8, boxShadow: loading ? "none" : "0 4px 16px rgba(255,96,68,0.4)",
            transition: "all 0.2s", letterSpacing: "-0.2px",
          }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: T.primary, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
          </div>

          <div style={{ marginTop: 24, padding: "12px 14px", background: "#0F172A", borderRadius: 9, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <span style={{ fontSize: 12, color: T.slate }}>Demo: click Sign In to enter as Sarah K. (QA Engineer)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2: DASHBOARD
───────────────────────────────────────────── */
function DashboardScreen({ setScreen, setOpenTicket }) {
  const stats = [
    { label: "Total Tickets", value: "48", delta: "+6 this week", icon: "🎟", color: "#2563EB" },
    { label: "In QA", value: "12", delta: "3 overdue", icon: "🔍", color: T.primary },
    { label: "Issues Found", value: "7", delta: "↑ 2 from yesterday", icon: "⚠️", color: T.red },
    { label: "Approved Today", value: "5", delta: "↑ On track", icon: "✅", color: T.green },
  ];

  const recent = TICKETS.slice(0, 5);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopHeader title="Dashboard" subtitle="Good afternoon, Sarah — here's your overview." user="Sarah K." />
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {stats.map(s => (
            <Card key={s.label} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, color: T.textSub, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: T.text, letterSpacing: "-1px", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: T.textSub, marginTop: 6 }}>{s.delta}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          {/* Recent tickets */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Recent Tickets</span>
              <button onClick={() => setScreen("kanban")} style={{ fontSize: 12, color: T.primary, fontWeight: 700, border: "none", background: "none", cursor: "pointer" }}>View Kanban →</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Ticket", "Client", "Designer", "QA", "Status", "Issues"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textSub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((t, i) => (
                  <tr key={t.id} onClick={() => { setOpenTicket(t); setScreen("ticket"); }}
                    style={{ borderBottom: i < recent.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: T.primary }}>{t.id}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{t.client}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{t.designer}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{t.qa}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={STATUS_COLOR[t.status]}>{t.status}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {t.issues > 0 ? <Badge color={T.red}>{t.issues}</Badge> : <span style={{ color: T.textSub, fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Quick stats sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>QA Velocity</div>
              {[
                { label: "Avg. QA Time", value: "1.6 days", bar: 0.42 },
                { label: "First-pass Rate", value: "68%", bar: 0.68 },
                { label: "Rework Rate", value: "24%", bar: 0.24 },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: T.textSub }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: T.text }}>{m.value}</span>
                  </div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${m.bar * 100}%`, background: "linear-gradient(to right,#FF6044,#FF9E44)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Top Issues This Week</div>
              {[
                { label: "Missing guy wire", count: 8 },
                { label: "Clearance violations", count: 6 },
                { label: "BOM mismatches", count: 5 },
                { label: "Anchor depth errors", count: 3 },
              ].map((i, idx) => (
                <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: T.redLight, color: T.red, fontWeight: 800, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</span>
                  <span style={{ flex: 1, color: T.text }}>{i.label}</span>
                  <Badge color={T.red}>{i.count}</Badge>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3: KANBAN
───────────────────────────────────────────── */
function KanbanScreen({ setScreen, setOpenTicket }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopHeader title="Kanban Board" subtitle="Drag tickets across columns to update status" user="Sarah K." />

      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 16, height: "100%", minWidth: 1100 }}>
          {KANBAN_COLS.map(col => {
            const colTickets = TICKETS.filter(t => t.status === col);
            return (
              <div key={col} style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px", marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[col] }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{col}</span>
                  <span style={{ marginLeft: "auto", background: T.border, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700, color: T.textSub }}>{colTickets.length}</span>
                </div>

                {/* Scrollable cards */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                  {colTickets.map(ticket => (
                    <div key={ticket.id}
                      onClick={() => { setOpenTicket(ticket); setScreen("ticket"); }}
                      style={{
                        background: T.white, borderRadius: 12, padding: "14px 14px",
                        border: `1.5px solid ${T.border}`, cursor: "pointer",
                        boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,96,68,0.14)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "0 1px 6px rgba(15,23,42,0.06)"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: T.primary }}>{ticket.id}</span>
                        <Badge color={ticket.priority === "HIGH" ? T.red : ticket.priority === "MED" ? T.orange : T.slate}
                          bg={ticket.priority === "HIGH" ? T.redLight : ticket.priority === "MED" ? T.orangeLight : "#F1F5F9"}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>{ticket.client} · {ticket.pole}</div>

                      {ticket.issues > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                          <span style={{ fontSize: 11 }}>⚠️</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: T.red }}>{ticket.issues} issues</span>
                        </div>
                      )}

                      <div style={{ height: 1, background: T.border, margin: "8px 0" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar name={ticket.designer} size={20} bg="linear-gradient(135deg,#2563EB,#7C3AED)" />
                        <span style={{ fontSize: 11, color: T.textSub }}>{ticket.designer}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: T.textSub }}>{ticket.daysInQA}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 4: QA TICKET (full detail)
───────────────────────────────────────────── */
function TicketScreen({ ticket, setScreen }) {
  const [activeView, setActiveView] = useState("PDF View");
  const [issues, setIssues] = useState(INITIAL_ISSUES);
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: "", severity: "MED", category: "" });
  const [ticketStatus, setTicketStatus] = useState(ticket?.status || "Issues Found");
  const [hoveredPin, setHoveredPin] = useState(null);
  const commentsEnd = useRef(null);

  const stepIndex = STEPS.indexOf(ticketStatus);
  const computedSteps = STEPS.map((s, i) => ({
    label: s,
    state: i < stepIndex ? "done" : i === stepIndex ? "current" : "future",
  }));

  const pins = [
    { id: 1, x: 36, y: 29, label: "Missing guy wire" },
    { id: 2, x: 61, y: 52, label: "Clearance violation" },
    { id: 3, x: 20, y: 65, label: "Label mismatch" },
  ];

  const severityColor = s => s === "HIGH" ? T.red : s === "MED" ? T.orange : T.slate;
  const severityBg = s => s === "HIGH" ? T.redLight : s === "MED" ? T.orangeLight : "#F9FAFB";

  const sendComment = () => {
    if (!commentInput.trim()) return;
    setComments(prev => [...prev, { id: Date.now(), author: "Sarah", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text: commentInput }]);
    setCommentInput("");
    setTimeout(() => commentsEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const addIssue = () => {
    if (!newIssue.title.trim()) return;
    setIssues(prev => [...prev, { id: Date.now(), ...newIssue, assigned: "Mike", status: "Open" }]);
    setNewIssue({ title: "", severity: "MED", category: "" });
    setShowAddIssue(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        height: 72, background: T.white, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", padding: "0 32px",
        justifyContent: "space-between", flexShrink: 0,
        boxShadow: "0 1px 8px rgba(15,23,42,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setScreen("kanban")} style={{
            display: "flex", alignItems: "center", gap: 6, border: `1.5px solid ${T.border}`,
            borderRadius: 8, padding: "6px 12px", background: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: T.textSub,
          }}>← Back</button>
          <div style={{ width: 1, height: 24, background: T.border }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: T.text, letterSpacing: "-0.4px" }}>
              QA Ticket — {ticket?.id || "P-1021"}
            </div>
            <div style={{ fontSize: 11, color: T.textSub }}>Oncor Distribution · {ticket?.pole || "DP-001A"} · Rev 3</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <button style={{ width: 38, height: 38, borderRadius: "50%", border: `1.5px solid ${T.border}`, background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>🔔</button>
            <div style={{ position: "absolute", top: 4, right: 4, width: 9, height: 9, borderRadius: "50%", background: T.red, border: "2px solid #fff" }} />
          </div>
          <Avatar name="Sarah K." size={36} />
        </div>
      </div>

      {/* Status bar */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "14px 32px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {computedSteps.map((step, i) => {
            const col = step.state === "done" ? T.green : step.state === "current" ? T.primary : "#D0D5DD";
            return (
              <div key={step.label} style={{ display: "flex", alignItems: "center", flex: i < computedSteps.length - 1 ? 1 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", background: col,
                    boxShadow: step.state === "current" ? `0 0 0 5px rgba(255,96,68,0.18)` : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s",
                  }}>
                    {step.state === "done" && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                    {step.state === "current" && <span style={{ color: "#fff", fontSize: 9 }}>●</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: step.state === "current" ? 800 : 500, color: col, whiteSpace: "nowrap" }}>{step.label}</span>
                </div>
                {i < computedSteps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step.state === "done" ? T.green : "#D0D5DD", margin: "0 8px", marginBottom: 18, transition: "background 0.3s" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main panels */}
      <div style={{ flex: 1, display: "flex", gap: 18, padding: "18px 28px", overflow: "hidden" }}>

        {/* LEFT: viewer */}
        <div style={{
          flex: 1, background: T.white, borderRadius: 14,
          border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Toggle bar */}
          <div style={{ display: "flex", gap: 8, padding: "14px 18px", borderBottom: `1px solid ${T.border}`, flexShrink: 0, alignItems: "center" }}>
            {["PDF View", "Pole View", "Compare"].map(v => (
              <button key={v} onClick={() => setActiveView(v)} style={{
                padding: "7px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                border: activeView === v ? "none" : `1.5px solid ${T.border}`,
                background: activeView === v ? T.primary : "#fff",
                color: activeView === v ? "#fff" : T.textSub,
                cursor: "pointer", boxShadow: activeView === v ? "0 2px 8px rgba(255,96,68,0.3)" : "none",
                transition: "all 0.15s",
              }}>{v}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.textSub }}>P-{ticket?.id || "1021"} · Rev 3</span>
              <Badge color={T.red}>{issues.length} Issues</Badge>
            </div>
          </div>

          {/* View content */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

            {activeView === "PDF View" && (
              <div style={{ width: "100%", height: "100%", background: "#EAECEF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ width: "66%", height: "88%", background: "#fff", boxShadow: "0 8px 48px rgba(0,0,0,0.18)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                  <div style={{ padding: "28px 36px", fontFamily: "monospace" }}>
                    {[
                      ["POLE DESIGN DRAWING — SINGLE CIRCUIT 69kV", "header"],
                      ["Structure: DP-001A  |  Class: H2  |  Height: 75ft", "sub"],
                      ["─────────────────────────────────────────", "divider"],
                      ["BILL OF MATERIALS", "header"],
                      ["Item 01: Wood Pole (Class H2, 75ft)      QTY: 1", "normal"],
                      ["Item 02: Crossarm (10ft Double)          QTY: 2", "normal"],
                      ["Item 03: Insulator (Suspension Type)     QTY: 6", "normal"],
                      ["Item 04: Guy Wire (3/8 EHS)              QTY: ??  ← MISSING", "error"],
                      ["─────────────────────────────────────────", "divider"],
                      ["CLEARANCES", "header"],
                      ["Phase-to-Phase:         60\"", "normal"],
                      ["Phase-to-Ground:        ??  ← VERIFY REQUIRED", "error"],
                      ["Min. Ground Clearance:  22'-6\"", "normal"],
                      ["─────────────────────────────────────────", "divider"],
                      ["NOTES", "header"],
                      ["Pole loading per NESC Grade B requirements.", "normal"],
                      ["All hardware galvanized per ASTM A-153.", "normal"],
                    ].map(([text, type], i) => (
                      <div key={i} style={{
                        fontSize: 11, lineHeight: 2.1,
                        color: type === "error" ? T.red : type === "header" ? "#1E293B" : type === "divider" ? "#D1D5DB" : "#374151",
                        fontWeight: type === "header" ? 700 : type === "error" ? 800 : 400,
                      }}>{text}</div>
                    ))}
                  </div>
                  {/* Pins */}
                  {pins.map(pin => (
                    <div key={pin.id}
                      onMouseEnter={() => setHoveredPin(pin.id)}
                      onMouseLeave={() => setHoveredPin(null)}
                      onClick={() => setSelectedIssue(selectedIssue === pin.id ? null : pin.id)}
                      style={{
                        position: "absolute", left: `${pin.x}%`, top: `${pin.y}%`,
                        width: 24, height: 24, borderRadius: "50%",
                        background: selectedIssue === pin.id ? T.primary : T.red,
                        border: "2.5px solid #fff",
                        boxShadow: `0 2px 8px rgba(217,45,32,0.5)${selectedIssue === pin.id ? ", 0 0 0 5px rgba(255,96,68,0.22)" : ""}`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 11, fontWeight: 900,
                        transform: selectedIssue === pin.id ? "scale(1.3)" : "scale(1)",
                        transition: "all 0.2s", zIndex: 3,
                      }}>{pin.id}</div>
                  ))}
                  {hoveredPin && (() => {
                    const p = pins.find(x => x.id === hoveredPin);
                    return (
                      <div style={{
                        position: "absolute", left: `${p.x + 4}%`, top: `${p.y - 9}%`,
                        background: T.navy, color: "#fff", borderRadius: 8, padding: "6px 12px",
                        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", zIndex: 10,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        pointerEvents: "none",
                      }}>⚠ {p.label}</div>
                    );
                  })()}
                </div>
                <div style={{ position: "absolute", bottom: 16, left: 20, display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.red }} />
                  <span style={{ fontSize: 11, color: T.textSub }}>Issue pin — click to select</span>
                </div>
              </div>
            )}

            {activeView === "Pole View" && (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg,#0F172A 0%,#1E293B 60%,#0F172A 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 130, height: 12, background: "linear-gradient(to right, #6B4423,#A0522D)", borderRadius: 3 }} />
                    <div style={{ width: 28, height: 12, background: "#8B6914", borderRadius: 2 }} />
                    <div style={{ width: 130, height: 12, background: "linear-gradient(to right, #A0522D,#6B4423)", borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", gap: 118, marginBottom: 8 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 14, height: 36, background: "#D4A853", borderRadius: 7 }} />)}
                  </div>
                  <div style={{ width: 32, height: 260, background: "linear-gradient(to right, #5C3317,#A0522D,#5C3317)", borderRadius: "4px 4px 10px 10px" }} />
                  <div style={{ position: "absolute", top: 70, right: -100, width: 110, height: 2, borderTop: "2.5px dashed #D92D20", transform: "rotate(-28deg)", transformOrigin: "left center" }} />
                  <div style={{ position: "absolute", top: 50, right: -120, background: T.red, color: "#fff", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 5 }}>MISSING</div>
                  <div style={{ position: "absolute", bottom: 40, left: -90, background: T.orange, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, whiteSpace: "nowrap" }}>CLEARANCE ??</div>
                </div>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>3D Pole View — DP-001A · Click components to inspect</div>
              </div>
            )}

            {activeView === "Compare" && (
              <div style={{ width: "100%", height: "100%", display: "flex" }}>
                {[["Rev 2 (Previous)", "#F8FAFC", "#E5E7EB", "#9CA3AF"], ["Rev 3 (Current)", "#F0FFF8", "#BBF7D0", "#065F46"]].map(([label, bg, rectBg, rectColor]) => (
                  <div key={label} style={{ flex: 1, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, borderRight: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: rectColor }}>{label}</div>
                    <div style={{ width: "65%", height: "68%", background: rectBg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: rectColor, fontSize: 12, fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: control panel */}
        <div style={{ width: 354, display: "flex", flexDirection: "column", gap: 13, overflowY: "auto", flexShrink: 0 }}>

          {/* Alert */}
          <div style={{ background: T.redLight, border: `1px solid #FECDCA`, borderRadius: 10, padding: "10px 15px", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.red }}>{issues.length} Issues Detected — Action Required</span>
          </div>

          {/* Ticket Summary */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Ticket Summary</span>
              <Badge color={STATUS_COLOR[ticketStatus]}>{ticketStatus}</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
              {[["Project", ticket?.id || "P-1021"], ["Client", ticket?.client || "Oncor"], ["Designer", ticket?.designer || "Mike"], ["QA Owner", ticket?.qa || "Sarah"]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: T.textSub, fontSize: 11, marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 700, color: T.text }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span>⏱</span>
              <span style={{ color: T.textSub }}>Time in QA:</span>
              <span style={{ fontWeight: 800, color: T.text, marginLeft: 4 }}>{ticket?.daysInQA || 1.8} days</span>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Actions</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "✅ Approve", status: "Approved", activeColor: T.green, inactiveBg: T.greenLight, inactiveColor: T.green },
                { label: "❌ Reject", status: "Rejected", activeColor: T.red, inactiveBg: T.redLight, inactiveColor: T.red },
                { label: "🔁 Send Back", status: "Rework", activeColor: T.primary, inactiveBg: T.primaryLight, inactiveColor: T.primary },
              ].map(btn => (
                <button key={btn.status} onClick={() => setTicketStatus(btn.status)} style={{
                  flex: 1, height: 40, borderRadius: 8, border: "none", cursor: "pointer",
                  background: ticketStatus === btn.status ? btn.activeColor : btn.inactiveBg,
                  color: ticketStatus === btn.status ? "#fff" : btn.inactiveColor,
                  fontWeight: 800, fontSize: 12, transition: "all 0.15s",
                  boxShadow: ticketStatus === btn.status ? `0 2px 10px ${btn.activeColor}44` : "none",
                }}>{btn.label}</button>
              ))}
            </div>
            {ticketStatus !== "Issues Found" && (
              <div style={{ marginTop: 8, padding: "6px 12px", borderRadius: 7, background: ticketStatus === "Approved" ? T.greenLight : T.primaryLight, textAlign: "center", fontSize: 12, fontWeight: 800, color: ticketStatus === "Approved" ? T.green : T.primary }}>
                Ticket marked as {ticketStatus} ✓
              </div>
            )}
          </Card>

          {/* Issues */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Issues</span>
              <Badge color={T.red}>{issues.length} open</Badge>
            </div>
            <div style={{ maxHeight: 210, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {issues.map(issue => (
                <div key={issue.id} onClick={() => setSelectedIssue(selectedIssue === issue.id ? null : issue.id)}
                  style={{
                    padding: "9px 11px", borderRadius: 8, cursor: "pointer",
                    border: `1.5px solid ${selectedIssue === issue.id ? T.primary : T.border}`,
                    background: selectedIssue === issue.id ? T.primaryLight : "#FAFAFA",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{issue.title}</div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 4, background: severityBg(issue.severity), color: severityColor(issue.severity) }}>{issue.severity}</span>
                    <span style={{ fontSize: 10, color: T.textSub, background: "#F1F5F9", padding: "2px 7px", borderRadius: 4 }}>{issue.category}</span>
                    <span style={{ fontSize: 11, color: T.textSub, marginLeft: "auto" }}>→ {issue.assigned}</span>
                  </div>
                </div>
              ))}
            </div>
            {showAddIssue ? (
              <div style={{ marginTop: 8, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: `1px solid ${T.border}` }}>
                <input placeholder="Issue title…" value={newIssue.title} onChange={e => setNewIssue({ ...newIssue, title: e.target.value })}
                  style={{ width: "100%", border: `1.5px solid ${T.border}`, borderRadius: 7, padding: "7px 10px", fontSize: 13, marginBottom: 6, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <select value={newIssue.severity} onChange={e => setNewIssue({ ...newIssue, severity: e.target.value })}
                    style={{ flex: 1, border: `1.5px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}>
                    <option>HIGH</option><option>MED</option><option>LOW</option>
                  </select>
                  <input placeholder="Category" value={newIssue.category} onChange={e => setNewIssue({ ...newIssue, category: e.target.value })}
                    style={{ flex: 1, border: `1.5px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={addIssue} style={{ flex: 1, padding: "7px 0", background: T.primary, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Add Issue</button>
                  <button onClick={() => setShowAddIssue(false)} style={{ flex: 1, padding: "7px 0", background: "#F1F5F9", color: T.slate, border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddIssue(true)} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, border: `1.5px dashed ${T.border}`, background: "transparent", color: T.primary, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                + Add Issue
              </button>
            )}
          </Card>

          {/* Comments */}
          <Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Comments</div>
            <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {comments.map(c => (
                <div key={c.id} style={{ padding: "8px 11px", borderRadius: 8, background: c.author === "Sarah" ? T.primaryLight : "#F8FAFC", border: `1px solid ${c.author === "Sarah" ? "#FECDCA" : T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontWeight: 800, fontSize: 12, color: T.primary }}>{c.author}</span>
                    <span style={{ fontSize: 11, color: T.textSub }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{c.text}</div>
                </div>
              ))}
              <div ref={commentsEnd} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendComment()}
                placeholder="Write a comment…"
                style={{ flex: 1, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#FAFAFA", fontFamily: "inherit" }} />
              <button onClick={sendComment} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: T.primary, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
            </div>
          </Card>

          {/* Timeline */}
          <Card style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Activity Timeline</div>
            {TIMELINE.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
                {i < TIMELINE.length - 1 && <div style={{ position: "absolute", left: 17, top: 22, width: 2, height: "calc(100% - 6px)", background: T.border }} />}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.primary, border: "2px solid #fff", boxShadow: `0 0 0 2px ${T.primary}30`, flexShrink: 0, marginTop: 4, marginLeft: 12 }} />
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{entry.label}</div>
                  <div style={{ fontSize: 11, color: T.textSub }}>{entry.time} PM</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
function DashboardScreenV2({ user, tickets, ticketDetails, setScreen, onOpenTicket }) {
  const firstName = user.split(" ")[0] || "Sarah";
  const allIssues = Object.values(ticketDetails).flatMap((detail) => detail.issues);
  const issueCounts = allIssues.reduce((summary, issue) => {
    summary[issue.title] = (summary[issue.title] || 0) + 1;
    return summary;
  }, {});

  const topIssues = Object.entries(issueCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const stats = [
    {
      label: "Total Tickets",
      value: String(tickets.length),
      delta: `${tickets.filter((ticket) => ticket.priority === "HIGH").length} high priority`,
      accent: "#2563EB",
    },
    {
      label: "In QA",
      value: String(tickets.filter((ticket) => ticket.status === "In QA").length),
      delta: `${tickets.filter((ticket) => ticket.daysInQA >= 2).length} overdue`,
      accent: T.primary,
    },
    {
      label: "Issues Found",
      value: String(tickets.filter((ticket) => ticket.issues > 0).length),
      delta: `${allIssues.length} active issue${allIssues.length === 1 ? "" : "s"}`,
      accent: T.red,
    },
    {
      label: "Approved",
      value: String(tickets.filter((ticket) => ticket.status === "Approved").length),
      delta: `${tickets.filter((ticket) => ticket.status === "Rejected").length} rejected`,
      accent: T.green,
    },
  ];

  const recent = tickets.slice(0, 5);
  const avgQaTime = (tickets.reduce((sum, ticket) => sum + ticket.daysInQA, 0) / tickets.length).toFixed(1);
  const approvalRate = Math.round(
    (tickets.filter((ticket) => ticket.status === "Approved").length / tickets.length) * 100
  );
  const reworkRate = Math.round(
    (tickets.filter((ticket) => ticket.status === "Rework").length / tickets.length) * 100
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopHeader
        title="Dashboard"
        subtitle={`Good afternoon, ${firstName} - here's your overview.`}
        user={user}
      />
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {stats.map((stat) => (
            <Card key={stat.label} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, color: T.textSub, fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: T.text, letterSpacing: "-1px", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: T.textSub, marginTop: 6 }}>{stat.delta}</div>
                </div>
                <div style={{ width: 14, height: 42, borderRadius: 10, background: stat.accent }} />
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Recent Tickets</span>
              <button onClick={() => setScreen("kanban")} style={{ fontSize: 12, color: T.primary, fontWeight: 700, border: "none", background: "none", cursor: "pointer" }}>View Kanban -&gt;</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Ticket", "Client", "Designer", "QA", "Status", "Issues"].map((header) => (
                    <th key={header} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textSub, borderBottom: `1px solid ${T.border}` }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((ticket, index) => (
                  <tr key={ticket.id} onClick={() => onOpenTicket(ticket.id, "dashboard")} style={{ borderBottom: index < recent.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: T.primary }}>{ticket.id}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{ticket.client}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{ticket.designer}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{ticket.qa}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={STATUS_COLOR[ticket.status] || T.slate}>{ticket.status}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {ticket.issues > 0 ? <Badge color={T.red}>{ticket.issues}</Badge> : <span style={{ color: T.textSub, fontSize: 12 }}>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>QA Velocity</div>
              {[
                { label: "Avg. QA Time", value: `${avgQaTime} days`, bar: Math.min(Number(avgQaTime) / 4, 1) },
                { label: "Approval Rate", value: `${approvalRate}%`, bar: approvalRate / 100 },
                { label: "Rework Rate", value: `${reworkRate}%`, bar: reworkRate / 100 },
              ].map((metric) => (
                <div key={metric.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: T.textSub }}>{metric.label}</span>
                    <span style={{ fontWeight: 700, color: T.text }}>{metric.value}</span>
                  </div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${metric.bar * 100}%`, background: "linear-gradient(to right,#FF6044,#FF9E44)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Top Issues This Week</div>
              {topIssues.map((issue, idx) => (
                <div key={issue.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: T.redLight, color: T.red, fontWeight: 800, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</span>
                  <span style={{ flex: 1, color: T.text }}>{issue.label}</span>
                  <Badge color={T.red}>{issue.count}</Badge>
                </div>
              ))}
              {topIssues.length === 0 && <div style={{ fontSize: 12, color: T.textSub }}>No issues logged yet.</div>}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanScreenV2({ user, tickets, onOpenTicket, onMoveTicket }) {
  const [draggingTicketId, setDraggingTicketId] = useState(null);
  const [hoverColumn, setHoverColumn] = useState(null);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopHeader title="Kanban Board" subtitle="Drag tickets across columns to update status" user={user} />

      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 16, height: "100%", minWidth: 1320 }}>
          {KANBAN_COLS.map((column) => {
            const columnTickets = tickets.filter((ticket) => ticket.status === column);
            const isDropTarget = hoverColumn === column;

            return (
              <div key={column} style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px", marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[column] || T.slate }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{column}</span>
                  <span style={{ marginLeft: "auto", background: T.border, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700, color: T.textSub }}>{columnTickets.length}</span>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (hoverColumn !== column) setHoverColumn(column);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setHoverColumn((current) => (current === column ? null : current));
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingTicketId) onMoveTicket(draggingTicketId, column);
                    setDraggingTicketId(null);
                    setHoverColumn(null);
                  }}
                  style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, borderRadius: 14, padding: 8, border: `1.5px dashed ${isDropTarget ? T.primary : "transparent"}`, background: isDropTarget ? T.primaryLight : "transparent", transition: "all 0.15s" }}
                >
                  {columnTickets.length === 0 && (
                    <div style={{ padding: "14px 12px", borderRadius: 10, border: `1px dashed ${T.border}`, textAlign: "center", fontSize: 12, color: T.textSub }}>
                      {draggingTicketId ? "Drop here to move ticket" : "No tickets"}
                    </div>
                  )}

                  {columnTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={() => setDraggingTicketId(ticket.id)}
                      onDragEnd={() => {
                        setDraggingTicketId(null);
                        setHoverColumn(null);
                      }}
                      onClick={() => onOpenTicket(ticket.id, "kanban")}
                      style={{ background: T.white, borderRadius: 12, padding: "14px 14px", border: `1.5px solid ${T.border}`, cursor: "pointer", boxShadow: "0 1px 6px rgba(15,23,42,0.06)", transition: "all 0.15s" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = T.primary;
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,96,68,0.14)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.boxShadow = "0 1px 6px rgba(15,23,42,0.06)";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: T.primary }}>{ticket.id}</span>
                        <Badge color={ticket.priority === "HIGH" ? T.red : ticket.priority === "MED" ? T.orange : T.slate} bg={ticket.priority === "HIGH" ? T.redLight : ticket.priority === "MED" ? T.orangeLight : "#F1F5F9"}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>{ticket.client} - {ticket.pole}</div>

                      {ticket.issues > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: T.red }}>{ticket.issues} issues</span>
                        </div>
                      )}

                      <div style={{ height: 1, background: T.border, margin: "8px 0" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar name={ticket.designer} size={20} bg="linear-gradient(135deg,#2563EB,#7C3AED)" />
                        <span style={{ fontSize: 11, color: T.textSub }}>{ticket.designer}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: T.textSub }}>{ticket.daysInQA}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TicketScreenV2({
  ticket,
  detail,
  currentUser,
  onBack,
  onUpdateStatus,
  onAddIssue,
  onAddComment,
}) {
  const [activeView, setActiveView] = useState("PDF View");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: "", severity: "MED", category: "" });
  const [hoveredPin, setHoveredPin] = useState(null);
  const commentsEnd = useRef(null);

  const issues = detail?.issues || [];
  const comments = detail?.comments || [];
  const timeline = detail?.timeline || [];
  const ticketStatus = ticket?.status || "Issues Found";
  const progressStatus = STATUS_PROGRESS[ticketStatus] || ticketStatus;
  const stepIndex = STEPS.indexOf(progressStatus);
  const actor = currentUser || ticket?.qa || "QA";
  const pins = [
    { id: 1, x: 34, y: 28, label: "Missing guy wire" },
    { id: 2, x: 59, y: 49, label: "Clearance violation" },
    { id: 3, x: 23, y: 66, label: "Label mismatch" },
  ];

  const severityColor = (severity) => (severity === "HIGH" ? T.red : severity === "MED" ? T.orange : T.slate);
  const severityBg = (severity) => (severity === "HIGH" ? T.redLight : severity === "MED" ? T.orangeLight : "#F9FAFB");

  useEffect(() => {
    setActiveView("PDF View");
    setSelectedIssue(null);
    setCommentInput("");
    setShowAddIssue(false);
    setNewIssue({ title: "", severity: "MED", category: "" });
    setHoveredPin(null);
  }, [ticket?.id]);

  useEffect(() => {
    commentsEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [comments.length, ticket?.id]);

  const sendComment = () => {
    if (!commentInput.trim() || !ticket) return;
    onAddComment(ticket.id, { author: actor, text: commentInput.trim() });
    setCommentInput("");
  };

  const addIssue = () => {
    if (!newIssue.title.trim() || !ticket) return;
    onAddIssue(ticket.id, {
      title: newIssue.title.trim(),
      severity: newIssue.severity,
      category: newIssue.category.trim() || "General",
      assigned: ticket.designer || "Mike",
      status: "Open",
    });
    setNewIssue({ title: "", severity: "MED", category: "" });
    setShowAddIssue(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 72, background: T.white, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 1px 8px rgba(15,23,42,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: T.textSub }}>
            &lt; Back
          </button>
          <div style={{ width: 1, height: 24, background: T.border }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: T.text }}>QA Ticket - {ticket?.id || "P-1021"}</div>
            <div style={{ fontSize: 11, color: T.textSub }}>{ticket?.client || "Oncor"} - {ticket?.pole || "DP-001A"} - Rev 3</div>
          </div>
        </div>
        <Avatar name={actor} size={36} />
      </div>

      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "14px 32px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {STEPS.map((step, index) => {
            const state = index < stepIndex ? "done" : index === stepIndex ? "current" : "future";
            const color = state === "done" ? T.green : state === "current" ? T.primary : "#D0D5DD";
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", flex: index < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: color, boxShadow: state === "current" ? `0 0 0 5px rgba(255,96,68,0.18)` : "none" }} />
                  <span style={{ fontSize: 11, fontWeight: state === "current" ? 800 : 500, color, whiteSpace: "nowrap" }}>{step}</span>
                </div>
                {index < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: state === "done" ? T.green : "#D0D5DD", margin: "0 8px", marginBottom: 18 }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 18, padding: "18px 28px", overflow: "hidden" }}>
        <div style={{ flex: 1, background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(15,23,42,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 8, padding: "14px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
            {["PDF View", "Pole View", "Compare"].map((view) => (
              <button key={view} onClick={() => setActiveView(view)} style={{ padding: "7px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, border: activeView === view ? "none" : `1.5px solid ${T.border}`, background: activeView === view ? T.primary : "#fff", color: activeView === view ? "#fff" : T.textSub, cursor: "pointer" }}>
                {view}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.textSub }}>{ticket?.id || "P-1021"} - Rev 3</span>
              <Badge color={T.red}>{issues.length} Issues</Badge>
            </div>
          </div>

          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {activeView === "PDF View" && (
              <div style={{ width: "100%", height: "100%", background: "#EAECEF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ width: "66%", height: "88%", background: "#fff", boxShadow: "0 8px 48px rgba(0,0,0,0.18)", borderRadius: 4, position: "relative", overflow: "hidden", padding: "28px 36px", fontFamily: "monospace" }}>
                  {[
                    "POLE DESIGN DRAWING - SINGLE CIRCUIT 69kV",
                    `Structure: ${ticket?.pole || "DP-001A"} | Client: ${ticket?.client || "Oncor"} | Height: 75ft`,
                    "-----------------------------------------",
                    "Item 04: Guy Wire (3/8 EHS)          QTY: ??  <- MISSING",
                    "Phase-to-Ground:                    ??  <- VERIFY REQUIRED",
                    "Notes: review BOM and clearance callouts before release.",
                  ].map((line, index) => (
                    <div key={index} style={{ fontSize: 11, lineHeight: 2.1, color: index >= 3 && index <= 4 ? T.red : "#374151", fontWeight: index === 0 ? 700 : index >= 3 && index <= 4 ? 800 : 400 }}>{line}</div>
                  ))}

                  {pins.map((pin) => (
                    <div key={pin.id} onMouseEnter={() => setHoveredPin(pin.id)} onMouseLeave={() => setHoveredPin(null)} onClick={() => setSelectedIssue(selectedIssue === pin.id ? null : pin.id)} style={{ position: "absolute", left: `${pin.x}%`, top: `${pin.y}%`, width: 24, height: 24, borderRadius: "50%", background: selectedIssue === pin.id ? T.primary : T.red, border: "2.5px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 900 }}>
                      {pin.id}
                    </div>
                  ))}

                  {hoveredPin && (() => {
                    const pin = pins.find((entry) => entry.id === hoveredPin);
                    if (!pin) return null;
                    return (
                      <div style={{ position: "absolute", left: `${pin.x + 4}%`, top: `${pin.y - 9}%`, background: T.navy, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {pin.label}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeView === "Pole View" && (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg,#0F172A 0%,#1E293B 60%,#0F172A 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 130, height: 12, background: "linear-gradient(to right, #6B4423,#A0522D)", borderRadius: 3 }} />
                    <div style={{ width: 28, height: 12, background: "#8B6914", borderRadius: 2 }} />
                    <div style={{ width: 130, height: 12, background: "linear-gradient(to right, #A0522D,#6B4423)", borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 32, height: 260, background: "linear-gradient(to right, #5C3317,#A0522D,#5C3317)", borderRadius: "4px 4px 10px 10px" }} />
                </div>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>3D Pole View - {ticket?.pole || "DP-001A"}</div>
              </div>
            )}

            {activeView === "Compare" && (
              <div style={{ width: "100%", height: "100%", display: "flex" }}>
                {["Rev 2 (Previous)", "Rev 3 (Current)"].map((label, index) => (
                  <div key={label} style={{ flex: 1, background: index === 0 ? "#F8FAFC" : "#F0FFF8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, borderRight: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: index === 0 ? "#9CA3AF" : "#065F46" }}>{label}</div>
                    <div style={{ width: "65%", height: "68%", background: index === 0 ? "#E5E7EB" : "#BBF7D0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: index === 0 ? "#9CA3AF" : "#065F46", fontSize: 12, fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ width: 354, display: "flex", flexDirection: "column", gap: 13, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ background: T.redLight, border: `1px solid #FECDCA`, borderRadius: 10, padding: "10px 15px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.red }}>{issues.length} Issues Detected - Action Required</span>
          </div>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Ticket Summary</span>
              <Badge color={STATUS_COLOR[ticketStatus] || T.slate}>{ticketStatus}</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
              {[["Project", ticket?.id || "P-1021"], ["Client", ticket?.client || "Oncor"], ["Designer", ticket?.designer || "Mike"], ["QA Owner", ticket?.qa || "Sarah"]].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: T.textSub, fontSize: 11, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 700, color: T.text }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: T.textSub }}>Time in QA:</span>
              <span style={{ fontWeight: 800, color: T.text, marginLeft: 6 }}>{ticket?.daysInQA || 1.8} days</span>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Actions</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Approve", status: "Approved", activeColor: T.green, inactiveBg: T.greenLight, inactiveColor: T.green },
                { label: "Reject", status: "Rejected", activeColor: T.red, inactiveBg: T.redLight, inactiveColor: T.red },
                { label: "Send Back", status: "Rework", activeColor: T.primary, inactiveBg: T.primaryLight, inactiveColor: T.primary },
              ].map((button) => (
                <button key={button.status} onClick={() => ticket && onUpdateStatus(ticket.id, button.status)} style={{ flex: 1, height: 40, borderRadius: 8, border: "none", cursor: "pointer", background: ticketStatus === button.status ? button.activeColor : button.inactiveBg, color: ticketStatus === button.status ? "#fff" : button.inactiveColor, fontWeight: 800, fontSize: 12 }}>
                  {button.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Issues</span>
              <Badge color={T.red}>{issues.length} open</Badge>
            </div>
            <div style={{ maxHeight: 210, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {issues.map((issue) => (
                <div key={issue.id} onClick={() => setSelectedIssue(selectedIssue === issue.id ? null : issue.id)} style={{ padding: "9px 11px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${selectedIssue === issue.id ? T.primary : T.border}`, background: selectedIssue === issue.id ? T.primaryLight : "#FAFAFA" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{issue.title}</div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 4, background: severityBg(issue.severity), color: severityColor(issue.severity) }}>{issue.severity}</span>
                    <span style={{ fontSize: 10, color: T.textSub, background: "#F1F5F9", padding: "2px 7px", borderRadius: 4 }}>{issue.category}</span>
                    <span style={{ fontSize: 11, color: T.textSub, marginLeft: "auto" }}>to {issue.assigned}</span>
                  </div>
                </div>
              ))}
            </div>
            {showAddIssue ? (
              <div style={{ marginTop: 8, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: `1px solid ${T.border}` }}>
                <input placeholder="Issue title..." value={newIssue.title} onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })} style={{ width: "100%", border: `1.5px solid ${T.border}`, borderRadius: 7, padding: "7px 10px", fontSize: 13, marginBottom: 6, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <select value={newIssue.severity} onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })} style={{ flex: 1, border: `1.5px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}>
                    <option>HIGH</option>
                    <option>MED</option>
                    <option>LOW</option>
                  </select>
                  <input placeholder="Category" value={newIssue.category} onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })} style={{ flex: 1, border: `1.5px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={addIssue} style={{ flex: 1, padding: "7px 0", background: T.primary, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Add Issue</button>
                  <button onClick={() => setShowAddIssue(false)} style={{ flex: 1, padding: "7px 0", background: "#F1F5F9", color: T.slate, border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddIssue(true)} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, border: `1.5px dashed ${T.border}`, background: "transparent", color: T.primary, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                + Add Issue
              </button>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Comments</div>
            <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {comments.map((comment) => {
                const isAuthor = comment.author === actor;
                return (
                  <div key={comment.id} style={{ padding: "8px 11px", borderRadius: 8, background: isAuthor ? T.primaryLight : "#F8FAFC", border: `1px solid ${isAuthor ? "#FECDCA" : T.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontWeight: 800, fontSize: 12, color: isAuthor ? T.primary : T.text }}>{comment.author}</span>
                      <span style={{ fontSize: 11, color: T.textSub }}>{comment.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{comment.text}</div>
                  </div>
                );
              })}
              <div ref={commentsEnd} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment()} placeholder="Write a comment..." style={{ flex: 1, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#FAFAFA", fontFamily: "inherit" }} />
              <button onClick={sendComment} style={{ width: 52, height: 36, borderRadius: 8, border: "none", background: T.primary, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
                Send
              </button>
            </div>
          </Card>

          <Card style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Activity Timeline</div>
            {timeline.map((entry, index) => (
              <div key={`${entry.time}-${index}`} style={{ display: "flex", gap: 12, position: "relative" }}>
                {index < timeline.length - 1 && <div style={{ position: "absolute", left: 17, top: 22, width: 2, height: "calc(100% - 6px)", background: T.border }} />}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.primary, border: "2px solid #fff", boxShadow: `0 0 0 2px ${T.primary}30`, flexShrink: 0, marginTop: 4, marginLeft: 12 }} />
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{entry.label}</div>
                  <div style={{ fontSize: 11, color: T.textSub }}>{entry.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState(loadStoredState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const { authed, user, screen, lastScreen, openTicketId, tickets, ticketDetails } = appState;
  const selectedTicket = tickets.find((ticket) => ticket.id === openTicketId) || tickets[0];
  const selectedTicketDetail = selectedTicket
    ? ticketDetails[selectedTicket.id]
    : { issues: [], comments: [], timeline: [] };
  const ticketAlertCount = tickets.filter((ticket) => ticket.issues > 0).length;

  const navigateTo = (nextScreen) => {
    setAppState((prev) => ({
      ...prev,
      screen: nextScreen,
      lastScreen: nextScreen === "ticket" ? prev.lastScreen : nextScreen,
    }));
  };

  const openTicketFrom = (ticketId, fromScreen) => {
    setAppState((prev) => ({
      ...prev,
      openTicketId: ticketId,
      screen: "ticket",
      lastScreen: fromScreen,
    }));
  };

  const patchTicketState = (ticketId, transformTicket, transformDetail) => {
    setAppState((prev) => {
      const currentTicket = prev.tickets.find((ticket) => ticket.id === ticketId);
      if (!currentTicket) return prev;

      const currentDetail = prev.ticketDetails[ticketId] || { issues: [], comments: [], timeline: [] };
      const nextDetail = transformDetail ? transformDetail(currentDetail, currentTicket) : currentDetail;
      const nextTicket = syncTicketWithDetail(
        transformTicket ? transformTicket(currentTicket, nextDetail) : currentTicket,
        nextDetail
      );

      return {
        ...prev,
        openTicketId: ticketId,
        tickets: prev.tickets.map((ticket) => (ticket.id === ticketId ? nextTicket : ticket)),
        ticketDetails: {
          ...prev.ticketDetails,
          [ticketId]: nextDetail,
        },
      };
    });
  };

  const handleLogin = (name) => {
    setAppState((prev) => ({
      ...prev,
      authed: true,
      user: name,
      screen: "dashboard",
      lastScreen: "dashboard",
    }));
  };

  const updateTicketStatus = (ticketId, status) => {
    patchTicketState(
      ticketId,
      (ticket) => (ticket.status === status ? ticket : { ...ticket, status }),
      (detail, ticket) => {
        if (ticket.status === status) return detail;
        return {
          ...detail,
          timeline: [...detail.timeline, createTimelineEntry(getStatusLabel(status, user || ticket.qa), status.toLowerCase())],
        };
      }
    );
  };

  const addIssueToTicket = (ticketId, issueDraft) => {
    patchTicketState(
      ticketId,
      (ticket) => ({
        ...ticket,
        status: ["Submitted", "In QA", "Approved"].includes(ticket.status) ? "Issues Found" : ticket.status,
        priority: issueDraft.severity === "HIGH" ? "HIGH" : ticket.priority,
      }),
      (detail) => ({
        ...detail,
        issues: [...detail.issues, { id: Date.now(), ...issueDraft }],
        timeline: [...detail.timeline, createTimelineEntry(`Issue added: ${issueDraft.title}`, "issue")],
      })
    );
  };

  const addCommentToTicket = (ticketId, commentDraft) => {
    patchTicketState(
      ticketId,
      (ticket) => ticket,
      (detail) => ({
        ...detail,
        comments: [...detail.comments, { id: Date.now(), time: formatTime(), ...commentDraft }],
        timeline: [...detail.timeline, createTimelineEntry(`Comment added by ${commentDraft.author}`, "comment")],
      })
    );
  };

  if (!authed) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar{width:5px;height:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:10px;} input,select{font-family:inherit;} button{font-family:inherit;}`}</style>
      <LoginScreen onLogin={handleLogin} />
    </>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar{width:5px;height:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:10px;} input,select,button{font-family:inherit;} button:hover{opacity:0.88;}`}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", background: T.bg }}>
        <Sidebar screen={screen} setScreen={navigateTo} user={user} ticketAlertCount={ticketAlertCount} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {screen === "dashboard" && (
            <DashboardScreenV2
              user={user}
              tickets={tickets}
              ticketDetails={ticketDetails}
              setScreen={navigateTo}
              onOpenTicket={openTicketFrom}
            />
          )}
          {screen === "kanban" && (
            <KanbanScreenV2
              user={user}
              tickets={tickets}
              onOpenTicket={openTicketFrom}
              onMoveTicket={updateTicketStatus}
            />
          )}
          {screen === "ticket" && (
            <TicketScreenV2
              ticket={selectedTicket}
              detail={selectedTicketDetail}
              currentUser={user}
              onBack={() => navigateTo(lastScreen || "kanban")}
              onUpdateStatus={updateTicketStatus}
              onAddIssue={addIssueToTicket}
              onAddComment={addCommentToTicket}
            />
          )}
        </div>
      </div>
    </>
  );
}
