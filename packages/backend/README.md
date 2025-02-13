# @sfh/supabase

This package provides a type-safe Supabase client implementation for use across the SFH monorepo.

## Installation

Since this is a workspace package, you can add it to your project's dependencies like this:

```json
{
  "dependencies": {
    "@sfh/supabase": "workspace:*"
  }
}
```

## Usage

1. First, initialize the Supabase client in your application:

```typescript
import { createSupabaseClient } from '@sfh/supabase';

// Initialize the client (do this once, typically at app startup)
const supabase = createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
```

2. Then use the client throughout your application:

```typescript
import { getSupabaseClient } from '@sfh/supabase';

// Get the initialized client
const supabase = getSupabaseClient();

// Use it for queries, auth, etc.
const { data, error } = await supabase.from('your_table').select('*');
```

## Type Safety

To get full type safety for your database schema:

1. Generate types from your Supabase database using the Supabase CLI
2. Replace the contents of `src/types.ts` with your generated types
3. All client operations will now be fully typed

## Environment Variables

Make sure to set these environment variables in your applications:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
