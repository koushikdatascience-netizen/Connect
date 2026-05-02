"use client";

import { ReactNode } from "react";

import { PlatformLogo } from "@/components/platform-logo";
import {
  PLATFORM_LABELS,
  PLATFORM_META,
} from "@/components/create-post/constants";
import {
  PlatformConfigMap,
  SelectedAccountsMap,
} from "@/components/create-post/types";
import { Account, PlatformName } from "@/lib/types";

type Props = {
  selectedPlatforms: PlatformName[];
  selectedAccounts: SelectedAccountsMap;
  platformConfigs: PlatformConfigMap;
  accountsByPlatform: Record<PlatformName, Account[]>;
  expandedPlatforms: Record<string, boolean>;
  activePlatformTab: PlatformName | null;
  onTabChange: (platform: PlatformName) => void;
  onToggleExpand: (platform: PlatformName) => void;
  onConfigChange: <K extends keyof PlatformConfigMap[PlatformName]>(
    platform: PlatformName,
    key: K,
    value: PlatformConfigMap[PlatformName][K],
  ) => void;
};

const inputCls =
  "w-full rounded-[16px] border border-[#e7dcc9] bg-[#fffdfa] px-3 py-2.5 text-sm text-[#241b10] outline-none placeholder:text-[#b3a99d] focus:border-[#d1ac63] focus:ring-2 focus:ring-[#f7ebcb]";

const selectCls = inputCls;

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#6f6558]">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] leading-4 text-[#9d917d]">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`h-5 w-9 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-200"}`}
        />
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </div>
      <div>
        <div className="text-xs font-medium text-gray-800">{label}</div>
        {description && <div className="mt-0.5 text-[10px] leading-4 text-gray-400">{description}</div>}
      </div>
    </label>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  );
}

// ─── Platform-specific settings ──────────────────────────────────────────────

function FacebookSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["facebook"];
  onChange: <K extends keyof PlatformConfigMap["facebook"]>(k: K, v: PlatformConfigMap["facebook"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Post type">
        <select value="photo_post" disabled className={selectCls}>
          <option value="photo_post">Photo post</option>
          <option value="video_post">Video post</option>
          <option value="text_post">Text post</option>
        </select>
      </Field>

      <Field label="Page">
        <select
          value={config.facebookPageId}
          onChange={(e) => onChange("facebookPageId", e.target.value)}
          className={selectCls}
        >
          <option value="default">Select page...</option>
        </select>
      </Field>

      <Field label="Privacy">
        <select
          value={config.facebookVisibility}
          onChange={(e) => onChange("facebookVisibility", e.target.value as typeof config.facebookVisibility)}
          className={selectCls}
        >
          <option value="EVERYONE">Public</option>
          <option value="FRIENDS">Friends</option>
          <option value="ONLY_ME">Only Me</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </Field>

      <Field label="Audience">
        <select className={selectCls} defaultValue="everyone">
          <option value="everyone">Everyone</option>
          <option value="followers">Followers only</option>
        </select>
      </Field>

      <div className="space-y-2 border-t border-gray-100 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Facebook options</p>
        <CheckRow
          checked
          label="Allow comments"
          onChange={() => {}}
        />
        <CheckRow
          checked={false}
          label="Allow shares"
          onChange={() => {}}
        />
        <CheckRow
          checked={false}
          label="Add to your Page's story"
          onChange={() => {}}
        />
      </div>

      <div className="pt-2">
        <ToggleRow
          checked
          label="AI assist (optional)"
          description="Improve content — Enhance your post for better engagement."
          onChange={() => {}}
        />
      </div>

      <button
        type="button"
        className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-700"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
          <path d="M13.836 2.477a.75.75 0 0 1 0 1.061L6.862 10.512a.75.75 0 0 1-.53.22H4.25a.75.75 0 0 1-.75-.75V7.91a.75.75 0 0 1 .22-.53l6.977-6.977a.75.75 0 0 1 1.06 0l2.079 2.073ZM5 9.5h.75L11 4.25l-.75-.75L5 8.75V9.5Z" />
        </svg>
        Reset to default
      </button>
    </div>
  );
}

function InstagramSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["instagram"];
  onChange: <K extends keyof PlatformConfigMap["instagram"]>(k: K, v: PlatformConfigMap["instagram"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Post type">
        <select
          value={config.instagramPostType}
          onChange={(e) => onChange("instagramPostType", e.target.value as typeof config.instagramPostType)}
          className={selectCls}
        >
          <option value="post">Photo / Image Post</option>
          <option value="reel">Reel (video)</option>
          <option value="story">Story</option>
          <option value="carousel">Carousel</option>
        </select>
      </Field>

      <Field label="Caption formatting">
        <select
          value={config.instagramCaptionStyle}
          onChange={(e) => onChange("instagramCaptionStyle", e.target.value as typeof config.instagramCaptionStyle)}
          className={selectCls}
        >
          <option value="balanced">Balanced</option>
          <option value="clean">Minimal</option>
          <option value="creator">Creator style</option>
        </select>
      </Field>

      <Field label="Hashtags" hint="Added to caption or first comment.">
        <input
          value={config.instagramHashtags}
          onChange={(e) => onChange("instagramHashtags", e.target.value)}
          placeholder="#product #launch"
          className={inputCls}
        />
      </Field>

      <ToggleRow
        checked={config.instagramShareToFacebook}
        label="Share to connected Facebook Page"
        description="Cross-post simultaneously to a linked Facebook Page."
        onChange={(v) => onChange("instagramShareToFacebook", v)}
      />

      <ToggleRow
        checked={config.instagramFirstCommentEnabled}
        label="Use first comment for hashtags"
        description="Move hashtags into the first comment automatically."
        onChange={(v) => onChange("instagramFirstCommentEnabled", v)}
      />

      {config.instagramFirstCommentEnabled && (
        <Field label="First comment">
          <textarea
            value={config.instagramFirstComment}
            onChange={(e) => onChange("instagramFirstComment", e.target.value)}
            placeholder="#hashtag1 #hashtag2 …"
            className={`${inputCls} min-h-[80px] resize-none`}
          />
        </Field>
      )}
    </div>
  );
}

function LinkedInSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["linkedin"];
  onChange: <K extends keyof PlatformConfigMap["linkedin"]>(k: K, v: PlatformConfigMap["linkedin"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Author type">
        <select
          value={config.linkedinEntityType}
          onChange={(e) => onChange("linkedinEntityType", e.target.value as typeof config.linkedinEntityType)}
          className={selectCls}
        >
          <option value="profile">Personal Profile</option>
          <option value="page">Company / Organisation Page</option>
        </select>
      </Field>

      <Field label="Visibility">
        <select
          value={config.linkedinAudience}
          onChange={(e) => onChange("linkedinAudience", e.target.value as typeof config.linkedinAudience)}
          className={selectCls}
        >
          <option value="PUBLIC">Public — Anyone</option>
          <option value="LOGGED_IN">LinkedIn members only</option>
          <option value="CONNECTIONS">Connections only</option>
        </select>
      </Field>

      <Field label="Hashtags" hint="LinkedIn recommends 3–5 relevant tags.">
        <input
          value={config.linkedinHashtags}
          onChange={(e) => onChange("linkedinHashtags", e.target.value)}
          placeholder="#b2b, #founders, #growth"
          className={inputCls}
        />
      </Field>

      <ToggleRow
        checked={config.linkedinMultiImageEnabled}
        label="Multi-image post"
        description="Publish as a carousel with all selected media."
        onChange={(v) => onChange("linkedinMultiImageEnabled", v)}
      />
    </div>
  );
}

function TwitterSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["twitter"];
  onChange: <K extends keyof PlatformConfigMap["twitter"]>(k: K, v: PlatformConfigMap["twitter"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Who can reply">
        <select
          value={config.twitterReplySettings}
          onChange={(e) => onChange("twitterReplySettings", e.target.value as typeof config.twitterReplySettings)}
          className={selectCls}
        >
          <option value="everyone">Everyone</option>
          <option value="mentionedUsers">Mentioned users only</option>
          <option value="following">Accounts you follow</option>
          <option value="subscribers">Subscribers only</option>
        </select>
      </Field>

      <ToggleRow
        checked={config.twitterThreadMode}
        label="Thread mode"
        description="Split longer copy into a numbered thread."
        onChange={(v) => onChange("twitterThreadMode", v)}
      />

      <ToggleRow
        checked={config.twitterCardEnabled}
        label="Attach Twitter Card"
        description="Embed a link preview card when a URL is present."
        onChange={(v) => onChange("twitterCardEnabled", v)}
      />

      <ToggleRow
        checked={config.twitterSensitive}
        label="Mark media as sensitive"
        onChange={(v) => onChange("twitterSensitive", v)}
      />
    </div>
  );
}

function YouTubeSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["youtube"];
  onChange: <K extends keyof PlatformConfigMap["youtube"]>(k: K, v: PlatformConfigMap["youtube"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Video title" hint="Required before publishing.">
        <input value={config.youtubeTitle} onChange={(e) => onChange("youtubeTitle", e.target.value)} placeholder="Enter YouTube title" className={inputCls} />
      </Field>

      <Field label="Privacy">
        <select value={config.youtubePrivacy} onChange={(e) => onChange("youtubePrivacy", e.target.value as typeof config.youtubePrivacy)} className={selectCls}>
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
      </Field>

      <Field label="Category ID">
        <input value={config.youtubeCategoryId} onChange={(e) => onChange("youtubeCategoryId", e.target.value)} placeholder="22" className={inputCls} />
      </Field>

      <Field label="Tags">
        <input value={config.youtubeTags} onChange={(e) => onChange("youtubeTags", e.target.value)} placeholder="product, launch, demo" className={inputCls} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow checked={config.youtubeNotifySubscribers} label="Notify subscribers" onChange={(v) => onChange("youtubeNotifySubscribers", v)} />
        <ToggleRow checked={config.youtubeEmbeddable} label="Embeddable" onChange={(v) => onChange("youtubeEmbeddable", v)} />
        <ToggleRow checked={config.youtubeMadeForKids} label="Made for kids" onChange={(v) => onChange("youtubeMadeForKids", v)} />
      </div>

      <Field label="License">
        <select value={config.youtubeLicense} onChange={(e) => onChange("youtubeLicense", e.target.value as typeof config.youtubeLicense)} className={selectCls}>
          <option value="youtube">Standard YouTube License</option>
          <option value="creativeCommon">Creative Commons</option>
        </select>
      </Field>
    </div>
  );
}

function BloggerSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["blogger"];
  onChange: <K extends keyof PlatformConfigMap["blogger"]>(k: K, v: PlatformConfigMap["blogger"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Post title" hint="Required before publishing.">
        <input value={config.bloggerTitle} onChange={(e) => onChange("bloggerTitle", e.target.value)} placeholder="Enter Blogger title" className={inputCls} />
      </Field>
      <Field label="Labels">
        <input value={config.bloggerLabels} onChange={(e) => onChange("bloggerLabels", e.target.value)} placeholder="marketing, social, launch" className={inputCls} />
      </Field>
      <Field label="Comments">
        <select value={config.bloggerReaderComments} onChange={(e) => onChange("bloggerReaderComments", e.target.value as typeof config.bloggerReaderComments)} className={selectCls}>
          <option value="ALLOW">Allow</option>
          <option value="DONT_ALLOW_SHOW_EXISTING">Disable, keep existing</option>
          <option value="DONT_ALLOW_HIDE_EXISTING">Disable and hide existing</option>
        </select>
      </Field>
      <Field label="Location">
        <input value={config.bloggerLocation} onChange={(e) => onChange("bloggerLocation", e.target.value)} placeholder="Optional location" className={inputCls} />
      </Field>
      <ToggleRow checked={config.bloggerIsDraft} label="Save as draft" onChange={(v) => onChange("bloggerIsDraft", v)} />
    </div>
  );
}

function GoogleBusinessSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["google_business"];
  onChange: <K extends keyof PlatformConfigMap["google_business"]>(k: K, v: PlatformConfigMap["google_business"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Post type">
        <select value={config.googleBusinessPostType} onChange={(e) => onChange("googleBusinessPostType", e.target.value as typeof config.googleBusinessPostType)} className={selectCls}>
          <option value="STANDARD">Standard</option>
          <option value="EVENT">Event</option>
          <option value="OFFER">Offer</option>
        </select>
      </Field>

      <Field label="Call to action">
        <select value={config.googleBusinessCta} onChange={(e) => onChange("googleBusinessCta", e.target.value as typeof config.googleBusinessCta)} className={selectCls}>
          <option value="NONE">None</option>
          <option value="BOOK">Book</option>
          <option value="ORDER">Order</option>
          <option value="SHOP">Shop</option>
          <option value="LEARN_MORE">Learn more</option>
          <option value="SIGN_UP">Sign up</option>
          <option value="CALL">Call</option>
        </select>
      </Field>

      {config.googleBusinessCta !== "NONE" ? (
        <Field label="CTA URL" hint="Required when a CTA is selected.">
          <input value={config.googleBusinessCtaUrl} onChange={(e) => onChange("googleBusinessCtaUrl", e.target.value)} placeholder="https://example.com" className={inputCls} />
        </Field>
      ) : null}

      {config.googleBusinessPostType === "EVENT" ? (
        <>
          <Field label="Event title">
            <input value={config.googleBusinessEventTitle} onChange={(e) => onChange("googleBusinessEventTitle", e.target.value)} placeholder="Open house" className={inputCls} />
          </Field>
          <Field label="Event start">
            <input type="datetime-local" value={config.googleBusinessEventStartDate} onChange={(e) => onChange("googleBusinessEventStartDate", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Event end">
            <input type="datetime-local" value={config.googleBusinessEventEndDate} onChange={(e) => onChange("googleBusinessEventEndDate", e.target.value)} className={inputCls} />
          </Field>
        </>
      ) : null}

      {config.googleBusinessPostType === "OFFER" ? (
        <>
          <Field label="Offer code">
            <input value={config.googleBusinessOfferCode} onChange={(e) => onChange("googleBusinessOfferCode", e.target.value)} placeholder="SAVE10" className={inputCls} />
          </Field>
          <Field label="Offer redeem URL">
            <input value={config.googleBusinessOfferRedeemUrl} onChange={(e) => onChange("googleBusinessOfferRedeemUrl", e.target.value)} placeholder="https://example.com/redeem" className={inputCls} />
          </Field>
          <Field label="Offer terms" hint="Required for offer posts.">
            <textarea value={config.googleBusinessOfferTerms} onChange={(e) => onChange("googleBusinessOfferTerms", e.target.value)} placeholder="Valid until..." className={`${inputCls} min-h-[72px] resize-none`} />
          </Field>
        </>
      ) : null}
    </div>
  );
}

function WordPressSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["wordpress"];
  onChange: <K extends keyof PlatformConfigMap["wordpress"]>(k: K, v: PlatformConfigMap["wordpress"][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Post title" hint="Required before publishing.">
        <input value={config.wordpressTitle} onChange={(e) => onChange("wordpressTitle", e.target.value)} placeholder="Enter WordPress title" className={inputCls} />
      </Field>
      <Field label="Status">
        <select value={config.wordpressStatus} onChange={(e) => onChange("wordpressStatus", e.target.value as typeof config.wordpressStatus)} className={selectCls}>
          <option value="publish">Publish</option>
          <option value="draft">Draft</option>
          <option value="private">Private</option>
          <option value="pending">Pending review</option>
          <option value="future">Scheduled</option>
        </select>
      </Field>
      <Field label="Categories">
        <input value={config.wordpressCategories} onChange={(e) => onChange("wordpressCategories", e.target.value)} placeholder="News, Marketing" className={inputCls} />
      </Field>
      <Field label="Tags">
        <input value={config.wordpressTags} onChange={(e) => onChange("wordpressTags", e.target.value)} placeholder="crm, social, update" className={inputCls} />
      </Field>
      <Field label="Slug">
        <input value={config.wordpressSlug} onChange={(e) => onChange("wordpressSlug", e.target.value)} placeholder="post-slug" className={inputCls} />
      </Field>
      <Field label="Excerpt">
        <textarea value={config.wordpressExcerpt} onChange={(e) => onChange("wordpressExcerpt", e.target.value)} placeholder="Optional summary..." className={`${inputCls} min-h-[72px] resize-none`} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow checked={config.wordpressFeaturedMediaEnabled} label="Use featured media" onChange={(v) => onChange("wordpressFeaturedMediaEnabled", v)} />
        <ToggleRow checked={config.wordpressSticky} label="Sticky post" onChange={(v) => onChange("wordpressSticky", v)} />
      </div>
    </div>
  );
}

function GenericSettings({
  platform,
  config,
  onChange,
}: {
  platform: PlatformName;
  config: PlatformConfigMap[PlatformName];
  onChange: <K extends keyof PlatformConfigMap[PlatformName]>(k: K, v: PlatformConfigMap[PlatformName][K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Schedule" hint="Leave blank to publish immediately.">
        <input
          type="datetime-local"
          value={config.schedule}
          onChange={(e) => onChange("schedule", e.target.value)}
          className={inputCls}
        />
      </Field>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PlatformSettings({
  selectedPlatforms,
  selectedAccounts,
  platformConfigs,
  accountsByPlatform,
  expandedPlatforms,
  activePlatformTab,
  onTabChange,
  onToggleExpand,
  onConfigChange,
}: Props) {

  // Empty state
  if (!selectedPlatforms.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4df]">
          <svg viewBox="0 0 20 20" className="h-6 w-6 fill-current text-[#b8871a]">
            <path d="M10 3a7 7 0 1 0 0 14A7 7 0 0 0 10 3ZM1 10a9 9 0 1 1 18 0A9 9 0 0 1 1 10Zm9-4a1 1 0 0 1 1 1v3.586l1.707 1.707a1 1 0 0 1-1.414 1.414l-2-2A1 1 0 0 1 9 11V7a1 1 0 0 1 1-1Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[#4b3f2f]">No platform selected</p>
        <p className="mt-1 text-xs text-[#9d917d]">Select a platform from the left to see settings here.</p>
      </div>
    );
  }

  const activeTab = activePlatformTab ?? selectedPlatforms[0];
  const config = platformConfigs[activeTab];

  function makeOnChange<P extends PlatformName>(platform: P) {
    return <K extends keyof PlatformConfigMap[P]>(key: K, value: PlatformConfigMap[P][K]) => {
      onConfigChange(platform as PlatformName, key as keyof PlatformConfigMap[PlatformName], value as PlatformConfigMap[PlatformName][keyof PlatformConfigMap[PlatformName]]);
    };
  }

  return (
    <div className="flex flex-col h-full">
      {/* Platform tabs */}
      <div className="border-b border-[#eadfcb] bg-white px-4 pt-4">
        <div className="flex gap-1 overflow-x-auto pb-0">
          {selectedPlatforms.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => onTabChange(platform)}
              className={`flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 pb-2.5 pt-1.5 text-xs font-medium transition-colors ${
                activeTab === platform
                  ? "border-[#b8871a] text-[#7a5c1f]"
                  : "border-transparent text-[#8d8274] hover:text-[#4b3f2f]"
              }`}
            >
              <div className="flex h-4 w-4 items-center justify-center">
                <PlatformLogo platform={platform} className="h-3.5 w-3.5" />
              </div>
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      {/* Settings panel */}
      <div className="flex-1 overflow-y-auto px-5 py-5 bg-[linear-gradient(180deg,#ffffff_0%,#fffdf8_100%)]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#1f170c]">
            {PLATFORM_LABELS[activeTab]} post settings
          </h3>
          <p className="mt-0.5 text-xs text-[#9d917d]">
            Customize how your post will appear on {PLATFORM_LABELS[activeTab]}.
          </p>
        </div>

        {/* Schedule — always shown */}
        <div className="mb-5">
          <Field label="Schedule" hint="Leave blank to publish immediately.">
            <input
              type="datetime-local"
              value={config.schedule}
              onChange={(e) => onConfigChange(activeTab, "schedule", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Platform-specific */}
        {activeTab === "facebook" && (
          <FacebookSettings
            config={platformConfigs.facebook}
            onChange={makeOnChange("facebook")}
          />
        )}
        {activeTab === "instagram" && (
          <InstagramSettings
            config={platformConfigs.instagram}
            onChange={makeOnChange("instagram")}
          />
        )}
        {activeTab === "linkedin" && (
          <LinkedInSettings
            config={platformConfigs.linkedin}
            onChange={makeOnChange("linkedin")}
          />
        )}
        {activeTab === "twitter" && (
          <TwitterSettings
            config={platformConfigs.twitter}
            onChange={makeOnChange("twitter")}
          />
        )}
        {activeTab === "youtube" && (
          <YouTubeSettings
            config={platformConfigs.youtube}
            onChange={makeOnChange("youtube")}
          />
        )}
        {activeTab === "blogger" && (
          <BloggerSettings
            config={platformConfigs.blogger}
            onChange={makeOnChange("blogger")}
          />
        )}
        {activeTab === "google_business" && (
          <GoogleBusinessSettings
            config={platformConfigs.google_business}
            onChange={makeOnChange("google_business")}
          />
        )}
        {activeTab === "wordpress" && (
          <WordPressSettings
            config={platformConfigs.wordpress}
            onChange={makeOnChange("wordpress")}
          />
        )}
        {!["facebook", "instagram", "linkedin", "twitter", "youtube", "blogger", "google_business", "wordpress"].includes(activeTab) && (
          <GenericSettings
            platform={activeTab}
            config={config}
            onChange={(k, v) => onConfigChange(activeTab, k, v)}
          />
        )}
      </div>

      {/* Schedule for later */}
      <div className="border-t border-[#eadfcb] p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#decdaa] bg-white px-4 py-2.5 text-sm font-medium text-[#4b3f2f] transition hover:bg-[#fcf7ee]"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current text-[#9d917d]">
            <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.508 6.508 0 0 0 8 1.5ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8.25-4a.75.75 0 0 0-1.5 0v3.75L4.22 9.28a.75.75 0 1 0 1.06 1.06l2.5-2.5A.75.75 0 0 0 8 7.5V4Z" clip-rule="evenodd" />
          </svg>
          Schedule for later
        </button>
      </div>
    </div>
  );
}
