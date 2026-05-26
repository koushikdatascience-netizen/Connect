"use client";

import { PLATFORM_LABELS } from "@/components/create-post/constants";
import { PlatformConfig } from "@/components/create-post/types";
import { MediaAsset, PlatformName } from "@/lib/types";

type PlatformValidation = {
  valid: boolean;
  message: string;
  fixTarget?: {
    panel: "compose" | "settings";
    sectionId: string;
    actionLabel: string;
  };
};

type MediaConstraint = {
  allowedExtensions: Set<string>;
  maxSizeBytes: number;
  minAspectRatio?: number;
  maxAspectRatio?: number;
  maxDurationSeconds?: number;
};

const MEDIA_CONSTRAINTS = {
  facebook: {
    image: {
      allowedExtensions: new Set(["jpg", "jpeg", "png"]),
      maxSizeBytes: 25 * 1024 * 1024,
    },
    video: {
      allowedExtensions: new Set(["mp4"]),
      maxSizeBytes: 1000 * 1024 * 1024,
      maxDurationSeconds: 240 * 60,
    },
  },
  instagram: {
    image: {
      allowedExtensions: new Set(["jpg", "jpeg", "png"]),
      maxSizeBytes: 8 * 1024 * 1024,
      minAspectRatio: 4 / 5,
      maxAspectRatio: 1.91,
    },
    video: {
      allowedExtensions: new Set(["mp4"]),
      maxSizeBytes: 100 * 1024 * 1024,
      maxDurationSeconds: 60,
    },
  },
} as const;

function extractFileExtension(asset: MediaAsset) {
  if (asset.mime_type) {
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "video/mp4": "mp4",
    };
    const mime = asset.mime_type.toLowerCase();
    if (extMap[mime]) {
      return extMap[mime];
    }
  }

  const base = asset.file_url.toLowerCase().split("?")[0];
  if (!base.includes(".")) {
    return "";
  }
  return base.slice(base.lastIndexOf(".") + 1);
}

function validateAssetAgainstConstraints(
  platform: keyof typeof MEDIA_CONSTRAINTS,
  asset: MediaAsset,
  mediaIndex: number,
) {
  const constraints = MEDIA_CONSTRAINTS[platform][asset.file_type as "image" | "video"] as MediaConstraint | undefined;
  if (!constraints) {
    return `Media ${mediaIndex}: ${PLATFORM_LABELS[platform]} supports ${platform === "instagram" ? "images or videos only." : "image and video assets only."}`;
  }

  const extension = extractFileExtension(asset);
  if (extension && constraints.allowedExtensions && !constraints.allowedExtensions.has(extension)) {
    return `Media ${mediaIndex}: file type .${extension} is not allowed for ${PLATFORM_LABELS[platform]}.`;
  }

  if (asset.file_size_bytes && constraints.maxSizeBytes && asset.file_size_bytes > constraints.maxSizeBytes) {
    const sizeMb = (asset.file_size_bytes / (1024 * 1024)).toFixed(2);
    const maxMb = (constraints.maxSizeBytes / (1024 * 1024)).toFixed(0);
    return `Media ${mediaIndex}: file size ${sizeMb}MB exceeds the ${PLATFORM_LABELS[platform]} limit of ${maxMb}MB.`;
  }

  if (
    platform === "instagram" &&
    asset.file_type === "image" &&
    asset.width_px &&
    asset.height_px &&
    constraints.minAspectRatio &&
    constraints.maxAspectRatio
  ) {
    const ratio = asset.width_px / asset.height_px;
    if (ratio < constraints.minAspectRatio || ratio > constraints.maxAspectRatio) {
      return `Media ${mediaIndex}: aspect ratio ${ratio.toFixed(2)}:1 is outside Instagram's allowed range of ${constraints.minAspectRatio.toFixed(2)}:1 to ${constraints.maxAspectRatio.toFixed(2)}:1.`;
    }
  }

  if (
    asset.file_type === "video" &&
    asset.duration_seconds &&
    constraints.maxDurationSeconds &&
    asset.duration_seconds > constraints.maxDurationSeconds
  ) {
    return `Media ${mediaIndex}: video duration ${asset.duration_seconds}s exceeds the ${PLATFORM_LABELS[platform]} limit of ${constraints.maxDurationSeconds}s.`;
  }

  return null;
}

export function buildDraftContent(caption: string, hashtags: string, mentions: string) {
  const normalizedHashtags = hashtags
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") ? item : `#${item}`))
    .join(" ");

  const normalizedMentions = mentions
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("@") ? item : `@${item}`))
    .join(" ");

  return [caption.trim(), normalizedHashtags, normalizedMentions]
    .filter(Boolean)
    .join("\n\n");
}

