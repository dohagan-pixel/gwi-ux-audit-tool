import { useState, useEffect, useRef, useMemo, Fragment } from "react";

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

type Status = "pass" | "fail" | "na";
type Answer = { status: Status; comment?: string };
type Answers = Record<string, Answer>;
type Item = { id: string; text: string; group: string };
type Section = { id: string; number: number; title: string; intro: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "content", number: 1, title: "Content",
    intro: "Does the page say the right things, in the right order, for the right user?",
    items: [
      { id: "content.clarity.1", group: "Clarity & objectives", text: "The page has a single, clear primary objective traceable back to the agreed brief" },
      { id: "content.clarity.2", group: "Clarity & objectives", text: "The hero headline communicates the core value proposition immediately — without needing to scroll" },
      { id: "content.clarity.3", group: "Clarity & objectives", text: "The page addresses the intended user type — not a generic audience" },
      { id: "content.clarity.4", group: "Clarity & objectives", text: "CTAs are specific and action-oriented — not 'Learn more' or 'Click here' in isolation" },
      { id: "content.clarity.5", group: "Clarity & objectives", text: "There is one dominant CTA per section — secondary actions are visually subordinate" },
      { id: "content.clarity.6", group: "Clarity & objectives", text: "The KPI defined in the brief is traceable from the page as built — the right tracking events fire" },
      { id: "content.hierarchy.1", group: "Content hierarchy", text: "The most important content appears highest on the page" },
      { id: "content.hierarchy.2", group: "Content hierarchy", text: "Content is structured for scanning — headings, subheadings, and short paragraphs throughout" },
      { id: "content.hierarchy.3", group: "Content hierarchy", text: "No key message is buried below the fold without an anchor or signpost above it" },
      { id: "content.hierarchy.4", group: "Content hierarchy", text: "Social proof (case studies, logos, stats) is positioned to support conversion moments — not just present" },
      { id: "content.hierarchy.5", group: "Content hierarchy", text: "Content sections flow logically from top to bottom — the page tells a coherent story" },
      { id: "content.copy.1", group: "Copy", text: "Copy is free of jargon the target persona would not recognise" },
      { id: "content.copy.2", group: "Copy", text: "No placeholder text, draft labels, or internal notes are visible in the staged build" },
      { id: "content.copy.3", group: "Copy", text: "All stats and data claims are accurate and sourced where required" },
      { id: "content.copy.4", group: "Copy", text: "Headings are in sentence case — not Title Case or ALL CAPS" },
      { id: "content.copy.5", group: "Copy", text: "Contractions are used where appropriate (it's, you're, we've) in line with GWI tone of voice" },
      { id: "content.copy.6", group: "Copy", text: "Copy is confident and direct — no hedging language ('could help', 'might be', 'potentially')" },
    ],
  },
  {
    id: "design", number: 2, title: "Design & Typography",
    intro: "Does the staged Webflow build match the approved Figma and hold up under scrutiny?",
    items: [
      { id: "design.figma.1", group: "Figma-to-Webflow fidelity", text: "The staged build matches the approved Figma design — reviewed side by side at 1440px desktop" },
      { id: "design.figma.2", group: "Figma-to-Webflow fidelity", text: "No components, colours, or type styles have drifted from the Figma source during build" },
      { id: "design.figma.3", group: "Figma-to-Webflow fidelity", text: "Any deviations from the Figma are intentional and have been flagged and approved before QA" },
      { id: "design.type-faces.1", group: "Typography — typeface & weights", text: "All type is set in Faktum — no system fonts, no substitutions anywhere in the build" },
      { id: "design.type-faces.2", group: "Typography — typeface & weights", text: "Hero headlines use Faktum ExtraBold (800) or Bold (700)" },
      { id: "design.type-faces.3", group: "Typography — typeface & weights", text: "Section headings use Faktum Bold (700)" },
      { id: "design.type-faces.4", group: "Typography — typeface & weights", text: "UI labels, navigation items, and CTA text use Faktum SemiBold (600)" },
      { id: "design.type-faces.5", group: "Typography — typeface & weights", text: "Body copy uses Faktum Regular (400) — Light weight is not used at small sizes" },
      { id: "design.type-faces.6", group: "Typography — typeface & weights", text: "Italic variants are used intentionally and sparingly — not as a substitute for hierarchy" },
      { id: "design.type-sizing.1", group: "Typography — sizing & spacing", text: "Hero H1 sits within the 52–60px range on desktop" },
      { id: "design.type-sizing.2", group: "Typography — sizing & spacing", text: "Section H2 sits within the 32–36px range on desktop" },
      { id: "design.type-sizing.3", group: "Typography — sizing & spacing", text: "Body copy is a minimum of 16px — no smaller type used for primary content" },
      { id: "design.type-sizing.4", group: "Typography — sizing & spacing", text: "Line height is approximately 1.2 for display type and 1.65–1.7 for body copy" },
      { id: "design.type-sizing.5", group: "Typography — sizing & spacing", text: "Headlines use tight tracking (negative letter-spacing) — not default browser tracking" },
      { id: "design.type-sizing.6", group: "Typography — sizing & spacing", text: "Line length does not exceed 75 characters in body copy columns" },
      { id: "design.type-sizing.7", group: "Typography — sizing & spacing", text: "Heading hierarchy is logical and unbroken (H1 → H2 → H3) — no levels skipped" },
      { id: "design.type-sizing.8", group: "Typography — sizing & spacing", text: "There is only one H1 per page" },
      { id: "design.colour-brand.1", group: "Colour — brand usage", text: "Hot Pink (#FF0077) is present as the primary brand colour and is not overused or diluted" },
      { id: "design.colour-brand.2", group: "Colour — brand usage", text: "Hot Pink is not used as a large background fill across full-width sections" },
      { id: "design.colour-brand.3", group: "Colour — brand usage", text: "Black (#000000 / Off Black #101720) and white (#FFFFFF) are the primary supporting colours" },
      { id: "design.colour-brand.4", group: "Colour — brand usage", text: "Secondary colours (Violet #5461C8, Blue #007CB6, Purple #963CBD, Teal #008291) are used as accents only — not competing with Hot Pink" },
      { id: "design.colour-brand.5", group: "Colour — brand usage", text: "Action Green (#00FF88) is used only on CTAs where maximum contrast is needed — one instance per screen maximum, never decorative" },
      { id: "design.colour-brand.6", group: "Colour — brand usage", text: "The pink scale is used appropriately for hover states, highlights, tags, and data callouts" },
      { id: "design.colour-brand.7", group: "Colour — brand usage", text: "The grey scale is used for body text, borders, backgrounds, and structural UI — not applied decoratively" },
      { id: "design.colour-brand.8", group: "Colour — brand usage", text: "Error states use #DA3441, success states #008851, warning states #F6C26D — no ad hoc colours" },
      { id: "design.colour-brand.9", group: "Colour — brand usage", text: "No off-brand or one-off colours appear anywhere in the build" },
      { id: "design.colour-contrast.1", group: "Colour — contrast", text: "White text on Hot Pink background follows the standard CTA pattern" },
      { id: "design.colour-contrast.2", group: "Colour — contrast", text: "Text contrast meets WCAG AA minimum — 4.5:1 for body text, 3:1 for large text (verified with Stark)" },
      { id: "design.colour-contrast.3", group: "Colour — contrast", text: "No text appears over an image or background that causes it to fail contrast" },
      { id: "design.colour-contrast.4", group: "Colour — contrast", text: "Information is not conveyed by colour alone — there is always a secondary visual indicator" },
      { id: "design.layout.1", group: "Layout & spacing", text: "Spacing is consistent — components use design system tokens, not one-off Webflow overrides" },
      { id: "design.layout.2", group: "Layout & spacing", text: "The page does not feel cluttered — white space is used deliberately between sections and elements" },
      { id: "design.layout.3", group: "Layout & spacing", text: "Visual hierarchy guides the eye clearly from headline through body copy to CTA" },
      { id: "design.layout.4", group: "Layout & spacing", text: "All content is aligned to the grid — no elements sitting outside the layout column" },
      { id: "design.layout.5", group: "Layout & spacing", text: "Sections are clearly delineated — the page does not read as one continuous unbroken block" },
      { id: "design.layout.6", group: "Layout & spacing", text: "Body copy blocks are not centre-aligned — centre alignment is only used in short display contexts" },
      { id: "design.layout.7", group: "Layout & spacing", text: "The page has been reviewed at 1280px (primary desktop target per GA4), 1920px (secondary), and 1440px" },
      { id: "design.layout.8", group: "Layout & spacing", text: "The page has been reviewed at 100% zoom and reduced zoom to check overall composition and proportion" },
      { id: "design.buttons.1", group: "Buttons & interactive elements", text: "Button sizes are consistent across the page — no rogue oversized or undersized instances" },
      { id: "design.buttons.2", group: "Buttons & interactive elements", text: "Button hierarchy is clear — primary, secondary, and tertiary styles are visually distinct" },
      { id: "design.buttons.3", group: "Buttons & interactive elements", text: "CTA labels are consistent — the same action is not labelled differently in different places on the same page" },
      { id: "design.buttons.4", group: "Buttons & interactive elements", text: "All buttons and interactive elements have a visible hover state in the Webflow build" },
      { id: "design.buttons.5", group: "Buttons & interactive elements", text: "Links in body copy are visually distinct from surrounding text" },
      { id: "design.buttons.6", group: "Buttons & interactive elements", text: "No button is styled to look like a link, or vice versa, without clear intent" },
      { id: "design.buttons.7", group: "Buttons & interactive elements", text: "Any HubSpot-embedded CTAs or forms match the button style and hierarchy of the surrounding page" },
      { id: "design.imagery-format.1", group: "Imagery — format & quality", text: "All illustrations and icons are SVG — no PNG or JPG used for scalable graphics" },
      { id: "design.imagery-format.2", group: "Imagery — format & quality", text: "Photographic images use WebP format and are compressed appropriately for web" },
      { id: "design.imagery-format.3", group: "Imagery — format & quality", text: "No raster images (PNG/JPG) are used where an SVG equivalent exists" },
      { id: "design.imagery-format.4", group: "Imagery — format & quality", text: "All images are high resolution — no blurring, pixelation, or compression artefacts visible at any viewport" },
      { id: "design.imagery-format.5", group: "Imagery — format & quality", text: "Images are not stretched, squashed, or awkwardly cropped in the Webflow build" },
      { id: "design.imagery-format.6", group: "Imagery — format & quality", text: "SVG files are clean — no embedded raster data, no unnecessary metadata, optimised file size" },
      { id: "design.imagery-brand.1", group: "Imagery — brand & content", text: "Illustrations are from the approved GWI illustration library and are consistent in style" },
      { id: "design.imagery-brand.2", group: "Imagery — brand & content", text: "Illustrations and images feel like they belong to the page — not stock-photo generic" },
      { id: "design.imagery-brand.3", group: "Imagery — brand & content", text: "No text is embedded in any image or illustration — all text is live HTML" },
      { id: "design.imagery-brand.4", group: "Imagery — brand & content", text: "Hero images and key visuals do not obscure or compete with headline copy" },
      { id: "design.imagery-brand.5", group: "Imagery — brand & content", text: "Decorative images have empty alt text (\"\") and are marked as presentational" },
      { id: "design.iconography.1", group: "Iconography", text: "Icons are from the approved GWI icon set and are exported as SVG" },
      { id: "design.iconography.2", group: "Iconography", text: "Icon style is consistent across the page — no mixing of filled, outlined, or different-weight styles" },
      { id: "design.iconography.3", group: "Iconography", text: "Icons are used to support meaning — not as decoration or filler" },
      { id: "design.iconography.4", group: "Iconography", text: "Icons used alongside text are vertically aligned and proportionally sized" },
      { id: "design.logo.1", group: "Logo", text: "The correct logo variant is used for its background — Default on light, On Black on dark" },
      { id: "design.logo.2", group: "Logo", text: "The logo has correct clear space on all sides (equal to the height of the i-dot)" },
      { id: "design.logo.3", group: "Logo", text: "The logo is not stretched, skewed, rotated, recoloured, or modified in any way" },
      { id: "design.logo.4", group: "Logo", text: "The Hot Pink dot on the i is intact and the correct colour (#FF0077)" },
      { id: "design.components.1", group: "Component consistency", text: "All components used are from the GWI Webflow design system — no one-off or bespoke components introduced without sign-off" },
      { id: "design.components.2", group: "Component consistency", text: "Components are used as intended in the design system — no misuse of a pattern for a different purpose" },
      { id: "design.components.3", group: "Component consistency", text: "Any new components introduced follow design system token structure and naming conventions" },
      { id: "design.components.4", group: "Component consistency", text: "The page does not introduce visual patterns that conflict with or would confuse the wider system" },
      { id: "design.components.5", group: "Component consistency", text: "HubSpot-embedded modules (forms, CTAs, dynamic content) are styled to be visually seamless with the surrounding Webflow page" },
      { id: "design.visual-quality.1", group: "Visual quality", text: "No visual inconsistencies visible at 100% zoom — no misaligned elements, ragged spacing, or unintended overlaps" },
      { id: "design.visual-quality.2", group: "Visual quality", text: "Dark and light sections transition cleanly — no unintended colour bleed or gap between sections" },
      { id: "design.visual-quality.3", group: "Visual quality", text: "All borders and dividers are consistent in weight and colour across the page" },
      { id: "design.visual-quality.4", group: "Visual quality", text: "Shadows and elevation are consistent and follow design system usage — not applied ad hoc in Webflow" },
      { id: "design.visual-quality.5", group: "Visual quality", text: "Loading states, empty states, and any conditional content have been checked and look intentional" },
      { id: "design.visual-quality.6", group: "Visual quality", text: "The build has been checked in Chrome, Firefox, and Safari at desktop width" },
    ],
  },
  {
    id: "navigation", number: 3, title: "Navigation & Structure",
    intro: "Can users find what they need and understand where they are?",
    items: [
      { id: "navigation.context.1", group: "Page context", text: "The page title and URL are descriptive and match the page's purpose — confirmed with SEO (Caleb) where relevant" },
      { id: "navigation.context.2", group: "Page context", text: "The user can tell where they are within the site structure from the page alone" },
      { id: "navigation.context.3", group: "Page context", text: "The global navigation correctly reflects the current section with an active state" },
      { id: "navigation.context.4", group: "Page context", text: "Breadcrumbs are present and correct where the page sits deep in the hierarchy" },
      { id: "navigation.journeys.1", group: "Onward journeys", text: "The page has at least one clear next step appropriate for the intended user type" },
      { id: "navigation.journeys.2", group: "Onward journeys", text: "Related content or pages are surfaced and relevant — not generic or templated filler" },
      { id: "navigation.journeys.3", group: "Onward journeys", text: "No dead ends — every exit from the page leads somewhere intentional" },
      { id: "navigation.errors.1", group: "Error states", text: "Any HubSpot forms on the page validate in real time with clear, specific error messages" },
      { id: "navigation.errors.2", group: "Error states", text: "404 and error states for any linked content are handled gracefully" },
    ],
  },
  {
    id: "accessibility", number: 4, title: "Accessibility",
    intro: "Does the page meet WCAG 2.1 AA as a minimum?",
    items: [
      { id: "accessibility.contrast.1", group: "Colour & contrast", text: "Text contrast meets WCAG AA — 4.5:1 for body, 3:1 for large text — checked with Stark plugin" },
      { id: "accessibility.contrast.2", group: "Colour & contrast", text: "Information is not conveyed by colour alone — always a secondary visual indicator present" },
      { id: "accessibility.contrast.3", group: "Colour & contrast", text: "Interactive elements are distinguishable without relying on colour alone" },
      { id: "accessibility.markup.1", group: "Content & markup", text: "All images have descriptive alt text — decorative images have empty alt (\"\") in Webflow settings" },
      { id: "accessibility.markup.2", group: "Content & markup", text: "Heading structure is correct and logical for screen readers — one H1, no levels skipped" },
      { id: "accessibility.markup.3", group: "Content & markup", text: "All links have descriptive labels — not 'click here' or 'read more' used without surrounding context" },
      { id: "accessibility.markup.4", group: "Content & markup", text: "Videos include captions where present on the page" },
      { id: "accessibility.keyboard.1", group: "Interaction & keyboard", text: "All interactive elements are keyboard accessible — tested by tabbing through the staged page" },
      { id: "accessibility.keyboard.2", group: "Interaction & keyboard", text: "Focus order follows a logical reading sequence through the page" },
      { id: "accessibility.keyboard.3", group: "Interaction & keyboard", text: "Focus states are visible on all interactive elements — Webflow default not suppressed in CSS" },
      { id: "accessibility.keyboard.4", group: "Interaction & keyboard", text: "Touch targets are a minimum of 44x44px on mobile — checked in responsive preview" },
    ],
  },
  {
    id: "responsive", number: 5, title: "Responsiveness & Device QA",
    intro: "92.5% of GWI.com traffic is desktop — but mobile (7.2%) still requires a full check. Primary desktop resolution is 1280x1200, not 1440px.",
    items: [
      { id: "mobile.desktop-breakpoints.1", group: "Desktop — primary breakpoints", text: "Page reviewed at 1280px wide — the most common resolution on GWI.com (828k active users)" },
      { id: "mobile.desktop-breakpoints.2", group: "Desktop — primary breakpoints", text: "Page reviewed at 1920px wide — second most common desktop resolution (63k active users)" },
      { id: "mobile.desktop-breakpoints.3", group: "Desktop — primary breakpoints", text: "Page reviewed at 1440px wide — fourth most common and a common design reference (25k active users)" },
      { id: "mobile.desktop-breakpoints.4", group: "Desktop — primary breakpoints", text: "Page reviewed at 800px wide — notably high traffic at 48k users, check nothing breaks at this width" },
      { id: "mobile.desktop-breakpoints.5", group: "Desktop — primary breakpoints", text: "No content is hidden, clipped, or overlapping at any desktop breakpoint" },
      { id: "mobile.desktop-breakpoints.6", group: "Desktop — primary breakpoints", text: "All content is readable and well-proportioned at 1280px — the page is not designed only for wide viewports" },
      { id: "mobile.desktop-browser.1", group: "Desktop — browser QA", text: "Tested in Chrome — dominant browser for GWI.com traffic" },
      { id: "mobile.desktop-browser.2", group: "Desktop — browser QA", text: "Tested in Safari — second most common browser, especially for macOS users (142k active users on Mac)" },
      { id: "mobile.desktop-browser.3", group: "Desktop — browser QA", text: "Tested in Edge — third most common browser in GWI.com data" },
      { id: "mobile.desktop-browser.4", group: "Desktop — browser QA", text: "No rendering inconsistencies between browsers — fonts, spacing, and layout are consistent" },
      { id: "mobile.mobile-breakpoints.1", group: "Mobile layout — breakpoints", text: "Page renders correctly at 390px (iPhone 14/15 standard — primary iOS target)" },
      { id: "mobile.mobile-breakpoints.2", group: "Mobile layout — breakpoints", text: "Page renders correctly at 375px (iPhone SE / older iOS — still widely used)" },
      { id: "mobile.mobile-breakpoints.3", group: "Mobile layout — breakpoints", text: "Page renders correctly at 360px (standard Android viewport)" },
      { id: "mobile.mobile-breakpoints.4", group: "Mobile layout — breakpoints", text: "No content is hidden, clipped, or overlapping at any mobile breakpoint" },
      { id: "mobile.mobile-breakpoints.5", group: "Mobile layout — breakpoints", text: "Column stacking order on mobile follows a logical content hierarchy — not just automatic Webflow reflow" },
      { id: "mobile.mobile-breakpoints.6", group: "Mobile layout — breakpoints", text: "SVGs and images scale correctly on mobile — no stretching, pixelation, or cropping issues" },
      { id: "mobile.mobile-breakpoints.7", group: "Mobile layout — breakpoints", text: "Typography scales appropriately — hero display type does not overwhelm the mobile viewport" },
      { id: "mobile.mobile-breakpoints.8", group: "Mobile layout — breakpoints", text: "Horizontal scrolling does not occur at any mobile breakpoint" },
      { id: "mobile.mobile-interaction.1", group: "Mobile interaction", text: "All CTAs and interactive elements are easily tappable — 44px minimum touch target, no mis-tap risk" },
      { id: "mobile.mobile-interaction.2", group: "Mobile interaction", text: "Hover-state-only interactions have a tap or touch equivalent on mobile" },
      { id: "mobile.mobile-interaction.3", group: "Mobile interaction", text: "HubSpot-embedded forms and modules are fully functional and usable on mobile" },
      { id: "mobile.mobile-interaction.4", group: "Mobile interaction", text: "Page tested on an actual iOS device (not only Webflow or browser responsive preview)" },
      { id: "mobile.mobile-interaction.5", group: "Mobile interaction", text: "Page tested on an actual Android device where possible" },
      { id: "mobile.performance.1", group: "Performance", text: "SVG files are optimised — no bloated file sizes that impact mobile load time" },
      { id: "mobile.performance.2", group: "Performance", text: "Photographic images are compressed and served at appropriate sizes for mobile" },
      { id: "mobile.performance.3", group: "Performance", text: "No layout shift occurs as the page loads — Core Web Vitals CLS score checked via PageSpeed Insights" },
      { id: "mobile.performance.4", group: "Performance", text: "Mobile PageSpeed score is acceptable — target above 70" },
    ],
  },
];

