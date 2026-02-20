# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Astro documentation site** (docs.astro.build), built with **Astro + Starlight**. It's a multi-language documentation site with 14 supported languages and ~396 English documentation pages.

## Commands

```bash
# Install dependencies (requires pnpm)
pnpm install

# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build

# Quality checks
pnpm check            # TypeScript/Astro type checking
pnpm lint:eslint      # ESLint
pnpm lint:linkcheck   # Link validation (runs build first)
pnpm lint:linkcheck:nobuild  # Link validation (skip build)
pnpm lint:slugcheck   # Validate slugs match across languages
pnpm format           # Format with Prettier

# Content generation (pulls from withastro/astro repo)
pnpm docgen           # Generate configuration reference
pnpm docgen:errors    # Generate error reference
```

## Architecture

### Content System

All documentation lives in `src/content/docs/{lang}/` as `.mdx` files with YAML frontmatter. Content uses Astro's Content Collections with type-safe Zod schemas defined in `src/content.config.ts`.

**Schema types** determine frontmatter shape: `base`, `deploy`, `backend`, `cms`, `media`, `integration`, `migration`, `tutorial`, `recipe`. The `type` frontmatter field selects the schema.

**Sidebar** is configured in `astro.sidebar.ts` with 5 top-level tabs (Start, Guides, Reference, Integrations, Third-Party). Labels are translated via `src/content/nav/{lang}.ts` files.

### i18n

- 14 languages configured in `config/locales.ts`
- English (`en`) is the default/fallback language
- Each language has its own directory under `src/content/docs/`
- `i18nReady: true` frontmatter marks pages ready for translation
- Translation status tracked by Lunaria (`lunaria.config.ts`)
- Arabic (`ar`) uses RTL

### Path Alias

`~/*` maps to `./src/*` (configured in tsconfig.json).

### Starlight Customization

Custom component overrides live in `src/components/starlight/` — these replace default Starlight components (Hero, Sidebar, Footer, Search, etc.).

Landing page components are in `src/components/Landing/` (Card, ListCard, SplitCard, Discord).

### ImageGallery Component

`src/components/ImageGallery.astro` — responsive image grid with a built-in lightbox.

**Features:**
- Thumbnail grid (3 columns desktop, 2 on mobile)
- Lightbox with zoom-from-thumbnail open/close animation
- Navigation by clicking, keyboard arrows, and Prev/Next buttons
- Caption tooltip on thumbnail hover; caption + counter shown in lightbox footer
- Respects `prefers-reduced-motion`
- Images processed at build time via `astro:assets` → optimized WebP (thumb: 800px/80q, full: 90q)
- Lightbox teleported to `document.body` to escape any stacking context

**Props:**

```ts
interface ImageItem {
  src: string;      // Absolute path from project root, e.g. /src/assets/images/foo.png
  alt: string;      // Required alt text
  caption?: string; // Optional caption (HTML allowed); shown as tooltip and in lightbox footer
}

interface Props {
  images: ImageItem[];
}
```

**Important:** Images must live inside `/src/assets/` — the component uses `import.meta.glob` over that directory only.

**Usage in MDX:**

```mdx
import ImageGallery from '@components/ImageGallery.astro';

<ImageGallery images={[
  {
    src: '/src/assets/images/dashboard-overview.png',
    alt: 'Dashboard overview',
    caption: 'Main dashboard with live telemetry',
  },
  {
    src: '/src/assets/images/device-list.png',
    alt: 'Device list',
    caption: 'Filtered device list view',
  },
]} />
```

**Conditional rendering (PE/CE) — use HTML `<table>` inside JSX expressions, not markdown tables:**

```mdx
{props.product === Products.PE && (
  <ImageGallery images={[
    { src: '/src/assets/images/pe-feature.png', alt: 'PE feature', caption: 'PE only' },
  ]} />
)}
```

### Product System & Version Switcher

#### Products enum

All product identifiers live in `src/models/site.models.ts` as the `Products` enum:

| Enum value    | Label                  | URL prefix           | Notes                         |
|---------------|------------------------|----------------------|-------------------------------|
| `CE`          | Community Edition      | *(empty)*            | Default/root product          |
| `PE`          | Professional Edition   | `pe/`                | Main product list             |
| `PASS`        | Cloud                  | `paas/`              | Has sub-variant PASS_EU       |
| `PASS_EU`     | Cloud (EU)             | `paas/eu/`           | Sub-variant of PASS           |
| `EDGE`        | Edge                   | `edge/`              | Has sub-variant EDGE_PE       |
| `EDGE_PE`     | Edge Professional      | `edge/pe/`           | Sub-variant of EDGE           |
| `TRENDZ`      | Trendz Analytics       | `trendz/`            | Main product list             |
| `GW`          | IoT Gateway            | `iot-gateway/`       | Main product list             |
| `TBMQ`        | TBMQ Broker            | `mqtt-broker/`       | Has sub-variant TBMQ_PE       |
| `TBMQ_PE`     | TBMQ PE Broker         | `mqtt-broker/pe/`    | Sub-variant of TBMQ           |
| `MOBILE`      | Mobile Application     | `mobile/`            | Has sub-variant MOBILE_PE     |
| `MOBILE_PE`   | Mobile PE              | `mobile/pe/`         | Sub-variant of MOBILE         |
| `LICENSE`     | License Server         | `license-server/`    | Main product list             |

