# SKILL: NCERT Grade 9 Study Material Agent

> **Purpose:** Research, generate, and publish NCERT Grade 9 (2025-26) study material as GRID-compliant notes.
> **Trigger:** Any task involving creating NCERT study notes for Grade 9.

---

## Meta-Cognitive Scaffolding

Before starting any work, classify the task:

1. **What subject?** — Science, Mathematics, or Social Science
2. **What chapter?** — Look up in `subject-maps/` for exact chapter ID and subtopics
3. **What note types?** — Summary, Concepts (nested bullets), Questions & Solutions, Formulas
4. **What's my knowledge state?** — Do I have the NCERT content, or do I need to fetch it?
5. **What's the output format?** — Follow GRID format from `AGENT.md` and `SKILL.md` in parent directory

---

## Gauntlet Loop Workflow

Every note goes through this pipeline:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PHASE 1    │────▶│  PHASE 2    │────▶│  PHASE 3    │
│  Research   │     │  Generate   │     │  Critic     │
│  (Fetch)    │     │  (Builder)  │     │  (Quality)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │    ┌───────┐       │
                           └───▶│ LOOP  │◀──────┘
                                │ until │
                                │ bar   │
                                └───────┘
```

### Phase 1: Research (Fetch NCERT Content)

For each chapter, gather:
- **NCERT textbook content** — paragraph-by-paragraph from the official PDF
- **NCERT solutions** — all exercise questions with answers
- **Syllabus topics** — exact topics from CBSE 2025-26 curriculum
- **Deleted topics** — topics removed from 2025-26 syllabus (DO NOT include these)

**Fetch sources:**
- NCERT official: `ncert.nic.in` textbook PDFs
- CBSE academic: `cbseacademic.nic.in` syllabus PDFs
- Solutions: `learncbse.in`, `vedantu.com`, `byjus.com`

**Use the Gauntlet Loop here:** Compare fetched content against the NCERT textbook as the reference bar. If content is incomplete, fetch again.

### Phase 2: Generate (Builder Agent)

Based on subject, use the appropriate prompt from `prompts/`:

| Subject | Prompt | Note Structure |
|---------|--------|----------------|
| Science | `science-note-gen.md` | Paragraph-by-paragraph nested bullets |
| SST | `sst-note-gen.md` | Paragraph-by-paragraph nested bullets |
| Mathematics | `maths-note-gen.md` | All topics + all questions with solutions |

**Builder rules:**
- Follow GRID format exactly (frontmatter, KaTeX, SVG, Mermaid)
- Use templates from `templates/` as starting points
- Apply constraint stacking: accuracy > completeness > formatting
- Use negative space instructions: "Do NOT include deleted topics"
- Apply calibrated uncertainty: flag uncertain content

### Phase 3: Critic (Quality Check)

Spawn a **fresh critic agent** with NO context from the builder:
- **Persona:** "You are a CBSE Class 9 board examiner with 15 years experience"
- **Reference bar:** NCERT textbook content
- **Comparison:** Blind A/B — critic sees our note and NCERT content without labels
- **Checks:**
  - [ ] All topics from syllabus covered
  - [ ] No deleted topics included
  - [ ] Formulas are correct (KaTeX renders)
  - [ ] Definitions match NCERT language
  - [ ] Examples are accurate
  - [ ] Nested bullets follow paragraph structure
  - [ ] Frontmatter has all required fields
  - [ ] File name is kebab-case
  - [ ] index.json entry is correct

**If critic finds issues:** Send back to builder with specific gap description. Loop until critic approves.

### Phase 4: Index Update

After all notes for a chapter are approved:
1. Read existing `data/index.json`
2. Add new note entries
3. Sort by `pinned` first, then `updated` descending
4. Update `generated` timestamp
5. Push to GitHub

---

## Subject-Specific Note Structures

### Science Notes — Paragraph-by-Paragraph Nested Bullets

Each paragraph from the NCERT textbook becomes a nested bullet structure:

```markdown
## Topic Name

- **Key Term**: Definition from NCERT
  - Explanation in simpler language
    - Example or analogy
      - Real-world connection
  - Related concept
    - How it connects to the key term
      - Why this matters

- **Next Key Term**: Definition
  - Detailed explanation
    - Sub-point with example
      - Connection to previous concept
```

**Rules:**
- Every paragraph → at least one top-level bullet
- Bold the key term at the start of each bullet
- Nest 3-4 levels deep for complex concepts
- Include NCERT examples as nested points
- Connect related concepts across paragraphs

### SST Notes — Paragraph-by-Paragraph Nested Bullets

Same structure as Science, but adapted for humanities:

```markdown
## Topic Name

- **Historical Event/Concept**: Brief description
  - Date/Period: When it happened
    - Key figures involved
      - Their role and significance
  - Causes: Why it happened
    - Immediate cause
      - Underlying factors
  - Effects: What resulted
    - Short-term effects
      - Long-term impact
        - Relevance today
