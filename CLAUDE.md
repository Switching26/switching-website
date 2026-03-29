# Switching Formation — Design System & Development Guide

## Overview

This is the website for **Switching Formation** (switching-formation.fr), a Qualiopi-certified professional training center based in Paris 12th. The site is built as **static HTML** deployed on **Railway** from the GitHub repo `Switching26/switching-website`. Every page is a self-contained HTML file with inline CSS and JS — no build step, no framework, no dependencies.

**Your mission**: every modification must feel **premium, futuristic, Apple-level polished**. Think Apple.com meets a luxury SaaS startup. Never produce anything that looks generic, template-like, or "AI-generated". Every pixel matters.

---

## Design Philosophy

### Core Principles
1. **Luxury minimalism** — Clean, airy, generous white space. Let content breathe. Never crowd.
2. **Futuristic elegance** — Subtle glassmorphism, mesh gradients, grain textures, smooth kinetic animations. The future feels light, not heavy.
3. **Apple-level polish** — Every hover state, every transition, every border-radius is deliberate. No detail is too small.
4. **Depth and dimension** — Use layering (z-index, shadows, blurs, overlapping elements) to create a sense of 3D space on a 2D page.
5. **Motion with purpose** — Every animation serves UX (reveals content, guides the eye, gives feedback). Never animate just to animate.

### What to NEVER do
- Generic card grids with no personality
- Flat, lifeless layouts with no depth
- Cookie-cutter hero sections
- Boring hover effects (just color change)
- Overuse of drop shadows without blur variation
- Walls of text without visual rhythm
- Stock UI patterns (Bootstrap-looking, Material-looking)
- Emojis as design elements

---

## Color System

```css
:root {
  /* Backgrounds */
  --bg: #FAFBFC;              /* Page background — NOT pure white */
  --surface: #FFFFFF;          /* Cards, elevated surfaces */
  --surface2: #F1F5F9;        /* Secondary surfaces, inputs */
  --glass: rgba(255,255,255,.7); /* Glassmorphism panels */

  /* Text */
  --text: #1E293B;            /* Primary text — slate-800 */
  --sub: #64748B;             /* Secondary text — slate-500 */
  --muted: #94A3B8;           /* Muted/tertiary — slate-400 */
  --white: #FFFFFF;           /* Text on dark backgrounds */

  /* Brand Accent */
  --accent: #10ABAF;          /* Primary teal — THE brand color */
  --accent2: #0E9599;         /* Darker teal for hover/active */
  --accent-gl: rgba(16,171,175,.12);  /* Accent glow (shadows, hover) */
  --accent-gl2: rgba(16,171,175,.06); /* Lighter glow (subtle bg) */

  /* Borders */
  --bd: rgba(0,0,0,.06);      /* Default border — barely visible */
  --bd2: rgba(0,0,0,.08);     /* Slightly stronger border */

  /* Radii */
  --r: 16px;                  /* Cards, large containers */
  --rs: 12px;                 /* Smaller elements, inputs, icons */
  --rf: 100px;                /* Full round — pills, CTAs */

  /* Motion */
  --e: cubic-bezier(.16,1,.3,1); /* Signature easing — snappy spring */
}
```

### Domain Colors (for formation categories)
Each training domain has its own color, used for icon backgrounds, card accents, and hover effects:

| Domain | Color | CSS Variable Pattern |
|--------|-------|---------------------|
| Langues | `#3B82F6` (Blue) | `--fc-c:#3B82F6` |
| Bureautique | `#10B981` (Emerald) | `--fc-c:#10B981` |
| Graphisme | `#F59E0B` (Amber) | `--fc-c:#F59E0B` |
| Web & Digital | `#A855F7` (Purple) | `--fc-c:#A855F7` |
| Compta & Paie | `#FB923C` (Orange) | `--fc-c:#FB923C` |
| IA | `#6366F1` (Indigo) | `--fc-c:#6366F1` |
| Bilan de compétences | `#F43F5E` (Rose) | `--fc-c:#F43F5E` |

For each domain color, generate consistent transparent variants:
- Icon background: `rgba(R,G,B,.06)`
- Border: `rgba(R,G,B,.15)`
- Hover glow: `color-mix(in srgb, var(--fc-c) 30%, transparent)`

### Dark Sections
Footer and CTA boxes use a dark palette:
- Footer background: `#0F172A` (slate-900)
- CTA gradient: `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)`
- CTA mesh overlay: radial gradients with `rgba(16,171,175,.15)` and `rgba(99,102,241,.1)`

---

## Typography

### Font Stack
```css
--f: 'Almarai', sans-serif;  /* Body text — Arabic-compatible, clean */
```

**Google Fonts import:**
```
Almarai: 300, 400, 700, 800
Poppins: 500, 600, 700, 800
```

