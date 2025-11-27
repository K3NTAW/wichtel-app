# 🎁 Wichteln App

A gift exchange app where groups can be created and shared without login. Participants answer questions to help their Wichtel choose the perfect gift.

## Features

- ✅ Create shareable groups (no login required)
- ✅ Join groups with a share code
- ✅ Participants provide name and answer questions (hobbies, interests, etc.)
- ✅ Random Wichtel assignment algorithm
- ✅ View your assigned Wichtel with their answers

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Copy your Supabase URL and anon key

3. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Supabase** - Database
- **Zod** - Validation
- **React Hook Form** - Form handling

## Database Schema

- `groups` - Stores group information and share codes
- `participants` - Stores participant names and answers
- `assignments` - Stores the Wichtel pairings (who gets whom)

# wichtel-app