```

### Mathematics Notes — All Topics + All Questions

```markdown
## Topic: [Name]

### Key Concepts
- **Definition**: Explanation
  - Property or rule
    - Example

### Formulas
| Formula | Variables | When to Use |
|---------|-----------|-------------|
| $$formula$$ | $x$ = ..., $y$ = ... | ... |

### NCERT Exercise Questions

#### Q1. [Question text from NCERT]
**Solution:**
Step-by-step solution with KaTeX

#### Q2. [Question text]
**Solution:**
...

### Extra Questions (Board Exam Frequent)
...
```

---

## GRID Format Compliance

### Frontmatter Template

```markdown
---
title: "[Chapter Name] — [Note Type]"
subject: [subject-id]
chapter: [chapter-id]
tags: [relevant-tags]
color: [color-label]
pinned: [true/false]
created: [ISO-timestamp]
updated: [ISO-timestamp]
---
```

### Color Assignment Rules

| Note Type | Color |
|-----------|-------|
| Chapter Summary | `green` (pinned: true) |
| Concept Notes (nested bullets) | `yellow` |
| Formula Sheet | `purple` |
| Worked Examples / Q&A | `blue` |
| Exam Priority Topics | `red` |

### Tag Assignment Rules

| Content | Tags |
|---------|------|
| Chapter summary | `summary`, `ncert-textbook` |
| Concept explanations | `definition`, `ncert-textbook` |
| Formulas | `formula`, `purple` |
| Worked examples | `example`, `ncert-textbook` |
| Practice questions | `homework`, `board-exam-frequent` |
| Diagrams | `diagram`, `diagram::geometry` |
| Comparisons | `comparison` |

---

## File Naming Convention

```
data/notes/{subject-id}/{chapter-id}/{slug}.md
```

Examples:
- `data/notes/chemistry/ch4-structure-of-atom/summary.md`
- `data/notes/chemistry/ch4-structure-of-atom/thomson-model.md`
- `data/notes/chemistry/ch4-structure-of-atom/all-questions.md`
- `data/notes/physics/ch7-motion/summary.md`
- `data/notes/mathematics/ch1-number-systems/formulas.md`
- `data/notes/mathematics/ch1-number-systems/exercise-1.1.md`
- `data/notes/social-science/history-ch4/french-revolution-summary.md`

---

## NCERT Grade 9 Chapter Reference (2025-26)

### Science (12 chapters)

| # | Chapter | Chapter ID | Subject ID |
|---|---------|------------|------------|
| 1 | Matter in Our Surroundings | `ch1-matter-surroundings` | `physics` |
| 2 | Is Matter Around Us Pure? | `ch2-matter-pure` | `chemistry` |
| 3 | Atoms and Molecules | `ch3-atoms-molecules` | `chemistry` |
| 4 | Structure of the Atom | `ch4-structure-of-atom` | `chemistry` |
| 5 | The Fundamental Unit of Life | `ch5-fundamental-unit-life` | `biology` |
| 6 | Tissues | `ch6-tissues` | `biology` |
| 7 | Motion | `ch7-motion` | `physics` |
| 8 | Force and Laws of Motion | `ch8-force-and-laws` | `physics` |
| 9 | Gravitation | `ch9-gravitation` | `physics` |
| 10 | Work and Energy | `ch10-work-energy` | `physics` |
| 11 | Sound | `ch11-sound` | `physics` |
| 12 | Improvement in Food Resources | `ch12-food-resources` | `biology` |

### Mathematics (12 chapters in syllabus)

| # | Chapter | Chapter ID |
|---|---------|------------|
| 1 | Number Systems | `ch1-number-systems` |
| 2 | Polynomials | `ch2-polynomials` |
| 3 | Coordinate Geometry | `ch3-coordinate-geometry` |
| 4 | Linear Equations in Two Variables | `ch4-linear-equations` |
| 5 | Introduction to Euclid's Geometry | `ch5-euclids-geometry` |
| 6 | Lines and Angles | `ch6-lines-and-angles` |
| 7 | Triangles | `ch7-triangles` |
| 8 | Quadrilaterals | `ch8-quadrilaterals` |
| 9 | Circles | `ch9-circles` |
| 10 | Heron's Formula | `ch10-herons-formula` |
| 11 | Surface Areas and Volumes | `ch11-surface-areas-volumes` |
| 12 | Statistics | `ch12-statistics` |

### Social Science (20 chapters across 4 disciplines)

**History — India and the Contemporary World I:**

| # | Chapter | Chapter ID |
|---|---------|------------|
| 1 | The French Revolution | `history-ch1-french-revolution` |
| 2 | Socialism in Europe and the Russian Revolution | `history-ch2-socialism-russia` |
| 3 | Nazism and the Rise of Hitler | `history-ch3-nazism-hitler` |
| 4 | Forest Society and Colonialism | `history-ch4-forest-colonialism` |
| 5 | Pastoralists in the Modern World | `history-ch5-pastoralists` |

**Geography — Contemporary India I:**

| # | Chapter | Chapter ID |
|---|---------|------------|
| 1 | India — Size and Location | `geography-ch1-india-location` |
| 2 | Physical Features of India | `geography-ch2-physical-features` |
| 3 | Drainage | `geography-ch3-drainage` |
| 4 | Climate | `geography-ch4-climate` |
| 5 | Natural Vegetation and Wildlife | `geography-ch5-vegetation-wildlife` |
| 6 | Population | `geography-ch6-population` |

**Political Science — Democratic Politics I:**

| # | Chapter | Chapter ID |
|---|---------|------------|
| 1 | What is Democracy? Why Democracy? | `pol-science-ch1-democracy` |
| 2 | Constitutional Design | `pol-science-ch2-constitutional-design` |
| 3 | Electoral Politics | `pol-science-ch3-electoral-politics` |
| 4 | Working of Institutions | `pol-science-ch4-institutions` |
| 5 | Democratic Rights | `pol-science-ch5-democratic-rights` |

**Economics:**

| # | Chapter | Chapter ID |
|---|---------|------------|
| 1 | The Story of Village Palampur | `economics-ch1-palampur` |
| 2 | People as Resource | `economics-ch2-people-resource` |
| 3 | Poverty as a Challenge | `economics-ch3-poverty` |
| 4 | Food Security in India | `economics-ch4-food-security` |

---

## Constraint Stack (Priority Order)

1. **Accuracy** — Content must match NCERT 2025-26 exactly. No deleted topics. No outdated information.
2. **Completeness** — Every subtopic from the syllabus must be covered. Every NCERT exercise question must have a solution.
3. **GRID Compliance** — Frontmatter, file naming, index.json must be correct.
4. **Formatting** — KaTeX renders, SVGs display, Mermaid diagrams work.
5. **Conciseness** — Don't pad. Every bullet must add value.

---

## Negative Space Instructions

- Do NOT include topics deleted from 2025-26 syllabus
- Do NOT use vague descriptions — use exact NCERT language
- Do NOT skip NCERT exercise questions
- Do NOT create notes without frontmatter
- Do NOT use wrong subject/chapter IDs
- Do NOT forget to update index.json
- Do NOT include content beyond Grade 9 level
- Do NOT use plain text for formulas — always KaTeX

---

## Quality Checklist (Per Note)

Before marking a note as approved:

- [ ] Frontmatter has all required fields (title, subject, chapter, created, updated)
- [ ] Tags are from the vocabulary in SKILL.md
- [ ] Color label matches note type
- [ ] Content covers all syllabus topics for this subtopic
- [ ] No deleted topics included
- [ ] KaTeX formulas render without errors
- [ ] SVG diagrams are labeled and readable
- [ ] Nested bullets follow paragraph structure (for Science/SST)
- [ ] All NCERT exercise questions have solutions (for Maths)
- [ ] Key terms are bolded on first use
- [ ] File is named as kebab-case slug
- [ ] index.json entry matches frontmatter metadata
- [ ] Updated timestamp is current

---

## Execution Modes

### Full Run (All Subjects)
```
For each subject in [science, mathematics, social-science]:
  For each chapter in subject:
    Phase 1: Fetch NCERT content
    Phase 2: Generate notes (3-4 per chapter)
    Phase 3: Critic loop (approve or iterate)
    Phase 4: Update index.json
  Push to GitHub
