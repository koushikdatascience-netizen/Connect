import { PlatformName } from "@/lib/types";
import { PlatformConfig, PlatformDescriptor } from "@/components/create-post/types";

export const PLATFORM_ORDER: PlatformName[] = [
  "facebook",
  "instagram",
  "linkedin",
  "twitter",
  "youtube",
  "blogger",
  "google_business",
  "wordpress",
];

export const PLATFORM_META: Record<PlatformName, PlatformDescriptor> = {
  facebook: {
    id: "facebook",
    label: "Facebook",
    description: "Pages, communities, and campaigns",
    accentClass: "text-[#93c5fd]",
    surfaceClass: "from-[#0f2138] to-[#111827]",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    description: "Visual storytelling, reels, and carousels",
    accentClass: "text-[#f9a8d4]",
    surfaceClass: "from-[#35142a] to-[#161321]",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    description: "Professional reach for profiles and pages",
    accentClass: "text-[#7dd3fc]",
    surfaceClass: "from-[#0f2333] to-[#131825]",
  },
  twitter: {
    id: "twitter",
    label: "X",
    description: "Fast-moving updates and announcement threads",
    accentClass: "text-[#e5e7eb]",
    surfaceClass: "from-[#171717] to-[#111827]",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    description: "Video-first publishing",
    accentClass: "text-[#fca5a5]",
    surfaceClass: "from-[#351314] to-[#16131a]",
  },
  blogger: {
    id: "blogger",
    label: "Blogger",
    description: "Blog publishing with simple formatting",
    accentClass: "text-[#fdba74]",
    surfaceClass: "from-[#342014] to-[#18151b]",
  },
  google_business: {
    id: "google_business",
    label: "Google Business",
    description: "Local updates for business listings",
    accentClass: "text-[#93c5fd]",
    surfaceClass: "from-[#102238] to-[#151826]",
  },
  wordpress: {
    id: "wordpress",
    label: "WordPress",
    description: "Long-form content and owned channels",
    accentClass: "text-[#cbd5e1]",
    surfaceClass: "from-[#1a1f2a] to-[#151821]",
  },
};

export const PLATFORM_LABELS = Object.fromEntries(
  PLATFORM_ORDER.map((platform) => [platform, PLATFORM_META[platform].label]),
) as Record<PlatformName, string>;

export function createDefaultPlatformConfig(): PlatformConfig {
  return {
    // Shared
    schedule: "",

    // Facebook
    facebookPageId: "default",
    facebookVisibility: "EVERYONE",
    facebookCta: "NO_BUTTON",
    facebookTargetingEnabled: false,
    facebookTargetAge: "",
    facebookTargetCountries: "",

    // Instagram
    instagramCaptionStyle: "balanced",
    instagramHashtags: "",
    instagramFirstCommentEnabled: false,
    instagramFirstComment: "",
    instagramPostType: "post",
    instagramLocationId: "",
    instagramUserTags: "",
    instagramShareToFacebook: false,

    // LinkedIn
    linkedinAudience: "PUBLIC",
    linkedinHashtags: "",
    linkedinEntityType: "profile",
    linkedinLifecycleState: "PUBLISHED",
    linkedinContentTopics: "",
    linkedinMultiImageEnabled: false,

    // Twitter / X
    twitterReplySettings: "everyone",
    twitterThreadMode: false,
    twitterSensitive: false,
    twitterCardEnabled: true,
    twitterForSuperFollowers: false,

    // YouTube
    youtubeTitle: "",
    youtubePrivacy: "public",
    youtubeCategoryId: "22",
    youtubeTags: "",
    youtubeNotifySubscribers: true,
    youtubeEmbeddable: true,
    youtubeLicense: "youtube",
    youtubeMadeForKids: false,
    youtubeLanguage: "en",
    youtubeDefaultAudioLanguage: "en",
    youtubePublishAt: "",

    // Blogger
    bloggerTitle: "",
    bloggerLabels: "",
    bloggerIsDraft: false,
    bloggerReaderComments: "ALLOW",
    bloggerCustomMetaRobotsTags: "",
    bloggerLocation: "",

    // Google Business
    googleBusinessPostType: "STANDARD",
    googleBusinessCta: "NONE",
    googleBusinessCtaUrl: "",
    googleBusinessEventTitle: "",
    googleBusinessEventStartDate: "",
    googleBusinessEventEndDate: "",
    googleBusinessOfferCode: "",
    googleBusinessOfferRedeemUrl: "",
    googleBusinessOfferTerms: "",
    googleBusinessAlertType: "",
    googleBusinessTopicType: "STANDARD",

    // WordPress
    wordpressTitle: "",
    wordpressStatus: "publish",
    wordpressCategories: "",
    wordpressTags: "",
    wordpressSlug: "",
    wordpressExcerpt: "",
    wordpressCommentStatus: "open",
    wordpressPingStatus: "open",
    wordpressFeaturedMediaEnabled: true,
    wordpressFormat: "standard",
    wordpressSticky: false,
    wordpressAuthorId: "",
    wordpressPassword: "",
  };
}
