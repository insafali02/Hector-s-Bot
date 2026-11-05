# Network Intelligence — V2 Community Analytics Website

A complete responsive site matching the bot embed theme `#F43F87`: Home, Terms, Privacy, FAQ, floating Discord CTA, interactive animated Community Overview, live aggregate command counters, seven-day activity chart and popular commands. Ready for **GitHub + Vercel**.

**The statistics are genuine, never fictional.** Until configured, the dashboard shows dashes and an honest connection message. Bot usage before the integration is enabled cannot be reconstructed.

## Included website files

- `index.html`: home / live overview / community metrics / features
- `styles.css`, `app.js`, `analytics.js`, `site-config.js`: theme, interactions, site configuration
- `terms.html`, `privacy.html`, `faq.html`: legal and help pages
- `api/ingest.mjs`: private, authenticated command-event and guild-heartbeat intake
- `api/stats.mjs`: public **aggregate-only** dashboard endpoint
- `lib/redis.mjs`: dependency-free server-side Upstash Redis REST helper
- `vercel.json`, `robots.txt`, `assets/favicon.svg`

The **separate bot ZIP** (`network_intelligence_bot_v7_5_analytics_no_music.zip`) contains V7.5 with an optional analytics connector and no music features. Existing Minecraft, live check, IP, DNS and administrative commands remain. Bot `.env` remains private and should never be pushed to GitHub.

## Setup (necessary for real numbers)

### 1. Publish website

1. Extract the website ZIP and upload its **contents** to the root of a GitHub repo.
2. Import repo into Vercel (Framework Preset **Other**). No package install/build step required.
3. In `site-config.js`, the Discord Application ID and official Guild Install link are already filled from the publicly shared bot console. Change these if the bot ID changes. Set **your real** `supportServerUrl` and `contactEmail` before sharing publicly.
4. Test the home, `/terms`, `/privacy`, `/faq` URLs.

### 2. Create a persistent Upstash Redis database

Create a Redis database at <https://console.upstash.com/>. Find **REST URL** and **REST Token** (standard/write token) in the database dashboard. This is a separate credential from your Discord bot token. Redis is needed for **actual historical counts across Vercel cold starts/deploys**; static files alone cannot know how many Discord users used your commands.

### 3. Set Vercel *Environment Variables* (Dashboard → Project → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash HTTPS REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash standard REST token |
| `ANALYTICS_WRITE_TOKEN` | Generate a random secret **at least 24 characters**, distinct from Redis or Discord tokens |

After saving environment variables, **redeploy Vercel** so Functions receive them. The same `ANALYTICS_WRITE_TOKEN` must be set on the **bot host**, never in `site-config.js`.

### 4. Upload V7.5 analytics bot files to RoyalNode / your Node host

1. Back up the live bot `index.js` and `.env`.
2. Replace only the bot `index.js` with the provided patched V7.5 file. **Keep your old real `.env` and add only the three analytics lines below.** Do not replace real credentials with placeholders.
3. Add these to the **bot's private** `.env`:

```dotenv
ANALYTICS_SITE_URL=https://YOUR-LIVE-SITE.vercel.app
ANALYTICS_WRITE_TOKEN=EXACT_SAME_SECRET_AS_VERCEL
ANALYTICS_HASH_SECRET=ANOTHER_LONG_RANDOM_SECRET_32_CHARS_OR_MORE
```

Generate independent secure secrets, e.g. `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` on a trusted machine. **Do not share or commit these strings.** The hashed user token is computed only on the bot host and is not an actual Discord user ID.

4. Restart the bot. The startup console should say `[ANALYTICS] Enabled...`. Test `/mcserver` or `/stats` from a Discord server. Check `https://YOUR-LIVE-SITE.vercel.app/api/stats` and the homepage. A valid heartbeat updates current server count; successful command requests send one command event.
5. Site updates every 60s while visible, API responses may be cached 30s by Vercel.

There is no additional npm package needed **for analytics**. Bot dependencies: `discord.js dotenv ipaddr.js`. FFmpeg, yt-dlp, and music packages are NOT needed.

## What is counted, privacy & accuracy

- **Commands** = accepted slash/prefix command invocations **after initial permission/rate-limit checks**, regardless of whether downstream public APIs later succeed. Bot interaction buttons and website visitors are *not* counted.
- **Unique users** = approximate distinct IDs calculated using Redis HyperLogLog. Bot sends an HMAC-SHA256 token, *never a raw Discord user ID*; only aggregate counts are published. A shared hashing secret ensures repeat users count once while it remains unchanged.
- **Server count** = bot's guild cache size sent at startup and every five minutes / on guild joins and leaves. If no heartbeat is received for >30 minutes, number becomes unavailable rather than showing outdated count.
- **Weekly activity** = UTC daily counts; daily keys expire after 45 days. All-time counters and unique-user estimate persist until the operator deletes them.
- **Popular commands** = names with cumulative counts; only names and totals are displayed. No message text, search inputs, queried IPs/domains, channel IDs or guild IDs are sent to analytics.
- **Before setup** = `—` / “Analytics connection pending”, not fake figures. Earlier historical usage is unavailable.
- Vercel/Upstash hosting may handle standard server access logs. Review Terms/Privacy and align disclosures with your actual operations.

## Trouble-shooting

- `GET /api/stats` → `{ configured:false }` means Vercel Redis env variables are missing or the API is temporarily unavailable.
- `[ANALYTICS] Disabled` on the bot means private `.env` variables are not filled or secrets too short. Site must be HTTPS.
- HTTP **401** on `/api/ingest` means the Vercel/bot `ANALYTICS_WRITE_TOKEN` values differ. Never call this endpoint from public browser JS.
- No users/commands after deployment? Run a **new** command, verify Vercel redeployed with env vars, inspect bot console for `[ANALYTICS]` errors.
- Bot offline? Website still shows its last command totals but server count becomes unavailable after 30 minutes.

### Optional: reset your analytics counters

In the Upstash console, delete keys starting with `ni:analytics:v1:` **only if you intend to permanently reset the public statistics**. Take a backup if needed. Disable analytics by clearing/removing the private `ANALYTICS_*` bot variables and restarting the bot.

## Legal note

The supplied policies are starter copy tailored to the implemented code. Review contact, actual hosting practices, platform/provider terms and retention before public launch. They are not legal advice.