### Usage Rules
| Element | Font | Weight | Size | Tracking |
|---------|------|--------|------|----------|
| H1 (hero) | Poppins | 600 | 42px | -0.04em |
| H2 (section) | Poppins | 600 | 36px | -0.03em |
| H3 (card) | Poppins | 600 | 16-17px | -0.01em |
| Body text | Almarai | 400 | 14-16px | normal |
| Caption/meta | Almarai | 500-600 | 11-13px | 0.02-0.15em |
| Section tag | Almarai | 700 | 11px | 0.15em, uppercase |
| CTA buttons | Almarai | 700 | 13-15px | normal |

### Gradient Text (`.glow`)
The brand signature for accent words in headings:
```css
.glow {
  background: linear-gradient(135deg, var(--accent), #0E9599, #3DC8C9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Layout System

### Container
```css
.w { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
```
On mobile (≤768px): `padding: 0 18px`

### Grid Patterns
- **4-column**: Certifications, stats → `repeat(4, 1fr)` gap 12px
- **3-column**: Mission cards, e-learning features → `repeat(3, 1fr)` gap 14px
- **2-column**: Hero grids, approach sections → `1.1fr .9fr` or `1fr 1fr` gap 32-40px
- **Centered 3**: Use `.fg3` pattern → `max-width: calc(75% - 3px); margin: 0 auto`

### Breakpoints
```css
@media (max-width: 1024px) { /* Tablet: 2-col grids, stack hero */ }
@media (max-width: 768px)  { /* Mobile: 1-col everything, smaller type */ }
```

---

## Component Library

### Topbar
Thin bar above header. White background, `13px` text, muted color. Contains Google review link with `★★★★★` stars (#FBBF24) and phone number in accent color.

### Header (Sticky Glassmorphism)
```css
header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(250,251,252,.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--bd);
}
header.scrolled { background: rgba(250,251,252,.95); }
```
- Logo: SVG from Railway (`https://web-production-0c02.up.railway.app/static/logo-switching.svg`), height 38px
- Nav links: 14px, 500 weight, subtle hover (accent-gl2 bg)
- Active link: accent color, 600 weight
- CTA button: accent bg, white text, full-round, 700 weight

### Section Headers
```html
<div class="sec-head">
  <div class="sec-tag">Label</div>
  <div class="sec-h2">Title with <span class="glow">accent</span></div>
</div>
```
- Tag: uppercase, 11px, 700 weight, accent color, with `::before`/`::after` decorative lines (20px wide, accent, 30% opacity)
- Always centered (`text-align: center`)

### Cards (Formation/Feature)
Every card MUST have:
1. **Border**: `1px solid var(--bd)` — barely visible at rest
2. **Radius**: `var(--r)` (16px)
3. **Hover border**: `rgba(16,171,175,.2)` — accent tint
4. **Hover transform**: `translateY(-4px)` — float up
5. **Hover shadow**: `0 10px 32px rgba(0,0,0,.08)` — depth
6. **Transition**: `all .4s var(--e)` — spring easing
7. **Top accent bar** (optional): 3px colored bar that fades in on hover

### Icon Containers
```css
.icon-wrap {
  width: 48px; height: 48px;
  border-radius: var(--rs);
  display: flex; align-items: center; justify-content: center;
  background: rgba(color, .06);
  border: 1px solid var(--bd);
}
/* On card hover: */
.card:hover .icon-wrap {
  background: var(--card-color);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 0 20px color-mix(in srgb, var(--card-color) 30%, transparent);
}
```

### Buttons
**Primary (glow):**
```css
.btn-glow {
  background: var(--accent); color: #fff;
  padding: 13px 28px; border-radius: var(--rf);
  font-weight: 700; font-size: 15px;
  box-shadow: 0 0 20px var(--accent-gl);
}
.btn-glow:hover {
  filter: brightness(1.15);
  transform: translateY(-2px);
  box-shadow: 0 0 40px rgba(16,171,175,.25);
}
```

**Secondary (ghost):**
```css
.btn-ghost {
  background: transparent; color: var(--text);
  border: 1px solid var(--bd2);
  padding: 13px 28px; border-radius: var(--rf);
}
.btn-ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-gl2);
}
```

Both buttons include an arrow SVG icon that slides right 3px on hover.

### Footer
Dark background `#0F172A`. 4-column grid (1.3fr 1fr 1fr 1fr). Links in `var(--sub)`, hover to accent. Bottom bar with copyright + legal links separated by `•` dots.

---

## Effects & Animations

### Grain Overlay (Signature)
Applied on `body::after` as a fixed full-screen layer. Creates a premium film-grain texture:
```css
body::after {
  content: ''; position: fixed; inset: 0;
  background: url("data:image/svg+xml,...feTurbulence...");
  pointer-events: none; z-index: 9999; opacity: .08;
}
```
**NEVER remove this.** It's part of the brand identity.

### Mesh Gradient Backgrounds
Hero sections use layered radial gradients for ambient depth:
```css
background:
  radial-gradient(ellipse 60% 50% at 20% 50%, rgba(16,171,175,.07), transparent),
  radial-gradient(ellipse 40% 60% at 80% 30%, rgba(99,102,241,.05), transparent),
  radial-gradient(ellipse 50% 40% at 50% 90%, rgba(244,63,94,.03), transparent);
```

