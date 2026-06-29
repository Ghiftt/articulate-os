"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, BookOpen, BarChart2, PenLine, Map, RefreshCw, ChevronRight, CheckCircle2, Circle } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }
interface Genome {
  observation: number; reasoning: number; organization: number;
  precision: number; vocabulary: number; conversation: number;
  storytelling: number; pressure: number;
}
interface Session {
  mode: string; genome: Genome; current_skill: string;
  pipeline_stage: string; skills_mastered: string[];
  recommended_next: string; mission: string;
}

const C = {
  bg: "#000000", surface: "#0a0a0a", card: "#111111", cardHover: "#161616",
  border: "#1f1f1f", borderLight: "#2a2a2a", accent: "#059669", accentLight: "#34d399",
  accentDim: "#022c22", accentGlow: "rgba(5, 150, 105, 0.15)", text: "#f9fafb",
  textMuted: "#6b7280", textDim: "#374151", danger: "#ef4444", warning: "#f59e0b",
  success: "#34d399", white: "#ffffff",
};

function lsSet(key: string, value: string) {
  if (typeof window !== "undefined") localStorage.setItem(key, value);
}
function lsGet(key: string): string | null {
  if (typeof window !== "undefined") return localStorage.getItem(key);
  return null;
}

const INITIAL_MESSAGE = `You already have thoughts worth sharing. This app helps you express them with the clarity they deserve.

Before we begin, tell me: what is your mission? What are you working toward — professionally, personally, or both? Be as specific as you want.

This will shape every exercise you receive.`;

const DEFAULT_GENOME: Genome = {
  observation: 0, reasoning: 0, organization: 0, precision: 0,
  vocabulary: 0, conversation: 0, storytelling: 0, pressure: 0
};

const SKILLS = [
  { system: "Thinking System", skills: [
    { id: 1, name: "Concrete Observation", desc: "Describe only what you can literally see" },
    { id: 2, name: "Hidden Details", desc: "Find details everyone ignores" },
    { id: 3, name: "Pattern Recognition", desc: "What's common across examples?" },
    { id: 4, name: "Cause vs Correlation", desc: "What actually caused this?" },
    { id: 5, name: "Assumptions", desc: "What am I taking for granted?" },
    { id: 6, name: "Main Point", desc: "Express your idea in ONE sentence" },
    { id: 7, name: "Supporting Reasons", desc: "Give exactly three reasons" },
    { id: 8, name: "Evidence", desc: "What proves your point?" },
    { id: 9, name: "Counterargument", desc: "What would a smart person disagree with?" },
    { id: 10, name: "Nuance", desc: "When is your statement NOT true?" },
    { id: 11, name: "Pyramid Structure", desc: "Conclusion first, reasons after" },
    { id: 12, name: "Chronological Structure", desc: "Beginning, middle, end" },
    { id: 13, name: "Compare & Contrast", desc: "Find the meaningful difference" },
    { id: 14, name: "Problem → Solution", desc: "Name the problem before the fix" },
    { id: 15, name: "Claim → Evidence → Insight", desc: "The full argument loop" },
  ]},
  { system: "Language System", skills: [
    { id: 16, name: "Remove Weak Words", desc: "Cut: really, very, quite, kind of" },
    { id: 17, name: "Replace Vague Words", desc: "Replace: thing, stuff, good, bad" },
    { id: 18, name: "Active Voice", desc: "Who did what to whom?" },
    { id: 19, name: "Parallel Structure", desc: "Match the rhythm of your list" },
    { id: 20, name: "Rhythm", desc: "Mix short and long sentences" },
    { id: 21, name: "Specificity", desc: "Numbers. Names. Examples." },
    { id: 22, name: "Definitions", desc: "Define unfamiliar concepts" },
    { id: 23, name: "Constraints", desc: "Avoid absolute statements" },
    { id: 24, name: "Qualification", desc: "Use: often, usually, likely, rarely" },
    { id: 25, name: "Compression", desc: "Say the same thing in fewer words" },
    { id: 26, name: "Precision Adjectives", desc: "Replace general with exact" },
    { id: 27, name: "Precision Verbs", desc: "The right verb does the heavy lifting" },
    { id: 28, name: "Transition Phrases", desc: "Guide the reader between ideas" },
    { id: 29, name: "Contrast Words", desc: "However, although, despite, yet" },
    { id: 30, name: "Academic Vocabulary", desc: "Words that signal careful thinking" },
  ]},
  { system: "Influence System", skills: [
    { id: 31, name: "Analogy", desc: "Known concept → unknown concept" },
    { id: 32, name: "Contrast", desc: "What it is vs what it is not" },
    { id: 33, name: "Repetition", desc: "Deliberate repetition creates emphasis" },
    { id: 34, name: "Storytelling", desc: "Scene, conflict, resolution" },
    { id: 35, name: "Questions", desc: "Ask what others are thinking" },
    { id: 36, name: "Build on a Point", desc: "Yes, and..." },
    { id: 37, name: "Disagree Respectfully", desc: "I see it differently because..." },
    { id: 38, name: "Humor", desc: "Subvert an expectation" },
    { id: 39, name: "Ask Better Questions", desc: "Questions that advance thinking" },
    { id: 40, name: "Reply with Value", desc: "Add something, don't just react" },
    { id: 41, name: "Explain to a Child", desc: "No jargon allowed" },
    { id: 42, name: "Explain to an Expert", desc: "Assume the baseline" },
    { id: 43, name: "Use Examples", desc: "Abstract → concrete" },
    { id: 44, name: "Use Analogies", desc: "Unknown → known" },
    { id: 45, name: "Chunk Information", desc: "Group before presenting" },
    { id: 46, name: "Write Elegantly", desc: "Beauty in simplicity" },
    { id: 47, name: "Write Persuasively", desc: "Move someone to act" },
    { id: 48, name: "Write Conversationally", desc: "Sound like a human" },
    { id: 49, name: "Write Memorably", desc: "They'll quote you later" },
    { id: 50, name: "Your Own Voice", desc: "Unmistakably you" },
  ]},
];

function GenomeBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: C.textMuted, letterSpacing: "0.05em" }}>{label.toUpperCase()}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: score > 0 ? color : C.textDim }}>{score > 0 ? score : "—"}</span>
      </div>
      <div style={{ height: "4px", background: C.border, borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: score + "%", background: color, borderRadius: "2px", transition: "width 1s ease", boxShadow: score > 0 ? `0 0 8px ${color}` : "none" }} />
      </div>
    </div>
  );
}

function MessageList({ messages, loading, bottomRef }: {
  messages: Message[]; loading: boolean; bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {messages.map((m, i) => (
        <div key={i} style={{ display: "flex", gap: "10px", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
          {m.role === "assistant" && (
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: C.accentDim, border: "1px solid " + C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
              <PenLine size={14} color={C.accentLight} />
            </div>
          )}
          <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? C.accent : C.card, color: m.role === "user" ? C.white : C.text, fontSize: "14px", lineHeight: 1.75, border: m.role === "assistant" ? "1px solid " + C.border : "none", whiteSpace: "pre-wrap", letterSpacing: "0.01em" }}>
            {(m.content ?? "")}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: C.accentDim, border: "1px solid " + C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PenLine size={14} color={C.accentLight} />
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: C.card, border: "1px solid " + C.border, fontSize: "13px", color: C.textMuted, display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: C.accent, animation: "pulse 1s infinite" }} />
            Thinking...
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function RewritePanel({ rewriteInput, setRewriteInput, rewriteContext, setRewriteContext, analyzeAndRewrite, analyzing }: {
  rewriteInput: string; setRewriteInput: (v: string) => void;
  rewriteContext: "casual" | "professional"; setRewriteContext: (v: "casual" | "professional") => void;
  analyzeAndRewrite: () => void; analyzing: boolean;
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Context</div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["casual", "professional"] as const).map(c => (
            <button key={c} onClick={() => setRewriteContext(c)} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: rewriteContext === c ? C.accent : C.card, border: "1px solid " + (rewriteContext === c ? C.accent : C.border), color: rewriteContext === c ? C.white : C.textMuted, fontSize: "13px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s" }}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Your Writing</div>
        <textarea value={rewriteInput} onChange={(e) => setRewriteInput(e.target.value)} placeholder="Paste anything you wrote — an email, a message, a post, a paragraph. The AI will diagnose where communication broke down, rewrite it, and explain every change." rows={10} style={{ width: "100%", background: C.card, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px", color: C.text, fontSize: "16px", outline: "none", resize: "vertical", lineHeight: 1.7, fontFamily: "inherit", boxSizing: "border-box" }} />
        <button onClick={analyzeAndRewrite} disabled={analyzing || !rewriteInput.trim()} style={{ marginTop: "12px", width: "100%", padding: "14px", background: analyzing || !rewriteInput.trim() ? C.card : C.accent, border: "1px solid " + (analyzing || !rewriteInput.trim() ? C.border : C.accent), borderRadius: "10px", color: analyzing || !rewriteInput.trim() ? C.textMuted : C.white, fontSize: "14px", fontWeight: 700, cursor: analyzing || !rewriteInput.trim() ? "not-allowed" : "pointer", letterSpacing: "0.02em" }}>
          {analyzing ? "Analyzing..." : "Diagnose & Rewrite"}
        </button>
      </div>
      <div style={{ background: C.card, borderRadius: "10px", padding: "14px", border: "1px solid " + C.border }}>
        <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>The Pipeline</div>
        {["Observation", "Thought", "Organization", "Language", "Delivery"].map((stage, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: C.textMuted }}>{stage}</span>
            {i < 4 && <div style={{ flex: 1, height: "1px", background: C.border }} />}
          </div>
        ))}
        <div style={{ fontSize: "12px", color: C.textDim, marginTop: "8px", lineHeight: 1.6 }}>Every communication problem happens at exactly ONE of these stages. The AI will tell you which one.</div>
      </div>
    </div>
  );
}

function GenomePanel({ session }: { session: Session }) {
  const g = session.genome;
  const hasData = Object.values(g).some(v => v > 0);
  const getColor = (score: number) => score >= 80 ? C.success : score >= 60 ? C.warning : C.danger;
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {session.mission && (
        <div style={{ background: C.accentDim, borderRadius: "10px", padding: "14px", border: "1px solid " + C.accent }}>
          <div style={{ fontSize: "11px", color: C.accentLight, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Your Mission</div>
          <div style={{ fontSize: "13px", color: C.text, lineHeight: 1.6 }}>{session.mission}</div>
        </div>
      )}
      <div style={{ background: C.card, borderRadius: "10px", padding: "16px", border: "1px solid " + C.border }}>
        <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>Communication Genome</div>
        {!hasData ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.7 }}>Complete the diagnostic session to generate your Communication Genome profile.</div>
          </div>
        ) : (
          <>
            <GenomeBar label="Observation" score={g.observation} color={getColor(g.observation)} />
            <GenomeBar label="Reasoning" score={g.reasoning} color={getColor(g.reasoning)} />
            <GenomeBar label="Organization" score={g.organization} color={getColor(g.organization)} />
            <GenomeBar label="Precision" score={g.precision} color={getColor(g.precision)} />
            <GenomeBar label="Vocabulary" score={g.vocabulary} color={getColor(g.vocabulary)} />
            <GenomeBar label="Conversation" score={g.conversation} color={getColor(g.conversation)} />
            <GenomeBar label="Storytelling" score={g.storytelling} color={getColor(g.storytelling)} />
            <GenomeBar label="Pressure" score={g.pressure} color={getColor(g.pressure)} />
          </>
        )}
      </div>
      {session.pipeline_stage && (
        <div style={{ background: C.card, borderRadius: "10px", padding: "14px", border: "1px solid " + C.border }}>
          <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Current Breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.danger }} />
            <span style={{ fontSize: "14px", color: C.text, fontWeight: 600 }}>{session.pipeline_stage} Stage</span>
          </div>
        </div>
      )}
      {session.recommended_next && (
        <div style={{ background: C.accentDim, borderRadius: "10px", padding: "14px", border: "1px solid " + C.accent, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "11px", color: C.accentLight, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Recommended Next</div>
            <div style={{ fontSize: "14px", color: C.text, fontWeight: 600 }}>{session.recommended_next}</div>
          </div>
          <ChevronRight size={18} color={C.accentLight} />
        </div>
      )}
    </div>
  );
}

