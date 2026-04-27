// components/create-post/types.ts

export type PlatformName =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "youtube"
  | "blogger"
  | "google_business"
  | "wordpress";

// Base config that applies to all platforms
export type BasePlatformConfig = {
  schedule?: string;                    // ISO datetime string
};

// Platform-specific configurations
export type FacebookConfig = BasePlatformConfig & {
  facebookVisibility?: "public" | "friends" | "only_me";
  facebookCta?: "none" | "learn_more" | "shop_now" | "sign_up";
  facebookPageId?: string;
};

export type InstagramConfig = BasePlatformConfig & {
  instagramPostType?: "post" | "reel" | "story";
  instagramCaptionStyle?: "balanced" | "clean" | "creator";
  instagramHashtags?: string;
  instagramFirstCommentEnabled?: boolean;
  instagramFirstComment?: string;
};

export type LinkedInConfig = BasePlatformConfig & {
  linkedinAudience?: "PUBLIC" | "CONNECTIONS";
  linkedinEntityType?: "profile" | "page";
  linkedinHashtags?: string;
};

export type TwitterConfig = BasePlatformConfig & {
  twitterReplySettings?: "everyone" | "mentionedUsers" | "following";
  twitterThreadMode?: boolean;
};

export type YouTubeConfig = BasePlatformConfig & {
  youtubeTitle?: string;
  youtubeDescription?: string;
  youtubePrivacy?: "public" | "unlisted" | "private";
  youtubeTags?: string;
  youtubeCategory?: string;           // YouTube category ID (e.g., "22", "27")
  youtubeMadeForKids?: boolean;
  youtubeNotifySubscribers?: boolean;
};

export type BloggerConfig = BasePlatformConfig & {
  bloggerTags?: string;
  bloggerLabels?: string;
};

export type GoogleBusinessConfig = BasePlatformConfig & {
  googleBusinessPostType?: "standard" | "offer" | "event";
};

export type WordPressConfig = BasePlatformConfig & {
  wordpressPostStatus?: "publish" | "draft" | "private";
  wordpressCategories?: string;
  wordpressTags?: string;
};

// Main Platform Config Map
export type PlatformConfigMap = {
  facebook: FacebookConfig;
  instagram: InstagramConfig;
  linkedin: LinkedInConfig;
  twitter: TwitterConfig;
  youtube: YouTubeConfig;
  blogger: BloggerConfig;
  google_business: GoogleBusinessConfig;
  wordpress: WordPressConfig;
};

// Default config factory (helpful for initialization)
export const createDefaultPlatformConfig = (platform: PlatformName): PlatformConfigMap[PlatformName] => {
  const base: BasePlatformConfig = { schedule: "" };

  switch (platform) {
    case "facebook":
      return { ...base, facebookVisibility: "public", facebookCta: "none" } as FacebookConfig;
    case "instagram":
      return { 
        ...base, 
        instagramPostType: "post", 
        instagramCaptionStyle: "balanced",
        instagramFirstCommentEnabled: false 
      } as InstagramConfig;
    case "linkedin":
      return { ...base, linkedinAudience: "PUBLIC", linkedinEntityType: "profile" } as LinkedInConfig;
    case "twitter":
      return { ...base, twitterReplySettings: "everyone", twitterThreadMode: false } as TwitterConfig;
    case "youtube":
      return { 
        ...base, 
        youtubePrivacy: "public", 
        youtubeNotifySubscribers: true,
        youtubeMadeForKids: false 
      } as YouTubeConfig;
    case "blogger":
      return { ...base } as BloggerConfig;
    case "google_business":
      return { ...base, googleBusinessPostType: "standard" } as GoogleBusinessConfig;
    case "wordpress":
      return { ...base, wordpressPostStatus: "publish" } as WordPressConfig;
    default:
      return base as any;
  }
};