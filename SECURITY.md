# Security Notes

## Secret-scrub audit (2026-06-18)

The repository was audited for committed secrets across the **entire git
history**, not just the current working tree.

### Working tree
Clean. Every credential is read from `process.env.*`; no secret values are
hardcoded in the source. (The Supabase project **URL** appears in a couple of
files — that is a public endpoint, not a secret.)

### Secrets found in git history
These values were committed in the past and later removed from the working
tree, but **they still exist in older commits** and must be treated as
compromised. The actual values are intentionally not reproduced here.

| Credential | Severity | Introduced in commit | File |
| --- | --- | --- | --- |
| Razorpay **LIVE** key **secret** | Critical (financial) | `3074bf3` | `next.config.mjs` |
| Razorpay **LIVE** key id (`rzp_live_…`) | High | `3074bf3` | `next.config.mjs` |
| Google service-account **private key** (`instant-edudoc`, SA `neelpwm@instant-edudoc.iam.gserviceaccount.com`) | Critical | `3074bf3` | `next.config.mjs` |
| Supabase JWT — decodes to `role: anon` | Low/Med | `c1ada65` | `src/pages/api/dbConnection/dbConnect.js` |
| Google SA client email + Spreadsheet ID | Low (identifiers) | `3074bf3` | `next.config.mjs` |

Notes:
- The Razorpay credentials are **live mode** — they can move real money. Highest priority.
- The Supabase key is the **anon** key, which is designed to be used in the
  browser and is protected by Row Level Security (RLS). It is lower severity,
  but rotate it if RLS is not strictly enforced on every table.
- No Ethereum private keys, mnemonics, or `.env` files were ever committed.

## Required remediation — ROTATE the leaked credentials

Because these secrets were already pushed to a shared remote, rewriting git
history does **not** undo the exposure. The only reliable fix is to revoke and
reissue them:

1. **Razorpay** — Dashboard → Settings → API Keys → *Regenerate* the key. Update
   `NEXT_PUBLIC_RAZORPAY_KEY` (key id) and the server-side secret in your
   deployment (Vercel) env vars.
2. **Google service account** (`instant-edudoc`) — GCP Console → IAM & Admin →
   Service Accounts → delete the leaked key (and ideally the whole SA if unused),
   then create a fresh key. Do not commit the JSON; keep it out of the repo
   (now covered by `.gitignore`).
3. **Google OAuth client** — if the OAuth client secret was ever live, rotate it
   in GCP → APIs & Services → Credentials.
4. **NextAuth/JWT secret & `CRON_SECRET`** — regenerate (`openssl rand -base64 32`).
5. **Supabase anon key** — rotate from the Supabase dashboard if RLS coverage is
   not certain.

## Client-bundle exposure (`NEXT_PUBLIC_`) — fixed in code

In Next.js, any `NEXT_PUBLIC_*` value is **inlined into the client JavaScript
bundle** and shipped to every visitor. Three **server-only** secrets were being
read through `NEXT_PUBLIC_*` env vars and have now been renamed to drop the
prefix (they are only used in server-side API routes, so the change is safe):

| Old (bundled to browser) | New (server-only) | Used in |
| --- | --- | --- |
| `NEXT_PUBLIC_RAZORPAY_SECRET` | `RAZORPAY_SECRET` | `src/pages/api/payment/razorpay.js` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | NextAuth route |
| `NEXT_PUBLIC_JWT_SECRET` | `JWT_SECRET` | NextAuth route |

> ⚠️ **Action required in Vercel:** rename these three env vars to match, or
> auth and payments will break on the next deploy. See `.env.example` for the
> full, corrected variable list.

## Preventing future leaks
- `.gitignore` has been hardened to cover all `.env*` variants, private keys
  (`*.pem`, `*.key`, `id_rsa*`), and service-account JSON files.
- Add automated scanning: enable **GitHub secret scanning + push protection**,
  and/or a pre-commit hook with [`gitleaks`](https://github.com/gitleaks/gitleaks).
- Never put secrets in `next.config.mjs` `env: {}` (it is committed and bundled).
  Use `.env.local` (gitignored) locally and the host's env-var store in production.

## Optional: purge the values from history
Rotation above is mandatory and sufficient for safety. If you additionally want
the values gone from history (cosmetic once rotated, and it rewrites every
commit hash — coordinate with all collaborators and expect force-pushes to break
existing clones/forks/open PRs):

```sh
# Preferred: git-filter-repo (https://github.com/newren/git-filter-repo)
# Easiest is to purge the whole files that ever held secrets:
git filter-repo --path next.config.mjs --invert-paths   # then re-add the clean current version
# or replace specific strings (put each leaked value in replacements.txt):
git filter-repo --replace-text replacements.txt

# Alternative: BFG
bfg --replace-text replacements.txt
```

After rewriting: `git push --force-with-lease` all branches/tags and have every
collaborator re-clone.
