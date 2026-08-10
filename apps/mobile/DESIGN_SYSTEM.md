# Mobile App Design System

## Core Philosophy

Clean, minimal, purposeful. Every element exists for a reason. White space is a feature, not a waste.

### Design Principles
1. **Light & Airy** — Use white space generously
2. **Soft Shadows** — Subtle elevation, never harsh
3. **Purple Accent** — Vibrant but used sparingly
4. **Progress Visibility** — Show progress with rings and bars
5. **Pastel Cards** — Color-coded task groups

---

## Typography Rules

- Use **one font family** (system font)
- Maximum **4 font sizes** and **2-3 font weights**
- Create hierarchy with size, weight, and color — not decoration

### Font Scale (4 sizes only)
| Name | Size | Weight | Use |
|------|------|--------|-----|
| Hero | 32px | Bold (700) | Main headlines, greeting |
| Title | 20px | SemiBold (600) | Section titles, card titles |
| Body | 16px | Regular (400) | Primary content, messages |
| Caption | 13px | Regular (400) | Secondary info, labels |

---

## Color System

### Light Theme Palette
| Role | Color | Usage |
|------|-------|-------|
| Background | `#FAFAFA` | App background |
| Surface | `#FFFFFF` | Cards, elevated elements |
| Text Primary | `#1A1A2E` | Headlines, body text |
| Text Secondary | `#4A4A68` | Descriptions |
| Text Tertiary | `#8E8EA9` | Labels, hints |
| Border | `#E5E5EF` | Dividers, input borders |

### Primary Accent - Purple
| Variant | Color | Usage |
|---------|-------|-------|
| Primary | `#7C3AED` | CTAs, FAB, active states |
| Light | `#A78BFA` | Toggle tracks |
| Muted | `rgba(124, 58, 237, 0.1)` | Chip backgrounds |
| Subtle | `rgba(124, 58, 237, 0.05)` | Hover states |

### Pastel Cards
| Name | Background | Border | Use |
|------|------------|--------|-----|
| Pink | `#FDF2F8` | `#FBCFE8` | Content/creative tasks |
| Yellow | `#FFFBEB` | `#FDE68A` | Analytics/review |
| Blue | `#EFF6FF` | `#BFDBFE` | Community |
| Green | `#ECFDF5` | `#A7F3D0` | Completed/publish |
| Purple | `#F5F3FF` | `#DDD6FE` | Brand deals |

### Semantic Colors
| Type | Color | Muted |
|------|-------|-------|
| Success | `#10B981` | `rgba(16, 185, 129, 0.1)` |
| Warning | `#F59E0B` | `rgba(245, 158, 11, 0.1)` |
| Error | `#EF4444` | `rgba(239, 68, 68, 0.1)` |
| Info | `#3B82F6` | `rgba(59, 130, 246, 0.1)` |

---

## Spacing (8-Point Grid)

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Icon gaps, tight spacing |
| sm | 8px | Related elements, chip padding |
| md | 16px | Card padding, standard gaps |
| lg | 24px | Section margins |
| xl | 32px | Major section gaps |
| 2xl | 48px | Large separations |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 8px | Small elements, icons |
| md | 12px | Buttons, inputs |
| lg | 16px | Small cards |
| xl | 24px | Main cards, FAB |
| 2xl | 32px | Tab bar |
| full | 9999px | Pills, chips, avatars |

---

## Shadows (Soft & Subtle)

All shadows use dark text color (`#1A1A2E`) at low opacity:

| Level | Offset | Opacity | Radius |
|-------|--------|---------|--------|
| sm | 0, 1 | 0.04 | 3 |
| md | 0, 2 | 0.06 | 8 |
| lg | 0, 4 | 0.08 | 16 |
| fab | 0, 4 | 0.30 | 12 (purple tinted) |

---

## Component Patterns

### Cards
- Border radius: 24px
- No border (use shadow instead)
- Padding: 16-24px
- Subtle shadow (md level)

### Buttons
- Primary: Purple accent, white text, 52px height, 24px radius
- Secondary: Purple muted background, 52px height
- Minimum tap target: 44×44px

### Progress Rings
- Track color: `#E5E5EF`
- Fill: Purple, amber, or blue depending on context
- Stroke width: 6px
- Show percentage in center

### Pastel Task Cards
- Use color to categorize (not just labels)
- Include mini progress bar
- Subtle border matching the pastel

### Tab Bar
- Floating pill design
- Center FAB button (purple, +56px size)
- Large border radius (32px)
- White background with shadow

---

## Thumb Zone Optimization

```
┌─────────────────────┐
│   Header/Stats      │  ← Comfortable to view
│                     │
│    CONTENT AREA     │  ← Scrollable
│                     │
│─────────────────────│
│ ┌───────────────┐   │
│ │ ▢  ▢  ⊕  ▢  ▢ │   │  ← Easy (thumb zone)
│ └───────────────┘   │     Center FAB
└─────────────────────┘
```

- Center FAB for primary action
- Navigation in bottom bar
- Content scrolls above fixed bar

---

## Screen-Specific Guidelines

### Dashboard
- Large greeting with user name
- Progress rings row (3 metrics)
- 2x2 pastel card grid for projects
- Task list below

### Calendar
- Week strip selector (horizontal)
- Color-coded event cards
- Summary stats at bottom

### Pipeline
- Stage tabs (horizontal scroll)
- Content cards with thumbnails
- Mini progress rings

### Chat
- Clean header with AI icon
- Pastel quick-start cards
- Soft shadow on message bubbles
- Floating input with round send button

### Settings
- Profile card (centered, avatar)
- Connected accounts section
- Settings grouped by category
- Sign out in error color

---

## Anti-Patterns to Avoid

- ❌ Dark theme (we're using light)
- ❌ Harsh shadows
- ❌ More than 4 font sizes
- ❌ Borders on white cards (use shadows)
- ❌ Over-decorating with icons
- ❌ Overusing accent color
- ❌ Non-8pt spacing values
- ❌ Small tap targets
