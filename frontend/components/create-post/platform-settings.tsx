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
  onToggleExpand: (platform: PlatformName) => void;
  onConfigChange: <K extends keyof PlatformConfigMap[PlatformName]>(
    platform: PlatformName,
    key: K,
    value: PlatformConfigMap[PlatformName][K],
  ) => void;
};

function selectedAccountLabels(accounts: Account[], selectedIds: number[]) {
  return accounts
    .filter((account) => selectedIds.includes(account.id))
    .map((account) => account.account_name);
}

function Field({
  label,
  children,
  hint,
  col2,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  col2?: boolean;
}) {
  return (
    <div className={col2 ? "md:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-semibold text-[#1f2937]">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-xs leading-5 text-[#344054]">{hint}</p> : null}
    </div>
  );
}

function ToggleCard({
  checked,
  title,
  description,
  onChange,
}: {
  checked: boolean;
  title: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-[#eadba6] bg-[#fffef9] p-4 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[#d8c36e] bg-white text-[#ffd24b] focus:ring-[#ffd24b]"
      />
      <div>
        <div className="text-sm font-semibold text-[#111111]">{title}</div>
        <div className="mt-1 text-xs leading-5 text-[#344054]">{description}</div>
      </div>
    </label>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="md:col-span-2 flex items-center gap-3 pt-1">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c89a00]">{label}</span>
      <div className="flex-1 border-t border-[#f0e2b2]" />
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[#eadba6] bg-[#fffef9] px-4 py-3 text-sm text-[#111111] outline-none transition-all duration-200 placeholder:text-[#6b7280] focus:border-[#F5C800] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,200,0,0.16)]";

const selectClassName = inputClassName;

// ─── Platform Sections ───────────────────────────────────────────────────────

function FacebookSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["facebook"];
  onChange: <K extends keyof PlatformConfigMap["facebook"]>(key: K, value: PlatformConfigMap["facebook"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Privacy / Visibility">
        <select
          value={config.facebookVisibility}
          onChange={(e) => onChange("facebookVisibility", e.target.value as typeof config.facebookVisibility)}
          className={selectClassName}
        >
          <option value="EVERYONE">Public — Everyone</option>
          <option value="FRIENDS">Friends</option>
          <option value="ONLY_ME">Only Me</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </Field>

      <Field label="CTA Button">
        <select
          value={config.facebookCta}
          onChange={(e) => onChange("facebookCta", e.target.value as typeof config.facebookCta)}
          className={selectClassName}
        >
          <option value="NO_BUTTON">No Button</option>
          <option value="LEARN_MORE">Learn More</option>
          <option value="SHOP_NOW">Shop Now</option>
          <option value="SIGN_UP">Sign Up</option>
          <option value="BOOK_NOW">Book Now</option>
          <option value="CONTACT_US">Contact Us</option>
          <option value="DONATE_NOW">Donate Now</option>
          <option value="DOWNLOAD">Download</option>
          <option value="GET_OFFER">Get Offer</option>
          <option value="GET_QUOTE">Get Quote</option>
          <option value="SUBSCRIBE">Subscribe</option>
          <option value="WATCH_MORE">Watch More</option>
        </select>
      </Field>

      <SectionDivider label="Targeting" />

      <div className="md:col-span-2">
        <ToggleCard
          checked={config.facebookTargetingEnabled}
          onChange={(checked) => onChange("facebookTargetingEnabled", checked)}
          title="Enable audience targeting"
          description="Restrict the audience by age or location. Useful for region-specific campaigns."
        />
      </div>

      {config.facebookTargetingEnabled && (
        <>
          <Field label="Target age range" hint="E.g. 18-35. Leave blank to target all ages.">
            <input
              value={config.facebookTargetAge}
              onChange={(e) => onChange("facebookTargetAge", e.target.value)}
              placeholder="18-65"
              className={inputClassName}
            />
          </Field>
          <Field label="Target countries" hint="Comma-separated ISO 3166-1 alpha-2 codes. E.g. US, GB, IN">
            <input
              value={config.facebookTargetCountries}
              onChange={(e) => onChange("facebookTargetCountries", e.target.value)}
              placeholder="US, GB, CA"
              className={inputClassName}
            />
          </Field>
        </>
      )}
    </div>
  );
}

function InstagramSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["instagram"];
  onChange: <K extends keyof PlatformConfigMap["instagram"]>(key: K, value: PlatformConfigMap["instagram"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Post type">
        <select
          value={config.instagramPostType}
          onChange={(e) => onChange("instagramPostType", e.target.value as typeof config.instagramPostType)}
          className={selectClassName}
        >
          <option value="post">Photo / Image Post</option>
          <option value="reel">Reel (video)</option>
          <option value="story">Story</option>
          <option value="carousel">Carousel</option>
        </select>
      </Field>

      <Field label="Caption formatting" hint="Adjust tone without changing the global draft.">
        <select
          value={config.instagramCaptionStyle}
          onChange={(e) => onChange("instagramCaptionStyle", e.target.value as typeof config.instagramCaptionStyle)}
          className={selectClassName}
        >
          <option value="balanced">Balanced</option>
          <option value="clean">Minimal</option>
          <option value="creator">Creator style</option>
        </select>
      </Field>

      <Field label="Hashtags" hint="Space or comma-separated. Added to caption or first comment below.">
        <input
          value={config.instagramHashtags}
          onChange={(e) => onChange("instagramHashtags", e.target.value)}
          placeholder="#product #launch"
          className={inputClassName}
        />
      </Field>

      <Field label="Location ID" hint="Optional Facebook Place ID to tag a location.">
        <input
          value={config.instagramLocationId}
          onChange={(e) => onChange("instagramLocationId", e.target.value)}
          placeholder="Facebook Place ID"
          className={inputClassName}
        />
      </Field>

      <Field label="User tags" hint="Comma-separated Instagram usernames to tag in the image.">
        <input
          value={config.instagramUserTags}
          onChange={(e) => onChange("instagramUserTags", e.target.value)}
          placeholder="username1, username2"
          className={inputClassName}
        />
      </Field>

      <SectionDivider label="Cross-posting & Comments" />

      <div className="md:col-span-2 space-y-3">
        <ToggleCard
          checked={config.instagramShareToFacebook}
          onChange={(checked) => onChange("instagramShareToFacebook", checked)}
          title="Share to connected Facebook Page"
          description="Cross-post this content simultaneously to a linked Facebook Page via the Instagram API."
        />
        <ToggleCard
          checked={config.instagramFirstCommentEnabled}
          onChange={(checked) => onChange("instagramFirstCommentEnabled", checked)}
          title="Use first comment for hashtags"
          description="Keep the caption clean and move supporting hashtags into the first comment automatically."
        />
      </div>

      {config.instagramFirstCommentEnabled && (
        <Field label="First comment content" col2>
          <textarea
            value={config.instagramFirstComment}
            onChange={(e) => onChange("instagramFirstComment", e.target.value)}
            placeholder="#hashtag1 #hashtag2 …"
            className={`${inputClassName} min-h-[100px] resize-none`}
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
  onChange: <K extends keyof PlatformConfigMap["linkedin"]>(key: K, value: PlatformConfigMap["linkedin"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Author type">
        <select
          value={config.linkedinEntityType}
          onChange={(e) => onChange("linkedinEntityType", e.target.value as typeof config.linkedinEntityType)}
          className={selectClassName}
        >
          <option value="profile">Personal Profile</option>
          <option value="page">Company / Organisation Page</option>
        </select>
      </Field>

      <Field label="Visibility (audience)">
        <select
          value={config.linkedinAudience}
          onChange={(e) => onChange("linkedinAudience", e.target.value as typeof config.linkedinAudience)}
          className={selectClassName}
        >
          <option value="PUBLIC">Public — Anyone</option>
          <option value="LOGGED_IN">LinkedIn members only</option>
          <option value="CONNECTIONS">Connections only</option>
        </select>
      </Field>

      <Field label="Lifecycle state">
        <select
          value={config.linkedinLifecycleState}
          onChange={(e) => onChange("linkedinLifecycleState", e.target.value as typeof config.linkedinLifecycleState)}
          className={selectClassName}
        >
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft (save without publishing)</option>
        </select>
      </Field>

      <Field label="Hashtags" hint="Comma-separated. LinkedIn recommends 3–5 relevant tags.">
        <input
          value={config.linkedinHashtags}
          onChange={(e) => onChange("linkedinHashtags", e.target.value)}
          placeholder="#b2b, #founders, #growth"
          className={inputClassName}
        />
      </Field>

      <Field label="Content topics" hint="Optional. Comma-separated interest topics for algorithmic distribution (e.g. Technology, Marketing).">
        <input
          value={config.linkedinContentTopics}
          onChange={(e) => onChange("linkedinContentTopics", e.target.value)}
          placeholder="Technology, Marketing"
          className={inputClassName}
        />
      </Field>

      <div className="md:col-span-2">
        <ToggleCard
          checked={config.linkedinMultiImageEnabled}
          onChange={(checked) => onChange("linkedinMultiImageEnabled", checked)}
          title="Multi-image post"
          description="Publish as a multi-image (carousel) post instead of a single image. All selected media will be included."
        />
      </div>
    </div>
  );
}

function TwitterSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["twitter"];
  onChange: <K extends keyof PlatformConfigMap["twitter"]>(key: K, value: PlatformConfigMap["twitter"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Who can reply">
        <select
          value={config.twitterReplySettings}
          onChange={(e) => onChange("twitterReplySettings", e.target.value as typeof config.twitterReplySettings)}
          className={selectClassName}
        >
          <option value="everyone">Everyone</option>
          <option value="mentionedUsers">Mentioned users only</option>
          <option value="following">Accounts you follow</option>
          <option value="subscribers">Subscribers only</option>
        </select>
      </Field>

      <div className="space-y-3">
        <ToggleCard
          checked={config.twitterThreadMode}
          onChange={(checked) => onChange("twitterThreadMode", checked)}
          title="Thread mode"
          description="Split longer copy into a numbered thread automatically."
        />
        <ToggleCard
          checked={config.twitterCardEnabled}
          onChange={(checked) => onChange("twitterCardEnabled", checked)}
          title="Attach Twitter Card"
          description="Embed a link preview card when a URL is present in the post."
        />
      </div>

      <SectionDivider label="Content flags" />

      <div className="md:col-span-2 space-y-3">
        <ToggleCard
          checked={config.twitterSensitive}
          onChange={(checked) => onChange("twitterSensitive", checked)}
          title="Mark media as sensitive"
          description="Adds a content warning over media — equivalent to the 'possibly_sensitive' API flag."
        />
        <ToggleCard
          checked={config.twitterForSuperFollowers}
          onChange={(checked) => onChange("twitterForSuperFollowers", checked)}
          title="Super Followers only"
          description="Restrict this post to Super Followers (paid subscribers) exclusively."
        />
      </div>
    </div>
  );
}

// YouTube category options (API category IDs)
const YOUTUBE_CATEGORIES = [
  { id: "1", label: "Film & Animation" },
  { id: "2", label: "Autos & Vehicles" },
  { id: "10", label: "Music" },
  { id: "15", label: "Pets & Animals" },
  { id: "17", label: "Sports" },
  { id: "19", label: "Travel & Events" },
  { id: "20", label: "Gaming" },
  { id: "22", label: "People & Blogs" },
  { id: "23", label: "Comedy" },
  { id: "24", label: "Entertainment" },
  { id: "25", label: "News & Politics" },
  { id: "26", label: "Howto & Style" },
  { id: "27", label: "Education" },
  { id: "28", label: "Science & Technology" },
  { id: "29", label: "Nonprofits & Activism" },
];

function YouTubeSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["youtube"];
  onChange: <K extends keyof PlatformConfigMap["youtube"]>(key: K, value: PlatformConfigMap["youtube"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Video title" hint="Required by YouTube API. Defaults to post content if left blank." col2>
        <input
          value={config.youtubeTitle}
          onChange={(e) => onChange("youtubeTitle", e.target.value)}
          placeholder="Enter a video title…"
          className={inputClassName}
        />
      </Field>

      <Field label="Privacy">
        <select
          value={config.youtubePrivacy}
          onChange={(e) => onChange("youtubePrivacy", e.target.value as typeof config.youtubePrivacy)}
          className={selectClassName}
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
      </Field>

      <Field label="Category">
        <select
          value={config.youtubeCategoryId}
          onChange={(e) => onChange("youtubeCategoryId", e.target.value)}
          className={selectClassName}
        >
          {YOUTUBE_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Tags" hint="Comma-separated keywords. Helps with YouTube search discoverability.">
        <input
          value={config.youtubeTags}
          onChange={(e) => onChange("youtubeTags", e.target.value)}
          placeholder="tutorial, howto, review"
          className={inputClassName}
        />
      </Field>

      <Field label="Default language" hint="BCP-47 language code for the video content (e.g. en, fr, de).">
        <input
          value={config.youtubeLanguage}
          onChange={(e) => onChange("youtubeLanguage", e.target.value)}
          placeholder="en"
          className={inputClassName}
        />
      </Field>

      <Field label="Default audio language" hint="BCP-47 code for the spoken audio language.">
        <input
          value={config.youtubeDefaultAudioLanguage}
          onChange={(e) => onChange("youtubeDefaultAudioLanguage", e.target.value)}
          placeholder="en"
          className={inputClassName}
        />
      </Field>

      <Field label="License">
        <select
          value={config.youtubeLicense}
          onChange={(e) => onChange("youtubeLicense", e.target.value as typeof config.youtubeLicense)}
          className={selectClassName}
        >
          <option value="youtube">Standard YouTube License</option>
          <option value="creativeCommon">Creative Commons — Attribution</option>
        </select>
      </Field>

      <Field label="Scheduled publish time" hint="Leave blank to publish immediately. Only applies when privacy is set to Public.">
        <input
          type="datetime-local"
          value={config.youtubePublishAt}
          onChange={(e) => onChange("youtubePublishAt", e.target.value)}
          className={inputClassName}
        />
      </Field>

      <SectionDivider label="Flags" />

      <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
        <ToggleCard
          checked={config.youtubeNotifySubscribers}
          onChange={(checked) => onChange("youtubeNotifySubscribers", checked)}
          title="Notify subscribers"
          description="Send a notification to subscribers when this video is published."
        />
        <ToggleCard
          checked={config.youtubeEmbeddable}
          onChange={(checked) => onChange("youtubeEmbeddable", checked)}
          title="Allow embedding"
          description="Let other websites embed this video using the YouTube player."
        />
        <ToggleCard
          checked={config.youtubeMadeForKids}
          onChange={(checked) => onChange("youtubeMadeForKids", checked)}
          title="Made for Kids (COPPA)"
          description="Mark content as directed at children per FTC COPPA regulations. Disables comments and personalised ads."
        />
      </div>
    </div>
  );
}

function BloggerSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["blogger"];
  onChange: <K extends keyof PlatformConfigMap["blogger"]>(key: K, value: PlatformConfigMap["blogger"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Post title" hint="Defaults to the first line of the post if left blank." col2>
        <input
          value={config.bloggerTitle}
          onChange={(e) => onChange("bloggerTitle", e.target.value)}
          placeholder="Enter a post title…"
          className={inputClassName}
        />
      </Field>

      <Field label="Labels / Tags" hint="Comma-separated. Equivalent to categories in Blogger.">
        <input
          value={config.bloggerLabels}
          onChange={(e) => onChange("bloggerLabels", e.target.value)}
          placeholder="travel, tips, review"
          className={inputClassName}
        />
      </Field>

      <Field label="Reader comments">
        <select
          value={config.bloggerReaderComments}
          onChange={(e) => onChange("bloggerReaderComments", e.target.value as typeof config.bloggerReaderComments)}
          className={selectClassName}
        >
          <option value="ALLOW">Allow</option>
          <option value="DONT_ALLOW_SHOW_EXISTING">Disable new (show existing)</option>
          <option value="DONT_ALLOW_HIDE_EXISTING">Disable all comments</option>
        </select>
      </Field>

      <Field label="Location" hint="Optional geo-tag for the post (place name or coordinates).">
        <input
          value={config.bloggerLocation}
          onChange={(e) => onChange("bloggerLocation", e.target.value)}
          placeholder="New York, NY"
          className={inputClassName}
        />
      </Field>

      <Field label="Custom robots meta" hint="Comma-separated directives. E.g. noindex, noarchive. Leave blank for default.">
        <input
          value={config.bloggerCustomMetaRobotsTags}
          onChange={(e) => onChange("bloggerCustomMetaRobotsTags", e.target.value)}
          placeholder="noindex, noarchive"
          className={inputClassName}
        />
      </Field>

      <div className="md:col-span-2">
        <ToggleCard
          checked={config.bloggerIsDraft}
          onChange={(checked) => onChange("bloggerIsDraft", checked)}
          title="Save as draft"
          description="The post will be created but not published. You can review and publish it later from Blogger."
        />
      </div>
    </div>
  );
}

function GoogleBusinessSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["google_business"];
  onChange: <K extends keyof PlatformConfigMap["google_business"]>(key: K, value: PlatformConfigMap["google_business"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Post type">
        <select
          value={config.googleBusinessPostType}
          onChange={(e) => onChange("googleBusinessPostType", e.target.value as typeof config.googleBusinessPostType)}
          className={selectClassName}
        >
          <option value="STANDARD">Standard update</option>
          <option value="EVENT">Event</option>
          <option value="OFFER">Offer / Promotion</option>
        </select>
      </Field>

      <Field label="CTA button">
        <select
          value={config.googleBusinessCta}
          onChange={(e) => onChange("googleBusinessCta", e.target.value as typeof config.googleBusinessCta)}
          className={selectClassName}
        >
          <option value="NONE">No button</option>
          <option value="LEARN_MORE">Learn More</option>
          <option value="BOOK">Book</option>
          <option value="ORDER">Order Online</option>
          <option value="SHOP">Shop</option>
          <option value="SIGN_UP">Sign Up</option>
          <option value="CALL">Call Now</option>
        </select>
      </Field>

      {config.googleBusinessCta !== "NONE" && (
        <Field label="CTA URL" col2 hint="The destination URL for the button above.">
          <input
            value={config.googleBusinessCtaUrl}
            onChange={(e) => onChange("googleBusinessCtaUrl", e.target.value)}
            placeholder="https://example.com/offer"
            className={inputClassName}
          />
        </Field>
      )}

      {config.googleBusinessPostType === "EVENT" && (
        <>
          <SectionDivider label="Event details" />
          <Field label="Event title">
            <input
              value={config.googleBusinessEventTitle}
              onChange={(e) => onChange("googleBusinessEventTitle", e.target.value)}
              placeholder="Grand opening…"
              className={inputClassName}
            />
          </Field>
          <div />
          <Field label="Start date & time">
            <input
              type="datetime-local"
              value={config.googleBusinessEventStartDate}
              onChange={(e) => onChange("googleBusinessEventStartDate", e.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="End date & time">
            <input
              type="datetime-local"
              value={config.googleBusinessEventEndDate}
              onChange={(e) => onChange("googleBusinessEventEndDate", e.target.value)}
              className={inputClassName}
            />
          </Field>
        </>
      )}

      {config.googleBusinessPostType === "OFFER" && (
        <>
          <SectionDivider label="Offer details" />
          <Field label="Promo / coupon code" hint="Shown to customers when they tap the offer.">
            <input
              value={config.googleBusinessOfferCode}
              onChange={(e) => onChange("googleBusinessOfferCode", e.target.value)}
              placeholder="SAVE20"
              className={inputClassName}
            />
          </Field>
          <Field label="Redeem offer URL">
            <input
              value={config.googleBusinessOfferRedeemUrl}
              onChange={(e) => onChange("googleBusinessOfferRedeemUrl", e.target.value)}
              placeholder="https://example.com/promo"
              className={inputClassName}
            />
          </Field>
          <Field label="Terms & conditions" col2>
            <textarea
              value={config.googleBusinessOfferTerms}
              onChange={(e) => onChange("googleBusinessOfferTerms", e.target.value)}
              placeholder="Valid through 31 Dec. One use per customer."
              className={`${inputClassName} min-h-[80px] resize-none`}
            />
          </Field>
        </>
      )}
    </div>
  );
}

function WordPressSettings({
  config,
  onChange,
}: {
  config: PlatformConfigMap["wordpress"];
  onChange: <K extends keyof PlatformConfigMap["wordpress"]>(key: K, value: PlatformConfigMap["wordpress"][K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Post title" hint="Shown as the page/SEO title. Defaults to first line of content." col2>
        <input
          value={config.wordpressTitle}
          onChange={(e) => onChange("wordpressTitle", e.target.value)}
          placeholder="Enter post title…"
          className={inputClassName}
        />
      </Field>

      <Field label="Status">
        <select
          value={config.wordpressStatus}
          onChange={(e) => onChange("wordpressStatus", e.target.value as typeof config.wordpressStatus)}
          className={selectClassName}
        >
          <option value="publish">Published</option>
          <option value="future">Scheduled (use schedule above)</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending review</option>
          <option value="private">Private</option>
        </select>
      </Field>

      <Field label="Post format">
        <select
          value={config.wordpressFormat}
          onChange={(e) => onChange("wordpressFormat", e.target.value as typeof config.wordpressFormat)}
          className={selectClassName}
        >
          <option value="standard">Standard</option>
          <option value="aside">Aside</option>
          <option value="gallery">Gallery</option>
          <option value="link">Link</option>
          <option value="quote">Quote</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
      </Field>

      <Field label="Categories" hint="Comma-separated category names or IDs.">
        <input
          value={config.wordpressCategories}
          onChange={(e) => onChange("wordpressCategories", e.target.value)}
          placeholder="News, Announcements"
          className={inputClassName}
        />
      </Field>

      <Field label="Tags" hint="Comma-separated tag names.">
        <input
          value={config.wordpressTags}
          onChange={(e) => onChange("wordpressTags", e.target.value)}
          placeholder="launch, product, update"
          className={inputClassName}
        />
      </Field>

      <Field label="Slug" hint="URL-friendly post identifier. Auto-generated from title if left blank.">
        <input
          value={config.wordpressSlug}
          onChange={(e) => onChange("wordpressSlug", e.target.value)}
          placeholder="my-post-title"
          className={inputClassName}
        />
      </Field>

      <Field label="Excerpt" hint="Optional summary shown in archive / feed views." col2>
        <textarea
          value={config.wordpressExcerpt}
          onChange={(e) => onChange("wordpressExcerpt", e.target.value)}
          placeholder="Short description of the post…"
          className={`${inputClassName} min-h-[80px] resize-none`}
        />
      </Field>

      <Field label="Comment status">
        <select
          value={config.wordpressCommentStatus}
          onChange={(e) => onChange("wordpressCommentStatus", e.target.value as typeof config.wordpressCommentStatus)}
          className={selectClassName}
        >
          <option value="open">Open (allow comments)</option>
          <option value="closed">Closed</option>
        </select>
      </Field>

      <Field label="Ping / trackback status">
        <select
          value={config.wordpressPingStatus}
          onChange={(e) => onChange("wordpressPingStatus", e.target.value as typeof config.wordpressPingStatus)}
          className={selectClassName}
        >
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </Field>

      <Field label="Author ID" hint="WordPress user ID to publish as. Leave blank to use the authenticated account.">
        <input
          value={config.wordpressAuthorId}
          onChange={(e) => onChange("wordpressAuthorId", e.target.value)}
          placeholder="1"
          className={inputClassName}
        />
      </Field>

      <Field label="Password protection" hint="Set a password to restrict access to this post.">
        <input
          type="password"
          value={config.wordpressPassword}
          onChange={(e) => onChange("wordpressPassword", e.target.value)}
          placeholder="Leave blank for public access"
          className={inputClassName}
          autoComplete="new-password"
        />
      </Field>

      <SectionDivider label="Flags" />

      <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
        <ToggleCard
          checked={config.wordpressFeaturedMediaEnabled}
          onChange={(checked) => onChange("wordpressFeaturedMediaEnabled", checked)}
          title="Set featured image"
          description="Use the first selected media item as the post's featured image."
        />
        <ToggleCard
          checked={config.wordpressSticky}
          onChange={(checked) => onChange("wordpressSticky", checked)}
          title="Sticky post"
          description="Pin this post to the top of the blog index / homepage."
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlatformSettings({
  selectedPlatforms,
  selectedAccounts,
  platformConfigs,
  accountsByPlatform,
  expandedPlatforms,
  onToggleExpand,
  onConfigChange,
}: Props) {
  return (
    <section className="mx-6 mb-6 rounded-[24px] border border-[#f0e2b2] bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(180,144,34,0.08)] sm:p-6">
      <div className="border-b border-[#f0e2b2] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c89a00]">
          Step 2
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
          Platform-specific settings
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#344054]">
          These cards stay empty until a platform is selected, so the interface only expands when it actually needs to.
        </p>
      </div>

      {!selectedPlatforms.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#f0e2b2] bg-[#fffef9] px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#fff7cf] text-[#c89a00]">
            <span className="text-lg">+</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#111111]">No platform settings yet</h3>
          <p className="mt-2 text-sm leading-6 text-[#344054]">
            Select one or more platforms from the sidebar and only those configuration panels will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {selectedPlatforms.map((platform) => {
            const config = platformConfigs[platform];
            const expanded = expandedPlatforms[platform] ?? true;
            const accountNames = selectedAccountLabels(
              accountsByPlatform[platform],
              selectedAccounts[platform],
            );

            function handleChange<K extends keyof typeof config>(key: K, value: (typeof config)[K]) {
              onConfigChange(platform, key, value);
            }

            return (
              <article
                key={platform}
                className="overflow-hidden rounded-2xl border border-[#f0e2b2] bg-[#fffef9] shadow-[0_10px_28px_rgba(180,144,34,0.08)]"
              >
                <button
                  type="button"
                  onClick={() => onToggleExpand(platform)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all duration-200 hover:bg-[#fff7d1]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${PLATFORM_META[platform].surfaceClass} ${PLATFORM_META[platform].accentClass}`}
                    >
                      <PlatformLogo platform={platform} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[#111111]">
                        {PLATFORM_LABELS[platform]}
                      </h3>
                      <p className="mt-1 truncate text-sm text-[#344054]">
                        {accountNames.length
                          ? accountNames.join(", ")
                          : "No accounts selected"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#c89a00]">{expanded ? "Hide" : "Show"}</span>
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-[#f0e2b2] px-5 py-5">

                      {/* ── Shared: schedule + active destinations ── */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Schedule"
                          hint="Leave blank to publish immediately after the post is created."
                        >
                          <input
                            type="datetime-local"
                            value={config.schedule}
                            onChange={(e) => onConfigChange(platform, "schedule", e.target.value)}
                            className={inputClassName}
                          />
                        </Field>

                        <div className="rounded-xl border border-[#f0e2b2] bg-[#fff8dc] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c89a00]">
                            Active destinations
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {accountNames.length ? accountNames.map((name) => (
                              <span
                                key={name}
                                className="rounded-full border border-[#e5ca61] bg-[#ffe98e] px-3 py-1.5 text-xs font-semibold text-[#5b4500]"
                              >
                                {name}
                              </span>
                            )) : (
                              <span className="text-xs text-[#9ca3af]">No accounts selected</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Platform-specific sections ── */}
                      {platform === "facebook" && (
                        <FacebookSettings
                          config={config as PlatformConfigMap["facebook"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["facebook"]>(key: K, value: PlatformConfigMap["facebook"][K]) => void}
                        />
                      )}

                      {platform === "instagram" && (
                        <InstagramSettings
                          config={config as PlatformConfigMap["instagram"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["instagram"]>(key: K, value: PlatformConfigMap["instagram"][K]) => void}
                        />
                      )}

                      {platform === "linkedin" && (
                        <LinkedInSettings
                          config={config as PlatformConfigMap["linkedin"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["linkedin"]>(key: K, value: PlatformConfigMap["linkedin"][K]) => void}
                        />
                      )}

                      {platform === "twitter" && (
                        <TwitterSettings
                          config={config as PlatformConfigMap["twitter"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["twitter"]>(key: K, value: PlatformConfigMap["twitter"][K]) => void}
                        />
                      )}

                      {platform === "youtube" && (
                        <YouTubeSettings
                          config={config as PlatformConfigMap["youtube"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["youtube"]>(key: K, value: PlatformConfigMap["youtube"][K]) => void}
                        />
                      )}

                      {platform === "blogger" && (
                        <BloggerSettings
                          config={config as PlatformConfigMap["blogger"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["blogger"]>(key: K, value: PlatformConfigMap["blogger"][K]) => void}
                        />
                      )}

                      {platform === "google_business" && (
                        <GoogleBusinessSettings
                          config={config as PlatformConfigMap["google_business"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["google_business"]>(key: K, value: PlatformConfigMap["google_business"][K]) => void}
                        />
                      )}

                      {platform === "wordpress" && (
                        <WordPressSettings
                          config={config as PlatformConfigMap["wordpress"]}
                          onChange={handleChange as <K extends keyof PlatformConfigMap["wordpress"]>(key: K, value: PlatformConfigMap["wordpress"][K]) => void}
                        />
                      )}

                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
