"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  artist: string;
  supporting?: string;
  venue: string;
  city: string;
  date: string;
  dateLabel: string;
}

const BG_IMAGE = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80&auto=format&fit=crop";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");

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
  const dates = ["all", ...Array.from(new Set(events.map(e => e.dateLabel)))];

  const filtered = events.filter(e => {
    if (selectedVenue !== "all" && e.venue !== selectedVenue) return false;
    if (selectedDate !== "all" && e.dateLabel !== selectedDate) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce((acc: Record<string, Event[]>, e) => {
    if (!acc[e.dateLabel]) acc[e.dateLabel] = [];
    acc[e.dateLabel].push(e);
    return acc;
  }, {});

  if (!authed) return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold text-white mb-2 tracking-tight">Bisque</h1>
        <p className="text-white/60 mb-8 text-lg">Bay Area live music · small venues</p>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-sm mx-auto border border-white/20">
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === "Enter" && login()}
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-400 placeholder-white/40"
          />
          {pwError && <p className="text-red-400 text-sm mb-3">Wrong password</p>}
          <button onClick={login} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition">
            Enter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div
        className="relative h-64 flex items-end"
        style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center top" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="relative z-10 px-6 pb-6 w-full">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Bisque</h1>
              <p className="text-white/60">Bay Area · small venues · next 2 weeks</p>
            </div>
            <button onClick={() => { localStorage.removeItem("bisque_authed"); setAuthed(false); }}
              className="text-white/40 text-sm hover:text-white/70">Logout</button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <select value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 shrink-0">
            <option value="all">All Venues</option>
            {venues.filter(v => v !== "all").map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 shrink-0">
            <option value="all">All Dates</option>
            {dates.filter(d => d !== "all").map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={loadEvents}
            className="bg-gray-800 border border-gray-700 text-white/70 text-sm rounded-lg px-3 py-2 hover:text-white hover:border-orange-400 transition shrink-0">
            ↻ Refresh
          </button>
        </div>

        {/* Events */}
        {loading && (
          <div className="text-center py-16 text-white/40">
            <div className="text-4xl mb-3">🎵</div>
            <p>Finding shows...</p>
          </div>
        )}

        {!loading && Object.keys(grouped).length === 0 && (
          <div className="text-center py-16 text-white/40">
            <div className="text-4xl mb-3">🎸</div>
            <p>No shows found for this filter</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([date, shows]) => (
          <div key={date} className="mb-6">
            <h2 className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-3">{date}</h2>
            <div className="space-y-2">
              {shows.map(show => (
                <div key={show.id} className="bg-gray-900 hover:bg-gray-800 rounded-xl p-4 transition border border-gray-800 hover:border-orange-500/30">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{show.artist}</p>
                      {show.supporting && <p className="text-sm text-white/50 truncate">w/ {show.supporting}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-orange-300">{show.venue}</p>
                      <p className="text-xs text-white/40">{show.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-white/20 text-xs mt-8 pb-6">Shows sourced from Songkick · small Bay Area venues only</p>
      </div>
    </div>
  );
}
