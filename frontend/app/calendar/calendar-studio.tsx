"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { PostComposerModal } from "@/components/post-composer-modal-v2";
import { fetchPosts } from "@/lib/api";
import { Post } from "@/lib/types";
import { useEffect } from "react";

function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { day: "numeric" });
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function startOfCalendar(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = first.getDay();
  first.setDate(first.getDate() - day);
  return first;
}

export default function CalendarStudio() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    void fetchPosts().then(setPosts).catch(() => setPosts([]));
  }, []);

  const days = useMemo(() => {
    const start = startOfCalendar(currentMonth);
    return Array.from({ length: 35 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dayPosts = posts.filter((post) => {
        const raw = post.scheduled_at ?? post.created_at;
        if (!raw) return false;
        const postDate = new Date(raw);
        return postDate.toDateString() === date.toDateString();
      });
      return { date, dayPosts };
    });
  }, [currentMonth, posts]);

  const selectedPosts = useMemo(() => days.find((day) => day.date.toDateString() === selectedDate.toDateString())?.dayPosts ?? [], [days, selectedDate]);

  return (
    <>
      <main className="min-h-[calc(100vh-2.5rem)] px-4 py-4 sm:px-5 lg:px-6">
        <div className="rounded-[30px] border border-[#1e2535] bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(255,250,240,0.96)_52%,rgba(255,245,221,0.9)_100%)] p-4 shadow-[0_18px_48px_rgba(24,24,24,0.08)] sm:p-5 lg:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_300px]">
            <div>
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="font-display text-3xl font-semibold tracking-[-0.06em] text-ink-900">Content Calendar</h1>
                  <p className="mt-2 text-sm text-ink-600">A cleaner calendar view for upcoming content, with quick day-by-day scanning and a focused details rail.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-full border border-[#eadfcd] bg-[#0d1018] px-3 py-2 text-sm font-medium text-ink-700">Day / Week / Month</div>
                  <button type="button" onClick={() => setComposerOpen(true)} className="primary-button px-5 py-2.5 text-sm">+ Create Post</button>
                  <Link href="/posts" className="secondary-button px-5 py-2.5 text-sm">Open Queue</Link>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#eadfcd] bg-[#0d1018] p-3 shadow-[0_10px_24px_rgba(24,24,24,0.05)] sm:p-4">
                <div className="mb-4 flex items-center justify-between">
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="secondary-button px-4 py-2 text-sm">Prev</button>
                  <div className="text-lg font-semibold text-ink-900">{monthLabel(currentMonth)}</div>
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="secondary-button px-4 py-2 text-sm">Next</button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-ink-600">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, idx) => <div key={idx}>{label}</div>)}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                  {days.map((day) => {
                    const isCurrentMonth = day.date.getMonth() === currentMonth.getMonth();
                    const isSelected = day.date.toDateString() === selectedDate.toDateString();
                    return (
                      <button
                        key={day.date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(day.date)}
                        className={`min-h-[112px] rounded-[18px] border p-2 text-left transition ${isSelected ? "border-[#f2cf63] bg-[#fff8df]" : "border-[#efe4d5] bg-[#0b0d14] hover:border-[#e0c98f]"} ${isCurrentMonth ? "" : "opacity-50"}`}
                      >
                        <div className="mb-2 text-sm font-semibold text-ink-900">{formatDayLabel(day.date)}</div>
                        <div className="space-y-1.5">
                          {day.dayPosts.slice(0, 2).map((post) => (
                            <div key={post.id} className="rounded-xl border border-[#eadfcd] bg-[#0d1018] px-2 py-1.5 text-[11px] shadow-[0_6px_14px_rgba(24,24,24,0.04)]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold capitalize text-ink-900">{post.platform}</span>
                                <span className="rounded-full bg-[#eef8d8] px-1.5 py-0.5 text-[10px] text-[#4a6d16]">{post.status}</span>
                              </div>
                              <div className="mt-1 truncate text-ink-500">{post.content || "Post preview"}</div>
                            </div>
                          ))}
                          {day.dayPosts.length > 2 ? <div className="text-[11px] text-[#ffd52a]">+{day.dayPosts.length - 2} more</div> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="rounded-[26px] border border-[#eadfcd] bg-[#0d1018] p-4 shadow-[0_10px_24px_rgba(24,24,24,0.05)] sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xl font-semibold text-ink-900">{monthLabel(selectedDate)}</div>
                <button type="button" className="secondary-button px-3 py-2 text-xs">...</button>
              </div>
              <div className="space-y-3">
                {selectedPosts.length ? selectedPosts.map((post) => (
                  <div key={post.id} className="rounded-[20px] border border-[#eee4d6] bg-[#0b0d14] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 capitalize">{post.platform}</div>
                    <div className="mt-2 text-sm leading-6 text-ink-600">{post.content || "Post preview unavailable."}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="secondary-button px-3 py-2 text-xs">Edit</button>
                      <button type="button" className="secondary-button px-3 py-2 text-xs">Reschedule</button>
                      <button type="button" className="secondary-button px-3 py-2 text-xs">Delete</button>
                    </div>
                  </div>
                )) : <div className="rounded-[20px] border border-dashed border-[#e5dbc8] bg-[#0b0d14] px-4 py-10 text-sm text-ink-500">No scheduled posts for this day yet.</div>}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <PostComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </>
  );
}
