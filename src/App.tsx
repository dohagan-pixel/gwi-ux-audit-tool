import { useState, useRef, useEffect } from "react";

import{initializeApp}from'firebase/app';
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut as fbSignOut,onAuthStateChanged,sendPasswordResetEmail,confirmPasswordReset,GoogleAuthProvider,signInWithPopup}from'firebase/auth';
import{getFirestore,doc,getDoc,setDoc,collection,getDocs,deleteDoc}from'firebase/firestore';
const _fc={apiKey:"AIzaSyCtHXxDGqbg4sLnCRRijMR5ozvMG_oKqFM",authDomain:"gwi-ux-audit.firebaseapp.com",projectId:"gwi-ux-audit",storageBucket:"gwi-ux-audit.firebasestorage.app",messagingSenderId:"207583541404",appId:"1:207583541404:web:51f0f1b4bad7dfe258d559"};
const _fba=initializeApp(_fc);const _auth=getAuth(_fba);const _db=getFirestore(_fba);
import { Users, Map, BarChart2, Sparkles, ClipboardList, Cog, RefreshCw, Layers, ArrowRight, Zap, ClipboardCopy, Brain, LayoutDashboard, Home, Puzzle, DollarSign, FileText, Bot, MousePointerClick, GitMerge, ChevronRight, ChevronDown, Check, Trash2, Plus, GripVertical, Pencil, Star, Monitor, Smartphone, Lightbulb, MessageSquare, TrendingUp, AlertTriangle, List, LayoutGrid, Folder, FolderOpen, Heart, Building2, BookOpen } from "lucide-react";

const C = {
  pink:"#FF0077",white:"#FFFFFF",black:"#101720",offBlack:"#2A3447",
  grey8:"#526482",grey7:"#7989A6",grey6:"#ABB8CF",grey5:"#CED9EB",
  grey4:"#DFE7F5",grey3:"#EBF1FB",grey2:"#F7FAFF",
  violetDark:"#333688",violet:"#5461C8",violetLight:"#9BA0E2",violetBg:"#BFBFEF",
  blueDark:"#003C71",blueMed:"#007CB6",blueLight:"#7BCCF1",blueBg:"#B9E1F9",
  purpleDark:"#512179",purple:"#963CBD",purpleLight:"#C693DC",purpleBg:"#DEBEEB",
  tealDark:"#154B5B",teal:"#008291",tealLight:"#78D5E1",tealBg:"#B9E9ED",
};

const DEFAULT_PERSONA_COLORS = [
  {bg:C.purpleBg,border:C.purple,text:C.purpleDark,tag:{bg:C.purpleBg,text:C.purpleDark}},
  {bg:C.tealBg,border:C.teal,text:C.tealDark,tag:{bg:C.tealBg,text:C.tealDark}},
  {bg:C.blueBg,border:C.blueMed,text:C.blueDark,tag:{bg:C.blueBg,text:C.blueDark}},
  {bg:C.violetBg,border:C.violet,text:C.violetDark,tag:{bg:C.violetBg,text:C.violetDark}},
  {bg:"#FFEEF6",border:C.pink,text:"#880040",tag:{bg:"#FFEEF6",text:"#880040"}},
  {bg:C.tealBg,border:C.teal,text:C.tealDark,tag:{bg:C.tealBg,text:C.tealDark}},
];

const STAGE_COLORS = {
  "Awareness":{bg:C.grey3,text:C.grey8,border:C.grey5},
  "Evaluation":{bg:C.grey3,text:C.grey8,border:C.grey5},
  "Consideration":{bg:C.grey3,text:C.grey8,border:C.grey5},
  "Acquisition":{bg:C.grey3,text:C.grey8,border:C.grey5},
  "Purchase":{bg:C.grey3,text:C.grey8,border:C.grey5},
  "First User Adoption":{bg:C.white,text:C.pink,border:C.pink},
  "Retention":{bg:C.white,text:C.grey8,border:C.grey5},
  "Expansion":{bg:C.white,text:C.grey8,border:C.grey5},
  "Advocacy":{bg:C.white,text:C.grey8,border:C.grey5},
};

const signupRoleConfig = {
  owned:{label:"Website owns this",bg:"#E6F9F2",border:"#00A86B",text:"#005C3B",pill:{bg:C.black,text:"#fff"}},
  bridge:{label:"Website sets expectation",bg:"#FFF8E6",border:"#F5A623",text:"#7A4F00",pill:{bg:C.pink,text:"#fff"}},
  handoff:{label:"Website hands off",bg:"#FFF0E6",border:"#E07B2A",text:"#7A3A00",pill:{bg:C.offBlack,text:"#fff"}},
  none:{label:"Outside website funnel",bg:C.grey3,border:C.grey5,text:C.grey7,pill:{bg:C.grey5,text:C.grey8}},
};

const MAPPING_ITEMS = [
  {id:"mapping",label:"Journeys Overview"},
  {id:"journey",label:"Journey Mapper"},
  {id:"lifecycle",label:"Customer Mapping"},
  {id:"affinity",label:"Affinity Map"},
  {id:"flows",label:"User Flows"},
];

const INIT_STAGES = [
  {id:"awareness",label:"Awareness",highlight:false,signupRole:"owned",signupNote:"The website is the only tool here. SEO, paid, social — all roads lead to a landing page.",gwi_goal:"Attract prospects to the website.",hmw:"How might we support professionals in their search for affordable alternatives to custom or industry reports?",push:"A need to understand their market",pull:"Globally significant answers on demand",habit:"Grabbing free data from existing reports",anxiety:"Cost is prohibitive"},
  {id:"evaluation",label:"Evaluation",highlight:false,signupRole:"owned",signupNote:"The website must answer is this legit and relevant to me fast.",gwi_goal:"Agree to a Demo with a member of GWI staff.",hmw:"How might we show professionals that quarterly syndicated data has the coverage and depth they need?",push:"Need to understand what strategy to choose",pull:"Industry and coverage is right, more up to date than others",habit:"Overcoming grabbing something from existing sources during time pressure",anxiety:"Cost will be prohibitive and the sales person might waste my time"},
  {id:"consideration",label:"Consideration",highlight:false,signupRole:"owned",signupNote:"This is the click. The website needs to reduce every anxiety blocking Sign up for free.",gwi_goal:"Agree to a trial or skip to purchase.",hmw:"How might we support a professional in diving deeply into the pros and cons of GWI?",push:"Need for a new solution to drive their business",pull:"Promise of fresh, accurate data",habit:"Fitting the task into existing workload while under time pressure",anxiety:"This service will not cater to my needs; sceptical of syndicated data"},
  {id:"acquisition",label:"Acquisition",highlight:false,signupRole:"handoff",signupNote:"For free sign-up, this is the product's job not the website's.",gwi_goal:"Agree to move to purchase and contract negotiation.",hmw:"How might we help a new team get the most out of the short period of time they have?",push:"Need for a solution that gives answers to ongoing, niche questions",pull:"Promise of an easy to use, on-demand complete data set",habit:"Need to continue everything they already do; no time to learn a new tool",anxiety:"Cost will be high — will we use it enough to get value for money?"},
  {id:"purchase",label:"Purchase",highlight:false,signupRole:"none",signupNote:"Outside the free sign-up funnel entirely. This is a sales-led motion.",gwi_goal:"All conditions in place to allow GWI to switch on the platform for the new client.",hmw:"How might we support the contract signing process by ensuring clear, honest communication?",push:"The business can see how this tool will support its success",pull:"GWI is a trustworthy company; at every point I have seen what I needed and it was easy",habit:"Company due diligence process was not aligned with GWI contract process",anxiety:"The cost is still too much; my organisation did not see the benefit"},
  {id:"first-user-adoption",label:"First User Adoption",highlight:true,signupRole:"bridge",signupNote:"The website indirectly owns this. What the website promised shapes what the user expects when they log in.",gwi_goal:"User generates initial value from the data via the platform without a large interaction with GWI staff.",hmw:"How might we support a user in getting an audience and understanding their behaviour into their company presentation tool?",push:"Need the strategy they are working on to be solid and convincing",pull:"GWI will show that their strategy is based on fact and is clever",habit:"They need to work at speed and cannot spend time learning a new tool",anxiety:"The way this tool works is overwhelming and I cannot get my head around it"},
  {id:"retention",label:"Retention",highlight:false,signupRole:"none",signupNote:"Outside the free sign-up funnel. Owned by product and CS.",gwi_goal:"The close relationship with GWI is evidenced through the client buying more datasets and/or seats.",hmw:"How might we continuously enable users to expand their understanding of people?",push:"Continuous need for new ideas requires a place to go for answers",pull:"GWI data is the most up-to-date and robust of its kind",habit:"Too busy to actively find out what is new",anxiety:"Hard to use everything I am paying for together"},
  {id:"expansion",label:"Expansion",highlight:false,signupRole:"none",signupNote:"Outside the free sign-up funnel. Owned by sales and CS.",gwi_goal:"New contract with increased value signed and healthy ongoing relationship.",hmw:"How might we show our users that they can stay powerful while reducing the load on them?",push:"Too many people or reasons to use GWI but not enough time to meet that need",pull:"The interface lets colleagues answer their own questions without unhelpful scepticism",habit:"It is easier to be a gatekeeper as it slows the rate of demand on me",anxiety:"Colleagues do not have the experience to use the tool and I do not have time to teach them"},
  {id:"advocacy",label:"Advocacy",highlight:false,signupRole:"none",signupNote:"Outside the free sign-up funnel. Owned by marketing and CS.",gwi_goal:"User is happy to speak publicly about the value they receive from GWI.",hmw:"How might we enable our users to show their skills and the value their organisation brings?",push:"Speaking openly about GWI brings attention and status for them",pull:"GWI worldwide reputation increases their own reputation",habit:"Daily tasks do not include advocacy; GWI not well-known enough as a partner",anxiety:"Worried clients or employers see value as coming from the tool rather than their own skills"},
];
const INIT_VERTICALS = [
  {id:"media-agency",label:"Media Agency",desc:"Planning and buying media on behalf of brand clients. Typically work at pace across multiple client accounts.",useCase:"Audience segmentation and media planning — using GWI to size audiences, validate channel strategies, and build consumer profiles for briefs.",concern:"Whether GWI covers niche or regional audiences and whether data is fresh enough for fast-moving campaign cycles."},
  {id:"creative-agency",label:"Creative Agency",desc:"Developing campaigns, creative strategy, and brand positioning for clients. Need cultural and consumer insight quickly.",useCase:"Cultural trends and consumer mindsets to fuel creative briefs, positioning statements, and strategic territories.",concern:"Whether syndicated data is specific enough to replace or supplement primary research — and how citable the findings are in client work."},
  {id:"brand-corporate",label:"Brand / Corporate",desc:"In-house marketing, strategy, and insights teams at companies. Own a brand and need to understand their consumers and competitive landscape.",useCase:"Consumer behaviour tracking, brand health monitoring, and competitive benchmarking across markets.",concern:"Depth of data for specific product categories, integration with existing tools, and whether the platform can replace expensive custom studies."},
  {id:"media-owner",label:"Media Owner / Publisher",desc:"Selling audiences to advertisers. Need to prove the quality and scale of their audience with credible third-party data.",useCase:"Third-party audience validation and cross-platform consumer insights to strengthen advertiser pitch decks and rate cards.",concern:"Whether GWI data aligns with their own first-party data and how frequently survey waves are updated."},
  {id:"consultancy",label:"Consultancy / Research",desc:"Strategy and research consultancies delivering insight-driven recommendations to clients. Often cite sources directly.",useCase:"Rapid consumer landscape analysis and trend substantiation to support client deliverables and thought leadership.",concern:"Methodology transparency, survey sample sizes, and whether findings can be cited confidently in client-facing or published work."},
  {id:"tech-platform",label:"Technology / Platform",desc:"Tech companies and platforms building products or driving commercial strategy. Need consumer insight to guide decisions.",useCase:"Digital behaviour patterns, platform adoption data, and audience demographics to inform product roadmaps and go-to-market strategy.",concern:"Granularity of technology-specific survey questions and whether the data is updated frequently enough to track a fast-moving space."},
];

const INIT_PERSONAS = [
  {id:"insight-guru",label:"Insight Guru",tagline:"They won't trust the data until they've tested it themselves",traits:["Obsessive","Rigorous","Accurate","Expert","Validator","Storyteller","Pioneer"],website:"Proof before commitment. They want to validate GWI data quality and methodology rigorously before talking to anyone. Clear, detailed answers on data coverage, sample sizes, and robustness. A way to self-serve the platform trial access without needing a sales call. Technical depth on RLD, API, and data fusions. Case studies from research teams, not just marketing.",who:"Skilled experts working in data, research and insights roles. Obsessed with data accuracy and data value.",what:"Find the so what in data, mining information for meaning. Leverage data to support better business decision-making.",drives:"Understanding how audiences are changing and why. Making absolutely sure the advice they give or conclusions they draw are accurate and reliable.",bugs:"Data partners who do not offer services exactly when, how and where they need them.",grabs:"The sheer accuracy, value, quality, and trustworthiness of GWI data. On-demand insights to highly-specific business questions.",concerns:"Data trustworthiness — if the data is wrong, they are wrong. Balancing depth and useability.",whyUs:"Deep audience research and trend analysis to drive new business, marketing strategy, product development and competitive advantage.",platform:"Creates audiences and charts for colleagues. Uses crosstabs and flips between the audience builder and chart builder to double-check audiences.",entry:"Organic search, methodology checks, data quality reviews, audience analysis tools",colorIndex:0},
  {id:"inspiration-hunter",label:"Inspiration Hunter",tagline:"Fast thinkers who use data to spark ideas, not prove them",traits:["Practical","Creative","Driven","Firestarter","Commercial","Challenger","Disruptor","Seeker"],website:"Instant inspiration — they want to land on the site and immediately see something surprising or exciting. Bold, visual, fast-loading content like trend reports, Zeitgeist, and Spark demos.",who:"An ideas person who does their own analysis to inform their thinking. Not obsessed with accuracy; good enough probably is good enough.",what:"Bring an inspiring, challenger perspective to situations. Kick-start creative thinking and deliver commercial breakthroughs.",drives:"Opportunities for innovative thinking. Working with creative teams. Big thinking from asking questions no one has asked before.",bugs:"Dry data sources and platforms. Data resources that take forever to find. Lack of speed.",grabs:"How GWI fuels and validates strategic thinking. The sheer accessibility of insights.",concerns:"Platform usability and speed to insight. Ability to find surprising insights fast.",whyUs:"Audience profiling and trends analysis to drive marketing strategy and competitive advantage.",platform:"Pulls insights together to tell stories — letting the data guide them.",entry:"Social share, newsletter, colleague referral, trend report",colorIndex:1},
  {id:"commercial-closer",label:"Commercial Closer",tagline:"They use GWI to win pitches, not to do research",traits:["Pragmatic","Flexible","Motivated","Proactive","Strategic","Methodical","Commercial","Busy"],website:"Fast proof of ROI — a recognisable client name or a strong ROI stat within seconds of landing. Ready-made reports and case studies they can take straight into a client meeting or pitch.",who:"Commercially focussed, external facing business people. Want to improve their understanding of audiences to raise awareness, drive consideration and inspire growth.",what:"Take an evidence-based approach. Cross-check everything to understand what is working, what is not and what is next.",drives:"ROI, ROI, and more ROI. Nothing matters as much as delivering demonstrable returns for their internal and external customers.",bugs:"Siloed insights teams. Lack of time. Working with insights that are not up to date.",grabs:"How GWI helps them identify and nail opportunities fast. Easy access to insights and pre-made reports.",concerns:"Trustworthiness of their data source. Platform coverage and geographic reach.",whyUs:"Audience research to define marketing strategy and drive competitive advantage.",entry:"Paid search, LinkedIn ad, sales outreach email",colorIndex:2},
  {id:"strategic-leader",label:"Strategic Leader",tagline:"The budget holder who never actually logs into the platform",traits:["Commercial","Customer-Centric","Ambitious","Savvy","Analytical","Senior","Future-Focused"],website:"Instant credibility signals — recognisable logos, impressive scale stats, and industry authority within seconds of landing. No noise, no clutter: they are scanning, not reading.",who:"Very senior, future-focused, savvy business partners. Strong on business strategy and analytics. NOT direct users of GWI — their teams do that.",what:"Assess and reassess the value of the platform. Make budgetary decisions on which partners to use.",drives:"Customer-centricity. Shaping strategic direction. Being unique and setting themselves apart from competition.",bugs:"Unrealistic expectations around time. Inability to integrate data sources. Underutilised tools that sit on the shelf.",grabs:"Rock-solid, data-driven strategic decisions. Enhancing their existing data ecosystem.",concerns:"Trustworthiness of their data source. One version of the truth. Geographic reach. Licensing and ROI.",whyUs:"Marketing strategy, product development, and competitive advantage.",entry:"Word of mouth, event, CAB referral",colorIndex:3},
  {id:"data-integrator",label:"Data Integrator",tagline:"If it doesn't integrate, it doesn't exist for them",traits:["Analytical","Strategic","Technical","Innovative","Collaborative","Efficiency-Driven","Security-Conscious"],website:"A dedicated technical destination — they need an /api page that actually answers questions about endpoints, data schema, authentication, and rate limits without contacting sales.",who:"Data integrators lead or influence how data flows through a business. Job titles: heads of data products, developers, CTOs, VPs of data, AI leads.",what:"Embed human understanding directly into systems, tools, and AI workflows.",drives:"Efficiency and eliminating manual reporting. Enabling AI tools with real human context.",bugs:"Siloed data access that slows teams down. AI agents lacking real-world human context.",grabs:"GWI API integrates directly into internal tools, CRMs, dashboards, and AI systems.",concerns:"Security, compliance, and data governance. GDPR and ISO certification. API reliability and uptime.",whyUs:"To embed reliable, continuously-updated consumer data directly into their organisation tools and AI workflows.",entry:"API docs search, MCP integrations, consumer data pipeline tools",colorIndex:4},
];

const INIT_PAGES = [
  {url:"/",label:"Homepage",section:"Products",hidden:false},
  {url:"/platform",label:"Platform",section:"Products",hidden:false},
  {url:"/platform/spark",label:"Agent Spark",section:"Products",hidden:false},
  {url:"/api",label:"Integrations / API",section:"Products",hidden:false},
  {url:"/data",label:"Learn About Our Data",section:"Products",hidden:false},
  {url:"/services",label:"Services",section:"Services",hidden:false},
  {url:"/services/brand-tracking",label:"Brand Tracking",section:"Services",hidden:false},
  {url:"/services/market-segmentation",label:"Market Segmentation",section:"Services",hidden:false},
  {url:"/services/audience-profiling",label:"Audience Profiling",section:"Services",hidden:false},
  {url:"/services/analysis-and-reporting-services",label:"Analyst Hours",section:"Services",hidden:false},
  {url:"/teams",label:"Teams (hub)",section:"Solutions - Teams",hidden:false},
  {url:"/teams/marketing",label:"Marketing Team",section:"Solutions - Teams",hidden:false},
  {url:"/teams/sales",label:"Sales Team",section:"Solutions - Teams",hidden:false},
  {url:"/teams/product-development",label:"Product Team",section:"Solutions - Teams",hidden:false},
  {url:"/teams/research",label:"Research Team",section:"Solutions - Teams",hidden:false},
  {url:"/use-cases",label:"Use Cases (hub)",section:"Solutions - Use Cases",hidden:false},
  {url:"/use-cases/agency-pitching",label:"Agency Pitching",section:"Solutions - Use Cases",hidden:false},
  {url:"/use-cases/media-planning-data",label:"Media Planning",section:"Solutions - Use Cases",hidden:false},
  {url:"/use-cases/content-strategy",label:"Content Strategy",section:"Solutions - Use Cases",hidden:false},
  {url:"/use-cases/sponsorship-partnership",label:"Sponsorship and Partnerships",section:"Solutions - Use Cases",hidden:false},
  {url:"/retail-media",label:"Retail Media",section:"Solutions - Use Cases",hidden:false},
  {url:"https://gwi.ai",label:"Gen AI (gwi.ai)",section:"Solutions - Use Cases",hidden:false},
  {url:"/industries",label:"Industries (hub)",section:"Solutions - Industries",hidden:false},
  {url:"/industries/agencies",label:"Agencies",section:"Solutions - Industries",hidden:false},
  {url:"/industries/media",label:"Media",section:"Solutions - Industries",hidden:false},
  {url:"/industries/sports",label:"Sports",section:"Solutions - Industries",hidden:false},
  {url:"/industries/gaming",label:"Gaming",section:"Solutions - Industries",hidden:false},
  {url:"/industries/finance",label:"Finance",section:"Solutions - Industries",hidden:false},
  {url:"/industries/retail",label:"Retail",section:"Solutions - Industries",hidden:false},
  {url:"/blog",label:"Blog",section:"Resources",hidden:false},
  {url:"/reports",label:"Reports",section:"Resources",hidden:false},
  {url:"/webinars",label:"Webinars and Events",section:"Resources",hidden:false},
  {url:"/case-studies",label:"Case Studies",section:"Resources",hidden:false},
  {url:"/connecting-the-dots",label:"2026 Consumer Trends",section:"Resources",hidden:false},
  {url:"/on-the-dot-subscribe",label:"Newsletter",section:"Resources",hidden:false},
  {url:"/pricing",label:"Pricing",section:"Pricing",hidden:false},
  {url:"/respondent-level-data",label:"Respondent Level Data",section:"Footer - Solutions",hidden:false},
  {url:"/audience-activation",label:"Audience Activation",section:"Footer - Solutions",hidden:false},
  {url:"/fusions",label:"Data Partnerships (Fusions)",section:"Footer - Solutions",hidden:false},
  {url:"/partners",label:"Become a Partner",section:"Footer - Solutions",hidden:false},
  {url:"/about-us",label:"About Us",section:"Footer - Company",hidden:false},
  {url:"/careers",label:"Careers",section:"Footer - Company",hidden:false},
  {url:"/press-center",label:"Press",section:"Footer - Company",hidden:false},
  {url:"/contact",label:"Contact",section:"Footer - Company",hidden:false},
  {url:"https://trust.gwi.com",label:"Trust Center",section:"Footer - Company",hidden:false},
];

const INIT_JOURNEYS = {
  "insight-guru":[
    {stage:"Awareness",pages:["/data","/blog","/reports"],note:"Searches for data quality/methodology comparisons. Lands on /data or a report."},
    {stage:"Evaluation",pages:["/data","/platform","/respondent-level-data","/fusions"],note:"Deep dives on methodology, RLD, and data depth before agreeing to anything."},
    {stage:"Consideration",pages:["/platform","/pricing","/case-studies","/teams/research"],note:"Tests platform rigorously. Reads research team page to see if GWI gets them."},
    {stage:"Acquisition",pages:["/platform","/api","/respondent-level-data"],note:"Leads platform trial for the team. Pushes into technical corners of the product."},
    {stage:"First User Adoption",pages:["/platform","/platform/spark","/respondent-level-data"],note:"First hands-on user. Anxiety: overwhelmed by breadth. Needs to export a chart fast."},
    {stage:"Retention",pages:["/reports","/connecting-the-dots","/webinars"],note:"Returns for new datasets, trend reports. Needs GWI to keep surprising them."},
    {stage:"Expansion",pages:["/teams/research","/api","/fusions"],note:"Gatekeeper. May push for API access or data fusions to expand team use."},
    {stage:"Advocacy",pages:["/case-studies","/partners"],note:"Quiet advocate. May contribute to a case study or refer peers."},
  ],
  "inspiration-hunter":[
    {stage:"Awareness",pages:["/connecting-the-dots","/reports","/blog","/on-the-dot-subscribe"],note:"Arrives via a shared trend piece. Immediately engaged if content is bold and visual."},
    {stage:"Evaluation",pages:["/platform/spark","/platform","/use-cases/content-strategy","/use-cases/agency-pitching"],note:"Speed-evaluates. If Spark does not deliver instant value they move on."},
    {stage:"Consideration",pages:["/platform/spark","/services/audience-profiling","/pricing"],note:"Good enough threshold is low. Needs one wow moment to proceed."},
    {stage:"Acquisition",pages:["/platform/spark","/platform"],note:"Trial driven by creative exploration. Needs to see something shareable in session 1."},
    {stage:"First User Adoption",pages:["/platform/spark","/platform"],note:"Highest churn risk stage. If they cannot create something useful in 10 mins, they are gone."},
    {stage:"Retention",pages:["/connecting-the-dots","/reports","/webinars","/on-the-dot-subscribe","/blog"],note:"Retained by content. Newsletter and trend reports are their re-engagement hook."},
    {stage:"Advocacy",pages:["/case-studies","/on-the-dot-subscribe"],note:"Natural sharers. Most likely to post a GWI stat or report on LinkedIn unprompted."},
  ],
  "commercial-closer":[
    {stage:"Awareness",pages:["/","/use-cases/agency-pitching","/industries/agencies","/case-studies"],note:"Responds to ROI-focused ads. Scans homepage for credibility, then hunts for case studies."},
    {stage:"Evaluation",pages:["/case-studies","/use-cases/agency-pitching","/teams/sales","/reports"],note:"Needs a recognisable brand name and an ROI stat within 30 seconds."},
    {stage:"Consideration",pages:["/pricing","/platform/spark","/services/analysis-and-reporting-services"],note:"Checks pricing and whether Spark gives fast answers."},
    {stage:"Acquisition",pages:["/platform","/platform/spark","/use-cases"],note:"Drives internal buy-in. Uses platform trial to show stakeholders a quick win."},
    {stage:"Purchase",pages:["/pricing","/contact","/about-us"],note:"Negotiating value. Needs to justify spend."},
    {stage:"First User Adoption",pages:["/platform/spark","/reports","/use-cases/agency-pitching"],note:"Uses GWI for pitch prep and audience snapshots. Spark is their go-to tool."},
    {stage:"Retention",pages:["/case-studies","/reports","/webinars"],note:"Retained if they keep winning pitches."},
    {stage:"Advocacy",pages:["/case-studies","/partners"],note:"Advocates loudly after a big win."},
  ],
  "strategic-leader":[
    {stage:"Evaluation",pages:["/","/about-us","/press-center","/case-studies"],note:"Homepage is a credibility gate. If logos and numbers do not impress in 5 seconds, they are out."},
    {stage:"Acquisition",pages:["/industries","/fusions","/partners","/services"],note:"Checks ecosystem fit. Does GWI integrate with existing data stack?"},
    {stage:"Purchase",pages:["/pricing","/contact","/about-us","https://trust.gwi.com"],note:"Budget holder. Legal/procurement team checks Trust Center."},
    {stage:"Expansion",pages:["/fusions","/api","/services","/partners"],note:"Signs off on expanded contracts."},
    {stage:"Advocacy",pages:["/case-studies","/press-center","/partners"],note:"Highest-value advocate. CAB participation, speaking at events."},
  ],
  "data-integrator":[
    {stage:"Awareness",pages:["/api","https://gwi.ai","/platform/spark"],note:"Arrives via technical search. /api is their homepage."},
    {stage:"Evaluation",pages:["/api","/data","/respondent-level-data","/fusions"],note:"Technical evaluation: REST endpoints, data schema, delivery format."},
    {stage:"Consideration",pages:["/api","https://trust.gwi.com","/pricing","/respondent-level-data"],note:"Runs POC. Checks GDPR/ISO compliance before raising internally."},
    {stage:"Acquisition",pages:["/api","/platform","/fusions"],note:"Builds a proof-of-concept integration."},
    {stage:"Purchase",pages:["https://trust.gwi.com","/pricing","/contact"],note:"Supports due diligence with security/compliance evidence."},
    {stage:"First User Adoption",pages:["/api","https://gwi.ai","/platform/spark"],note:"First adoption IS the integration build. API setup, pipeline config, Spark MCP connection."},
    {stage:"Retention",pages:["/api","/fusions","/audience-activation"],note:"Retained by reliability of the data feed and API stability."},
    {stage:"Expansion",pages:["/audience-activation","/fusions","/partners"],note:"Expands by enabling more internal teams to consume GWI data via their pipelines."},
  ],
};

const INIT_AUDIT = [
  {id:"aa-1",url:"/",label:"Homepage",priority:"Critical",personas:["insight-guru","inspiration-hunter","commercial-closer","strategic-leader"],stage:"Evaluation",issue:"",actions:[
    {id:"a1",text:"Add self-selection entry point (3 persona paths)",description:"The homepage currently treats all visitors the same.",status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"a2",text:"Flip primary CTA to Sign up for free",description:"The current dominant CTA is Book a demo, which creates friction for self-serve personas.",status:"todo",metric:"Homepage sign-up CTA click rate",source:"GA4",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"a3",text:"Add proof point above fold about time to value",description:"Anxiety around time investment is one of the biggest blockers at the Awareness and Consideration stages.",status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
  ]},
  {id:"aa-2",url:"/platform",label:"Platform",priority:"Critical",personas:["insight-guru","inspiration-hunter","commercial-closer","data-integrator"],stage:"First User Adoption",issue:"",actions:[
    {id:"b1",text:"Add Start here section per persona type",description:"Without a clear starting point, new users face blank-canvas anxiety.",status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"b2",text:"Include first-session use case walkthroughs",description:"First-session drop-off is highest when users do not know what to do next.",status:"todo",metric:"Scroll depth on /platform",source:"Hotjar",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"b3",text:"Link directly to free sign-up with persona-specific copy",description:"The free sign-up CTA on /platform is currently generic.",status:"todo",metric:"Free sign-up CTR from /platform",source:"GA4",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
  ]},
  {id:"aa-3",url:"/platform/spark",label:"Agent Spark",priority:"High",personas:["inspiration-hunter","commercial-closer","data-integrator"],stage:"Evaluation",issue:"",actions:[
    {id:"c1",text:"Add example prompts per persona",description:"Spark value proposition is entirely dependent on users knowing what to ask.",status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"c2",text:"Show sample output for each prompt",description:"Example prompts alone are not enough.",status:"todo",metric:"Time on page /platform/spark",source:"GA4",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"c3",text:"Reduce friction to Try it free CTA",description:"The path from landing on /platform/spark to actually trying Spark should be as short as possible.",status:"todo",metric:"Sign-up CTR from /platform/spark",source:"GA4",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
  ]},
  {id:"aa-4",url:"/pricing",label:"Pricing",priority:"High",personas:["insight-guru","inspiration-hunter","commercial-closer","strategic-leader"],stage:"Consideration",issue:"",actions:[
    {id:"d1",text:"Add value framing per persona type",description:"Pricing pages that only show numbers create anxiety.",status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"d2",text:"Include what you get in your first month section",description:"First-month expectations are a major source of anxiety at the Consideration stage.",status:"todo",metric:"Scroll depth on /pricing",source:"Hotjar",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"d3",text:"Make free trial CTA more prominent than demo CTA",description:"On the current pricing page, the demo CTA dominates.",status:"todo",metric:"Free trial vs demo CTA ratio clicks",source:"GA4",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
  ]},
  {id:"aa-5",url:"/data",label:"Learn About Our Data",priority:"High",personas:["insight-guru","data-integrator"],stage:"Evaluation",issue:"",actions:[
    {id:"e1",text:"Add sample size and wave frequency detail",description:"Insight Gurus need to validate GWI data before they will consider it credible.",status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"e2",text:"Include data schema documentation for Data Integrators",description:"Data Integrators treat /data as a technical reference page.",status:"todo",metric:"Bounce rate on /data",source:"GA4",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
    {id:"e3",text:"Add independent validation and benchmarking references",description:"Both Insight Gurus and Data Integrators are sceptical by nature.",status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""},
  ]},
];

const HOTJAR_SECTIONS = [
  {name:"Homepage",pages:[{url:"gwi.com",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com&match=simple_match&device=desktop&type=movement"}]},
  {name:"Products",pages:[
    {url:"/platform",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fplatform&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fplatform&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fplatform&match=simple_match&device=desktop&type=movement"},
    {url:"/platform/spark",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fplatform%2Fspark&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fplatform%2Fspark&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fplatform%2Fspark&match=simple_match&device=desktop&type=movement"},
    {url:"/api",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fapi&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fapi&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fapi&match=simple_match&device=desktop&type=movement"},
    {url:"/data",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fdata&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fdata&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fdata&match=simple_match&device=desktop&type=movement"},
  ]},
  {name:"Resources",pages:[
    {url:"/blog",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fblog&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fblog&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fblog&match=simple_match&device=desktop&type=movement"},
    {url:"/reports",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Freports&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Freports&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Freports&match=simple_match&device=desktop&type=movement"},
    {url:"/pricing",scroll:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fpricing&match=simple_match&device=desktop&type=scroll",click:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fpricing&match=simple_match&device=desktop&type=click",move:"https://insights.hotjar.com/sites/3099535/heatmap/view?url=https%3A%2F%2Fwww.gwi.com%2Fpricing&match=simple_match&device=desktop&type=movement"},
  ]},
];

const INIT_GA_CARDS=[
  {id:"gc1",iconKey:"LayoutDashboard",title:"Platform and Feature Pages",desc:"Sessions, engagement rate, average engagement time, and views per session.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/zqCwkMKSSEuB9-O-s-tLNw"},
  {id:"gc2",iconKey:"Home",title:"Homepage Analysis",desc:"Sessions, engagement, and behavioural data for the GWI homepage.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/Pg63LOrrQLS8h8kuA2bYMg"},
  {id:"gc3",iconKey:"Puzzle",title:"Solutions Pages",desc:"Sessions, engagement, and behavioural data across GWI solutions pages.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/dI-KdK2ASwCvUtoX0wC9oA"},
  {id:"gc4",iconKey:"DollarSign",title:"Pricing Analysis",desc:"Sessions, engagement, and behavioural data for the GWI pricing page.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/7gRXm5blRPSajwjCEzhMUQ"},
  {id:"gc5",iconKey:"FileText",title:"Blog Sessions",desc:"Sessions, engagement, and behavioural data across GWI blog pages.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/qKrjcBr5TZ2Xr_lUgj58Ng"},
  {id:"gc6",iconKey:"Bot",title:"GWI AI Website",desc:"Sessions, engagement, and behavioural data for the GWI AI website.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/NeKzWN5mSf6saQwx6_o-zQ"},
  {id:"gc7",iconKey:"MousePointerClick",title:"Sessions, Conversions and Clicks",desc:"Overview of sessions, conversion events, and click interactions.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/XEFy2ePlQUyqSdYPHZDXiA"},
  {id:"gc8",iconKey:"GitMerge",title:"Free Plan Signup Funnel",desc:"Step-by-step funnel analysis tracking users through the free plan signup flow.",url:"https://analytics.google.com/analytics/web/#/analysis/a10233579p256535728/edit/5hAyXm17SZml3BX8Lb0BAg"},
];
const CARD_ICON_KEYS=["LayoutDashboard","Home","Puzzle","DollarSign","FileText","Bot","MousePointerClick","GitMerge","BarChart2","Layers","Zap","Brain"];
const INIT_WIREFRAME_RULES={tov:""};

const INIT_CLIENTS=[
  {id:"cl-1",name:"20ten",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-2",name:"Advanced Sponsorship Insights",type:"Corporate",sector:"Consulting",hasCase:true,notes:""},
  {id:"cl-3",name:"Avery Dennison",type:"Corporate",sector:"Retail",hasCase:true,notes:""},
  {id:"cl-4",name:"Barefoot Proximity",type:"Agency",sector:"Agency - Networked",hasCase:true,notes:""},
  {id:"cl-5",name:"BBDO (New York)",type:"Agency",sector:"Agency - Networked",hasCase:true,notes:""},
  {id:"cl-6",name:"BCM Group",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-7",name:"BIGEYE",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-8",name:"Blis",type:"Agency",sector:"Agency - Networked",hasCase:true,notes:""},
  {id:"cl-9",name:"Blizzard Entertainment",type:"Corporate",sector:"Gaming",hasCase:true,notes:""},
  {id:"cl-10",name:"Bright Shift",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-11",name:"Brilliant Noise",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:"No longer a client"},
  {id:"cl-12",name:"City Football Group",type:"Corporate",sector:"Sports",hasCase:true,notes:""},
  {id:"cl-13",name:"City Pantry",type:"Corporate",sector:"Consumer Packaged Goods",hasCase:true,notes:""},
  {id:"cl-14",name:"Dentsu",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-15",name:"Eurosport",type:"Agency",sector:"Agency - Networked",hasCase:true,notes:""},
  {id:"cl-16",name:"EA",type:"Corporate",sector:"Gaming",hasCase:false,notes:""},
  {id:"cl-17",name:"Edelman",type:"Agency",sector:"Agency - Independent",hasCase:false,notes:""},
  {id:"cl-18",name:"First and First Consulting",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-19",name:"Flipboard",type:"Media",sector:"Platforms",hasCase:true,notes:""},
  {id:"cl-20",name:"Fnatic",type:"Media",sector:"Gaming",hasCase:true,notes:""},
  {id:"cl-21",name:"Google",type:"Media",sector:"Platforms",hasCase:false,notes:""},
  {id:"cl-22",name:"GroupM",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-23",name:"HAVAS",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-24",name:"IAAF Athletics",type:"Corporate",sector:"Sports",hasCase:false,notes:""},
  {id:"cl-25",name:"Imille",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-26",name:"IPG Media Brands",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-27",name:"Kiwi Digital",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-28",name:"LinkedIn",type:"Media",sector:"Platforms",hasCase:false,notes:""},
  {id:"cl-29",name:"Match Media Group",type:"Media",sector:"Ad-Tech",hasCase:true,notes:""},
  {id:"cl-30",name:"MediaCom",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-31",name:"Microsoft",type:"Media",sector:"Platforms",hasCase:false,notes:""},
  {id:"cl-32",name:"Mobily",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-33",name:"Ogilvy",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-34",name:"OMD",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-35",name:"OmnicomGroup",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-36",name:"Passion Digital",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-37",name:"Pernod Ricard",type:"Corporate",sector:"Consumer Packaged Goods",hasCase:true,notes:""},
  {id:"cl-38",name:"Publicis Group",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-39",name:"Snapchat",type:"Media",sector:"Platforms",hasCase:false,notes:""},
  {id:"cl-40",name:"Sony Pictures Television",type:"Media",sector:"Media & Entertainment",hasCase:true,notes:""},
  {id:"cl-41",name:"Spotify",type:"Media",sector:"Platforms",hasCase:false,notes:""},
  {id:"cl-42",name:"The Guardian",type:"Media",sector:"Publishing",hasCase:false,notes:""},
  {id:"cl-43",name:"TMW Unlimited",type:"Agency",sector:"Agency - Independent",hasCase:false,notes:""},
  {id:"cl-44",name:"X (Twitter)",type:"Media",sector:"Platforms",hasCase:false,notes:""},
  {id:"cl-45",name:"VaynerMedia",type:"Agency",sector:"Agency - Independent",hasCase:false,notes:""},
  {id:"cl-46",name:"VERB Brands",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-47",name:"We Are Social",type:"Agency",sector:"Agency - Independent",hasCase:false,notes:""},
  {id:"cl-48",name:"WPP",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-49",name:"YouthWorks (Turkey)",type:"Agency",sector:"Agency - Independent",hasCase:true,notes:""},
  {id:"cl-50",name:"Zenith",type:"Agency",sector:"Agency - Networked",hasCase:false,notes:""},
  {id:"cl-51",name:"Zenith (London)",type:"Agency",sector:"Agency - Networked",hasCase:true,notes:""},
];

const INIT_CASE_STUDIES=[
  {id:"case-1",company:"Barefoot Proximity",sector:"Agency - Networked",outcome:"Reduced research turnaround by 35%, cut team size from 5 people to 1-2 per project. Needed the why behind audience behaviour, not just what and where.",metric:"35% turnaround improvement",quote:"What we were missing was the why. With GWI, we can get smarter, quicker. We can do more in less time, with fewer resources."},
  {id:"case-2",company:"Kiwi Digital",sector:"Agency - Independent",outcome:"Cut project turnaround from 5 days to 2 days using GWI to build 360-degree consumer views combining demographics, attitudes, lifestyles and emotional drivers.",metric:"3 days saved per project",quote:"GWI has totally changed our strategy — we're now totally oriented towards our target audiences."},
  {id:"case-3",company:"Brilliant Noise",sector:"Agency - Independent",outcome:"Won new business using GWI as the proof point and core of the pitch. Augmented existing personas without paying for primary research.",metric:"New business won on pitch",quote:"Being able to augment existing personas without paying for primary research is amazing. GWI has a better UX and is better at modelling personas than any other tool."},
  {id:"case-4",company:"VERB Brands",sector:"Agency - Independent",outcome:"Commissioned GWI custom research on 1,000+ affluent consumers, turned it into a free 'State of Luxe' report that became a lead generation engine.",metric:"36% inbound leads increase · 221% YoY lead growth · 53% website traffic lift · 27% email list growth",quote:"GWI elevates our business offering, providing additional insight for client strategies."},
  {id:"case-5",company:"Nextdoor",sector:"Platforms",outcome:"Built a public Insights Hub combining first-party neighbour data with GWI consumer research to educate advertisers and prove audience value.",metric:"197% increase in year-on-year web page views",quote:"GWI's data helps support and validate our internal first-party data."},
  {id:"case-6",company:"City Football Group",sector:"Sports",outcome:"Gave all 8 clubs equal access to consistent market research, transforming sponsorship pitch narratives with granular, market-specific data previously out of reach for smaller clubs.",metric:"Sponsorship growth across all markets",quote:"GWI provides equality of data across all markets — it's transformed the way we talk about our sponsorship offering for clubs that previously had no research budget."},
];

function getPersonaColor(p){return DEFAULT_PERSONA_COLORS[p.colorIndex%DEFAULT_PERSONA_COLORS.length];}

function useWidth(){
  var [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(function(){function h(){setW(window.innerWidth);}window.addEventListener("resize",h);return function(){window.removeEventListener("resize",h);};},[]);
  return w;
}

function fetchIssueSummary(page,onSuccess,onDone){
  var lines=page.actions.map(function(a,i){return(i+1)+". "+a.text+(a.description?" - "+a.description:"");});
  var prompt="You are a UX strategist. Write a 2-3 sentence diagnostic summary of the core UX problem on this page. Be direct and sharp. Do not list actions, synthesise the underlying issue. Page: "+page.label+" ("+page.url+"). Actions: "+lines.join(". ")+". Return only the paragraph.";
  var gaPath=page.gaPath||(page.name?'/'+page.name.toLowerCase().replace(/home(page)?/i,'/').replace(/\s+/g,'-').replace(/^\/([^/])/,'/$1'):'/');
  fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pagePath:gaPath})}).then(function(r){return r.json();}).then(function(ga){var gaSection='';if(ga.available&&ga.deviceData&&ga.deviceData.rows&&ga.deviceData.rows.length){var rows=ga.deviceData.rows;var total=rows.reduce(function(s,r){return s+parseInt(r.metricValues[0].value||0);},0);var devices=rows.map(function(r){return r.dimensionValues[0].value+': '+Math.round(parseInt(r.metricValues[0].value)/(total||1)*100)+'%';}).join(', ');var br=(parseFloat(rows[0].metricValues[1].value||0)*100).toFixed(1)+'%';var dur=Math.round(parseFloat(rows[0].metricValues[2].value||0))+'s';var pv=rows.reduce(function(s,r){return s+parseInt(r.metricValues[3].value||0);},0);var src=ga.sourceData&&ga.sourceData.rows?ga.sourceData.rows.slice(0,3).map(function(r){return r.dimensionValues[0].value;}).join(', '):'N/A';gaSection='\n\nReal Google Analytics data for this page (last 30 days):\n- Page views: '+pv+'\n- Bounce rate: '+br+'\n- Avg session duration: '+dur+'\n- Device split: '+devices+'\n- Top traffic sources: '+src+'\nUse these real user behaviour metrics to add specific data-backed observations to your analysis.';}doFetch(prompt+gaSection);}).catch(function(){doFetch(prompt);});function doFetch(p){fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:p,max_tokens:2000})}).then(function(r){var ct=r.headers.get("content-type")||"";if(!ct.includes("text/event-stream")){r.json().then(function(data){onSuccess(data.content&&data.content[0]?data.content[0].text||"":"");onDone();}).catch(function(){onDone();});return;}var reader=r.body.getReader();var decoder=new TextDecoder();var fullText="";var buf="";var finished=false;function finish(t){if(finished)return;finished=true;onSuccess(t||"");onDone();}function pump(){reader.read().then(function(res){if(res.done){finish(fullText);return;}buf+=decoder.decode(res.value,{stream:true});var lines=buf.split("\n");buf=lines.pop()||"";lines.forEach(function(line){if(!line.startsWith("data: "))return;var data=line.slice(6).trim();if(data==="[DONE]"){finish(fullText);return;}try{var parsed=JSON.parse(data);if(parsed.error){finished=true;onDone();return;}if(parsed.t)fullText+=parsed.t;}catch(e){}});if(!finished)pump();}).catch(function(){onDone();});}pump();}).catch(function(){onDone();});}
}

function DropLine(){return <div style={{height:3,background:C.pink,borderRadius:99,margin:"2px 0"}}/>;}

function useDragList(items,setItems){
  var dragIdx=useRef(null);
  var [dropIdx,setDropIdx]=useState(null);
  function onDragStart(i){dragIdx.current=i;}
  function onDragOver(e,i){e.preventDefault();if(i!==dragIdx.current)setDropIdx(i);}
  function onDrop(e,i){e.preventDefault();var from=dragIdx.current;if(from===null||from===i){setDropIdx(null);return;}var next=items.slice();var moved=next.splice(from,1)[0];next.splice(i,0,moved);setItems(next);dragIdx.current=null;setDropIdx(null);}
  function onDragEnd(){dragIdx.current=null;setDropIdx(null);}
  return{dropIdx,onDragStart,onDragOver,onDrop,onDragEnd};
}

function Dropdown({label,items,activeView,setView,onLabelClick,forceActive}){
  var [open,setOpen]=useState(false);
  var ref=useRef(null);
  var isActive=!!(forceActive||items.some(function(i){return i.id===activeView;}));
  useEffect(function(){function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}document.addEventListener("mousedown",h);return function(){document.removeEventListener("mousedown",h);};},[]);
  return(
    <div ref={ref} style={{position:"relative",display:"flex"}}>
      <button onClick={function(){if(onLabelClick)onLabelClick();else setOpen(!open);}} style={{padding:"6px 8px 6px 12px",borderRadius:open||isActive?"8px 0 0 8px":"8px",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:isActive?C.pink:open?C.grey3:"transparent",color:isActive?C.white:C.grey7}}>{label}</button>
      <button onClick={function(){setOpen(!open);}} style={{padding:"6px 8px 6px 4px",borderRadius:open||isActive?"0 8px 8px 0":"8px",fontSize:10,border:"none",cursor:"pointer",background:isActive?C.pink:open?C.grey3:"transparent",color:isActive?C.white:C.grey7,opacity:0.7}}>{open?"▲":"▼"}</button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,background:C.white,border:"1px solid "+C.grey4,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",zIndex:100,minWidth:200,overflow:"hidden",whiteSpace:"nowrap"}}>
          {items.map(function(item){return(
            <button key={item.id} onClick={function(){setView(item.id);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"10px 16px",fontSize:13,fontWeight:600,background:activeView===item.id?C.grey3:"transparent",color:activeView===item.id?C.black:C.grey8,border:"none",cursor:"pointer"}}
              onMouseEnter={function(e){if(activeView!==item.id)e.currentTarget.style.background=C.grey3;}}
              onMouseLeave={function(e){if(activeView!==item.id)e.currentTarget.style.background="transparent";}}>
              {item.label}
            </button>
          );})}
        </div>
      )}
    </div>
  );
}

function UserMenu({user,onSignOut,onSettings,onFeedbackPage,onGuide,activeView}){
  var [open,setOpen]=useState(false);
  var ref=useRef(null);
  useEffect(function(){function h(e){if(ref.current&&!(ref.current as any).contains(e.target))setOpen(false);}document.addEventListener("mousedown",h);return function(){document.removeEventListener("mousedown",h);};},[]);
  var initials=(user.email||"?").slice(0,2).toUpperCase();
  var _item={display:"block" as const,width:"100%",textAlign:"left" as const,padding:"10px 16px",fontSize:13,fontWeight:600,background:"transparent",border:"none",cursor:"pointer",color:C.grey8};
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={function(){setOpen(!open);}} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",border:"none",cursor:"pointer",padding:"4px 2px",borderRadius:8}}>
        <div style={{width:28,height:28,borderRadius:"50%",overflow:"hidden",border:"2px solid "+(open||activeView==="settings"||activeView==="feedback"?C.pink:C.offBlack),background:C.offBlack,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {user.photoURL?<img src={user.photoURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:11,fontWeight:700,color:C.white,lineHeight:1}}>{initials}</span>}
        </div>
        <Cog size={13} color={open||activeView==="settings"||activeView==="feedback"?C.pink:C.grey7}/>
        <ChevronDown size={11} color={open||activeView==="settings"||activeView==="feedback"?C.pink:C.grey7} style={{transition:"transform 0.15s",transform:open?"rotate(180deg)":"rotate(0deg)"}}/>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:C.white,border:"1px solid "+C.grey4,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",zIndex:200,minWidth:200,overflow:"hidden",whiteSpace:"nowrap"}}>
          <div style={{padding:"10px 16px 8px",fontSize:12,color:C.grey6,borderBottom:"1px solid "+C.grey3}}>{user.email}</div>
          <button style={_item} onClick={function(){if(onGuide)onGuide();setOpen(false);}}
            onMouseEnter={function(e){e.currentTarget.style.background=C.grey3;}}
            onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>How to use</button>
          <button style={_item} onClick={function(){onSettings();setOpen(false);}}
            onMouseEnter={function(e){e.currentTarget.style.background=C.grey3;}}
            onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>Settings</button>
          <button style={_item} onClick={function(){if(onFeedbackPage)onFeedbackPage();setOpen(false);}}
            onMouseEnter={function(e){e.currentTarget.style.background=C.grey3;}}
            onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>Feedback</button>
          <div style={{height:1,background:C.grey3,margin:"4px 0"}}/>
          <button style={{..._item,color:C.grey8}} onClick={function(){onSignOut();setOpen(false);}}
            onMouseEnter={function(e){e.currentTarget.style.background=C.grey3;}}
            onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>Sign out</button>
        </div>
      )}
    </div>
  );
}

function Arrow({label,isHighlight,isActive,onClick,wide,first}){
  var bg=isActive?C.pink:isHighlight?C.white:C.offBlack;
  var text=isActive?C.white:isHighlight?C.pink:C.white;
  return(
    <div onClick={onClick} style={{position:"relative",width:wide?180:120,height:52,flexShrink:0,marginLeft:first?0:"-16px",zIndex:isActive?10:isHighlight?2:1,cursor:"pointer"}}>
      <div style={{position:"absolute",inset:0,clipPath:"polygon(0 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,0 100%,18px 50%)",background:bg,transition:"all 0.15s"}}/>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",paddingLeft:36,paddingRight:28}}>
        <span style={{fontSize:11,fontWeight:700,textAlign:"center",lineHeight:1.2,color:text}}>{label}</span>
      </div>
    </div>
  );
}

function MappingSidebar({activeId,setView,isMobile,personas,activePersona,setActivePersona}){
  var isJourney=activeId==="journey";
  if(isMobile){
    return(
      <div style={{background:C.white,borderBottom:"1px solid "+C.grey4,flexShrink:0,overflowX:"auto",display:"flex",padding:"8px 12px",gap:8}}>
        <button onClick={function(){setView("mapping");}} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid "+C.pink,background:"transparent",color:C.pink,cursor:"pointer",flexShrink:0}}>Back</button>
        {MAPPING_ITEMS.filter(function(i){return i.id!=="mapping";}).map(function(item){var isActive=activeId===item.id;return(
          <button key={item.id} onClick={function(){setView(item.id);}} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid "+(isActive?C.pink:C.grey4),background:isActive?C.pink:"transparent",color:isActive?C.white:C.grey8,cursor:"pointer",flexShrink:0}}>{item.label}</button>
        );})}
      </div>
    );
  }
  return(
    <div style={{width:192,background:C.white,borderRight:"1px solid "+C.grey4,flexShrink:0,display:"flex",flexDirection:"column"}}>
      <button onClick={function(){setView("mapping");}} style={{textAlign:"left",padding:"12px 16px",fontSize:12,fontWeight:600,color:C.pink,background:"transparent",border:"none",borderBottom:"1px solid "+C.grey4,cursor:"pointer"}}>Back to Journeys</button>
      {MAPPING_ITEMS.filter(function(i){return i.id!=="mapping";}).map(function(item){
        var isActive=activeId===item.id;
        return(
          <div key={item.id}>
            <button onClick={function(){setView(item.id);}} style={{textAlign:"left",padding:"14px 16px",fontSize:13,fontWeight:600,width:"100%",borderTop:"none",borderRight:"none",borderBottom:"none",borderLeft:"4px solid "+(isActive?C.pink:"transparent"),background:isActive?"#EBF1FB":"transparent",color:isActive?C.black:C.grey8,cursor:"pointer"}}>{item.label}</button>
            {item.id==="journey"&&personas&&personas.map(function(p){
              var isActivePerson=isJourney&&activePersona===p.id;
              return(
                <button key={p.id} onClick={function(){setView("journey");if(setActivePersona)setActivePersona(p.id);}}
                  style={{textAlign:"left",padding:"9px 16px 9px 28px",fontSize:12,fontWeight:isActivePerson?700:500,width:"100%",borderTop:"none",borderRight:"none",borderBottom:"none",borderLeft:"4px solid "+(isActivePerson?C.pink:"transparent"),background:isActivePerson?"#EBF1FB":"transparent",color:isActivePerson?C.black:C.grey7,cursor:"pointer",display:"block"}}>
                  {p.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function JourneySummaryPanel({personaId,journeys,setView,setActivePersonaForJourney,goToJourney}){
  var journey=journeys[personaId]||[];
  var [open,setOpen]=useState(null);
  if(!journey.length)return <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:16,textAlign:"center"}}><p style={{color:"rgba(255,255,255,0.6)",fontSize:13,margin:0}}>No journey steps yet.</p></div>;
  var step=journey.find(function(j){return j.stage===open;});
  var sc=open&&step?STAGE_COLORS[open]||{}:{};
  return(
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {journey.map(function(j){var isOpen=open===j.stage;return(
          <button key={j.stage} onClick={function(){setOpen(isOpen?null:j.stage);}} style={{background:isOpen?C.white:"transparent",color:isOpen?C.black:C.white,border:"1.5px solid "+C.white,fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:99,cursor:"pointer"}}>{j.stage}</button>
        );})}
      </div>
      {open&&step&&(
        <div style={{background:sc.bg||C.grey3,border:"1px solid "+(sc.border||C.grey5),borderRadius:10,padding:14,marginBottom:8}}>
          <p style={{fontSize:13,color:C.offBlack,margin:"0 0 10px"}}>{step.note}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {step.pages.map(function(url){return <span key={url} style={{background:C.white,border:"1px solid "+C.grey5,fontSize:11,color:C.grey8,padding:"3px 8px",borderRadius:6,fontFamily:"monospace"}}>{url.replace("https://gwi.ai","gwi.ai").replace("https://trust.gwi.com","trust.gwi.com")}</span>;})}
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
        <button onClick={function(){if(goToJourney)goToJourney(personaId);else{setActivePersonaForJourney(personaId);setView("journey");}}} style={{background:"transparent",border:"none",color:C.white,padding:"7px 0",fontSize:12,fontWeight:600,cursor:"pointer"}}>View full journey map</button>
      </div>
    </div>
  );
}

function PageWrap({children,isMobile}){
  return(<div style={{background:C.grey2,height:"100%",overflow:"auto",padding:isMobile?"20px 16px 0":"40px 32px 0"}}><div style={{maxWidth:920,margin:"0 auto",paddingBottom:80}}>{children}</div></div>);
}

function BlackHero({eyebrow,title,desc,children,why,right}){
  var [showWhy,setShowWhy]=useState(false);
  var textCol=(
    <>
      {eyebrow&&<div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{eyebrow}</div>}
      <h1 style={{color:C.white,fontSize:26,fontWeight:800,margin:"0 0 8px",lineHeight:1.2}}>{title}</h1>
      {desc&&<p style={{color:C.grey6,fontSize:15,lineHeight:1.7,margin:children?"0 0 16px":0}}>{desc}</p>}
      {children}
    </>
  );
  return(
    <div style={{background:C.black,borderRadius:16,padding:"28px 32px",marginBottom:24,position:"relative"}}>
      {why&&(<>
        <button onClick={function(){setShowWhy(true);}} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:18,lineHeight:1,padding:4}} onMouseEnter={function(e){e.currentTarget.style.color="rgba(255,255,255,0.8)";}} onMouseLeave={function(e){e.currentTarget.style.color="rgba(255,255,255,0.3)";}}>&#9432;</button>
        {showWhy&&(
          <div style={{position:"fixed",inset:0,background:"rgba(16,23,32,0.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(){setShowWhy(false);}}>
            <div style={{background:C.white,borderRadius:16,padding:"32px 36px",maxWidth:520,width:"100%"}} onClick={function(e){e.stopPropagation();}}>
              <div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Why is this section here?</div>
              <h2 style={{fontSize:20,fontWeight:800,color:C.black,margin:"0 0 16px"}}>{title}</h2>
              <p style={{fontSize:14,color:C.grey7,lineHeight:1.75,margin:"0 0 24px"}}>{why}</p>
              <button onClick={function(){setShowWhy(false);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Got it</button>
            </div>
          </div>
        )}
      </>)}
      {right?(
        <div style={{display:"flex",alignItems:"center",gap:0,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:220}}>{textCol}</div>
          <div style={{flexShrink:0,paddingLeft:36,borderLeft:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>{right}</div>
        </div>
      ):textCol}
    </div>
  );
}

function Modal({children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(16,23,32,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.white,borderRadius:16,padding:"36px 40px",maxWidth:500,width:"100%",textAlign:"center"}}>{children}</div>
    </div>
  );
}

function WhyModal({url,label,onClose}){
  var lookup={"/":"The homepage is the single highest-traffic entry point across all five personas.","/platform":"The Platform page is the last stop before a user decides whether to sign up for free or walk away.","/platform/spark":"Agent Spark is GWI most accessible product entry point.","/pricing":"The Pricing page is the moment of maximum anxiety across every persona considering a purchase.","/data":"The data page is the primary trust-building destination for Insight Gurus and Data Integrators."};
  var why=lookup[url]||"This page plays a key role in one or more persona journeys across the customer lifecycle.";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(16,23,32,0.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:16,padding:"32px 36px",maxWidth:520,width:"100%"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Why is this in the audit?</div>
        <h2 style={{fontSize:20,fontWeight:800,color:C.black,margin:"0 0 16px"}}>{label}</h2>
        <p style={{fontSize:14,color:C.grey7,lineHeight:1.75,margin:"0 0 24px"}}>{why}</p>
        <button autoFocus onClick={onClose} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Got it</button>
      </div>
    </div>
  );
}

var cardStyle={background:C.white,border:"1.5px solid "+C.grey4,borderRadius:14,padding:20,textAlign:"left",cursor:"pointer",display:"flex",flexDirection:"column",gap:10};
var cardHoverIn=function(e){e.currentTarget.style.borderColor="#FFE8EE";e.currentTarget.style.boxShadow="0 4px 16px rgba(255,0,119,0.06)";};
var cardHoverOut=function(e){e.currentTarget.style.borderColor=C.grey4;e.currentTarget.style.boxShadow="none";};

function CardLink({label}){
  var [hov,setHov]=useState(false);
  return(
    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4,cursor:"pointer"}}
      onMouseEnter={function(){setHov(true);}}
      onMouseLeave={function(){setHov(false);}}>
      <span style={{fontSize:12,fontWeight:600,color:hov?C.pink:C.black,transition:"color 0.15s"}}>{label}</span>
      <ChevronRight size={14} color={C.pink}/>
    </div>
  );
}

function SecondaryCardLink({label,onClick}){
  var [hov,setHov]=useState(false);
  return(
    <div
      onClick={function(e){e.stopPropagation();if(onClick)onClick();}}
      onMouseEnter={function(){setHov(true);}}
      onMouseLeave={function(){setHov(false);}}
      style={{display:"flex",alignItems:"center",gap:4,marginTop:4,cursor:"pointer"}}>
      <span style={{fontSize:12,fontWeight:600,color:hov?C.pink:C.black,transition:"color 0.15s"}}>{label}</span>
      <ChevronRight size={14} color={C.pink}/>
    </div>
  );
}


function FileDropZone({onFile,files,onRemove}){
  var [dragging,setDragging]=useState(false);
  var inputRef=useRef(null);
  function processFiles(fileList){
    Array.from(fileList).forEach(function(file){
      var isImage=/^image\//.test(file.type);
      var isCsv=file.name.toLowerCase().endsWith(".csv")||file.type==="text/csv";
      if(!isImage&&!isCsv)return;
      var reader=new FileReader();
      if(isImage){
        var _img=new window.Image();
        var _objUrl=URL.createObjectURL(file);
        _img.onload=function(){
          URL.revokeObjectURL(_objUrl);
          var MAX=1600;
          var w=_img.naturalWidth,h=_img.naturalHeight;
          var scale=Math.min(1,MAX/Math.max(w,h));
          var canvas=document.createElement("canvas");
          canvas.width=Math.round(w*scale);
          canvas.height=Math.round(h*scale);
          var ctx=canvas.getContext("2d");
          if(ctx)ctx.drawImage(_img,0,0,canvas.width,canvas.height);
          var dataUrl=canvas.toDataURL("image/jpeg",0.82);
          onFile({type:"image",name:file.name,dataUrl:dataUrl,mimeType:"image/jpeg"});
        };
        _img.onerror=function(){URL.revokeObjectURL(_objUrl);};
        _img.src=_objUrl;
      }else{
        reader.onload=function(e){onFile({type:"csv",name:file.name,text:String(e.target.result)});};
        reader.readAsText(file);
      }
    });
  }
  var imgFiles=files.filter(function(f){return f.type==="image";});
  var csvFiles=files.filter(function(f){return f.type==="csv";});
  return(
    <div>
      <div
        onDragOver={function(e){e.preventDefault();setDragging(true);}}
        onDragLeave={function(){setDragging(false);}}
        onDrop={function(e){e.preventDefault();setDragging(false);processFiles(e.dataTransfer.files);}}
        onClick={function(){inputRef.current&&inputRef.current.click();}}
        style={{border:"1.5px dashed "+(dragging?C.pink:C.grey5),borderRadius:10,padding:"20px 16px",textAlign:"center",cursor:"pointer",background:dragging?"#FFF0F8":C.grey3,transition:"all 0.15s"}}
      >
        <input ref={inputRef} type="file" multiple accept="image/*,.csv" style={{display:"none"}} onChange={function(e){processFiles(e.target.files);e.target.value="";}}/>
        <div style={{fontSize:22,marginBottom:6}}>⬆</div>
        <div style={{fontSize:13,fontWeight:600,color:C.grey7}}>Drop heatmap images or CSV files here</div>
        <div style={{fontSize:11,color:C.grey6,marginTop:4}}>or click to browse · PNG, JPG, WebP, CSV accepted</div>
      </div>
      {files.length>0&&(
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
          {imgFiles.length>0&&<div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:2}}>Heatmap images ({imgFiles.length})</div>}
          {imgFiles.map(function(f,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#F0F4FF",border:"1px solid #C5D0F5",borderRadius:8,padding:"7px 12px"}}>
              <img src={f.dataUrl} alt={f.name} style={{width:36,height:36,objectFit:"cover",borderRadius:4,flexShrink:0}}/>
              <span style={{fontSize:12,color:C.offBlack,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
              <button onClick={function(){onRemove(f);}} style={{background:"transparent",border:"none",color:C.grey6,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button>
            </div>
          );})}
          {csvFiles.length>0&&<div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.04em",marginTop:imgFiles.length?6:0,marginBottom:2}}>CSV files ({csvFiles.length})</div>}
          {csvFiles.map(function(f,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#E6F9F2",border:"1px solid #80D4B0",borderRadius:8,padding:"7px 12px"}}>
              <span style={{fontSize:18,lineHeight:1}}>📄</span>
              <span style={{fontSize:12,color:C.offBlack,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
              <button onClick={function(){onRemove(f);}} style={{background:"transparent",border:"none",color:C.grey6,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({personas,auditData,setView,onFeedback}){
  var isMobile=useWidth()<768;
  var totalActions=auditData.reduce(function(s,p){return s+p.actions.length;},0);
  var doneActions=auditData.reduce(function(s,p){return s+p.actions.filter(function(a){return a.status==="done";}).length;},0);
  var pct=totalActions?Math.round(doneActions/totalActions*100):0;
  var cards=[
    {icon:<Sparkles size={24}/>,label:"UX Audit",desc:"Fast, consistent evaluation of UX, messaging, and conversion best practices without waiting on a full research cycle.",cta:"Run an audit",action:function(){setView("summary");},cta2:"View audits",action2:function(){setView("generated-audits");}},
    {icon:<ClipboardList size={24}/>,label:"Recommendations",desc:"Turns insights into execution so everyone sees what to do next and what impact it has.",cta:"Track recommendations",action:function(){setView("audit");}},
    {icon:<Monitor size={24}/>,label:"Wireframes",desc:"Converts recommendations into AI-generated low-fidelity wireframes — see exactly what an improved page could look like before a single pixel is designed.",cta:"Build a wireframe",action:function(){setView("wireframes");}},
    {icon:<Users size={24}/>,label:"Personas",desc:"Align teams on who we are building for and what each persona needs to convert.",cta:"Meet the personas",action:function(){setView("personas");}},
    {icon:<Map size={24}/>,label:"Journeys",desc:"Shows the real path from first visit to sign-up to activation.",cta:"Explore journeys",action:function(){setView("mapping");}},
    {icon:<BarChart2 size={24}/>,label:"Analytics",desc:"Proof of what is happening on-page — where attention goes and what is killing conversion.",cta:"Open analytics",action:function(){setView("analytics");}},
    {icon:<Cog size={24}/>,label:"Settings",desc:"Keeps the framework flexible as priorities shift.",cta:"Edit settings",action:function(){setView("settings");}},
    {icon:<MessageSquare size={24}/>,label:"Feedback",desc:"Share what's working, what's not, and what you'd like to see next — your input shapes the roadmap.",cta:"Leave feedback",action:function(){if(onFeedback)onFeedback();}},
  ];
  return(
    <div style={{background:C.grey2,height:"100%",overflow:"auto",padding:isMobile?"20px 16px":"40px 32px"}}>
      <div style={{maxWidth:920,margin:"0 auto",paddingBottom:80}}>
        <div style={{background:C.black,borderRadius:20,padding:isMobile?"24px":"36px 40px",marginBottom:28}}>
          <div style={{fontSize:12,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>GWI Website — UX Audit</div>
          <h1 style={{color:C.white,fontSize:isMobile?24:32,fontWeight:800,margin:"0 0 12px",lineHeight:1.15}}>Optimize for free sign-ups using real behavioral data.</h1>
          <p style={{color:C.grey6,fontSize:15,lineHeight:1.7,margin:"0 0 24px",maxWidth:600}}>This program combines user research, behaviour analytics, and AI-assisted auditing to pinpoint what is blocking conversion and exactly how to fix it.</p>
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:600,color:C.white}}>Overall audit progress</span>
              <span style={{fontSize:20,fontWeight:800,color:C.pink}}>{pct}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:99,height:8,overflow:"hidden",marginBottom:16}}><div style={{width:pct+"%",background:C.pink,height:"100%",borderRadius:99,transition:"width 0.4s"}}/></div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {([["5","Personas","personas"],["9","Lifecycle stages","lifecycle"],[String(totalActions),"Recommendations","audit"],[String(doneActions)+"/"+String(totalActions),"Done","audit"]] as [string,string,string][]).map(function(item){return(
                <button key={item[1]} onClick={function(){setView(item[2]);}} style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 8px",border:"none",cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={function(e){e.currentTarget.style.background="rgba(255,255,255,0.10)";}} onMouseLeave={function(e){e.currentTarget.style.background="rgba(255,255,255,0.04)";}}>
                  <div style={{fontSize:isMobile?18:22,fontWeight:800,color:C.white,lineHeight:1}}>{item[0]}</div>
                  <div style={{fontSize:11,color:C.grey6,marginTop:4}}>{item[1]}</div>
                </button>
              );})}
            </div>
            <button onClick={function(){setView("audit");}} style={{width:"100%",background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>View Recommendations</button>
          </div>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>What each module gives you</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          {cards.map(function(card){return(
            <button key={card.label} onClick={card.action} style={Object.assign({},cardStyle)} onMouseEnter={cardHoverIn} onMouseLeave={cardHoverOut}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{background:"#FFEEF6",borderRadius:10,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <div style={{color:C.pink}}>{card.icon}</div>
                </div>
                <div style={{fontSize:17,fontWeight:800,color:C.offBlack}}>{card.label}</div>
              </div>
              <p style={{fontSize:15,color:C.grey7,lineHeight:1.65,margin:0}}>{card.desc}</p>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <CardLink label={card.cta}/>
                {(card as any).cta2&&<SecondaryCardLink label={(card as any).cta2} onClick={(card as any).action2}/>}
              </div>
            </button>
          );})}
        </div>
        {/* Footer */}
        <div style={{marginTop:40,paddingTop:24,borderTop:"1px solid "+C.grey4}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:20,marginBottom:20}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Changelog</div>
              {[
                {v:"v0.6",date:"Mar 2025",note:"Priority matrix, clickable stat cards, persistent feedback button"},
                {v:"v0.5",date:"Feb 2025",note:"Wireframes sidebar with Starred/Drafts/Loved sections"},
                {v:"v0.4",date:"Jan 2025",note:"GA4 analytics cards, Hotjar heatmap links"},
                {v:"v0.3",date:"Dec 2024",note:"UX Audit generation with Claude AI"},
                {v:"v0.2",date:"Nov 2024",note:"Persona profiles, journey maps, lifecycle stages"},
                {v:"v0.1",date:"Oct 2024",note:"Initial audit tracker, recommendations, Firebase sync"},
              ].map(function(item){return(
                <div key={item.v} style={{display:"flex",gap:10,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:C.pink,minWidth:32,paddingTop:1}}>{item.v}</span>
                  <span style={{fontSize:11,color:C.grey6,minWidth:60,paddingTop:1}}>{item.date}</span>
                  <span style={{fontSize:12,color:C.grey7,lineHeight:1.5}}>{item.note}</span>
                </div>
              );})}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Built with</div>
              {[
                {label:"React + TypeScript",desc:"Frontend framework"},
                {label:"Firebase (Auth + Firestore)",desc:"Auth and live sync"},
                {label:"Claude API (claude-opus-4-5)",desc:"AI audit generation"},
                {label:"Claude Code",desc:"Autonomous development"},
                {label:"Vite",desc:"Build tool"},
                {label:"Lucide React",desc:"Icons"},
              ].map(function(item){return(
                <div key={item.label} style={{display:"flex",gap:10,marginBottom:6,alignItems:"baseline"}}>
                  <span style={{fontSize:12,fontWeight:700,color:C.offBlack,minWidth:isMobile?120:180}}>{item.label}</span>
                  <span style={{fontSize:12,color:C.grey7}}>{item.desc}</span>
                </div>
              );})}
            </div>
          </div>
          <div style={{fontSize:11,color:C.grey6,textAlign:"center",paddingBottom:8}}>GWI UX Audit Tool · Internal use only · Built by the UX team</div>
        </div>
      </div>
    </div>
  );
}

function MappingDash({setView}){
  var isMobile=useWidth()<768;
  var cards=[
    {id:"journey",icon:<Map size={26}/>,label:"Journey Mapper",desc:"Trace each persona's path across every lifecycle stage.",cta:"Map a persona's path"},
    {id:"lifecycle",icon:<RefreshCw size={26}/>,label:"Customer Mapping",desc:"Explore the full lifecycle stage by stage with Push, Pull, Habit and Anxiety.",cta:"Explore lifecycle stages"},
    {id:"affinity",icon:<Layers size={26}/>,label:"Affinity Map",desc:"Systemic patterns clustered from across all personas.",cta:"See shared patterns"},
    {id:"flows",icon:<ArrowRight size={26}/>,label:"User Flows",desc:"The exact clicks from A to B. Maps screens, decision points, actions and drop-off paths.",cta:"Trace a user flow"},
  ];
  return(
    <PageWrap isMobile={isMobile}>
      <BlackHero eyebrow="How users move through gwi.com" title="Journeys" desc="Personas do not arrive on the homepage and immediately sign up. They move through distinct lifecycle stages visiting different pages with different questions at each step." why="Mapping exists because UX problems are rarely about a single page in isolation."/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        {cards.map(function(card){return(
          <button key={card.id} onClick={function(){setView(card.id);}} style={Object.assign({},cardStyle)} onMouseEnter={cardHoverIn} onMouseLeave={cardHoverOut}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{background:"#FFEEF6",borderRadius:10,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{color:C.pink}}>{card.icon}</div>
              </div>
              <div style={{fontSize:17,fontWeight:800,color:C.offBlack}}>{card.label}</div>
            </div>
            <div style={{fontSize:15,color:C.grey7,lineHeight:1.5,flex:1}}>{card.desc}</div>
            <CardLink label={card.cta}/>
          </button>
        );})}
      </div>
    </PageWrap>
  );
}

function PersonasDash({personas,setView,goToPersona}){
  var isMobile=useWidth()<768;
  return(
    <PageWrap isMobile={isMobile}>
      <BlackHero eyebrow="Who we are designing for" title={"GWI "+personas.length+" Core Personas"} desc="Understanding who visits gwi.com is the foundation of the entire UX audit." why="Personas are the foundation of the entire audit."/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
        {personas.map(function(p){
          var col=getPersonaColor(p);
          return(
            <button key={p.id} onClick={function(){goToPersona(p.id);}} style={Object.assign({},cardStyle)} onMouseEnter={cardHoverIn} onMouseLeave={cardHoverOut}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{background:col.bg,border:"1px solid "+col.border,borderRadius:99,width:10,height:10,flexShrink:0}}/>
                <div style={{fontSize:17,fontWeight:800,color:C.offBlack}}>{p.label}</div>
              </div>
              <p style={{fontSize:15,color:C.grey7,lineHeight:1.65,margin:0}}>{p.tagline}</p>
              <CardLink label={p.id==="insight-guru"?"Explore their data world":p.id==="inspiration-hunter"?"See what sparks them":p.id==="commercial-closer"?"Understand their pitch mindset":p.id==="strategic-leader"?"See the big picture view":"Explore their technical needs"}/>
            </button>
          );
        })}
      </div>
    </PageWrap>
  );
}

function PersonasPage({personas,journeys,setView,setActivePersonaForJourney,goToJourney,initialPersonaId}){
  var [active,setActive]=useState(initialPersonaId||(personas[0]?personas[0].id:null));
  var isMobile=useWidth()<768;
  useEffect(function(){if(initialPersonaId)setActive(initialPersonaId);},[initialPersonaId]);
  var p=personas.find(function(x){return x.id===active;})||personas[0];
  if(!p)return <div style={{padding:32,color:C.grey7}}>No personas yet.</div>;
  var col=getPersonaColor(p);
  var cards=[
    {key:"website",title:"What they want from our website",content:p.website,span:true,dark:true},
    {key:"who",title:"Who they are",content:p.who},
    {key:"what",title:"What they do",content:p.what},
    {key:"drives",title:"What drives them",content:p.drives},
    {key:"bugs",title:"What bugs them",content:p.bugs},
    {key:"grabs",title:"What grabs their attention",content:p.grabs,span:true},
  ];
  if(p.concerns)cards.push({key:"concerns",title:"What concerns them",content:p.concerns,span:true});
  if(p.whyUs)cards.push({key:"whyUs",title:"Why they use us",content:p.whyUs});
  if(p.platform)cards.push({key:"platform",title:"How they use the platform",content:p.platform});
  cards=cards.filter(function(c){return !!c.content;});
  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100%",background:C.grey2}}>
      {isMobile?(
        <div style={{background:C.white,borderBottom:"1px solid "+C.grey4,flexShrink:0,overflowX:"auto",display:"flex",padding:"8px 12px",gap:8}}>
          <button onClick={function(){setView("personas");}} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid "+C.pink,background:"transparent",color:C.pink,cursor:"pointer",flexShrink:0}}>Back</button>
          {personas.map(function(persona){var isActive=active===persona.id;var pc=getPersonaColor(persona);return(
            <button key={persona.id} onClick={function(){setActive(persona.id);}} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid "+(isActive?pc.border:C.grey4),background:isActive?pc.bg:"transparent",color:isActive?pc.text:C.grey8,cursor:"pointer",flexShrink:0}}>{persona.label}</button>
          );})}
        </div>
      ):(
        <div style={{width:192,background:C.white,borderRight:"1px solid "+C.grey4,flexShrink:0,display:"flex",flexDirection:"column"}}>
          <button onClick={function(){setView("personas");}} style={{textAlign:"left",padding:"12px 16px",fontSize:12,fontWeight:600,color:C.pink,background:"transparent",border:"none",borderBottom:"1px solid "+C.grey4,cursor:"pointer"}}>All Personas</button>
          {personas.map(function(persona){var isActive=active===persona.id;return(
            <button key={persona.id} onClick={function(){setActive(persona.id);}} style={{textAlign:"left",padding:"14px 16px",fontSize:13,fontWeight:600,borderTop:"none",borderRight:"none",borderBottom:"none",borderLeft:"4px solid "+(isActive?C.pink:"transparent"),background:isActive?"#EBF1FB":"transparent",color:isActive?C.black:C.grey8,cursor:"pointer"}}>{persona.label}</button>
          );})}
        </div>
      )}
      <div style={{flex:1,overflow:"auto",padding:isMobile?16:20,background:C.grey2}}>
        <div style={{maxWidth:920,margin:"0 auto",paddingBottom:80}}>
          {(function(){
            var PERSONA_IMAGES={"insight-guru":"https://www.gwi.com/hubfs/UX-Aduit-Imagery/Insight%20Guru.png","inspiration-hunter":"https://www.gwi.com/hubfs/UX-Aduit-Imagery/Inspiration%20Hunter.png","commercial-closer":"https://www.gwi.com/hubfs/UX-Aduit-Imagery/Commercial%20Closer.png","strategic-leader":"https://www.gwi.com/hubfs/UX-Aduit-Imagery/Strategic%20Leader.png","data-integrator":"https://www.gwi.com/hubfs/UX-Aduit-Imagery/Data%20Integrator.png"};
            var img=PERSONA_IMAGES[p.id]||null;
            return(
              <div style={{background:col.bg,border:"1px solid "+col.border,borderRadius:16,padding:24,marginBottom:24,display:"flex",gap:24,alignItems:"center"}}>
                {img&&<img src={img} alt={p.label} style={{width:160,height:160,objectFit:"cover",borderRadius:12,flexShrink:0}}/>}
                <div style={{flex:1}}>
                  <h2 style={{color:C.black,fontSize:24,fontWeight:700,margin:0}}>{p.label}</h2>
                  <p style={{color:C.black,marginTop:8,fontSize:18,fontWeight:600,lineHeight:1.3}}>{p.tagline}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16}}>
                    {p.entry.split(",").map(function(t){return <span key={t} style={{background:col.tag.bg,color:col.tag.text,border:"1px solid "+col.border,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:99}}>{t.trim()}</span>;})}
                  </div>
                  <p style={{color:C.black,marginTop:12,fontSize:13,fontWeight:500,lineHeight:1.5}}>{p.traits.join(" · ")}</p>
                </div>
              </div>
            );
          })()}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            {cards.map(function(card){return(
              <div key={card.key} style={{gridColumn:card.span?"1 / -1":"auto",background:card.dark?C.black:C.white,border:"1px solid "+(card.dark?C.black:C.grey4),borderRadius:12,padding:16}}>
                <h3 style={{fontSize:13,fontWeight:700,marginBottom:8,color:card.dark?C.white:C.black}}>{card.title}</h3>
                <p style={{fontSize:13,lineHeight:1.6,color:card.dark?C.grey5:C.grey8,margin:0}}>{card.content}</p>
                {card.key==="website"&&(
                  <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.1)"}}>
                    <h4 style={{fontSize:12,fontWeight:700,color:C.white,marginBottom:4}}>Pages Across Lifecycle</h4>
                    <p style={{fontSize:12,color:C.grey6,marginBottom:12}}>Click any stage to see which pages this persona visits and why.</p>
                    <JourneySummaryPanel personaId={p.id} journeys={journeys} setView={setView} setActivePersonaForJourney={setActivePersonaForJourney} goToJourney={goToJourney}/>
                  </div>
                )}
              </div>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerMappingPage({stages,personas,journeys,setView}){
  var [activeStage,setActiveStage]=useState("awareness");
  var [signupMode,setSignupMode]=useState(true);
  var [showWhy,setShowWhy]=useState(false);
  var isMobile=useWidth()<768;
  var stage=stages.find(function(s){return s.id===activeStage;});
  var visibleStages=signupMode?stages.filter(function(s){return s.signupRole!=="none";}):stages;
  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100%",overflow:"hidden"}}>
      <MappingSidebar activeId="lifecycle" setView={setView} isMobile={isMobile}/>
      <div style={{flex:1,overflow:"auto",background:C.grey2,padding:isMobile?"16px":"20px"}}>
        <div style={{maxWidth:920,margin:"0 auto",paddingBottom:80}}>
          <div style={{background:C.black,borderRadius:16,padding:isMobile?"20px":"28px 32px",marginBottom:24,position:"relative"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>The full picture</div>
            <h1 style={{color:C.white,fontSize:isMobile?20:26,fontWeight:800,margin:"0 0 8px"}}>Customer Lifecycle Map</h1>
            <p style={{color:C.grey6,fontSize:15,lineHeight:1.7,margin:"0 0 20px",maxWidth:560}}>The lifecycle map defines what GWI needs to achieve at every stage and what is standing in the way.</p>
            <button onClick={function(){setShowWhy(true);}} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:18,lineHeight:1,padding:4}}>&#9432;</button>
            {showWhy&&(
              <div style={{position:"fixed",inset:0,background:"rgba(16,23,32,0.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(){setShowWhy(false);}}>
                <div style={{background:C.white,borderRadius:16,padding:"32px 36px",maxWidth:520,width:"100%"}} onClick={function(e){e.stopPropagation();}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Why is this section here?</div>
                  <h2 style={{fontSize:20,fontWeight:800,color:C.black,margin:"0 0 16px"}}>Customer Lifecycle Map</h2>
                  <p style={{fontSize:14,color:C.grey7,lineHeight:1.75,margin:"0 0 24px"}}>The lifecycle map gives every UX recommendation a strategic context.</p>
                  <button onClick={function(){setShowWhy(false);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Got it</button>
                </div>
              </div>
            )}
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:8,padding:4,display:"inline-flex",gap:4,marginBottom:20}}>
              <button onClick={function(){setSignupMode(true);setActiveStage("awareness");}} style={{background:signupMode?C.white:"transparent",color:signupMode?C.black:C.grey5,borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>Free Sign-up Journey</button>
              <button onClick={function(){setSignupMode(false);setActiveStage("awareness");}} style={{background:!signupMode?C.white:"transparent",color:!signupMode?C.black:C.grey5,borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>Full Lifecycle</button>
            </div>
            <div style={{overflowX:"auto"}}><div style={{display:"inline-flex",alignItems:"center",paddingBottom:4}}>{visibleStages.map(function(s,i){return <Arrow key={s.id} label={s.label} isHighlight={!!s.highlight} isActive={activeStage===s.id} onClick={function(){if(activeStage!==s.id)setActiveStage(s.id);}} wide={s.id==="first-user-adoption"} first={i===0}/>;})}</div></div>
          </div>
          {stage&&(
            <div style={{background:C.white,borderRadius:16,border:"1px solid "+C.grey4,padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                {stage.highlight&&!signupMode&&<span style={{background:C.pink,color:C.white,fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99}}>Focus Stage</span>}
                <h2 style={{color:C.black,fontSize:20,fontWeight:700,margin:0,flex:1}}>{stage.label}</h2>
                {signupMode&&<span style={{background:signupRoleConfig[stage.signupRole].pill.bg,color:signupRoleConfig[stage.signupRole].pill.text,fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99}}>{signupRoleConfig[stage.signupRole].label}</span>}
              </div>
              <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:"24px 28px",marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.black,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>How Might We</div>
                <p style={{color:C.pink,fontSize:16,fontWeight:600,lineHeight:1.5,margin:"0 0 16px"}}>{stage.hmw}</p>
                {signupMode&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:C.black,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Personas at this stage</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {personas.filter(function(p){return(journeys[p.id]||[]).some(function(j){return j.stage===stage.label;});}).map(function(p){var col=getPersonaColor(p);return <span key={p.id} style={{background:col.bg,color:col.text,border:"1px solid "+col.border,fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99}}>{p.label}</span>;})}
                    </div>
                  </div>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.black,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>GWI Goal</div>
                  <p style={{color:C.offBlack,fontSize:13,margin:0}}>{stage.gwi_goal}</p>
                </div>
                {[["Push",stage.push],["Pull",stage.pull],["Habit",stage.habit],["Anxiety",stage.anxiety]].map(function(x){return(
                  <div key={x[0]} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.black,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>{x[0]}</div>
                    <p style={{color:C.grey8,fontSize:13,lineHeight:1.6,margin:0}}>{x[1]}</p>
                  </div>
                );})}
                {signupMode&&(
                  <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.black,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Website Role</div>
                    <p style={{color:C.offBlack,fontSize:13,lineHeight:1.6,margin:0}}>{stage.signupNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AffinityPage({personas,setView}){
  var CLUSTERS=[
    {id:"cost-anxiety",name:"Cost and Value Anxiety",theme:"Across every stage of the customer journey, cost is the single most persistent blocker to conversion.",insight:"The website needs to reframe spend as investment at every touchpoint — not just on the pricing page.",signals:[{text:"Cost is prohibitive",type:"anxiety",stage:"Awareness",personas:["insight-guru","inspiration-hunter","commercial-closer"],explanation:"Before personas have even engaged with GWI, cost anxiety is already present."},{text:"Cost will be high — will we use it enough to get value for money?",type:"anxiety",stage:"Acquisition",personas:["commercial-closer","strategic-leader"],explanation:"At the point of trial or internal buy-in, budget holders start questioning utilisation."},{text:"ROI, ROI, and more ROI",type:"drives",stage:"Cross-stage",personas:["commercial-closer"],explanation:"For the Commercial Closer, every decision is filtered through return on investment."}]},
    {id:"speed-friction",name:"Speed and Friction",theme:"Time pressure is a constant across all personas. Any unnecessary step between intent and value is a drop-off risk.",insight:"The website must eliminate friction at every stage — from discovery to sign-up to first use.",signals:[{text:"Lack of speed and unnecessary friction in their workflows",type:"bugs",stage:"Cross-stage",personas:["inspiration-hunter"],explanation:"The Inspiration Hunter will not tolerate slow pages, complex navigation or multi-step sign-up flows."},{text:"They need to work at speed and cannot spend time learning a new tool",type:"habit",stage:"First User Adoption",personas:["inspiration-hunter","commercial-closer"],explanation:"At First User Adoption, the biggest churn risk is a blank canvas."}]},
    {id:"trust-credibility",name:"Trust and Credibility",theme:"Before committing time or budget, every persona needs proof that GWI is credible, accurate and safe to rely on.",insight:"Credibility signals must be front-loaded across the homepage, /data, and /case-studies.",signals:[{text:"Data trustworthiness — if the data is wrong, they are wrong",type:"concerns",stage:"Cross-stage",personas:["insight-guru"],explanation:"The Insight Guru's professional reputation depends on the accuracy of their sources."},{text:"Security, compliance, and data governance",type:"concerns",stage:"Cross-stage",personas:["data-integrator"],explanation:"Data Integrators need GDPR compliance, ISO certification and API reliability evidence."}]},
    {id:"self-serve",name:"Self-Serve vs Sales Friction",theme:"Self-serve personas actively avoid sales conversations. Forcing them into a demo flow is one of the biggest conversion killers on the site.",insight:"The website's primary CTA needs to be Sign up for free, not Book a demo.",signals:[{text:"A way to self-serve platform trial access without needing a sales call",type:"website",stage:"Cross-stage",personas:["insight-guru"],explanation:"The Insight Guru will not book a demo until they have already validated GWI independently."},{text:"The sales person might waste my time",type:"anxiety",stage:"Evaluation",personas:["insight-guru","inspiration-hunter"],explanation:"Sales anxiety is a real blocker during Evaluation."}]},
    {id:"blank-canvas",name:"Blank Canvas Anxiety",theme:"When users do not know where to start, they do not start at all. First User Adoption is the highest-risk stage.",insight:"The website directly shapes what users expect when they log in for the first time.",signals:[{text:"The way this tool works is overwhelming and I cannot get my head around it",type:"anxiety",stage:"First User Adoption",personas:["insight-guru","inspiration-hunter","commercial-closer"],explanation:"This anxiety is felt across three of the five core personas at the moment of first login."}]},
    {id:"champion-problem",name:"Internal Advocacy",theme:"None of these personas make the final decision alone. They all need to convince someone else — and the website gives them nothing to help do that.",insight:"The website needs to arm champions with shareable evidence: ROI framing, one-pagers, case studies by sector, and clear upgrade paths their manager can approve without a sales call.",signals:[
      {text:"I need to get buy-in from my manager before I can commit to anything",type:"anxiety",stage:"Consideration",personas:["inspiration-hunter","commercial-closer"],explanation:"The Inspiration Hunter and Commercial Closer are often mid-seniority — they're sold on GWI but need upward sign-off before proceeding."},
      {text:"Finance will want to see a clear ROI before approving the budget",type:"anxiety",stage:"Acquisition",personas:["commercial-closer","strategic-leader"],explanation:"Budget approval is a distinct stage in the journey that the website doesn't acknowledge or support."},
      {text:"IT and legal need to review this before we can integrate anything",type:"concerns",stage:"Consideration",personas:["data-integrator"],explanation:"The Data Integrator is rarely the sole decision-maker. Security, legal and procurement all have a veto."},
      {text:"I need something I can forward to my director to make the case",type:"website",stage:"Consideration",personas:["inspiration-hunter","commercial-closer","strategic-leader"],explanation:"The website has no shareable, non-sales assets designed for internal champions to use in approval conversations."},
    ]},
    {id:"discoverability",name:"Navigation and Discoverability",theme:"The website treats all visitors the same. No persona is actively routed to the content most relevant to them, and critical pages are invisible without prior knowledge.",insight:"Navigation needs persona-aware pathways. The homepage, pricing page, and top-level nav should actively direct different visitors toward the content that answers their specific question.",signals:[
      {text:"I cannot find the API documentation without already knowing it exists",type:"bugs",stage:"Awareness",personas:["data-integrator"],explanation:"The /api page is not surfaced in the main navigation or from the homepage. A Data Integrator arriving cold has no clear path to it."},
      {text:"I want to see data relevant to my industry but cannot find it easily",type:"anxiety",stage:"Evaluation",personas:["commercial-closer","inspiration-hunter"],explanation:"Sector-specific content and audience coverage data is not discoverable from the top-level navigation."},
      {text:"The homepage tries to speak to everyone and ends up speaking to no one",type:"concerns",stage:"Awareness",personas:["insight-guru","strategic-leader"],explanation:"Without persona routing — even simple 'I am a...' pathways — every visitor gets the same generic experience regardless of their intent."},
      {text:"I have to dig to find case studies relevant to my type of work",type:"bugs",stage:"Evaluation",personas:["commercial-closer","strategic-leader"],explanation:"Case studies exist but are not filtered or surfaced by sector, use case or persona type, making them hard to use as internal evidence."},
    ]},
    {id:"proof-of-fit",name:"Proof of Fit",theme:"Before evaluating how good GWI is, every persona needs to answer a more basic question: is GWI even right for me? The website rarely answers this directly.",insight:"The website must lead with relevance before credibility. Sector coverage, audience examples, and use-case framing need to appear earlier and more prominently across key landing pages.",signals:[
      {text:"Does GWI actually have data on the audiences I work with?",type:"anxiety",stage:"Awareness",personas:["commercial-closer","inspiration-hunter"],explanation:"The first conversion barrier isn't price or trust — it's relevance. If personas can't see their audience in GWI's coverage, they self-select out before even evaluating."},
      {text:"I need to see a case study from a company like mine before I take this further",type:"pull",stage:"Evaluation",personas:["strategic-leader","commercial-closer"],explanation:"Sector-matched social proof is a prerequisite for the Strategic Leader before they will invest time in a demo or trial."},
      {text:"I want to know if GWI covers the markets and countries I need",type:"concerns",stage:"Evaluation",personas:["insight-guru","data-integrator"],explanation:"Global coverage, market depth, and data recency are specific requirements that must be answered before technical evaluation begins."},
      {text:"The homepage tells me what GWI does, not whether it works for someone like me",type:"concerns",stage:"Awareness",personas:["insight-guru","inspiration-hunter","commercial-closer"],explanation:"Generic product messaging delays the moment of relevance. Personas need to see themselves — their role, their industry, their use case — reflected back at them quickly."},
    ]},
    {id:"competitive-context",name:"Competitive Comparison",theme:"Almost every persona arrives having already evaluated at least one competitor. The website doesn't acknowledge this and makes no attempt to differentiate or directly address the comparison.",insight:"GWI needs a clear competitive narrative on the website — not aggressive positioning, but honest differentiation. Personas need to understand what GWI does that alternatives do not.",signals:[
      {text:"I am already using a competitor and need a compelling reason to switch",type:"anxiety",stage:"Evaluation",personas:["insight-guru","strategic-leader"],explanation:"Switching costs are high. The website needs to give existing competitor users a clear, specific reason to change — not just generic claims of being 'the best'."},
      {text:"I need to explain to my stakeholders why GWI and not a cheaper alternative",type:"drives",stage:"Consideration",personas:["commercial-closer","strategic-leader"],explanation:"The champion needs competitive ammunition to win the internal argument. The website provides none."},
      {text:"How is this different from what I can get from a free tool or public data?",type:"anxiety",stage:"Awareness",personas:["inspiration-hunter","insight-guru"],explanation:"For data-savvy personas, the default question is whether paid data is worth it versus free alternatives. This objection is never addressed on the website."},
      {text:"I want to see a direct comparison of GWI's data coverage versus alternatives",type:"website",stage:"Evaluation",personas:["data-integrator","insight-guru"],explanation:"Technical evaluators want structured comparisons — sample sizes, methodology, coverage breadth — not marketing copy. This content doesn't exist on the website."},
    ]},
  ];
  var [activeCluster,setActiveCluster]=useState(CLUSTERS[0].id);
  var isMobile=useWidth()<768;
  var typeColors={push:{bg:"#E8F5E9",text:"#2E7D32",label:"Push"},pull:{bg:"#E3F2FD",text:"#1565C0",label:"Pull"},habit:{bg:"#FFF8E1",text:"#F57F17",label:"Habit"},anxiety:{bg:"#FCE4EC",text:"#880E4F",label:"Anxiety"},drives:{bg:C.purpleBg,text:C.purpleDark,label:"Drives"},bugs:{bg:"#FFF0E6",text:"#7A3A00",label:"Bugs"},concerns:{bg:C.grey3,text:C.grey8,label:"Concerns"},website:{bg:C.blueBg,text:C.blueDark,label:"Website need"}};
  var active=CLUSTERS.find(function(c){return c.id===activeCluster;});
  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100%",overflow:"hidden"}}>
      <MappingSidebar activeId="affinity" setView={setView} isMobile={isMobile}/>
      <div style={{flex:1,overflow:"auto",background:C.grey2,padding:isMobile?"16px":"20px"}}>
        <div style={{maxWidth:920,margin:"0 auto",paddingBottom:80}}>
          <BlackHero eyebrow="Patterns across all personas" title="Affinity Map" desc="An affinity map clusters recurring signals from across all five personas into the systemic problems the website must solve." why="Individual persona profiles tell you what each person needs. The affinity map tells you what everyone needs."/>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
            {CLUSTERS.map(function(c){return(
              <button key={c.id} onClick={function(){setActiveCluster(c.id);}} style={{background:activeCluster===c.id?C.pink:C.white,color:activeCluster===c.id?C.white:C.offBlack,border:"1.5px solid "+(activeCluster===c.id?C.pink:C.grey4),fontSize:12,fontWeight:700,padding:"6px 16px",borderRadius:99,cursor:"pointer"}}>
                {c.name} <span style={{marginLeft:6,opacity:0.6,fontWeight:400}}>{c.signals.length}</span>
              </button>
            );})}
          </div>
          {active&&(
            <div>
              <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:16,padding:"28px 32px",marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Pattern</div>
                <h2 style={{color:C.black,fontSize:isMobile?20:24,fontWeight:800,margin:"0 0 12px",lineHeight:1.3}}>{active.theme}</h2>
                <div style={{height:1,background:C.grey3,marginBottom:16}}/>
                <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>What this means for GWI</div>
                <p style={{color:C.offBlack,fontSize:15,lineHeight:1.7,margin:0}}>{active.insight}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {active.signals.map(function(sig,i){
                  var tc=typeColors[sig.type]||{bg:C.grey3,text:C.grey8,label:sig.type};
                  return(
                    <div key={i} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:"20px 24px"}}>
                      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{background:C.white,color:C.grey8,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,border:"1px solid "+C.grey4}}>{tc.label}</span>
                        <span style={{background:C.white,color:C.grey8,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,border:"1px solid "+C.grey4}}>{sig.stage}</span>
                      </div>
                      <p style={{fontSize:16,fontWeight:700,color:C.black,margin:"0 0 10px",lineHeight:1.4}}>{sig.text}</p>
                      <p style={{fontSize:14,color:C.grey7,lineHeight:1.7,margin:"0 0 16px"}}>{sig.explanation}</p>
                      <div style={{borderTop:"1px solid "+C.grey3,paddingTop:12}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Personas affected</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {sig.personas.map(function(pid){var p=personas.find(function(x){return x.id===pid;});var col=p?getPersonaColor(p):{bg:C.grey3,border:C.grey5,text:C.grey8};return <span key={pid} style={{background:col.bg,color:col.text,border:"1px solid "+col.border,fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99}}>{p?p.label:pid}</span>;})}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JourneyPage({pages,personas,journeys,initialPersonaId,setView,goToJourney}){
  var [activePersona,setActivePersona]=useState(initialPersonaId||(personas[0]?personas[0].id:null));
  var [activeStage,setActiveStage]=useState(null);
  var isMobile=useWidth()<768;
  useEffect(function(){if(initialPersonaId){setActivePersona(initialPersonaId);setActiveStage(null);}},[initialPersonaId]);
  var persona=personas.find(function(p){return p.id===activePersona;})||personas[0];
  if(!persona)return <div style={{padding:32,color:C.grey7}}>No personas yet.</div>;
  var col=getPersonaColor(persona);
  var journey=journeys[persona.id]||[];
  var visiblePages=pages.filter(function(p){return !p.hidden;});
  var sectionSet={};visiblePages.forEach(function(p){sectionSet[p.section]=true;});
  var sections=Object.keys(sectionSet);
  var pageStageMap={};journey.forEach(function(j){j.pages.forEach(function(url){if(!pageStageMap[url])pageStageMap[url]=[];pageStageMap[url].push(j.stage);});});
  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100%",overflow:"hidden"}}>
      <MappingSidebar activeId="journey" setView={setView} isMobile={isMobile} personas={personas} activePersona={activePersona} setActivePersona={function(id){if(goToJourney)goToJourney(id);else{setActivePersona(id);setActiveStage(null);}}}/>
      <div style={{flex:1,overflow:"auto",padding:isMobile?16:20,background:C.grey2}}>
        <div style={{maxWidth:920,margin:"0 auto",paddingBottom:80}}>
          <BlackHero eyebrow="How personas move through gwi.com" title="Journey Mapper" desc="Every persona has a different entry point, a different set of questions, and a different path through the site." why="The Journey Mapper makes visible something that is easy to miss: each persona takes a completely different path through gwi.com."/>
          <div style={{background:col.bg,border:"1px solid "+col.border,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontWeight:700,color:C.black,fontSize:15}}>{persona.label}</div>
            <div style={{fontSize:13,color:C.black,marginTop:4}}>{persona.entry}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>
              {journey.map(function(j){var isActive=activeStage===j.stage;return(
                <button key={j.stage} onClick={function(){setActiveStage(activeStage===j.stage?null:j.stage);}} style={{background:isActive?C.pink:C.white,color:isActive?C.white:C.offBlack,border:"1.5px solid "+(isActive?C.pink:C.grey4),fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:99,cursor:"pointer"}}>{j.stage}</button>
              );})}
            </div>
          </div>
          {activeStage&&(function(){
            var s=journey.find(function(j){return j.stage===activeStage;});
            var sc=STAGE_COLORS[activeStage]||{};
            if(!s)return null;
            return(
              <div style={{background:sc.bg||C.grey3,border:"1px solid "+(sc.border||C.grey5),borderRadius:12,padding:16,marginBottom:16}}>
                <p style={{fontSize:13,color:C.offBlack,margin:"0 0 16px"}}>{s.note}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {s.pages.map(function(url){return <span key={url} style={{background:C.white,border:"1px solid "+C.grey5,fontSize:12,color:C.grey8,padding:"4px 8px",borderRadius:6,fontFamily:"monospace"}}>{url.replace("https://gwi.ai","gwi.ai").replace("https://trust.gwi.com","trust.gwi.com")}</span>;})}
                </div>
              </div>
            );
          })()}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:20}}>
            <div style={{background:C.black,borderRadius:12,padding:24}}><div style={{fontSize:56,fontWeight:800,color:C.white,lineHeight:1}}>{journey.length}</div><div style={{fontSize:14,fontWeight:600,color:C.grey6,marginTop:8}}>Lifecycle stages</div></div>
            <div style={{background:C.black,borderRadius:12,padding:24}}><div style={{fontSize:56,fontWeight:800,color:C.white,lineHeight:1}}>{journey.reduce(function(a,j){return a+j.pages.length;},0)}</div><div style={{fontSize:14,fontWeight:600,color:C.grey6,marginTop:8}}>Page touchpoints</div></div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Full Journey</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {journey.map(function(j,i){
                var sc=STAGE_COLORS[j.stage]||{};var isActive=activeStage===j.stage;
                return(
                  <div key={i} onClick={function(){setActiveStage(activeStage===j.stage?null:j.stage);}} style={{background:isActive?sc.bg||C.grey3:C.white,border:"1px solid "+(isActive?sc.border||C.grey5:C.grey4),borderRadius:10,cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:12}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:C.white,border:"2px solid "+C.pink,color:C.black,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                      <span style={{background:sc.bg||C.grey3,color:sc.text||C.grey8,border:"1px solid "+(sc.border||C.grey5),fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,flexShrink:0,whiteSpace:"nowrap"}}>{j.stage}</span>
                      <p style={{fontSize:12,color:C.grey7,flex:1,margin:0}}>{j.note}</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,width:isMobile?120:200,flexShrink:0,justifyContent:"flex-end"}}>
                        {j.pages.map(function(url){return <span key={url} style={{background:C.grey3,color:C.grey8,fontSize:11,padding:"2px 6px",borderRadius:4,fontFamily:"monospace"}}>{url.replace("https://gwi.ai","gwi.ai").replace("https://trust.gwi.com","trust.gwi.com")}</span>;})}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>All GWI.com Pages</div>
            {sections.map(function(section){return(
              <div key={section} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:C.grey6,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>{section}</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {visiblePages.filter(function(p){return p.section===section;}).map(function(page){
                    var stgs=pageStageMap[page.url]||[];var visited=stgs.length>0;
                    return(
                      <div key={page.url} style={{display:"flex",alignItems:"center",gap:12,background:visited?C.white:C.grey3,border:"1px solid "+(visited?col.border:C.grey4),borderRadius:8,padding:"8px 12px",opacity:visited?1:0.45,fontSize:12}}>
                        <span style={{fontFamily:"monospace",color:C.pink,width:isMobile?120:240,flexShrink:0}}>{page.url.replace("https://gwi.ai","gwi.ai").replace("https://trust.gwi.com","trust.gwi.com")}</span>
                        <span style={{color:C.grey7,flex:1}}>{page.label}</span>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          {visited?stgs.map(function(s){var sc=STAGE_COLORS[s]||{};return <span key={s} style={{background:sc.bg||C.grey3,color:sc.text||C.grey8,border:"1px solid "+(sc.border||C.grey5),fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99}}>{s}</span>;}):<span style={{color:C.grey6,fontStyle:"italic"}}>not in journey</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonaToggle({personaIds,personas}){
  var [open,setOpen]=useState(false);
  return(
    <div style={{marginTop:12}}>
      <button onClick={function(){setOpen(!open);}} style={{background:"transparent",color:C.grey7,border:"1px solid "+C.grey5,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>
        <span>{open?"-":"+"}</span>{open?"Hide personas":"View personas"}
      </button>
      {open&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
          {personaIds.map(function(pid){var p=personas.find(function(x){return x.id===pid;});if(!p)return null;var col=getPersonaColor(p);return <span key={pid} style={{background:col.bg,color:col.text,border:"1px solid "+col.border,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99}}>{p.label}</span>;})}
        </div>
      )}
    </div>
  );
}

function ActionList({pageId,actions,reorderActions,openAction,setOpenAction,statusCfg,setActionStatus,updateAction,deleteAction,calcDelta,isMobile}){
  var dragIdx=useRef(null);
  var [dropIdx,setDropIdx]=useState(null);
  function onDragStart(i){dragIdx.current=i;}
  function onDragOver(e,i){e.preventDefault();e.stopPropagation();if(i!==dragIdx.current)setDropIdx(i);}
  function onDrop(e,i){e.preventDefault();e.stopPropagation();var from=dragIdx.current;if(from===null||from===i){setDropIdx(null);return;}var next=actions.slice();var moved=next.splice(from,1)[0];next.splice(i,0,moved);reorderActions(pageId,next);dragIdx.current=null;setDropIdx(null);}
  function onDragEnd(){dragIdx.current=null;setDropIdx(null);}
  function Inp({val,onChange,placeholder}){return <input value={val||""} onChange={function(e){onChange(e.target.value);}} placeholder={placeholder||""} style={{width:"100%",padding:"6px 8px",border:"1px solid "+C.grey4,borderRadius:6,fontSize:12,color:C.offBlack,background:C.white,boxSizing:"border-box"}}/>;}
  return(
    <div style={{padding:"16px 20px"}}>
      <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Recommendations</div>
      <div>
        {actions.map(function(action,actionIdx){
          var isOpenAction=openAction===(pageId+"-"+action.id);
          var delta=calcDelta(action.before,action.after);
          var needsBaseline=action.status==="inprogress"&&!action.before;
          return(
            <div key={action.id}>
              {dropIdx===actionIdx&&<DropLine/>}
              <div draggable onDragStart={function(e){e.stopPropagation();onDragStart(actionIdx);}} onDragOver={function(e){onDragOver(e,actionIdx);}} onDrop={function(e){onDrop(e,actionIdx);}} onDragEnd={onDragEnd}
                style={{border:"1px solid "+(isOpenAction?C.pink:needsBaseline?"#F5A623":C.grey4),borderRadius:10,marginBottom:6,overflow:"hidden",background:C.white,opacity:dropIdx===actionIdx?0.5:1}}>
                <div onClick={function(){setOpenAction(isOpenAction?null:(pageId+"-"+action.id));}} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                  <div style={{cursor:"grab",color:C.grey5,fontSize:14,flexShrink:0,userSelect:"none"}}>⠿</div>
                  <div style={{cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center"}} onClick={function(e){e.stopPropagation();var order=["todo","inprogress","done"];var next=order[(order.indexOf(action.status)+1)%order.length];setActionStatus(pageId,action.id,next);}}>
                    <span style={{background:statusCfg[action.status].bg,color:statusCfg[action.status].text,border:"1px solid "+statusCfg[action.status].border,fontSize:10,fontWeight:600,padding:"2px 10px",borderRadius:99}}>{statusCfg[action.status].label}</span>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:action.status==="done"?C.grey7:C.offBlack,flex:1,textDecoration:action.status==="done"?"line-through":"none"}}>{action.text}</span>
                  {delta&&<span style={{background:delta.positive?"#E6F9F2":"#FFF0F0",color:delta.positive?"#005C3B":"#CC0000",border:"1px solid "+(delta.positive?"#80D4B0":"#FFAAAA"),fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:99,flexShrink:0}}>{delta.positive?"+":""}{delta.pct}%</span>}
                  {needsBaseline&&<span style={{background:"#FFF8E6",color:"#7A4F00",border:"1px solid #F5C842",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,flexShrink:0}}>Record baseline</span>}
                  <ChevronRight size={21} color={C.pink} style={{flexShrink:0,transform:isOpenAction?"rotate(-90deg)":"rotate(90deg)",transition:"transform 0.15s"}}/>
                </div>
                {isOpenAction&&(
                  <div style={{borderTop:"1px solid "+C.grey4,padding:16,background:"#F8FAFF"}}>
                    {(action.shows||action.why||action.change)?(
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                        {[
                          {label:"Change",value:action.change,labelColor:C.pink,textColor:C.offBlack},
                          {label:"Why it matters",value:action.why,labelColor:C.grey8,textColor:C.grey8},
                          {label:"Data",value:action.shows,labelColor:C.grey8,textColor:C.grey8},
                        ].map(function(col){return col.value?(
                          <div key={col.label} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:8,padding:"12px 14px"}}>
                            <div style={{fontSize:10,fontWeight:700,color:col.labelColor,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{col.label}</div>
                            <div style={{fontSize:13,color:col.textColor,lineHeight:1.6}}>{col.value}</div>
                          </div>
                        ):null;})}
                      </div>
                    ):action.description?<p style={{fontSize:13,color:C.offBlack,lineHeight:1.7,margin:"0 0 20px"}}>{action.description}</p>:null}
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Effort to implement</div>
                      <div style={{display:"flex",gap:6}}>
                        {[["Low","#E6F9F2","#005C3B","#80D4B0"],["Medium",C.grey3,C.grey8,C.grey5],["High","#FFF0F0","#CC0000","#FFAAAA"]].map(function(ef){var isActive=action.effort===ef[0];return(
                          <button key={ef[0]} onClick={function(e){e.stopPropagation();updateAction(pageId,action.id,"effort",isActive?"":ef[0]);}} style={{background:isActive?ef[1]:C.white,color:isActive?ef[2]:C.grey7,border:"1px solid "+(isActive?ef[3]:C.grey4),borderRadius:99,padding:"4px 16px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>{ef[0]}</button>
                        );})}
                      </div>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Before / After Tracking</div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:10,marginBottom:10}}>
                      <div><div style={{fontSize:11,fontWeight:600,color:C.grey7,marginBottom:4}}>Metric being tracked</div><Inp val={action.metric} onChange={function(v){updateAction(pageId,action.id,"metric",v);}} placeholder="e.g. Sign-up CTR on homepage"/></div>
                      <div><div style={{fontSize:11,fontWeight:600,color:C.grey7,marginBottom:4}}>Data source</div><Inp val={action.source} onChange={function(v){updateAction(pageId,action.id,"source",v);}} placeholder="GA4, Hotjar..."/></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
                      <div style={{background:C.white,border:"1px solid "+C.grey5,borderRadius:8,padding:12}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.offBlack,marginBottom:8}}>Before</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                          <div><div style={{fontSize:10,color:C.grey7,marginBottom:3}}>Value</div><Inp val={action.before} onChange={function(v){updateAction(pageId,action.id,"before",v);}} placeholder="e.g. 0.89%"/></div>
                          <div><div style={{fontSize:10,color:C.grey7,marginBottom:3}}>Date</div><Inp val={action.beforeDate} onChange={function(v){updateAction(pageId,action.id,"beforeDate",v);}} placeholder="YYYY-MM-DD"/></div>
                        </div>
                      </div>
                      <div style={{background:C.white,border:"1px solid "+C.grey5,borderRadius:8,padding:12,opacity:action.status==="done"?1:0.5}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.offBlack,marginBottom:8}}>After</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                          <div><div style={{fontSize:10,color:C.grey7,marginBottom:3}}>Value</div><Inp val={action.after} onChange={function(v){updateAction(pageId,action.id,"after",v);}} placeholder="e.g. 1.4%"/></div>
                          <div><div style={{fontSize:10,color:C.grey7,marginBottom:3}}>Date</div><Inp val={action.afterDate} onChange={function(v){updateAction(pageId,action.id,"afterDate",v);}} placeholder="YYYY-MM-DD"/></div>
                        </div>
                      </div>
                    </div>
                    {delta&&<div style={{background:delta.positive?"#E6F9F2":"#FFF0F0",border:"1px solid "+(delta.positive?"#80D4B0":"#FFAAAA"),borderRadius:8,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:delta.positive?"#005C3B":"#CC0000"}}>{delta.positive?"Improved":"Declined"} by {Math.abs(delta.pct)}%</div><div style={{fontSize:12,color:C.grey7}}>{action.before} to {action.after} via {action.source||"unknown"}</div></div>}
                    {!delta&&action.before&&!action.after&&<div style={{background:"#FFF8E6",border:"1px solid #F5C842",borderRadius:8,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:12,color:"#7A4F00",fontWeight:600}}>Baseline captured. Add After value once the change has settled.</div></div>}
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <button onClick={function(){deleteAction(pageId,action.id);}} style={{background:"transparent",color:C.pink,border:"1px solid "+C.pink,borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}
                        onMouseEnter={function(e){e.currentTarget.style.background=C.pink;e.currentTarget.style.color=C.white;}}
                        onMouseLeave={function(e){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.pink;}}>Delete action</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {dropIdx===actions.length&&<DropLine/>}
      </div>
    </div>
  );
}

function AuditPage({personas,pages,auditData,setAuditData,onAddAction,onSaveWireframe,setView,wireframeRules}){
  var [openPage,setOpenPage]=useState(null);
  var [openAction,setOpenAction]=useState(null);
  var [generating,setGenerating]=useState({});
  var [whyPage,setWhyPage]=useState(null);
  var [wireframePage,setWireframePage]=useState(null);
  var [personasOpen,setPersonasOpen]=useState({});
  var isMobile=useWidth()<768;
  var prevOpen=useRef(null);
  var pageDrag=useDragList(auditData,setAuditData);
  var matrixDragRef=useRef<any>(null);
  var [matrixDropTarget,setMatrixDropTarget]=useState<any>(null);

  function triggerGenerate(page){
    if(generating[page.id]||page.issue)return;
    setGenerating(function(g){return Object.assign({},g,{[page.id]:true});});
    fetchIssueSummary(page,function(text){setAuditData(function(prev){return prev.map(function(p){return p.id===page.id?Object.assign({},p,{issue:text}):p;});});},function(){setGenerating(function(g){return Object.assign({},g,{[page.id]:false});});});
  }
  function regenerate(page){
    setAuditData(function(prev){return prev.map(function(p){return p.id===page.id?Object.assign({},p,{issue:""}):p;});});
    setGenerating(function(g){return Object.assign({},g,{[page.id]:true});});
    fetchIssueSummary(page,function(text){setAuditData(function(prev){return prev.map(function(p){return p.id===page.id?Object.assign({},p,{issue:text}):p;});});},function(){setGenerating(function(g){return Object.assign({},g,{[page.id]:false});});});
  }
  useEffect(function(){
    if(openPage&&openPage!==prevOpen.current){prevOpen.current=openPage;var page=auditData.find(function(p){return p.id===openPage;});if(page&&page.actions.length>0)triggerGenerate(page);}
    if(!openPage)prevOpen.current=null;
  });

  var statusCfg={todo:{label:"To do",bg:C.grey3,text:C.grey8,border:C.grey5},inprogress:{label:"In progress",bg:C.blueBg,text:C.blueDark,border:C.blueLight},done:{label:"Done",bg:"#E6F9F2",text:"#005C3B",border:"#80D4B0"}};
  var pCfg={Critical:{bg:"#FFEEF6",text:"#880040",border:"#FF80BB"},High:{bg:C.blueBg,text:C.blueDark,border:C.blueLight},Medium:{bg:C.grey3,text:C.grey8,border:C.grey5},Low:{bg:"#E6F9F2",text:"#005C3B",border:"#80D4B0"}};

  function updateAction(pageId,actionId,field,value){setAuditData(function(prev){return prev.map(function(p){if(p.id!==pageId)return p;return Object.assign({},p,{actions:p.actions.map(function(a){if(a.id!==actionId)return a;return Object.assign({},a,{[field]:value});})});});});}
  function setActionStatus(pageId,actionId,status){
    var today=new Date().toISOString().split("T")[0];
    setAuditData(function(prev){return prev.map(function(p){if(p.id!==pageId)return p;return Object.assign({},p,{actions:p.actions.map(function(a){if(a.id!==actionId)return a;var upd=Object.assign({},a,{status:status});if(status==="inprogress"&&!a.beforeDate)upd.beforeDate=today;return upd;})});});});
  }
  function deleteAction(pageId,actionId){setAuditData(function(prev){return prev.map(function(p){if(p.id!==pageId)return p;return Object.assign({},p,{actions:p.actions.filter(function(a){return a.id!==actionId;})});});});}
  function reorderActions(pageId,next){setAuditData(function(prev){return prev.map(function(p){return p.id!==pageId?p:Object.assign({},p,{actions:next});});});}
  function handleMatrixDrop(e:any,toPri:string,priActions:any[],toIdx:number){
    e.preventDefault();
    var drag=matrixDragRef.current;
    if(!drag){setMatrixDropTarget(null);return;}
    if(drag.fromPri===toPri){
      var fromIdx=drag.fromIdx;
      if(fromIdx===toIdx){setMatrixDropTarget(null);return;}
      var newFlat=priActions.slice();
      var moved=newFlat.splice(fromIdx,1)[0];
      newFlat.splice(fromIdx<toIdx?toIdx-1:toIdx,0,moved);
      setAuditData(function(prev){return prev.map(function(page){
        var pageColActions=newFlat.filter(function(a){return a.pageId===page.id;});
        if(pageColActions.length===0)return page;
        var queue=pageColActions.map(function(a){return page.actions.find(function(x){return x.id===a.id;});}).filter(Boolean);
        var result=page.actions.map(function(a){return (a.priority||page.priority)===toPri?queue.shift()||a:a;});
        return Object.assign({},page,{actions:result});
      });});
    } else {
      setAuditData(function(prev){return prev.map(function(p){
        if(p.id!==drag.pageId)return p;
        return Object.assign({},p,{actions:p.actions.map(function(a){return a.id===drag.actionId?Object.assign({},a,{priority:toPri}):a;})});
      });});
    }
    matrixDragRef.current=null;
    setMatrixDropTarget(null);
  }
  function calcDelta(before,after){var b=parseFloat(before),a=parseFloat(after);if(isNaN(b)||isNaN(a)||b===0)return null;return{pct:((a-b)/b*100).toFixed(1),positive:a>=b};}

  var totalActions=auditData.reduce(function(s,p){return s+p.actions.length;},0);
  var doneActions=auditData.reduce(function(s,p){return s+p.actions.filter(function(a){return a.status==="done";}).length;},0);
  var inProgActions=auditData.reduce(function(s,p){return s+p.actions.filter(function(a){return a.status==="inprogress";}).length;},0);
  var todoActions=totalActions-doneActions-inProgActions;
  var [auditView,setAuditView]=useState("list");
  var priorityLevels=["Critical","High","Medium","Low"];

  return(<>
    <PageWrap isMobile={isMobile}>
      {whyPage&&<WhyModal url={whyPage.url} label={whyPage.label} onClose={function(){setWhyPage(null);}}/>}
      <BlackHero eyebrow="GWI Website - UX" title="Recommendations" desc="All the actions you have decided to work on, in one place." why="This is where audit findings become real work.">
        <button onClick={onAddAction} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add UX Action</button>
      </BlackHero>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {priorityLevels.map(function(pri){
          var pc=pCfg[pri]||pCfg.Medium;
          var priAllActions=auditData.reduce(function(s,p){return s.concat(p.actions.filter(function(a){return (a.priority||p.priority)===pri;}));},[]);
          var priTotal=priAllActions.length;
          var priDone=priAllActions.filter(function(a){return a.status==="done";}).length;
          var priPct=priTotal?Math.round(priDone/priTotal*100):0;
          return(
            <div key={pri} onClick={function(){setAuditView("matrix");}} style={{background:pc.bg,border:"1px solid "+pc.border,borderRadius:12,padding:"16px 20px",cursor:"pointer",transition:"box-shadow 0.15s"}} onMouseEnter={function(e){(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 16px rgba(0,0,0,0.12)";}} onMouseLeave={function(e){(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
              <div style={{fontSize:11,fontWeight:700,color:pc.text,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{pri}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
                <span style={{fontSize:40,fontWeight:800,color:pc.text,lineHeight:1}}>{priDone}</span>
                <span style={{fontSize:20,fontWeight:700,color:pc.text,opacity:0.4}}>/{priTotal}</span>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:pc.text,opacity:0.6,marginBottom:10}}>actions complete</div>
              <div style={{background:"rgba(0,0,0,0.1)",borderRadius:99,height:4,overflow:"hidden",marginBottom:10}}>
                <div style={{width:priPct+"%",background:pc.text,height:"100%",borderRadius:99,transition:"width 0.4s"}}/>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:pc.text,opacity:0.5,display:"flex",alignItems:"center",gap:3}}>View matrix →</div>
            </div>
          );
        })}
      </div>
      <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:"16px 20px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:700,color:C.offBlack}}>Overall progress</div>
          <span style={{fontSize:15,fontWeight:800,color:C.offBlack}}>{totalActions?Math.round(doneActions/totalActions*100):0}%</span>
        </div>
        <div style={{background:C.grey3,borderRadius:99,height:8,overflow:"hidden",display:"flex"}}>
          <div style={{width:(totalActions?todoActions/totalActions*100:0)+"%",background:C.grey5,height:"100%",flexShrink:0,transition:"width 0.4s"}}/>
          <div style={{width:(totalActions?inProgActions/totalActions*100:0)+"%",background:C.blueMed,height:"100%",flexShrink:0,transition:"width 0.4s"}}/>
          <div style={{width:(totalActions?doneActions/totalActions*100:0)+"%",background:"#00A86B",height:"100%",flexShrink:0,borderRadius:"0 99px 99px 0",transition:"width 0.4s"}}/>
        </div>
      </div>
      <div style={{display:"inline-flex",background:C.grey3,borderRadius:12,padding:4,gap:0,marginBottom:16,position:"relative"}}>
        <div style={{position:"absolute",top:4,left:auditView==="list"?4:"calc(50% + 2px)",width:"calc(50% - 6px)",height:"calc(100% - 8px)",background:C.white,borderRadius:9,boxShadow:"0 1px 4px rgba(0,0,0,0.13)",transition:"left 0.2s cubic-bezier(0.4,0,0.2,1)",pointerEvents:"none"}}/>
        <button onClick={function(){setAuditView("list");}} title="List view" style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:6,padding:"7px 18px",borderRadius:9,border:"none",background:"transparent",color:auditView==="list"?C.offBlack:C.grey6,fontWeight:700,fontSize:12,cursor:"pointer",transition:"color 0.15s"}}><List size={15} strokeWidth={2.2}/>List</button>
        <button onClick={function(){setAuditView("matrix");}} title="Matrix view" style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:6,padding:"7px 18px",borderRadius:9,border:"none",background:"transparent",color:auditView==="matrix"?C.offBlack:C.grey6,fontWeight:700,fontSize:12,cursor:"pointer",transition:"color 0.15s"}}><LayoutGrid size={15} strokeWidth={2.2}/>Matrix</button>
      </div>
      {auditView==="list"&&<div>
        {auditData.map(function(page,pageIdx){
          if(page.actions.length===0)return null;
          var pcfg=pCfg[page.priority]||pCfg.Medium;
          var isOpen=openPage===page.id;
          var pageDone=page.actions.filter(function(a){return a.status==="done";}).length;
          return(
            <div key={page.id}>
              {pageDrag.dropIdx===pageIdx&&<DropLine/>}
              <div draggable onDragStart={function(){pageDrag.onDragStart(pageIdx);}} onDragOver={function(e){pageDrag.onDragOver(e,pageIdx);}} onDrop={function(e){pageDrag.onDrop(e,pageIdx);}} onDragEnd={pageDrag.onDragEnd}
                style={{background:C.white,border:"1px solid "+(isOpen?C.pink:C.grey4),borderRadius:14,marginBottom:8,overflow:"hidden",opacity:pageDrag.dropIdx===pageIdx?0.5:1}}>
                <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px"}}>
                  <div style={{cursor:"grab",color:C.grey5,fontSize:16,flexShrink:0,userSelect:"none"}}>⠿</div>
                  <button onClick={function(){setOpenPage(isOpen?null:page.id);}} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",padding:0,minWidth:0}}>
                    <span style={{fontWeight:700,color:C.black,fontSize:15,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{page.label}</span>
                    {!isMobile&&<span style={{fontFamily:"monospace",color:C.pink,fontSize:12,flexShrink:0}}>{page.url}</span>}
                    <div style={{width:80,background:C.grey3,borderRadius:99,height:6,flexShrink:0}}><div style={{width:(page.actions.length?Math.round(pageDone/page.actions.length*100):0)+"%",background:"#00A86B",height:"100%",borderRadius:99}}/></div>
                    <span style={{fontSize:11,color:C.grey7,width:40,flexShrink:0}}>{pageDone}/{page.actions.length}</span>
                    <ChevronRight size={21} color={C.pink} style={{flexShrink:0,transform:isOpen?"rotate(-90deg)":"rotate(90deg)",transition:"transform 0.15s"}}/>
                  </button>
                  <button onClick={function(e){e.stopPropagation();setWhyPage({url:page.url,label:page.label});}} style={{background:"transparent",border:"none",cursor:"pointer",color:C.grey5,padding:"2px 4px",flexShrink:0,lineHeight:1,fontSize:16}}
                    onMouseEnter={function(e){e.currentTarget.style.color=C.pink;}}
                    onMouseLeave={function(e){e.currentTarget.style.color=C.grey5;}}>&#9432;</button>
                </div>
                {isOpen&&(
                  <div style={{borderTop:"1px solid "+C.grey4}}>
                    <div style={{padding:"16px 20px",background:C.grey3}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em"}}>Issue</div>
                        {page.issue&&!generating[page.id]&&<button onClick={function(){regenerate(page);}} title="Regenerate" style={{background:"transparent",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",color:C.grey7,lineHeight:1}} onMouseEnter={function(e){e.currentTarget.style.color=C.pink;}} onMouseLeave={function(e){e.currentTarget.style.color=C.grey7;}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>}
                        {page.personas&&page.personas.length>0&&<button onClick={function(){setPersonasOpen(function(prev){var n=Object.assign({},prev);n[page.id]=!prev[page.id];return n;});}} title="View personas" style={{background:"transparent",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",color:personasOpen[page.id]?C.pink:C.grey7,lineHeight:1}} onMouseEnter={function(e){e.currentTarget.style.color=C.pink;}} onMouseLeave={function(e){e.currentTarget.style.color=personasOpen[page.id]?C.pink:C.grey7;}}><Users size={11}/></button>}
                      </div>
                      {personasOpen[page.id]&&page.personas&&page.personas.length>0&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                          {page.personas.map(function(pid){var p=personas.find(function(x){return x.id===pid;});if(!p)return null;var col=getPersonaColor(p);return <span key={pid} style={{background:col.bg,color:col.text,border:"1px solid "+col.border,fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:99}}>{p.label}</span>;})}
                        </div>
                      )}
                      {generating[page.id]?<p style={{fontSize:13,color:C.grey6,lineHeight:1.6,margin:0,fontStyle:"italic"}}>Generating diagnosis...</p>:page.issue?<p style={{fontSize:13,color:C.offBlack,lineHeight:1.6,margin:0}}>{page.issue}</p>:<p style={{fontSize:13,color:C.grey6,lineHeight:1.6,margin:0,fontStyle:"italic"}}>{page.actions.length===0?"Add actions to generate a diagnosis.":"Generating..."}</p>}
                      <div style={{marginTop:8}}>
                        <button onClick={function(){setWireframePage(page);}} style={{background:C.black,color:C.white,border:"none",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,transition:"background 0.15s"}} onMouseEnter={function(e){e.currentTarget.style.background=C.pink;}} onMouseLeave={function(e){e.currentTarget.style.background=C.black;}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>Generate Wireframe</button>
                      </div>
                    </div>
                    <ActionList pageId={page.id} actions={page.actions} reorderActions={reorderActions} openAction={openAction} setOpenAction={setOpenAction} statusCfg={statusCfg} setActionStatus={setActionStatus} updateAction={updateAction} deleteAction={deleteAction} calcDelta={calcDelta} isMobile={isMobile}/>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {pageDrag.dropIdx===auditData.length&&<DropLine/>}
      </div>}
      {auditView==="matrix"&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
          {priorityLevels.map(function(pri){
            var pc=pCfg[pri]||pCfg.Medium;
            var priActions=auditData.reduce(function(acc,pg){return acc.concat(pg.actions.filter(function(a){return (a.priority||pg.priority)===pri;}).map(function(a){return Object.assign({},a,{pageLabel:pg.label,pageId:pg.id,fromPri:pri});}));},[] as any[]);
            var priTotal=priActions.length;
            var priDone=priActions.filter(function(a){return a.status==="done";}).length;
            var priPct=priTotal?Math.round(priDone/priTotal*100):0;
            var isDropTarget=matrixDropTarget&&matrixDropTarget.toPri===pri;
            return(
              <div key={pri}
                style={{background:pc.bg,border:"1.5px solid "+(isDropTarget?pc.text:pc.border),borderRadius:12,overflow:"hidden",transition:"border-color 0.1s"}}
                onDragOver={function(e){e.preventDefault();if(!matrixDragRef.current)return;setMatrixDropTarget({toPri:pri,toIdx:priActions.length});}}
                onDrop={function(e){handleMatrixDrop(e,pri,priActions,priActions.length);}}>
                <div style={{padding:"16px 20px",borderBottom:"1px solid "+pc.border}}>
                  <div style={{fontSize:11,fontWeight:700,color:pc.text,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{pri}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
                    <span style={{fontSize:32,fontWeight:800,color:pc.text,lineHeight:1}}>{priDone}</span>
                    <span style={{fontSize:16,fontWeight:700,color:pc.text,opacity:0.4}}>/{priTotal}</span>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:pc.text,opacity:0.6,marginBottom:8}}>actions complete</div>
                  <div style={{background:"rgba(0,0,0,0.1)",borderRadius:99,height:4,overflow:"hidden"}}>
                    <div style={{width:priPct+"%",background:pc.text,height:"100%",borderRadius:99,transition:"width 0.4s"}}/>
                  </div>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:0,minHeight:40}}
                  onDragOver={function(e){e.preventDefault();if(!matrixDragRef.current)return;setMatrixDropTarget({toPri:pri,toIdx:priActions.length});}}
                  onDrop={function(e){handleMatrixDrop(e,pri,priActions,priActions.length);}}>
                  {priActions.length===0
                    ?<div style={{fontSize:12,color:pc.text,opacity:0.45,fontStyle:"italic",textAlign:"center",padding:"16px 0"}}>No actions</div>
                    :priActions.map(function(a,actionIdx){
                      var done=a.status==="done";
                      var isDragging=matrixDragRef.current&&matrixDragRef.current.actionId===a.id;
                      var showDropLine=isDropTarget&&matrixDropTarget.toIdx===actionIdx;
                      return(
                        <div key={a.id}>
                          {showDropLine&&<div style={{height:3,background:pc.text,borderRadius:99,margin:"2px 0"}}/>}
                          <div
                            draggable
                            onDragStart={function(e){e.stopPropagation();matrixDragRef.current={actionId:a.id,pageId:a.pageId,fromPri:pri,fromIdx:actionIdx};}}
                            onDragOver={function(e){e.preventDefault();e.stopPropagation();if(!matrixDragRef.current)return;setMatrixDropTarget({toPri:pri,toIdx:actionIdx});}}
                            onDrop={function(e){e.stopPropagation();handleMatrixDrop(e,pri,priActions,actionIdx);}}
                            onDragEnd={function(){matrixDragRef.current=null;setMatrixDropTarget(null);}}
                            style={{background:"rgba(255,255,255,0.65)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"flex-start",gap:8,marginBottom:4,opacity:isDragging?0.4:1,cursor:"grab",transition:"opacity 0.15s"}}>
                            <div style={{color:C.grey5,fontSize:12,flexShrink:0,paddingTop:2,userSelect:"none"}}>⠿</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:700,color:done?C.grey6:C.offBlack,textDecoration:done?"line-through":"none",lineHeight:1.4,marginBottom:5}}>{a.text}</div>
                              <div style={{fontSize:10,color:pc.text,opacity:0.7,marginBottom:5}}>{a.pageLabel}</div>
                              <div style={{display:"flex",alignItems:"center",gap:5}}>
                                <div onClick={function(){var order=["todo","inprogress","done"];var next=order[(order.indexOf(a.status)+1)%order.length];setActionStatus(a.pageId,a.id,next);}} style={{cursor:"pointer",flexShrink:0}}>
                                  <span style={{background:statusCfg[a.status].bg,color:statusCfg[a.status].text,border:"1px solid "+statusCfg[a.status].border,fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99}}>{statusCfg[a.status].label}</span>
                                </div>
                                {a.effort&&<span style={{background:a.effort==="Low"?"#E6F9F2":a.effort==="High"?"#FFF0F0":C.grey3,color:a.effort==="Low"?"#005C3B":a.effort==="High"?"#CC0000":C.grey8,border:"1px solid "+(a.effort==="Low"?"#80D4B0":a.effort==="High"?"#FFAAAA":C.grey5),fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,flexShrink:0}}>{a.effort} effort</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                  {isDropTarget&&matrixDropTarget.toIdx===priActions.length&&<div style={{height:3,background:pc.text,borderRadius:99,margin:"2px 0"}}/>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrap>
    {wireframePage&&<WireframeModal page={wireframePage} personas={personas} rules={wireframeRules} onClose={function(navigate){setWireframePage(null);if(navigate)setView("wireframes");}} onSave={onSaveWireframe}/>}
  </>);
}

function AnalyticsPage({gaCards,setGaCards}){
  var [tab,setTab]=useState("ga");
  var [showNotice,setShowNotice]=useState(function(){try{return localStorage.getItem("analytics_notice_dismissed")!=="1";}catch(e){return true;}});
  var [hoveredCard,setHoveredCard]=useState<string|null>(null);
  var [editingCard,setEditingCard]=useState<any>(null);
  var [editUrl,setEditUrl]=useState("");
  var isMobile=useWidth()<768;
  var CARD_ICONS_MAP={LayoutDashboard:<LayoutDashboard size={22}/>,Home:<Home size={22}/>,Puzzle:<Puzzle size={22}/>,DollarSign:<DollarSign size={22}/>,FileText:<FileText size={22}/>,Bot:<Bot size={22}/>,MousePointerClick:<MousePointerClick size={22}/>,GitMerge:<GitMerge size={22}/>,BarChart2:<BarChart2 size={22}/>,Layers:<Layers size={22}/>,Zap:<Zap size={22}/>,Brain:<Brain size={22}/>};
  return(
    <div style={{position:"relative",height:"100%"}}>
      {showNotice&&(
        <Modal>
          <div style={{width:48,height:48,borderRadius:"50%",background:C.grey3,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><BarChart2 size={22} color={C.grey7}/></div>
          <h2 style={{fontSize:20,fontWeight:800,color:C.black,margin:"0 0 12px"}}>Analytics is getting an upgrade</h2>
          <p style={{fontSize:14,color:C.grey7,lineHeight:1.7,margin:"0 0 8px"}}>This section currently links out to GA4 and Hotjar directly.</p>
          <p style={{fontSize:14,color:C.grey7,lineHeight:1.7,margin:"0 0 28px"}}>Once we have a <strong style={{color:C.black}}>Claude Code licence</strong>, this will be rebuilt to pull live analytics data directly into the tool.</p>
          <button autoFocus onClick={function(){setShowNotice(false);try{localStorage.setItem("analytics_notice_dismissed","1");}catch(e){}}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Got it, take me in</button>
        </Modal>
      )}
      <PageWrap isMobile={isMobile}>
        <BlackHero eyebrow="GWI Website - Data" title="Analytics" desc="Browse page-level GA4 and Hotjar reports." why="Analytics grounds every UX recommendation in real behaviour rather than assumption."/>
        <div style={{display:"flex",gap:4,marginBottom:28,background:C.grey4,borderRadius:10,padding:4,width:"fit-content"}}>
          {[["ga","Google Analytics"],["hotjar","Hotjar Heatmaps"]].map(function(item){return(
            <button key={item[0]} onClick={function(){setTab(item[0]);}} style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:tab===item[0]?C.pink:"transparent",color:tab===item[0]?C.white:C.grey7}}>{item[1]}</button>
          );})}
        </div>
        {tab==="ga"&&(
          <>
            <div style={{marginBottom:16,background:C.grey3,border:"1px solid "+C.grey5,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"flex-start",gap:8}}>
              <AlertTriangle size={14} color={C.grey7} style={{flexShrink:0,marginTop:1}}/>
              <span style={{fontSize:12,color:C.grey7,lineHeight:1.6}}><strong style={{color:C.grey8}}>Heads up:</strong> All GA4 links below are filtered to approximately the last 28 days. If you are exporting a CSV, update the date range in GA4 before downloading to make sure you get the full period you need.</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
              {(gaCards||[]).map(function(card){var ckey=card.id||card.title;var isHov=hoveredCard===ckey;return(
                <div key={ckey} style={{position:"relative"}} onMouseEnter={function(){setHoveredCard(ckey);}} onMouseLeave={function(){setHoveredCard(null);}}>
                  <a href={card.url} target="_blank" rel="noreferrer"
                    style={{display:"flex",flexDirection:"column",gap:8,background:C.white,border:"1.5px solid "+C.grey4,borderRadius:14,padding:20,textDecoration:"none",color:"inherit",height:"100%",boxSizing:"border-box"}}
                    onMouseEnter={function(e){e.currentTarget.style.borderColor="#FFE8EE";e.currentTarget.style.boxShadow="0 4px 16px rgba(255,0,119,0.06)";}}
                    onMouseLeave={function(e){e.currentTarget.style.borderColor=C.grey4;e.currentTarget.style.boxShadow="none";}}>
                    <div style={{color:C.pink}}>{CARD_ICONS_MAP[card.iconKey]||<BarChart2 size={22}/>}</div>
                    <div style={{fontSize:17,fontWeight:800,color:C.offBlack}}>{card.title}</div>
                    <p style={{fontSize:15,color:C.grey7,lineHeight:1.65,margin:0,flex:1}}>{card.desc}</p>
                    <CardLink label="Open in GA4"/>
                  </a>
                  <button onClick={function(e){e.preventDefault();e.stopPropagation();setEditingCard(card);setEditUrl(card.url||"");}} title="Edit URL" style={{position:"absolute",top:10,right:10,background:C.grey3,border:"none",borderRadius:6,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.grey7,opacity:isHov?1:0,transition:"opacity 0.15s,background 0.15s",pointerEvents:isHov?"auto":"none"}} onMouseEnter={function(e){e.currentTarget.style.background=C.grey5;e.currentTarget.style.color=C.white;}} onMouseLeave={function(e){e.currentTarget.style.background=C.grey3;e.currentTarget.style.color=C.grey7;}}><Cog size={13}/></button>
                </div>
              );})}
            </div>
            {editingCard&&(
              <div onClick={function(){setEditingCard(null);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:24}}>
                <div onClick={function(e){e.stopPropagation();}} style={{background:C.white,borderRadius:16,padding:"28px 32px",maxWidth:480,width:"100%",boxShadow:"0 8px 48px rgba(0,0,0,0.2)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                    <span style={{background:C.grey3,width:34,height:34,borderRadius:10,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Cog size={16} color={C.grey7}/></span>
                    <h2 style={{fontSize:16,fontWeight:800,color:C.black,margin:0,flex:1}}>{editingCard.title}</h2>
                    <button onClick={function(){setEditingCard(null);}} style={{background:"none",border:"none",cursor:"pointer",color:C.grey6,fontSize:22,lineHeight:1,padding:"0 0 2px",display:"flex",alignItems:"center"}}>×</button>
                  </div>
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>GA4 URL</div>
                    <input autoFocus value={editUrl} onChange={function(e){setEditUrl(e.target.value);}} placeholder="https://analytics.google.com/analytics/web/..." style={{width:"100%",padding:"10px 12px",border:"1.5px solid "+C.grey4,borderRadius:8,fontSize:13,color:C.offBlack,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}} onFocus={function(e){e.currentTarget.style.borderColor=C.pink;}} onBlur={function(e){e.currentTarget.style.borderColor=C.grey4;}}/>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={function(){setEditingCard(null);}} style={{flex:1,background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
                    <button onClick={function(){if(setGaCards)setGaCards(function(prev){return prev.map(function(c){return c.id===editingCard.id?Object.assign({},c,{url:editUrl.trim()}):c;});});setEditingCard(null);}} style={{flex:2,background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save URL</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {tab==="hotjar"&&(
          <div>
            {HOTJAR_SECTIONS.map(function(section){return(
              <div key={section.name} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,marginBottom:16,overflow:"hidden"}}>
                <div style={{background:C.black,padding:"10px 16px",fontSize:12,fontWeight:700,color:C.white,textTransform:"uppercase"}}>{section.name}</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
                    <thead><tr style={{background:C.grey3}}>
                      <th style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:C.grey7,textAlign:"left",textTransform:"uppercase",borderBottom:"1px solid "+C.grey4}}>Page</th>
                      {["Scroll","Click","Move"].map(function(h){return <th key={h} style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:C.grey7,textAlign:"center",textTransform:"uppercase",borderBottom:"1px solid "+C.grey4,width:80}}>{h}</th>;})}
                    </tr></thead>
                    <tbody>
                      {section.pages.map(function(page,i){return(
                        <tr key={page.url} style={{borderBottom:i<section.pages.length-1?"1px solid "+C.grey3:"none"}}>
                          <td style={{padding:"10px 16px",fontFamily:"monospace",fontSize:12,color:C.pink}}>{page.url}</td>
                          {[["scroll",C.violetDark],["click",C.blueMed],["move",C.purple]].map(function(item){return(
                            <td key={item[0]} style={{padding:"10px 16px",textAlign:"center"}}>
                              <a href={page[item[0]]} target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"3px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:item[1],color:C.white,textDecoration:"none"}}>{item[0].charAt(0).toUpperCase()+item[0].slice(1)}</a>
                            </td>
                          );})}
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              </div>
            );})}
          </div>
        )}
      </PageWrap>
    </div>
  );
}

function GeneratingModal({onClose,onDone,prompt,pageLabel,images}){
  var [status,setStatus]=useState("loading");
  var [errorMsg,setErrorMsg]=useState("");
  var [progress,setProgress]=useState(0);
  var hasFetched=useRef(false);
  useEffect(function(){if(status==="done"||status==="error"){setProgress(100);}},[status]);
  useEffect(function(){
    if(hasFetched.current)return;
    hasFetched.current=true;
    var hasImages=images&&images.length>0;
    fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompt,max_tokens:8192,images:hasImages?images.map(function(i){return{dataUrl:i.dataUrl,mimeType:i.mimeType};}):undefined})})
      .then(function(r){
        var ct=r.headers.get("content-type")||"";
        if(!ct.includes("text/event-stream")){
          return r.text().then(function(raw){try{var d=JSON.parse(raw);setErrorMsg(d.error||"Unknown error");}catch(e){setErrorMsg("Server error: "+raw.slice(0,300));}setStatus("error");});
        }
        var reader=r.body.getReader();
        var decoder=new TextDecoder();
        var fullText="";
        var buf="";
        var finished=false;
        function finish(text){if(finished)return;finished=true;if(text){onDone(text);setStatus("done");}else{setErrorMsg("No content returned from API.");setStatus("error");}}
        function pump(){
          reader.read().then(function(result){
            if(result.done){finish(fullText);return;}
            buf+=decoder.decode(result.value,{stream:true});
            var lines=buf.split("\n");buf=lines.pop()||"";
            lines.forEach(function(line){
              if(!line.startsWith("data: "))return;
              var data=line.slice(6).trim();
              if(data==="[DONE]"){finish(fullText);return;}
              try{var parsed=JSON.parse(data);if(parsed.error){setErrorMsg(parsed.error);setStatus("error");finished=true;return;}if(parsed.t){fullText+=parsed.t;setProgress(Math.min(fullText.length/28672*100,96));}}catch(e){}
            });
            if(!finished)pump();
          }).catch(function(err){setErrorMsg(err&&err.message?err.message:"Stream read error");setStatus("error");});
        }
        pump();
      })
      .catch(function(err){setErrorMsg(err&&err.message?err.message:"Network error — check your connection.");setStatus("error");});
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:C.white,borderRadius:16,padding:32,width:440,maxWidth:"90vw",textAlign:"center"}}>
        {status==="loading"&&(<><div style={{width:48,height:48,borderRadius:"50%",border:"4px solid "+C.grey4,borderTop:"4px solid "+C.pink,margin:"0 auto 20px",animation:"spin 0.8s linear infinite"}}/><h3 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Generating your audit</h3><p style={{fontSize:13,color:C.grey7,margin:"0 0 6px"}}>{images&&images.length>0?"Reading heatmaps and analysing scroll depth, click patterns, and attention zones…":"Analysing "+pageLabel+" against all personas, lifecycle stages and journey data."}</p><p style={{fontSize:12,color:C.grey6,margin:"0 0 24px"}}>This usually takes around a minute — the more context, the sharper the output.</p><div style={{background:C.grey3,borderRadius:99,height:8,overflow:"hidden",marginBottom:8}}><div style={{width:progress+"%",background:C.pink,height:"100%",borderRadius:99,transition:"width 0.4s ease"}}/></div><div style={{fontSize:12,color:C.grey6,textAlign:"right",marginBottom:16}}>{Math.round(progress)}%</div><button onClick={function(){onClose(false);}} style={{background:"none",border:"1px solid rgb(16,23,32)",color:"rgb(16,23,32)",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%"}}>Cancel</button></>)}
        {status==="done"&&(<><div style={{width:48,height:48,borderRadius:"50%",background:"#E6F9F2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>✓</div><h3 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Audit ready</h3><p style={{fontSize:13,color:C.grey7,margin:"0 0 24px"}}>Your {pageLabel} audit has been generated.</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button onClick={function(){onClose(false);}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Close</button><button onClick={function(){onClose(true);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>View audit</button></div></>)}
        {status==="error"&&(<><div style={{width:48,height:48,borderRadius:"50%",background:"#FFF0F0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>✗</div><h3 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Something went wrong</h3><p style={{fontSize:13,color:C.grey7,margin:"0 0 8px"}}>The audit could not be generated.</p>{errorMsg&&<p style={{fontSize:12,color:"#CC0000",background:"#FFF0F0",border:"1px solid #FFAAAA",borderRadius:8,padding:"8px 12px",margin:"0 0 20px",textAlign:"left",wordBreak:"break-word"}}>{errorMsg}</p>}<button onClick={function(){onClose(false);}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Close</button></>)}
      </div>
    </div>
  );
}


function WireframeModal({page,personas,onClose,onSave,rules}){
  var [status,setStatus]=useState("loading");
  var [html,setHtml]=useState("");
  var [errorMsg,setErrorMsg]=useState("");
  var [progress,setProgress]=useState(0);
  var hasFetched=useRef(false);
  var hasSaved=useRef(false);
  useEffect(function(){if(status==="done"||status==="error"){setProgress(100);}},[status]);
  useEffect(function(){
    if(hasFetched.current)return;
    hasFetched.current=true;
    var actionLines=page.actions.map(function(a:any,i:number){return(i+1)+". "+a.text+(a.description?" — "+a.description:"");}).join("\n");
    var personaNames=personas.map(function(p){return p.label+" ("+p.tagline+")";}).join(", ");
    var recCount=page.actions.length;
    var badgeList=page.actions.map(function(_:any,i:number){return"data-rec=\""+(i+1)+"\"";}).join(", ");
    var prompt=
"You are a UX wireframe designer. Create a complete, well-laid-out low-fidelity HTML wireframe for the gwi.com "+page.label+" page ("+page.url+").\n\n"+
"This wireframe shows the IMPROVED page addressing these "+recCount+" UX recommendations:\n"+actionLines+"\n\n"+
"Personas: "+personaNames+".\n\n"+
"BADGE RULE (highest priority):\n"+
"Every recommendation must have a 💡 badge placed in the most contextually relevant section. Related recommendations may share a section — give each its own badge. All "+recCount+" badge numbers MUST appear in the HTML: "+badgeList+". A missing badge is a critical error.\n"+
"Badge markup — section outermost div: position:relative + data-section-rec=\"N\". Badge inside: <span data-rec=\"N\" style=\"position:absolute;top:10px;right:10px;background:#FF0077;color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:99px;cursor:pointer\">💡</span>\n\n"+
"WIREFRAME RULES:\n"+
"- STYLE: grey tones only — backgrounds #f5f5f5/#e8e8e8, borders #d0d0d0, text #333/#666. Arial/sans-serif. Grey labelled rectangles for images. Short [PLACEHOLDER] text.\n"+
"- LAYOUTS: use real multi-column layouts — hero with text+image split, 3-column feature grids, side-by-side testimonials, 2-col stats rows, etc. Do NOT stack everything in single full-width blocks.\n"+
"- SECTION LABELS: small grey comment top-left of each section, e.g. // HERO, // FEATURES, // SOCIAL PROOF.\n"+
"- FOOTER (mandatory, always last): outermost element MUST have attribute data-gwi-footer=\"1\". Dark bg #2a2a2a, text #ccc/#999. 5-column link grid — Products: Human insights platform, Agent Spark: Human insights analyst, Learn about our data, Pricing · Solutions & Integrations: RLD, Audience activation, Data partnerships, Become a GWI partner · Resources: Blog, Reports, Help center · Company: Our story, Careers, Press, Contact, Trust center · Legal stuff: Website terms and conditions, Website privacy policy, Website cookie policy, Modern slavery statement, See all. Bottom bar: © GWI + social icon placeholders.\n"+
"- NAVIGATION desktop: logo left | Products Services Solutions Resources Pricing | Sign in (border:1px solid #d0d0d0, bg:transparent, color:#333) Book a demo (bg:#333, color:#fff, border-radius:4px). Mobile @media(max-width:767px): logo + static burger only (3×<span> display:block,width:22px,height:2px,background:#666,margin:4px 0); hide all links and CTAs.\n"+
"- RESPONSIVE @media(max-width:767px): flex rows→column; grids→1 col; padding→16px; buttons→100% width. Use CSS classes in <style> for media query overrides, not inline styles.\n"+
"- Full self-contained HTML. <style> in <head>. Max-width 1200px centred. No JavaScript.\n\n"+
"Output ONLY the raw HTML — no explanation, no markdown fences, nothing else.";
    if(rules&&rules.tov){prompt+="\n\nTone of voice — apply these guidelines to ALL copy in this wireframe:\n"+rules.tov;}
    fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompt,max_tokens:10000})})
      .then(function(r){
        var ct=r.headers.get("content-type")||"";
        if(!ct.includes("text/event-stream")){return r.text().then(function(raw){try{var d=JSON.parse(raw);setErrorMsg(d.error||"Unknown error");}catch(e){setErrorMsg("Server error: "+raw.slice(0,300));}setStatus("error");});}
        var reader=r.body.getReader();var decoder=new TextDecoder();var fullText="";var buf="";var finished=false;
        function stripFences(t){return t.replace(/^```[\w]*\n?/,"").replace(/\n?```\s*$/,"").trim();}
        function finish(text){if(finished)return;finished=true;if(text){var clean=stripFences(text);if(onSave&&!hasSaved.current){hasSaved.current=true;onSave({id:"wf-"+Date.now(),pageLabel:page.label,pageUrl:page.url,date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),html:clean,actions:page.actions||[]});}setHtml(clean);setStatus("done");}else{setErrorMsg("No content returned.");setStatus("error");}}
        function pump(){reader.read().then(function(result){if(result.done){finish(fullText);return;}buf+=decoder.decode(result.value,{stream:true});var lines=buf.split("\n");buf=lines.pop()||"";lines.forEach(function(line){if(!line.startsWith("data: "))return;var data=line.slice(6).trim();if(data==="[DONE]"){finish(fullText);return;}try{var parsed=JSON.parse(data);if(parsed.error){setErrorMsg(parsed.error);setStatus("error");finished=true;return;}if(parsed.t){fullText+=parsed.t;setProgress(Math.min(fullText.length/28672*100,96));}}catch(e){}});if(!finished)pump();}).catch(function(err){setErrorMsg(err&&err.message?err.message:"Stream error");setStatus("error");});}
        pump();
      })
      .catch(function(err){setErrorMsg(err&&err.message?err.message:"Network error");setStatus("error");});
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:C.white,borderRadius:16,padding:32,width:440,maxWidth:"90vw",textAlign:"center"}}>
        {status==="loading"&&(<><div style={{width:48,height:48,borderRadius:"50%",border:"4px solid "+C.grey4,borderTop:"4px solid "+C.pink,margin:"0 auto 20px",animation:"spin 0.8s linear infinite"}}/><h3 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Generating wireframe</h3><p style={{fontSize:13,color:C.grey7,margin:"0 0 6px"}}>Building a low-fidelity wireframe for the improved {page.label} page…</p><p style={{fontSize:12,color:C.grey6,margin:"0 0 24px"}}>This usually takes around a minute — the more context, the sharper the output.</p><div style={{background:C.grey3,borderRadius:99,height:8,overflow:"hidden",marginBottom:8}}><div style={{width:progress+"%",background:C.pink,height:"100%",borderRadius:99,transition:"width 0.4s ease"}}/></div><div style={{fontSize:12,color:C.grey6,textAlign:"right",marginBottom:16}}>{Math.round(progress)}%</div><button onClick={function(){onClose(false);}} style={{background:"none",border:"1px solid rgb(16,23,32)",color:"rgb(16,23,32)",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%"}}>Cancel</button></>)}
        {status==="error"&&(<><div style={{width:48,height:48,borderRadius:"50%",background:"#FFF0F0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>✗</div><h3 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Something went wrong</h3><p style={{fontSize:13,color:C.grey7,margin:"0 0 8px"}}>The wireframe could not be generated.</p>{errorMsg&&<p style={{fontSize:12,color:"#CC0000",background:"#FFF0F0",border:"1px solid #FFAAAA",borderRadius:8,padding:"8px 12px",margin:"0 0 20px",textAlign:"left",wordBreak:"break-word"}}>{errorMsg}</p>}<button onClick={function(){onClose(false);}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Close</button></>)}
        {status==="done"&&(<><div style={{width:48,height:48,borderRadius:"50%",background:"#E6F9F2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>✓</div><h3 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Wireframe ready</h3><p style={{fontSize:13,color:C.grey7,margin:"0 0 24px"}}>Your {page.label} wireframe has been generated.</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button onClick={function(){onClose(false);}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Close</button><button onClick={function(){onClose(true);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>View Wireframe</button></div></>)}
      </div>
    </div>
  );
}

function FeedbackModal({onClose,onSubmit,onViewAll}){
  var [rating,setRating]=useState(0);
  var [hovered,setHovered]=useState(0);
  var [name,setName]=useState("");
  var [text,setText]=useState("");
  var [done,setDone]=useState(false);
  var inputStyle={width:"100%",border:"1.5px solid "+C.grey4,borderRadius:8,padding:"10px 12px",fontSize:13,color:C.offBlack,background:C.white,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};
  var canSubmit=!!(rating&&name.trim()&&text.trim());
  function handleSubmit(){
    if(!canSubmit)return;
    onSubmit({id:"fb-"+Date.now(),name:name.trim(),rating:rating,feedback:text.trim(),date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})});
    setDone(true);
  }
  useEffect(function(){
    function onKey(e:KeyboardEvent){
      if(e.key==="Enter"&&!e.shiftKey&&!done&&canSubmit){
        var tag=(document.activeElement as HTMLElement)?.tagName;
        if(tag!=="TEXTAREA"){e.preventDefault();handleSubmit();}
      }
    }
    document.addEventListener("keydown",onKey);
    return function(){document.removeEventListener("keydown",onKey);};
  },[done,canSubmit]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:16,padding:32,width:460,maxWidth:"100%"}} onClick={function(e){e.stopPropagation();}}>
        {done?(
          <>
            <div style={{textAlign:"center",padding:"8px 0 16px"}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:"#E6F9F2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24}}>✓</div>
              <h3 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Thanks for the feedback!</h3>
              <p style={{fontSize:13,color:C.grey7,margin:"0 0 24px",lineHeight:1.6}}>Your input helps us improve the tool for the whole team.</p>
              <button autoFocus onClick={onClose} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"11px 28px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Close</button>
            </div>
          </>
        ):(
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:800,color:C.black}}>Leave feedback</h3>
              <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.grey6,fontSize:22,lineHeight:1,padding:0}}>×</button>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Rating</div>
              <div style={{display:"flex",gap:6}}>
                {[1,2,3,4,5].map(function(n){var active=n<=(hovered||rating);return(
                  <button key={n} onMouseEnter={function(){setHovered(n);}} onMouseLeave={function(){setHovered(0);}} onClick={function(){setRating(n);}} style={{background:"none",border:"none",cursor:"pointer",padding:2,lineHeight:1}}>
                    <Star size={28} fill={active?C.pink:"none"} stroke={active?C.pink:C.grey5} strokeWidth={1.5}/>
                  </button>
                );})}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Name</label>
              <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="Your name" style={inputStyle}/>
            </div>
            <div style={{marginBottom:24}}>
              <label style={{fontSize:12,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Feedback</label>
              <textarea value={text} onChange={function(e){setText(e.target.value);}} placeholder="What's working well, what could be better, what would you like to see next…" rows={4} style={Object.assign({},inputStyle,{resize:"vertical" as const,lineHeight:1.6})}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={{flex:1,background:"none",border:"1px solid rgb(16,23,32)",color:"rgb(16,23,32)",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleSubmit} disabled={!rating||!name.trim()||!text.trim()} style={{flex:1,background:!rating||!name.trim()||!text.trim()?C.grey4:C.pink,color:!rating||!name.trim()||!text.trim()?C.grey7:C.white,border:"none",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:!rating||!name.trim()||!text.trim()?"default":"pointer",transition:"background 0.15s"}}>Submit</button>
            </div>
            {onViewAll&&<div style={{textAlign:"center",marginTop:14}}><button onClick={function(){if(onViewAll)onViewAll();onClose();}} style={{background:"none",border:"none",cursor:"pointer",color:C.grey7,fontSize:12,textDecoration:"underline",padding:0}}>View all feedback →</button></div>}
          </>
        )}
      </div>
    </div>
  );
}

function FeedbackPage({feedback,onDeleteFeedback,onSubmit,onEditFeedback}){
  var isMobile=useWidth()<768;
  var sorted=(feedback as any[]).slice().reverse();
  var [showForm,setShowForm]=useState(false);
  var [formName,setFormName]=useState("");
  var [formText,setFormText]=useState("");
  var [formRating,setFormRating]=useState(0);
  var [formHovered,setFormHovered]=useState(0);
  var [editId,setEditId]=useState<string|null>(null);
  var [editText,setEditText]=useState("");
  var canSubmit=!!(formRating&&formName.trim()&&formText.trim());
  function submitNew(){
    if(!canSubmit)return;
    if(onSubmit)onSubmit({id:"fb-"+Date.now(),name:formName.trim(),rating:formRating,feedback:formText.trim(),date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})});
    setFormName("");setFormText("");setFormRating(0);setShowForm(false);
  }
  var inputStyle={width:"100%",border:"1.5px solid "+C.grey4,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.offBlack,background:C.white,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};
  var ratingItems=(feedback as any[]).filter(function(fb:any){return fb.rating>0;});
  var avgRating=ratingItems.length>0?ratingItems.reduce(function(s:number,fb:any){return s+fb.rating;},0)/ratingItems.length:0;
  return(
    <PageWrap isMobile={isMobile}>
      <BlackHero eyebrow="Team input" title="Feedback" desc="Ratings and notes from the team — everything submitted through the feedback form lives here." right={ratingItems.length>0?(
        <div style={{textAlign:"center",padding:"0 8px"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:6,marginBottom:10}}>
            <span style={{fontSize:44,fontWeight:800,color:C.white,lineHeight:1}}>{avgRating.toFixed(1)}</span>
            <span style={{fontSize:14,color:"rgba(255,255,255,0.35)"}}>/ 5</span>
          </div>
          <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:6}}>
            {[1,2,3,4,5].map(function(n){var filled=n<=Math.round(avgRating);return(<Star key={n} size={20} fill={filled?C.pink:"none"} stroke={filled?C.pink:"rgba(255,255,255,0.2)"} strokeWidth={1.5}/>);})}
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:500}}>from {ratingItems.length} rating{ratingItems.length===1?"":"s"}</div>
        </div>
      ):undefined}/>
      <div style={{marginBottom:20}}>
        {!showForm?(
          <button onClick={function(){setShowForm(true);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Plus size={15}/>Add feedback</button>
        ):(
          <div style={{background:C.white,border:"1.5px solid "+C.grey4,borderRadius:12,padding:"20px 24px"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.offBlack,marginBottom:16}}>New feedback</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Rating</div>
              <div style={{display:"flex",gap:4}}>
                {[1,2,3,4,5].map(function(n){var active=n<=(formHovered||formRating);return(<button key={n} onMouseEnter={function(){setFormHovered(n);}} onMouseLeave={function(){setFormHovered(0);}} onClick={function(){setFormRating(n);}} style={{background:"none",border:"none",cursor:"pointer",padding:2,lineHeight:1}}><Star size={24} fill={active?C.pink:"none"} stroke={active?C.pink:C.grey5} strokeWidth={1.5}/></button>);})}
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Name</div>
              <input value={formName} onChange={function(e){setFormName(e.target.value);}} placeholder="Your name" style={inputStyle}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Feedback</div>
              <textarea value={formText} onChange={function(e){setFormText(e.target.value);}} placeholder="What's working well, what could be better…" rows={3} style={Object.assign({},inputStyle,{resize:"vertical" as const,lineHeight:1.6})}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={function(){setShowForm(false);setFormName("");setFormText("");setFormRating(0);}} style={{flex:1,background:"none",border:"1px solid "+C.grey5,color:C.grey8,borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={submitNew} disabled={!canSubmit} style={{flex:1,background:canSubmit?C.pink:C.grey4,color:canSubmit?C.white:C.grey7,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:canSubmit?"pointer":"default"}}>Submit</button>
            </div>
          </div>
        )}
      </div>
      {sorted.length===0&&!showForm&&(
        <div style={{textAlign:"center",padding:"40px 0",color:C.grey6}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><MessageSquare size={28}/></div>
          <p style={{fontSize:14,margin:0}}>No feedback yet. Be the first!</p>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sorted.map(function(fb:any){
          var isEditing=editId===fb.id;
          return(
            <div key={fb.id} style={{background:C.white,border:"1.5px solid "+C.grey4,borderRadius:12,padding:"20px 24px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#FFEEF6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:12,fontWeight:800,color:C.pink}}>{fb.name.slice(0,1).toUpperCase()}</span>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:C.offBlack,lineHeight:1.2}}>{fb.name}</div>
                    <div style={{fontSize:11,color:C.grey6,marginTop:2}}>{fb.date}{fb.user?" · "+fb.user:""}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  <div style={{display:"flex",gap:3}}>
                    {[1,2,3,4,5].map(function(n){return <Star key={n} size={14} fill={n<=fb.rating?C.pink:"none"} stroke={n<=fb.rating?C.pink:C.grey5} strokeWidth={1.5}/>;})}</div>
                  <button onClick={function(){if(isEditing){setEditId(null);}else{setEditId(fb.id);setEditText(fb.feedback);}}} title="Edit" style={{background:"none",border:"none",cursor:"pointer",padding:4,color:C.grey5,display:"flex",alignItems:"center",borderRadius:6}} onMouseEnter={function(e){e.currentTarget.style.color=C.pink;}} onMouseLeave={function(e){e.currentTarget.style.color=C.grey5;}}><Pencil size={13}/></button>
                  <button onClick={function(){if(onDeleteFeedback)onDeleteFeedback(fb.id);}} title="Delete" style={{background:"none",border:"none",cursor:"pointer",padding:4,color:C.grey5,display:"flex",alignItems:"center",borderRadius:6}} onMouseEnter={function(e){e.currentTarget.style.color="#CC0000";}} onMouseLeave={function(e){e.currentTarget.style.color=C.grey5;}}><Trash2 size={13}/></button>
                </div>
              </div>
              {isEditing?(
                <div>
                  <textarea value={editText} onChange={function(e){setEditText(e.target.value);}} rows={3} style={{width:"100%",border:"1.5px solid "+C.pink,borderRadius:8,padding:"9px 12px",fontSize:14,color:C.offBlack,lineHeight:1.7,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <button onClick={function(){setEditId(null);}} style={{background:"none",border:"1px solid "+C.grey5,color:C.grey8,borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    <button onClick={function(){if(onEditFeedback)onEditFeedback(fb.id,editText.trim());setEditId(null);}} disabled={!editText.trim()} style={{background:editText.trim()?C.pink:C.grey4,color:editText.trim()?C.white:C.grey7,border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:editText.trim()?"pointer":"default"}}>Save</button>
                  </div>
                </div>
              ):(
                <p style={{fontSize:14,color:C.offBlack,lineHeight:1.7,margin:0}}>{fb.feedback}</p>
              )}
            </div>
          );
        })}
      </div>
    </PageWrap>
  );
}

function GeneratedAuditsPage({audits,setAudits,onDeleteAudit,onUpdateAudit,setAuditData,auditData,pages,setView}){
  var [activeAudit,setActiveAudit]=useState(audits.length>0?audits[audits.length-1].id:null);
  var [added,setAdded]=useState({});
  var [editing,setEditing]=useState(false);
  var [editLabel,setEditLabel]=useState("");
  var [editDesc,setEditDesc]=useState("");
  var isMobile=useWidth()<768;
  var audit=audits.find(function(a){return a.id===activeAudit;});
  function deleteActiveAudit(){var rem=audits.filter(function(x){return x.id!==activeAudit;});setAudits(rem);if(onDeleteAudit)onDeleteAudit(activeAudit);setActiveAudit(rem.length>0?rem[rem.length-1].id:null);}
  function openEdit(){setEditLabel(audit?audit.pageLabel:"");setEditDesc(audit?audit.description||"":"");setEditing(true);}
  function saveEdit(){var updated=Object.assign({},audit,{pageLabel:editLabel.trim()||audit.pageLabel,description:editDesc.trim()});setAudits(function(prev){return prev.map(function(a){return a.id===activeAudit?updated:a;});});if(onUpdateAudit)onUpdateAudit(updated);setEditing(false);}
  function toggleStar(){var updated=Object.assign({},audit,{starred:!audit.starred});setAudits(function(prev){return prev.map(function(a){return a.id===activeAudit?updated:a;});});if(onUpdateAudit)onUpdateAudit(updated);}
  function parseRecs(text){var recs=[];var blocks=text.split(/\n+/);var current=null;blocks.forEach(function(block){var t=block.trim();if(!t)return;var m=t.match(/^FINDING:\s*(\d+)\.\s+(.+)$/);if(m){if(current)recs.push(current);current={title:m[2].trim(),shows:"",why:"",change:"",metric:"",body:""};}else if(current){if(t.startsWith("SHOWS:")){current.shows=t.slice(6).trim();}else if(t.startsWith("WHY:")){current.why=t.slice(4).trim();}else if(t.startsWith("CHANGE:")){current.change=t.slice(7).trim();}else if(t.startsWith("METRIC:")){current.metric=t.slice(7).trim();}else{current.body=current.body?current.body+" "+t:t;}}});if(current)recs.push(current);return recs.filter(function(r){return r.title&&(r.shows||r.why||r.change||r.body);});}
  function isAlreadyAdded(rec,scope){var pageUrl=scope==="all"?"/":scope;var existing=auditData.find(function(p){return p.url===pageUrl;});if(!existing)return false;return existing.actions.some(function(a){return a.text===rec.title;});}
  function addToAudit(rec,scope,idx){
    var pageUrl=scope==="all"?"/":scope;
    var pageObj=pages.find(function(p){return p.url===pageUrl;});
    var cleanTitle=rec.title?rec.title.split(" — ")[0]:rec.change||rec.title;
    var newAction={id:"a-"+Date.now()+Math.random(),text:cleanTitle,description:rec.change||rec.why||rec.body,shows:rec.shows||"",why:rec.why||"",change:rec.change||"",status:"todo",metric:rec.metric||"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""};
    var existing=auditData.find(function(p){return p.url===pageUrl;});
    if(existing){setAuditData(function(prev){return prev.map(function(p){return p.url===pageUrl?Object.assign({},p,{actions:[newAction].concat(p.actions)}):p;});});}
    else{setAuditData(function(prev){return prev.concat([{id:"aa-"+Date.now(),url:pageUrl,label:pageObj?pageObj.label:pageUrl,priority:"High",personas:[],stage:"",issue:"",actions:[newAction]}]);});}
    setAdded(function(prev){var n=Object.assign({},prev);n[activeAudit+"-"+idx]=true;return n;});
  }
  if(audits.length===0){return(<div style={{background:C.grey2,height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",padding:32}}><div style={{marginBottom:16,color:C.grey6,display:"flex",justifyContent:"center"}}><ClipboardList size={32}/></div><h2 style={{fontSize:20,fontWeight:800,color:C.black,marginBottom:8}}>No generated audits yet</h2><p style={{fontSize:14,color:C.grey7,marginBottom:20}}>Generate your first audit from the UX Audit page.</p><button onClick={function(){setView("summary");}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Go to UX Audit</button></div></div>);}
  var recs=audit?parseRecs(audit.content):[];
  var starredAudits=audits.filter(function(a){return a.starred;});
  var unstarredAudits=audits.filter(function(a){return !a.starred;}).slice().reverse();
  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",flex:1,minHeight:0,background:C.grey2}}>
      <div style={{width:isMobile?"100%":220,background:C.white,borderRight:"1px solid "+C.grey4,flexShrink:0,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <div style={{padding:"14px 16px",fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:"1px solid "+C.grey4}}>Generated Audits</div>
        {unstarredAudits.map(function(a){var isActive=a.id===activeAudit;return(
          <div key={a.id} style={{borderBottom:"1px solid "+C.grey3,background:isActive?C.grey3:"transparent"}}>
            <button onClick={function(){setActiveAudit(a.id);setEditing(false);}} style={{textAlign:"left",padding:"12px 16px",borderLeft:"4px solid "+(isActive?C.pink:"transparent"),background:"transparent",color:isActive?C.black:C.grey8,border:"none",cursor:"pointer",width:"100%"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{a.pageLabel}</div>
              <div style={{fontSize:11,color:C.grey6}}>{a.date}</div>
            </button>
          </div>
        );})}
        {audits.some(function(a){return a.starred;})&&(<>
          <div style={{padding:"14px 16px",fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",borderTop:"2px solid "+C.grey4,borderBottom:"1px solid "+C.grey4,display:"flex",alignItems:"center",gap:6}}>
            <Star size={11} fill="#FFC107" color="#FFC107"/><span>Starred</span>
          </div>
          {starredAudits.map(function(a){var isActive=a.id===activeAudit;return(
            <div key={"star-"+a.id} style={{borderBottom:"1px solid "+C.grey3,background:isActive?C.grey3:"transparent"}}>
              <button onClick={function(){setActiveAudit(a.id);setEditing(false);}} style={{textAlign:"left",padding:"12px 16px",borderLeft:"4px solid "+(isActive?"#FFC107":"transparent"),background:"transparent",color:isActive?C.black:C.grey8,border:"none",cursor:"pointer",width:"100%"}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{a.pageLabel}</div>
                <div style={{fontSize:11,color:C.grey6}}>{a.date}</div>
              </button>
            </div>
          );})}
        </>)}
      </div>
      <div style={{flex:1,overflow:"auto",padding:isMobile?16:28}}>
        <div style={{paddingBottom:80}}>
        {audit&&(<>
          <div style={{background:C.black,borderRadius:16,padding:"24px 28px",marginBottom:24}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Generated UX Audit</div>
                {editing?(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <input value={editLabel} onChange={function(e){setEditLabel(e.target.value);}} placeholder="Audit name" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"8px 12px",fontSize:16,fontWeight:700,color:C.white,outline:"none",width:"100%"}}/>
                    <textarea value={editDesc} onChange={function(e){setEditDesc(e.target.value);}} placeholder="Add a description (optional)" rows={2} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"8px 12px",fontSize:13,color:C.grey4,outline:"none",width:"100%",resize:"none",fontFamily:"inherit"}}/>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={saveEdit} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button>
                      <button onClick={function(){setEditing(false);}} style={{background:"rgba(255,255,255,0.1)",color:C.grey4,border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    </div>
                  </div>
                ):(
                  <>
                    <h2 style={{color:C.white,fontSize:22,fontWeight:800,margin:"0 0 4px"}}>{audit.pageLabel}</h2>
                    {audit.description&&<p style={{color:C.grey5,fontSize:13,margin:"0 0 4px",lineHeight:1.5}}>{audit.description}</p>}
                    <p style={{color:C.grey6,fontSize:13,margin:0}}>{audit.date} · {recs.length} findings</p>
                  </>
                )}
              </div>
              {!editing&&(
                <div style={{display:"flex",gap:8,flexShrink:0,paddingTop:2}}>
                  <button onClick={toggleStar} title={audit.starred?"Remove from starred":"Add to starred"} style={{background:audit.starred?"rgba(255,193,7,0.15)":"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:audit.starred?"#FFC107":C.grey4}}><Star size={15} fill={audit.starred?"#FFC107":"none"}/></button>
                  <button onClick={openEdit} title="Rename / add description" style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.grey4}}><Pencil size={15}/></button>
                  <button onClick={deleteActiveAudit} title="Delete audit" style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#FF6B6B"}}><Trash2 size={15}/></button>
                </div>
              )}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {recs.map(function(rec,i){
              var isAdded=isAlreadyAdded(rec,audit.scope)||!!added[activeAudit+"-"+i];
              var parts=rec.title.split(" — ");
              var recTitle=parts[0];
              var priority=parts[1]||"";
              var personas=parts.slice(2).join(", ");
              var priorityColor=priority==="P1"?"#D94F00":priority==="P2"?C.violet:"#005C3B";
              var priorityBg=priority==="P1"?"#FFF0E8":priority==="P2"?"#EEEEFF":"#E6F9F2";
              var hasBody=!!(rec.shows||rec.why||rec.change||rec.metric||rec.body);
              return(
                <div key={i} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:"20px 20px 40px"}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:C.white,border:"2px solid "+C.pink,color:C.black,fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{isAdded?"✓":i+1}</div>
                    <div style={{flex:1}}>
                      {(priority||personas)&&(
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                          {priority&&<span style={{fontSize:11,fontWeight:700,color:priorityColor,background:priorityBg,padding:"2px 8px",borderRadius:99}}>{priority}</span>}
                          {personas&&<span style={{fontSize:11,color:C.grey7}}>{personas}</span>}
                        </div>
                      )}
                      <div style={{fontSize:14,fontWeight:700,color:C.black,paddingTop:(priority||personas)?0:7}}>{recTitle}</div>
                    </div>
                    <button onClick={function(){if(!isAdded)addToAudit(rec,audit.scope,i);}} style={{flexShrink:0,background:isAdded?"#E6F9F2":C.pink,color:isAdded?"#005C3B":C.white,border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:isAdded?"default":"pointer",whiteSpace:"nowrap"}}>{isAdded?"Added":"Add to Recommendations"}</button>
                  </div>
                  {hasBody&&<div style={{borderTop:"1px solid "+C.grey4,margin:"16px 0"}}/>}
                  {hasBody&&(
                    <div style={{display:"flex",flexDirection:"column",gap:8,paddingLeft:40}}>
                      {rec.shows&&<div style={{fontSize:13,color:C.grey8,lineHeight:1.5}}><span style={{fontWeight:700,color:C.grey8}}>Data: </span>{rec.shows}</div>}
                      {rec.why&&<div style={{fontSize:13,color:C.grey8,lineHeight:1.5}}><span style={{fontWeight:700,color:C.grey8}}>Why it matters: </span>{rec.why}</div>}
                      {rec.change&&<div style={{fontSize:13,color:C.black,lineHeight:1.5}}><span style={{fontWeight:700,color:C.pink}}>Change: </span>{rec.change}</div>}
                      {rec.metric&&<div style={{fontSize:13,color:C.grey8,lineHeight:1.5}}><span style={{fontWeight:700,color:C.grey8}}>Success metric: </span>{rec.metric}</div>}
                      {!rec.shows&&rec.body&&<p style={{fontSize:13,color:C.grey7,lineHeight:1.6,margin:0}}>{rec.body}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>)}
        </div>
      </div>
    </div>
  );
}

function DataAccordion({personas,stages,journeys,isMobile,clientList,caseStudies}){
  var [open,setOpen]=useState(false);
  var activeClients=(clientList as any[]).filter(function(c){return !c.notes.toLowerCase().includes("no longer");});
  var totalSteps=personas.reduce(function(n,pe){return n+(journeys[pe.id]||[]).length;},0);
  return(
    <div style={{marginBottom:32}}>
      <button onClick={function(){setOpen(!open);}} style={{width:"100%",background:C.white,border:"1.5px solid "+C.grey4,borderRadius:open?"14px 14px 0 0":"14px",padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Brain size={20} color={C.grey7}/>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:C.black}}>The data behind this audit</div>
            <div style={{fontSize:12,color:C.grey7,marginTop:2}}>{personas.length} personas · {stages.length} lifecycle stages · {totalSteps} journey steps · {activeClients.length} clients · {(caseStudies as any[]).length} case studies</div>
          </div>
        </div>
        <span style={{fontSize:13,color:C.grey6,fontWeight:700}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{border:"1.5px solid "+C.grey4,borderTop:"none",borderRadius:"0 0 14px 14px",background:C.white,padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.black,marginBottom:6}}>Personas & lifecycle</div>
            <p style={{fontSize:13,color:C.grey7,lineHeight:1.7,margin:0}}>Every audit draws on the full detail of all {personas.length} personas — entry points, drives, bugs, what grabs their attention, concerns, why they use GWI, platform behaviour, and what they need from the website. All {stages.length} lifecycle stages are included: the GWI goal, the How Might We, the website's role at that stage, and the push, pull, habit, and anxiety a visitor feels.</p>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.black,marginBottom:6}}>Journeys, clients & case studies</div>
            <p style={{fontSize:13,color:C.grey7,lineHeight:1.7,margin:0}}>All {totalSteps} customer journey steps are included per persona — showing which lifecycle stage they're at, what they're trying to do, and which pages they visit. {activeClients.length} active clients are grouped by type so Claude can suggest specific logo walls and sector-relevant proof. {(caseStudies as any[]).length} saved case studies are injected as proof points — with company, metric, and pull quote — so CHANGE recommendations reference real GWI customer outcomes with actual numbers rather than generic best practice.</p>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.black,marginBottom:6}}>Output format</div>
            <p style={{fontSize:13,color:C.grey7,lineHeight:1.7,margin:0}}>Every finding follows the same structure: SHOWS (what the page currently does or fails to do), WHY (which persona and lifecycle stage it blocks, named specifically), CHANGE (the specific fix, referencing a proof point or client where relevant), and METRIC (how to measure success).</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryPage({personas,stages,pages,journeys,onAuditGenerated,onViewGenerated,clientList,caseStudies}){
  var [copied,setCopied]=useState(false);
  var [editingPrompt,setEditingPrompt]=useState(false);
  var [promptInstruction,setPromptInstruction]=useState("You are a UX strategist. Using the persona, lifecycle, and journey context below, generate a structured UX audit report for the specified page. Format each recommendation EXACTLY like this:\n\n1. Title of recommendation\nOne paragraph description grounded in the persona data.\n\nNo bold, no markdown, no bullet points. Just a number, a title, and a paragraph.");
  var [generatedPrompt,setGeneratedPrompt]=useState("");
  var [selectedPage,setSelectedPage]=useState("");
  var [showModal,setShowModal]=useState(false);
  var [showUpgradeNotice,setShowUpgradeNotice]=useState(false);
  var [auditPrompt,setAuditPrompt]=useState("");
  var [generatedAuditText,setGeneratedAuditText]=useState("");
  var [nudge,setNudge]=useState(null);
  var [extraFiles,setExtraFiles]=useState([]);
  var [auditImages,setAuditImages]=useState([]);
  var isMobile=useWidth()<768;
  var visiblePages=pages.filter(function(p){return !p.hidden;});

  function buildPrompt(){
    var ctx="PERSONAS: ";
    personas.forEach(function(p){ctx+=p.label+"("+p.tagline+"). Entry: "+p.entry+". Traits: "+p.traits.join(", ")+". Who: "+p.who+". Drives: "+p.drives+". Bugs: "+p.bugs+". Website needs: "+p.website+". ";});
    ctx+=" LIFECYCLE: ";
    stages.forEach(function(s){ctx+=s.label+": Goal: "+s.gwi_goal+". Push: "+s.push+". Pull: "+s.pull+". Habit: "+s.habit+". Anxiety: "+s.anxiety+". ";});
    ctx+=" JOURNEYS: ";
    personas.forEach(function(p){var j=journeys[p.id]||[];if(!j.length)return;ctx+=p.label+": ";j.forEach(function(step){ctx+=step.stage+" - "+step.note+" ("+step.pages.join(", ")+"). ";});});
    var obj=visiblePages.find(function(p){return p.url===selectedPage;});
    var pageClause=selectedPage==="all"?"Please audit the gwi.com website overall.":"Audit the "+(obj?obj.label:selectedPage)+" page ("+selectedPage+"). Focus all recommendations on this page.";
    return "You are a UX strategist helping audit gwi.com.\n\n"+promptInstruction+"\n\n"+ctx+"\n\n"+pageClause+"\n\nProvide specific, actionable recommendations. Number each clearly.";
  }

  function handleAIAudit(){if(!selectedPage){setNudge("ai");return;}setNudge(null);setShowUpgradeNotice(true);}
  function handleDropFile(f){setExtraFiles(function(prev){return prev.concat([f]);});}
  function handleRemoveFile(f){setExtraFiles(function(prev){return prev.filter(function(x){return x!==f;});});}
  function proceedToGenerate(){
    var csvFiles=extraFiles.filter(function(f){return f.type==="csv";});
    var images=extraFiles.filter(function(f){return f.type==="image";});
    var hasHeatmaps=images.length>0;
    var hasCsvFiles=csvFiles.length>0;
    var obj=visiblePages.find(function(p){return p.url===selectedPage;});
    var pageLabel=selectedPage==="all"?"the gwi.com website overall":(obj?obj.label+" page ("+selectedPage+")":selectedPage);

    var p="You are a UX strategist auditing "+pageLabel+" for gwi.com.\n\n";

    if(hasCsvFiles){p+="=== UPLOADED DATA ===\n";csvFiles.forEach(function(f){p+="File: "+f.name+"\n"+f.text.slice(0,3000)+(f.text.length>3000?"\n[truncated]":"")+"\n";});p+="=== END DATA ===\n\n";}
    if(hasHeatmaps){p+="Heatmap images are attached. Red/orange = high engagement, blue/grey = low.\n\n";}

    // Full persona data
    p+="=== PERSONAS ("+personas.length+") ===\n";
    personas.forEach(function(pe){
      p+="— "+pe.label+": \""+pe.tagline+"\"\n";
      if(pe.entry)p+="  Entry: "+pe.entry+"\n";
      if(pe.who)p+="  Who: "+pe.who+"\n";
      if(pe.what)p+="  What they do: "+pe.what+"\n";
      if(pe.drives)p+="  Drives: "+pe.drives+"\n";
      if(pe.bugs)p+="  Bugs them: "+pe.bugs+"\n";
      if(pe.grabs)p+="  Grabs attention: "+pe.grabs+"\n";
      if(pe.concerns)p+="  Concerns: "+pe.concerns+"\n";
      if(pe.whyUs)p+="  Why GWI: "+pe.whyUs+"\n";
      if(pe.platform)p+="  Platform behaviour: "+pe.platform+"\n";
      if(pe.website)p+="  Website needs: "+pe.website+"\n";
      p+="\n";
    });

    // Full lifecycle stage data
    p+="=== LIFECYCLE STAGES ("+stages.length+") ===\n";
    stages.forEach(function(s){
      p+="— "+s.label+(s.highlight?" [FOCUS STAGE]":"")+"\n";
      if(s.gwi_goal)p+="  GWI goal: "+s.gwi_goal+"\n";
      if(s.hmw)p+="  How Might We: "+s.hmw+"\n";
      if(s.signupNote)p+="  Website role: "+s.signupNote+"\n";
      if(s.push)p+="  Push: "+s.push+"\n";
      if(s.pull)p+="  Pull: "+s.pull+"\n";
      if(s.habit)p+="  Habit: "+s.habit+"\n";
      if(s.anxiety)p+="  Anxiety: "+s.anxiety+"\n";
      p+="\n";
    });

    // Industry verticals
    if(verticals&&verticals.length){
      p+="=== INDUSTRY VERTICALS ("+verticals.length+") ===\n";
      p+="When making recommendations, consider which verticals the page is most relevant to and frame findings accordingly — e.g. 'This particularly affects Media Agency visitors who need to…'\n";
      verticals.forEach(function(v:any){
        p+="— "+v.label+"\n";
        if(v.desc)p+="  Who: "+v.desc+"\n";
        if(v.useCase)p+="  Primary use case: "+v.useCase+"\n";
        if(v.concern)p+="  Key concern: "+v.concern+"\n";
        p+="\n";
      });
    }

    // Journey steps per persona
    var hasJourneys=personas.some(function(pe){return (journeys[pe.id]||[]).length>0;});
    if(hasJourneys){
      p+="=== CUSTOMER JOURNEYS ===\n";
      personas.forEach(function(pe){
        var pj=journeys[pe.id]||[];
        if(!pj.length)return;
        p+=pe.label+":\n";
        pj.forEach(function(step){
          p+="  "+step.stage+": "+step.note;
          if(step.pages&&step.pages.length)p+=" [pages: "+step.pages.join(", ")+"]";
          p+="\n";
        });
        p+="\n";
      });
    }

    // Active client list grouped by type
    var activeClients=(clientList as any[]).filter(function(c){return !c.notes.toLowerCase().includes("no longer");});
    if(activeClients.length>0){
      p+="=== ACTIVE GWI CLIENTS ("+activeClients.length+") ===\n";
      p+="Use this list when recommending social proof, logo walls, or sector-specific use cases.\n";
      var byType:{[key:string]:any[]}={};
      activeClients.forEach(function(c){if(!byType[c.type])byType[c.type]=[];byType[c.type].push(c);});
      Object.keys(byType).forEach(function(type){
        p+=type+"s: "+byType[type].map(function(c){return c.name+(c.hasCase?" (case study)":"");}).join(", ")+"\n";
      });
      p+="\n";
    }

    // Case studies / proof points
    if((caseStudies as any[]).length>0){
      p+="=== REAL GWI CUSTOMER PROOF POINTS ===\n";
      p+="Use these in SHOWS and CHANGE fields to ground recommendations in specific, credible outcomes:\n\n";
      (caseStudies as any[]).forEach(function(cs){
        p+="— "+cs.company+" ("+cs.sector+"): "+cs.outcome;
        if(cs.metric)p+=" Key metric: "+cs.metric+".";
        if(cs.quote)p+=" Quote: \""+cs.quote+"\"";
        p+="\n";
      });
      p+="\nWhen a finding touches social proof, CTAs, use-case framing, speed-to-value, pitch-winning, or data credibility — reference the relevant proof point with the actual number.\n\n";
    }

    p+="=== AUDIT TASK ===\n";
    p+="Produce exactly 12 UX findings for "+pageLabel+". Output ONLY the findings — no intro, no summary, no other sections.\n\n";
    p+="Use this EXACT format for every finding (all fields required):\n\n";
    p+="FINDING: 1. Title of finding\n";
    p+="SHOWS: What the current page does or fails to do\n";
    p+="WHY: Why this is a problem — name the specific persona(s) and lifecycle stage(s) it blocks\n";
    p+="CHANGE: The specific fix recommended (reference a proof point or client name where relevant)\n";
    p+="METRIC: Metric to track success\n\n";
    p+="FINDING: 2. Next finding title\n";
    p+="SHOWS: ...\n";
    p+="WHY: ...\n";
    p+="CHANGE: ...\n";
    p+="METRIC: ...\n\n";
    p+="...and so on up to FINDING: 12.\n\n";
    p+="Start your response directly with FINDING: 1. — no preamble.";

    setAuditImages(images);
    setAuditPrompt(p);setGeneratedAuditText("");setShowUpgradeNotice(false);setShowModal(true);
  }
  function handleGeneratePrompt(){
    if(!selectedPage){setNudge("prompt");return;}
    setNudge(null);
    setGeneratedPrompt(buildPrompt());
  }
  function handleCopy(){navigator.clipboard.writeText(generatedPrompt).then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2500);});}
  function handleModalClose(navigate){
    setShowModal(false);
    if(navigate&&generatedAuditText){
      var obj=visiblePages.find(function(p){return p.url===selectedPage;});
      onAuditGenerated({id:"gen-"+Date.now(),pageLabel:selectedPage==="all"?"All Pages":(obj?obj.label:selectedPage),scope:selectedPage,date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),content:generatedAuditText});
    }
  }

  return(
    <PageWrap isMobile={isMobile}>
      {showUpgradeNotice&&(
        <div style={{position:"fixed",inset:0,background:"rgba(16,23,32,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:C.white,borderRadius:16,padding:"32px 36px",maxWidth:520,width:"100%"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:C.grey3,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Sparkles size={22} color={C.grey7}/></div>
              <h2 style={{fontSize:20,fontWeight:800,color:C.black,margin:"0 0 8px"}}>Ready to generate</h2>
              <p style={{fontSize:14,color:C.grey7,lineHeight:1.7,margin:"0 0 4px"}}>Claude will analyse the selected page against all your personas, lifecycle stages and journey data.</p>
              <p style={{fontSize:13,color:C.grey6,lineHeight:1.6,margin:0}}>Optionally include heatmap images or CSV files to ground the audit in real behaviour.</p>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:C.black,marginBottom:8}}>Heatmaps &amp; additional files <span style={{fontWeight:400,color:C.grey7}}>(optional)</span></div>
              <FileDropZone onFile={handleDropFile} files={extraFiles} onRemove={handleRemoveFile}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={function(){setShowUpgradeNotice(false);}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"12px 24px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={proceedToGenerate} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Generate audit</button>
            </div>
          </div>
        </div>
      )}
      <BlackHero eyebrow="AI-powered" title="UX Audit" desc="Generate a UX audit directly in the app, or build a tailored prompt to copy into Claude for deeper analysis." why="This is where everything comes together.">
        <button onClick={onViewGenerated} style={{background:"transparent",color:C.white,border:"1.5px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>View current audits</button>
      </BlackHero>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:C.white,border:"2px solid "+C.pink,color:C.black,fontSize:14,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>1</div>
        <div style={{fontSize:16,fontWeight:800,color:C.black}}>Select a page to audit</div>
      </div>
      <div style={{background:C.black,borderRadius:16,padding:isMobile?"20px":"24px 28px",marginBottom:24}}>
        <select value={selectedPage} onChange={function(e){setSelectedPage(e.target.value);setGeneratedPrompt("");setNudge(null);}} style={{width:"100%",padding:"12px 14px",border:"1.5px solid "+(selectedPage?C.pink:C.grey7),borderRadius:8,fontSize:13,background:"rgba(255,255,255,0.06)",color:selectedPage?C.white:C.grey6,cursor:"pointer",boxSizing:"border-box",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23FF0077' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}>
          <option value="" style={{background:C.offBlack}}>Select a page</option>
          <option value="all" style={{background:C.offBlack}}>All pages (site-wide audit)</option>
          {visiblePages.map(function(p){return <option key={p.url} value={p.url} style={{background:C.offBlack}}>{p.label} ({p.url.replace("https://gwi.ai","gwi.ai").replace("https://trust.gwi.com","trust.gwi.com")})</option>;})}
        </select>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:C.white,border:"2px solid "+C.pink,color:C.black,fontSize:14,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>2</div>
        <div style={{fontSize:16,fontWeight:800,color:C.black}}>Choose how to audit</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:24}}>
        <div style={{background:C.white,border:"1.5px solid "+C.grey4,borderRadius:14,padding:24,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{color:C.pink}}><Zap size={22}/></div>
          <div style={{fontSize:17,fontWeight:800,color:C.offBlack}}>Generate AI Audit</div>
          <p style={{fontSize:14,color:C.grey7,lineHeight:1.65,margin:0,flex:1}}>Claude analyses the selected page against all your personas, lifecycle stages and journey data and returns structured recommendations directly in the app.</p>
          {nudge==="ai"&&<div style={{background:"#FFEEF6",border:"1px solid "+C.pink,borderRadius:8,padding:"8px 12px",fontSize:12,color:"#880040"}}>Please select a page first</div>}
          <button onClick={handleAIAudit} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Generate AI Audit</button>
        </div>
        <div style={{background:C.white,border:"1.5px solid "+C.grey4,borderRadius:14,padding:24,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{color:C.pink}}><ClipboardCopy size={22}/></div>
          <div style={{fontSize:17,fontWeight:800,color:C.offBlack}}>Generate Prompt</div>
          <p style={{fontSize:14,color:C.grey7,lineHeight:1.65,margin:0,flex:1}}>Get a ready-to-use prompt packed with all your persona context. Copy it into any Claude conversation to run the audit manually.</p>
          {nudge==="prompt"&&<div style={{background:"#FFF8E6",border:"1px solid #F5C842",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#7A4F00"}}>Please select a page first</div>}
          <button onClick={handleGeneratePrompt} style={{background:C.offBlack,color:C.white,border:"none",borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Generate Prompt</button>
        </div>
      </div>
      {generatedPrompt&&!showModal&&(
        <div style={{background:C.black,borderRadius:14,padding:24,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:13,fontWeight:700,color:C.white}}>Generated prompt</div>
            <button onClick={function(){setEditingPrompt(!editingPrompt);}} style={{background:"transparent",color:C.white,border:"1px solid "+C.grey7,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{editingPrompt?"Done editing":"Edit instruction"}</button>
          </div>
          {editingPrompt&&<textarea value={promptInstruction} onChange={function(e){setPromptInstruction(e.target.value);}} rows={4} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"10px 14px",fontSize:13,color:C.white,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",marginBottom:12}}/>}
          <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:16,marginBottom:12,maxHeight:240,overflow:"auto"}}>
            <p style={{fontSize:12,color:C.grey5,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{generatedPrompt}</p>
          </div>
          <button onClick={handleCopy} style={{width:"100%",background:copied?"#00A86B":C.white,color:copied?C.white:C.black,border:"none",borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{copied?"Copied to clipboard":"Copy to clipboard"}</button>
        </div>
      )}
      <DataAccordion personas={personas} stages={stages} journeys={journeys} isMobile={isMobile} clientList={clientList} caseStudies={caseStudies}/>
      {showModal&&auditPrompt&&<GeneratingModal prompt={auditPrompt} images={auditImages} pageLabel={selectedPage==="all"?"All Pages":(visiblePages.find(function(p){return p.url===selectedPage;})||{label:selectedPage}).label} onDone={function(text){setGeneratedAuditText(text);}} onClose={handleModalClose}/>}
    </PageWrap>
  );
}

function SettingsPage({pages,setPages,personas,setPersonas,stages,setStages,verticals,setVerticals,journeys,setJourneys,gaCards,setGaCards,wireframeRules,setWireframeRules,clientList,setClientList,caseStudies,setCaseStudies}:{pages:any,setPages:any,personas:any,setPersonas:any,stages:any,setStages:any,verticals:any,setVerticals:any,journeys:any,setJourneys:any,gaCards:any,setGaCards:any,wireframeRules:any,setWireframeRules:any,clientList:any,setClientList:any,caseStudies:any,setCaseStudies:any}){
  var [tab,setTab]=useState("home");
  var [newPage,setNewPage]=useState({url:"",label:"",section:"Products"});
  var [editingPersona,setEditingPersona]=useState(null);
  var [personaDraft,setPersonaDraft]=useState({});
  var [editingStage,setEditingStage]=useState(null);
  var [stageDraft,setStageDraft]=useState({});
  var [editingVertical,setEditingVertical]=useState<string|null>(null);
  var [verticalDraft,setVerticalDraft]=useState<any>({});
  var [addingVertical,setAddingVertical]=useState(false);
  var [newVertical,setNewVertical]=useState<any>({label:"",desc:"",useCase:"",concern:""});
  var VERTICAL_FIELDS:[string,string][]=[["Description","desc"],["Primary use case","useCase"],["Key concern","concern"]];
  var [editingJourney,setEditingJourney]=useState(null);
  var [editingJourneyStep,setEditingJourneyStep]=useState(null);
  var [stepDraft,setStepDraft]=useState({});
  var [showNewPersona,setShowNewPersona]=useState(false);
  var [newPersona,setNewPersona]=useState({label:"",tagline:"",entry:"",traits:"",who:"",what:"",drives:"",bugs:"",grabs:"",website:""});
  var [gaCardSaved,setGaCardSaved]=useState({});
  var [showNewGaCard,setShowNewGaCard]=useState(false);
  var [newGaCard,setNewGaCard]=useState({iconKey:"BarChart2",title:"",desc:"",url:""});
  var [gaDragIdx,setGaDragIdx]=useState(null);
  var [gaOverIdx,setGaOverIdx]=useState(null);
  var [clientSearch,setClientSearch]=useState("");
  var [showAddClient,setShowAddClient]=useState(false);
  var [newClient,setNewClient]=useState({name:"",type:"Agency",sector:"",hasCase:false,notes:""});
  var [editingCase,setEditingCase]=useState<string|null>(null);
  var [caseDraft,setCaseDraft]=useState<any>({});
  var [showAddCase,setShowAddCase]=useState(false);
  var [newCase,setNewCase]=useState({company:"",sector:"",outcome:"",metric:"",quote:""});
  var isMobile=useWidth()<768;
  var sectionSet={};pages.forEach(function(p){sectionSet[p.section]=true;});var sections=Object.keys(sectionSet);
  var MULTI=["who","what","drives","bugs","grabs","concerns","whyUs","platform","website","gwi_goal","hmw","signupNote","push","pull","habit","anxiety"];
  var PERSONA_FIELDS=[["Label","label"],["Tagline","tagline"],["Entry point","entry"],["Traits (comma separated)","traits"],["Who they are","who"],["What they do","what"],["What drives them","drives"],["What bugs them","bugs"],["What grabs their attention","grabs"],["What concerns them","concerns"],["Why they use us","whyUs"],["How they use the platform","platform"],["What they want from our website","website"]];
  var NEW_PERSONA_FIELDS=[["Tagline","tagline"],["Entry point","entry"],["Traits (comma separated)","traits"],["Who they are","who"],["What they do","what"],["What drives them","drives"],["What bugs them","bugs"],["What grabs their attention","grabs"],["What they want from our website","website"]];
  var STAGE_FIELDS=[["GWI Goal","gwi_goal"],["How Might We","hmw"],["Website role note","signupNote"],["Push","push"],["Pull","pull"],["Habit","habit"],["Anxiety","anxiety"]];
  function Inp({val,onChange,multi,rows}){if(multi)return <textarea value={val||""} onChange={function(e){onChange(e.target.value);}} rows={rows||2} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,color:C.offBlack,background:C.white,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>;return <input value={val||""} onChange={function(e){onChange(e.target.value);}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,color:C.offBlack,background:C.white,boxSizing:"border-box"}}/>;}
  function saveNewPersona(){if(!newPersona.label)return;var id=newPersona.label.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");var traits=newPersona.traits.split(",").map(function(t){return t.trim();}).filter(Boolean);setPersonas(function(prev){return prev.concat([Object.assign({},newPersona,{id:id,traits:traits,colorIndex:personas.length%DEFAULT_PERSONA_COLORS.length})]);});setJourneys(function(prev){var n=Object.assign({},prev);n[id]=[];return n;});setNewPersona({label:"",tagline:"",entry:"",traits:"",who:"",what:"",drives:"",bugs:"",grabs:"",website:""});setShowNewPersona(false);}
  function flashSaved(id){setGaCardSaved(function(s){return Object.assign({},s,{[id]:true});});setTimeout(function(){setGaCardSaved(function(s){var n=Object.assign({},s);delete n[id];return n;});},1500);}
  function deleteGaCard(id){setGaCards(function(prev){return prev.filter(function(c){return c.id!==id;});});}
  function addGaCard(){if(!newGaCard.title||!newGaCard.url)return;setGaCards(function(prev){return prev.concat([Object.assign({},newGaCard,{id:"gc-"+Date.now()})]);});setNewGaCard({iconKey:"BarChart2",title:"",desc:"",url:""});setShowNewGaCard(false);}
  function onGaDragStart(e,i){setGaDragIdx(i);e.dataTransfer.effectAllowed="move";}
  function onGaDragOver(e,i){e.preventDefault();e.dataTransfer.dropEffect="move";if(gaOverIdx!==i)setGaOverIdx(i);}
  function onGaDrop(e,i){e.preventDefault();if(gaDragIdx===null||gaDragIdx===i){setGaDragIdx(null);setGaOverIdx(null);return;}setGaCards(function(prev){var arr=prev.slice();var item=arr.splice(gaDragIdx,1)[0];arr.splice(i,0,item);return arr;});setGaDragIdx(null);setGaOverIdx(null);}
  function onGaDragEnd(){setGaDragIdx(null);setGaOverIdx(null);}
  return(
    <PageWrap isMobile={isMobile}>
      <BlackHero eyebrow="GWI Website - UX" title="Settings" desc="The quality of every audit depends on the data behind it."/>
      {tab==="home"&&(function(){
        var totalSteps=Object.values(journeys).reduce(function(n,s){return n+(s as any[]).length;},0);
        var _sc=[
          {id:"pages",icon:<FileText size={20}/>,label:"Pages",desc:"Manage the pages included in the audit framework. These drive every audit, recommendation, and analytics card.",stat:pages.length+" page"+(pages.length===1?"":"s")},
          {id:"personas",icon:<Users size={20}/>,label:"Personas",desc:"Define and maintain the personas that shape how each page is evaluated during an audit.",stat:personas.length+" persona"+(personas.length===1?"":"s")},
          {id:"stages",icon:<Layers size={20}/>,label:"Lifecycle Stages",desc:"Configure the stages visitors move through — from first click to sign-up and beyond.",stat:stages.length+" stage"+(stages.length===1?"":"s")},
          {id:"verticals",icon:<Building2 size={20}/>,label:"Industry Verticals",desc:"Define the industry verticals GWI serves. These are injected into every audit so recommendations are framed by the specific buyer type they affect.",stat:verticals.length+" vertical"+(verticals.length===1?"":"s")},
          {id:"journeys",icon:<Map size={20}/>,label:"Journey Steps",desc:"Map out the steps for each persona across the customer lifecycle.",stat:totalSteps+" step"+(totalSteps===1?"":"s")},
          {id:"ga",icon:<BarChart2 size={20}/>,label:"Google Analytics",desc:"Set up GA4 report links that appear on the Analytics page for quick access.",stat:gaCards.length+" report"+(gaCards.length===1?"":"s")},
          {id:"wireframes",icon:<LayoutGrid size={20}/>,label:"Wireframe Rules",desc:"Define rules that every generated wireframe must follow — including tone of voice and copy guidelines.",stat:(wireframeRules as any).tov?"Tone of voice set":"No rules set"},
          {id:"clients",icon:<Building2 size={20}/>,label:"Clients",desc:"The companies that use GWI — used in audit recommendations to suggest logo walls, social proof, and industry-specific use cases.",stat:(clientList as any[]).filter(function(c){return !c.notes.toLowerCase().includes("no longer");}).length+" active clients"},
          {id:"case-studies",icon:<BookOpen size={20}/>,label:"Case Studies",desc:"Real GWI customer outcomes injected into audit prompts so findings reference specific, credible metrics rather than generic best practice.",stat:(caseStudies as any[]).length+" case stud"+(((caseStudies as any[]).length===1)?"y":"ies")},
        ];
        return(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            {_sc.map(function(s){return(
              <button key={s.id} onClick={function(){setTab(s.id);}} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:"20px 22px",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:0,transition:"box-shadow 0.15s,border-color 0.15s"}} onMouseEnter={function(e){e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.boxShadow="0 4px 16px rgba(255,0,119,0.1)";}} onMouseLeave={function(e){e.currentTarget.style.borderColor=C.grey4;e.currentTarget.style.boxShadow="none";}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{background:"#FFEEF6",borderRadius:10,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:C.pink}}>{s.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:C.black,marginBottom:2}}>{s.label}</div>
                    <div style={{fontSize:12,color:C.grey6,fontWeight:500}}>{s.stat}</div>
                  </div>
                  <ArrowRight size={15} color={C.grey5} style={{flexShrink:0}}/>
                </div>
                <div style={{fontSize:13,color:C.grey7,lineHeight:1.65}}>{s.desc}</div>
              </button>
            );})}
          </div>
        );
      })()}
      {tab!=="home"&&(
        <div style={{display:"flex",gap:4,marginBottom:28,background:C.grey4,borderRadius:10,padding:4,width:isMobile?"100%":"fit-content",overflowX:"auto"}}>
          {[["home","← Overview"],["pages","Pages"],["personas","Personas"],["stages","Lifecycle Stages"],["verticals","Verticals"],["journeys","Journey Steps"],["ga","Google Analytics"],["wireframes","Wireframe Rules"],["clients","Clients"],["case-studies","Case Studies"]].map(function(x){return(
            <button key={x[0]} onClick={function(){setTab(x[0]);}} style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:tab===x[0]?C.pink:"transparent",color:tab===x[0]?C.white:C.grey7,flexShrink:0,whiteSpace:"nowrap"}}>{x[1]}</button>
          );})}
        </div>
      )}
      {tab==="pages"&&(
        <div>
          <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:20,marginBottom:20}}>
            <h3 style={{fontWeight:700,color:C.black,fontSize:15,marginBottom:16}}>Add New Page</h3>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 2fr 1fr",gap:10,marginBottom:10}}>
              <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>URL</div><Inp val={newPage.url} onChange={function(v){setNewPage(Object.assign({},newPage,{url:v}));}}/></div>
              <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Label</div><Inp val={newPage.label} onChange={function(v){setNewPage(Object.assign({},newPage,{label:v}));}}/></div>
              <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Section</div><select value={newPage.section} onChange={function(e){setNewPage(Object.assign({},newPage,{section:e.target.value}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,background:C.white}}>{sections.map(function(s){return <option key={s}>{s}</option>;})}</select></div>
            </div>
            <button onClick={function(){if(newPage.url&&newPage.label){setPages(function(prev){return prev.concat([Object.assign({},newPage,{hidden:false})]);});setNewPage({url:"",label:"",section:"Products"});}}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add Page</button>
          </div>
          {sections.map(function(section){return(
            <div key={section} style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>{section}</div>
              <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,overflow:"hidden"}}>
                {pages.filter(function(p){return p.section===section;}).map(function(page,i,arr){return(
                  <div key={page.url} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:i<arr.length-1?"1px solid "+C.grey3:"none",background:page.hidden?"#FFF8F8":C.white,opacity:page.hidden?0.6:1}}>
                    <span style={{fontFamily:"monospace",color:page.hidden?C.grey6:C.pink,fontSize:12,width:isMobile?120:220,flexShrink:0}}>{page.url.replace("https://gwi.ai","gwi.ai").replace("https://trust.gwi.com","trust.gwi.com")}</span>
                    <span style={{color:C.offBlack,fontSize:13,flex:1}}>{page.label}</span>
                    <button onClick={function(){setPages(function(prev){return prev.map(function(p){return p.url===page.url?Object.assign({},p,{hidden:!p.hidden}):p;});});}} style={{background:page.hidden?"#FFEEF6":C.grey3,color:page.hidden?"#880040":C.grey8,border:"1px solid "+(page.hidden?"#FF80BB":C.grey5),borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{page.hidden?"Show":"Hide"}</button>
                    <button onClick={function(){setPages(function(prev){return prev.filter(function(p){return p.url!==page.url;});});}} style={{background:"#FFF0F0",color:"#CC0000",border:"1px solid #FFAAAA",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Delete</button>
                  </div>
                );})}
              </div>
            </div>
          );})}
        </div>
      )}
      {tab==="personas"&&(
        <div>
          <button onClick={function(){setShowNewPersona(!showNewPersona);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:20}}>{showNewPersona?"Cancel":"Add New Persona"}</button>
          {showNewPersona&&(
            <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:20,marginBottom:20}}>
              <h3 style={{fontWeight:700,color:C.black,fontSize:15,marginBottom:16}}>New Persona</h3>
              <div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Label</div><Inp val={newPersona.label} onChange={function(v){setNewPersona(Object.assign({},newPersona,{label:v}));}}/></div>
              {NEW_PERSONA_FIELDS.map(function(x){return <div key={x[1]} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>{x[0]}</div><Inp val={newPersona[x[1]]} onChange={function(v){var u=Object.assign({},newPersona);u[x[1]]=v;setNewPersona(u);}} multi={MULTI.indexOf(x[1])>=0} rows={3}/></div>;})}
              <button onClick={saveNewPersona} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Persona</button>
            </div>
          )}
          {personas.map(function(p){
            var isEditing=editingPersona===p.id;
            return(
              <div key={p.id} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
                <div style={{background:C.white,padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:C.black}}>{p.label}</div><div style={{fontSize:12,color:C.grey7}}>{p.tagline}</div></div>
                  <button onClick={function(){if(isEditing){setEditingPersona(null);}else{setEditingPersona(p.id);setPersonaDraft(Object.assign({},p,{traits:p.traits.join(", ")}));}}} style={{background:isEditing?C.pink:C.grey3,color:isEditing?C.white:C.grey8,border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{isEditing?"Close":"Edit"}</button>
                  <button onClick={function(){setPersonas(function(prev){return prev.filter(function(x){return x.id!==p.id;});});setJourneys(function(prev){var j=Object.assign({},prev);delete j[p.id];return j;});}} style={{background:"#FFF0F0",color:"#CC0000",border:"1px solid #FFAAAA",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Delete</button>
                </div>
                {isEditing&&(
                  <div style={{padding:20}}>
                    {PERSONA_FIELDS.map(function(x){return <div key={x[1]} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>{x[0]}</div><Inp val={personaDraft[x[1]]} onChange={function(v){var d=Object.assign({},personaDraft);d[x[1]]=v;setPersonaDraft(d);}} multi={MULTI.indexOf(x[1])>=0} rows={3}/></div>;})}
                    <button onClick={function(){var traits=personaDraft.traits.split(",").map(function(t){return t.trim();}).filter(Boolean);setPersonas(function(prev){return prev.map(function(x){return x.id===p.id?Object.assign({},personaDraft,{traits:traits,id:p.id,colorIndex:p.colorIndex}):x;});});setEditingPersona(null);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Changes</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab==="stages"&&(
        <div>
          {stages.map(function(s){
            var isEditing=editingStage===s.id;
            return(
              <div key={s.id} style={{background:C.white,border:"1px solid "+(isEditing?C.pink:C.grey4),borderRadius:12,marginBottom:12,overflow:"hidden"}}>
                <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontWeight:700,fontSize:15,color:C.black,flex:1}}>{s.label}</span>
                  <button onClick={function(){if(isEditing){setEditingStage(null);}else{setEditingStage(s.id);setStageDraft(Object.assign({},s));}}} style={{background:isEditing?C.pink:C.grey3,color:isEditing?C.white:C.grey8,border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{isEditing?"Close":"Edit"}</button>
                </div>
                {isEditing&&(
                  <div style={{padding:20}}>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                      <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Label</div><Inp val={stageDraft.label} onChange={function(v){setStageDraft(Object.assign({},stageDraft,{label:v}));}}/></div>
                      <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Website role</div><select value={stageDraft.signupRole||"none"} onChange={function(e){setStageDraft(Object.assign({},stageDraft,{signupRole:e.target.value}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,background:C.white}}>{Object.keys(signupRoleConfig).map(function(k){return <option key={k} value={k}>{signupRoleConfig[k].label}</option>;})}</select></div>
                      <div style={{gridColumn:"1 / -1",display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={!!stageDraft.highlight} onChange={function(e){setStageDraft(Object.assign({},stageDraft,{highlight:e.target.checked}));}} id={"hl-"+s.id}/><label htmlFor={"hl-"+s.id} style={{fontSize:13,color:C.offBlack,fontWeight:600}}>Mark as Focus Stage</label></div>
                    </div>
                    {STAGE_FIELDS.map(function(x){return <div key={x[1]} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>{x[0]}</div><Inp val={stageDraft[x[1]]} onChange={function(v){var d=Object.assign({},stageDraft);d[x[1]]=v;setStageDraft(d);}} multi={true} rows={2}/></div>;})}
                    <button onClick={function(){setStages(function(prev){return prev.map(function(x){return x.id===s.id?Object.assign({},stageDraft,{id:s.id}):x;});});setEditingStage(null);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Changes</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab==="verticals"&&(
        <div>
          {verticals.map(function(v:any){
            var isEditing=editingVertical===v.id;
            return(
              <div key={v.id} style={{background:C.white,border:"1px solid "+(isEditing?C.pink:C.grey4),borderRadius:12,marginBottom:12,overflow:"hidden"}}>
                <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontWeight:700,fontSize:15,color:C.black,flex:1}}>{v.label}</span>
                  <button onClick={function(){setVerticals(function(prev:any[]){return prev.filter(function(x:any){return x.id!==v.id;});});}} style={{background:"transparent",color:C.grey6,border:"none",borderRadius:6,padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer",marginRight:4}}>Remove</button>
                  <button onClick={function(){if(isEditing){setEditingVertical(null);}else{setEditingVertical(v.id);setVerticalDraft(Object.assign({},v));}}} style={{background:isEditing?C.pink:C.grey3,color:isEditing?C.white:C.grey8,border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{isEditing?"Close":"Edit"}</button>
                </div>
                {isEditing&&(
                  <div style={{padding:20}}>
                    <div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Label</div><Inp val={verticalDraft.label} onChange={function(val:string){setVerticalDraft(Object.assign({},verticalDraft,{label:val}));}}/></div>
                    {VERTICAL_FIELDS.map(function(x){return(<div key={x[1]} style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>{x[0]}</div><Inp val={verticalDraft[x[1]]||""} onChange={function(val:string){var d=Object.assign({},verticalDraft);d[x[1]]=val;setVerticalDraft(d);}} multi={true} rows={2}/></div>);})}
                    <button onClick={function(){setVerticals(function(prev:any[]){return prev.map(function(x:any){return x.id===v.id?Object.assign({},verticalDraft,{id:v.id}):x;});});setEditingVertical(null);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Changes</button>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{background:C.white,border:"1px solid "+(addingVertical?C.pink:C.grey4),borderRadius:12,overflow:"hidden",marginTop:8}}>
            <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontWeight:700,fontSize:15,color:C.black,flex:1}}>{addingVertical?"New vertical":"Add a vertical"}</span>
              <button onClick={function(){setAddingVertical(!addingVertical);setNewVertical({label:"",desc:"",useCase:"",concern:""});}} style={{background:addingVertical?C.grey3:C.pink,color:addingVertical?C.grey8:C.white,border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{addingVertical?"Cancel":"+ Add"}</button>
            </div>
            {addingVertical&&(
              <div style={{padding:20}}>
                <div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Label</div><Inp val={newVertical.label} onChange={function(val:string){setNewVertical(Object.assign({},newVertical,{label:val}));}}/></div>
                {VERTICAL_FIELDS.map(function(x){return(<div key={x[1]} style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>{x[0]}</div><Inp val={newVertical[x[1]]||""} onChange={function(val:string){var d=Object.assign({},newVertical);d[x[1]]=val;setNewVertical(d);}} multi={true} rows={2}/></div>);})}
                <button onClick={function(){if(!newVertical.label.trim())return;var id="v-"+Date.now();setVerticals(function(prev:any[]){return prev.concat([Object.assign({},newVertical,{id:id})]);});setAddingVertical(false);setNewVertical({label:"",desc:"",useCase:"",concern:""});}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add Vertical</button>
              </div>
            )}
          </div>
        </div>
      )}
      {tab==="journeys"&&(
        <div>
          {personas.map(function(p){
            var col=getPersonaColor(p);var isOpen=editingJourney===p.id;var pJourney=journeys[p.id]||[];
            return(
              <div key={p.id} style={{background:C.white,border:"1px solid "+(isOpen?col.border:C.grey4),borderRadius:12,marginBottom:16,overflow:"hidden"}}>
                <div style={{background:C.white,padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontWeight:700,fontSize:15,color:C.black,flex:1}}>{p.label}</span>
                  <span style={{fontSize:12,color:C.grey7,marginRight:8}}>{pJourney.length} steps</span>
                  <button onClick={function(){setEditingJourney(isOpen?null:p.id);}} style={{background:isOpen?C.pink:C.grey3,color:isOpen?C.white:C.grey8,border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{isOpen?"Close":"Edit Journey"}</button>
                </div>
                {isOpen&&(
                  <div style={{padding:20}}>
                    {pJourney.map(function(step,idx){
                      var isEditingStep=editingJourneyStep&&editingJourneyStep.personaId===p.id&&editingJourneyStep.index===idx;
                      var sc=STAGE_COLORS[step.stage]||{};
                      return(
                        <div key={idx} style={{background:C.grey3,border:"1px solid "+C.grey5,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
                          <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{background:sc.bg||C.grey3,color:sc.text||C.grey8,border:"1px solid "+(sc.border||C.grey5),fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:99}}>{step.stage}</span>
                            <span style={{fontSize:12,color:C.grey7,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{step.note}</span>
                            <button onClick={function(){if(isEditingStep){setEditingJourneyStep(null);}else{setEditingJourneyStep({personaId:p.id,index:idx});setStepDraft(Object.assign({},step,{pages:step.pages.join(", ")}));}}} style={{background:isEditingStep?C.pink:C.white,color:isEditingStep?C.white:C.grey8,border:"1px solid "+C.grey4,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>{isEditingStep?"Close":"Edit"}</button>
                            <button onClick={function(){setJourneys(function(prev){var n=Object.assign({},prev);n[p.id]=prev[p.id].filter(function(_,i){return i!==idx;});return n;});}} style={{background:"#FFF0F0",color:"#CC0000",border:"1px solid #FFAAAA",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>Remove</button>
                          </div>
                          {isEditingStep&&(
                            <div style={{padding:"0 14px 14px",background:C.white,borderTop:"1px solid "+C.grey4}}>
                              <div style={{marginBottom:8,marginTop:12}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Stage</div><select value={stepDraft.stage||""} onChange={function(e){setStepDraft(Object.assign({},stepDraft,{stage:e.target.value}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,background:C.white}}>{stages.map(function(st){return <option key={st.id}>{st.label}</option>;})}</select></div>
                              <div style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Note</div><Inp val={stepDraft.note} onChange={function(v){setStepDraft(Object.assign({},stepDraft,{note:v}));}} multi={true} rows={2}/></div>
                              <div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Pages (comma separated URLs)</div><Inp val={stepDraft.pages} onChange={function(v){setStepDraft(Object.assign({},stepDraft,{pages:v}));}}/></div>
                              <button onClick={function(){var updatedPages=stepDraft.pages.split(",").map(function(u){return u.trim();}).filter(Boolean);setJourneys(function(prev){var n=Object.assign({},prev);n[p.id]=prev[p.id].map(function(s,i){return i===idx?Object.assign({},stepDraft,{pages:updatedPages}):s;});return n;});setEditingJourneyStep(null);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"8px 20px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save Step</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={function(){setJourneys(function(prev){var n=Object.assign({},prev);n[p.id]=[...(prev[p.id]||[]),{stage:stages[0]?stages[0].label:"Awareness",pages:[],note:""}];return n;});}} style={{background:C.grey3,color:C.grey8,border:"1px solid "+C.grey5,borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",marginTop:4}}>Add Step</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab==="ga"&&(
        <div>
          {showNewGaCard&&(
            <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:20,marginBottom:16}}>
              <h3 style={{fontWeight:700,color:C.black,fontSize:15,marginBottom:16}}>New analytics report</h3>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
                <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Title</div><input value={newGaCard.title} onChange={function(e){setNewGaCard(Object.assign({},newGaCard,{title:e.target.value}));}} placeholder="e.g. Homepage Analysis" style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Icon</div><select value={newGaCard.iconKey} onChange={function(e){setNewGaCard(Object.assign({},newGaCard,{iconKey:e.target.value}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,background:C.white}}>{CARD_ICON_KEYS.map(function(k){return <option key={k} value={k}>{k}</option>;})}</select></div>
              </div>
              <div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Description</div><input value={newGaCard.desc} onChange={function(e){setNewGaCard(Object.assign({},newGaCard,{desc:e.target.value}));}} placeholder="Short description of this report" style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/></div>
              <div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>GA4 URL</div><input value={newGaCard.url} onChange={function(e){setNewGaCard(Object.assign({},newGaCard,{url:e.target.value}));}} placeholder="https://analytics.google.com/analytics/web/..." style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={addGaCard} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add report</button>
                <button onClick={function(){setShowNewGaCard(false);setNewGaCard({iconKey:"BarChart2",title:"",desc:"",url:""});}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,overflow:"hidden"}}>
            {(gaCards||[]).map(function(card,i,arr){
              var isSaved=gaCardSaved[card.id];
              return(
                <div key={card.id}
                  draggable={true}
                  onDragStart={function(e){onGaDragStart(e,i);}}
                  onDragOver={function(e){onGaDragOver(e,i);}}
                  onDrop={function(e){onGaDrop(e,i);}}
                  onDragEnd={onGaDragEnd}
                  style={{padding:"12px 16px",borderBottom:i<arr.length-1?"1px solid "+C.grey3:"none",opacity:gaDragIdx===i?0.4:1,borderTop:gaOverIdx===i&&gaDragIdx!==i?"2px solid "+C.pink:"",background:gaOverIdx===i&&gaDragIdx!==i?"#FFF0F6":"inherit",transition:"opacity 0.15s",cursor:"default"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:isMobile?"wrap":"nowrap"}}>
                    <div style={{color:C.grey6,cursor:"grab",flexShrink:0,display:"flex",alignItems:"center"}}><GripVertical size={14}/></div>
                    <div style={{flexShrink:0,width:isMobile?"100%":180}}>
                      <input value={card.title||""} onChange={function(e){var v=e.target.value;setGaCards(function(prev){return prev.map(function(c){return c.id===card.id?Object.assign({},c,{title:v}):c;});});}} placeholder="Card title" style={{width:"100%",padding:"6px 8px",border:"1px solid "+C.grey4,borderRadius:6,fontSize:13,fontWeight:600,color:C.offBlack,background:C.white,boxSizing:"border-box"}}/>
                    </div>
                    <input value={card.url||""} onChange={function(e){var v=e.target.value;setGaCards(function(prev){return prev.map(function(c){return c.id===card.id?Object.assign({},c,{url:v}):c;});});}} placeholder="https://analytics.google.com/..." style={{flex:1,width:isMobile?"100%":"auto",padding:"7px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,color:C.offBlack,background:C.white,boxSizing:"border-box",outline:"none"}}/>
                    <button onClick={function(){flashSaved(card.id);}} title="Save" style={{flexShrink:0,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:isSaved?"#E6F9F2":C.grey3,color:isSaved?"#00A86B":C.grey6,border:isSaved?"1px solid #A3E6C8":"none",borderRadius:8,cursor:"pointer",transition:"all 0.2s"}}><Check size={14}/></button>
                    <button onClick={function(){deleteGaCard(card.id);}} title="Delete" style={{flexShrink:0,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:"#FFF0F0",color:"#CC0000",border:"1px solid #FFAAAA",borderRadius:8,cursor:"pointer"}}><Trash2 size={14}/></button>
                  </div>
                  <input value={card.desc||""} onChange={function(e){var v=e.target.value;setGaCards(function(prev){return prev.map(function(c){return c.id===card.id?Object.assign({},c,{desc:v}):c;});});}} placeholder="Card description (shown on Analytics page)" style={{width:"100%",padding:"6px 8px",border:"1px solid "+C.grey4,borderRadius:6,fontSize:12,color:C.grey7,background:C.white,boxSizing:"border-box",outline:"none"}}/>
                </div>
              );
            })}
            {!showNewGaCard&&(
              <button onClick={function(){setShowNewGaCard(true);}} style={{width:"100%",padding:"14px 16px",border:"none",borderTop:(gaCards||[]).length>0?"1px solid "+C.grey3:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:C.grey6}} onMouseEnter={function(e){e.currentTarget.style.background=C.grey2;e.currentTarget.style.color=C.pink;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.grey6;}}>
                <div style={{width:22,height:22,borderRadius:"50%",border:"1.5px dashed currentColor",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Plus size={11}/></div>
                <span style={{fontSize:13,fontWeight:600}}>Add analytics report</span>
              </button>
            )}
          </div>
        </div>
      )}
      {tab==="wireframes"&&(
        <div>
          <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:24,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:8}}>
              <div>
                <h3 style={{fontWeight:700,color:C.black,fontSize:15,margin:0,marginBottom:4}}>Tone of Voice</h3>
                <p style={{fontSize:13,color:C.grey7,margin:0,lineHeight:1.6}}>Paste your tone of voice guidelines here. Every wireframe that gets generated will apply these rules to all copy it writes.</p>
              </div>
              {(wireframeRules as any).tov&&<div style={{display:"flex",alignItems:"center",gap:5,background:"#E6F9F2",border:"1px solid #A3E6C8",borderRadius:99,padding:"4px 10px",flexShrink:0}}><Check size={12} color="#00A86B"/><span style={{fontSize:11,fontWeight:700,color:"#005C3B"}}>Active</span></div>}
            </div>
            <textarea
              value={(wireframeRules as any).tov||""}
              onChange={function(e){setWireframeRules(function(prev){return Object.assign({},prev,{tov:e.target.value});});}}
              rows={16}
              placeholder="Paste your tone of voice guidelines here…&#10;&#10;For example:&#10;– Write in the second person (you / your)&#10;– Be direct and confident — no filler phrases&#10;– Avoid jargon; explain complex ideas simply&#10;– Use active voice&#10;– Lead with the benefit, not the feature"
              style={{width:"100%",padding:"10px 12px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:13,color:C.offBlack,background:C.white,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.65,marginTop:16,outline:"none"}}
            />
          </div>
          {(wireframeRules as any).tov&&(
            <div style={{background:"#E6F9F2",border:"1px solid #A3E6C8",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:8}}>
              <Check size={14} color="#00A86B"/>
              <span style={{fontSize:13,color:"#005C3B",fontWeight:600}}>Tone of voice is active. All new wireframes will follow these guidelines when generating copy.</span>
            </div>
          )}
        </div>
      )}
      {tab==="clients"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <input value={clientSearch} onChange={function(e){setClientSearch(e.target.value);}} placeholder="Search clients…" style={{flex:1,padding:"8px 12px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:13,outline:"none",background:C.white}}/>
            <button onClick={function(){setShowAddClient(!showAddClient);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>{showAddClient?"Cancel":"Add client"}</button>
          </div>
          {showAddClient&&(
            <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:20,marginBottom:16}}>
              <h3 style={{fontWeight:700,color:C.black,fontSize:15,marginBottom:16}}>New Client</h3>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
                <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Company name</div><input value={newClient.name} onChange={function(e){setNewClient(Object.assign({},newClient,{name:e.target.value}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Type</div><select value={newClient.type} onChange={function(e){setNewClient(Object.assign({},newClient,{type:e.target.value}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,background:C.white}}><option>Agency</option><option>Corporate</option><option>Media</option><option>Platform</option><option>Sports</option></select></div>
                <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Sector</div><input value={newClient.sector} onChange={function(e){setNewClient(Object.assign({},newClient,{sector:e.target.value}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Notes</div><input value={newClient.notes} onChange={function(e){setNewClient(Object.assign({},newClient,{notes:e.target.value}));}} placeholder="e.g. No longer a client" style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <input type="checkbox" id="hasCase" checked={newClient.hasCase} onChange={function(e){setNewClient(Object.assign({},newClient,{hasCase:e.target.checked}));}}/>
                <label htmlFor="hasCase" style={{fontSize:13,color:C.offBlack,fontWeight:600}}>Has a published case study</label>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){if(!newClient.name)return;setClientList(function(prev){return (prev as any[]).concat([Object.assign({},newClient,{id:"cl-"+Date.now()})]);});setNewClient({name:"",type:"Agency",sector:"",hasCase:false,notes:""});setShowAddClient(false);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add client</button>
                <button onClick={function(){setShowAddClient(false);setNewClient({name:"",type:"Agency",sector:"",hasCase:false,notes:""});}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          )}
          {(function(){
            var filtered=(clientList as any[]).filter(function(c){return !clientSearch||c.name.toLowerCase().includes(clientSearch.toLowerCase())||c.sector.toLowerCase().includes(clientSearch.toLowerCase());});
            var active=filtered.filter(function(c){return !c.notes.toLowerCase().includes("no longer");});
            var inactive=filtered.filter(function(c){return c.notes.toLowerCase().includes("no longer");});
            function row(c:any){return(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid "+C.grey3}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:C.offBlack}}>{c.name}</div>
                  <div style={{fontSize:11,color:C.grey7}}>{c.sector}</div>
                </div>
                <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:c.type==="Agency"?"#F0F0FF":c.type==="Corporate"?"#F0FFF8":"#FFF8F0",color:c.type==="Agency"?C.violet:c.type==="Corporate"?C.teal:C.grey8,flexShrink:0}}>{c.type}</span>
                {c.hasCase&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"#E6F9F2",color:"#005C3B",flexShrink:0}}>Case Study</span>}
                {c.notes&&<span style={{fontSize:10,color:C.grey7,flexShrink:0,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.notes}</span>}
                <button onClick={function(){setClientList(function(prev){return (prev as any[]).filter(function(x){return x.id!==c.id;});});}} style={{background:"#FFF0F0",color:"#CC0000",border:"1px solid #FFAAAA",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>Remove</button>
              </div>
            );}
            return(
              <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,overflow:"hidden"}}>
                {active.length>0&&(
                  <div>
                    <div style={{padding:"10px 16px",background:C.grey3,fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em"}}>{active.length} active client{active.length===1?"":"s"}</div>
                    {active.map(row)}
                  </div>
                )}
                {inactive.length>0&&(
                  <div>
                    <div style={{padding:"10px 16px",background:"#FFF8F8",fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em"}}>{inactive.length} former client{inactive.length===1?"":"s"}</div>
                    {inactive.map(row)}
                  </div>
                )}
                {active.length===0&&inactive.length===0&&(
                  <div style={{padding:24,textAlign:"center",color:C.grey6,fontSize:13}}>No clients match your search.</div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {tab==="case-studies"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <button onClick={function(){setShowAddCase(!showAddCase);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>{showAddCase?"Cancel":"Add case study"}</button>
          </div>
          {showAddCase&&(
            <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:20,marginBottom:16}}>
              <h3 style={{fontWeight:700,color:C.black,fontSize:15,marginBottom:16}}>New Case Study</h3>
              {[["Company","company"],["Sector","sector"],["Outcome (what happened)","outcome"],["Key metric","metric"],["Pull quote","quote"]].map(function(x){return(
                <div key={x[1]} style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>{x[0]}</div>
                  {(x[1]==="outcome"||x[1]==="quote")
                    ?<textarea value={(newCase as any)[x[1]]||""} onChange={function(e){var u=Object.assign({},newCase);(u as any)[x[1]]=e.target.value;setNewCase(u);}} rows={2} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,color:C.offBlack,background:C.white,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                    :<input value={(newCase as any)[x[1]]||""} onChange={function(e){var u=Object.assign({},newCase);(u as any)[x[1]]=e.target.value;setNewCase(u);}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/>
                  }
                </div>
              );})}
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button onClick={function(){if(!(newCase as any).company)return;setCaseStudies(function(prev){return (prev as any[]).concat([Object.assign({},newCase,{id:"case-"+Date.now()})]);});setNewCase({company:"",sector:"",outcome:"",metric:"",quote:""});setShowAddCase(false);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save case study</button>
                <button onClick={function(){setShowAddCase(false);}} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          )}
          {(caseStudies as any[]).map(function(cs){
            var isEditing=editingCase===cs.id;
            return(
              <div key={cs.id} style={{background:C.white,border:"1px solid "+(isEditing?C.pink:C.grey4),borderRadius:12,marginBottom:12,overflow:"hidden"}}>
                <div style={{padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:C.black,marginBottom:2}}>{cs.company}</div>
                    <div style={{fontSize:12,color:C.grey7,marginBottom:6}}>{cs.sector}</div>
                    {!isEditing&&(
                      <div>
                        <div style={{fontSize:13,color:C.offBlack,lineHeight:1.6,marginBottom:6}}>{cs.outcome}</div>
                        {cs.metric&&<div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#E6F9F2",border:"1px solid #A3E6C8",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#005C3B",marginBottom:6}}>{cs.metric}</div>}
                        {cs.quote&&<div style={{fontSize:12,color:C.grey7,fontStyle:"italic",borderLeft:"3px solid "+C.pink,paddingLeft:10,marginTop:8}}>"{cs.quote}"</div>}
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={function(){if(isEditing){setEditingCase(null);}else{setEditingCase(cs.id);setCaseDraft(Object.assign({},cs));}}} style={{background:isEditing?C.pink:C.grey3,color:isEditing?C.white:C.grey8,border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{isEditing?"Close":"Edit"}</button>
                    <button onClick={function(){setCaseStudies(function(prev){return (prev as any[]).filter(function(x){return x.id!==cs.id;});});}} style={{background:"#FFF0F0",color:"#CC0000",border:"1px solid #FFAAAA",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Delete</button>
                  </div>
                </div>
                {isEditing&&(
                  <div style={{padding:"0 20px 20px",borderTop:"1px solid "+C.grey4}}>
                    {[["Company","company"],["Sector","sector"],["Outcome","outcome"],["Key metric","metric"],["Pull quote","quote"]].map(function(x){return(
                      <div key={x[1]} style={{marginBottom:10,marginTop:10}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>{x[0]}</div>
                        {(x[1]==="outcome"||x[1]==="quote")
                          ?<textarea value={caseDraft[x[1]]||""} onChange={function(e){var u=Object.assign({},caseDraft);u[x[1]]=e.target.value;setCaseDraft(u);}} rows={2} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,color:C.offBlack,background:C.white,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                          :<input value={caseDraft[x[1]]||""} onChange={function(e){var u=Object.assign({},caseDraft);u[x[1]]=e.target.value;setCaseDraft(u);}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:12,boxSizing:"border-box"}}/>
                        }
                      </div>
                    );})}
                    <button onClick={function(){setCaseStudies(function(prev){return (prev as any[]).map(function(x){return x.id===cs.id?Object.assign({},caseDraft,{id:cs.id}):x;});});setEditingCase(null);}} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:4}}>Save Changes</button>
                  </div>
                )}
              </div>
            );
          })}
          {(caseStudies as any[]).length===0&&(
            <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:32,textAlign:"center"}}>
              <div style={{fontSize:13,color:C.grey6,lineHeight:1.7}}>No case studies yet. Add your first one to start injecting real proof points into your audit prompts.</div>
            </div>
          )}
        </div>
      )}
    </PageWrap>
  );
}

function GuidePage(){
  var isMobile=useWidth()<768;
  return(
    <PageWrap isMobile={isMobile}>
      <BlackHero eyebrow="GWI Website - UX" title="How to use" desc="A quick walkthrough of every section in the tool."/>
      {[
        {step:"1",title:"Set up your pages",desc:"Go to Settings → Pages and make sure all the pages you want to audit are listed. You can add, hide, or delete pages. These pages drive the audit, recommendations, and analytics — so keep them up to date."},
        {step:"2",title:"Run a UX audit",desc:"Go to UX Audit, select a page, and click Generate. Claude receives everything you've configured in Settings: the full detail of all 5 personas (entry points, drives, anxieties, what they need from the website), all 9 lifecycle stages (goals, push/pull/habit/anxiety per stage, website role), and every customer journey step mapped per persona.\n\nIt also receives your active client list — so it can suggest specific logo walls and sector-relevant proof — and your saved case studies, so CHANGE recommendations reference real GWI customer outcomes with actual metrics rather than generic best practice.\n\nEvery finding follows the same format: SHOWS (what the page currently does), WHY (which persona and lifecycle stage it blocks, by name), CHANGE (the specific fix), and METRIC (how to measure success)."},
        {step:"3",title:"Add recommendations",desc:"From the UX Audit results, click 'Add to Recommendations' next to any finding. This adds it to the Recommendations tracker where you can manage status, assign effort, and track progress."},
        {step:"4",title:"Generate a wireframe",desc:"On any page in the Recommendations view, click 'Generate Wireframe'. Claude will produce a low-fidelity wireframe showing exactly how the improved page could look. Wireframes are saved and viewable in the Wireframes section."},
        {step:"5",title:"Track progress",desc:"Use the Recommendations page to manage actions. Toggle between List and Matrix views. Click the priority cards (Critical / High / Medium / Low) to jump into the matrix. Mark actions as To Do, In Progress, or Done."},
        {step:"6",title:"Explore journeys and personas",desc:"The Personas and Journeys sections give you context for every recommendation. Use them to understand who you're designing for and where they are in the lifecycle when they encounter each page."},
        {step:"7",title:"Use Analytics as evidence",desc:"The Analytics section links to GA4 and Hotjar for each page. Open these before writing audit findings to ground your recommendations in real behaviour data."},
        {step:"8",title:"Leave feedback",desc:"Click the pink bubble (bottom-left) or press ⌘⇧F at any time to leave feedback. Your input directly shapes what gets built next."},
      ].map(function(item){return(
        <div key={item.step} style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:12,padding:"20px 24px",marginBottom:12,display:"flex",gap:16,alignItems:"flex-start"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#FFEEF6",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:14,fontWeight:800,color:C.pink}}>{item.step}</span>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.black,marginBottom:6}}>{item.title}</div>
            {item.desc.split("\n\n").map(function(para,i){return <div key={i} style={{fontSize:14,color:C.grey7,lineHeight:1.7,marginBottom:i<item.desc.split("\n\n").length-1?10:0}}>{para}</div>;})}
          </div>
        </div>
      );})}
    </PageWrap>
  );
}

function AddActionModal({auditData,setAuditData,pages,onClose}){
  var [selPage,setSelPage]=useState(auditData[0]?auditData[0].id:"new");
  var [newPageUrl,setNewPageUrl]=useState("");
  var [newPageLabel,setNewPageLabel]=useState("");
  var [priority,setPriority]=useState("High");
  var [actionText,setActionText]=useState("");
  var [actionDesc,setActionDesc]=useState("");
  function save(){
    if(!actionText)return;
    var newAction={id:"a-"+Date.now(),text:actionText,description:actionDesc,status:"todo",metric:"",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""};
    if(selPage==="new"){if(!newPageUrl||!newPageLabel)return;setAuditData(function(prev){return prev.concat([{id:"aa-"+Date.now(),url:newPageUrl,label:newPageLabel,priority:priority,personas:[],stage:"",issue:"",actions:[newAction]}]);});}
    else{setAuditData(function(prev){return prev.map(function(p){return p.id===selPage?Object.assign({},p,{actions:[newAction].concat(p.actions)}):p;});});}
    onClose();
  }
  useEffect(function(){
    function onKey(e:KeyboardEvent){
      if(e.key==="Enter"&&!e.shiftKey){
        var tag=(document.activeElement as HTMLElement)?.tagName;
        if(tag!=="TEXTAREA"&&tag!=="SELECT"){e.preventDefault();save();}
      }
    }
    document.addEventListener("keydown",onKey);
    return function(){document.removeEventListener("keydown",onKey);};
  },[actionText,actionDesc,selPage,newPageUrl,newPageLabel,priority]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:16,padding:28,width:520,maxWidth:"90vw",maxHeight:"80vh",overflow:"auto"}}>
        <h2 style={{fontSize:18,fontWeight:700,color:C.black,marginBottom:20}}>Add UX Action</h2>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Page</div>
          <select value={selPage} onChange={function(e){setSelPage(e.target.value);}} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:13,background:C.white,marginBottom:8}}>
            {auditData.map(function(p){return <option key={p.id} value={p.id}>{p.label} ({p.url})</option>;})}
            <option value="new">New page</option>
          </select>
          {selPage==="new"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
            <div><div style={{fontSize:11,color:C.grey7,marginBottom:3}}>URL</div><input value={newPageUrl} onChange={function(e){setNewPageUrl(e.target.value);}} placeholder="/your-page" style={{width:"100%",padding:"7px 10px",border:"1px solid "+C.grey4,borderRadius:7,fontSize:12,boxSizing:"border-box"}}/></div>
            <div><div style={{fontSize:11,color:C.grey7,marginBottom:3}}>Label</div><input value={newPageLabel} onChange={function(e){setNewPageLabel(e.target.value);}} placeholder="Page Name" style={{width:"100%",padding:"7px 10px",border:"1px solid "+C.grey4,borderRadius:7,fontSize:12,boxSizing:"border-box"}}/></div>
          </div>)}
        </div>
        {selPage==="new"&&(<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Priority</div><div style={{display:"flex",gap:6}}>{["Critical","High","Medium","Low"].map(function(p){return <button key={p} onClick={function(){setPriority(p);}} style={{background:priority===p?C.pink:"transparent",color:priority===p?C.white:C.grey7,border:"1px solid "+(priority===p?C.pink:C.grey5),borderRadius:6,padding:"4px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{p}</button>;})}</div></div>)}
        <div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Action</div><input value={actionText} onChange={function(e){setActionText(e.target.value);}} placeholder="e.g. Add self-selection entry point" style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:20}}><div style={{fontSize:11,fontWeight:700,color:C.grey7,marginBottom:4}}>Description (optional)</div><textarea value={actionDesc} onChange={function(e){setActionDesc(e.target.value);}} rows={3} placeholder="Why this matters..." style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.grey4,borderRadius:8,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Action</button>
        </div>
      </div>
    </div>
  );
}

function UserFlowsPage({setView}){
  var isMobile=useWidth()<768;
  var FLOWS=[
    {id:"homepage-to-signup",label:"Homepage to Free Sign-up",persona:"Inspiration Hunter / Commercial Closer",goal:"User lands on gwi.com and completes free account creation",steps:[
      {id:"s1",type:"page",label:"Homepage",note:"User lands via ad, search or referral"},
      {id:"s2",type:"decision",label:"Does the page communicate value instantly?",noLabel:"Bounces"},
      {id:"s3",type:"page",label:"Scrolls homepage",note:"Scans hero, logos, product highlights"},
      {id:"s4",type:"decision",label:"Does CTA say Sign up for free?",noLabel:"Clicks Book a Demo instead"},
      {id:"s5",type:"action",label:"Clicks Sign up for free CTA"},
      {id:"s6",type:"page",label:"Sign-up page",note:"Email, name, password or SSO"},
      {id:"s7",type:"decision",label:"Is the form friction low?",noLabel:"Abandons form"},
      {id:"s8",type:"action",label:"Submits sign-up form"},
      {id:"s9",type:"system",label:"System sends verification email"},
      {id:"s10",type:"page",label:"Email inbox",note:"User verifies email"},
      {id:"s11",type:"page",label:"Platform first login",note:"Blank canvas. What now?",isHighlight:true},
    ]},
    {id:"evaluation-to-demo",label:"Evaluation to Demo Booking",persona:"Strategic Leader / Commercial Closer",goal:"User evaluates GWI and books a demo with sales",steps:[
      {id:"e1",type:"page",label:"Homepage",note:"Arrives via word of mouth or outreach"},
      {id:"e2",type:"decision",label:"Credibility signals land in 5 seconds?",noLabel:"Exits"},
      {id:"e3",type:"page",label:"Browses case studies and about us",note:"Validates reputation and client names"},
      {id:"e4",type:"page",label:"Pricing page",note:"Checks ballpark cost"},
      {id:"e5",type:"decision",label:"Is value clear enough to justify a call?",noLabel:"Exits — too vague"},
      {id:"e6",type:"action",label:"Clicks Book a Demo CTA"},
      {id:"e7",type:"page",label:"Demo booking form / Calendly",note:"Selects time, fills details"},
      {id:"e8",type:"system",label:"Confirmation email sent"},
      {id:"e9",type:"page",label:"Demo call with GWI sales",note:"Outside website funnel",isHighlight:true},
    ]},
    {id:"api-evaluation",label:"API / Integration Evaluation",persona:"Data Integrator",goal:"Technical user evaluates GWI API for integration",steps:[
      {id:"a1",type:"page",label:"/api page",note:"Arrives via technical search — this is their homepage"},
      {id:"a2",type:"decision",label:"Does the page answer: endpoints, schema, auth, rate limits?",noLabel:"Exits to competitor docs"},
      {id:"a3",type:"page",label:"Explores /data and /respondent-level-data",note:"Validates data structure and freshness"},
      {id:"a4",type:"page",label:"Trust Center",note:"Checks GDPR, ISO, compliance"},
      {id:"a5",type:"decision",label:"Technical requirements met?",noLabel:"Raises internally — stalls"},
      {id:"a6",type:"action",label:"Requests API access / contacts sales"},
      {id:"a7",type:"page",label:"Proof of concept build",note:"First integration. Outside website funnel.",isHighlight:true},
    ]},
    {id:"report-to-signup",label:"Report / Insight → Sign-up",persona:"Insight Guru",goal:"User finds a GWI report via search and signs up to access full data",steps:[
      {id:"r1",type:"page",label:"Google search",note:"Searches for a specific stat, trend or data point"},
      {id:"r2",type:"page",label:"GWI blog or report page",note:"Lands on an article or truncated report via organic search"},
      {id:"r3",type:"decision",label:"Does the content prove GWI data quality?",noLabel:"Exits — no trust built"},
      {id:"r4",type:"page",label:"Reads article / scrolls report",note:"Validates methodology, sample size, recency of data"},
      {id:"r5",type:"system",label:"Hits gated content or data paywall"},
      {id:"r6",type:"decision",label:"Is the sign-up CTA compelling enough?",noLabel:"Exits — friction too high"},
      {id:"r7",type:"action",label:"Clicks 'Sign up for free' or 'See full data'"},
      {id:"r8",type:"page",label:"Sign-up page",note:"Email, name, password or SSO"},
      {id:"r9",type:"decision",label:"Is form friction low?",noLabel:"Abandons form"},
      {id:"r10",type:"action",label:"Submits sign-up form"},
      {id:"r11",type:"page",label:"Platform: full report unlocked",note:"The data they came for is now visible",isHighlight:true},
    ]},
    {id:"trial-to-paid",label:"Free Trial → Paid Upgrade",persona:"Insight Guru / Commercial Closer",goal:"Free trial user hits a limit and upgrades to a paid plan",steps:[
      {id:"t1",type:"page",label:"Inside GWI platform",note:"Active on a free trial — exploring the product"},
      {id:"t2",type:"system",label:"Hits feature limit or data paywall"},
      {id:"t3",type:"decision",label:"Is the upgrade value clear from the paywall?",noLabel:"Churns — returns to free tools"},
      {id:"t4",type:"page",label:"gwi.com/pricing",note:"Returns to website to compare plans and understand what paid unlocks"},
      {id:"t5",type:"decision",label:"Is pricing clear enough to self-serve?",noLabel:"Exits — too vague, or contacts support"},
      {id:"t6",type:"page",label:"Plan comparison",note:"Weighs what the paid tier unlocks vs the free tier"},
      {id:"t7",type:"decision",label:"Can they upgrade without speaking to sales?",noLabel:"Books an upgrade call with sales"},
      {id:"t8",type:"action",label:"Clicks Upgrade and enters payment"},
      {id:"t9",type:"system",label:"Payment processed, plan upgraded"},
      {id:"t10",type:"page",label:"Platform: full access unlocked",note:"All paywalled features and data now available",isHighlight:true},
    ]},
    {id:"trust-compliance",label:"Trust & Compliance Check",persona:"Data Integrator / Strategic Leader",goal:"Legal or security team validates GWI meets compliance requirements before sign-off",steps:[
      {id:"c1",type:"page",label:"Internal procurement request",note:"Legal or InfoSec team tasked with due diligence before deal can proceed"},
      {id:"c2",type:"page",label:"gwi.com Trust Center",note:"Searching for certifications, data policies and processing agreements"},
      {id:"c3",type:"decision",label:"Are ISO, GDPR and SOC2 certs clearly visible?",noLabel:"Contacts GWI directly — adds friction and delays"},
      {id:"c4",type:"page",label:"Reviews certifications",note:"ISO 27001, GDPR compliance, SOC2 documentation"},
      {id:"c5",type:"page",label:"Looks for DPA / data processing agreement",note:"Critical for enterprise procurement sign-off"},
      {id:"c6",type:"decision",label:"Do compliance docs meet requirements?",noLabel:"Requests additional documentation from GWI"},
      {id:"c7",type:"action",label:"Downloads DPA or requests signed agreement"},
      {id:"c8",type:"page",label:"Internal sign-off meeting",note:"Outside website funnel — legal reviews docs"},
      {id:"c9",type:"page",label:"Legal approval granted — deal unblocked",note:"Procurement cleared, commercial discussion can resume",isHighlight:true},
    ]},
    {id:"agency-evaluation",label:"Agency Evaluation",persona:"Commercial Closer",goal:"Agency evaluates GWI on behalf of a client brief",steps:[
      {id:"ag1",type:"page",label:"Client brief received",note:"Agency tasked with finding a data and insight partner for a campaign or project"},
      {id:"ag2",type:"page",label:"gwi.com homepage",note:"Evaluating GWI alongside 2–3 competitor platforms"},
      {id:"ag3",type:"page",label:"Case studies and sector coverage",note:"Looking for relevant client industry and audience data"},
      {id:"ag4",type:"decision",label:"Does GWI cover the client's audience and sector?",noLabel:"Eliminates GWI — wrong fit for the brief"},
      {id:"ag5",type:"page",label:"Platform features and reporting",note:"Assessing output quality, chart types and client-facing exports"},
      {id:"ag6",type:"decision",label:"Does GWI support agency or white-label workflows?",noLabel:"Raises concern internally — may still proceed"},
      {id:"ag7",type:"action",label:"Contacts sales or requests an agency demo"},
      {id:"ag8",type:"page",label:"Agency partnership demo",note:"GWI sales presents agency-specific use cases and pricing"},
      {id:"ag9",type:"page",label:"GWI recommended to client",note:"Agency champion secures internal buy-in and pitches GWI",isHighlight:true},
    ]},
    {id:"content-discovery",label:"Content Discovery",persona:"Inspiration Hunter",goal:"User arrives via social sharing and converts to a free account",steps:[
      {id:"cd1",type:"page",label:"Social media or newsletter",note:"Clicks a shared GWI chart, trend or stat — no prior brand awareness"},
      {id:"cd2",type:"page",label:"GWI insight article or trends page",note:"Lands on engaging content with no immediate purchase intent"},
      {id:"cd3",type:"decision",label:"Does the content spark ideas or validate their thinking?",noLabel:"Bounces — content not relevant enough"},
      {id:"cd4",type:"action",label:"Shares content internally or saves it for later"},
      {id:"cd5",type:"page",label:"Explores related articles",note:"Browses /blog or /reports for more content in the same vein"},
      {id:"cd6",type:"decision",label:"Does GWI have a depth of relevant content?",noLabel:"Leaves — treats it as a one-off visit"},
      {id:"cd7",type:"page",label:"Discovers free sign-up CTA",note:"Prompted by a content gate, email capture or newsletter prompt"},
      {id:"cd8",type:"decision",label:"Is the free tier compelling enough to sign up now?",noLabel:"Exits — not enough incentive at this moment"},
      {id:"cd9",type:"action",label:"Creates free account"},
      {id:"cd10",type:"page",label:"Returns to explore the data behind the insights",note:"Free account becomes a regular content user and internal champion",isHighlight:true},
    ]},
  ];
  var [activeFlow,setActiveFlow]=useState(FLOWS[0].id);
  var flow=FLOWS.find(function(f){return f.id===activeFlow;});
  var typeConfig={page:{bg:C.white,border:C.grey4,text:C.black,label:"Page",labelText:C.grey8},decision:{bg:"#EBF1FB",border:C.violet,text:C.black,label:"Decision",labelText:C.violetDark},action:{bg:"#F7FAFF",border:C.teal,text:C.black,label:"Action",labelText:C.tealDark},system:{bg:"#EBF1FB",border:C.blueMed,text:C.black,label:"System",labelText:C.blueDark}};
  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100%",overflow:"hidden"}}>
      <MappingSidebar activeId="flows" setView={setView} isMobile={isMobile}/>
      <div style={{flex:1,overflow:"auto",background:C.grey2,padding:isMobile?"16px":"20px"}}>
        <div style={{maxWidth:920,margin:"0 auto",paddingBottom:80}}>
          <BlackHero eyebrow="Step by step" title="User Flows" desc="The exact clicks from A to B. Each flow maps screens, decision points, actions and drop-off paths for a specific goal on gwi.com." why="Journey maps show which pages a persona visits. User flows go one level deeper."/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
            {FLOWS.map(function(f){return(<button key={f.id} onClick={function(){setActiveFlow(f.id);}} style={{background:activeFlow===f.id?C.pink:C.white,color:activeFlow===f.id?C.white:C.offBlack,border:"1.5px solid "+(activeFlow===f.id?C.pink:C.grey4),fontSize:12,fontWeight:700,padding:"6px 16px",borderRadius:99,cursor:"pointer"}}>{f.label}</button>);})}
          </div>
          <div style={{background:C.white,border:"1px solid "+C.grey4,borderRadius:14,padding:isMobile?"16px":"24px"}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:18,fontWeight:800,color:C.black,margin:"0 0 4px"}}>{flow.label}</h2>
              <p style={{fontSize:13,color:C.grey7,margin:"0 0 4px"}}><strong style={{color:C.offBlack}}>Persona:</strong> {flow.persona}</p>
              <p style={{fontSize:13,color:C.grey7,margin:0}}><strong style={{color:C.offBlack}}>Goal:</strong> {flow.goal}</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {flow.steps.map(function(step,i){
                var cfg=typeConfig[step.type]||typeConfig.page;var isLast=i===flow.steps.length-1;
                return(
                  <div key={step.id}>
                    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:C.white,border:"2px solid "+C.pink,color:C.black,fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                        {!isLast&&<div style={{width:2,flex:1,minHeight:24,background:C.grey4,margin:"4px 0"}}/>}
                      </div>
                      <div style={{flex:1,background:step.isHighlight?C.pink:C.white,border:"1.5px solid "+(step.isHighlight?C.pink:C.grey4),borderRadius:12,padding:"14px 16px",marginBottom:isLast?0:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:step.note?8:0}}>
                          <span style={{background:"rgba(255,255,255,0.25)",color:step.isHighlight?C.white:cfg.labelText,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,flexShrink:0,textTransform:"uppercase",border:"1px solid "+(step.isHighlight?"rgba(255,255,255,0.3)":C.grey4)}}>{step.isHighlight?"Key moment":cfg.label}</span>
                          <span style={{fontSize:14,fontWeight:700,color:step.isHighlight?C.white:cfg.text}}>{step.label}</span>
                        </div>
                        {step.note&&<p style={{fontSize:12,color:step.isHighlight?"rgba(255,255,255,0.8)":C.grey7,margin:0,lineHeight:1.5}}>{step.note}</p>}
                        {step.type==="decision"&&(<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}><span style={{background:C.white,color:"#005C3B",border:"1px solid #80D4B0",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99}}>Yes — continues</span><span style={{background:C.white,color:"#CC0000",border:"1px solid #FFAAAA",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99}}>No — {step.noLabel}</span></div>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNav({view,setView}){
  var [menuOpen,setMenuOpen]=useState(false);
  var MAPPING=[{id:"mapping",label:"Journeys Overview"},{id:"journey",label:"Journey Mapper"},{id:"lifecycle",label:"Customer Mapping"},{id:"affinity",label:"Affinity Map"},{id:"flows",label:"User Flows"}];
  function Btn({id,label}){var active=view===id;return <button onClick={function(){setView(id);setMenuOpen(false);}} style={{padding:"12px 16px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:active?C.pink:"transparent",color:active?C.white:C.grey7,textAlign:"left",width:"100%",display:"block"}}>{label}</button>;}
  return(
    <div style={{background:C.black,borderBottom:"1px solid "+C.offBlack,flexShrink:0,position:"relative",zIndex:50}}>
      <div style={{padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontWeight:800,fontSize:15,color:C.white,letterSpacing:"-0.02em",cursor:"pointer"}} onClick={function(){setView("dashboard");setMenuOpen(false);}}>GWI UX</div>
        <button onClick={function(){setMenuOpen(!menuOpen);}} style={{background:"transparent",border:"none",cursor:"pointer",color:C.white,fontSize:13,fontWeight:600,padding:"4px 8px"}}>{menuOpen?"Close":"Menu"}</button>
      </div>
      {menuOpen&&(
        <div style={{background:C.black,borderTop:"1px solid "+C.offBlack,padding:"8px 8px 12px"}}>
          <Btn id="audit" label="Recommendations"/>
          <Btn id="summary" label="UX Audit"/>
          <Btn id="wireframes" label="Wireframes"/>
          <Btn id="personas" label="Personas"/>
          <div style={{padding:"8px 16px 4px",fontSize:11,fontWeight:700,color:C.grey8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Journeys</div>
          {MAPPING.map(function(m){return <Btn key={m.id} id={m.id} label={m.label}/>;})}
          <div style={{height:1,background:C.offBlack,margin:"8px 16px"}}/>
          <Btn id="analytics" label="Analytics"/>
          <Btn id="settings" label="Settings"/>
        </div>
      )}
    </div>
  );
}


function LoginScreen({onLogin,onRegister,onGoogleLogin,loginError}:{onLogin:any,onRegister:any,onGoogleLogin:any,loginError:any}){
  var _wrap={position:"relative" as const,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#000",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflow:"hidden" as const};
  var _card={position:"relative" as const,zIndex:1,background:"rgba(255,255,255,0.92)",borderRadius:16,boxShadow:"0 8px 56px rgba(0,0,0,0.55)",padding:"40px 36px",maxWidth:380,width:"100%",boxSizing:"border-box" as const,textAlign:"center" as const};
  var _particleBg=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;overflow:hidden;background:#000}canvas{display:block}</style><script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.160.1/build/three.module.js"}}</`+`script></head><body><script type="x-shader/x-vertex" id="vs">attribute float scale;varying vec3 vColor;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=scale*(300.0/-mv.z);gl_Position=projectionMatrix*mv;}</`+`script><script type="x-shader/x-fragment" id="fs">varying vec3 vColor;void main(){float d=length(gl_PointCoord-vec2(0.5));float a=pow(1.0-d*d,3.5);if(d>0.5)discard;gl_FragColor=vec4(vColor,a*0.9);}</`+`script><script type="module">import*as T from'three';const SEP=100,AX=50,AY=50,N=AX*AY;let cam,scene,ren,pts,cnt=0;const pos=new Float32Array(N*3),sc=new Float32Array(N),col=new Float32Array(N*3);let i=0,j=0;for(let x=0;x<AX;x++)for(let y=0;y<AY;y++){pos[i]=x*SEP-(AX*SEP)/2;pos[i+1]=0;pos[i+2]=y*SEP-(AY*SEP)/2;const c=new T.Color();c.setHSL((j/N)*0.389+0.556,1,.55);col[i]=c.r;col[i+1]=c.g;col[i+2]=c.b;sc[j]=20;i+=3;j++;}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('scale',new T.BufferAttribute(sc,1));geo.setAttribute('color',new T.BufferAttribute(col,3));cam=new T.PerspectiveCamera(75,innerWidth/innerHeight,1,10000);cam.position.z=1000;scene=new T.Scene();pts=new T.Points(geo,new T.ShaderMaterial({vertexShader:document.getElementById('vs').textContent,fragmentShader:document.getElementById('fs').textContent,blending:T.AdditiveBlending,depthTest:false,transparent:true,vertexColors:true}));scene.add(pts);ren=new T.WebGLRenderer({antialias:true});ren.setPixelRatio(devicePixelRatio);ren.setSize(innerWidth,innerHeight);document.body.appendChild(ren.domElement);window.onresize=function(){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight);};(function loop(){requestAnimationFrame(loop);cam.position.x=Math.sin(cnt*.005)*1000;cam.position.z=Math.cos(cnt*.005)*1000;cam.position.y=80;cam.lookAt(scene.position);let i=0;for(let x=0;x<AX;x++)for(let y=0;y<AY;y++){pos[i+1]=(Math.sin((x+cnt)*.3)*50)+(Math.sin((y+cnt)*.5)*50);i+=3;}for(let i=0;i<N;i++){const t=20+Math.abs(Math.sin(cnt*.1+i))*20;sc[i]+=(t-sc[i])*.1;const h=((Math.sin(cnt*.05+i)+1)/2)*0.389+0.556,bc=new T.Color();bc.setHSL(h,1,.55);col[i*3]+=(bc.r-col[i*3])*.1;col[i*3+1]+=(bc.g-col[i*3+1])*.1;col[i*3+2]+=(bc.b-col[i*3+2])*.1;}geo.attributes.position.needsUpdate=true;geo.attributes.scale.needsUpdate=true;geo.attributes.color.needsUpdate=true;ren.render(scene,cam);cnt+=.05;})();</`+`script></body></html>`;
  return(
    <div style={_wrap}>
      <iframe srcDoc={_particleBg} title="bg" sandbox="allow-scripts" style={{position:"absolute",top:0,left:0,right:0,bottom:0,width:"100%",height:"100%",border:"none",pointerEvents:"none",zIndex:0}}/>
      <div style={_card}>
        <div style={{marginBottom:28,display:"flex",justifyContent:"center"}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 71" fill="none" style={{width:"50%",height:"auto",display:"block"}}>
            <path fillRule="evenodd" clipRule="evenodd" d="M230 54.2105C230 43.7102 225.129 38.8339 214.623 38.8339C204.119 38.8339 199.248 43.7102 199.248 54.2105C199.248 64.7107 204.119 69.5871 214.623 69.5871C225.129 69.5871 230 64.7107 230 54.2105Z" fill="#FF0077"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M176.341 69.2236H191.612V1.95935H176.341V69.2236Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M148.954 69.2236H131.472L118.484 24.3824L105.359 69.2236H88.0286L67.2642 1.95935H84.4376L84.5125 2.23484L96.8212 47.6343L109.642 1.95935H127.359L140.518 47.7687L152.864 1.95935H169.797L148.954 69.2236Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M32.5803 70.6778C22.7079 70.6778 14.7182 67.5206 8.83175 61.2943C2.96903 54.9939 0 46.4408 0 35.8647C0 25.3963 3.20293 16.8049 9.52069 10.3297C15.8664 3.81068 24.2783 0.504883 34.5232 0.504883C47.7936 0.504883 58.3726 6.4687 64.3131 17.2975L64.8781 18.3276L53.5652 27.5345L52.7116 26.2328C48.1861 19.3266 42.0415 15.8248 34.4491 15.8248C28.6982 15.8248 24.0876 17.6396 20.7467 21.2194C17.3287 24.8807 15.6671 29.6421 15.6671 35.774C15.6671 41.8194 17.3002 46.6228 20.5195 50.0522C23.7692 53.5132 28.2291 55.2678 33.7753 55.2678C40.2 55.2678 45.9467 52.1574 50.0281 46.4907H34.8379V31.9933H66.9006V69.3999H54.0525V60.9138C51.5634 63.9329 48.5603 66.2981 45.112 67.9516C41.3416 69.7609 37.1253 70.6778 32.5803 70.6778Z" fill="black"/>
          </svg>
        </div>
        <div style={{fontSize:18,fontWeight:700,color:C.black,marginBottom:4}}>Welcome back</div>
        <div style={{fontSize:14,color:C.grey7,marginBottom:24}}>Sign in to your GWI UX Audit workspace</div>
        <button type="button" onClick={onGoogleLogin} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:C.white,color:C.black,border:"1px solid "+C.grey5,borderRadius:8,padding:"12px 0",fontSize:14,fontWeight:600,cursor:"pointer",width:"100%"}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>
        {loginError&&<div style={{color:C.pink,fontSize:13,marginTop:12,textAlign:"center" as const,lineHeight:1.5}}>{loginError}</div>}
        <div style={{fontSize:11,color:C.grey6,marginTop:16,textAlign:"center" as const}}>Access restricted to @gwi.com accounts</div>
      </div>
    </div>
  );
}
function ConfirmResetScreen({oobCode}:{oobCode:string}){
  var [_pw,_setPw]=useState('');
  var [_pw2,_setPw2]=useState('');
  var [_msg,_setMsg]=useState('');
  var [_done,_setDone]=useState(false);
  var _inputStyle={padding:"10px 14px",background:C.white,border:"1px solid "+C.grey5,borderRadius:8,color:C.black,fontSize:14,outline:"none",boxSizing:"border-box" as const,width:"100%",fontFamily:"inherit"};
  var _primaryBtn={background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"11px 0",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4,width:"100%"};
  var _wrap={display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",minHeight:"100vh",background:C.grey2,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"};
  var _card={background:C.white,borderRadius:16,boxShadow:"0 4px 24px rgba(16,23,32,0.10)",padding:"40px 36px",maxWidth:380,width:"100%",boxSizing:"border-box" as const};
  function _submit(e:any){
    e.preventDefault();
    if(_pw.length<6){_setMsg('Password must be at least 6 characters.');return;}
    if(_pw!==_pw2){_setMsg('Passwords do not match.');return;}
    confirmPasswordReset(_auth,oobCode,_pw)
      .then(function(){_setDone(true);window.history.replaceState({},'',window.location.pathname);})
      .catch(function(err:any){_setMsg('Could not reset password. The link may have expired — request a new one. ('+(err.code||'unknown')+')');});
  }
  return(
    <div style={_wrap}>
      <div style={_card}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.pink,display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={16} color={C.white}/></div>
          <span style={{fontWeight:800,fontSize:20,color:C.black,letterSpacing:"-0.02em"}}>GWI UX Audit</span>
        </div>
        {_done?(
          <>
            <div style={{fontSize:18,fontWeight:700,color:C.black,marginBottom:8}}>Password updated</div>
            <div style={{fontSize:14,color:C.grey7,marginBottom:24}}>You can now sign in with your new password.</div>
            <button onClick={function(){window.location.href=window.location.pathname;}} style={_primaryBtn}>Go to sign in</button>
          </>
        ):(
          <>
            <div style={{fontSize:18,fontWeight:700,color:C.black,marginBottom:4}}>Set new password</div>
            <div style={{fontSize:14,color:C.grey7,marginBottom:24}}>Choose a new password for your account.</div>
            <form onSubmit={_submit} style={{display:"flex",flexDirection:"column",gap:10}}>
              <input type="password" placeholder="New password (min 6 chars)" value={_pw} onChange={function(e){_setPw(e.target.value);}} required style={_inputStyle}/>
              <input type="password" placeholder="Confirm new password" value={_pw2} onChange={function(e){_setPw2(e.target.value);}} required style={_inputStyle}/>
              <button type="submit" style={_primaryBtn}>Set new password</button>
            </form>
            {_msg&&<div style={{color:C.pink,fontSize:13,marginTop:12,textAlign:"left",lineHeight:1.5}}>{_msg}</div>}
          </>
        )}
      </div>
    </div>
  );
}
function WireframesPage({wireframes,setWireframes,onDeleteWireframe,onUpdateWireframe,auditData,personas,onSaveWireframe,onAddRec,onRemoveRec,lovedComponents,onLoveComponent,onUnloveComponent,wireframeRules}:any){
  var [activeId,setActiveId]=useState(wireframes.length>0?wireframes[wireframes.length-1].id:null);
  var [editing,setEditing]=useState(false);
  var [editLabel,setEditLabel]=useState("");
  var [activeRec,setActiveRec]=useState(null);
  var [addedRecs,setAddedRecs]=useState({});
  var [viewport,setViewport]=useState("desktop");
  var [openFolders,setOpenFolders]=useState<{[key:string]:boolean}>(function(){try{var v=localStorage.getItem("gwiWireframeFolders");return v?JSON.parse(v):{};}catch(e){return {};}});
  var [lovedView,setLovedView]=useState(null as {pageUrl:string,label:string}|null);
  var [lcHeights,setLcHeights]=useState({} as {[id:string]:number});
  var [buildPicking,setBuildPicking]=useState(false);
  var [buildPage,setBuildPage]=useState<any>(null);
  var [buildWarning,setBuildWarning]=useState<any>(null);
  var [contentSavedTs,setContentSavedTs]=useState(0);
  var _editSaveRef=useRef<any>({});
  var _priCfg:any={Critical:{bg:"#FFEEF6",text:"#880040",border:"#FF80BB"},High:{bg:C.blueBg,text:C.blueDark,border:C.blueLight},Medium:{bg:C.grey3,text:C.grey8,border:C.grey5},Low:{bg:"#E6F9F2",text:"#005C3B",border:"#80D4B0"}};
  var iframeRef=useRef<HTMLIFrameElement>(null);
  // extractSection: pulls out just the component block for a given recommendation number.
  // Strategy 1 (new wireframes): look for data-section-rec="N" attribute on the container.
  // Strategy 2 (old wireframes): starting from body, recursively descend into whichever child
  //   contains the target badge, stopping when we reach an element that holds THIS badge but
  //   no other badges — that's the exclusive section container.
  function extractSection(html:string,recNum:number){
    try{
      var parser=new DOMParser();
      var d=parser.parseFromString(html,"text/html");
      // Strategy 1: new wireframes have data-section-rec on the container
      var secEl=d.querySelector('[data-section-rec="'+recNum+'"]');
      if(secEl)return(secEl as HTMLElement).outerHTML;
      // Strategy 2: find the badge, then descend from body to find smallest exclusive container
      var badge=d.querySelector('[data-rec="'+recNum+'"]');
      if(!badge)return null;
      function findContainer(el:Element):Element{
        for(var i=0;i<el.children.length;i++){
          var child=el.children[i];
          if(child===badge||child.contains(badge)){
            // Does this child contain only our badge (no sibling badges)?
            var others=Array.from(child.querySelectorAll('[data-rec]')).filter(function(b){return b.getAttribute('data-rec')!==String(recNum);});
            if(others.length===0)return child; // exclusive: this is our section
            return findContainer(child); // has multiple badges: go deeper
          }
        }
        return el; // fallback: return current level
      }
      var container=findContainer(d.body);
      return(container as HTMLElement).outerHTML;
    }catch(e){return null;}
  }
  function extractSharedCss(html:string){var matches=html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)||[];return matches.map(function(m){return m.replace(/<\/?style[^>]*>/gi,"");}).join("\n");}
  function wrapSection(sectionHtml:string,sharedCss:string){return'<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;padding:0;overflow:visible;}body{background:#f5f5f5;font-family:Arial,sans-serif;}[data-rec]{display:none!important;}'+sharedCss+'</style></head><body>'+sectionHtml+'</body></html>';}
  var isMobile=useWidth()<768;
  var active=wireframes.find(function(w){return w.id===activeId;});
  var starredWireframes=wireframes.filter(function(w){return w.starred;});
  var unstarredWireframes=wireframes.filter(function(w){return !w.starred;}).slice().reverse();
  function deleteActive(){var rem=wireframes.filter(function(w){return w.id!==activeId;});setWireframes(rem);if(onDeleteWireframe)onDeleteWireframe(activeId);setActiveId(rem.length>0?rem[rem.length-1].id:null);}
  function download(){if(!active)return;var blob=new Blob([active.html],{type:"text/html"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(active.pageLabel||"wireframe").replace(/\s+/g,"-").toLowerCase()+"-wireframe.html";a.click();}
  function toggleStar(){if(!active)return;var updated=Object.assign({},active,{starred:!active.starred});setWireframes(function(prev){return prev.map(function(w){return w.id===activeId?updated:w;});});if(onUpdateWireframe)onUpdateWireframe(updated);}
  function openEdit(){setEditLabel(active?active.pageLabel:"");setEditing(true);}
  function saveEdit(){if(!active)return;var updated=Object.assign({},active,{pageLabel:editLabel.trim()||active.pageLabel});setWireframes(function(prev){return prev.map(function(w){return w.id===activeId?updated:w;});});if(onUpdateWireframe)onUpdateWireframe(updated);setEditing(false);}
  useEffect(function(){setActiveRec(null);setAddedRecs({});},[activeId]);
  useEffect(function(){setActiveRec(null);},[viewport]);
  useEffect(function(){function onMsg(e){if(e.data&&e.data.type==="rec-click")setActiveRec(e.data.recNum);}window.addEventListener("message",onMsg);return function(){window.removeEventListener("message",onMsg);};},[]);
  useEffect(function(){try{localStorage.setItem("gwiWireframeFolders",JSON.stringify(openFolders));}catch(e){};},[openFolders]);
  useEffect(function(){_editSaveRef.current={wireframes:wireframes,activeId:activeId,onUpdateWireframe:onUpdateWireframe};});
  useEffect(function(){if(contentSavedTs===0)return;var t=setTimeout(function(){setContentSavedTs(0);},2000);return function(){clearTimeout(t);};},[contentSavedTs]);
  useEffect(function(){function onMsg(e:any){if(!e.data||e.data.type!=="wireframe-content-saved")return;var html=e.data.html;var r=_editSaveRef.current;var cur=(r.wireframes||[]).find(function(w:any){return w.id===r.activeId;});if(!cur)return;var updated=Object.assign({},cur,{html:html});setWireframes(function(prev:any[]){return prev.map(function(w:any){return w.id===r.activeId?updated:w;});});if(r.onUpdateWireframe)r.onUpdateWireframe(updated);setContentSavedTs(Date.now());}window.addEventListener("message",onMsg);return function(){window.removeEventListener("message",onMsg);};},[]);
  function injectRecScript(html:string,actions?:any[]):string{
    if(!html)return"";
    // ── Cleanup: strip any previously-injected or corrupted content ───────────
    html=html.replace(/<style\s[^>]*data-injected[^>]*>[\s\S]*?<\/style>/gi,"");
    html=html.replace(/<script\s[^>]*data-injected[^>]*>[\s\S]*?<\/script>/gi,"");
    var leakIdx=html.indexOf("[data-rec]{white-space");
    if(leakIdx>=0){var nt=html.indexOf("<",leakIdx);html=html.slice(0,leakIdx)+(nt>=0?html.slice(nt):"");}
    var leakIdx2=html.indexOf("[data-eh]{outline:1px dashed");
    if(leakIdx2>=0){var nt2=html.indexOf("<",leakIdx2);html=html.slice(0,leakIdx2)+(nt2>=0?html.slice(nt2):"");}
    // ── Content strings ───────────────────────────────────────────────────────
    var recCss='[data-rec]{white-space:nowrap;transition:background 0.15s ease;}[data-rec] .rec-label{max-width:0;overflow:hidden;transition:max-width 0.25s ease,margin-right 0.25s ease;font-size:11px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:white;margin-right:0;display:inline-block;white-space:nowrap;}[data-rec]:hover .rec-label{max-width:130px;margin-right:6px;}';
    var editCss='[data-eh]{outline:1px dashed rgba(0,0,0,0.22)!important;cursor:text!important;}[contenteditable="true"]{outline:1.5px solid #FF0077!important;border-radius:2px;}';
    var recJs='document.addEventListener("click",function(e){var el=e.target;for(var i=0;i<8;i++){if(!el||el===document.body)break;var r=el.getAttribute("data-rec");if(r){window.parent.postMessage({type:"rec-click",recNum:parseInt(r)},"*");return;}el=el.parentElement;}});window.addEventListener("message",function(e){if(e.data&&e.data.type==="set-rec-states"){var g=e.data.greenRecs||[];document.querySelectorAll("[data-rec]").forEach(function(b){var n=parseInt(b.getAttribute("data-rec"));b.style.background=g.indexOf(n)>=0?"#22C55E":"#FF0077";});}});function initBadges(){document.querySelectorAll("[data-rec]").forEach(function(b){var label=document.createElement("span");label.className="rec-label";label.textContent="Recommendation";var s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("width","14");s.setAttribute("height","14");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("fill","none");s.setAttribute("stroke","white");s.setAttribute("stroke-width","2.5");s.setAttribute("stroke-linecap","round");s.setAttribute("stroke-linejoin","round");var p1=document.createElementNS("http://www.w3.org/2000/svg","path");p1.setAttribute("d","M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5");s.appendChild(p1);var p2=document.createElementNS("http://www.w3.org/2000/svg","path");p2.setAttribute("d","M9 18h6");s.appendChild(p2);var p3=document.createElementNS("http://www.w3.org/2000/svg","path");p3.setAttribute("d","M10 22h4");s.appendChild(p3);b.innerHTML="";b.appendChild(label);b.appendChild(s);b.style.display="inline-flex";b.style.alignItems="center";b.style.justifyContent="flex-end";b.style.padding="0 7px";b.style.height="28px";b.style.width="";b.style.borderRadius="6px";})}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",initBadges);}else{initBadges();}';
    var editJs='(function(){if(window.__ei)return;window.__ei=1;var T=["H1","H2","H3","H4","H5","H6","P","A","BUTTON","LABEL","SPAN","STRONG","EM","LI","TD","TH"];var ed=null,or=null;function ge(el){while(el&&el!==document.body){if(T.indexOf(el.tagName)>=0&&!el.closest("[data-rec]"))return el;el=el.parentElement;}return null;}document.addEventListener("mouseover",function(e){var el=ge(e.target);if(el&&el!==ed)el.setAttribute("data-eh","1");});document.addEventListener("mouseout",function(e){var el=ge(e.target);if(el&&el!==ed)el.removeAttribute("data-eh");});document.addEventListener("dblclick",function(e){var el=ge(e.target);if(!el)return;e.preventDefault();e.stopPropagation();if(ed&&ed!==el){ed.contentEditable="false";ed=null;}el.removeAttribute("data-eh");or=el.innerHTML;el.contentEditable="true";el.focus();ed=el;},true);document.addEventListener("keydown",function(e){if(!ed)return;if(e.key==="Escape"){ed.innerHTML=or;ed.contentEditable="false";ed.removeAttribute("data-eh");ed=null;e.preventDefault();}if(e.key==="Enter"&&!e.shiftKey&&["H1","H2","H3","H4","H5","H6","BUTTON","LABEL"].indexOf(ed.tagName)>=0){ed.blur();e.preventDefault();}});document.addEventListener("paste",function(e){if(!ed)return;e.preventDefault();var t=(e.clipboardData||window.clipboardData).getData("text/plain");document.execCommand("insertText",false,t);});document.addEventListener("focusout",function(e){if(ed&&e.target===ed){ed.contentEditable="false";ed.removeAttribute("data-eh");ed=null;sv();}});function sv(){var inj=Array.from(document.querySelectorAll("[data-injected=\\"1\\"]"));inj.forEach(function(el){el.parentNode&&el.parentNode.removeChild(el);});document.querySelectorAll("[data-eh]").forEach(function(el){el.removeAttribute("data-eh");});document.querySelectorAll("[contenteditable]").forEach(function(el){el.removeAttribute("contenteditable");});var h="<!DOCTYPE html>"+document.documentElement.outerHTML;inj.forEach(function(el){try{document.body.appendChild(el);}catch(x){}});window.parent.postMessage({type:"wireframe-content-saved",html:h},"*");}})();';
    // ── Inject via DOMParser — immune to malformed HTML, unclosed tags, case issues ──
    try{
      var parser=new DOMParser();
      var doc=parser.parseFromString(html,'text/html');
      // Remove any stale injected nodes the parser may have preserved
      Array.from(doc.querySelectorAll('[data-injected="1"]')).forEach(function(el){el.parentNode&&el.parentNode.removeChild(el);});
      // Styles → <head>
      var s1=doc.createElement('style');s1.setAttribute('data-injected','1');s1.textContent=recCss;doc.head.appendChild(s1);
      var s2=doc.createElement('style');s2.setAttribute('data-injected','1');s2.textContent=editCss;doc.head.appendChild(s2);
      // Footer responsive CSS → <head>
      var s3=doc.createElement('style');s3.setAttribute('data-injected','1');
      s3.textContent='@media(max-width:767px){.gwi-fc{grid-template-columns:1fr 1fr!important;}.gwi-fb{flex-direction:column!important;gap:16px!important;}}';
      doc.head.appendChild(s3);
      // ── Standard GWI footer — injected if absent, persists when wireframe is saved ──
      if(!doc.querySelector('[data-gwi-footer]')){
        var yr=new Date().getFullYear();
        var col=function(title:string,items:string[]){return'<div><div style="font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">'+title+'</div><ul style="list-style:none;margin:0;padding:0;">'+items.map(function(t){return'<li style="margin-bottom:8px"><a href="#" style="color:#999;font-size:13px;text-decoration:none;">'+t+'</a></li>';}).join('')+'</ul></div>';};
        var footerEl=doc.createElement('footer');
        footerEl.setAttribute('data-gwi-footer','1');
        footerEl.style.cssText='background:#2a2a2a;color:#ccc;padding:56px 0 0;font-family:Arial,sans-serif;margin-top:0;';
        footerEl.innerHTML=
          '<div style="max-width:1200px;margin:0 auto;padding:0 40px;">'
          +'<div style="margin-bottom:40px;"><div style="background:#444;display:inline-block;padding:8px 20px;border-radius:4px;font-size:18px;font-weight:700;color:#fff;letter-spacing:0.05em;">GWI</div></div>'
          +'<div class="gwi-fc" style="display:grid;grid-template-columns:repeat(5,1fr);gap:32px;margin-bottom:48px;">'
          +col('Products',['Human insights platform','Agent Spark: Human insights analyst','Learn about our data','Pricing'])
          +col('Solutions &amp; Integrations',['RLD','Audience activation','Data partnerships','Become a GWI partner'])
          +col('Resources',['Blog','Reports','Help center'])
          +col('Company',['Our story','Careers','Press','Contact','Trust center'])
          +col('Legal stuff',['Website terms and conditions','Website privacy policy','Website cookie policy','Modern slavery statement','See all'])
          +'</div>'
          +'<div class="gwi-fb" style="border-top:1px solid #444;padding:20px 0;display:flex;align-items:center;justify-content:space-between;">'
          +'<div style="font-size:12px;color:#666;">© '+yr+' GWI. All rights reserved.</div>'
          +'<div style="display:flex;gap:10px;">'
          +['in','𝕏','ig','yt'].map(function(lbl){return'<div style="width:30px;height:30px;background:#444;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;"><span style="color:#999;font-size:11px;">'+lbl+'</span></div>';}).join('')
          +'</div></div></div>';
        doc.body.appendChild(footerEl);
      }
      // ── Guarantee every recommendation has a section — inject missing ones ──
      if(actions&&actions.length){
        var presentRecs=new Set(Array.from(doc.querySelectorAll('[data-rec]')).map(function(el){return parseInt(el.getAttribute('data-rec')||'0');}).filter(function(n){return n>0;}));
        var footerNode=doc.querySelector('[data-gwi-footer]');
        actions.forEach(function(action:any,idx:number){
          var num=idx+1;
          if(presentRecs.has(num))return;
          var rawTitle=action.text||('Recommendation '+num);
          var title=rawTitle.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          var isEven=idx%2===0;
          var bg=isEven?'#f4f4f6':'#eeeef2';
          var imgBlock='<div style="background:#ddd;border-radius:8px;height:260px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:13px;font-weight:600;font-family:Arial,sans-serif;">Image / Mockup</div>';
          var textBlock='<div style="position:relative;"><span data-rec="'+num+'" style="position:absolute;top:0;right:0;background:#FF0077;color:#fff;display:inline-flex;align-items:center;padding:0 10px;height:28px;border-radius:6px;font-size:11px;font-weight:700;font-family:Arial,sans-serif;cursor:pointer;">💡</span><div style="font-size:10px;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">// REC '+num+': RECOMMENDATION</div><h2 style="font-size:22px;font-weight:800;color:#1a1a1a;margin:0 0 14px;line-height:1.35;padding-right:48px;">'+title+'</h2><p style="font-size:14px;color:#666;line-height:1.75;margin:0 0 22px;">Implementing this recommendation will improve the user experience and address the identified UX friction on this page.</p><div style="display:flex;gap:10px;"><a href="#" style="background:#FF0077;color:#fff;padding:11px 22px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;display:inline-block;">Apply change</a><a href="#" style="background:transparent;color:#FF0077;padding:11px 22px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;border:2px solid #FF0077;display:inline-block;">Learn more</a></div></div>';
          var secEl=doc.createElement('section');
          secEl.setAttribute('data-section-rec',String(num));
          secEl.style.cssText='background:'+bg+';padding:60px 0;font-family:Arial,sans-serif;';
          secEl.innerHTML='<div style="max-width:1200px;margin:0 auto;padding:0 40px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">'+(isEven?imgBlock+textBlock:textBlock+imgBlock)+'</div></div>';
          if(footerNode){doc.body.insertBefore(secEl,footerNode);}else{doc.body.appendChild(secEl);}
        });
      }
      // Scripts → end of <body> (after footer)
      var sc1=doc.createElement('script');sc1.setAttribute('data-injected','1');sc1.textContent=recJs;doc.body.appendChild(sc1);
      var sc2=doc.createElement('script');sc2.setAttribute('data-injected','1');sc2.textContent=editJs;doc.body.appendChild(sc2);
      return'<!DOCTYPE html>'+doc.documentElement.outerHTML;
    }catch(err){
      // Fallback: case-insensitive string injection
      var style='<style data-injected="1">'+recCss+'<\/style>';
      var editStyle='<style data-injected="1">'+editCss+'<\/style>';
      var script='<script data-injected="1">'+recJs+'<\/script>';
      var editScript='<script data-injected="1">'+editJs+'<\/script>';
      var lc=html.toLowerCase();
      var headIdx=lc.lastIndexOf("</head>");
      var bodyIdx=lc.lastIndexOf("</body>");
      if(headIdx>=0&&bodyIdx>=0)return html.slice(0,headIdx)+style+editStyle+html.slice(headIdx,bodyIdx)+script+editScript+html.slice(bodyIdx);
      if(bodyIdx>=0)return html.slice(0,bodyIdx)+style+editStyle+script+editScript+html.slice(bodyIdx);
      if(headIdx>=0)return html.slice(0,headIdx)+style+editStyle+html.slice(headIdx)+script+editScript;
      return html+style+editStyle+script+editScript;
    }
  }
  var _ap=active&&auditData?auditData.find(function(p){return p.url===active.pageUrl;}):null;
  // Prefer current audit data (always up-to-date) over what was snapshotted at wireframe build time
  var activeActions=(_ap&&_ap.actions&&_ap.actions.length)?_ap.actions:(active&&active.actions&&active.actions.length?active.actions:[]);
  var activeRecAction=activeRec!==null?activeActions[activeRec-1]||null:null;
  var _auditActionIds=((_ap&&_ap.actions)||[]).map(function(a:any){return a.id;});
  var greenRecs=(function(){var result:number[]=[];for(var n=1;n<=20;n++){var rk=(active?active.id:"")+"-"+n;var sid=(addedRecs as any)[rk];var pre=(activeActions as any[])[n-1];if((sid&&_auditActionIds.indexOf(sid)>=0)||(pre&&pre.id&&_auditActionIds.indexOf(pre.id)>=0)){result.push(n);}}return result;})();
  var greenRecsStr=greenRecs.join(",");
  useEffect(function(){if(iframeRef.current&&iframeRef.current.contentWindow){iframeRef.current.contentWindow.postMessage({type:"set-rec-states",greenRecs:greenRecs},"*");}},[greenRecsStr,activeId]);
  var _buildInfoModal=buildWarning&&(<div onClick={function(){setBuildWarning(null);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200}}><div onClick={function(e){e.stopPropagation();}} style={{background:C.white,borderRadius:16,padding:"28px 32px",maxWidth:480,width:"calc(100% - 48px)",boxShadow:"0 8px 48px rgba(0,0,0,0.3)"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><span style={{background:"#FFEEF6",width:34,height:34,borderRadius:10,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.pink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span><h2 style={{fontSize:17,fontWeight:800,color:C.black,margin:0}}>Wireframes use your Recommendations</h2></div><p style={{fontSize:14,color:C.grey7,lineHeight:1.75,margin:"0 0 12px"}}>Wireframes are generated from the action items in your <strong style={{color:C.offBlack}}>Recommendations</strong> section for this page.</p><p style={{fontSize:14,color:C.grey7,lineHeight:1.75,margin:"0 0 24px"}}>Make sure you've added items before building — either by adding them manually from the <strong style={{color:C.offBlack}}>Audit</strong> tab, or by importing them from a <strong style={{color:C.offBlack}}>Generated Audit</strong>.</p><div style={{display:"flex",gap:10}}><button onClick={function(){setBuildWarning(null);}} style={{flex:1,background:C.grey3,color:C.grey8,border:"none",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button><button autoFocus onClick={function(){setBuildPage(buildWarning);setBuildWarning(null);}} style={{flex:2,background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Build wireframe</button></div></div></div>);
  if(wireframes.length===0){return(<>{_buildInfoModal}{buildPage&&<WireframeModal page={buildPage} personas={personas||[]} rules={wireframeRules} onClose={function(){setBuildPage(null);}} onSave={function(wf){if(onSaveWireframe)onSaveWireframe(wf);}}/>}<div style={{background:C.grey2,height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",padding:32,maxWidth:400}}><div style={{marginBottom:16,color:C.grey6,display:"flex",justifyContent:"center"}}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><h2 style={{fontSize:20,fontWeight:800,color:C.black,marginBottom:8}}>No saved wireframes yet</h2><p style={{fontSize:14,color:C.grey7,marginBottom:20,lineHeight:1.6}}>Pick a recommendation page and build your first wireframe.</p><button onClick={function(){setBuildPicking(function(p:boolean){return !p;});}} style={{background:buildPicking?C.grey4:C.pink,color:buildPicking?C.grey8:C.white,border:"none",borderRadius:8,padding:"11px 24px",fontSize:13,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>Build wireframe</button>{buildPicking&&<div style={{marginTop:12,background:C.white,border:"1px solid "+C.grey4,borderRadius:10,overflow:"hidden",textAlign:"left",maxHeight:220,overflowY:"auto"}}>{(auditData||[]).length===0?<div style={{fontSize:12,color:C.grey6,padding:"14px 16px",fontStyle:"italic"}}>No recommendation pages yet</div>:(auditData||[]).map(function(page:any){return(<button key={page.id} onClick={function(){setBuildWarning(page);setBuildPicking(false);}} style={{width:"100%",textAlign:"left",padding:"10px 14px",border:"none",borderBottom:"1px solid "+C.grey3,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center"}} onMouseEnter={function(e){e.currentTarget.style.background=C.grey3;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span style={{fontSize:12,fontWeight:600,color:C.offBlack}}>{page.label}</span></button>);})}</div>}</div></div></>,);}
  return(
    <>{_buildInfoModal}{buildPage&&<WireframeModal page={buildPage} personas={personas||[]} rules={wireframeRules} onClose={function(){setBuildPage(null);}} onSave={function(wf){if(onSaveWireframe)onSaveWireframe(wf);setActiveId(wf.id);setOpenFolders(function(prev){var n=Object.assign({},prev);n[wf.pageUrl]=true;return n;});}}/>}
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",flex:1,minHeight:0,background:C.grey2}}>
      <div style={{width:isMobile?"100%":220,background:C.white,borderRight:"1px solid "+C.grey4,flexShrink:0,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <div style={{padding:"14px 16px",fontSize:11,fontWeight:700,color:C.grey7,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:"1px solid "+C.grey4}}>Wireframes</div>
        <div style={{padding:"10px 12px",borderBottom:"1px solid "+C.grey4}}>
          <button onClick={function(){setBuildPicking(function(p:boolean){return !p;});}} style={{width:"100%",background:buildPicking?C.grey4:C.pink,color:buildPicking?C.grey8:C.white,border:"none",borderRadius:8,padding:"9px 12px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>Build wireframe</button>
        </div>
        {buildPicking&&<div style={{borderBottom:"1px solid "+C.grey4,background:C.white,maxHeight:260,overflowY:"auto"}}>{(auditData||[]).length===0?<div style={{fontSize:12,color:C.grey6,textAlign:"center",padding:"14px 0",fontStyle:"italic"}}>No recommendation pages yet</div>:(auditData||[]).map(function(page:any,i:number,arr:any[]){return(<button key={page.id} onClick={function(){setBuildWarning(page);setBuildPicking(false);}} style={{width:"100%",textAlign:"left",padding:"9px 14px",border:"none",borderBottom:i<arr.length-1?"1px solid "+C.grey3:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center"}} onMouseEnter={function(e){e.currentTarget.style.background=C.grey2;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span style={{fontSize:12,fontWeight:600,color:C.offBlack,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{page.label}</span></button>);})}</div>}
        {(function(){
          var knownUrls=(auditData||[]).map(function(p:any){return p.url;});
          var folders=(auditData||[]).map(function(page:any){
            var pw=wireframes.filter(function(w){return w.pageUrl===page.url;});
            if(pw.length===0)return null;
            return {url:page.url,label:page.label,wires:pw};
          }).filter(Boolean) as {url:string,label:string,wires:any[]}[];
          var orphans=wireframes.filter(function(w){return !knownUrls.includes(w.pageUrl);});
          if(orphans.length>0)folders.push({url:"__other__",label:"Other",wires:orphans});
          if(folders.length===0)return <div style={{padding:"20px 16px",fontSize:12,color:C.grey6,fontStyle:"italic"}}>No wireframes yet</div>;
          return folders.map(function(folder){
            var isOpen=openFolders[folder.url]===true;
            var starred=folder.wires.filter(function(w){return w.starred;});
            var unstarred=folder.wires.filter(function(w){return !w.starred;}).slice().reverse();
            var ordered=starred.concat(unstarred);
            var FolderIcon=isOpen?FolderOpen:Folder;
            return(
              <div key={folder.url} style={{borderBottom:"1px solid "+C.grey4}}>
                <button onClick={function(){setOpenFolders(function(prev){var n=Object.assign({},prev);n[folder.url]=!isOpen;return n;});}} style={{width:"100%",textAlign:"left",padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
                  <ChevronRight size={11} color={C.grey5} style={{flexShrink:0,transform:isOpen?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.15s"}}/>
                  <FolderIcon size={13} color={isOpen?C.pink:C.grey6} style={{flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:700,color:C.offBlack,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{folder.label}</span>
                  <span style={{fontSize:10,fontWeight:600,color:C.grey6,background:C.grey3,borderRadius:99,padding:"1px 6px",flexShrink:0}}>{folder.wires.length}</span>
                </button>
                {isOpen&&(function(){
                  var hasStarred=starred.length>0;
                  var hasDrafts=unstarred.length>0;
                  var pl=(lovedComponents||[]).filter(function(lc:any){return lc.pageUrl===folder.url;});
                  return(<>
                    {hasDrafts&&<div style={{padding:"4px 14px 2px",fontSize:9,fontWeight:700,color:C.grey6,textTransform:"uppercase",letterSpacing:"0.07em",background:C.grey3,borderTop:"1px solid "+C.grey4}}>Drafts</div>}
                    {unstarred.map(function(w){var isActive=w.id===activeId;return(<div key={w.id} style={{background:isActive?"#FFF0F7":"transparent"}}><button onClick={function(){setActiveId(w.id);setLovedView(null);setEditing(false);}} style={{width:"100%",textAlign:"left",padding:"8px 14px 8px 34px",border:"none",borderLeft:"3px solid "+(isActive?C.pink:"transparent"),background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:isActive?C.black:C.grey8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.pageLabel}</div><div style={{fontSize:10,color:C.grey6,marginTop:1}}>{w.date}</div></div></button></div>);})}
                    {hasStarred&&<div style={{padding:"4px 14px 2px",fontSize:9,fontWeight:700,color:C.grey6,textTransform:"uppercase",letterSpacing:"0.07em",background:C.grey3,borderTop:"1px solid "+C.grey4}}>Starred</div>}
                    {starred.map(function(w){var isActive=w.id===activeId;return(<div key={w.id} style={{background:isActive?"#FFF0F7":"transparent"}}><button onClick={function(){setActiveId(w.id);setLovedView(null);setEditing(false);}} style={{width:"100%",textAlign:"left",padding:"8px 14px 8px 34px",border:"none",borderLeft:"3px solid "+(isActive?C.pink:"transparent"),background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Star size={10} fill="#FFC107" color="#FFC107" style={{flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:isActive?C.black:C.grey8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.pageLabel}</div><div style={{fontSize:10,color:C.grey6,marginTop:1}}>{w.date}</div></div></button></div>);})}
                    {pl.length>0&&<div style={{padding:"4px 14px 2px",fontSize:9,fontWeight:700,color:C.grey6,textTransform:"uppercase",letterSpacing:"0.07em",background:C.grey3,borderTop:"1px solid "+C.grey4}}>Loved</div>}
                    {pl.length>0&&(function(){var isLV=lovedView&&lovedView.pageUrl===folder.url;return(<div style={{background:isLV?"#FFF0F7":"transparent"}}><button onClick={function(){setLovedView({pageUrl:folder.url,label:folder.label});setActiveId(null as any);setEditing(false);}} style={{width:"100%",textAlign:"left",padding:"8px 14px 8px 34px",border:"none",borderLeft:"3px solid "+(isLV?C.pink:"transparent"),background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Heart size={10} fill={C.pink} color={C.pink} style={{flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:isLV?C.black:C.grey8}}>Loved components</div><div style={{fontSize:10,color:C.grey6,marginTop:1}}>{pl.length} saved</div></div></button></div>);}())}
                  </>);
                })()}
              </div>
            );
          });
        })()}
      </div>
      {lovedView?(
        <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,background:C.grey2,overflow:"hidden"}}>
          <div style={{padding:isMobile?"16px 16px 0":"28px 28px 0",flexShrink:0}}>
            <div style={{background:C.black,borderRadius:16,padding:isMobile?"20px":"24px 28px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,display:"flex",alignItems:"center",gap:5}}><Heart size={11} fill={C.pink} color={C.pink}/>Loved Components</div>
                <h2 style={{color:C.white,fontSize:22,fontWeight:800,margin:"0 0 4px"}}>{lovedView.label}</h2>
                <p style={{color:C.grey6,fontSize:13,margin:0}}>{(lovedComponents||[]).filter(function(lc:any){return lc.pageUrl===lovedView.pageUrl;}).length} saved component{(lovedComponents||[]).filter(function(lc:any){return lc.pageUrl===lovedView.pageUrl;}).length!==1?"s":""}</p>
              </div>
            </div>
          </div>
          <div style={{flex:1,padding:isMobile?"16px":"24px 28px 28px",overflow:"auto",display:"flex",flexDirection:"column",gap:20}}>
            {(lovedComponents||[]).filter(function(lc:any){return lc.pageUrl===lovedView.pageUrl;}).map(function(lc:any){
              return(
                <div key={lc.id} style={{background:C.white,borderRadius:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",flexShrink:0}}>
                  <div style={{padding:"18px 24px",borderBottom:"1px solid "+C.grey4,display:"flex",alignItems:"flex-start",gap:12}}>
                    <span style={{background:"#FFF0F7",color:C.pink,width:28,height:28,borderRadius:7,flexShrink:0,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><Heart size={13} fill={C.pink}/></span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:800,color:C.black,marginBottom:4,lineHeight:1.4}}>{lc.title||"Recommendation #"+lc.recNum}</div>
                      <div style={{fontSize:11,color:C.grey6}}>{lc.date} · from {lc.pageLabel} wireframe</div>
                    </div>
                    <button onClick={function(){if(onUnloveComponent)onUnloveComponent(lc.id);}} title="Remove" style={{background:"none",border:"none",cursor:"pointer",color:C.grey5,padding:4,borderRadius:6,display:"flex",alignItems:"center",flexShrink:0}} onMouseEnter={function(e){e.currentTarget.style.color="#CC0000";}} onMouseLeave={function(e){e.currentTarget.style.color=C.grey5;}}><Trash2 size={14}/></button>
                  </div>
                  {(lc.change||lc.why||lc.shows)&&(
                    <div style={{padding:"14px 24px",borderBottom:"1px solid "+C.grey4,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10}}>
                      {[{label:"Change",value:lc.change,labelColor:C.pink},{label:"Why it matters",value:lc.why,labelColor:C.grey8},{label:"Data",value:lc.shows,labelColor:C.grey8}].filter(function(col){return!!col.value;}).map(function(col){return(
                        <div key={col.label} style={{background:C.grey2,borderRadius:8,padding:"10px 12px"}}>
                          <div style={{fontSize:10,fontWeight:700,color:col.labelColor,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{col.label}</div>
                          <div style={{fontSize:12,color:C.grey8,lineHeight:1.6}}>{col.value}</div>
                        </div>
                      );})}
                    </div>
                  )}
                  {(function(){
                    // Extract JUST the component block and render it standalone at natural height.
                    // extractSection uses data-section-rec (new wires) or the exclusive-container
                    // algorithm (old wires) to find the smallest element that contains only this badge.
                    var wire=wireframes.find(function(w:any){return w.id===lc.wireframeId;});
                    var sectionHtml=wire?extractSection(wire.html,lc.recNum):(lc.sectionHtml||null);
                    var css=wire?extractSharedCss(wire.html):(lc.sharedCss||"");
                    if(!sectionHtml)return <div style={{padding:"16px 24px",color:C.grey6,fontSize:12,fontStyle:"italic"}}>No preview available</div>;
                    return(
                      <iframe
                        srcDoc={wrapSection(sectionHtml,css)}
                        title={lc.title}
                        sandbox="allow-same-origin allow-scripts"
                        style={{width:"100%",border:"none",height:(lcHeights[lc.id]||400)+"px",display:"block"}}
                        onLoad={function(e){
                          var f=e.currentTarget as HTMLIFrameElement;
                          var id=lc.id;
                          try{
                            var doc=f.contentDocument;
                            if(!doc)return;
                            var sh=Math.max(doc.documentElement.scrollHeight||0,doc.body.scrollHeight||0,doc.documentElement.offsetHeight||0,doc.body.offsetHeight||0)||400;
                            setLcHeights(function(prev){var n=Object.assign({},prev);n[id]=Math.max(200,sh);return n;});
                          }catch(ex){}
                        }}
                      />
                    );
                  })()}

                </div>
              );
            })}
          </div>
        </div>
      ):active&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,background:C.grey2,overflow:"hidden",position:"relative"}}>
          <div style={{padding:isMobile?"16px 16px 0":"28px 28px 0",flexShrink:0}}>
            <div style={{background:C.black,borderRadius:16,padding:isMobile?"20px":"24px 28px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Saved Wireframe</div>
                {editing?(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <input value={editLabel} onChange={function(e){setEditLabel(e.target.value);}} placeholder="Wireframe name" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"8px 12px",fontSize:16,fontWeight:700,color:C.white,outline:"none",width:"100%",boxSizing:"border-box" as const}}/>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={saveEdit} style={{background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button>
                      <button onClick={function(){setEditing(false);}} style={{background:"rgba(255,255,255,0.1)",color:C.grey4,border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    </div>
                  </div>
                ):(
                  <>
                    <h2 style={{color:C.white,fontSize:22,fontWeight:800,margin:"0 0 4px"}}>{active.pageLabel}</h2>
                    <p style={{color:C.grey6,fontSize:13,margin:0}}>{active.date} · wireframe</p>
                  </>
                )}
              </div>
              {!editing&&(
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,paddingTop:2}}>
                  <div style={{display:"inline-flex",background:"rgba(255,255,255,0.08)",borderRadius:10,padding:3,position:"relative"}}>
                    <div style={{position:"absolute",top:3,left:viewport==="desktop"?3:"calc(50% + 1.5px)",width:"calc(50% - 4.5px)",height:"calc(100% - 6px)",background:"rgba(255,255,255,0.18)",borderRadius:7,boxShadow:"0 1px 4px rgba(0,0,0,0.25)",transition:"left 0.2s cubic-bezier(0.4,0,0.2,1)",pointerEvents:"none"}}/>
                    <button onClick={function(){setViewport("desktop");}} title="Desktop view" style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,border:"none",background:"transparent",cursor:"pointer",color:viewport==="desktop"?C.white:C.grey5,borderRadius:7,transition:"color 0.15s"}}><Monitor size={13}/></button>
                    <button onClick={function(){setViewport("mobile");}} title="Mobile view" style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,border:"none",background:"transparent",cursor:"pointer",color:viewport==="mobile"?C.white:C.grey5,borderRadius:7,transition:"color 0.15s"}}><Smartphone size={13}/></button>
                  </div>

                  {contentSavedTs>0&&<span style={{fontSize:11,fontWeight:700,color:"#22C55E",background:"rgba(34,197,94,0.15)",borderRadius:99,padding:"3px 10px",flexShrink:0,transition:"opacity 0.3s"}}>✓ Saved</span>}
                  <button onClick={toggleStar} title={active.starred?"Remove from starred":"Add to starred"} style={{background:active.starred?"rgba(255,193,7,0.15)":"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:active.starred?"#FFC107":C.grey4}}><Star size={15} fill={active.starred?"#FFC107":"none"}/></button>
                  <button onClick={openEdit} title="Rename" style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.grey4}}><Pencil size={15}/></button>
                  <button onClick={download} title="Download HTML" style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.grey4}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
                  <button onClick={deleteActive} title="Delete wireframe" style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#FF6B6B"}}><Trash2 size={15}/></button>
                </div>
              )}
            </div>
            </div>
          </div>
          <div style={{flex:1,padding:isMobile?"16px":"24px 28px 28px",minHeight:0,display:"flex",flexDirection:"column",alignItems:viewport==="mobile"?"center":"stretch"}}>
            <iframe ref={iframeRef} srcDoc={injectRecScript(active.html,activeActions)} title="Wireframe" sandbox="allow-same-origin allow-scripts" onLoad={function(){if(iframeRef.current&&iframeRef.current.contentWindow){iframeRef.current.contentWindow.postMessage({type:"set-rec-states",greenRecs:greenRecs},"*");}}} style={viewport==="mobile"?{flex:1,width:390,maxWidth:"calc(100% - 32px)",border:"none",borderRadius:12,background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}:{flex:1,border:"none",borderRadius:12,background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}/>
          </div>
          {activeRec!==null&&(
            <div onClick={function(){setActiveRec(null);}} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20}}>
              <div onClick={function(e){e.stopPropagation();}} style={{background:C.white,borderRadius:16,padding:"28px 32px",maxWidth:520,width:"calc(100% - 48px)",boxShadow:"0 8px 48px rgba(0,0,0,0.3)"}}>
                {(function(){
                  var recKey=(active?active.id:"")+"-"+activeRec;
                  var sessionActionId=(addedRecs as any)[recKey];
                  var isGreen=greenRecs.indexOf(activeRec as number)>=0;
                  var badgeColor=isGreen?"#22C55E":C.pink;
                  var actionIdForRemove=sessionActionId||(activeRecAction&&activeRecAction.id&&_auditActionIds.indexOf(activeRecAction.id)>=0?activeRecAction.id:null);
                  var actionToAdd=activeRecAction||{id:"",text:"Recommendation #"+activeRec+(active?" — "+active.pageLabel:""),description:"",shows:"",why:"",change:"",metric:"",status:"todo",source:"",before:"",beforeDate:"",after:"",afterDate:"",effort:""};
                  return(<>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                      <span style={{background:badgeColor,color:C.white,width:30,height:30,borderRadius:8,flexShrink:0,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><Lightbulb size={14} strokeWidth={2.5}/></span>
                      <button onClick={function(){setActiveRec(null);}} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:C.grey6,fontSize:24,lineHeight:1,padding:"0 0 2px",display:"flex",alignItems:"center"}}>×</button>
                    </div>
                    {activeRecAction&&activeRecAction.text&&(
                      <p style={{fontSize:15,fontWeight:800,color:C.black,margin:"0 0 16px",lineHeight:1.45}}>{activeRecAction.text}</p>
                    )}
                    {activeRecAction&&(activeRecAction.change||activeRecAction.why||activeRecAction.shows)&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
                        {[
                          {label:"Change",value:activeRecAction.change,labelColor:C.pink,textColor:C.offBlack},
                          {label:"Why it matters",value:activeRecAction.why,labelColor:C.grey8,textColor:C.grey8},
                          {label:"Data",value:activeRecAction.shows,labelColor:C.grey8,textColor:C.grey8},
                        ].map(function(col){return col.value?(
                          <div key={col.label} style={{background:C.grey2,borderRadius:8,padding:"10px 12px"}}>
                            <div style={{fontSize:10,fontWeight:700,color:col.labelColor,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{col.label}</div>
                            <div style={{fontSize:12,color:col.textColor,lineHeight:1.6}}>{col.value}</div>
                          </div>
                        ):null;})}
                      </div>
                    )}
                    {(function(){var lcId=(active?active.id:"")+"-rec-"+activeRec;var isLoved=(lovedComponents||[]).some(function(lc:any){return lc.id===lcId;});var sHtml=active?extractSection(active.html,activeRec as number):null;return(<button onClick={function(){if(isLoved){if(onUnloveComponent)onUnloveComponent(lcId);}else{if(!onLoveComponent||!sHtml)return;onLoveComponent({id:lcId,wireframeId:active.id,pageUrl:active.pageUrl,pageLabel:active.pageLabel,recNum:activeRec,title:activeRecAction?activeRecAction.text:"Recommendation #"+activeRec,change:activeRecAction?activeRecAction.change||"":"",why:activeRecAction?activeRecAction.why||"":"",shows:activeRecAction?activeRecAction.shows||"":"",sectionHtml:sHtml,sharedCss:extractSharedCss(active.html),date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})});}}} style={{width:"100%",background:isLoved?"#FFF0F7":C.grey2,color:isLoved?C.pink:C.grey7,border:"1px solid "+(isLoved?C.pink:C.grey4),borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:sHtml||isLoved?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10,opacity:sHtml||isLoved?1:0.5}}><Heart size={14} fill={isLoved?C.pink:"none"} color={isLoved?C.pink:C.grey7}/>{isLoved?"Saved to Loved components":"Save to Loved components"}</button>);})()}
                    {isGreen?(
                      <button onClick={function(){if(onRemoveRec&&actionIdForRemove){onRemoveRec(actionIdForRemove,active?active.pageUrl:"/");var _upd2=(activeActions as any[]).slice();if(_upd2[(activeRec as number)-1])_upd2[(activeRec as number)-1]=Object.assign({},_upd2[(activeRec as number)-1],{id:""});var _updWf2=Object.assign({},active,{actions:_upd2});setWireframes(function(prev){return prev.map(function(w){return w.id===active.id?_updWf2:w;});});if(onUpdateWireframe)onUpdateWireframe(_updWf2);setAddedRecs(function(prev){var n=Object.assign({},prev);delete n[recKey];return n;});}}} style={{width:"100%",background:"#E6F9F2",color:"#005C3B",border:"1px solid #A7F3D0",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                        Remove from Recommendations
                      </button>
                    ):(
                      <button onClick={function(){if(onAddRec){var newId="a-"+Date.now()+"-"+activeRec;var finalAction=Object.assign({},actionToAdd,{id:newId});onAddRec(finalAction,active?active.pageUrl:"/");var _upd=(activeActions as any[]).slice();_upd[(activeRec as number)-1]=finalAction;var _updWf=Object.assign({},active,{actions:_upd});setWireframes(function(prev){return prev.map(function(w){return w.id===active.id?_updWf:w;});});if(onUpdateWireframe)onUpdateWireframe(_updWf);setAddedRecs(function(prev){var n=Object.assign({},prev);n[recKey]=newId;return n;});}}} style={{width:"100%",background:C.pink,color:C.white,border:"none",borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                        Add to Recommendations
                      </button>
                    )}
                  </>);
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </>
  );
}

export default function App(){

  var VALID_VIEWS=["dashboard","audit","generated-audits","summary","personas","persona-detail","mapping","journey","lifecycle","affinity","flows","analytics","settings","wireframes","feedback","guide"];
  function hashToView(h){var v=(h||"").replace(/^#\//,"").split("/")[0];return VALID_VIEWS.indexOf(v)>=0?v:"dashboard";}
  function hashToSubId(h){var parts=(h||"").replace(/^#\//,"").split("/");return parts.length>1?decodeURIComponent(parts[1]):null;}
  var [view,setViewRaw]=useState(function(){return hashToView(window.location.hash);});
  function setView(v){window.location.hash="#/"+v;setViewRaw(v);}
  var [stages,setStages]=useState(INIT_STAGES);
  var [verticals,setVerticals]=useState(INIT_VERTICALS);
  var [personas,setPersonas]=useState(INIT_PERSONAS);
  var [pages,setPages]=useState(INIT_PAGES);
  var [journeys,setJourneys]=useState(INIT_JOURNEYS);
  var [gaCards,setGaCards]=useState(INIT_GA_CARDS);
  var [wireframeRules,setWireframeRules]=useState(INIT_WIREFRAME_RULES);
  var [clientList,setClientList]=useState(INIT_CLIENTS);
  var [caseStudies,setCaseStudies]=useState(INIT_CASE_STUDIES);
  var [auditData,setAuditData]=useState(INIT_AUDIT);
  var [activePersonaId,setActivePersonaId]=useState(function(){var v=hashToView(window.location.hash);return v==="persona-detail"?hashToSubId(window.location.hash):null;});
  var [activePersonaForJourney,setActivePersonaForJourney]=useState(function(){var v=hashToView(window.location.hash);return v==="journey"?hashToSubId(window.location.hash):null;});
  function goToPersona(id){window.location.hash="#/persona-detail/"+encodeURIComponent(id);setViewRaw("persona-detail");setActivePersonaId(id);}
  function goToJourney(id){window.location.hash="#/journey/"+encodeURIComponent(id);setViewRaw("journey");setActivePersonaForJourney(id);}
  var [showAddAction,setShowAddAction]=useState(false);
  var [generatedAudits,setGeneratedAudits]=useState(function(){try{var s=localStorage.getItem("gwi_generated_audits");return s?JSON.parse(s):[];}catch(e){return [];}});
  var [savedWireframes,setSavedWireframes]=useState(function(){try{var s=localStorage.getItem("gwi_saved_wireframes");return s?JSON.parse(s):[];}catch(e){return [];}});
  var [lovedComponents,setLovedComponents]=useState(function(){try{var s=localStorage.getItem("gwi_loved_components");return s?JSON.parse(s):[];}catch(e){return [];}});
  var [feedback,setFeedback]=useState(function(){try{var s=localStorage.getItem("gwi_feedback");return s?JSON.parse(s):[];}catch(e){return [];}});
  var [showFeedbackModal,setShowFeedbackModal]=useState(false);
  var [feedbackToast,setFeedbackToast]=useState(false);
  var feedbackSubmittedRef=useRef(false);
  var isMobile=useWidth()<768;
  var [_user,_setUser]=useState(null);
  var [_authLoading,_setAuthLoading]=useState(true);
  var [_loginError,_setLoginError]=useState(null);
  useEffect(function(){return onAuthStateChanged(_auth,function(u){if(u){if(!u.email||!u.email.endsWith("@gwi.com")){fbSignOut(_auth);_setUser(null);_setLoginError("Access restricted to @gwi.com accounts.");_setAuthLoading(false);return;}_setUser(u);getDoc(doc(_db,"users",u.uid)).then(function(snap){if(snap.exists()){var d=snap.data();if(d.auditData)setAuditData(d.auditData);if(d.stages)setStages(d.stages);if(d.verticals)setVerticals(d.verticals);if(d.personas)setPersonas(d.personas);if(d.pages)setPages(d.pages);if(d.journeys)setJourneys(d.journeys);if(d.gaCards)setGaCards(d.gaCards);if(d.wireframeRules)setWireframeRules(d.wireframeRules);if(d.clientList)setClientList(d.clientList);if(d.caseStudies)setCaseStudies(d.caseStudies);}});getDocs(collection(_db,"users",u.uid,"generatedAudits")).then(function(snap){var arr=snap.docs.map(function(d){return d.data();});setGeneratedAudits(function(prev){var merged=prev.slice();arr.forEach(function(a){if(!merged.find(function(x){return x.id===a.id;}))merged.push(a);});merged.sort(function(a,b){return a.id<b.id?-1:1;});return merged;});}).catch(function(){});getDocs(collection(_db,"users",u.uid,"wireframes")).then(function(snap){var arr=snap.docs.map(function(d){return d.data();});setSavedWireframes(function(prev){var merged=prev.slice();arr.forEach(function(a){if(!merged.find(function(x){return x.id===a.id;}))merged.push(a);});return merged;});}).catch(function(){});
getDocs(collection(_db,"users",u.uid,"feedback")).then(function(snap){var arr=snap.docs.map(function(d){return d.data();});setFeedback(function(prev){var merged=prev.slice();arr.forEach(function(a){if(!merged.find(function(x){return x.id===a.id;}))merged.push(a);});return merged;});}).catch(function(){});}else{_setUser(null);}_setAuthLoading(false);});},[]);
  useEffect(function(){if(!_user)return;var t=setTimeout(function(){setDoc(doc(_db,"users",_user.uid),{auditData:auditData,stages:stages,verticals:verticals,personas:personas,pages:pages,journeys:journeys,gaCards:gaCards,wireframeRules:wireframeRules,clientList:clientList,caseStudies:caseStudies,email:_user.email,ts:Date.now()},{merge:true});},2000);return function(){clearTimeout(t);};},[ auditData,stages,verticals,personas,pages,journeys,gaCards,wireframeRules,clientList,caseStudies,_user]);
  useEffect(function(){try{localStorage.setItem("gwi_generated_audits",JSON.stringify(generatedAudits));}catch(e){};},[generatedAudits]);
  useEffect(function(){try{localStorage.setItem("gwi_saved_wireframes",JSON.stringify(savedWireframes));}catch(e){};},[savedWireframes]);
  useEffect(function(){try{localStorage.setItem("gwi_loved_components",JSON.stringify(lovedComponents));}catch(e){};},[lovedComponents]);
  useEffect(function(){try{localStorage.setItem("gwi_feedback",JSON.stringify(feedback));}catch(e){};},[feedback]);
  useEffect(function(){function onHash(){var h=window.location.hash;var v=hashToView(h);var sub=hashToSubId(h);setViewRaw(v);if(v==="persona-detail"&&sub)setActivePersonaId(sub);if(v==="journey"&&sub)setActivePersonaForJourney(sub);}window.addEventListener("hashchange",onHash);return function(){window.removeEventListener("hashchange",onHash);};},[]);
  useEffect(function(){function onKey(e:KeyboardEvent){if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key==="F"){e.preventDefault();setShowFeedbackModal(function(prev){return !prev;});}}document.addEventListener("keydown",onKey);return function(){document.removeEventListener("keydown",onKey);};},[]);
  var _NAV_VIEWS=["dashboard","summary","audit","wireframes","personas","mapping","analytics"];
  var _NAV_MAP:Record<string,string>={dashboard:"dashboard",summary:"summary","generated-audits":"summary",wireframes:"wireframes",audit:"audit",personas:"personas","persona-detail":"personas",mapping:"mapping",journey:"mapping",lifecycle:"mapping",affinity:"mapping",flows:"mapping",analytics:"analytics"};
  useEffect(function(){
    function onArrow(e:KeyboardEvent){
      if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
      var tag=(document.activeElement as HTMLElement)?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||(document.activeElement as HTMLElement)?.isContentEditable)return;
      var parent=_NAV_MAP[view]||"dashboard";
      var idx=_NAV_VIEWS.indexOf(parent);
      if(idx===-1)return;
      e.preventDefault();
      var next=e.key==="ArrowRight"?(idx+1)%_NAV_VIEWS.length:(idx-1+_NAV_VIEWS.length)%_NAV_VIEWS.length;
      setView(_NAV_VIEWS[next]);
    }
    document.addEventListener("keydown",onArrow);
    return function(){document.removeEventListener("keydown",onArrow);};
  },[view]);
  function _handleLogin(email,password){_setLoginError(null);if(!email.endsWith('@gwi.com')){_setLoginError('Access restricted to @gwi.com accounts.');return;}signInWithEmailAndPassword(_auth,email,password).catch(function(err){_setLoginError(err.code==='auth/invalid-credential'||err.code==='auth/wrong-password'||err.code==='auth/user-not-found'?'Invalid email or password.':'Sign-in failed. Try again.');});}
  function _handleRegister(email,password){_setLoginError(null);if(!email.endsWith('@gwi.com')){_setLoginError('Access restricted to @gwi.com accounts.');return;}if(password.length<6){_setLoginError('Password must be at least 6 characters.');return;}createUserWithEmailAndPassword(_auth,email,password).catch(function(err){_setLoginError(err.code==='auth/email-already-in-use'?'Account already exists. Try signing in.':err.code==='auth/weak-password'?'Password must be at least 6 characters.':'Registration failed. Try again.');});}
  function _handleGoogleLogin(){_setLoginError(null);var p=new GoogleAuthProvider();p.setCustomParameters({hd:"gwi.com"});signInWithPopup(_auth,p).catch(function(err:any){_setLoginError(err.code==='auth/popup-closed-by-user'?'Sign-in cancelled.':err.code==='auth/unauthorized-domain'?'This domain is not authorised in Firebase — contact your admin.':'Google sign-in failed. Try again. ('+( err.code||'')+')');});}
  var _qp=new URLSearchParams(window.location.search);
  if(_qp.get('mode')==='resetPassword'&&_qp.get('oobCode'))return(<ConfirmResetScreen oobCode={_qp.get('oobCode')!}/>);
  if(_authLoading)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.grey2,color:C.grey7,fontSize:14,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>Loading…</div>);
  if(!_user)return(<LoginScreen onLogin={_handleLogin} onRegister={_handleRegister} onGoogleLogin={_handleGoogleLogin} loginError={_loginError}/>);


  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      {isMobile?(
        <MobileNav view={view} setView={setView}/>
      ):(
        <div style={{background:C.black,borderBottom:"1px solid "+C.offBlack,padding:"0 20px",height:52,display:"flex",alignItems:"center",gap:4,position:"fixed",top:0,left:0,right:0,zIndex:100,boxSizing:"border-box"}}>
          <div style={{fontWeight:800,fontSize:15,color:C.white,marginRight:4,letterSpacing:"-0.02em",cursor:"pointer",flexShrink:0}} onClick={function(){setView("dashboard");}}>GWI UX</div>
          <button onClick={function(){setView("dashboard");}} style={{padding:"6px 12px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:view==="dashboard"?C.pink:"transparent",color:view==="dashboard"?C.white:C.grey7,flexShrink:0}}>Dashboard</button>
          <button onClick={function(){setView("summary");}} style={{padding:"6px 12px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:(view==="summary"||view==="generated-audits")?C.pink:"transparent",color:(view==="summary"||view==="generated-audits")?C.white:C.grey7,flexShrink:0}}>UX Audit</button>
          <button onClick={function(){setView("audit");}} style={{padding:"6px 12px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:view==="audit"?C.pink:"transparent",color:view==="audit"?C.white:C.grey7,flexShrink:0}}>Recommendations</button>
          <button onClick={function(){setView("wireframes");}} style={{padding:"6px 12px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:view==="wireframes"?C.pink:"transparent",color:view==="wireframes"?C.white:C.grey7,flexShrink:0}}>Wireframes</button>
          <button onClick={function(){setView("personas");}} style={{padding:"6px 12px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:(view==="personas"||view==="persona-detail")?C.pink:"transparent",color:(view==="personas"||view==="persona-detail")?C.white:C.grey7,flexShrink:0}}>Personas</button>
          <Dropdown label="Journeys" items={MAPPING_ITEMS} activeView={view} setView={setView} onLabelClick={function(){setView("mapping");}} forceActive={view==="mapping"||view==="journey"||view==="lifecycle"||view==="affinity"||view==="flows"}/>
          <button onClick={function(){setView("analytics");}} style={{padding:"6px 12px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:view==="analytics"?C.pink:"transparent",color:view==="analytics"?C.white:C.grey7,flexShrink:0}}>Analytics</button>
          <div style={{flex:1}}/>
          <UserMenu user={_user} onSignOut={function(){fbSignOut(_auth);}} onSettings={function(){setView("settings");}} onFeedbackPage={function(){setView("feedback");}} onGuide={function(){setView("guide");}} activeView={view}/>
        </div>
      )}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",paddingTop:isMobile?0:52}}>
        {view==="dashboard"&&<Dashboard personas={personas} auditData={auditData} setView={setView} onFeedback={function(){setShowFeedbackModal(true);}}/>}
        {view==="personas"&&<PersonasDash personas={personas} setView={setView} goToPersona={goToPersona}/>}
        {view==="persona-detail"&&<PersonasPage personas={personas} journeys={journeys} setView={setView} setActivePersonaForJourney={setActivePersonaForJourney} goToJourney={goToJourney} initialPersonaId={activePersonaId}/>}
        {view==="mapping"&&<MappingDash setView={setView}/>}
        {view==="lifecycle"&&<CustomerMappingPage stages={stages} personas={personas} journeys={journeys} setView={setView}/>}
        {view==="affinity"&&<AffinityPage personas={personas} setView={setView}/>}
        {view==="journey"&&<JourneyPage pages={pages} personas={personas} journeys={journeys} initialPersonaId={activePersonaForJourney} setView={setView} goToJourney={goToJourney}/>}
        {view==="flows"&&<UserFlowsPage setView={setView}/>}
        {view==="audit"&&<AuditPage personas={personas} pages={pages} auditData={auditData} setAuditData={setAuditData} onAddAction={function(){setShowAddAction(true);}} onSaveWireframe={function(wf){setSavedWireframes(function(prev){return prev.concat([wf]);});if(_user)setDoc(doc(_db,"users",_user.uid,"wireframes",wf.id),wf).catch(function(){});}} setView={setView} wireframeRules={wireframeRules}/>}
        {view==="analytics"&&<AnalyticsPage gaCards={gaCards} setGaCards={setGaCards}/>}
        {view==="summary"&&<SummaryPage personas={personas} stages={stages} pages={pages} journeys={journeys} clientList={clientList} caseStudies={caseStudies} onAuditGenerated={function(audit){setGeneratedAudits(function(prev){return prev.concat([audit]);});if(_user)setDoc(doc(_db,"users",_user.uid,"generatedAudits",audit.id),audit).catch(function(){});setView("generated-audits");}} onViewGenerated={function(){setView("generated-audits");}}/>}
        {view==="generated-audits"&&<GeneratedAuditsPage audits={generatedAudits} setAudits={setGeneratedAudits} onDeleteAudit={function(id){if(_user)deleteDoc(doc(_db,"users",_user.uid,"generatedAudits",id)).catch(function(){});}} onUpdateAudit={function(updated){if(_user)setDoc(doc(_db,"users",_user.uid,"generatedAudits",updated.id),updated).catch(function(){});}} setAuditData={setAuditData} auditData={auditData} pages={pages} setView={setView}/>}
        {view==="settings"&&<SettingsPage pages={pages} setPages={setPages} personas={personas} setPersonas={setPersonas} stages={stages} setStages={setStages} verticals={verticals} setVerticals={setVerticals} journeys={journeys} setJourneys={setJourneys} gaCards={gaCards} setGaCards={setGaCards} wireframeRules={wireframeRules} setWireframeRules={setWireframeRules} clientList={clientList} setClientList={setClientList} caseStudies={caseStudies} setCaseStudies={setCaseStudies}/>}
        {view==="guide"&&<GuidePage/>}
        {view==="wireframes"&&<WireframesPage wireframes={savedWireframes} setWireframes={setSavedWireframes} onDeleteWireframe={function(id){if(_user)deleteDoc(doc(_db,"users",_user.uid,"wireframes",id)).catch(function(){});}} onUpdateWireframe={function(wf){if(_user)setDoc(doc(_db,"users",_user.uid,"wireframes",wf.id),wf).catch(function(){});}} auditData={auditData} onAddRec={function(action,pageUrl){var pageObj=pages.find(function(p){return p.url===pageUrl;});var newAction=Object.assign({},action,{status:"todo"});var existing=auditData.find(function(p){return p.url===pageUrl;});if(existing){setAuditData(function(prev){return prev.map(function(p){return p.url===pageUrl?Object.assign({},p,{actions:[newAction].concat(p.actions)}):p;});});}else{setAuditData(function(prev){return prev.concat([{id:"aa-"+Date.now(),url:pageUrl,label:pageObj?pageObj.label:pageUrl,priority:"High",personas:[],stage:"",issue:"",actions:[newAction]}]);});}}} onRemoveRec={function(actionId,pageUrl){setAuditData(function(prev){return prev.map(function(p){return p.url!==pageUrl?p:Object.assign({},p,{actions:(p.actions||[]).filter(function(a:any){return a.id!==actionId;})});});});}} lovedComponents={lovedComponents} onLoveComponent={function(lc){setLovedComponents(function(prev){return (prev as any[]).concat([lc]);});}} onUnloveComponent={function(id){setLovedComponents(function(prev){return (prev as any[]).filter(function(lc:any){return lc.id!==id;});});}} personas={personas} wireframeRules={wireframeRules} onSaveWireframe={function(wf){setSavedWireframes(function(prev){return prev.concat([wf]);});if(_user)setDoc(doc(_db,"users",_user.uid,"wireframes",wf.id),wf).catch(function(){});}}/>}
      </div>
      {view==="feedback"&&<FeedbackPage feedback={feedback} onDeleteFeedback={function(id){setFeedback(function(prev){return(prev as any[]).filter(function(f){return f.id!==id;});});if(_user)deleteDoc(doc(_db,"users",_user.uid,"feedback",id)).catch(function(){});}} onSubmit={function(entry){var full=Object.assign({},entry,{user:_user?_user.email:""});setFeedback(function(prev){return prev.concat([full]);});if(_user)setDoc(doc(_db,"users",_user.uid,"feedback",full.id),full).catch(function(){});}} onEditFeedback={function(id,newText){setFeedback(function(prev){return(prev as any[]).map(function(f){return f.id===id?Object.assign({},f,{feedback:newText}):f;});});if(_user){var entry=(feedback as any[]).find(function(f){return f.id===id;});if(entry)setDoc(doc(_db,"users",_user.uid,"feedback",id),Object.assign({},entry,{feedback:newText})).catch(function(){});}}}/>}
      {showAddAction&&<AddActionModal auditData={auditData} setAuditData={setAuditData} pages={pages} onClose={function(){setShowAddAction(false);}}/>}
      <button onClick={function(){setShowFeedbackModal(true);}} title="Leave feedback (⌘⇧F)" style={{position:"fixed",bottom:24,left:24,zIndex:1400,background:C.pink,color:C.white,border:"none",borderRadius:"50%",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(255,0,119,0.35)",transition:"transform 0.15s,box-shadow 0.15s"}} onMouseEnter={function(e){e.currentTarget.style.transform="scale(1.1)";e.currentTarget.style.boxShadow="0 6px 20px rgba(255,0,119,0.45)";}} onMouseLeave={function(e){e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 16px rgba(255,0,119,0.35)";}}>
        <MessageSquare size={18}/>
      </button>
      {feedbackToast&&<div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:C.black,color:C.white,borderRadius:12,padding:"13px 24px",fontSize:13,fontWeight:600,zIndex:3000,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap",animation:"slideUp 0.25s ease"}}><span style={{color:"#22C55E",fontSize:16,lineHeight:1}}>✓</span>Thank you for your feedback!</div>}
      {showFeedbackModal&&<FeedbackModal
        onClose={function(){
          if(feedbackSubmittedRef.current){
            setFeedbackToast(true);
            setTimeout(function(){setFeedbackToast(false);},3500);
            feedbackSubmittedRef.current=false;
          }
          setShowFeedbackModal(false);
        }}
        onSubmit={function(entry){
          var full=Object.assign({},entry,{user:_user?_user.email:""});
          setFeedback(function(prev){return prev.concat([full]);});
          if(_user)setDoc(doc(_db,"users",_user.uid,"feedback",full.id),full).catch(function(){});
          feedbackSubmittedRef.current=true;
        }}
        onViewAll={function(){setShowFeedbackModal(false);setView("feedback");}}
      />}
    </div>
  );
}



