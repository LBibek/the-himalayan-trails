# Feature Specification 01: Authentication (Login & Sign Up)

> **Features:** Login & Sign Up  
> **Target Routes:** `/login`, `/signup`  
> **Module Status:** Planned  

---

## 1. Overview & Purpose
The Authentication module provides secure onboarding and user login for trekkers, local guides, and administrators. It enables personalized itinerary planning, story publishing, trail bookmarking, and offline GPX downloads.

---

## 2. Route & Component Architecture

### Routes
- `/login` — User sign-in page
- `/signup` — Registration flow with trekker experience profiling

### Component Hierarchy
```
src/app/(auth)/
├── layout.tsx                # Split-screen layout with mountain imagery backdrop
├── login/
│   └── page.tsx              # Login form container
└── signup/
    └── page.tsx              # Multi-step signup wizard container

src/components/auth/
├── LoginForm.tsx             # Email/Password & OAuth buttons
├── SignUpWizard.tsx          # Step 1: Account, Step 2: Trekker Profile, Step 3: Emergency Contact
├── SocialAuthButtons.tsx     # Google, Apple, Strava auth triggers
└── AuthBackgroundHero.tsx    # Dynamic high-res Himalayan imagery showcase
```

---

## 3. UI / UX Design & Micro-Interactions

- **Split Screen Layout:** 
  - Left Panel (45% width): Glassmorphic login card with tab switching (`Login` vs `Sign Up`).
  - Right Panel (55% width): High-resolution hero image slider featuring Annapurna Circuit, Everest Base Camp, and Langtang Valley with subtle parallax zoom.
- **Form UX Features:**
  - Password strength meter with real-time feedback (entropy, length, special characters).
  - Floating label inputs with instant inline validation state (valid green tick, error message).
  - "Remember Me" toggle and "Forgot Password?" modal popup.

---

## 4. State Management & Data Schema

### Form State (`SignUpFormData`)
```typescript
export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  trekkingExperience: 'beginner' | 'intermediate' | 'expert';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  agreeTerms: boolean;
}
```

### Authentication State (NextAuth / JWT Context)
- User object: `{ id, name, email, avatar, role, verifiedTrekker }`
- Token storage: Secure HTTP-only Cookie with refresh token rotation.

---

## 5. API Endpoints Contract

| Method | Endpoint | Description | Payload / Query |
|--------|----------|-------------|-----------------|
| `POST` | `/api/auth/login` | Authenticate user credentials | `{ email, password }` |
| `POST` | `/api/auth/register` | Create new trekker profile | `SignUpFormData` |
| `POST` | `/api/auth/oauth` | Social login callback | `{ provider, token }` |

---

## 6. Acceptance Criteria

- [ ] Successful validation prevents form submission if passwords do not match.
- [ ] OAuth integration with Google & Strava redirects seamlessly.
- [ ] Accessible WCAG AA compliant inputs with proper `aria-invalid` and screen-reader alerts.
- [ ] Dark/Light mode theme persistence across login states.
