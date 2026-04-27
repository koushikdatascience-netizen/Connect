import { Account, PlatformName } from "@/lib/types";

export type PlatformDescriptor = {
  id: PlatformName;
  label: string;
  description: string;
  accentClass: string;
  surfaceClass: string;
};

export type SelectedAccountsMap = Record<PlatformName, number[]>;

export type SavedAccountGroup = {
  id: string;
  name: string;
  accountIds: number[];
};

export type PlatformConfig = {
  // Shared
  schedule: string;

  // Facebook
  facebookPageId: string;
  facebookVisibility: "EVERYONE" | "FRIENDS" | "ONLY_ME" | "CUSTOM";
  facebookCta: "NO_BUTTON" | "LEARN_MORE" | "SHOP_NOW" | "SIGN_UP" | "BOOK_NOW" | "CONTACT_US" | "DONATE_NOW" | "DOWNLOAD" | "GET_OFFER" | "GET_QUOTE" | "SUBSCRIBE" | "WATCH_MORE";
  facebookTargetingEnabled: boolean;
  facebookTargetAge: string;
  facebookTargetCountries: string;

  // Instagram
  instagramCaptionStyle: "balanced" | "clean" | "creator";
  instagramHashtags: string;
  instagramFirstCommentEnabled: boolean;
  instagramFirstComment: string;
  instagramPostType: "post" | "reel" | "story" | "carousel";
  instagramLocationId: string;
  instagramUserTags: string;
  instagramShareToFacebook: boolean;

  // LinkedIn
  linkedinAudience: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN";
  linkedinHashtags: string;
  linkedinEntityType: "profile" | "page";
  linkedinLifecycleState: "PUBLISHED" | "DRAFT";
  linkedinContentTopics: string;
  linkedinMultiImageEnabled: boolean;

  // Twitter / X
  twitterReplySettings: "everyone" | "mentionedUsers" | "following" | "subscribers";
  twitterThreadMode: boolean;
  twitterSensitive: boolean;
  twitterCardEnabled: boolean;
  twitterForSuperFollowers: boolean;

  // YouTube
  youtubeTitle: string;
  youtubePrivacy: "public" | "private" | "unlisted";
  youtubeCategoryId: string;
  youtubeTags: string;
  youtubeNotifySubscribers: boolean;
  youtubeEmbeddable: boolean;
  youtubeLicense: "youtube" | "creativeCommon";
  youtubeMadeForKids: boolean;
  youtubeLanguage: string;
  youtubeDefaultAudioLanguage: string;
  youtubePublishAt: string;

  // Blogger
  bloggerTitle: string;
  bloggerLabels: string;
  bloggerIsDraft: boolean;
  bloggerReaderComments: "ALLOW" | "DONT_ALLOW_SHOW_EXISTING" | "DONT_ALLOW_HIDE_EXISTING";
  bloggerCustomMetaRobotsTags: string;
  bloggerLocation: string;

  // Google Business
  googleBusinessPostType: "STANDARD" | "OFFER" | "EVENT";
  googleBusinessCta: "BOOK" | "ORDER" | "SHOP" | "LEARN_MORE" | "SIGN_UP" | "CALL" | "NONE";
  googleBusinessCtaUrl: string;
  googleBusinessEventTitle: string;
  googleBusinessEventStartDate: string;
  googleBusinessEventEndDate: string;
  googleBusinessOfferCode: string;
  googleBusinessOfferRedeemUrl: string;
  googleBusinessOfferTerms: string;
  googleBusinessAlertType: "COVID_19" | "STANDARD" | "";
  googleBusinessTopicType: "STANDARD" | "EVENT" | "OFFER" | "ALERT";

  // WordPress
  wordpressTitle: string;
  wordpressStatus: "publish" | "draft" | "private" | "pending" | "future";
  wordpressCategories: string;
  wordpressTags: string;
  wordpressSlug: string;
  wordpressExcerpt: string;
  wordpressCommentStatus: "open" | "closed";
  wordpressPingStatus: "open" | "closed";
  wordpressFeaturedMediaEnabled: boolean;
  wordpressFormat: "standard" | "aside" | "link" | "quote" | "video" | "audio" | "gallery";
  wordpressSticky: boolean;
  wordpressAuthorId: string;
  wordpressPassword: string;
};

export type PlatformConfigMap = Record<PlatformName, PlatformConfig>;

export type SidebarPlatform = PlatformDescriptor & {
  accounts: Account[];
  selectedAccountIds: number[];
  selected: boolean;
};
