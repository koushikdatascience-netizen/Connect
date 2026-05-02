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

export function PlatformLogo({ platform, className }: Props) {
  const Icon = ICON_MAP[platform];
  const color = BRAND_COLORS[platform];

  if (!Icon) return null;

  return (
    <div
      className="flex items-center justify-center rounded-full p-1.5 transition-all duration-200 hover:scale-110"
      style={{
        background: `${color}15`,
        boxShadow: `0 0 0px ${color}`,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 12px ${color}`)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 0px ${color}`)
      }
    >
      <Icon className={className} style={{ fill: color }} />
    </div>
  );
}