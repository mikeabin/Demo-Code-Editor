# WebCode Editor

## Overview

This is a full-stack web-based code editor application that allows users to create, edit, and manage web development projects. It provides a VS Code-like interface with file exploration, code editing with Monaco Editor, and live preview functionality. The application supports multiple project templates and offers real-time preview of HTML/CSS/JavaScript projects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Code Editor**: Monaco Editor integrated via CDN for syntax highlighting and code editing
- **Styling**: Tailwind CSS with CSS variables for theming, supporting dark mode by default

### Backend Architecture
- **Server**: Express.js with TypeScript
- **API Design**: RESTful API with endpoints for project CRUD operations and file management
- **Development Setup**: Vite middleware integration for hot module replacement in development
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Logging**: Custom request/response logging for API endpoints

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Projects table storing project metadata and file structures as JSONB
- **File Storage**: Files stored as JSON tree structure within the database rather than filesystem
- **Migrations**: Drizzle Kit for database schema migrations

### Key Features
- **Project Management**: Create projects from templates (blank, HTML5, landing page, portfolio, blog)
- **File System**: Virtual file system with support for folders and files
- **Code Editor**: Monaco Editor with syntax highlighting for HTML, CSS, JavaScript
- **Live Preview**: Real-time preview panel with responsive viewport simulation
- **Tab Management**: Multi-tab interface for opening and switching between files

### Component Architecture
- **Layout Components**: Toolbar, FileExplorer, EditorArea, PreviewPanel, StatusBar
- **Modal Components**: NewProjectModal for project creation
- **UI Components**: Comprehensive component library from shadcn/ui
- **Hooks**: Custom hooks for Monaco Editor integration and mobile responsiveness

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with React DOM
- **Express.js**: Backend web server framework
- **TypeScript**: Type safety across the entire application
- **Vite**: Frontend build tool and development server

### Database and ORM
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library for consistent iconography

### Code Editor
- **Monaco Editor**: VS Code's editor component loaded via CDN
- **Custom Monaco integration**: Hook-based wrapper for React integration

### State Management and Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

### Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution for development server
- **PostCSS**: CSS processing with Autoprefixer

### Routing and Navigation
- **Wouter**: Lightweight React router for client-side navigation

The application uses a monorepo structure with shared TypeScript types and schemas, enabling type safety across the full stack while maintaining clear separation between client and server code.