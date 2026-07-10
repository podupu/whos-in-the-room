# Who's in the Room?

Scan a QR at the door → check in with your LinkedIn → see who's in the room, filter by role, and get your 3 suggested people to talk to.

Built with Next.js + Upstash Redis (via Vercel Marketplace). Free tier covers a 20–50 person meetup easily.

## Deploy to Vercel (10 minutes)

### 1. Put the code on GitHub
```bash
cd whos-in-the-room
git init
git add .
git commit -m "initial"
```
Create a new repo on github.com, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/whos-in-the-room.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to vercel.com → **Add New → Project**
2. Import your `whos-in-the-room` repo
3. Framework preset auto-detects **Next.js** — just click **Deploy**

The app will deploy but check-ins won't persist yet — you need the database.

### 3. Add the database (Redis)
1. In your Vercel project → **Storage** tab → **Create Database**
2. Choose **Upstash → Redis** (free tier) → create it and connect it to this project
3. Vercel auto-injects the env vars (`KV_REST_API_URL` / `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — the code accepts both)
4. Go to **Deployments** → redeploy the latest deployment so it picks up the env vars

### 4. Run an event
- Your app lives at `https://your-app.vercel.app`
- Each event gets its own room via the URL: `https://your-app.vercel.app/?event=producttank-jul`
- Make a QR code pointing at that URL (any free QR generator) and print it for the door
- Rooms auto-expire from the database after 7 days

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000 — without Redis env vars it falls back to in-memory storage (fine for local testing, resets on restart).

To use the real database locally, create `.env.local`:
```
KV_REST_API_URL=your_url
KV_REST_API_TOKEN=your_token
```
(Copy the values from Vercel → Project → Settings → Environment Variables.)

## How it works
- `app/page.js` — the whole UI (check-in form, live room list with role filters, top-3 matching)
- `app/api/attendees/route.js` — GET/POST/DELETE attendees, stored as a Redis hash per event
- Room list auto-refreshes every 12 seconds
- Your check-in is remembered on your device (localStorage) so matches survive a page reload

## Event-day checklist
- [ ] Test the link on 2 phones the day before
- [ ] Print QR poster: "Scan to see who's in the room 👀" (door + drinks table)
- [ ] Use a fresh `?event=` slug for each event
- [ ] Mid-event announcement: "Open the room list — tap My 3 People and go find them"
- [ ] After: screenshot the room list, count check-ins vs attendance
