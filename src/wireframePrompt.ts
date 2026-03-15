// ─────────────────────────────────────────────────────────────────────────────
// WIREFRAME PROMPT — canonical version, intentionally isolated from App.tsx
//
// DO NOT inline this back into App.tsx or edit casually.
// Any changes here directly affect the quality of every generated wireframe.
// Test output thoroughly before committing a new version.
// ─────────────────────────────────────────────────────────────────────────────

export const WIREFRAME_PROMPT_VERSION = "v1 · March 2026";
export const WIREFRAME_PROMPT_DESCRIPTION =
  "High-fidelity stakeholder design concept · GWI brand colours · Real copy · Multi-column layouts · Rec badges";

export function buildWireframePrompt(
  page: { label: string; url: string; actions: any[] },
  personas: { label: string; tagline: string }[],
  rules?: { tov?: string }
): string {
  const recCount = page.actions.length;

  const actionLines = page.actions
    .map(function (a: any, i: number) {
      var line = (i + 1) + ". " + a.text;
      if (a.change) line += "\n   IMPLEMENT: " + a.change;
      if (a.why)    line += "\n   WHY: " + a.why;
      if (a.shows)  line += "\n   CURRENT PROBLEM: " + a.shows;
      return line;
    })
    .join("\n\n");

  const personaNames = personas
    .map(function (p) { return p.label + " (" + p.tagline + ")"; })
    .join(", ");

  let prompt =
    "You are a senior UX designer producing a high-fidelity design concept for the gwi.com " + page.label + " page (" + page.url + "). " +
    "This will be shown to senior stakeholders as the vision for the improved page — it must look real, considered, and persuasive.\n\n" +

    "OBJECTIVE: Design the IMPROVED version of this page with all " + recCount + " recommendations fully implemented. " +
    "Each recommendation must be embodied as a real designed section — not annotated or described, but visually shown as a finished design.\n\n" +

    "RECOMMENDATIONS:\n" + actionLines + "\n\n" +

    "PERSONAS: " + personaNames + ".\n\n" +

    "COPY RULES (critical):\n" +
    "- Write real, specific, compelling copy throughout — actual headlines, subheadlines, CTAs, body text, stat callouts, and labels.\n" +
    "- Every headline must be direct and benefit-led. Every CTA must be action-specific. NO '[PLACEHOLDER]', no lorem ipsum, no generic filler.\n" +
    "- Draw copy ideas directly from the IMPLEMENT and WHY fields above — they tell you exactly what each section needs to say.\n\n" +

    "VISUAL DESIGN:\n" +
    "- Colour: use #FF0077 (GWI pink) for primary CTAs, key highlights and stat callouts. Use #101720 (near-black) for nav and dark hero/section backgrounds with white text. Use #fff and #f7f8fc for body section backgrounds. Use #333/#555 for body text.\n" +
    "- Typography: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif. Strong heading hierarchy: 52-60px hero h1, 32-36px section h2, 18-20px card titles.\n" +
    "- Layouts: hero (headline + sub + 2 CTAs + stat row + supporting visual), 3-col feature grids, 2-col comparison blocks, logo walls, testimonial carousels, sticky sidebar sections. NEVER stack everything in single full-width text columns.\n" +
    "- Image placeholders: grey rectangle (bg:#e0e0e0, border-radius:8px) labelled with specific content type e.g. 'Platform dashboard screenshot', 'Customer headshot'.\n" +
    "- Section label: tiny uppercase grey comment in top-left corner of each section (e.g. // HERO, // SOCIAL PROOF, // FEATURES).\n\n" +

    "BADGE RULE:\n" +
    "Every recommendation MUST have exactly one 💡 badge — all " + recCount + " numbers must appear. " +
    "Place each badge on the section where its UX change is most visible. Max ONE badge per section; if multiple recs affect the same area, split across sub-sections. A missing badge is a critical error.\n" +
    "Badge markup — section outermost div: position:relative + data-section-rec=\"N\". " +
    "Badge: <span data-rec=\"N\" style=\"position:absolute;top:10px;right:10px;background:#FF0077;color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:99px;cursor:pointer\">💡</span>\n\n" +

    "NAVIGATION (desktop): Logo left | Products  Services  Solutions  Resources  Pricing | Sign in free (bg:#FF0077, color:#fff, border-radius:6px, padding:8px 18px). Mobile @media(max-width:767px): logo + burger icon only.\n" +

    "FOOTER (mandatory, always last): data-gwi-footer=\"1\". Dark bg #2a2a2a, text #ccc/#999. " +
    "5-column link grid — Products: Human insights platform, Agent Spark, Learn about our data, Pricing · " +
    "Solutions & Integrations: RLD, Audience activation, Data partnerships, Become a GWI partner · " +
    "Resources: Blog, Reports, Help center · " +
    "Company: Our story, Careers, Press, Contact, Trust center · " +
    "Legal: Terms, Privacy, Cookies, Modern slavery, See all. " +
    "Bottom bar: © GWI + social icon placeholders.\n" +

    "RESPONSIVE: @media(max-width:767px) flex rows→column; grids→1 col; padding→16px; buttons→100% width. Use CSS classes in <style> for overrides.\n" +
    "Full self-contained HTML. <style> in <head>. Max-width 1200px centred. No JavaScript.\n\n" +

    "Output ONLY the raw HTML — no explanation, no markdown fences, nothing else.";

  if (rules && rules.tov) {
    prompt += "\n\nTone of voice — apply these guidelines to ALL copy in this wireframe:\n" + rules.tov;
  }

  return prompt;
}