const ALL_ITEMS: (Item & { sectionId: string; sectionTitle: string; sectionNumber: number })[] = SECTIONS.flatMap(
  s => s.items.map(it => ({ ...it, sectionId: s.id, sectionTitle: s.title, sectionNumber: s.number }))
);

function extractViewportWidth(text: string): number | null {
  const m = text.match(/(\d{3,4})\s*px/i);
  if (!m) return null;
  const w = parseInt(m[1], 10);
  if (w < 200 || w > 4000) return null;
  return w;
}

function heightFor(width: number): number {
  if (width >= 1800) return 1000;
  if (width >= 1400) return 900;
  if (width >= 1000) return 800;
  if (width >= 600) return 700;
  return Math.round(width * 2.05);
}

function openSized(url: string, width: number) {
  const height = heightFor(width);
  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
  const feat = `popup=yes,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
  window.open(url, "_blank", feat);
}

type ToolLink = { match: RegExp; label: string; href: (url: string) => string };
const TOOL_LINKS: ToolLink[] = [
  {
    match: /PageSpeed/i,
    label: "Run PageSpeed Insights",
    href: url => `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}&form_factor=mobile`,
  },
];

function findToolLink(text: string): ToolLink | undefined {
  return TOOL_LINKS.find(t => t.match.test(text));
}

type ScanResult = {
  rootPx: number;
  h1: { count: number; sizes: number[]; hero: number | null; families: string[]; weights: number[] };
  h2: { sizes: number[]; dominant: number | null; families: string[]; weights: number[] };
  body: { sizes: number[]; smallest: number | null; families: string[]; weights: number[] };
  fontFamilies: {
    all: { name: string; count: number }[];
    brandedOther: { name: string; count: number }[];
    hasFaktum: boolean;
  };
};

type ScannerCheck = { itemId: string; label: string; run: (d: ScanResult) => { pass: boolean; detail: string } };

const SCANNERS: ScannerCheck[] = [
  {
    itemId: "design.type-sizing.1",
    label: "Scan H1 font-size",
    run: d => {
      const h = d.h1.hero;
      if (h == null) return { pass: false, detail: "Scanner couldn't find a declared font-size for h1 in the page's CSS." };
      const ok = h >= 52 && h <= 60;
      return { pass: ok, detail: `Largest declared h1 font-size is ${h}px. ${ok ? "In the 52–60px range." : "Outside the 52–60px range."}` };
    },
  },
  {
    itemId: "design.type-sizing.2",
    label: "Scan H2 font-size",
    run: d => {
      const h = d.h2.dominant;
      if (h == null) return { pass: false, detail: "Scanner couldn't find a declared font-size for h2 in the page's CSS." };
      const ok = h >= 32 && h <= 36;
      return { pass: ok, detail: `Largest declared h2 font-size is ${h}px. ${ok ? "In the 32–36px range." : "Outside the 32–36px range."}` };
    },
  },
  {
    itemId: "design.type-sizing.3",
    label: "Scan body font-size",
    run: d => {
      const b = d.body.smallest;
      if (b == null) return { pass: false, detail: "Scanner couldn't find a declared body font-size." };
      const ok = b >= 16;
      return { pass: ok, detail: `Smallest declared body font-size is ${b}px. ${ok ? "Meets the 16px minimum." : "Below the 16px minimum."}` };
    },
  },
  {
    itemId: "design.type-sizing.8",
    label: "Count H1 tags",
    run: d => {
      const n = d.h1.count;
      const ok = n === 1;
      return { pass: ok, detail: `Page contains ${n} <h1> tag${n === 1 ? "" : "s"}. ${ok ? "Exactly one — good." : n === 0 ? "Missing — every page should have one." : "More than one — fix the hierarchy."}` };
    },
  },
  {
    itemId: "design.type-faces.1",
    label: "Scan font-families used",
    run: d => {
      const others = d.fontFamilies.brandedOther;
      if (!d.fontFamilies.hasFaktum && !others.length) {
        return { pass: false, detail: "Scanner couldn't find any font-family declarations." };
      }
      if (others.length === 0) {
        return { pass: true, detail: `Only Faktum (or system fallbacks) declared across the page. No other branded typefaces detected.` };
      }
      const list = others.slice(0, 4).map(f => f.name).join(", ");
      return { pass: false, detail: `Non-Faktum branded font${others.length === 1 ? "" : "s"} found: ${list}.` };
    },
  },
  {
    itemId: "design.type-faces.2",
    label: "Scan H1 font-weight",
    run: d => {
      const weights = d.h1.weights;
      const fams = d.h1.families;
      const heaviest = weights.length ? Math.max(...weights) : null;
      const familyOk = !fams.length || fams.some(f => /faktum/i.test(f));
      if (heaviest == null) return { pass: false, detail: "No font-weight declaration found on h1." };
      const weightOk = heaviest === 700 || heaviest === 800;
      const pass = weightOk && familyOk;
      const famNote = fams.length ? `family: ${[...new Set(fams)].join(", ")}` : "family inherits from page";
      return { pass, detail: `H1 heaviest declared weight: ${heaviest} (${famNote}). ${weightOk ? "Matches Bold/ExtraBold." : "Not 700 or 800."}` };
    },
  },
  {
    itemId: "design.type-faces.3",
    label: "Scan H2 font-weight",
    run: d => {
      const weights = d.h2.weights;
      if (!weights.length) return { pass: false, detail: "No font-weight declaration found on h2." };
      const has700 = weights.includes(700);
      return { pass: has700, detail: `H2 declared weights: ${[...new Set(weights)].join(", ")}. ${has700 ? "Includes 700 (Bold)." : "No 700 (Bold) declaration."}` };
    },
  },
  {
    itemId: "design.type-faces.5",
    label: "Scan body font-weight",
    run: d => {
      const weights = d.body.weights;
      if (!weights.length) return { pass: true, detail: "No explicit body font-weight — defaults to 400 (Regular), which is correct." };
      const has400 = weights.includes(400);
      return { pass: has400, detail: `Body declared weights: ${[...new Set(weights)].join(", ")}. ${has400 ? "Includes 400 (Regular)." : "Missing 400 — body may be using a heavier or lighter weight."}` };
    },
  },
];

function findScanner(itemId: string): ScannerCheck | undefined {
  return SCANNERS.find(s => s.itemId === itemId);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

type ExportMeta = {
  url: string; pageName: string; reviewer: string; asanaLink: string;
  startedAt: string; finishedAt: string; enabledSectionIds: string[];
};

function buildHtml(meta: ExportMeta, answers: Answers): string {
  const enabled = meta.enabledSectionIds;
  const enabledSecs = SECTIONS.filter(s => enabled.includes(s.id));
  let pass = 0, fail = 0, na = 0, total = 0;
  enabledSecs.forEach(s => s.items.forEach(it => {
    total++;
    const a = answers[it.id];
    if (!a) return; // untouched — don't count
    if (a.status === "na") na++;
    else if (a.status === "pass") pass++;
    else if (a.status === "fail") fail++;
  }));
  // N/A counts as a pass; only score items the reviewer touched (untouched items don't drag it down).
  const answered = pass + fail + na;
  const passPct = answered ? Math.round(((pass + na) / answered) * 100) : 0;

  const issuesBlock = (() => {
    const groups: Record<string, string[]> = {};
    enabledSecs.forEach(s => s.items.forEach(it => {
      const a = answers[it.id];
      if (a?.status === "fail") {
        const k = `${s.title} → ${it.group}`;
        if (!groups[k]) groups[k] = [];
        groups[k].push(`${it.text}${a.comment ? ` — ${a.comment}` : ""}`);
      }
    }));
    const total = Object.values(groups).reduce((n, arr) => n + arr.length, 0);
    if (total === 0) return "";
    const html = Object.entries(groups).map(([k, items]) =>
      `<section style="margin-bottom:14px"><h3 style="font-size:13px;color:${C.fail};margin-bottom:6px">${escapeHtml(k)}</h3><ul style="padding-left:20px">${items.map(i => `<li style="margin-bottom:4px">${escapeHtml(i)}</li>`).join("")}</ul></section>`
    ).join("");
    return `<section style="margin:32px 0"><h2 style="font-size:22px;letter-spacing:-0.02em">Issues to log (${total})</h2><div style="margin-top:14px">${html}</div></section>`;
  })();

  const sectionsHtml = enabledSecs.map(s => {
    let prevGroup: string | null = null;
    const rows = s.items.map(it => {
      const a = answers[it.id];
      const status = a?.status ?? "na";
      const color = status === "pass" ? C.pass : status === "fail" ? C.fail : C.na;
      const groupRow = it.group !== prevGroup
        ? `<tr><td colspan="2" style="padding:18px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.grey7};font-weight:700">${escapeHtml(it.group)}</td></tr>`
        : "";
      prevGroup = it.group;
      const noteBox = a?.comment
        ? `<div style="margin-top:6px;padding:8px 10px;background:${C.grey2};border-left:3px solid ${C.pink};font-size:13px;border-radius:4px">${escapeHtml(a.comment)}</div>`
        : "";
      return `${groupRow}<tr><td style="width:80px;padding:10px 12px;font-weight:700;font-size:11px;letter-spacing:0.06em;color:${color};border-bottom:1px solid ${C.grey3};vertical-align:top">${status.toUpperCase()}</td><td style="padding:10px 12px;border-bottom:1px solid ${C.grey3}">${escapeHtml(it.text)}${noteBox}</td></tr>`;
    }).join("");
    return `<section style="margin:36px 0"><h2 style="font-size:24px;letter-spacing:-0.02em"><span style="color:${C.pink}">${s.number}.</span> ${escapeHtml(s.title)}</h2><p style="color:${C.grey7};margin:6px 0 16px">${escapeHtml(s.intro)}</p><table style="width:100%;border-collapse:collapse;font-size:14px"><tbody>${rows}</tbody></table></section>`;
  }).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>UX QA report — ${escapeHtml(meta.pageName || meta.url)}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:14px/1.55 'Faktum',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${C.ink};background:#fff;padding:48px;max-width:1100px;margin:0 auto}h1{font-size:36px;letter-spacing:-0.02em;margin:6px 0 14px}.eye{font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:${C.pink};font-weight:700}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0 32px}.k .b{background:${C.grey2};padding:16px;border-radius:12px}.k .v{font-size:28px;font-weight:800;letter-spacing:-0.02em}.k .l{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.grey7};margin-top:4px}</style></head><body><div class="eye">GWI · UX QA report</div><h1>${escapeHtml(meta.pageName || meta.url)}</h1><div style="font-size:13px;color:${C.grey7}"><a href="${escapeHtml(meta.url)}" style="color:${C.pink}">${escapeHtml(meta.url)}</a>${meta.reviewer ? ` · Reviewed by ${escapeHtml(meta.reviewer)}` : ""} · Finished ${escapeHtml(meta.finishedAt)}${meta.asanaLink ? ` · <a href="${escapeHtml(meta.asanaLink)}" style="color:${C.pink}">Asana</a>` : ""}</div><div class="k"><div class="b"><div class="v">${passPct}%</div><div class="l">Pass rate</div></div><div class="b"><div class="v" style="color:${C.pass}">${pass}</div><div class="l">Pass</div></div><div class="b"><div class="v" style="color:${C.fail}">${fail}</div><div class="l">Fail</div></div><div class="b"><div class="v" style="color:${C.na}">${na}</div><div class="l">N/A · skipped</div></div></div>${issuesBlock}${sectionsHtml}<footer style="margin-top:48px;padding-top:20px;border-top:1px solid ${C.grey4};font-size:12px;color:${C.grey7}">Generated by GWI UX QA · ${escapeHtml(meta.finishedAt)}</footer></body></html>`;
}

