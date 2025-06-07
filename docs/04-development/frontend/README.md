# Frontend Documentation

This directory contains documentation specific to the Next.js frontend implementation of MTK-Care.

## Overview

The frontend is built with Next.js 14+ and TypeScript, using modern React patterns and a component-based architecture. It integrates with the Django backend via REST APIs and uses Azure AD for authentication.

## Documentation Files

### [Next.js Conventions](./nextjs-conventions.md)
Coding standards and conventions for the Next.js application.

**Key topics:**
- Project structure
- Component patterns
- State management
- Routing conventions
- Performance optimizations

### [ShadCN Context](./ShadCN-context.md)
Guide for using the ShadCN UI component library in the project.

**Key topics:**
- Component usage
- Theming and customization
- Accessibility considerations
- Best practices

### [OpenAPI Type Generation](./openapi-type-generation.md)
How to generate TypeScript types from the backend's OpenAPI schema.

**Key topics:**
- Generation scripts
- Type usage in components
- Keeping types synchronized
- Custom type extensions

## Related Documentation

- [Frontend Deployment Guide](../../../frontend/DEPLOYMENT_AND_LOCAL_TESTING.md) - Deployment procedures
- [Authentication Overview](../authentication/overview.md) - Frontend auth integration

## Key Technologies

### Core Stack
- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **ShadCN UI**: Component library
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication library

### Project Structure
```
frontend/
├── src/
│   ├── app/           # App Router pages and layouts
│   ├── components/    # Reusable components
│   ├── services/      # API service layers
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   └── lib/           # Utility functions
├── public/            # Static assets
└── tests/             # Test suites
```

### Development Principles

1. **Type Safety**: Leverage TypeScript for all code
2. **Component Reusability**: Build modular, composable components
3. **Server Components**: Use where appropriate for performance
4. **Error Boundaries**: Graceful error handling
5. **Accessibility**: WCAG 2.1 AA compliance

### Key Patterns

- **API Integration**: Centralized API client with Axios
- **Authentication**: Azure AD via NextAuth.js
- **State Management**: React Context for global state
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: SWR for client-side caching