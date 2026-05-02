"use client";

import {
  SiFacebook,
  SiInstagram,
  SiX,
  SiYoutube,
  SiTiktok,
  SiGoogle,
  SiWordpress,
  SiBlogger,
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";

type Props = {
  platform: string;
  className?: string;
};

/* ---------------- ICON MAP ---------------- */

const ICON_MAP: Record<string, any> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  linkedin: FaLinkedin,
  twitter: SiX,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  google_business: SiGoogle,
  wordpress: SiWordpress,
  blogger: SiBlogger,
};

/* ---------------- BRAND COLORS ---------------- */

const BRAND_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  twitter: "#000000",
  youtube: "#FF0000",
  tiktok: "#000000",
  google_business: "#4285F4",
  wordpress: "#21759B",
  blogger: "#FF5722",
};

/* ---------------- COMPONENT ---------------- */

export function PlatformLogo({ platform, className = "" }: Props) {
  const Icon = ICON_MAP[platform];

  if (!Icon) return null;

  const color = BRAND_COLORS[platform] || "#000";

  return (
    <span className="inline-flex items-center justify-center">
      <Icon
        className={`
          ${className}
          transition-all duration-200 ease-out
          hover:scale-110
        `}
        style={{
          color: color,
          fill: color,

          // 🔥 PREMIUM GLOW EFFECT
          filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 10px ${color}66)`,

          // smoother rendering
          willChange: "transform",
        }}
      />
    </span>
  );
}