function buildMarkdown(meta: ExportMeta, answers: Answers): string {
  const enabled = meta.enabledSectionIds;
  const enabledSecs = SECTIONS.filter(s => enabled.includes(s.id));
  let pass = 0, fail = 0, na = 0, total = 0;
  enabledSecs.forEach(s => s.items.forEach(it => {
    total++;
    const a = answers[it.id];
    if (!a) return; // untouched — don't count
    if (a.status === "na") na++;
    else if (a.status === "pass") pass++;
    else if (a.status === "fail") fail++;
  }));
  // N/A counts as a pass; only score items the reviewer touched (untouched items don't drag it down).
  const answered = pass + fail + na;
  const passPct = answered ? Math.round(((pass + na) / answered) * 100) : 0;
  const lines: string[] = [];
  lines.push(`# UX QA report — ${meta.pageName || meta.url}`, "");
  lines.push(`- **URL:** ${meta.url}`);
  lines.push(`- **Reviewer:** ${meta.reviewer || "—"}`);
  if (meta.asanaLink) lines.push(`- **Asana:** ${meta.asanaLink}`);
  lines.push(`- **Started:** ${meta.startedAt}`);
  lines.push(`- **Finished:** ${meta.finishedAt}`, "");
  lines.push(`**Pass rate: ${passPct}%** · ${pass} pass · ${fail} fail · ${na} n/a · ${total} total`, "");
  enabledSecs.forEach(s => {
    lines.push(`## ${s.number}. ${s.title}`, `_${s.intro}_`, "");
    let prev: string | null = null;
    s.items.forEach(it => {
      if (it.group !== prev) { lines.push(`### ${it.group}`); prev = it.group; }
      const a = answers[it.id];
      const status = (a?.status ?? "na").toUpperCase();
      const tag = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "—";
      lines.push(`- ${tag} **${status}** — ${it.text}`);
      if (a?.comment) lines.push(`  > ${a.comment.replace(/\n/g, " ")}`);
    });
    lines.push("");
  });
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// Persistence — audits saved to localStorage so reviewers can resume.
// ─────────────────────────────────────────────────────────────────────────

type SectionStatus = "approved" | "revisit";
type SectionStatuses = Record<string, SectionStatus>;

type Audit = {
  id: string;
  url: string;
  pageName: string;
  reviewer: string;
  asanaLink: string;
  createdAt: number;
  updatedAt: number;
  enabledSectionIds: string[];
  answers: Answers;
  sectionStatuses: SectionStatuses;
};

const STORAGE_KEY = "gwi-ux-qa-walkthroughs/v1";

function loadAudits(): Audit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveAudits(audits: Audit[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(audits)); } catch { /* quota */ }
}

