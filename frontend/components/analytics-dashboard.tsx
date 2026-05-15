"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";

import { ErrorNotice } from "@/components/error-notice";
import {
  fetchAccounts,
  fetchAnalyticsHeatmap,
  fetchAnalyticsOverview,
  fetchAnalyticsPlatformBreakdown,
  fetchAnalyticsTimeseries,
  fetchAnalyticsTopPosts,
  fetchAnalyticsTopics,
  syncAnalyticsSnapshots,
} from "@/lib/api";
import {
  Account,
  AnalyticsHeatmapCell,
  AnalyticsOverviewResponse,
  AnalyticsPlatformBreakdownItem,
  AnalyticsTimeseriesResponse,
  AnalyticsTopPostItem,
  AnalyticsWordCloudItem,
  PlatformName,
} from "@/lib/types";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

const PLATFORM_COLORS: Record<string, { strong: string; soft: string; glow: string }> = {
  instagram: { strong: "#ff7b4a", soft: "rgba(255,123,74,0.16)", glow: "#ffb289" },
  facebook: { strong: "#4e7bff", soft: "rgba(78,123,255,0.16)", glow: "#9eb8ff" },
  twitter: { strong: "#171717", soft: "rgba(23,23,23,0.08)", glow: "#7f7f7f" },
  youtube: { strong: "#e64b3c", soft: "rgba(230,75,60,0.16)", glow: "#ff9e95" },
  linkedin: { strong: "#1185c7", soft: "rgba(17,133,199,0.16)", glow: "#87cdf7" },
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_RANGES = [
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "90d", label: "90D", days: 90 },
];
const ANALYTICS_PLATFORMS: PlatformName[] = ["instagram", "facebook", "twitter", "youtube", "linkedin"];

function PlatformIcon({
  platform,
  className = "",
}: {
  platform: string;
  className?: string;
}) {
  if (platform === "instagram") return <FaInstagram className={className} aria-hidden="true" />;
  if (platform === "facebook") return <FaFacebookF className={className} aria-hidden="true" />;
  if (platform === "twitter") return <RiTwitterXFill className={className} aria-hidden="true" />;
  if (platform === "youtube") return <FaYoutube className={className} aria-hidden="true" />;
  if (platform === "linkedin") return <FaLinkedinIn className={className} aria-hidden="true" />;
  return null;
}

function isoDateDaysAgo(days: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
}

function isoDateToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;
}

