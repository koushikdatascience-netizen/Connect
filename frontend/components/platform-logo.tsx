import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiX,
  SiYoutube,
  SiTiktok,
  SiGoogle,
  SiWordpress,
  SiBlogger,
} from "react-icons/si";

const ICON_MAP: Record<string, any> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  linkedin: SiLinkedin,
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

export function PlatformLogo({
  platform,
  className,
}: {
  platform: string;
  className?: string;
}) {
  const Icon = ICON_MAP[platform];
  if (!Icon) return null;

  return (
    <Icon
      className={className}
      style={{ color: BRAND_COLORS[platform] }}
    />
  );
}