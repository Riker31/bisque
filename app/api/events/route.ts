import { NextResponse } from "next/server";

const SMALL_VENUES = [
  "Great American Music Hall",
  "Bottom of the Hill",
  "Café du Nord", "Cafe du Nord",
  "The Independent",
  "Rickshaw Stop",
  "Hotel Utah Saloon",
  "The Freight",
  "The Lost Church",
  "Neck of the Woods",
  "Brick & Mortar Music Hall",
  "Yoshi's",
  "August Hall",
  "The Chapel",
  "Sweetwater Music Hall",
  "Throckmorton Theatre",
  "142 Throckmorton",
  "Starline Social Club",
  "Eli's Mile High Club",
  "Cornerstone Berkeley",
  "Uptown Nightclub",
  "The New Parish",
  "Moe's Alley",
  "Kuumbwa Jazz Center",
];

export interface Event {
  id: string;
  artist: string;
  supporting: string[];
  venue: string;
  city: string;
  date: string;
  dateLabel: string;
  startTime?: string;
  image?: string;
  url?: string;
  genres: string[];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

async function fetchAndParseEvents(page: number): Promise<Event[]> {
  const url = page === 1
    ? "https://www.songkick.com/metro-areas/26330-us-sf-bay-area/calendar"
    : `https://www.songkick.com/metro-areas/26330-us-sf-bay-area/calendar?page=${page}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
    next: { revalidate: 3600 },
  });
  const html = await res.text();

  // Extract all JSON-LD MusicEvent blocks
  const jsonLdRegex = /\[(\{"@context":"http:\/\/schema\.org".*?"@type":"MusicEvent".*?\})\]/g;
  const events: Event[] = [];
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const arr = JSON.parse(`[${match[1]}]`);
      for (const item of arr) {
        if (item["@type"] !== "MusicEvent") continue;

        const venueName: string = item.location?.name || "";
        if (!SMALL_VENUES.some(v => venueName.toLowerCase().includes(v.toLowerCase()))) continue;

        const performers: any[] = Array.isArray(item.performer) ? item.performer : item.performer ? [item.performer] : [];
        const artistNames = performers.map((p: any) => p.name).filter(Boolean);
        const artist = artistNames[0] || item.name || "Unknown";
        const supporting = artistNames.slice(1);
        const genres: string[] = performers.flatMap((p: any) => Array.isArray(p.genre) ? p.genre : p.genre ? [p.genre] : []);

        const startDate: string = item.startDate || "";
        const dateOnly = startDate.slice(0, 10);
        const startTime = startDate.length > 10 ? startDate.slice(11, 16) : undefined;

        events.push({
          id: `${dateOnly}-${venueName}-${artist}`.toLowerCase().replace(/\s+/g, "-").slice(0, 60),
          artist,
          supporting,
          venue: venueName,
          city: item.location?.address?.addressLocality || "Bay Area",
          date: dateOnly,
          dateLabel: formatDateLabel(dateOnly),
          startTime,
          image: item.image,
          url: item.url,
          genres,
        });
      }
    } catch {}
  }

  return events;
}

export async function GET() {
  try {
    const pages = await Promise.all([1, 2, 3].map(fetchAndParseEvents));
    const all = pages.flat();

    // Dedupe
    const seen = new Set<string>();
    const unique = all.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    // Filter to next 2 weeks
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const filtered = unique
      .filter(e => {
        const d = new Date(e.date + "T12:00:00");
        return d >= now && d <= twoWeeks;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime?.localeCompare(b.startTime || "") || 0);

    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
