// frontend/app/posts/posts-history.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { cancelPost, fetchPosts, publishPostNow } from "@/lib/api";
import { Post } from "@/lib/types";

// Import shared helpers from posts-client.tsx
import {
  PlatformBadge,
  StatusBadge,
  getLivePostUrl,
  normalizeMetrics,
  MetricsRow,
} from "./posts-client";

const HISTORY_STATUSES = ["posted", "failed", "cancelled"];

function formatDate(value?: string | null) {
  if (!value) return "No date";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function PostsHistory() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyPostId, setBusyPostId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    try {
      const data = await fetchPosts();
      const historyPosts = data.filter((p) => HISTORY_STATUSES.includes(p.status));
      setPosts(historyPosts);
      setError(null);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load post history.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCancel(postId: number) {
    try {
      setBusyPostId(postId);
      await cancelPost(postId);
      await load();
    } catch (e) {
      alert("Failed to cancel post");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handlePublishNow(postId: number) {
    try {
      setBusyPostId(postId);
      await publishPostNow(postId);
      await load();
    } catch (e) {
      alert("Failed to publish post");
    } finally {
      setBusyPostId(null);
    }
  }

  const groupedPosts = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((post) => {
      const key = post.scheduled_at
        ? new Date(post.scheduled_at).toDateString()
        : "No Date";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    });

    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "No Date") return 1;
      if (b[0] === "No Date") return -1;
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  }, [posts]);

  const totalPosted = posts.filter((p) => p.status === "posted").length;

  return (
    <main className="min-h-[calc(100vh-2.5rem)] px-4 py-6 sm:px-6">
      <div className="rounded-[30px] border border-[#1e2535] bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(255,250,240,0.96)_52%,rgba(255,245,221,0.9)_100%)] p-6 shadow-[0_18px_48px_rgba(24,24,24,0.08)]">
        
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.06em] text-ink-900">Post History</h1>
            <p className="mt-2 text-ink-600">Review all published, failed, and cancelled posts</p>
            {lastUpdated && (
              <p className="text-xs text-ink-500 mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
              {totalPosted} Published
            </div>
            <button onClick={load} className="secondary-button px-5 py-2 text-sm">Refresh</button>
          </div>
        </div>

        <ErrorNotice error={error} fallback="Could not load post history." />

        {groupedPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#e5dbc8] bg-[#fff8e8] py-20 text-center">
            <div className="mx-auto text-6xl mb-6">📜</div>
            <h3 className="text-2xl font-semibold text-ink-900">No posts in history yet</h3>
            <p className="mt-3 max-w-md mx-auto text-ink-600">
              Once you publish or cancel posts, they will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedPosts.map(([dateKey, dayPosts]) => (
              <div key={dateKey}>
                <div className="mb-4 flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-ink-900">
                    {dateKey === "No Date" ? "No Date" : formatDate(dateKey)}
                  </h2>
                  <div className="flex-1 h-px bg-[#e5dbc8]" />
                  <span className="text-sm font-medium text-ink-500">
                    {dayPosts.length} post{dayPosts.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-4">
                  {dayPosts.map((post) => {
                    const liveUrl = getLivePostUrl(post);

                    return (
                      <div key={post.id} className="post-card rounded-[22px] border border-[#ece3d3] bg-[#fffcf7] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <PlatformBadge platform={post.platform} />
                              <StatusBadge status={post.status} />
                              <span className="text-xs text-ink-400">#{post.id}</span>
                            </div>

                            <p className="text-sm leading-relaxed text-ink-900 line-clamp-4">
                              {post.content || <span className="italic text-ink-400">No content</span>}
                            </p>

                            {post.error_message && (
                              <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                                {post.error_message}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:items-end">
                            {liveUrl && (
                              <a
                                href={liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-300 hover:underline text-sm font-medium"
                              >
                                View Live Post →
                              </a>
                            )}

                            <div className="flex gap-2 mt-3">
                              {(post.status === "failed" || post.status === "cancelled") && (
                                <button
                                  onClick={() => handlePublishNow(post.id)}
                                  disabled={busyPostId === post.id}
                                  className="primary-button text-xs px-4 py-1.5"
                                >
                                  Publish Again
                                </button>
                              )}
                              {post.status !== "posted" && (
                                <button
                                  onClick={() => handleCancel(post.id)}
                                  disabled={busyPostId === post.id}
                                  className="secondary-button text-xs px-4 py-1.5 text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}