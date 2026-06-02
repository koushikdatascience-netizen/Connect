"use client";

import { CreatePostStudio } from "@/components/create-post/create-post-studio";

export default function CreatePostPage() {
  return (
    <div className="relative flex h-[calc(100dvh_-_8rem_-_env(safe-area-inset-bottom))] min-h-0 w-full sm:h-[calc(100dvh_-_9rem_-_env(safe-area-inset-bottom))] lg:h-[calc(100dvh_-_2.5rem)] lg:min-h-[720px]">
      <CreatePostStudio />
    </div>
  );
}
