# @xkye/case-study-kit

> **Read-only Mirror.** This is maintained in Xkye Solutions' private monorepo and split here with its history. Changes made here are overwritten, so please don't open issues or pull requests. Builds on [`brand`](https://github.com/xkye-solutions/brand), also a Mirror.

The shared Astro kit every Case Study builds on. It owns the page shell, the scroll-synced story column, the embedded Prototype and the Xkye credit. The project owns everything that makes it look like itself.

Renigo (`case-studies/renigo`) is the reference phone Case Study and Kova (`case-studies/kova`) the reference desktop one.

## What the kit gives you

| Export | What it is |
| --- | --- |
| `CaseStudy.astro` | The page shell: `<head>` with social preview tags and favicons, and a `<footer>` that always ends with the Xkye credit. Slots: default (the page), `head` (fonts, icon sets, a `noindex`), `footer` (anything before the credit). `analyticsToken` (optional) adds the Cloudflare Web Analytics beacon. |
| `Story.astro` | The chapters column beside a sticky Prototype. Drives the Prototype from the active chapter, wires every Try button, and fills the desktop title bar. `device` is `phone` (default) or `desktop`. |
| `Chapter.astro` | One scroll-synced chapter. `goto` says where the Prototype goes while it's active. |
| `FlowChapter.astro` | A Chapter rendered from a `flows` content-collection entry. |
| `BeforeAfter.astro` | A before/after pair. `before`, `after`, and optional `beforeLabel`/`afterLabel` (default "Before"/"After"). |
| `Decisions.astro` | The design decisions behind a flow, written as a Markdown list. Each item gets a check. |
| `Tries.astro` | A row of Try buttons. |
| `TryButton.astro` | A button that re-drives the Prototype to its `goto`, or its chapter's if it has none, even if that chapter is already active. `icon` is a Tabler name. On narrow screens it drives the inline copy and scrolls to it. |
| `PrototypeFrame.astro` | The Prototype in its device frame. `sticky` is the one `Story` renders; without it, it's the inline copy shown on narrow screens, and anything in its slot shows and hides with it. |
| `schema` | `flowSchema` (and `goto`) for a project's `flows` collection. |

### Phone or desktop

`device` picks everything that follows from the Prototype's shape:

| | `phone` | `desktop` |
| --- | --- | --- |
| Frame | A 480×940 phone, scaled to the viewport height | A 1280×800 window with a title bar, scaled to the stage |
| Columns | Wide chapters, 440px stage | `clamp(364px, 27vw, 420px)` chapters, wide stage |
| A chapter is active | When it crosses the middle of the viewport | When its top reaches the upper third, so long chapters don't hand over early |
| Inline copy below | 1020px | 1100px |

The desktop title bar shows the Prototype's address (or title), a theme toggle, and a full-screen link; `host` is shown before the address.

### What the project still writes

- Its nav and hero, its bespoke chapters, its end sections and its footer text.
- Its colours, type and icons. The kit ships the story layout's structure (`story.css`: columns, the sticky stage, both frames, the narrow-screen switch) and styles nothing else. Its markup uses plain class names (`wrap`, `story`, `chapters`, `stage`, `stage-caption`, `chapter`, `num`, `try`, `tries`, `flow-head`, `flow-body`, `before-after`, `decisions`) for the project to style. The desktop title bar takes `--cs-bar-bg`, `--cs-bar-fg`, `--cs-bar-strong`, `--cs-mono` and `--cs-window-shadow`.
- Its Prototype, as a standalone page in `public/`.

## Authoring: markup and content, mixed

- **Bespoke narrative chapters** (context, problem, people, design system…) are written as `<Chapter>` markup in the page, because each one has its own layout.
- **Key-flow chapters** repeat one frame, so they're MDX entries in a `flows` content collection, rendered with `<FlowChapter>`. The frontmatter is the chapter; the body is free, in whatever order the flow needs, with `BeforeAfter`, `Decisions`, `Tries` and `TryButton` available without importing them.

The project adds `@astrojs/mdx` to its `integrations`, and:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { flowSchema } from '@xkye/case-study-kit/schema';

const flows = defineCollection({
  loader: glob({ base: './src/content/flows', pattern: '*.mdx' }),
  schema: flowSchema,
});

export const collections = { flows };
```

Renigo's `src/content/flows/02-facility-booking.mdx` (one decision cut):

```mdx
---
order: 2
title: "Facility booking"
icon: "calendar-event"
goto: {"screen": "facilities", "action": "book", "data": {"id": "pool"}}
---

Residents browse by category and book in a single sheet: pick a day, a two-hour slot and the number of guests.

<BeforeAfter before="Walk to the admin office, ask if Saturday is free, write your name in the logbook." after="See open slots for the next 10 days and confirm in three taps." />

<Decisions>

- **The confirm button says what you're booking** ("Confirm · 18 Oct, 4:00 PM") so there's no surprise afterwards.

</Decisions>

<TryButton>Try booking the pool</TryButton>
```

`order` sets the sequence, `num` (optional) labels the chapter, `icon` is a [Tabler](https://tabler.io/icons) name, and `goto` is where the Prototype goes. A flow with several Try buttons puts them in `<Tries>`, each with its own `icon` and `goto`, as Kova's do.

```astro
---
const flows = (await getCollection('flows')).sort((a, b) => a.data.order - b.data.order);
---
<Story prototype="prototype.html" project="renigo" title="Renigo interactive prototype">
  <Chapter id="context" num="01 — Context" goto={{ tab: 'home' }}>…</Chapter>
  {flows.map((entry) => <FlowChapter entry={entry} />)}
</Story>
```

## The Prototype contract

The Prototype is embedded as an iframe and driven with `postMessage`. Every Prototype must:

1. **Work on its own.** It's a page in the project's `public/`, linked as "Open prototype" and usable full-screen.
2. **Listen for `<project>:goto`.** `Story` sends it with the active chapter's `goto` spread in, using the `project` you give it:

   ```js
   { type: 'kova:goto', path?, tab?, screen?, view?, action?, data?, theme? }
   ```

   | Field | Meaning |
   | --- | --- |
   | `path` | An address, for Prototypes that have them. |
   | `tab` | The tab or Area to show. |
   | `screen` | A screen pushed on top of the tab. |
   | `view` | Which view of what's shown: a sub-tab, a filter or a side panel. Its value is up to the Prototype. |
   | `action` | An action to run once it has navigated. |
   | `data` | The action's argument. |
   | `theme` | `light` or `dark`. Reserved: the kit sends it on its own from the title bar's theme toggle. |

   The kit passes `goto` through untouched; a Prototype uses the fields that fit it and names its own tabs, screens, views and actions. Ignore any message whose `type` isn't yours.
3. **Skip its own entry screens when embedded** (login, onboarding), so the first `goto` lands on something worth seeing. Both Prototypes check `window.self !== window.top`.

A Prototype may also send messages back to its parent:

- **`<project>:ready`** once it can take a `goto`. `Story` then replays the active chapter (or the first, before any is active). A Prototype that never sends it is replayed once its iframe has loaded.
- **`<project>:status`** with `{ url?, title?, theme?, href? }` whenever it changes, to fill a desktop frame's title bar: it shows `url`, or else `title`, and hides when there's neither; the theme toggle shows once `theme` is reported; `href` is where the full-screen link opens (the Prototype page itself otherwise).

`Story` sends a message only when the active chapter changes, replays as above, and always resends on a Try button.
