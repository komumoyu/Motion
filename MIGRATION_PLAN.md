# Migration Plan: Convex to MySQL + PHP Backend

## Architecture Overview

### Current Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Convex (Real-time database)
- **Auth**: Clerk (currently disabled)
- **Hooks**: useQuery, useMutation, useConvexAuth

### Target Stack
- **Frontend**: Next.js 14 (App Router) - No change
- **Backend**: PHP API (REST/JSON)
- **Database**: MySQL
- **Auth**: PHP Sessions or JWT tokens
- **Hooks**: Custom React hooks with fetch/axios

## 1. Backend Components to Create

### PHP Backend Structure
```
backend/
├── config/
│   ├── database.php      # MySQL connection config
│   └── cors.php          # CORS headers for Next.js
├── api/
│   ├── auth/
│   │   ├── login.php     # User login endpoint
│   │   ├── logout.php    # User logout endpoint
│   │   ├── register.php  # User registration
│   │   └── check.php     # Check auth status
│   ├── documents/
│   │   ├── create.php    # Create document
│   │   ├── read.php      # Get document(s)
│   │   ├── update.php    # Update document
│   │   ├── delete.php    # Delete document
│   │   └── list.php      # List documents
│   └── users/
│       ├── profile.php   # User profile
│       └── update.php    # Update user info
├── models/
│   ├── Database.php      # Database connection class
│   ├── User.php          # User model
│   └── Document.php      # Document model
├── middleware/
│   └── auth.php          # Authentication middleware
└── utils/
    ├── validation.php    # Input validation
    └── response.php      # Standardized JSON responses
```

### MySQL Database Schema
```sql
-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    parent_document_id INT,
    cover_image VARCHAR(500),
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_document_id)
);

-- Sessions table (if using session-based auth)
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    data TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 2. Frontend Hook Replacements

### Create API Client
```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiClient {
  static async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // For cookies/sessions
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  static get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
```

### Replace useQuery
```typescript
// hooks/use-api-query.ts
import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';

export function useApiQuery<T>(endpoint: string, options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await ApiClient.get(endpoint);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    if (options?.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [endpoint, options?.enabled, options?.refetchInterval]);

  return { data, error, isLoading };
}
```

### Replace useMutation
```typescript
// hooks/use-api-mutation.ts
import { useState } from 'react';
import { ApiClient } from '@/lib/api-client';

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async (variables: TVariables) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await mutationFn(variables);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, error, isLoading };
}

// Example usage for documents
export const useCreateDocument = () => {
  return useApiMutation((data: { title: string; content?: string }) =>
    ApiClient.post('/documents/create.php', data)
  );
};

export const useUpdateDocument = () => {
  return useApiMutation((data: { id: number; title?: string; content?: string }) =>
    ApiClient.put('/documents/update.php', data)
  );
};
```

### Replace useConvexAuth
```typescript
// hooks/use-auth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { ApiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.get('/auth/check.php');
      setUser(data.user || null);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await ApiClient.post('/auth/login.php', { email, password });
    setUser(data.user);
  };

  const logout = async () => {
    await ApiClient.post('/auth/logout.php', {});
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 3. Implementation Steps

### Phase 1: Backend Setup (Week 1)
1. Set up PHP development environment
2. Create MySQL database and tables
3. Implement basic PHP structure and database connection
4. Create User model and authentication endpoints
5. Test authentication flow with Postman/Insomnia

### Phase 2: API Development (Week 2)
1. Implement Document model and CRUD endpoints
2. Add authentication middleware
3. Implement input validation and error handling
4. Add CORS configuration for Next.js frontend
5. Create API documentation

### Phase 3: Frontend Hooks (Week 3)
1. Create ApiClient utility
2. Implement useApiQuery hook
3. Implement useApiMutation hook
4. Create AuthProvider and useAuth hook
5. Test hooks in isolation

### Phase 4: Migration (Week 4)
1. Replace ConvexProvider with AuthProvider
2. Update components to use new hooks
3. Migrate one feature at a time:
   - Authentication flow
   - Document listing
   - Document CRUD operations
4. Update environment variables
5. Test all functionality

### Phase 5: Optimization & Deployment (Week 5)
1. Add caching strategy
2. Implement real-time updates (if needed) using:
   - WebSockets (PHP Ratchet)
   - Server-Sent Events
   - Polling fallback
3. Add error boundaries and loading states
4. Deploy PHP backend
5. Update production environment variables

## 4. Example PHP Endpoint

Here's a sample PHP endpoint for document creation:

```php
// api/documents/create.php
<?php
require_once '../../config/database.php';
require_once '../../models/Document.php';
require_once '../../middleware/auth.php';
require_once '../../utils/response.php';

// Handle CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// Check authentication
$user = authenticate();
if (!$user) {
    sendError('Unauthorized', 401);
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['title']) || empty($input['title'])) {
    sendError('Title is required', 400);
}

try {
    $document = new Document($db);
    $result = $document->create([
        'user_id' => $user['id'],
        'title' => $input['title'],
        'content' => $input['content'] ?? '',
        'parent_document_id' => $input['parent_document_id'] ?? null
    ]);

    sendSuccess('Document created successfully', $result);
} catch (Exception $e) {
    sendError('Failed to create document: ' . $e->getMessage(), 500);
}
```

## 5. Component Update Example

Here's how to update the navbar component:

```typescript
// app/(marketing)/_components/navbar.tsx
"use client";

import { useScrollTop } from "@/hooks/use-scroll-top";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Spinner } from "@/components/spinner";
import { useAuth } from "@/hooks/use-auth"; // New auth hook

export const Navbar = () => {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const scrolled = useScrollTop() ?? false;
    
    return (
        <div className={cn(
            "z-50 bg-background dark:bg-[#1f1f1f] fixed top-0 flex items-center w-full p-6", 
            scrolled && "border-b shadow-sm"
        )}>
            <Logo />
            <div className="md:ml-auto w-full md:justify-end justify-between flex items-center gap-x-2">
                {isLoading && <Spinner />}
                
                {!isAuthenticated && !isLoading && (
                    <>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/login">Log in</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/register">Get Motion free</Link>
                        </Button>
                    </>
                )}
                
                {isAuthenticated && !isLoading && (
                    <>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/documents">Enter Motion</Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={logout}>
                            Logout
                        </Button>
                        <ModeToggle />
                    </>
                )}
            </div>
        </div>
    );
};
```

## 6. Environment Variables

Update your `.env.local`:

```bash
# Remove Convex variables
# NEXT_PUBLIC_CONVEX_URL=...

# Add PHP backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Add any other necessary variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 7. Testing Strategy

1. **Unit Tests**: Test PHP models and utilities
2. **Integration Tests**: Test API endpoints
3. **Frontend Tests**: Test React hooks and components
4. **E2E Tests**: Test complete user flows

This migration plan provides a solid foundation for moving from Convex to a MySQL + PHP backend while maintaining your React frontend architecture.