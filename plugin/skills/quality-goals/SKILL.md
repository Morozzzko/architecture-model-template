---
name: quality-goals
description: Use when a system's quality goals, quality requirements, non-functional requirements or quality scenarios need to be written, reviewed or changed, or when asked what qualities a system is optimized for, which trade-offs it makes, or what is important about it.
---

# Quality goals

Quality goals say which trade-offs a system makes: what wins when speed and correctness, or availability and consistency, pull apart. They come from the people who know the system, through an interview. Write them in the vocabulary of ISO/IEC 25010, listed with plain meanings in `qualities.md` next to this file, so every system in the repository can be compared; people answer in plain language and never need to learn the standard.

## Where they go

Write to the page of the system the goals are for, `src/content/docs/systems/<id>.mdx`, under "Quality goals" and "Quality scenarios". If the repository predates system pages and has an arc42 document instead, use its Quality Goals and Quality Scenarios sections, and make its Quality Requirements Overview point to the goals instead of repeating them. Read what is already there first: an interview revises goals, it doesn't start over.

## The interview

Use multiple-choice questions for choices and plain conversation for reasons and numbers. In Claude Code, ask multiple-choice questions with AskUserQuestion: up to four questions at once, two to four options each, and the user can always answer something else.

1. **Context.** Ask what the system is for and who depends on it, unless its page already says. Keep it to two or three questions, and write the answers under the page's "Purpose" (in arc42: Requirements Overview and Stakeholders).

2. **The top three kinds of quality.** Ask one round of three multi-select questions covering all nine kinds, so no kind is left out because you didn't think of it. Label each option with its plain question from `qualities.md` and put the ISO name in the option's description:
   - What it does: functional suitability, interaction capability, compatibility
   - How it runs: performance efficiency, reliability, flexibility
   - What it protects: security, safety, maintainability

   Offer the same options for every system. Don't reword them into guesses about this domain; the user's answers do that.

3. **Narrow to three, in order.** If more than four were picked, first ask which of them could take a back seat, as multi-select questions over the picked kinds, split along the three groups from step 2. Then ask which matters most, then second, with single-select questions over what remains; the third is what's left, so confirm it rather than asking. "Everything is important" is not an answer: ask which one wins when two conflict, using a concrete conflict from this system.

4. **The specific qualities.** For each of the three, ask a multi-select question over its specific qualities from `qualities.md`, with their plain meanings. Kinds with more than four specific qualities take two questions. If the user can't choose, the kind alone is enough for now: write the specific quality as "open" and add the question to the questions file.

   People describe what they need in their own words: "never lose money", "a full audit trail". One such need often covers specific qualities from more than one kind; `qualities.md` lists common phrases and the qualities they usually mean. Map the need to every quality it covers, then confirm the mapping and its place in the ranking with a single-select question, rather than deciding it yourself.

5. **Why, for each specific quality.** In conversation: who needs it, and what happens to them when it's missing. This is the part that stays true longest; don't skip it when the user is short of time.

6. **Scenarios someone could check.** For each goal, draft one or more as "when <event> under <conditions>, the system <response> within <measure>", one per distinct check, then ask the user to correct the numbers. A number the user doesn't know is written as open, never guessed, and goes into the system's questions file, `docs/questions/<id>.md` (its shape is in the `document-a-system` skill), with who might know. A need nobody has thought about yet ("we never considered attacks") is a question in the same file, not a scenario.

7. **What was ranked lower on purpose.** For each kind that was picked but ranked below the top three, ask why it can wait and whether it still has a limit it must not cross ("a catalog upload still finishes within 10 minutes"). Record the trade-off: it explains the design as much as the goals do. A limit becomes a scenario, marked as a limit rather than a goal.

When the user won't be interviewed and asks for "typical goals", say in one sentence that generic goals can't settle a trade-off, and offer the short version: mostly clicking, a few minutes per goal, in which you ask steps 2 to 5 (and step 1 if nothing describes the system yet) and draft the scenarios from what they said for them to correct. If they still decline, write nothing they didn't say: add the questions to the questions file instead.

## What to write

Quality goals: a table with one row per goal: priority, ISO kind and the specific qualities it covers, the goal for this system, and who needs it and why. One sentence above it: when two goals conflict, the higher one wins. Below it, the trade-offs from step 7. Open questions go in the questions file, not on the page; where a value is unknown, the page just says "open".

Quality scenarios: at least one per goal, plus those for limits on lower-ranked qualities, each with the event, the response and the measure; open numbers marked open.

Name each goal by its ISO term, with the system's own words in the goal: "Reliability / Recoverability: no movement is lost during an outage of up to 15 minutes".

## References

- The nine kinds of quality: [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html). The standard is paywalled; the specific qualities in `qualities.md` follow [Sonar's guide to it](https://www.sonarsource.com/resources/library/iso-iec-25010-explained/), checked against arc42's [Q42 page on the standard](https://quality.arc42.org/standards/iso-25010), which lists testability under flexibility where Sonar and the 2023 edition put it under maintainability.
- Real-world wording and example requirements: the [Q42 quality model](https://quality.arc42.org/) by Gernot Starke, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Top quality goals as the trade-offs that shape a system: arc42's [Introduction and Goals](https://docs.arc42.org/section-1/) and [Quality Requirements](https://docs.arc42.org/section-10/), by Gernot Starke and Peter Hruschka, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Architecture as fundamental properties and the principles behind them: [ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html)

This skill links to and paraphrases arc42 and Q42; it copies none of their text.
