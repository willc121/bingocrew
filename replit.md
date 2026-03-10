# Resolution Bingo

## Overview

Resolution Bingo is a social web application that allows groups of friends to share bingo cards for tracking goals and resolutions. Users can create groups, share a 5x5 bingo card template, track individual progress on completing squares, and receive real-time notifications when group members complete squares or achieve bingos.

The app supports both group-based bingo cards (shared template with individual progress) and personal bingo cards for solo goal tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Animations**: Framer Motion for card animations and page transitions
- **Special Effects**: canvas-confetti for celebration effects when achieving bingos

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via drizzle-kit with `db:push` command

### Key Data Models
- **Users**: Managed by Replit Auth with profile information
- **Groups**: Collections of users sharing a bingo card
- **Cards**: 5x5 bingo grids (25 items with center as FREE space)
- **Progress**: Individual user completion state per card
- **Events**: Activity log for completed squares and bingos
- **Notifications**: In-app notifications for group activity

### Build System
- **Development**: Vite dev server with HMR proxied through Express
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Build Script**: Custom `script/build.ts` handles both client and server builds

## External Dependencies

### Database
- PostgreSQL database (required, connection via `DATABASE_URL` environment variable)

### Authentication
- Replit Auth (OpenID Connect provider)
- Requires `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables

### Third-Party Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **Framer Motion**: Animation library for React
- **canvas-confetti**: Celebration effects
- **date-fns**: Date formatting utilities
- **html-to-image**: Export bingo cards as PNG/JPEG images

### Development Tools
- Replit-specific Vite plugins for development experience
- TypeScript for type checking across the full stack