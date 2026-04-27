// app/calendar/calendar-studio.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { PlatformLogo } from "@/components/platform-logo";
import { cancelPost, fetchPosts, publishPostNow } from "@/lib/api";
import { Post } from "@/lib/types";
import { PostComposerModal } from "@/components/post-composer-modal";

function SimpleMonthCalendar({
  selectedDate,
  onSelect,
  posts,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  posts: Post[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth()));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const hasPostsOnDay = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return posts.some((post) => {
      if (!post.scheduled_at) return false;
      return new Date(post.scheduled_at).toDateString() === dateStr;
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1));

  return (
    <div className="rounded-[28px] border border-[#1e2535] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="text-3xl hover:text-brand-300 transition">←</button>
        <h2 className="font-display text-2xl font-semibold text-ink-900">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={nextMonth} className="text-3xl hover:text-brand-300 transition">→</button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-ink-600 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const hasPost = hasPostsOnDay(day);

          return (
            <button
              key={day}
              onClick={() => onSelect(date)}
              className={`h-12 rounded-2xl flex items-center justify-center text-sm font-medium transition-all hover:bg-brand-100
                ${isSelected ? "bg-brand-300 text-ink-900 font-semibold shadow-sm" : "hover:shadow"}
                ${hasPost ? "ring-2 ring-offset-2 ring-brand-300" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Group posts by platform
function groupPostsByPlatform(posts: Post[]) {
  const groups: Record<string, Post[]> = {};
  posts.forEach((post) => {
    const key = post.platform.toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  });
  return Object.entries(groups);
}

export default function CalendarStudio() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function loadPosts() {
    try {
      const data = await fetchPosts();
      setAllPosts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load posts for calendar");
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  const postsForSelectedDay = useMemo(() => {
    return allPosts.filter((post) => {
      if (!post.scheduled_at) return false;
      return new Date(post.scheduled_at).toDateString() === selectedDate.toDateString();
    });
  }, [allPosts, selectedDate]);

  const groupedByPlatform = useMemo(() => {
    return groupPostsByPlatform(postsForSelectedDay);
  }, [postsForSelectedDay]);

  async function handleAction(postId: number, action: "publish" | "cancel") {
    setBusyId(postId);
    try {
      if (action === "publish") {
        await publishPostNow(postId);
      } else {
        await cancelPost(postId);
      }
      await loadPosts();
    } catch (e) {
      alert(`Failed to ${action} post`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <main className="min-h-[calc(100vh-2.5rem)] px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Calendar */}
            <div className="flex-1">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="font-display text-4xl font-semibold tracking-[-0.06em] text-ink-900">
                    Content Calendar
                  </h1>
                  <p className="text-ink-600 mt-2">Plan and manage your social posts visually</p>
                </div>
                <button
                  onClick={() => setComposerOpen(true)}
                  className="primary-button px-6 py-3 text-base"
                >
                  + Create New Post
                </button>
              </div>

              <ErrorNotice error={error} />

              <SimpleMonthCalendar
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                posts={allPosts}
              />
            </div>

            {/* Right: Sidebar - Posts for selected day */}
            <div className="w-full lg:w-[420px] lg:shrink-0">
              <div className="sticky top-6 rounded-[28px] border border-[#1e2535] bg-[#0f141d] p-6 text-white shadow-xl">
                <div className="mb-6">
                  <div className="text-brand-300 text-sm font-medium">SELECTED DAY</div>
                  <h2 className="text-2xl font-semibold mt-1">
                    {selectedDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                </div>

                {groupedByPlatform.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-5xl mb-4">📅</div>
                    <p className="text-ink-400">No posts scheduled for this day</p>
                    <button
                      onClick={() => setComposerOpen(true)}
                      className="mt-6 text-brand-300 hover:underline"
                    >
                      Create a post for this day →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[calc(100vh-200px)] overflow-auto pr-2">
                    {groupedByPlatform.map(([platformKey, platformPosts]) => (
                      <div key={platformKey} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                            <PlatformLogo platform={platformKey as any} className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-semibold capitalize text-lg">{platformKey}</div>
                            <div className="text-xs text-ink-400">
                              {platformPosts.length} post{platformPosts.length > 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pl-2">
                          {platformPosts.map((post) => (
                            <div key={post.id} className="rounded-2xl bg-[#1a202f] p-4 border border-white/10">
                              <p className="text-sm leading-relaxed line-clamp-3 text-white/90">
                                {post.content || "No content provided"}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {["pending", "scheduled", "queued"].includes(post.status) ? (
                                  <>
                                    <button
                                      onClick={() => handleAction(post.id, "publish")}
                                      disabled={busyId === post.id}
                                      className="text-xs bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-full transition"
                                    >
                                      Publish Now
                                    </button>
                                    <button
                                      onClick={() => handleAction(post.id, "cancel")}
                                      disabled={busyId === post.id}
                                      className="text-xs border border-red-500 text-red-400 hover:bg-red-950 px-4 py-1.5 rounded-full transition"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <span className="inline-block px-3 py-1 text-xs bg-white/10 rounded-full">
                                    {post.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <PostComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={loadPosts}
      />
    </>
  );
}