function SkillsPanel({ session }: { session: Session }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {SKILLS.map((system, si) => (
        <div key={si}>
          <div style={{ fontSize: "11px", color: C.accentLight, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>{system.system}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {system.skills.map((skill) => {
              const mastered = session.skills_mastered?.includes(skill.name);
              const current = session.current_skill === skill.name;
              return (
                <div key={skill.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: current ? C.accentDim : C.card, border: "1px solid " + (current ? C.accent : mastered ? C.borderLight : C.border), borderRadius: "8px" }}>
                  <div style={{ flexShrink: 0 }}>
                    {mastered ? <CheckCircle2 size={15} color={C.accentLight} /> : current ? <Circle size={15} color={C.accent} /> : <Circle size={15} color={C.textDim} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: mastered ? C.accentLight : current ? C.text : C.textMuted }}>{skill.id}. {skill.name}</div>
                    <div style={{ fontSize: "11px", color: C.textDim, marginTop: "2px" }}>{skill.desc}</div>
                  </div>
                  {current && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session>({
    mode: "DIAGNOSTIC", genome: { ...DEFAULT_GENOME },
    current_skill: "", pipeline_stage: "", skills_mastered: [],
    recommended_next: "", mission: ""
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"train" | "rewrite" | "genome" | "skills">("train");
  const [rewriteInput, setRewriteInput] = useState("");
  const [rewriteContext, setRewriteContext] = useState<"casual" | "professional">("professional");
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const savedMessages = lsGet("et2_messages");
    const savedSession = lsGet("et2_session");
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages) as Message[]); } catch {}
    } else {
      setMessages([{ role: "assistant", content: INITIAL_MESSAGE }]);
    }
    if (savedSession) { try { setSession(JSON.parse(savedSession)); } catch {} }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mergeSession(current: Session, update: any): Session {
    return {
      mode: update.mode ?? current.mode,
      genome: { ...current.genome, ...(update.genome ?? {}) },
      current_skill: update.current_skill ?? current.current_skill,
      pipeline_stage: update.pipeline_stage ?? current.pipeline_stage,
      skills_mastered: update.skills_mastered ?? current.skills_mastered,
      recommended_next: update.recommended_next ?? current.recommended_next,
      mission: update.mission ?? current.mission,
    };
  }

  const sendMessage = useCallback(async (text?: string) => {
    const userMessage = text ?? input.trim();
    if (!userMessage || loading) return;
    setInput("");
    setLoading(true);
    setMessages(prev => {
      const newMessages: Message[] = [...prev, { role: "user", content: userMessage }];
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationHistory: prev.map(m => ({ role: m.role, content: m.content })), session })
      }).then(r => r.json()).then(data => {
        const updatedSession = mergeSession(session, data.sessionUpdate ?? {});
        const updatedMessages: Message[] = [...newMessages, { role: "assistant" as const, content: data.response ?? "" }];
        setSession(updatedSession);
        setMessages(updatedMessages);
        lsSet("et2_messages", JSON.stringify(updatedMessages));
        lsSet("et2_session", JSON.stringify(updatedSession));
        setLoading(false);
      }).catch(() => {
        setMessages(m => [...m, { role: "assistant", content: "Something went wrong. Please try again." }]);
        setLoading(false);
      });
      return newMessages;
    });
  }, [input, loading, session]);

  async function analyzeAndRewrite() {
    if (!rewriteInput.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[REWRITE MODE - ${rewriteContext.toUpperCase()}]\n\n${rewriteInput}`,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          session
        })
      });
      const data = await res.json();
      const updatedSession = mergeSession(session, data.sessionUpdate ?? {});
      const updatedMessages: Message[] = [
        ...messages,
        { role: "user", content: `[Rewrite — ${rewriteContext}]\n\n${rewriteInput}` },
        { role: "assistant" as const, content: data.response ?? "" }
      ];
      setSession(updatedSession);
      setMessages(updatedMessages);
      lsSet("et2_messages", JSON.stringify(updatedMessages));
      lsSet("et2_session", JSON.stringify(updatedSession));
      setActiveTab("train");
    } catch {}
    setAnalyzing(false);
  }

  function handleReset() {
    lsSet("et2_messages", "");
    lsSet("et2_session", "");
    setMessages([{ role: "assistant", content: INITIAL_MESSAGE }]);
    setSession({ mode: "DIAGNOSTIC", genome: { ...DEFAULT_GENOME }, current_skill: "", pipeline_stage: "", skills_mastered: [], recommended_next: "", mission: "" });
    setActiveTab("train");
  }

  const tabs = [
    { id: "train", label: "Train", icon: <BookOpen size={13} /> },
    { id: "rewrite", label: "Rewrite", icon: <PenLine size={13} /> },
    { id: "genome", label: "Genome", icon: <BarChart2 size={13} /> },
    { id: "skills", label: "Skills", icon: <Map size={13} /> },
  ] as const;

  const inputBar = (
    <div style={{ padding: "14px 20px", borderTop: "1px solid " + C.border, background: C.surface, display: "flex", gap: "10px", alignItems: "flex-end", flexShrink: 0 }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        placeholder="Write here... (Shift+Enter for new line)"
        rows={isMobile ? 2 : 3}
        style={{ flex: 1, background: C.card, border: "1px solid " + C.border, borderRadius: "10px", padding: "12px 16px", color: C.text, fontSize: "16px", outline: "none", resize: "none", lineHeight: 1.6, fontFamily: "inherit" }}
      />
      <button
        onClick={() => sendMessage()}
        disabled={loading || !input.trim()}
        style={{ width: "44px", height: "44px", borderRadius: "50%", background: loading || !input.trim() ? C.card : C.accent, border: "1px solid " + (loading || !input.trim() ? C.border : C.accent), display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || !input.trim() ? "not-allowed" : "pointer", flexShrink: 0, marginBottom: "2px" }}
      >
        <Send size={16} color={loading || !input.trim() ? C.textDim : C.white} />
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", overflow: "hidden" }}>
      <style>{`* { box-sizing: border-box; } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: C.surface, borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: C.accentDim, border: "1px solid " + C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PenLine size={18} color={C.accentLight} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>Articulate <span style={{ color: C.accentLight }}>OS</span></div>
            {!isMobile && <div style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.04em" }}>COGNITIVE COMMUNICATION TRAINING</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ padding: "5px 12px", background: C.accentDim, border: "1px solid " + C.accent, borderRadius: "20px" }}>
            <span style={{ fontSize: "11px", color: C.accentLight, fontWeight: 700, letterSpacing: "0.08em" }}>{session.mode}</span>
          </div>
          <button onClick={handleReset} style={{ width: "32px", height: "32px", borderRadius: "8px", background: C.card, border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={13} color={C.textMuted} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: "2px solid " + (activeTab === tab.id ? C.accent : "transparent"), color: activeTab === tab.id ? C.accentLight : C.textMuted, fontSize: "12px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeTab === "train" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <MessageList messages={messages} loading={loading} bottomRef={bottomRef} />
            {inputBar}
          </div>
        )}
        {activeTab === "rewrite" && (
          <RewritePanel
            rewriteInput={rewriteInput}
            setRewriteInput={setRewriteInput}
            rewriteContext={rewriteContext}
            setRewriteContext={setRewriteContext}
            analyzeAndRewrite={analyzeAndRewrite}
            analyzing={analyzing}
          />
        )}
        {activeTab === "genome" && <GenomePanel session={session} />}
        {activeTab === "skills" && <SkillsPanel session={session} />}
      </div>
    </div>
  );
}