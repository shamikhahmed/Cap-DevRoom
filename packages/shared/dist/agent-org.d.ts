export type DevroomAgentCodename = "APEX" | "FORGE" | "PRISM" | "PIXEL" | "CORE" | "SHIELD" | "VAULT" | "LENS" | "SCROLL" | "QUILL" | "SLIDE" | "PITCH" | "INK";
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
export declare const FOUNDER_LABEL = "You (Founder)";
export declare const DEVROOM_AGENT_ORG: Record<DevroomAgentCodename, DevroomAgentOrgProfile>;
export declare const DEVROOM_AGENT_CODENAMES: DevroomAgentCodename[];
export declare const DEVROOM_AGENT_ORG_ORDERED: DevroomAgentOrgProfile[];
//# sourceMappingURL=agent-org.d.ts.map