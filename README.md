# @xkye/case-study-kit

The shared Astro kit every Case Study builds on. It owns the page shell, the scroll-synced story column, the embedded Prototype and the Xkye credit. The project owns everything that makes it look like itself.

Renigo (`case-studies/renigo`) is the reference Case Study built on it.

## What the kit gives you

| Export | What it is |
| --- | --- |
| `CaseStudy.astro` | The page shell: `<head>` with social preview tags and favicons, and a `<footer>` that always ends with the Xkye credit. Slots: default (the page), `head` (fonts, icon sets), `footer` (anything before the credit). |
| `Story.astro` | The chapters column beside a sticky, viewport-scaled Prototype. Drives the Prototype from whichever chapter is mid-viewport, and wires every Try button. |
| `Chapter.astro` | One scroll-synced chapter. `goto` says where the Prototype goes while it's in view. |
| `FlowChapter.astro` | A Chapter rendered from a `flows` content-collection entry. |
| `TryButton.astro` | A button that re-drives the Prototype to its `goto`, even if that chapter is already active. On narrow screens it scrolls to the inline copy. |
| `PrototypeFrame.astro` | The phone-sized iframe. `sticky` is the one `Story` renders; without it, it's the inline copy shown on narrow screens. |
| `schema` | `flowSchema` (and `goto`) for a project's `flows` collection. |

### What the project still writes

- Its nav and hero, its bespoke chapters, its end sections and its footer text.
- Its CSS, fonts and icons. The kit's markup uses plain class names (`wrap`, `story`, `chapters`, `stage`, `chapter`, `num`, `try`, `phone-holder`, `inline-phone`, `flow-head`, `before-after`, `decisions`) and styles none of them.
- Its Prototype, as a standalone page in `public/`.

## Authoring: markup and content, mixed

- **Bespoke narrative chapters** (context, problem, people, design system…) are written as `<Chapter>` markup in the page, because each one has its own layout.
- **Key-flow chapters** repeat one shape, so they're Markdown entries in a `flows` content collection, rendered with `<FlowChapter>`:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { flowSchema } from '@xkye/case-study-kit/schema';

const flows = defineCollection({
  loader: glob({ base: './src/content/flows', pattern: '*.md' }),
  schema: flowSchema,
});

export const collections = { flows };
```

Renigo's `src/content/flows/02-facility-booking.md` (one decision cut):

```md
---
order: 2
title: "Facility booking"
icon: "calendar-event"
goto: {"screen": "facilities", "action": "book", "data": {"id": "pool"}}
before: "Walk to the admin office, ask if Saturday is free, write your name in the logbook."
after: "See open slots for the next 10 days and confirm in three taps."
decisions: [{"lead": "The confirm button says what you're booking", "text": " (\"Confirm · 18 Oct, 4:00 PM\") so there's no surprise afterwards."}]
try: "Try booking the pool"
---

Residents browse by category and book in a single sheet: pick a day, a two-hour slot and the number of guests.
```

`order` sets the sequence, `num` (optional) labels the chapter, `icon` is a [Tabler](https://tabler.io/icons) name, `goto` is where the Prototype goes, and `before`/`after`, `decisions` and `try` each render only when present. The Markdown body is the chapter's prose.

```astro
---
const flows = (await getCollection('flows')).sort((a, b) => a.data.order - b.data.order);
---
<Story prototype="prototype.html" messageType="renigo:goto" title="Renigo interactive prototype">
  <Chapter id="context" num="01 — Context" goto={{ tab: 'home' }}>…</Chapter>
  {flows.map((entry) => <FlowChapter entry={entry} />)}
</Story>
```

## The Prototype contract

The Prototype is embedded as an iframe and driven with `postMessage`. Every Prototype must:

1. **Work on its own.** It's a page in the project's `public/`, linked as "Open prototype" and usable full-screen.
2. **Listen for `<project>:goto`.** `Story` sends the message type you give it (`messageType`), with the active chapter's `goto` spread in:

   ```js
   { type: 'renigo:goto', tab?, screen?, sub?, action?, data? }
   ```

   | Field | Meaning |
   | --- | --- |
   | `tab` | The tab to show. |
   | `screen` | A screen pushed on top of the tab. |
   | `sub` | Sub-tab or filter state for that screen. |
   | `action` | An action to run once it has navigated. |
   | `data` | The action's argument. |

   The kit passes `goto` through untouched; the field meanings are the convention every Prototype follows, and each Prototype decides what its tabs, screens and actions are called. Ignore any message whose `type` isn't yours.
3. **Skip its own entry screens when embedded** (login, onboarding), so the first `goto` lands on something worth seeing. Renigo checks `window.self !== window.top`.

`Story` sends a message only when the active chapter changes, replays the active one when the iframe finishes loading, and always resends on a Try button.
