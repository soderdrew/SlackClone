# Technical Setup Guide

## 1. System Architecture

### 1.1 Frontend
- React + TypeScript for UI
- Vite as build tool
- TailwindCSS for styling
- shadcn/ui for component library
- Redux for state management
- Socket.io-client for real-time communication
- React Router for navigation

### 1.2 Backend
- Node.js with Express
- Socket.io for WebSocket connections
- MongoDB for primary database
- Redis for caching and presence
- AWS S3 for file storage

### 1.3 Infrastructure
- Docker for containerization
- Nginx for reverse proxy
- PM2 for process management
- GitHub Actions for CI/CD

## 2. Setup Checklist

### 2.1 Initial Setup
- [ ] Create GitHub repository
- [ ] Set up project structure
- [ ] Initialize package.json
- [ ] Configure ESLint and Prettier
- [ ] Set up TypeScript
- [ ] Configure environment variables
- [ ] Set up Docker configuration

### 2.2 Frontend Setup
- [ ] Create React + TypeScript application using Vite:
  ```bash
  npm create vite@latest client -- --template react-ts
  cd client
  ```
- [ ] Install and configure TailwindCSS:
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Configure TailwindCSS (tailwind.config.js):
  ```js
  /** @type {import('tailwindcss').Config} */
  module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        keyframes: {
          "accordion-down": {
            from: { height: 0 },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: 0 },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
  ```
- [ ] Add TailwindCSS to CSS (src/index.css):
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [ ] Install and configure shadcn:
  ```bash
  npx shadcn-ui@latest init
  ```
  When prompted, select:
  - Style: Default
  - Base color: Slate
  - CSS variables: Yes
  - React Server Components: No
  - Directory: src/components
  - Import alias: @/components

- [ ] Install core dependencies:
  ```bash
  npm install @reduxjs/toolkit react-redux socket.io-client react-router-dom axios clsx class-variance-authority tailwind-merge
  ```
- [ ] Install development dependencies:
  ```bash
  npm install -D @types/node prettier prettier-plugin-tailwindcss
  ```
- [ ] Create tsconfig paths (tsconfig.json):
  ```json
  {
    "compilerOptions": {
      // ... other options ...
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```
- [ ] Set up project structure:
  ```
  src/
  ├── components/
  │   ├── ui/          # shadcn components
  │   └── shared/      # shared components
  ├── features/        # feature-based components
  ├── hooks/           # custom hooks
  ├── lib/            # utilities and configurations
  ├── store/          # Redux store
  ├── types/          # TypeScript types
  └── pages/          # route pages
  ```
- [ ] Install commonly used shadcn components:
  ```bash
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add input
  npx shadcn-ui@latest add dialog
  npx shadcn-ui@latest add dropdown-menu
  npx shadcn-ui@latest add avatar
  npx shadcn-ui@latest add tooltip
  npx shadcn-ui@latest add separator
  ```
- [ ] Configure Vite for path aliases (vite.config.ts):
  ```typescript
  import path from "path"
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  })
  ```
- [ ] Set up routing structure
- [ ] Configure Redux store
- [ ] Create base components
- [ ] Set up WebSocket connection
- [ ] Implement authentication views
- [ ] Create main chat interface

### 2.3 Backend Setup
- [ ] Initialize Express application
- [ ] Install dependencies:
  ```bash
  npm install express socket.io mongoose redis @aws-sdk/client-s3 jsonwebtoken bcrypt cors dotenv
  ```
- [ ] Set up MongoDB connection
- [ ] Configure Redis
- [ ] Implement WebSocket server
- [ ] Set up authentication middleware
- [ ] Create API routes
- [ ] Configure file upload

### 2.4 Database Setup
- [ ] Design database schema
- [ ] Create MongoDB models
- [ ] Set up indexes
- [ ] Configure Redis cache
- [ ] Create database backup strategy

### 2.5 Authentication Implementation
- [ ] Set up JWT configuration
- [ ] Create authentication routes
- [ ] Implement password hashing
- [ ] Set up OAuth providers
- [ ] Create middleware

### 2.6 Real-time Features
- [ ] Configure Socket.io
- [ ] Implement message handling
- [ ] Set up presence system
- [ ] Add typing indicators
- [ ] Configure real-time notifications

### 2.7 File Management
- [ ] Set up S3 bucket
- [ ] Configure file upload
- [ ] Implement file preview
- [ ] Add image compression
- [ ] Set up CDN

### 2.8 Testing Setup
- [ ] Configure Jest
- [ ] Set up React Testing Library
- [ ] Create test database
- [ ] Write API tests
- [ ] Implement E2E tests

### 2.9 Deployment Preparation
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Create backup strategy

## 3. Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement feature
   - Write tests
   - Create PR
   - Code review
   - Merge

2. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance testing

3. **Deployment**
   - Staging deployment
   - Testing in staging
   - Production deployment
   - Monitoring

## 4. Project Structure 

# Storage Bucket Setup

1. Create the following storage buckets in Supabase:
   - `avatars` - For user profile pictures
   - `attachments` - For file attachments in messages
   - `workspace-icons` - For workspace logos and icons

2. Configure bucket policies:
```sql
-- avatars bucket policy
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid() || '/avatar.*') = name
);

-- attachments bucket policy
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

-- workspace-icons bucket policy
CREATE POLICY "Workspace icons are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-icons');

CREATE POLICY "Workspace admins can upload icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-icons' AND
  auth.role() = 'authenticated'
);
```

3. Configure CORS policy for buckets:
```json
{
  "cors_rules": [
    {
      "allowed_origins": ["*"],
      "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      "allowed_headers": ["*"],
      "max_age_seconds": 3600
    }
  ]
}
``` 