```

### Single Chapter Run
```
Given: subject-id, chapter-id
Phase 1: Fetch NCERT content for this chapter
Phase 2: Generate all notes for this chapter
Phase 3: Critic loop
Phase 4: Update index.json
Push to GitHub
```

### Single Note Run
```
Given: subject-id, chapter-id, note-type
Phase 1: Fetch relevant content
Phase 2: Generate this single note
Phase 3: Critic loop
Phase 4: Update index.json
```

---

## Git Workflow

```bash
# After completing a chapter
git add data/
git commit -m "notes: add [chapter name] to [subject]/[chapter-id]"
git push origin master

# After completing a subject
git add data/
git commit -m "notes: complete [subject] — all chapters"
git push origin master
```

---

## Troubleshooting

**Note doesn't appear in sidebar:**
- Check index.json has the entry
- Check subject and chapter IDs match subjects.json exactly

**KaTeX doesn't render:**
- Check for syntax errors in `$...$` or `$$...$$`
- Test at https://katex.org/

**Critic keeps rejecting:**
- Read the specific gap description
- Focus on the largest gap first
- Don't try to fix everything at once — one iteration per loop

**NCERT content seems wrong:**
- Cross-reference with official NCERT PDF
- Check if topic was deleted in 2025-26 rationalization
- Use the most recent syllabus from cbseacademic.nic.in
