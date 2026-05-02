"use client";

import { CreatePostStudio } from "@/components/create-post/create-post-studio";
import { motion } from "framer-motion";

export default function ComposeDashboardPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-[#f8f4ec] via-[#f3eadc] to-[#efe4d2]">

      {/* subtle glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/3 h-[300px] w-[300px] rounded-full bg-[#d4a94f]/20 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-1/4 h-[300px] w-[300px] rounded-full bg-[#c9a45a]/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto h-full max-w-[1400px] px-4 py-4">

        {/* main container animation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="h-full rounded-2xl border border-[#e6dccb] bg-white/70 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
        >
          <CreatePostStudio />
        </motion.div>

      </div>
    </div>
  );
}