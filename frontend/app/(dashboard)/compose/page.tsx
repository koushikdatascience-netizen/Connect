"use client";

import { CreatePostStudio } from "@/components/create-post/create-post-studio";

export default function ComposeDashboardPage() {
  return (
    <div className="h-screen bg-[#faf7f2]">
      <div className="mx-auto h-full max-w-[1400px] px-4 py-4">
        <CreatePostStudio />
      </div>
    </div>
  );
}