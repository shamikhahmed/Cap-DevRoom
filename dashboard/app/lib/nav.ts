export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "⌂", mobileTab: true },
  { href: "/launch", label: "Launch", icon: "◆", mobileTab: true },
  { href: "/briefing", label: "Briefing", icon: "☀", mobileMore: true },
  { href: "/projects", label: "Projects", icon: "▦", badgeKey: "bugs" as const, mobileMore: true },
  { href: "/issues", label: "Issues", icon: "◳", badgeKey: "issues" as const, mobileMore: true },
  { href: "/agents", label: "Agents", icon: "◎", mobileTab: true },
  { href: "/approvals", label: "Approvals", icon: "✓", badgeKey: "approvals" as const, mobileTab: true },
  { href: "/knowledge", label: "Knowledge", icon: "≡", mobileMore: true },
  { href: "/deliverables", label: "Deliverables", icon: "¶", mobileMore: true },
  { href: "/tasks", label: "Tasks", icon: "☐", badgeKey: "tasks" as const, mobileMore: true },
  { href: "/settings", label: "Settings", icon: "⚙", mobileMore: true },
] as const;

export type NavBadgeKey = "bugs" | "approvals" | "tasks" | "issues";

export const MOBILE_TABS = NAV_ITEMS.filter((i) => "mobileTab" in i && i.mobileTab);
export const MOBILE_MORE = NAV_ITEMS.filter((i) => "mobileMore" in i && i.mobileMore);