function newAuditId(): string {
  return "qa-" + Math.random().toString(36).slice(2, 9) + "-" + Date.now().toString(36);
}

function statsForAudit(a: Audit) {
  const items = ALL_ITEMS.filter(it => a.enabledSectionIds.includes(it.sectionId));
  let pass = 0, fail = 0, na = 0;
  for (const it of items) {
    const ans = a.answers[it.id];
    if (!ans) continue; // untouched — don't count
    if (ans.status === "na") na++;
    else if (ans.status === "pass") pass++;
    else if (ans.status === "fail") fail++;
  }
  const total = items.length;
  const answered = pass + fail + na; // items touched
  // N/A counts as pass; only score items the reviewer touched.
  const passPct = answered ? Math.round(((pass + na) / answered) * 100) : 0;
  return { pass, fail, na, total, answered, passPct };
}

function statsForSection(a: Audit, sectionId: string) {
  const sec = SECTIONS.find(s => s.id === sectionId);
  if (!sec) return { pass: 0, fail: 0, na: 0, total: 0, answered: 0, passPct: 0 };
  let pass = 0, fail = 0, na = 0;
  for (const it of sec.items) {
    const ans = a.answers[it.id];
    if (!ans) continue; // untouched — don't count
    if (ans.status === "na") na++;
    else if (ans.status === "pass") pass++;
    else if (ans.status === "fail") fail++;
  }
  const total = sec.items.length;
  const answered = pass + fail + na; // items touched
  // N/A counts as pass; only score items the reviewer touched.
  const passPct = answered ? Math.round(((pass + na) / answered) * 100) : 0;
  return { pass, fail, na, total, answered, passPct };
}