**Main product list** (shown in the primary switcher dropdown): CE, PE, PASS, EDGE, TRENDZ, GW, TBMQ, MOBILE, LICENSE.

**Sub-variants** (shown in a secondary dropdown when a parent is selected): PASS_EU, EDGE_PE, MOBILE_PE, TBMQ_PE.

#### URL Structure

```
/[lang/]docs/[product-prefix][page-slug]/
```

Examples:
- `/docs/getting-started/` — CE page
- `/docs/pe/getting-started/` — PE page
- `/docs/paas/getting-started/` — Cloud page
- `/uk/docs/pe/getting-started/` — PE page in Ukrainian

#### Content Directory Structure

Each product has its own mirror directory under `src/content/docs/docs/`:

```
src/content/docs/docs/
  ├── user-guide/        ← CE pages
  ├── pe/user-guide/     ← PE pages
  ├── paas/              ← Cloud pages
  ├── edge/              ← Edge pages
  ├── trendz/            ← Trendz pages
  ├── iot-gateway/       ← IoT Gateway pages
  ├── mqtt-broker/       ← TBMQ pages
  ├── mobile/            ← Mobile pages
  └── license-server/    ← License Server pages
```

#### Shared Content via _includes

To avoid duplicating content across products, documentation pages are thin wrappers that import a shared **include file** and pass the current `product` as a prop.

**Include file** (`src/content/_includes/docs/user-guide/digital-twins/relations.mdx`):
```mdx
import DocLink from '@components/DocLink.astro';
import { Products } from '~/models/site.models';

Shared content here, using `props.product` for conditional blocks.

{props.product === Products.PE && (
  <p>PE-only content</p>
)}
```

**Page file** (`src/content/docs/docs/pe/user-guide/digital-twins/relations.mdx`):
```mdx
---
title: Relations
description: Learn about relations in ThingsBoard
---

import Relations from '@includes/docs/user-guide/digital-twins/relations.mdx'
import { Products } from '~/models/site.models'

<Relations product={Products.PE}/>
```

The CE page would be identical but pass `product={Products.CE}`.

**Rules for _includes:**
- Never use markdown tables inside `{...}` JSX expressions — use HTML `<table>` instead (MDX parses markdown only inside JSX angle-bracket tags, not curly braces)
- Use `props.product` (not `Astro.props`) inside include files since they receive props as a component
- Conditional blocks: `{props.product === Products.PE && (<>...</>)}` or ternary `{props.product === Products.CE ? <A/> : <B/>}`

#### DocLink Component

`src/components/DocLink.astro` — generates a product-aware internal link.

```mdx
import DocLink from '@components/DocLink.astro';

<DocLink product={props.product} path="user-guide/devices">Devices</DocLink>
```

Renders as `<a href="/docs/pe/user-guide/devices/"><b>Devices</b></a>` for PE, `/docs/user-guide/devices/` for CE, etc.

Props: `product` (required), `path` (required, without trailing slash), `bold` (default `true`), `target`.

### Custom Plugins

- `config/plugins/remark-fallback-lang.ts` — marks untranslated content
- `config/plugins/rehype-tasklist-enhancer.ts` — enhanced task lists
- `config/plugins/llms-txt.ts` — generates llms.txt
- `config/plugins/smoke-test.ts` — build validation

### Dynamic Data Collections

- `contributors` — weekly contributor data from JSON
- `packages` — live npm versions from fast-npm-meta API
- `astroContributors` — top contributors from astro.badg.es

### Generated Content

Configuration reference and error docs are auto-generated from the Astro source repo via `pnpm docgen` and `pnpm docgen:errors`. Do not edit these manually.

### Pages vs Content

- `src/content/docs/` — documentation pages rendered by Starlight
- `src/pages/` — special routes: root redirect, language redirects, 404, OG image generation
- `src/pages/[lang]/` — dynamic per-language routes (index, install, tutorial redirects)

## Code Style

- Tabs for indentation in code files; spaces for JSON, Markdown, MDX, YAML, TOML
- Prettier with `prettier-plugin-astro`, printWidth 100, single quotes, trailing commas
- ESLint flat config with TypeScript and Astro plugins

## CI Checks

PRs run: `astro check`, `eslint`, `slugcheck`, `linkcheck`. All must pass.
