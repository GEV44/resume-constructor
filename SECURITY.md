# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Email the maintainer via the contact on
[LinkedIn](https://www.linkedin.com/in/gevorg-hovhannisyan-arm/) or use GitHub's
[private vulnerability reporting](https://github.com/GEV44/resume-constructor/security/advisories/new).
You can expect an acknowledgement within 72 hours.

## How user data is protected

- **Row-level security** on every table: users can only read and write their own resumes, analyses and optimizations.
- **Private storage**: uploaded files live in a private bucket under a per-user folder, enforced by storage policies.
- **Server-side trust**: edge functions verify the caller's JWT and load resumes and analyses from the database
  rather than trusting client-supplied content or scores.
- **Abuse limits**: per-user hourly quotas on every AI-backed function.
- **Data rights**: users can export all their data as JSON and permanently delete their account and files.
- **Transport & headers**: HTTPS only (HSTS), `X-Frame-Options: DENY`, `nosniff`, strict referrer and permissions policies.

The `VITE_SUPABASE_*` values in `.env` are the project's *publishable* (anon) credentials. They are designed to be
public; access is governed by the RLS policies above. Service-role keys and AI keys exist only as edge-function secrets.
