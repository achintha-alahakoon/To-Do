# TaskFlow

A modern CRUD task management application built with React, TypeScript, and Supabase.

## Features

- **Create** - Add new tasks with title, description, priority, and status
- **Read** - View all tasks with real-time statistics and progress tracking
- **Update** - Edit existing tasks directly from the task cards
- **Delete** - Remove tasks with confirmation dialogs
- **Filter** - View tasks by status (All, To Do, In Progress, Done)
- **Progress Tracking** - Visual progress bar and completion statistics

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + REST API)
- **Database**: PostgreSQL with Row Level Security (RLS)

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd taskflow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the project root with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/           # React components
│   ├── TaskCard.tsx     # Individual task display
│   ├── TaskModal.tsx    # Create/edit task modal
│   └── ConfirmDialog.tsx# Delete confirmation
├── hooks/               # Custom React hooks
│   └── useTasks.ts     # Task CRUD operations
├── lib/                 # Utilities
│   └── supabase.ts     # Supabase client setup
├── types/              # TypeScript types
│   └── database.ts     # Database schema types
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Database Schema

### tasks table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Task title (required) |
| description | text | Task description |
| status | text | 'todo' \| 'in_progress' \| 'done' |
| priority | text | 'low' \| 'medium' \| 'high' |
| created_at | timestamptz | Timestamp of creation |
| updated_at | timestamptz | Last update timestamp |

## Security

- Row Level Security (RLS) enabled on all tables
- Anonymous access configured for demo purposes
- Environment variables properly secured in `.env` (not committed)

## License

MIT
