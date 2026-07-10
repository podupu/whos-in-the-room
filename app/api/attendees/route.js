import { Redis } from "@upstash/redis";

// Works with either Vercel KV env names or Upstash env names.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

// In-memory fallback for local dev without Redis (NOT persistent on Vercel).
const mem = globalThis.__roomMem || (globalThis.__roomMem = new Map());

const key = (event) => `room:${event}`;
const clean = (s) => String(s || "").slice(0, 300);

function sanitizeEvent(e) {
  return String(e || "demo").toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 40) || "demo";
}

async function listAttendees(event) {
  if (redis) {
    const all = await redis.hgetall(key(event));
    if (!all) return [];
    return Object.values(all).map((v) => (typeof v === "string" ? JSON.parse(v) : v));
  }
  return Array.from((mem.get(key(event)) || new Map()).values());
}

export async function GET(req) {
  const event = sanitizeEvent(new URL(req.url).searchParams.get("event"));
  const attendees = await listAttendees(event);
  return Response.json({ attendees });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const event = sanitizeEvent(body.event);
  const r = body.record || {};
  if (!r.name || !r.role) {
    return Response.json({ error: "name and role are required" }, { status: 400 });
  }
  const record = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    name: clean(r.name),
    company: clean(r.company),
    linkedin: clean(r.linkedin),
    role: clean(r.role),
    looking: Array.isArray(r.looking) ? r.looking.slice(0, 2).map(clean) : [],
    offer: clean(r.offer),
    t: Date.now(),
  };
  if (redis) {
    await redis.hset(key(event), { [record.id]: JSON.stringify(record) });
    await redis.expire(key(event), 60 * 60 * 24 * 7); // auto-clean after 7 days
  } else {
    const m = mem.get(key(event)) || new Map();
    m.set(record.id, record);
    mem.set(key(event), m);
  }
  return Response.json({ record });
}

export async function DELETE(req) {
  const u = new URL(req.url);
  const event = sanitizeEvent(u.searchParams.get("event"));
  const id = clean(u.searchParams.get("id"));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (redis) {
    await redis.hdel(key(event), id);
  } else {
    (mem.get(key(event)) || new Map()).delete(id);
  }
  return Response.json({ ok: true });
}
