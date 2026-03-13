"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  event_id: string;
  artist: string;
  supporting: string[];
  venue: string;
  city: string;
  date: string;
  start_time?: string;
  image_url?: string;
  event_url?: string;
  genres: string[];
}

const BG_IMAGE = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80&auto=format&fit=crop";

const VENUE_URLS: Record<string, string> = {
  "Great American Music Hall": "https://www.slimspresents.com/venue_detail/gamh/",
  "Bottom of the Hill": "https://www.bottomofthehill.com",
  "Café du Nord": "https://www.cafedunord.com",
  "Cafe du Nord": "https://www.cafedunord.com",
  "The Independent": "https://www.theindependentsf.com",
  "Rickshaw Stop": "https://www.rickshawstop.com",
  "Hotel Utah Saloon": "https://www.hotelutah.com",
  "The Freight": "https://www.thefreight.org",
  "The Lost Church": "https://www.thelostchurch.com",
  "Neck of the Woods": "https://www.neckofthewoodssf.com",
  "Brick & Mortar Music Hall": "https://www.brickandmortarmusic.com",
  "Yoshi's": "https://www.yoshis.com",
  "August Hall": "https://www.augusthallsf.com",
  "The Chapel": "https://www.thechapelsf.com",
  "Sweetwater Music Hall": "https://www.sweetwatermusichall.com",
  "Throckmorton Theatre": "https://www.throckmortontheatre.org",
  "Starline Social Club": "https://www.starlinesocialclub.com",
  "Eli's Mile High Club": "https://www.elismilehighclub.com",
  "Guild Theatre": "https://www.guildtheatre.com",
};

function formatTime(t?: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getWeekRange(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - dayOfWeek + offset * 7);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfThisWeek);
  endOfWeek.setDate(startOfThisWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { start: startOfThisWeek, end: endOfWeek };
}

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekFilter, setWeekFilter] = useState<"all" | "this" | "next">("all");
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  useEffect(() => {
    if (localStorage.getItem("bisque_authed") === "yes") setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) loadEvents();
  }, [authed]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const login = () => {
    if (pw.toLowerCase() === "bisque") {
      localStorage.setItem("bisque_authed", "yes");
      setAuthed(true);
    } else {
      setPwError(true);
    }
  };

  const venues = ["all", ...Array.from(new Set(events.map(e => e.venue))).sort()];

  const filtered = events.filter(e => {
    if (selectedVenue !== "all" && e.venue !== selectedVenue) return false;
    if (weekFilter !== "all") {
      const { start, end } = getWeekRange(weekFilter === "this" ? 0 : 1);
      const d = new Date(e.date + "T12:00:00");
      if (d < start || d > end) return false;
    }
    return true;
  });

  const grouped = filtered.reduce((acc: Record<string, Event[]>, e) => {
    const d = new Date(e.date + "T12:00:00");
    const label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!acc[label]) acc[label] = [];
    acc[label].push(e);
    return acc;
  }, {});

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold text-white mb-2 tracking-tight">Bisque</h1>
        <p className="text-white/60 mb-8 text-lg">Bay Area live music · small venues</p>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-sm mx-auto border border-white/20">
          <input type="password" placeholder="Password" value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === "Enter" && login()}
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-400 placeholder-white/40" />
          {pwError && <p className="text-red-400 text-sm mb-3">Wrong password</p>}
          <button onClick={login} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition">Enter</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative h-56 flex items-end"
        style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center top" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="relative z-10 px-6 pb-5 w-full flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Bisque</h1>
            <p className="text-white/60 text-sm">Bay Area · small venues · next 2 weeks</p>
          </div>
          <button onClick={() => { localStorage.removeItem("bisque_authed"); setAuthed(false); }}
            className="text-white/30 text-sm hover:text-white/60">Logout</button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {/* Week filter */}
          <div className="flex bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {([["all", "All"], ["this", "This Week"], ["next", "Next Week"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setWeekFilter(val)}
                className={`px-3 py-2 text-sm font-medium transition ${weekFilter === val ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>
          <select value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400">
            <option value="all">All Venues</option>
            {venues.filter(v => v !== "all").map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button onClick={loadEvents}
            className="bg-gray-800 border border-gray-700 text-white/60 text-sm rounded-lg px-3 py-2 hover:text-white transition">
            ↻
          </button>
        </div>

        {loading && (
          <div className="text-center py-16 text-white/40">
            <div className="text-4xl mb-3">🎵</div><p>Loading shows...</p>
          </div>
        )}

        {!loading && Object.keys(grouped).length === 0 && (
          <div className="text-center py-16 text-white/40">
            <div className="text-4xl mb-3">🎸</div><p>No shows found</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([dateLabel, shows]) => (
          <div key={dateLabel} className="mb-6">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">{dateLabel}</h2>
            <div className="space-y-2">
              {shows.map(show => {
                const venueUrl = VENUE_URLS[show.venue];
                return (
                  <div key={show.event_id || show.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-orange-500/30 transition">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{show.artist}</p>
                        {show.supporting?.length > 0 && (
                          <p className="text-xs text-white/40 truncate">w/ {show.supporting.join(", ")}</p>
                        )}
                        {show.start_time && (
                          <p className="text-xs text-white/40 mt-0.5">🕐 {formatTime(show.start_time)}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {venueUrl ? (
                          <a href={venueUrl} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-orange-300 hover:text-orange-200 underline-offset-2 hover:underline">
                            {show.venue}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-orange-300">{show.venue}</p>
                        )}
                        <p className="text-xs text-white/40">{show.city}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-white/20 text-xs mt-8 pb-6">Sourced from Songkick · updates daily at 8am</p>
      </div>
    </div>
  );
}
