# Database Interface Application

## Overview

This is a full-stack database management interface built with React, Express, and TypeScript. The application provides a dynamic, generic interface for interacting with PostgreSQL databases, allowing users to view, create, edit, and delete records from any table without requiring custom code for each table structure. It features automatic table discovery, dynamic form generation, and comprehensive CRUD operations through a clean, modern UI built with shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 18 with TypeScript, using Vite as the build tool and development server. The UI is built with shadcn/ui components (Radix UI primitives) and styled with Tailwind CSS.

**State Management**: Uses React Query (@tanstack/react-query) for server state management, caching, and synchronization. Local component state is managed with React hooks.

**Routing**: Implements client-side routing with Wouter, a lightweight routing library. The application currently has a single main route for the database interface.

**Component Structure**: 
- Modular component architecture with reusable UI components
- Database-specific components for table management, data display, and record manipulation
- Form handling with React Hook Form and Zod validation

### Backend Architecture

**Server Framework**: Express.js with TypeScript, providing RESTful API endpoints for database operations.

**Database Layer**: Uses Drizzle ORM with Neon serverless PostgreSQL driver for database interactions. The system supports dynamic table discovery and generic CRUD operations without requiring predefined schemas for user tables.

**API Design**: RESTful endpoints organized by resource type:
- `/api/database/test` - Connection testing
- `/api/database/tables` - Table discovery and metadata
- `/api/database/tables/:tableName/records` - Record CRUD operations

**Dynamic Operations**: The system can introspect database tables at runtime and perform operations on any table structure, making it database-agnostic for user tables.

### Data Storage Solutions

**Primary Database**: PostgreSQL accessed through Neon serverless platform, configured via DATABASE_URL environment variable.

**ORM Strategy**: Drizzle ORM provides type-safe database access with support for dynamic queries. The schema definition includes both predefined system tables and dynamic user table handling.

**Migration Management**: Uses Drizzle Kit for database migrations with configuration pointing to shared schema files.

### Authentication and Authorization

**Current State**: No authentication system is implemented. The application assumes direct database access without user management or access controls.

**Session Management**: Basic session handling infrastructure is present (connect-pg-simple) but not actively used in the current implementation.

### External Dependencies

**Database**: Neon PostgreSQL serverless database accessed via @neondatabase/serverless driver
**UI Framework**: Radix UI primitives for accessible, unstyled components
**Styling**: Tailwind CSS for utility-first styling with custom CSS variables for theming
**Development Tools**: Vite for development server and build tooling, with Replit-specific plugins for development environment integration
**Form Handling**: React Hook Form with Hookform resolvers for form validation
**Date Utilities**: date-fns for date manipulation and formatting
**Validation**: Zod for runtime type validation and schema definition

The application is designed to be deployment-ready for production environments while maintaining an excellent development experience with hot module replacement and comprehensive error handling.