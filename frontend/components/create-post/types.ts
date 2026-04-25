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
  schedule: string;
  facebookPageId: string;
  facebookVisibility: "public" | "friends" | "only_me";
  facebookCta: "none" | "learn_more" | "shop_now" | "sign_up";
  instagramCaptionStyle: "balanced" | "clean" | "creator";
  instagramHashtags: string;
  instagramFirstCommentEnabled: boolean;
  instagramFirstComment: string;
  instagramPostType: "post" | "reel";
  linkedinAudience: "PUBLIC" | "CONNECTIONS";
  linkedinHashtags: string;
  linkedinEntityType: "profile" | "page";
  twitterReplySettings: "everyone" | "mentionedUsers" | "following";
  twitterThreadMode: boolean;
};

export type PlatformConfigMap = Record<PlatformName, PlatformConfig>;

export type SidebarPlatform = PlatformDescriptor & {
  accounts: Account[];
  selectedAccountIds: number[];
  selected: boolean;
};
