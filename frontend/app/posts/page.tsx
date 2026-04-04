"use client";

import { useEffect, useState } from "react";

import { EditPostModal } from "@/components/edit-post-modal";
import { ScheduledPostsTable } from "@/components/scheduled-posts-table";
import { cancelPost, fetchAccounts, fetchPosts, publishPostNow } from "@/lib/api";
import { Account, Post } from "@/lib/types";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyPostId, setBusyPostId] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  async function load() {
    try {
      const [postData, accountData] = await Promise.all([fetchPosts(), fetchAccounts()]);
      setPosts(postData);
      setAccounts(accountData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load posts.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handlePublishNow(postId: number) {
    try {
      setBusyPostId(postId);
      setError(null);
      await publishPostNow(postId);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to publish post.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleCancel(postId: number) {
    try {
      setBusyPostId(postId);
      setError(null);
      await cancelPost(postId);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to cancel post.");
    } finally {
      setBusyPostId(null);
    }
  }

  return (
    <main className="card section">
      <div className="ops-header">
        <div>
          <h2 className="section-title">Scheduled Posts</h2>
          <p className="section-copy">
            Track queued, scheduled, processing, posted, failed, and cancelled work from one clean
            execution view inside SnapKey CRM.
          </p>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      <ScheduledPostsTable
        accounts={accounts}
        busyPostId={busyPostId}
        onEdit={setEditingPost}
        onCancel={handleCancel}
        onPublishNow={handlePublishNow}
        posts={posts}
      />
      <EditPostModal onClose={() => setEditingPost(null)} onSaved={load} post={editingPost} />
    </main>
  );
}