export function getPlatformValidation(
  platform: PlatformName,
  config: PlatformConfig,
  selectedAssets: MediaAsset[],
  content: string,
): PlatformValidation {
  const mediaCount = selectedAssets.length;
  const imageCount = selectedAssets.filter((asset) => asset.file_type === "image").length;
  const videoCount = selectedAssets.filter((asset) => asset.file_type === "video").length;
  const otherCount = mediaCount - imageCount - videoCount;
  const hasContent = Boolean(content.trim());
  const label = PLATFORM_LABELS[platform];

  if ((platform === "facebook" || platform === "twitter" || platform === "linkedin") && !hasContent && mediaCount === 0) {
    return {
      valid: false,
      message: `${label} requires text or media.`,
      fixTarget: {
        panel: "compose",
        sectionId: "compose-caption",
        actionLabel: "Open composer",
      },
    };
  }

  if (platform === "facebook") {
    if (otherCount) {
      return {
        valid: false,
        message: "Facebook supports image and video assets only.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    if (videoCount > 1 || (videoCount === 1 && imageCount > 0)) {
      return {
        valid: false,
        message: "Facebook supports either one video or an image set, but not mixed media.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    for (const [index, asset] of selectedAssets.entries()) {
      const error = validateAssetAgainstConstraints("facebook", asset, index);
      if (error) {
        return {
          valid: false,
          message: error,
          fixTarget: {
            panel: "compose",
            sectionId: "compose-media",
            actionLabel: "Review media",
          },
        };
      }
    }
    return { valid: true, message: "Ready for Facebook publishing." };
  }

  if (platform === "instagram") {
    if (mediaCount < 1 || mediaCount > 10) {
      return {
        valid: false,
        message: "Instagram requires 1-10 media items.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    if (otherCount) {
      return {
        valid: false,
        message: "Instagram supports image and video assets only.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    if (mediaCount > 1) {
      const types = new Set(selectedAssets.map((asset) => asset.file_type));
      if (types.size > 1) {
        return {
          valid: false,
          message: "Instagram carousel must contain the same media type for every item.",
          fixTarget: {
            panel: "compose",
            sectionId: "compose-media",
            actionLabel: "Review media",
          },
        };
      }
    }
    if (config.instagramPostType === "reel" && (mediaCount !== 1 || videoCount !== 1)) {
      return {
        valid: false,
        message: "Instagram Reel mode requires exactly one video.",
        fixTarget: {
          panel: "settings",
          sectionId: "instagram-format",
          actionLabel: "Open Instagram settings",
        },
      };
    }
    if (config.instagramPostType === "story" && mediaCount !== 1) {
      return {
        valid: false,
        message: "Instagram Story mode requires exactly one media item.",
        fixTarget: {
          panel: "settings",
          sectionId: "instagram-format",
          actionLabel: "Open Instagram settings",
        },
      };
    }
    if (config.instagramPostType === "carousel" && mediaCount < 2) {
      return {
        valid: false,
        message: "Instagram Carousel mode requires at least 2 media items.",
        fixTarget: {
          panel: "settings",
          sectionId: "instagram-format",
          actionLabel: "Open Instagram settings",
        },
      };
    }
    for (const [index, asset] of selectedAssets.entries()) {
      const error = validateAssetAgainstConstraints("instagram", asset, index);
      if (error) {
        return {
          valid: false,
          message: error,
          fixTarget: {
            panel: "compose",
            sectionId: "compose-media",
            actionLabel: "Review media",
          },
        };
      }
    }
    return { valid: true, message: "Ready for Instagram publishing." };
  }

  if (platform === "linkedin") {
    if (otherCount) {
      return {
        valid: false,
        message: "LinkedIn supports image and video assets only.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    if (mediaCount > 1) {
      return {
        valid: false,
        message: "LinkedIn supports one image or one video per post.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    return { valid: true, message: mediaCount ? "Ready for LinkedIn publishing." : "Ready for a text-only LinkedIn post." };
  }

  if (platform === "twitter") {
    if (otherCount) {
      return {
        valid: false,
        message: "X supports image and video assets only.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    if (imageCount > 4) {
      return {
        valid: false,
        message: "X supports up to 4 images per post.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    if (videoCount > 1 || (videoCount === 1 && imageCount > 0)) {
      return {
        valid: false,
        message: "X supports either a single video or up to 4 images.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    return { valid: true, message: "Ready for X publishing." };
  }

  if (platform === "youtube") {
    if (!config.youtubeTitle.trim()) {
      return {
        valid: false,
        message: "YouTube requires a video title.",
        fixTarget: {
          panel: "settings",
          sectionId: "youtube-video-details",
          actionLabel: "Open YouTube settings",
        },
      };
    }
    if (mediaCount !== 1 || videoCount !== 1 || otherCount > 0 || imageCount > 0) {
      return {
        valid: false,
        message: "YouTube requires exactly one uploaded video.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    return { valid: true, message: "Ready for YouTube publishing." };
  }

  if (platform === "blogger") {
    if (!hasContent && mediaCount === 0) {
      return {
        valid: false,
        message: "Blogger requires text or media content.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-caption",
          actionLabel: "Open composer",
        },
      };
    }
    return { valid: true, message: "Ready for Blogger publishing." };
  }

  if (platform === "google_business") {
    if (!hasContent && mediaCount === 0) {
      return {
        valid: false,
        message: "Google Business requires text or media content.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-caption",
          actionLabel: "Open composer",
        },
      };
    }
    if (otherCount) {
      return {
        valid: false,
        message: "Google Business supports image and video assets only.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    if (mediaCount > 1) {
      return {
        valid: false,
        message: "Google Business supports one image or one video per post.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    return { valid: true, message: "Ready for Google Business publishing." };
  }

  if (platform === "wordpress") {
    if (!hasContent && mediaCount === 0) {
      return {
        valid: false,
        message: "WordPress requires text or media content.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-caption",
          actionLabel: "Open composer",
        },
      };
    }
    if (otherCount) {
      return {
        valid: false,
        message: "WordPress supports image and video assets only.",
        fixTarget: {
          panel: "compose",
          sectionId: "compose-media",
          actionLabel: "Review media",
        },
      };
    }
    return { valid: true, message: "Ready for WordPress publishing." };
  }

  return { valid: true, message: `Ready for ${label} publishing.` };
}
