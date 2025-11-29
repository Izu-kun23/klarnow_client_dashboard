# Klarnow Client Dashboard

A guided onboarding and project tracking system for Klarnow clients. Helps clients submit information for their Launch Kit (3-page site) or Growth Kit (4-6 page funnel with emails) over 14 days.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project set up (see configuration below)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Then update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Root page (redirects)
│   ├── layout.tsx              # Root layout
│   ├── login/                  # Client login
│   ├── home/                   # Home tab - project status
│   ├── launch-kit/             # Launch Kit tab
│   │   ├── onboarding/         # Onboarding wizard
│   │   └── build-tracker/      # Build tracker view
│   └── growth-kit/             # Growth Kit tab
│       ├── onboarding/
│       └── build-tracker/
├── components/
│   ├── ui/                     # UI components
│   ├── onboarding/             # Onboarding components
│   └── tracker/                # Build tracker components
├── utils/
│   └── supabase/               # Supabase client utilities
├── types/
│   └── project.ts              # TypeScript type definitions
├── lib/
│   └── utils.ts                # Utility functions
└── hooks/                      # React hooks
```

## Documentation

- `DEV_UX_SUMMARY.md` - Comprehensive technical specifications
- `KLARNOW_DASHBOARD_REQUIREMENTS.md` - Requirements and specifications

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
