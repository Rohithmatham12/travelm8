# TravelM8 Free Persistent Database Setup

TravelM8 supports persistent production storage with any free Postgres provider, including Neon or Supabase.

## Recommended: Neon Free

1. Create a free Neon project.
2. Copy the pooled Postgres connection string.
3. In Render, open the TravelM8 web service.
4. Add this environment variable:

```text
DATABASE_URL=postgresql://...
```

5. Redeploy the service.

TravelM8 will create these tables automatically on startup:

- `users`
- `trips`

## Supabase Free

1. Create a free Supabase project.
2. Go to Project Settings -> Database.
3. Copy the Postgres connection string.
4. In Render, add:

```text
DATABASE_URL=postgresql://...
```

5. Redeploy.

## Local Development

If `DATABASE_URL` is not set, TravelM8 falls back to local JSON files. That is convenient for development but not safe for production user accounts because hosted files can disappear after redeploys.

## Optional

If your Postgres provider does not require SSL, set:

```text
DATABASE_SSL=false
```

Most hosted free Postgres providers should keep SSL enabled, so you usually do not need this.
