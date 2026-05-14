export type AccountStatusItem = {
  connected: boolean;
  active_accounts: number;
};

export type AccountStatusResponse = {
  facebook: AccountStatusItem;
  instagram: AccountStatusItem;
  linkedin: AccountStatusItem;
  twitter: AccountStatusItem;
  youtube: AccountStatusItem;
  blogger: AccountStatusItem;
  google_business: AccountStatusItem;
  wordpress: AccountStatusItem;
};

export type Account = {
  id: number;
  tenant_id: string;
  platform: string;
  account_type?: string | null;
  platform_account_id: string;
  account_name: string;
  profile_picture_url?: string | null;
  is_active: boolean;
};

export type MediaAsset = {
  id: number;
  tenant_id: string;
  file_url: string;
  file_type: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  width_px?: number | null;
  height_px?: number | null;
  duration_seconds?: number | null;
  alt_text?: string | null;
};

export type Post = {
  id: number;
  social_account_id: number;
  tenant_id: string;
  platform: string;
  content?: string | null;
  platform_options: Record<string, unknown>;
  scheduled_at?: string | null;
  posted_at?: string | null;
  status: string;
  retry_count: number;
  max_retries: number;
  error_message?: string | null;
  platform_post_id?: string | null;
  media_ids: number[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type PostLiveMetricsResponse = {
  post_id: number;
  platform: string;
  provider_post_id?: string | null;
  available: boolean;
  fetched_at: string;
  metrics: Record<string, unknown>;
  message?: string | null;
};

export type NormalizedPostMetrics = {
  likes: number;
  comments: number;
  views: number;
  shares: number;
  impressions: number;
};

export type PlatformName =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "youtube"
  | "blogger"
  | "google_business"
  | "wordpress";

export type AnalyticsOverviewTotals = {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  views: number;
  clicks: number;
  engagements: number;
  engagement_rate: number;
};

export type AnalyticsOverviewResponse = {
  range: { from: string; to: string };
  compare_range?: { from: string; to: string } | null;
  totals: AnalyticsOverviewTotals;
  deltas: Record<string, number>;
};

export type AnalyticsTimeseriesPoint = {
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  views: number;
  clicks: number;
  engagements: number;
};

export type AnalyticsTimeseriesResponse = {
  range: { from: string; to: string };
  interval: string;
  points: AnalyticsTimeseriesPoint[];
};

export type AnalyticsPlatformBreakdownItem = {
  platform: string;
  post_count: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  views: number;
  clicks: number;
  engagements: number;
  engagement_rate: number;
};

export type AnalyticsTopPostItem = {
  post_id: number;
  platform: string;
  social_account_id?: number | null;
  account_name?: string | null;
  content_preview?: string | null;
  posted_at?: string | null;
  permalink?: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  views: number;
  clicks: number;
  engagements: number;
  engagement_rate: number;
  raw_metrics: Record<string, unknown>;
};

export type AnalyticsHeatmapCell = {
  weekday: number;
  hour: number;
  engagements: number;
  impressions: number;
  engagement_rate: number;
  post_count: number;
};

export type AnalyticsWordCloudItem = {
  term: string;
  weight: number;
};

export type AnalyticsSyncResponse = {
  sync_run_id: number;
  status: string;
  objects_seen: number;
  objects_synced: number;
  error_count: number;
  message?: string | null;
};
