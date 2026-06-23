import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Audit, Answers, SECTIONS, statsForAudit, statsForSection, fmtAgo, buildHtml } from "./QAWalkthroughPage";

const C = {
  pink: "#FF0077",
  pinkBg: "#FFE8EE",
  pass: "#008851",
  fail: "#DA3441",
  na: "#7989A6",
  ink: "#101720",
  inkSoft: "#2A3447",
  grey7: "#526482",
  grey5: "#ABB8CF",
  grey4: "#CED9EB",
  grey3: "#DFE7F5",
  grey2: "#EBF1FB",
  grey1: "#F7FAFF",
  white: "#FFFFFF",
};
const FF = "Faktum, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function downloadDoc(audit: Audit) {
  const html = buildHtml({
    url: audit.url,
    pageName: audit.pageName,
    reviewer: audit.reviewer,
    asanaLink: audit.asanaLink,
    startedAt: new Date(audit.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
    finishedAt: new Date(audit.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
    enabledSectionIds: audit.enabledSectionIds,
  }, audit.answers);
  // Wrap with the Office namespace declarations so Word/Google Docs treat the file
  // as a real document rather than a generic HTML page.
  const wordWrapper = html
    .replace(
      "<!doctype html><html lang=\"en\">",
      `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/1999/xhtml">`,
    )
    .replace(
      "<meta charset=\"utf-8\">",
      `<meta charset="utf-8"><meta http-equiv="Content-Type" content="application/vnd.ms-word;charset=utf-8"><meta name="ProgId" content="Word.Document">`,
    );
  const blob = new Blob([wordWrapper], { type: "application/msword" });
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = (audit.pageName || "ux-qa-report").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  a.href = URL.createObjectURL(blob);
  a.download = `${safe}-${stamp}.doc`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SharedQAReport({ shareId }: { shareId: string }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(getFirestore(), "sharedReports", shareId));
        if (cancelled) return;
        if (!snap.exists()) {
          setError("This report doesn't exist or has been removed.");
        } else {
          const data = snap.data() as any;
          if (data?.kind !== "qa-walkthrough" || !data.audit) {
            setError("This share link isn't a UX QA report.");
          } else {
            setAudit(data.audit as Audit);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shareId]);

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.grey1, fontFamily: FF, color: C.grey7 }}>
        Loading report…
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.grey1, fontFamily: FF, padding: 32 }}>
        <div style={{ background: C.white, border: `1px solid ${C.grey4}`, borderRadius: 14, padding: "32px 40px", textAlign: "center", maxWidth: 460 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.pink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>GWI · UX QA report</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Can't open this report</div>
          <p style={{ color: C.grey7, margin: 0 }}>{error || "Report missing."}</p>
        </div>
      </div>
    );
  }

  const stats = statsForAudit(audit);

  return (
    <div style={{ background: C.grey1, minHeight: "100vh", fontFamily: FF, color: C.ink }}>
      <div style={{ borderBottom: `1px solid ${C.grey4}`, background: C.white }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.pink, letterSpacing: "0.12em", textTransform: "uppercase" }}>GWI · UX QA report</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyLink}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 99, border: `1px solid ${C.grey4}`, background: C.white, color: C.ink, fontFamily: FF, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✓ Link copied" : "Copy share link"}
            </button>
            <button onClick={() => downloadDoc(audit)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 99, border: "none", background: C.ink, color: C.white, fontFamily: FF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ↓ Download for Google Docs
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "48px 32px 80px" }}>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 10px" }}>{audit.pageName || audit.url}</h1>
        <a href={audit.url} target="_blank" rel="noreferrer" style={{ fontSize: 15, color: C.pink, textDecoration: "none" }}>{audit.url}</a>
        <div style={{ fontSize: 13, color: C.grey7, marginTop: 10 }}>
          {audit.reviewer && <>Reviewed by <strong style={{ color: C.ink, fontWeight: 600 }}>{audit.reviewer}</strong> · </>}
          {fmtAgo(audit.updatedAt)}
          {audit.asanaLink && (<> · <a href={audit.asanaLink} target="_blank" rel="noreferrer" style={{ color: C.pink, textDecoration: "none" }}>Asana task</a></>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, margin: "32px 0 40px" }}>
          {[
            { v: stats.answered === 0 ? "—" : `${stats.passPct}%`, l: "Pass rate", color: C.ink },
            { v: stats.pass + stats.na, l: "Pass", color: C.pass },
            { v: stats.fail, l: "Fail", color: C.fail },
            { v: `${stats.answered}/${stats.total}`, l: "Answered", color: C.ink },
          ].map((k, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.grey4}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: "-0.02em" }}>{k.v}</div>
              <div style={{ fontSize: 11, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{k.l}</div>
            </div>
          ))}
        </div>

        {(() => {
          const fails: { sectionTitle: string; group: string; text: string; comment?: string }[] = [];
          SECTIONS.filter(s => audit.enabledSectionIds.includes(s.id)).forEach(s => {
            s.items.forEach(it => {
              const ans = (audit.answers as Answers)[it.id];
              if (ans?.status === "fail") {
                fails.push({ sectionTitle: s.title, group: it.group, text: it.text, comment: ans.comment });
              }
            });
          });
          if (!fails.length) return null;
          const byGroup: Record<string, typeof fails> = {};
          for (const f of fails) {
            const k = `${f.sectionTitle} → ${f.group}`;
            if (!byGroup[k]) byGroup[k] = [];
            byGroup[k].push(f);
          }
          return (
            <section style={{ background: C.white, border: `1px solid ${C.grey4}`, borderRadius: 14, padding: "24px 28px", marginBottom: 32 }}>
              <h2 style={{ fontSize: 22, letterSpacing: "-0.02em", marginBottom: 6 }}>Issues to log <span style={{ color: C.fail }}>({fails.length})</span></h2>
              <p style={{ color: C.grey7, fontSize: 13, margin: "0 0 18px" }}>Every Fail logged in this audit. Add these to the sprint backlog.</p>
              {Object.entries(byGroup).map(([k, items]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.fail, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{k}</div>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {items.map((f, i) => (
                      <li key={i} style={{ marginBottom: 8, fontSize: 14, lineHeight: 1.5 }}>
                        {f.text}
                        {f.comment && (
                          <div style={{ marginTop: 4, padding: "6px 10px", background: C.grey2, borderLeft: `3px solid ${C.pink}`, borderRadius: 4, fontSize: 13, color: C.inkSoft }}>{f.comment}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          );
        })()}

        {SECTIONS.filter(s => audit.enabledSectionIds.includes(s.id)).map(s => {
          const ss = statsForSection(audit, s.id);
          let prevGroup: string | null = null;
          return (
            <section key={s.id} style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                <h2 style={{ fontSize: 26, letterSpacing: "-0.02em", margin: 0 }}>{s.title}</h2>
                <span style={{ fontSize: 12, color: C.grey7 }}>{ss.pass} pass · {ss.fail} fail · {ss.na} n/a</span>
              </div>
              <p style={{ color: C.grey7, margin: "0 0 14px", fontSize: 14 }}>{s.intro}</p>
              <div style={{ background: C.white, border: `1px solid ${C.grey4}`, borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <tbody>
                    {s.items.map(it => {
                      const ans = (audit.answers as Answers)[it.id];
                      const status = ans?.status ?? "—";
                      const color = status === "pass" ? C.pass : status === "fail" ? C.fail : C.na;
                      const groupRow = it.group !== prevGroup ? (
                        <tr key={it.id + "-grp"}>
                          <td colSpan={2} style={{ padding: "14px 16px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.grey7, fontWeight: 700, borderBottom: `1px solid ${C.grey3}` }}>{it.group}</td>
                        </tr>
                      ) : null;
                      prevGroup = it.group;
                      return (
                        <>
                          {groupRow}
                          <tr key={it.id}>
                            <td style={{ width: 80, padding: "12px 16px", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", color, borderBottom: `1px solid ${C.grey3}`, verticalAlign: "top", textTransform: "uppercase" }}>{typeof status === "string" ? status : "—"}</td>
                            <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.grey3}` }}>
                              {it.text}
                              {ans?.comment && (
                                <div style={{ marginTop: 6, padding: "8px 12px", background: C.grey2, borderLeft: `3px solid ${C.pink}`, borderRadius: 4, fontSize: 13, color: C.inkSoft }}>{ans.comment}</div>
                              )}
                            </td>
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <footer style={{ marginTop: 64, paddingTop: 24, borderTop: `1px solid ${C.grey4}`, fontSize: 12, color: C.grey7, textAlign: "center" }}>
          Generated by GWI UX QA · {fmtAgo(audit.updatedAt)}
        </footer>
      </div>
    </div>
  );
}
