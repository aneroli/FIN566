# Maple Creek Mixed-Use Center — Valuation Exercise

## Three Views

| URL | Purpose | Who sees it |
|-----|---------|-------------|
| `/` | **Student View** — Submit valuations + analysis answers + spreadsheets | Students |
| `/class` | **Class Leaderboard** — Rankings without revealing values | Project on screen |
| `/instructor` | **Instructor Dashboard** — All details, answers, files, scores | Instructor only |

## Deploy to Vercel

### Step 1: Create the project
Push code to a **private** GitHub repo, then import into Vercel.

### Step 2: Set up storage (REQUIRED — do this before class!)

**A) Upstash Redis (stores bids, answers, scores)**
1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create** → **Upstash Redis** (under the Marketplace section)
3. Name it (e.g. `maple-creek-data`), select a region, and click **Create**
4. It will automatically link to your project and add the environment variables

**B) Vercel Blob (stores uploaded spreadsheets)**
1. Still in the **Storage** tab, click **Create** → **Blob**
2. Name it (e.g. `maple-creek-files`) and click **Create**
3. It will automatically link and add the `BLOB_READ_WRITE_TOKEN` env var

**C) Redeploy**
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment → **Redeploy**
3. This picks up the new environment variables

### Step 3: Test it
Visit your URL, select a team, submit a test bid, check `/instructor` to see it persisted.

## Customizing Team Names

Edit `config.yaml` in your GitHub repo. Find the `groups:` section:

```yaml
groups:
  - id: "group1"
    name: "Team Alpha"
    emoji: "🦅"
  - id: "group2"
    name: "Team Beta"
    emoji: "🐺"
```

Change the `name` and `emoji` fields to whatever you want. You can add or remove teams too — just keep the `id` unique. After editing on GitHub, Vercel will auto-redeploy.

## Exercise Rounds

| Round | Event | Target Value |
|-------|-------|-------------|
| Base | Initial scenario | $8,456,000 |
| R1 | Percentage rents kick in | $8,722,000 |
| R2 | New competitor arrives | $7,669,000 |
| R3 | Local economic shock | $5,570,000 |
| R4 | Anchor goes dark | $1,810,000 |
| R5 | Introducing leverage | $7,662,000 |
| R6 | Tax status matters | $7,662,000 |
| R7 | Reposition or redevelop | $4,065,000 |

## Local Development

```bash
npm install
npm run dev
```

Note: Without Vercel KV/Blob configured, the app falls back to in-memory storage (data lost on restart) and file uploads won't persist. This is fine for testing the interface.

## How Data Works

- **Bids, answers, reflections** → Stored in Upstash Redis (via Vercel Marketplace). Persists across server restarts. Accessible from instructor dashboard.
- **Spreadsheet uploads** → Stored in Vercel Blob. Instructor can click file links to download.
- **Reset** → The instructor dashboard has a "Reset All" button that clears all data for a fresh session.
