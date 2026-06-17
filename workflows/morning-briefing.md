# Workflow: Morning Briefing

**Trigger:** Start of each working day  
**Owner:** CEO Agent  
**Risk level:** Low

---

## Output Format

```
Cap DevRoom — MORNING BRIEFING
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date:
Prepared by: APEX (CEO Agent)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIORITIES TODAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. [Most important thing]
  2. [Second priority]
  3. [Third priority]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE RISKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠ [Risk description — owner — status]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PENDING APPROVALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → [Item requiring approval — risk level — requested by]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPEN BUGS (P0/P1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🐛 [Bug ID — severity — status]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
YESTERDAY'S PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ [Completed item]
  ✓ [Completed item]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [CEO Agent's recommended focus for the day]
```

---

## Storage

All briefings are saved to:  
`/reports/briefings/YYYY-MM-DD-morning.md`
