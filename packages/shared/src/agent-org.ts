export type DevroomAgentCodename =
  | "APEX"
  | "FORGE"
  | "PRISM"
  | "PIXEL"
  | "CORE"
  | "SHIELD"
  | "VAULT"
  | "LENS"
  | "SCROLL"
  | "QUILL"
  | "SLIDE"
  | "PITCH"
  | "INK";

export type ReportsTo = DevroomAgentCodename | "FOUNDER";

export interface DevroomAgentOrgProfile {
  codename: DevroomAgentCodename;
  name: string;
  jobTitle: string;
  jobDescription: string;
  reportsTo: ReportsTo;
  department: string;
  skills: string[];
  defaultRisk: "Low" | "Medium" | "High";
}

export const FOUNDER_LABEL = "You (Founder)";

export const DEVROOM_AGENT_ORG: Record<DevroomAgentCodename, DevroomAgentOrgProfile> = {
  APEX: {
    codename: "APEX",
    name: "CEO",
    jobTitle: "Chief Executive Officer",
    jobDescription:
      "Runs the virtual development office. Parses natural-language commands, delegates to specialists, and gates medium/high-risk work through the approval queue.",
    reportsTo: "FOUNDER",
    department: "Executive",
    skills: ["strategy", "prioritization", "delegation", "vision", "approval triage"],
    defaultRisk: "Low",
  },
  FORGE: {
    codename: "FORGE",
    name: "CTO",
    jobTitle: "Chief Technology Officer",
    jobDescription:
      "Architecture and engineering decisions for vanilla JS PWAs and Next.js. Refactors, service workers, technical debt — sandbox only.",
    reportsTo: "APEX",
    department: "Engineering",
    skills: ["architecture", "refactors", "service workers", "technical debt", "migrations"],
    defaultRisk: "High",
  },
  PRISM: {
    codename: "PRISM",
    name: "Product Manager",
    jobTitle: "Chief Product Officer",
    jobDescription: "Scope features ruthlessly. User stories with acceptance criteria for a solo-dev portfolio.",
    reportsTo: "APEX",
    department: "Product",
    skills: ["roadmap", "user stories", "scope", "metrics", "backlog grooming"],
    defaultRisk: "Medium",
  },
  PIXEL: {
    codename: "PIXEL",
    name: "Frontend Architect",
    jobTitle: "UI/UX Lead",
    jobDescription:
      "Audit UI in sandbox copies: typography, alignment, capitalization, iPhone PWA layout, Apple-native feel.",
    reportsTo: "FORGE",
    department: "Engineering",
    skills: ["ui audit", "typography", "alignment", "design tokens", "iphone pwa"],
    defaultRisk: "Medium",
  },
  CORE: {
    codename: "CORE",
    name: "Backend Architect",
    jobTitle: "Infrastructure Lead",
    jobDescription:
      "LocalStorage schemas, IndexedDB migrations, API route design, data layer patterns across Cap PWAs.",
    reportsTo: "FORGE",
    department: "Engineering",
    skills: ["localStorage", "indexeddb", "schema migrations", "api design", "data layer"],
    defaultRisk: "High",
  },
  SHIELD: {
    codename: "SHIELD",
    name: "QA Engineer",
    jobTitle: "Quality Assurance Lead",
    jobDescription: "Regression checks, boot errors, JS syntax, PWA offline behavior, edge cases in sandbox code.",
    reportsTo: "FORGE",
    department: "Engineering",
    skills: ["regression", "boot errors", "js syntax", "pwa offline", "playwright"],
    defaultRisk: "Low",
  },
  VAULT: {
    codename: "VAULT",
    name: "Security Officer",
    jobTitle: "Chief Security Officer",
    jobDescription: "Threat models, secrets scans, CSP review, VaultCap crypto concerns.",
    reportsTo: "FORGE",
    department: "Engineering",
    skills: ["threat model", "secrets scan", "csp", "encryption", "pin lockout"],
    defaultRisk: "High",
  },
  SCROLL: {
    codename: "SCROLL",
    name: "Documentation",
    jobTitle: "Chief Knowledge Officer",
    jobDescription: "README, CHANGELOG, architecture docs. Check existing docs before creating duplicates.",
    reportsTo: "APEX",
    department: "Content",
    skills: ["readme", "changelog", "architecture docs", "api docs"],
    defaultRisk: "Low",
  },
  QUILL: {
    codename: "QUILL",
    name: "Writing Lead",
    jobTitle: "Chief Writing Officer",
    jobDescription: "Polished prose: landing copy, blog drafts, product descriptions.",
    reportsTo: "APEX",
    department: "Content",
    skills: ["copywriting", "blog posts", "product narrative", "editing", "tone"],
    defaultRisk: "Low",
  },
  SLIDE: {
    codename: "SLIDE",
    name: "Presentation Architect",
    jobTitle: "Presentation Lead",
    jobDescription: "Presentation outlines and slide-by-slide content. Check sandboxes for existing decks first.",
    reportsTo: "APEX",
    department: "Content",
    skills: ["slide decks", "keynote structure", "visual storytelling", "demo flow"],
    defaultRisk: "Low",
  },
  PITCH: {
    codename: "PITCH",
    name: "Investor Relations",
    jobTitle: "Pitch Strategist",
    jobDescription: "Investor pitches and one-pagers. Honest about solo-dev stage.",
    reportsTo: "APEX",
    department: "Executive",
    skills: ["investor pitch", "one-pager", "traction metrics", "market sizing"],
    defaultRisk: "Medium",
  },
  INK: {
    codename: "INK",
    name: "Content Agent",
    jobTitle: "Marketing Content Lead",
    jobDescription: "Short-form marketing and launch messaging for Cap apps.",
    reportsTo: "PRISM",
    department: "Content",
    skills: ["social", "launch messaging", "github readme hooks", "taglines"],
    defaultRisk: "Low",
  },
  LENS: {
    codename: "LENS",
    name: "Research",
    jobTitle: "Chief Research Officer",
    jobDescription: "Evidence-based research with confidence levels — tools, costs, competitive analysis.",
    reportsTo: "APEX",
    department: "Research",
    skills: ["cost analysis", "tool evaluation", "competitive research"],
    defaultRisk: "Low",
  },
};

export const DEVROOM_AGENT_CODENAMES = Object.keys(DEVROOM_AGENT_ORG) as DevroomAgentCodename[];

export const DEVROOM_AGENT_ORG_ORDERED: DevroomAgentOrgProfile[] = [
  DEVROOM_AGENT_ORG.APEX,
  DEVROOM_AGENT_ORG.FORGE,
  DEVROOM_AGENT_ORG.PRISM,
  DEVROOM_AGENT_ORG.PIXEL,
  DEVROOM_AGENT_ORG.CORE,
  DEVROOM_AGENT_ORG.SHIELD,
  DEVROOM_AGENT_ORG.VAULT,
  DEVROOM_AGENT_ORG.SCROLL,
  DEVROOM_AGENT_ORG.QUILL,
  DEVROOM_AGENT_ORG.SLIDE,
  DEVROOM_AGENT_ORG.PITCH,
  DEVROOM_AGENT_ORG.INK,
  DEVROOM_AGENT_ORG.LENS,
];
