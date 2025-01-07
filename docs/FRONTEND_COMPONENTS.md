# Frontend Component Structure

## Core Components

### Layout Components
- `MainLayout` - Main application layout with sidebar
- `AuthLayout` - Layout for authentication pages
- `Sidebar` - Channel and DM navigation
- `Header` - Top navigation bar

### Chat Components
- `ChatArea` - Main message display area
- `MessageInput` - Message composition
- `MessageItem` - Individual message display
- `ThreadView` - Thread discussion view
- `FileUpload` - File upload component
- `EmojiPicker` - Emoji selection

### Channel Components
- `ChannelList` - List of available channels
- `ChannelHeader` - Channel information header
- `ChannelMembers` - Member list for channel
- `CreateChannel` - Channel creation dialog

### User Components
- `UserProfile` - User profile display
- `UserStatus` - Status indicator
- `UserAvatar` - User avatar display
- `UserSettings` - User preferences

### Authentication Components
- `LoginForm` - User login
- `RegisterForm` - User registration
- `ResetPassword` - Password reset
- `OAuthButtons` - Social login options

### Shared Components
- `SearchBar` - Global search
- `LoadingSpinner` - Loading state
- `ErrorBoundary` - Error handling
- `Toast` - Notifications
- `Modal` - Reusable modal dialog

## Feature Organization

```
src/features/
├── auth/
│   ├── components/
│   ├── hooks/
│   └── slice.ts
├── channels/
│   ├── components/
│   ├── hooks/
│   └── slice.ts
├── messages/
│   ├── components/
│   ├── hooks/
│   └── slice.ts
└── users/
    ├── components/
    ├── hooks/
    └── slice.ts
```

## Styling Guidelines

### TailwindCSS Conventions
- Use custom utility classes for repeated patterns
- Maintain consistent spacing scale
- Use CSS variables for theme colors
- Follow mobile-first approach

### Component Example
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MessageItemProps {
  content: string
  sender: string
  timestamp: string
  className?: string
}

export function MessageItem({ 
  content, 
  sender, 
  timestamp, 
  className 
}: MessageItemProps) {
  return (
    <div className={cn(
      "flex gap-4 p-4 hover:bg-slate-50",
      className
    )}>
      {/* Component content */}
    </div>
  )
}
``` 