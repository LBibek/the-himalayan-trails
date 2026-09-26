# Feature Specification 06: Stories (Trekker Journal & Community Stories)

> **Features:** Stories  
> **Target Routes:** `/stories`, `/stories/[id]`, `/stories/new`  
> **Module Status:** Planned  

---

## 1. Overview & Purpose
Stories is the community narrative and media hub of **The Himalayan Trails**. Trekkers can publish rich trip reports, photo journals, tea house reviews, gear lessons, and cultural reflections. Readers can upvote, bookmark, filter by trail/region, and interact with authors.

---

## 2. Route & Component Architecture

### Routes
- `/stories` — Editorial magazine feed of trekker stories
- `/stories/[id]` — Immersive story reading page with rich text, high-res image galleries, and author bio
- `/stories/new` — Rich markdown story creator & editor with photo upload support

### Component Hierarchy
```
src/app/stories/
├── page.tsx                    # Community stories feed & featured editorial hero
├── new/page.tsx                # Story creation workstation
└── [id]/page.tsx               # Immersive story view

src/components/stories/
├── StoryFeaturedHero.tsx       # Full-bleed featured story with gradient overlay
├── StoryGridCard.tsx           # Story summary card (Image, Title, Author Avatar, Read Time, Likes)
├── StoryMarkdownRenderer.tsx   # Custom markdown reader with typography styling & inline map links
├── StoryEditor.tsx             # WYSIWYG / Markdown live preview editor
├── PhotoMasonryGallery.tsx     # Responsive photo grid for high-res trek imagery
└── StoryCommentSection.tsx     # Discussion section with nested comments & upvotes
```

---

## 3. UI / UX Design & Micro-Interactions

- **Editorial Magazine Aesthetic:** Medium-style minimalist typography, large full-bleed header images, floating reading progress indicator bar at the top of the browser.
- **Trek Tagging:** Each story links to the associated trail (e.g. `Everest Base Camp Trek`), landmark, and trekking season.
- **Engagement Interactions:** Heart upvote animation, bookmark story button, social share drawer (WhatsApp, X, Facebook, Copy link).

---

## 4. Data Models & Schemas

### Story Schema (`Story`)
```typescript
export interface Story {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  contentMarkdown: string;
  coverImageUrl: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    bio: string;
  };
  associatedTrailId?: string;
  region: string;
  readTimeMinutes: number;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  publishedAt: string;
}
```

---

## 5. API Endpoints Contract

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/stories` | Fetch stories feed | `region`, `trailId`, `tag`, `page`, `limit` |
| `GET` | `/api/stories/:id` | Get single story with comments | None |
| `POST` | `/api/stories` | Create new story | `Omit<Story, 'id' \| 'publishedAt'>` |
| `POST` | `/api/stories/:id/like` | Toggle upvote | None |

---

## 6. Acceptance Criteria

- [ ] Reading progress bar dynamically tracks scroll position on `/stories/[id]`.
- [ ] Story editor supports live split-screen preview.
- [ ] Responsive masonry photo layout adjusts to screen width smoothly.
- [ ] Fast client side page transitions using Next.js `<Link>` components.
