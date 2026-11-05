# Network Intelligence — Official Website

A custom, responsive, dark/pink (#F43F87) static website for the Network Intelligence Discord bot. **No npm install, backend, database, environment variables or build step** is required. Works with GitHub + Vercel.

## Included pages
- `index.html` — home, features, bot preview, installation CTAs
- `terms.html` — Terms of Service
- `privacy.html` — Privacy Policy
- `faq.html` — searchable FAQ with category filters

## REQUIRED: Set your public details before launching
Open **`site-config.js`** and fill in:

```js
window.SITE_CONFIG = Object.freeze({
  brand: "NETWORK INTELLIGENCE",
  botClientId: "YOUR_DISCORD_APPLICATION_ID",
  botInviteUrl: "", // Optional official Guild Install URL; overrides generated link
  supportServerUrl: "https://discord.gg/YOUR_REAL_INVITE",
  contactEmail: "support@YOURDOMAIN.com"
});
```

- Get **Application ID** from Discord Developer Portal → General Information.
- Under Discord Developer Portal → Installation, enable **Guild Install** with `bot` and `applications.commands`. Other people can only add the bot if you allow public installation.
- Make the server invite in Discord: Server → Invite People → Copy Invite Link (ensure correct expiration settings).
- Enter a *real* support email before publishing the legal pages. If contact info and links are not configured, the site displays a setup notice rather than a fake link.
- **NEVER put DISCORD_TOKEN, API keys, passwords, private `.env` files, or other secrets in the website repo.** `site-config.js` is publicly downloadable.

## Deploy to GitHub + Vercel

1. Extract this ZIP and place the **contents** at the root of a new GitHub repository (so `index.html` is in the repo root, not buried under an extra folder).
2. In Vercel, click **Add New → Project** and import the repository.
3. Select **Framework Preset: Other**. **Build Command: empty**. Output Directory: root (`.`), or leave default if it detects the static root.
4. Deploy. Vercel supplies a public URL and redeploys on subsequent pushes.
5. In Discord Developer Portal → General Information / Installation, use the deployed site's links as your Terms of Service and Privacy Policy URLs; for example: `https://your-site.vercel.app/terms` and `https://your-site.vercel.app/privacy`. Vercel `cleanUrls` supports these URLs. Page links also work via `.html`.

## Local preview

Open `index.html` in a browser, or for an HTTP preview:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Before public release

The policy pages are tailored to the **referenced v8 Network Intelligence code** but are not a substitute for operator review or legal advice. Confirm your real contact details, host logging/retention, bot integrations, moderation policies and public data providers. If the bot implementation changes, update both policy pages.

## Customization

- Theme: `styles.css` (`--pink: #F43F87`)
- Public URLs and brand: `site-config.js`
- Main content: corresponding `.html` page
- FAQ items: `faq.html`, search/filter behavior in `app.js`
- Favicon: `assets/favicon.svg`

This is a **website-only** package. Keep the Discord bot's Node.js hosting and `.env` separate.