type DerivedStatus = "not_started" | "in_progress" | "complete" | "approved" | "revisit";

function sectionDerivedStatus(a: Audit, sectionId: string): DerivedStatus {
  const explicit = a.sectionStatuses[sectionId];
  if (explicit) return explicit;
  const { answered, total } = statsForSection(a, sectionId);
  if (answered === 0) return "not_started";
  if (answered >= total) return "complete";
  return "in_progress";
}

const STATUS_PILL: Record<DerivedStatus, { label: string; bg: string; fg: string; border: string }> = {
  not_started: { label: "Not started", bg: C.grey2, fg: C.grey7, border: C.grey4 },
  in_progress: { label: "In progress", bg: C.pinkBg, fg: C.pink, border: C.pink },
  complete: { label: "All answered", bg: "#E0F2FE", fg: "#0369A1", border: "#7DD3FC" },
  approved: { label: "Approved", bg: "#ECF8F1", fg: C.pass, border: C.pass },
  revisit: { label: "Needs revisit", bg: "#FFF6E8", fg: "#7A4F00", border: "#F5A623" },
};

function fmtAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

export function QAWalkthroughPage() {
  const initialAudits = useMemo(loadAudits, []);
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [phase, setPhase] = useState<"list" | "intro" | "audit" | "questions">("list");
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [cur, setCur] = useState(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const [draftUrl, setDraftUrl] = useState("");
  const [draftPageName, setDraftPageName] = useState("");
  const [draftReviewer, setDraftReviewer] = useState("");
  const [draftAsana, setDraftAsana] = useState("");

  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<Record<string, { pass: boolean; detail: string }>>({});

  const activeAudit = useMemo(() => audits.find(a => a.id === activeAuditId) || null, [audits, activeAuditId]);
  const activeSection = activeSectionId ? SECTIONS.find(s => s.id === activeSectionId) || null : null;
  const items = activeSection ? activeSection.items : [];
  const total = items.length;
  const q = items[cur];

  function persist(updater: (prev: Audit[]) => Audit[]) {
    setAudits(prev => {
      const next = updater(prev);
      saveAudits(next);
      return next;
    });
  }
  function updateActiveAudit(patch: Partial<Audit>) {
    if (!activeAuditId) return;
    persist(prev => prev.map(a => a.id === activeAuditId ? { ...a, ...patch, updatedAt: Date.now() } : a));
  }
  function deleteAuditConfirm(id: string) {
    if (!confirm("Delete this audit? This can't be undone.")) return;
    persist(prev => prev.filter(a => a.id !== id));
    if (activeAuditId === id) { setActiveAuditId(null); setPhase("list"); }
  }
  function startNewAudit() {
    setDraftUrl(""); setDraftPageName(""); setDraftReviewer(""); setDraftAsana("");
    setPhase("intro");
  }
  function createAudit() {
    if (!draftUrl.trim()) return;
    const id = newAuditId();
    const audit: Audit = {
      id,
      url: draftUrl.trim(),
      pageName: draftPageName.trim(),
      reviewer: draftReviewer.trim(),
      asanaLink: draftAsana.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabledSectionIds: SECTIONS.map(s => s.id),
      answers: {},
      sectionStatuses: {},
    };
    persist(prev => [audit, ...prev]);
    setActiveAuditId(id);
    setPhase("audit");
  }
  function openAudit(id: string) {
    setActiveAuditId(id);
    setActiveSectionId(null);
    setCur(0);
    setScanResults({}); setScanData(null); setScanError(null);
    setPhase("audit");
  }
  function openSection(sectionId: string) {
    setActiveSectionId(sectionId);
    setCur(0);
    setPhase("questions");
  }
  function backToList() { setActiveAuditId(null); setActiveSectionId(null); setPhase("list"); }
  function backToAudit() { setActiveSectionId(null); setPhase("audit"); }

  function setAnswer(status: Status) {
    if (!q || !activeAudit) return;
    updateActiveAudit({ answers: { ...activeAudit.answers, [q.id]: { status, comment: activeAudit.answers[q.id]?.comment } } });
  }
  function setCommentText(v: string) {
    if (!q || !activeAudit) return;
    const existing = activeAudit.answers[q.id];
    const status: Status = existing?.status ?? "fail";
    updateActiveAudit({ answers: { ...activeAudit.answers, [q.id]: { status, comment: v } } });
  }
  function nextQ() { if (cur < total - 1) setCur(cur + 1); else backToAudit(); }
  function prevQ() { if (cur > 0) setCur(cur - 1); }
  function skipQ() { setAnswer("na"); nextQ(); }

  function setSectionStatus(sectionId: string, status: SectionStatus) {
    if (!activeAudit) return;
    const curStatus = activeAudit.sectionStatuses[sectionId];
    const next = { ...activeAudit.sectionStatuses };
    if (curStatus === status) delete next[sectionId]; else next[sectionId] = status;
    updateActiveAudit({ sectionStatuses: next });
  }

  useEffect(() => {
    if (phase !== "questions" || !q) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "p" || e.key === "P") setAnswer("pass");
      else if (e.key === "f" || e.key === "F") setAnswer("fail");
      else if (e.key === "ArrowRight" || e.key === "Enter") nextQ();
      else if (e.key === "ArrowLeft") prevQ();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, q, cur, total]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runScanner(scanner: ScannerCheck) {
    if (!activeAudit?.url || !q) return;
    setScanError(null);
    setScanLoading(true);
    try {
      let data = scanData;
      if (!data) {
        const r = await fetch(`/api/scan-typography?url=${encodeURIComponent(activeAudit.url)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        data = j as ScanResult;
        setScanData(data);
      }
      const result = scanner.run(data);
      setScanResults(prev => ({ ...prev, [scanner.itemId]: result }));
      updateActiveAudit({ answers: { ...activeAudit.answers, [q.id]: { status: result.pass ? "pass" : "fail", comment: `Checked by scanner — ${result.detail}` } } });
    } catch (e: any) {
      setScanError(e?.message || "Scanner failed.");
    } finally {
      setScanLoading(false);
    }
  }

  function downloadReport(audit: Audit, format: "html" | "md") {
    const meta: ExportMeta = {
      url: audit.url,
      pageName: audit.pageName,
      reviewer: audit.reviewer,
      asanaLink: audit.asanaLink,
      startedAt: new Date(audit.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
      finishedAt: new Date(audit.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
      enabledSectionIds: audit.enabledSectionIds,
    };
    const content = format === "html" ? buildHtml(meta, audit.answers) : buildMarkdown(meta, audit.answers);
    const blob = new Blob([content], { type: format === "html" ? "text/html" : "text/markdown" });
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    const safe = (audit.pageName || "ux-qa-report").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    a.href = URL.createObjectURL(blob);
    a.download = `${safe}-${stamp}.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "14px 16px", border: `1px solid ${C.grey4}`, borderRadius: 10, background: C.white, fontFamily: FF, fontSize: 15, color: C.ink, boxSizing: "border-box", outline: "none" };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.inkSoft, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6, display: "block" };
  const btnPrimary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 26px", borderRadius: 99, border: "none", background: C.ink, color: C.white, fontFamily: FF, fontSize: 14, fontWeight: 700, cursor: "pointer" };
  const btnGhost: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 10, padding: "11px 20px", borderRadius: 99, border: `1px solid ${C.grey4}`, background: "transparent", color: C.ink, fontFamily: FF, fontSize: 13, fontWeight: 600, cursor: "pointer" };
  const btnSmall: React.CSSProperties = { padding: "8px 14px", fontSize: 12 };

  const cur_a = q && activeAudit ? activeAudit.answers[q.id] : undefined;
  const cur_status = cur_a?.status;
  const cur_comment = cur_a?.comment ?? "";
  const notesVisible = cur_status === "pass" || cur_status === "fail" || cur_comment.length > 0;

  const progress = (() => {
    if (phase === "questions" && total > 0) return Math.round(((cur + 1) / total) * 100);
    if (phase === "audit" && activeAudit) {
      const s = statsForAudit(activeAudit);
      return s.total ? Math.round((s.answered / s.total) * 100) : 0;
    }
    return 0;
  })();

  return (
    <div style={{ background: C.grey1, minHeight: "100%", overflow: "auto", fontFamily: FF, color: C.ink }}>
      <div style={{ height: 3, background: C.grey2 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: C.pink, transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: `1px solid ${C.grey4}`, background: C.white }}>
        <button type="button" onClick={backToList} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FF }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.pink, textTransform: "uppercase", letterSpacing: "0.12em" }}>UX QA · Walkthrough</span>
        </button>
        <div style={{ fontSize: 12, color: C.grey7 }}>
          {phase === "list" && `${audits.length} audit${audits.length === 1 ? "" : "s"}`}
          {phase === "audit" && activeAudit && `${statsForAudit(activeAudit).answered} / ${statsForAudit(activeAudit).total}`}
          {phase === "questions" && `${cur + 1} / ${total}`}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: phase === "list" || phase === "audit" ? 1080 : 760, animation: "qaScreenIn 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
          <style>{`@keyframes qaScreenIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          {phase === "list" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.pink, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.pink }} />
                    Your audits
                  </span>
                  <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "10px 0 6px" }}>
                    Pages you've <em style={{ fontStyle: "normal", color: C.pink }}>QA'd.</em>
                  </h1>
                  <p style={{ fontSize: 15, color: C.grey7, maxWidth: 580 }}>
                    Pick up where you left off. Audits save automatically to this browser — open one to step through a section, mark it approved, or flag it to revisit.
                  </p>
                </div>
                <button onClick={startNewAudit} style={btnPrimary}>+ New audit</button>
              </div>

              {audits.length === 0 ? (
                <div style={{ padding: 64, background: C.white, border: `1px dashed ${C.grey4}`, borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>No audits yet</div>
                  <p style={{ color: C.grey7, marginBottom: 20 }}>Run your first QA walkthrough — it'll save here so you can revisit it later.</p>
                  <button onClick={startNewAudit} style={btnPrimary}>+ Start new audit</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                  {audits.map(a => {
                    const stats = statsForAudit(a);
                    const approvedCount = Object.values(a.sectionStatuses).filter(s => s === "approved").length;
                    const revisitCount = Object.values(a.sectionStatuses).filter(s => s === "revisit").length;
                    const scoreColor = stats.answered === 0 ? C.grey5 : stats.passPct >= 80 ? C.pass : stats.passPct >= 60 ? "#F5A623" : C.fail;
                    return (
                      <div key={a.id} onClick={() => openAudit(a.id)}
                           style={{ background: C.white, border: `1px solid ${C.grey4}`, borderRadius: 14, padding: 22, cursor: "pointer", position: "relative", transition: "border-color 0.15s, box-shadow 0.15s" }}
                           onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.ink; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
                           onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.grey4; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.ink, paddingRight: 28 }}>{a.pageName || a.url}</div>
                        <div style={{ fontSize: 12, color: C.grey7, marginBottom: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.url}</div>
                        <div style={{ display: "flex", gap: 18, alignItems: "flex-end", marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor, lineHeight: 1, letterSpacing: "-0.02em" }}>{stats.answered === 0 ? "—" : `${stats.passPct}%`}</div>
                            <div style={{ fontSize: 10, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Pass rate</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, lineHeight: 1, letterSpacing: "-0.02em" }}>{stats.answered}<span style={{ fontSize: 14, color: C.grey5 }}>/{stats.total}</span></div>
                            <div style={{ fontSize: 10, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Answered</div>
                          </div>
                          {stats.fail > 0 && (
                            <div>
                              <div style={{ fontSize: 24, fontWeight: 800, color: C.fail, lineHeight: 1, letterSpacing: "-0.02em" }}>{stats.fail}</div>
                              <div style={{ fontSize: 10, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Fails</div>
                            </div>
                          )}
                        </div>
                        {(approvedCount > 0 || revisitCount > 0) && (
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {approvedCount > 0 && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#ECF8F1", color: C.pass, fontWeight: 700 }}>✓ {approvedCount} approved</span>}
                            {revisitCount > 0 && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#FFF6E8", color: "#7A4F00", fontWeight: 700 }}>↻ {revisitCount} revisit</span>}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: C.grey5, marginTop: 14, letterSpacing: "0.02em" }}>Updated {fmtAgo(a.updatedAt)}</div>
                        <button onClick={e => { e.stopPropagation(); deleteAuditConfirm(a.id); }}
                                title="Delete audit"
                                style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", padding: 6, color: C.grey5, cursor: "pointer", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {phase === "intro" && (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.pink, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.pink }} />
                New audit
              </span>
              <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "14px 0 16px" }}>
                UX QA <em style={{ fontStyle: "normal", color: C.pink }}>checklist.</em>
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.6, color: C.grey7, maxWidth: 580, marginBottom: 28 }}>
                Paste the staged URL and a name. You'll see all five sections and can step through them in any order — section by section, with progress saved as you go.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="qaw-url" style={labelStyle}>Staged URL</label>
                <input id="qaw-url" placeholder="https://staging.gwi.com/your-page" value={draftUrl} onChange={e => setDraftUrl(e.target.value)} style={inputStyle} autoFocus
                       onFocus={e => { e.currentTarget.style.borderColor = C.pink; e.currentTarget.style.boxShadow = `0 0 0 4px ${C.pinkBg}`; }}
                       onBlur={e => { e.currentTarget.style.borderColor = C.grey4; e.currentTarget.style.boxShadow = "none"; }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label htmlFor="qaw-name" style={labelStyle}>Page / project name</label>
                  <input id="qaw-name" placeholder="e.g. Solutions — Brands" value={draftPageName} onChange={e => setDraftPageName(e.target.value)} style={inputStyle}
                         onFocus={e => { e.currentTarget.style.borderColor = C.pink; }} onBlur={e => { e.currentTarget.style.borderColor = C.grey4; }} />
                </div>
                <div>
                  <label htmlFor="qaw-who" style={labelStyle}>Your name</label>
                  <input id="qaw-who" placeholder="Reviewer" value={draftReviewer} onChange={e => setDraftReviewer(e.target.value)} style={inputStyle}
                         onFocus={e => { e.currentTarget.style.borderColor = C.pink; }} onBlur={e => { e.currentTarget.style.borderColor = C.grey4; }} />
                </div>
              </div>
              <div style={{ marginBottom: 28 }}>
                <label htmlFor="qaw-asana" style={labelStyle}>Asana task link (optional)</label>
                <input id="qaw-asana" placeholder="https://app.asana.com/…" value={draftAsana} onChange={e => setDraftAsana(e.target.value)} style={inputStyle}
                       onFocus={e => { e.currentTarget.style.borderColor = C.pink; }} onBlur={e => { e.currentTarget.style.borderColor = C.grey4; }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" onClick={() => setPhase(audits.length ? "list" : "intro")} style={btnGhost}>← Back</button>
                <button type="button" disabled={!draftUrl.trim()} onClick={createAudit}
                        style={{ ...btnPrimary, opacity: draftUrl.trim() ? 1 : 0.4, cursor: draftUrl.trim() ? "pointer" : "not-allowed" }}>
                  Create audit →
                </button>
              </div>
            </>
          )}

          {phase === "audit" && activeAudit && (() => {
            const a = activeAudit;
            const stats = statsForAudit(a);
            return (
              <>
                <button onClick={backToList} style={{ background: "none", border: "none", cursor: "pointer", color: C.grey7, fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 14 }}>← All audits</button>

                <div style={{ background: C.white, border: `1px solid ${C.grey4}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.pink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.pink }} />
                        Audit
                      </span>
                      <h1 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 6 }}>{a.pageName || a.url}</h1>
                      <a href={a.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.pink, textDecoration: "none" }}>{a.url}</a>
                      <div style={{ fontSize: 12, color: C.grey7, marginTop: 8 }}>
                        {a.reviewer && <>Reviewed by {a.reviewer} · </>}Updated {fmtAgo(a.updatedAt)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => downloadReport(a, "html")} style={{ ...btnGhost, ...btnSmall }}>↓ HTML</button>
                      <button onClick={() => downloadReport(a, "md")} style={{ ...btnGhost, ...btnSmall }}>↓ Markdown</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { v: stats.answered === 0 ? "—" : `${stats.passPct}%`, l: "Pass rate", color: C.ink },
                      { v: stats.pass, l: "Pass", color: C.pass },
                      { v: stats.fail, l: "Fail", color: C.fail },
                      { v: `${stats.answered}/${stats.total}`, l: "Answered", color: C.ink },
                    ].map((k, i) => (
                      <div key={i} style={{ background: C.grey2, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: "-0.02em" }}>{k.v}</div>
                        <div style={{ fontSize: 10, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: "8px 0 14px", letterSpacing: "-0.01em" }}>Sections</h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                  {SECTIONS.filter(s => a.enabledSectionIds.includes(s.id)).map(s => {
                    const ss = statsForSection(a, s.id);
                    const ds = sectionDerivedStatus(a, s.id);
                    const pill = STATUS_PILL[ds];
                    const explicit = a.sectionStatuses[s.id];
                    return (
                      <div key={s.id} style={{ background: C.white, border: `1px solid ${C.grey4}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, background: C.grey2, color: C.grey7, fontWeight: 700, fontSize: 11, letterSpacing: "0.04em" }}>{s.number}</span>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, background: pill.bg, color: pill.fg, border: `1px solid ${pill.border}`, fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>{pill.label}</span>
                          </div>
                          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                          <p style={{ fontSize: 12, color: C.grey7, lineHeight: 1.5, margin: 0 }}>{s.intro}</p>
                        </div>

                        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, lineHeight: 1 }}>{ss.answered}<span style={{ color: C.grey5, fontSize: 12 }}>/{ss.total}</span></div>
                            <div style={{ fontSize: 10, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>Answered</div>
                          </div>
                          {ss.pass > 0 && (
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: C.pass, lineHeight: 1 }}>{ss.pass}</div>
                              <div style={{ fontSize: 10, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>Pass</div>
                            </div>
                          )}
                          {ss.fail > 0 && (
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: C.fail, lineHeight: 1 }}>{ss.fail}</div>
                              <div style={{ fontSize: 10, color: C.grey7, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>Fail</div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                          <button onClick={() => openSection(s.id)} style={{ ...btnPrimary, ...btnSmall, flex: 1, justifyContent: "center" }}>
                            {ss.answered === 0 ? "Start →" : ss.answered >= ss.total ? "Review →" : "Continue →"}
                          </button>
                          <button onClick={() => setSectionStatus(s.id, "approved")} title="Mark approved"
                                  style={{ padding: "8px 10px", borderRadius: 99, border: `1px solid ${explicit === "approved" ? C.pass : C.grey4}`, background: explicit === "approved" ? "#ECF8F1" : "transparent", color: explicit === "approved" ? C.pass : C.grey7, fontFamily: FF, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓</button>
                          <button onClick={() => setSectionStatus(s.id, "revisit")} title="Needs revisit"
                                  style={{ padding: "8px 10px", borderRadius: 99, border: `1px solid ${explicit === "revisit" ? "#F5A623" : C.grey4}`, background: explicit === "revisit" ? "#FFF6E8" : "transparent", color: explicit === "revisit" ? "#7A4F00" : C.grey7, fontFamily: FF, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>↻</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {phase === "questions" && activeAudit && activeSection && q && (
            <>
              <button onClick={backToAudit} style={{ background: "none", border: "none", cursor: "pointer", color: C.grey7, fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 14 }}>← Back to sections</button>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", background: C.pinkBg, color: C.pink, borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {activeSection.number}. {activeSection.title}
                </span>
                <span style={{ fontSize: 12, color: C.grey5, fontWeight: 600 }}>{cur + 1} / {total}</span>
              </div>
              <div style={{ fontSize: 13, color: C.grey7, margin: "12px 0 4px" }}>{q.group}</div>
              <div style={{ fontSize: "clamp(22px, 3.2vw, 28px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.015em", margin: "4px 0 16px" }}>{q.text}</div>

              {(() => {
                if (!activeAudit.url.trim()) return null;
                const w = extractViewportWidth(q.text);
                const tool = findToolLink(q.text);
                const scanner = findScanner(q.id);
                const scanRes = scanResults[q.id];
                if (!w && !tool && !scanner) return null;
                return (
                  <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    {scanner && (
                      <div>
                        <button type="button" onClick={() => runScanner(scanner)} disabled={scanLoading}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.pink}`, background: scanLoading ? C.grey2 : C.pinkBg, color: C.pink, fontFamily: FF, fontSize: 13, fontWeight: 700, cursor: scanLoading ? "wait" : "pointer" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                          </svg>
                          {scanLoading ? "Scanning…" : scanRes ? "Re-run scanner" : scanner.label}
                        </button>
                        {scanRes && (
                          <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, border: `1px solid ${scanRes.pass ? C.pass : C.fail}`, background: scanRes.pass ? "#ECF8F1" : "#FBECEE", fontSize: 13 }}>
                            <strong style={{ color: scanRes.pass ? C.pass : C.fail }}>{scanRes.pass ? "✓ Passed" : "✗ Failed"}</strong>
                            <span style={{ color: C.grey7 }}> — {scanRes.detail}</span>
                          </div>
                        )}
                        {scanError && (
                          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#FBECEE", color: C.fail, fontSize: 12 }}>{scanError}</div>
                        )}
                        <div style={{ fontSize: 11, color: C.grey5, marginTop: 6, letterSpacing: "0.04em" }}>
                          Best-effort static check — reads declared CSS, can't fully resolve runtime values. Override manually if it looks wrong.
                        </div>
                      </div>
                    )}
                    {w && (
                      <div>
                        <button type="button" onClick={() => openSized(activeAudit.url, w)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.pink}`, background: C.pinkBg, color: C.pink, fontFamily: FF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/>
                          </svg>
                          Open {activeAudit.url} at {w}px →
                        </button>
                        <div style={{ fontSize: 11, color: C.grey5, marginTop: 6, letterSpacing: "0.04em" }}>
                          Opens in a sized popup window ({w} × {heightFor(w)}px). Resize manually if your browser overrides.
                        </div>
                      </div>
                    )}
                    {tool && (
                      <div>
                        <a href={tool.href(activeAudit.url)} target="_blank" rel="noreferrer"
                           style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.pink}`, background: C.pinkBg, color: C.pink, fontFamily: FF, fontSize: 13, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/>
                          </svg>
                          {tool.label} →
                        </a>
                        <div style={{ fontSize: 11, color: C.grey5, marginTop: 6, letterSpacing: "0.04em" }}>
                          Opens pagespeed.web.dev in a new tab with your URL pre-filled (mobile profile).
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                {([
                  { key: "pass" as Status, label: "Pass", icon: "✓", short: "P", color: C.pass },
                  { key: "fail" as Status, label: "Fail", icon: "✗", short: "F", color: C.fail },
                ]).map(opt => {
                  const sel = cur_status === opt.key;
                  return (
                    <button key={opt.key} type="button"
                            onClick={() => setAnswer(opt.key)}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: sel ? (opt.key === "pass" ? "#ECF8F1" : "#FBECEE") : C.white, border: `1px solid ${sel ? opt.color : C.grey4}`, borderRadius: 12, padding: "22px 16px", cursor: "pointer", fontFamily: FF, transition: "all 0.15s" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16, marginBottom: 8, background: sel ? opt.color : C.grey2, color: sel ? C.white : C.grey7 }}>{opt.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: C.grey5, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{opt.short}</div>
                    </button>
                  );
                })}
              </div>

              {notesVisible && (
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>{cur_status === "fail" ? "Why is it failing? (optional)" : "Any notes? (optional)"}</label>
                  <textarea ref={taRef} placeholder={cur_status === "fail" ? "Describe what's wrong, where, and what the fix looks like." : "Anything worth flagging for the team."} value={cur_comment} onChange={e => setCommentText(e.target.value)}
                            style={{ width: "100%", minHeight: 96, resize: "vertical", border: `1px solid ${C.grey4}`, borderRadius: 10, padding: "12px 14px", fontFamily: FF, fontSize: 14, color: C.ink, background: C.white, boxSizing: "border-box", outline: "none", lineHeight: 1.5 }}
                            onFocus={e => { e.currentTarget.style.borderColor = C.pink; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.pinkBg}`; }}
                            onBlur={e => { e.currentTarget.style.borderColor = C.grey4; e.currentTarget.style.boxShadow = "none"; }} />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={prevQ} disabled={cur === 0} style={{ ...btnGhost, padding: "9px 16px", fontSize: 12, opacity: cur === 0 ? 0.4 : 1 }}>← Back</button>
                  <button type="button" onClick={skipQ} style={{ ...btnGhost, padding: "9px 16px", fontSize: 12 }}>Skip (N/A)</button>
                </div>
                <button type="button" onClick={nextQ} disabled={!cur_status} style={{ ...btnPrimary, opacity: cur_status ? 1 : 0.4, cursor: cur_status ? "pointer" : "not-allowed" }}>
                  {cur === total - 1 ? "Finish section ✓" : "Next →"}
                </button>
              </div>

              <div style={{ fontSize: 11, color: C.grey5, textAlign: "center", marginTop: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                <Kbd>P</Kbd> pass · <Kbd>F</Kbd> fail · <Kbd>→</Kbd> next · <Kbd>←</Kbd> back
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{ display: "inline-block", padding: "2px 6px", border: `1px solid ${C.grey4}`, borderRadius: 4, background: C.white, fontFamily: "ui-monospace, monospace", fontSize: 10, margin: "0 2px", color: C.ink }}>
      {children}
    </kbd>
  );
}
