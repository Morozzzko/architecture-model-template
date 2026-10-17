---
name: architecture-review
description: Use when architecture documentation, a system page or the model has been written or changed, especially by an agent working from code, and needs checking before it is merged or shown; or when asked to review, critique, clean up or improve architecture documentation.
---

# Architecture review

Documentation written from code tends to describe the code: ports, libraries, class names, generic adjectives. A review finds what doesn't help a reader understand why the system exists and what it is made of, removes it, and turns what is missing into questions for the people who know. It never fills the gaps itself.

## What the critics check

| Quality | Critic | Source |
| --- | --- | --- |
| Fitness for the reader: it answers the questions its readers have | Newcomer | ISO/IEC/IEEE 42010 (stakeholders and their concerns); active design reviews |
| Readability: short, in a sensible order, terms explained | Newcomer | the seven rules of *Views and Beyond* (write for the reader, avoid ambiguity) |
| Intent over inventory: why something exists, not what it's built from | Noise auditor | arc42 (document what stakeholders need) |
| Economy: nothing the code, the model or a dashboard says better | Noise auditor | arc42 ("too much" documentation); the survey of stakeholders |
| Rationale: structure and decisions explained | Rationale skeptic | ISO/IEC/IEEE 42010 (rationale); *Views and Beyond* (record rationale); Zimmermann's decision checks |
| One level of abstraction, consistency of prose and model | C4 inspector | the C4 review checklist; ISO/IEC/IEEE 42010 (consistency) |
| Checkable quality goals | Quality examiner | arc42 quality goals and scenarios; ISO/IEC 25010 |

The sources are listed under References.

## Run the critics

The critics are the review: a request to review the documentation is a request to run them. Spawn the five critics in `critics.md` in parallel, as subagents with fresh context: Newcomer, Noise auditor, Rationale skeptic, C4 inspector, Quality examiner. Give each its brief, the paths of the pages and model files under review, and the output format, and tell it to read only those files. A critic that reads the code inherits the author's blind spots; one that sees only the documentation reads it the way its readers will.

Spawn them whenever the documentation was written in this session, by you or another agent: you can't read your own work with fresh eyes. For a single page of up to about a hundred lines written elsewhere, or if you can't spawn subagents, run the briefs one at a time yourself instead, re-reading only the documentation for each; it costs a fraction of five critics.

## Merge the findings

Merge duplicates. Drop findings without a quote, and findings about typos or grammar alone. Findings about readability stay: a section that is too long, out of order, full of unexplained terms, or has to be read twice. When critics give the same text different kinds, and any of them finds it generic, misleading or contradicted elsewhere, delete it and keep the question. Otherwise apply a `rewrite` that adds nothing new and keep any question alongside it. A critic's `rewrite` that adds anything new becomes a question.

A decision that is missing its reason stays, as the place its reason will go, with a question for the reason; it isn't deleted as a restatement of the model.

## Edit

A review may only:

- **delete** what fails the critics: code narration, trivia, boilerplate, restatements of the model, elements at the wrong level;
- **relabel or reword** what the documentation already says, so it says it clearly, at the right level, in the right place; combining facts stated anywhere in the documentation under review counts, as long as it doesn't change which element does what;
- **move** a fact to where it belongs, such as a description from prose into the model.

A container's `technology` names what it runs on (`Node.js`, `PostgreSQL schema`), not the libraries inside it; library names are deleted, not moved.

Everything new is a question for the user, never an edit: a quality goal or its ranking, a measure, a scenario, a concept's definition, a decision or its reason, an element, a relationship, a technology or protocol, an owner, a plan. This holds even when you're sure, even when the documentation hints at it, and even when you'd mark it as unconfirmed.

A section that loses all its content, including a table left with only its header, keeps its heading and gets back its placeholder: the italic line under the same heading in the starter page, `src/content/docs/systems/system.mdx`, or if there is none, one italic line saying what belongs there. Don't delete sections of the outline.

| Thought | Reality |
| --- | --- |
| "The purpose implies these goals" | Ranking and wording the goals is the owners' decision. Ask. |
| "The description mentions fulfilment, so the element must exist" | Who owns it and how it's reached are unknown. Ask. |
| "I'll add a caution note saying it's unconfirmed" | Readers skip notes. An unconfirmed claim in the docs is a claim. Ask. |
| "Leaving it empty looks worse" | An empty section is honest; an invented one is the problem the review exists to fix. |
| "It's obviously REST, the old text said so" | The old text was code narration. The protocol is a question. |

## Ask

Collect the questions from all findings. Ask the closed ones as multiple-choice questions (AskUserQuestion in Claude Code) and the rest in conversation, grouped by section. Write in only what the user answers. Questions about why belong to people; when the user can't answer, suggest who could, and leave the section as it is.

## Finish

Run `npm run validate` and `npm run build`, and fix what they report. Then report: what was deleted, reworded or moved, and why; the questions asked and what was written from the answers; and the questions still open. If the review left sections empty, say so plainly: an emptied section waiting for answers is the expected result, not a broken page.

## References

- A description exists for its stakeholders and their concerns, keeps its views consistent, and records rationale: [ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html). [ISO/IEC/IEEE 42030](https://www.iso.org/standard/73436.html) evaluates architectures themselves and leaves evaluating their description to the processes of ISO/IEC/IEEE 42020; this skill reviews the description.
- Write for the reader, avoid repetition and ambiguity, record rationale, keep it current but not too current, review for fitness of purpose: the seven rules for sound documentation in Clements et al., [*Documenting Software Architectures: Views and Beyond*](https://www.pearson.com/en-us/subject-catalog/p/Clements-Documenting-Software-Architectures-Views-and-Beyond-2nd-Edition/P200000000186/), 2nd ed., section P.5 (the rules are paraphrased from memory; the text is not online)
- "Too much" documentation as a way documentation fails, and documenting only what stakeholders need: arc42, [Why arc42](https://arc42.org/documentation/#why), by Gernot Starke and Peter Hruschka, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); this skill paraphrases and copies none of its text
- Unneeded information distracts readers and lengthens documents: [Unveiling Architecture Documentation: Brazilian Stakeholders in Perspective](https://arxiv.org/pdf/1510.06229)
- Reviewers who must use the document to answer questions find more than reviewers asked yes or no, which is the Newcomer critic's method: Parnas and Weiss, [Active Design Reviews: Principles and Practices](https://doi.org/10.1016/0164-1212(87)90025-2), *Journal of Systems and Software* 7(4), 1987, and the SEI's [Active Reviews for Intermediate Designs](https://apps.dtic.mil/sti/pdfs/ADA383775.pdf)
- The decision checks and the reviewer anti-patterns the output format rules out (pass-through, copy-edit, comments without advice, repetition): Olaf Zimmermann, [How to review Architectural Decision Records](https://ozimmer.ch/practices/2023/04/05/ADRReview.html)
- Element levels, labels and view titles: the [C4 review checklist](https://c4model.com/diagrams/checklist) and [notation](https://c4model.com/diagrams/notation)