function formatDelta(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(1)}%`;
}

function formatDateLabel(value?: string | null) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function toneForDelta(value: number) {
  if (value > 0) return "text-[#1f9c68]";
  if (value < 0) return "text-[#d15743]";
  return "text-[#7d725e]";
}

function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-[#eadfcf] bg-[linear-gradient(180deg,rgba(255,252,245,0.98),rgba(248,243,232,0.96))] p-4 shadow-[0_18px_40px_rgba(108,84,24,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(108,84,24,0.14)] sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#171311]">{title}</h2>
          <p className="mt-1 text-sm text-[#6a5d47]">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TrendChart({ points }: { points: AnalyticsTimeseriesResponse["points"] }) {
  const width = 720;
  const height = 260;
  const padding = 24;
  const maxMetric = Math.max(10, ...points.map((point) => Math.max(point.impressions, point.engagements * 15)));

  const projectX = (index: number) =>
    padding + (index * (width - padding * 2)) / Math.max(1, points.length - 1);
  const projectY = (value: number) =>
    height - padding - ((height - padding * 2) * value) / maxMetric;

  const impressionsPath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${projectX(index)} ${projectY(point.impressions)}`)
    .join(" ");
  const engagementPath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${projectX(index)} ${projectY(point.engagements * 15)}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] min-w-[640px] w-full">
        <defs>
          <linearGradient id="analyticsImpressions" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#f2b742" />
            <stop offset="100%" stopColor="#ef744d" />
          </linearGradient>
          <linearGradient id="analyticsEngagements" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#1aa06c" />
            <stop offset="100%" stopColor="#1185c7" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) * line) / 3;
          return <line key={line} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#eadfcf" strokeDasharray="6 8" />;
        })}
        <path d={impressionsPath || `M ${padding} ${height - padding} L ${width - padding} ${height - padding}`} fill="none" stroke="url(#analyticsImpressions)" strokeWidth="5" strokeLinecap="round" />
        <path d={engagementPath || `M ${padding} ${height - padding} L ${width - padding} ${height - padding}`} fill="none" stroke="url(#analyticsEngagements)" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
        {points.map((point, index) => (
          <g key={`${point.timestamp}-${index}`}>
            <circle cx={projectX(index)} cy={projectY(point.impressions)} r="4.5" fill="#f6c454" stroke="#fffaf0" strokeWidth="2" />
            <circle cx={projectX(index)} cy={projectY(point.engagements * 15)} r="4" fill="#1aa06c" stroke="#fffaf0" strokeWidth="2" />
            <text x={projectX(index)} y={height - 4} textAnchor="middle" fontSize="11" fill="#7b6e58">
              {formatDateLabel(point.timestamp)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RadialShare({ items }: { items: AnalyticsPlatformBreakdownItem[] }) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.engagements, 0));
  let offset = 0;
  const circumference = 2 * Math.PI * 62;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="flex items-center justify-center">
        <div className="relative flex h-[240px] w-[240px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(255,250,239,0.95),rgba(243,233,214,0.86))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <svg viewBox="0 0 180 180" className="h-[180px] w-[180px] -rotate-90">
            <circle cx="90" cy="90" r="62" fill="none" stroke="#efe4d2" strokeWidth="22" />
            {items.map((item) => {
              const share = item.engagements / total;
              const dash = share * circumference;
              const segment = (
                <circle
                  key={item.platform}
                  cx="90"
                  cy="90"
                  r="62"
                  fill="none"
                  stroke={PLATFORM_COLORS[item.platform]?.strong ?? "#8c7b66"}
                  strokeWidth="22"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += dash;
              return segment;
            })}
          </svg>
          <div className="absolute text-center">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#8c7b66]">Engagement Mix</div>
            <div className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-[#171311]">
              {formatCompactNumber(total)}
            </div>
            <div className="mt-1 text-sm text-[#6a5d47]">latest cross-platform interactions</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.platform} className="group rounded-[22px] border border-[#efe4d2] bg-white/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/88 hover:shadow-[0_18px_32px_rgba(96,73,20,0.12)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full transition duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: PLATFORM_COLORS[item.platform]?.soft ?? "rgba(0,0,0,0.06)",
                    color: PLATFORM_COLORS[item.platform]?.strong ?? "#8c7b66",
                  }}
                >
                  <PlatformIcon platform={item.platform} className="text-sm" />
                </span>
                <div className="font-semibold text-[#171311]">{PLATFORM_LABELS[item.platform] ?? item.platform}</div>
              </div>
              <div className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: PLATFORM_COLORS[item.platform]?.soft ?? "rgba(0,0,0,0.06)", color: PLATFORM_COLORS[item.platform]?.strong ?? "#171311" }}>
                {formatPercent(item.engagement_rate)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[#7d725e]">Posts</div>
                <div className="mt-1 text-lg font-semibold text-[#171311]">{item.post_count}</div>
              </div>
              <div>
                <div className="text-[#7d725e]">Engagements</div>
                <div className="mt-1 text-lg font-semibold text-[#171311]">{formatCompactNumber(item.engagements)}</div>
              </div>
              <div>
                <div className="text-[#7d725e]">Impressions</div>
                <div className="mt-1 text-lg font-semibold text-[#171311]">{formatCompactNumber(item.impressions)}</div>
              </div>
              <div>
                <div className="text-[#7d725e]">Views</div>
                <div className="mt-1 text-lg font-semibold text-[#171311]">{formatCompactNumber(item.views)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BubbleChart({ items }: { items: AnalyticsTopPostItem[] }) {
  const width = 700;
  const height = 260;
  const padding = 28;
  const maxImpressions = Math.max(100, ...items.map((item) => item.impressions));
  const maxRate = Math.max(0.02, ...items.map((item) => item.engagement_rate));
  const maxViews = Math.max(10, ...items.map((item) => item.views || item.engagements));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] min-w-[620px] w-full">
        {[0, 1, 2, 3].map((row) => {
          const y = padding + ((height - padding * 2) * row) / 3;
          return <line key={row} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#eadfcf" strokeDasharray="6 8" />;
        })}
        {[0, 1, 2, 3].map((col) => {
          const x = padding + ((width - padding * 2) * col) / 3;
          return <line key={col} x1={x} y1={padding} x2={x} y2={height - padding} stroke="#f2eadb" />;
        })}
        {items.map((item) => {
          const x = padding + ((width - padding * 2) * item.impressions) / maxImpressions;
          const y = height - padding - ((height - padding * 2) * item.engagement_rate) / maxRate;
          const radius = 10 + ((item.views || item.engagements) / maxViews) * 24;
          const color = PLATFORM_COLORS[item.platform]?.strong ?? "#171311";
          return (
            <g key={item.post_id}>
              <circle cx={x} cy={y} r={radius} fill={color} opacity="0.18" />
              <circle cx={x} cy={y} r={Math.max(7, radius * 0.48)} fill={color} opacity="0.82" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#fffaf0">
                {item.post_id}
              </text>
            </g>
          );
        })}
        <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="12" fill="#7b6e58">Impressions</text>
        <text x={16} y={height / 2} transform={`rotate(-90 16 ${height / 2})`} textAnchor="middle" fontSize="12" fill="#7b6e58">Engagement rate</text>
      </svg>
    </div>
  );
}

function Heatmap({ cells }: { cells: AnalyticsHeatmapCell[] }) {
  const maxRate = Math.max(0.001, ...cells.map((cell) => cell.engagement_rate));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1">
          <div />
          {Array.from({ length: 24 }).map((_, hour) => (
            <div key={hour} className="text-center text-[10px] font-medium text-[#7b6e58]">
              {hour}
            </div>
          ))}
          {WEEKDAY_LABELS.map((day, weekday) => (
            <FragmentRow
              key={day}
              weekday={weekday}
              day={day}
              cells={cells.filter((cell) => cell.weekday === weekday)}
              maxRate={maxRate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  weekday,
  day,
  cells,
  maxRate,
}: {
  weekday: number;
  day: string;
  cells: AnalyticsHeatmapCell[];
  maxRate: number;
}) {
  return (
    <>
      <div className="flex items-center text-sm font-medium text-[#5d523d]">{day}</div>
      {Array.from({ length: 24 }).map((_, hour) => {
        const cell = cells.find((item) => item.hour === hour) ?? {
          weekday,
          hour,
          engagements: 0,
          impressions: 0,
          engagement_rate: 0,
          post_count: 0,
        };
        const intensity = cell.engagement_rate / maxRate;
        return (
          <div
            key={`${weekday}-${hour}`}
            className="group relative h-8 rounded-[10px] border border-white/50"
            style={{
              background:
                intensity > 0
                  ? `linear-gradient(135deg, rgba(255,208,76,${0.2 + intensity * 0.45}), rgba(26,160,108,${0.14 + intensity * 0.55}))`
                  : "rgba(246,241,232,0.75)",
            }}
          >
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 rounded-xl bg-[#171311] px-2.5 py-2 text-[11px] text-[#fff7ea] shadow-[0_18px_36px_rgba(0,0,0,0.22)] group-hover:block">
              {day} {hour}:00
              <div>{formatPercent(cell.engagement_rate)} rate</div>
              <div>{cell.post_count} posts</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function WordCloud({ items }: { items: AnalyticsWordCloudItem[] }) {
  const maxWeight = Math.max(1, ...items.map((item) => item.weight));
  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-[24px] border border-[#efe4d2] bg-[radial-gradient(circle_at_top,rgba(255,227,160,0.28),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(246,241,232,0.88))]">
      {items.map((item, index) => {
        const row = index % 6;
        const col = Math.floor(index / 6);
        const size = 15 + (item.weight / maxWeight) * 18;
        const left = 8 + (col % 4) * 23 + (row % 2) * 4;
        const top = 10 + row * 14 + (col % 2) * 2;
        const rotate = (index % 5) * 4 - 8;
        const palette = ["#171311", "#1185c7", "#1a8a63", "#ca5a39", "#b07a0d"];
        return (
          <span
            key={item.term}
            className="absolute rounded-full px-3 py-1 font-semibold transition-transform hover:scale-105"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              fontSize: `${size}px`,
              color: palette[index % palette.length],
              transform: `rotate(${rotate}deg)`,
              backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.44)" : "rgba(255,241,209,0.34)",
            }}
          >
            {item.term}
          </span>
        );
      })}
    </div>
  );
}

export function AnalyticsDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [timeseries, setTimeseries] = useState<AnalyticsTimeseriesResponse | null>(null);
  const [platforms, setPlatforms] = useState<AnalyticsPlatformBreakdownItem[]>([]);
  const [topPosts, setTopPosts] = useState<AnalyticsTopPostItem[]>([]);
  const [heatmap, setHeatmap] = useState<AnalyticsHeatmapCell[]>([]);
  const [topics, setTopics] = useState<AnalyticsWordCloudItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]["id"]>("30d");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [postSearch, setPostSearch] = useState("");
  const deferredSearch = useDeferredValue(postSearch);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.is_active && ANALYTICS_PLATFORMS.includes(account.platform as PlatformName)),
    [accounts],
  );

  const rangeDays = TIME_RANGES.find((item) => item.id === timeRange)?.days ?? 30;
  const query = useMemo(
    () => ({
      startDate: isoDateDaysAgo(rangeDays - 1),
      endDate: isoDateToday(),
      platforms: selectedPlatforms,
      socialAccountId: selectedAccountId,
    }),
    [rangeDays, selectedPlatforms, selectedAccountId],
  );

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [accountsData, overviewData, timeseriesData, platformData, topPostsData, heatmapData, topicsData] =
        await Promise.all([
          fetchAccounts(),
          fetchAnalyticsOverview(query),
          fetchAnalyticsTimeseries(query),
          fetchAnalyticsPlatformBreakdown(query),
          fetchAnalyticsTopPosts({ ...query, limit: 12 }),
          fetchAnalyticsHeatmap(query),
          fetchAnalyticsTopics({ startDate: query.startDate, endDate: query.endDate, limit: 24 }),
        ]);

      setAccounts(accountsData);
      setOverview(overviewData);
      setTimeseries(timeseriesData);
      setPlatforms(platformData);
      setTopPosts(topPostsData);
      setHeatmap(heatmapData);
      setTopics(topicsData);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, [query.startDate, query.endDate, query.platforms, query.socialAccountId]);

  const filteredTopPosts = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) return topPosts;
    return topPosts.filter((post) =>
      [post.content_preview, post.account_name, PLATFORM_LABELS[post.platform] ?? post.platform]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [deferredSearch, topPosts]);

  const metricCards = useMemo(() => {
    if (!overview) return [];
    return [
      { label: "Engagements", value: formatCompactNumber(overview.totals.engagements), delta: overview.deltas.engagements },
      { label: "Impressions", value: formatCompactNumber(overview.totals.impressions), delta: overview.deltas.impressions },
      { label: "Reach", value: formatCompactNumber(overview.totals.reach), delta: overview.deltas.reach },
      { label: "Engagement Rate", value: formatPercent(overview.totals.engagement_rate), delta: overview.deltas.engagement_rate },
    ];
  }, [overview]);

  const platformPills = ANALYTICS_PLATFORMS.map((platform) => ({
    value: platform,
    label: PLATFORM_LABELS[platform],
  }));
  const featuredPlatforms = ANALYTICS_PLATFORMS.slice(0, 5);

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await syncAnalyticsSnapshots(selectedPlatforms);
      await loadAnalytics();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Analytics sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  function togglePlatform(platform: string) {
    startTransition(() => {
      setSelectedPlatforms((current) =>
        current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
      );
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,214,110,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(28,144,207,0.16),transparent_26%),linear-gradient(180deg,#f9f3e7_0%,#f3ead9_52%,#efe6d4_100%)] px-3 py-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[1480px] space-y-5">
        <ErrorNotice error={error} fallback="We couldn't load analytics right now." />

        <section className="overflow-hidden rounded-[34px] border border-[#e7d8bd] bg-[linear-gradient(120deg,rgba(255,252,244,0.96),rgba(255,246,221,0.94)_44%,rgba(242,230,204,0.96))] p-5 shadow-[0_24px_60px_rgba(100,76,18,0.12)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-[#e2ca80] bg-[#fff2c7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e6a09]">
                Live Social Intelligence
              </div>
              <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.06em] text-[#171311] sm:text-5xl">
                Advanced analytics for the channels that move revenue, not vanity.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#615541] sm:text-[15px]">
                Cross-network performance is now aggregated from real provider metrics snapshots, giving you a live report layer instead of only scheduler stats.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {featuredPlatforms.map((platform) => (
                  <div
                    key={platform}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/65 px-3 py-2 text-xs font-semibold text-[#5f533f] shadow-[0_10px_18px_rgba(125,94,33,0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-[#e2ca80] hover:bg-white/85 hover:shadow-[0_16px_24px_rgba(125,94,33,0.16)]"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full transition duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: PLATFORM_COLORS[platform].soft,
                        color: PLATFORM_COLORS[platform].strong,
                      }}
                    >
                      <PlatformIcon platform={platform} className="text-sm" />
                    </span>
                    {PLATFORM_LABELS[platform]}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => setTimeRange(range.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${timeRange === range.id ? "bg-[#171311] text-[#fff7ea]" : "border border-[#e5d8c3] bg-white/70 text-[#5f533f] hover:bg-white"}`}
                >
                  {range.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void handleSyncNow()}
                disabled={syncing}
                className="rounded-full bg-[linear-gradient(135deg,#171311,#3d3016)] px-5 py-2.5 text-sm font-semibold text-[#fff4da] shadow-[0_14px_30px_rgba(23,19,17,0.22)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
              >
                {syncing ? "Syncing..." : "Refresh Snapshots"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_320px]">
            <div className="flex flex-wrap gap-2">
              {platformPills.map((platform) => {
                const active = selectedPlatforms.includes(platform.value);
                return (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => togglePlatform(platform.value)}
                    className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(109,84,23,0.12)]"
                    style={{
                      borderColor: active ? PLATFORM_COLORS[platform.value].strong : "#e3d8c8",
                      backgroundColor: active ? PLATFORM_COLORS[platform.value].soft : "rgba(255,255,255,0.68)",
                      color: active ? PLATFORM_COLORS[platform.value].strong : "#5d523f",
                    }}
                  >
                          <PlatformIcon platform={platform.value} className="text-sm transition duration-300 group-hover:scale-110" />
                    {platform.label}
                  </button>
                );
              })}
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#594d3a]">
              Account focus
              <select
                value={selectedAccountId ?? ""}
                onChange={(event) => setSelectedAccountId(event.target.value ? Number(event.target.value) : null)}
                className="rounded-2xl border border-[#dfd3c1] bg-white/78 px-4 py-3 text-sm text-[#171311] outline-none"
              >
                <option value="">All active accounts</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} · {PLATFORM_LABELS[account.platform] ?? account.platform}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <section key={card.label} className="rounded-[26px] border border-[#eadfcf] bg-white/80 p-4 shadow-[0_14px_34px_rgba(107,83,20,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#e3c98b] hover:shadow-[0_20px_40px_rgba(107,83,20,0.16)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d725e]">{card.label}</div>
              <div className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-[#171311]">{loading ? "..." : card.value}</div>
              <div className={`mt-2 text-sm font-semibold ${toneForDelta(card.delta ?? 0)}`}>
                {loading ? "Loading..." : `${formatDelta(card.delta ?? 0)} vs prior period`}
              </div>
            </section>
          ))}
        </div>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <ChartCard title="Momentum" subtitle="Impressions versus weighted engagement volume through the selected window.">
            <TrendChart points={timeseries?.points ?? []} />
          </ChartCard>

          <ChartCard title="Platform Contribution" subtitle="A radial view of where engagement is really coming from.">
            <RadialShare items={platforms} />
          </ChartCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="Post Opportunity Matrix" subtitle="Bubble size favors content that drives either views or raw engagement.">
            <BubbleChart items={topPosts.slice(0, 8)} />
          </ChartCard>

          <ChartCard title="Best Publish Windows" subtitle="Heat cells strengthen as engagement rate improves for that weekday and hour.">
            <Heatmap cells={heatmap} />
          </ChartCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ChartCard title="Top Performing Posts" subtitle="Latest snapshot per post, ranked by total normalized engagements.">
            <div className="mb-4">
              <input
                value={postSearch}
                onChange={(event) => setPostSearch(event.target.value)}
                placeholder="Search posts, accounts, or platforms"
                className="w-full rounded-2xl border border-[#dfd3c1] bg-white/76 px-4 py-3 text-sm text-[#171311] outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[#eadfcf] text-xs uppercase tracking-[0.16em] text-[#7d725e]">
                    <th className="pb-3 pr-4">Post</th>
                    <th className="pb-3 pr-4">Platform</th>
                    <th className="pb-3 pr-4">Engagements</th>
                    <th className="pb-3 pr-4">Impressions</th>
                    <th className="pb-3 pr-4">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopPosts.map((post) => (
                    <tr key={post.post_id} className="group border-b border-[#f1e7d7] align-top transition duration-300 hover:bg-white/60 last:border-0">
                      <td className="py-4 pr-4">
                        <div className="max-w-[340px] transition duration-300 group-hover:translate-x-1">
                          <div className="font-semibold text-[#171311]">{post.account_name ?? "Unknown account"}</div>
                          <div className="mt-1 text-sm leading-6 text-[#665946]">{post.content_preview ?? "No content preview"}</div>
                          <div className="mt-1 text-xs text-[#8c7f68]">{formatDateLabel(post.posted_at)}</div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition duration-300 group-hover:scale-[1.03]"
                          style={{ backgroundColor: PLATFORM_COLORS[post.platform]?.soft ?? "rgba(0,0,0,0.06)", color: PLATFORM_COLORS[post.platform]?.strong ?? "#171311" }}
                        >
                          <PlatformIcon platform={post.platform} className="text-sm transition duration-300 group-hover:rotate-6" />
                          {PLATFORM_LABELS[post.platform] ?? post.platform}
                        </span>
                      </td>
                      <td className="py-4 pr-4 font-semibold text-[#171311]">{formatCompactNumber(post.engagements)}</td>
                      <td className="py-4 pr-4 text-[#4f4434]">{formatCompactNumber(post.impressions)}</td>
                      <td className="py-4 pr-4 font-semibold text-[#1a8a63]">{formatPercent(post.engagement_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Topic Cloud" subtitle="Most repeated words from published post copy in the selected range.">
            <WordCloud items={topics} />
          </ChartCard>
        </div>
      </div>
    </main>
  );
}
