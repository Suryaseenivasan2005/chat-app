Visibility feature - public/private accounts
=========================================

This document explains the "Public vs Private" account visibility changes.

Migration
- Run the migration to set `isPublic=false` for existing users missing the field:

  npm run migrate:visibility

New fields
- `isPublic` added to `User` model (boolean, default false, indexed)

New endpoints
- GET /api/users/public - authenticated; accepts `q`, `page`, `limit`
- GET /api/users/all?visibility=private|public - authenticated; default `private`

Signup/Login
- Both endpoints accept `accountVisibility: 'public'|'private'` in body. On signup it sets `isPublic`. On login, if provided, it will update `isPublic`.

Auto-accept
- If `AUTO_ACCEPT_PUBLIC=true` in `.env`, friend requests to public accounts are auto-accepted and relevant socket events are emitted.

Frontend
- Public directory page is available at `/public` and fetches `/api/users/public`.
- Add Friend flow fetches `/api/users/all?visibility=private`.

Notes
- No secrets are included here. Ensure to rotate any leaked keys before deploying.