### Scroll Reveal
IntersectionObserver-based. Elements start with `opacity:0; transform:translateY(20px)` and animate to visible:
```css
.rv { opacity:0; transform:translateY(20px); transition: opacity .7s var(--e), transform .7s var(--e); }
.rv.vis { opacity:1; transform:translateY(0); }
.rv1 { transition-delay: .08s; }
.rv2 { transition-delay: .16s; }
.rv3 { transition-delay: .24s; }
```

### Separator Lines
Between sections, use a gradient fade line:
```css
.sep::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--bd2), transparent);
}
```

---

## Advanced Effects (Use When Appropriate)

### 3D Tilt on Hover
For hero images or feature cards that need extra wow:
```css
.tilt-card {
  perspective: 1000px;
  transform-style: preserve-3d;
}
.tilt-card:hover {
  transform: rotateX(2deg) rotateY(-3deg) translateY(-6px);
  box-shadow: 12px 16px 48px rgba(0,0,0,.12);
}
```

### Floating Elements
Subtle infinite float animation for decorative elements:
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}
.float { animation: float 6s ease-in-out infinite; }
```

### Glow Pulse
For CTAs or important elements that need to attract attention:
```css
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px var(--accent-gl); }
  50% { box-shadow: 0 0 40px rgba(16,171,175,.25); }
}
```

### Glassmorphism Panels
When creating elevated UI elements:
```css
.glass-panel {
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--bd2);
  border-radius: var(--r);
}
```

### Staggered Grid Animations
When revealing a grid of items, stagger them:
```css
.grid-item:nth-child(1) { transition-delay: 0s; }
.grid-item:nth-child(2) { transition-delay: .08s; }
.grid-item:nth-child(3) { transition-delay: .16s; }
/* etc. */
```

### Smooth Counter Animation
For stats/numbers sections:
```javascript
function animateCounter(el, target, duration) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

### Parallax Depth Layers
For hero sections with multiple background elements:
```javascript
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.querySelector('.hero-mesh').style.transform = `translateY(${y * 0.3}px)`;
});
```

---

## SVG Icons

All icons are inline SVGs using Feather/Lucide style:
- `viewBox="0 0 24 24"`
- `fill="none"`, `stroke="currentColor"`, `stroke-width="1.5"`
- `stroke-linecap="round"`, `stroke-linejoin="round"`
- Size controlled by parent container (typically 18-24px via width/height on the SVG or a wrapper)

**NEVER use icon fonts, emoji, or external icon libraries.** Always inline SVG.

---

## Email Encoding

To prevent Cloudflare email harvesting, always encode the `@` symbol:
```html
contact&#64;switchingformation.com
```
NEVER use a plain `mailto:` link or write the `@` character directly.

---

## Images

All current images are hosted on Wix Static (`static.wixstatic.com`). Logo SVG is on Railway:
```
https://web-production-0c02.up.railway.app/static/logo-switching.svg
```

Image styling rules:
- Always `border-radius: var(--r)` (16px)
- Always `border: 1px solid var(--bd)`
- Always a shadow: `box-shadow: 0 12px 36px rgba(0,0,0,.1)` minimum
- Use `object-fit: cover` for photos

---

## Phone Number

The correct phone number is **06 95 18 50 57**.
⚠️ NEVER use 06 95 18 **30** 57 — this is a wrong number that must never appear.

Link format: `<a href="tel:+33695185057">06 95 18 50 57</a>`

---

## Page Structure Template

Every page follows this structure:
```
1. Topbar (Avis Google + phone)
2. Header (sticky glassmorphism + nav)
3. Page content (hero → sections → CTA)
4. Footer (dark, 4-col grid)
5. Chat bubble (fixed bottom-right, accent)
6. Script (IntersectionObserver + scroll header)
```

---

## Quality Checklist

Before committing any change, verify:

- [ ] Design feels premium, futuristic, Apple-level
- [ ] All CSS variables from `:root` are used (no hardcoded colors)
- [ ] Hover states on ALL interactive elements
- [ ] Transitions use `var(--e)` easing
- [ ] Cards lift on hover (`translateY(-4px)` + shadow)
- [ ] Scroll reveal (`.rv` classes) on new sections
- [ ] Section separators (gradient lines) between sections
- [ ] Grain overlay preserved
- [ ] Glassmorphism header preserved
- [ ] Responsive at 1024px and 768px breakpoints
- [ ] Phone number is 06 95 18 50 57 (NOT 30 57)
- [ ] Email uses `&#64;` encoding
- [ ] All fonts loaded from Google Fonts
- [ ] Inline SVG icons (no emoji, no icon fonts)
- [ ] Gradient text `.glow` for accent words in h1/h2
- [ ] Footer links point to correct URLs
- [ ] No external JS dependencies
- [ ] Animations are smooth (60fps, GPU-accelerated transforms)
- [ ] The page feels ALIVE — not static, not flat
