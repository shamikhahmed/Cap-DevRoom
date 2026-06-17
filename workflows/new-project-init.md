# Workflow: New Project Initialization

**Trigger:** A new project is introduced to Cap DevRoom  
**Owner:** CTO Agent + PM Agent  
**Risk level:** Low (initialization) → Medium (architecture decisions)

---

## Steps

### Step 1 — Project Registration
- [ ] CEO Agent assesses strategic alignment
- [ ] Create `/projects/{project-name}/` folder
- [ ] Create `/projects/{project-name}/README.md`
- [ ] Assign project to active roster

### Step 2 — Product Definition (PM Agent)
- [ ] Define purpose and vision
- [ ] Identify target user
- [ ] Write initial roadmap
- [ ] Create `/projects/{project-name}/roadmap.md`

### Step 3 — Architecture Design (CTO Agent)
- [ ] Select tech stack
- [ ] Design system architecture
- [ ] Identify risks and dependencies
- [ ] Log ADR in `/knowledge/architecture-decisions.md`
- [ ] Create `/projects/{project-name}/ARCHITECTURE.md`

### Step 4 — Environment Setup (Backend Agent)
- [ ] Initialize repository
- [ ] Configure CI/CD pipeline
- [ ] Set up environments: dev / staging / production
- [ ] Document in `/projects/{project-name}/SETUP.md`

### Step 5 — Security Baseline (Security Agent)
- [ ] Initial threat model
- [ ] Define auth strategy
- [ ] Set up secret management
- [ ] Log in `/knowledge/security-log.md`

### Step 6 — QA Setup (QA Agent)
- [ ] Define testing strategy
- [ ] Set up test framework
- [ ] Define Definition of Done

### Step 7 — Documentation (Documentation Agent)
- [ ] Complete README
- [ ] Write setup guide
- [ ] Initialize CHANGELOG

---

## Output

A project is initialized when all 7 steps are complete and `/projects/{project-name}/` contains:

- `README.md`
- `ARCHITECTURE.md`
- `SETUP.md`
- `CHANGELOG.md`
- `roadmap.md`
