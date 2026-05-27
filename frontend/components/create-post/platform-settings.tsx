"use client";

import { KeyboardEvent, ReactNode, useState } from "react";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORM_LABELS } from "@/components/create-post/constants";
import {
  PlatformConfig,
  PlatformConfigMap,
} from "@/components/create-post/types";
import { PlatformName } from "@/lib/types";

/* ================= TYPES ================= */

type Props = {
  selectedPlatforms: PlatformName[];
  platformConfigs: PlatformConfigMap;
  activePlatformTab: PlatformName | null;
  highlightedFixTargetId?: string | null;
  onTabChange: (platform: PlatformName) => void;
  onConfigChange: (
    platform: PlatformName,
    key: keyof PlatformConfig,
    value: any
  ) => void;
};

/* ================= UI HELPERS ================= */

const inputCls =
  "w-full rounded-[14px] border border-[#e7dcc9] bg-[#fffdfa] px-3 py-2 text-sm outline-none focus:border-[#d1ac63] focus:ring-2 focus:ring-[#f7ebcb] transition-colors";

const selectCls = inputCls;
const highlightedFieldCls = "border-[#d1ac63] bg-[#fff8dd] ring-2 ring-[#f7cc47]";

type MultiValueInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  prefix?: "#" | "@";
  transform?: (value: string) => string;
  compact?: boolean;
};

function parseDelimitedValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMultiValueItem(
  value: string,
  prefix?: "#" | "@",
  transform?: (value: string) => string,
) {
  let normalized = value.trim();
  if (!normalized) return "";

  if (prefix) {
    normalized = normalized.replace(/^[#@]+/, "").replace(/\s+/g, "");
    normalized = `${prefix}${normalized}`;
  }

  return transform ? transform(normalized) : normalized;
}

function MultiValueInput({
  value,
  onChange,
  placeholder,
  prefix,
  transform,
  compact = false,
}: MultiValueInputProps) {
  const [draft, setDraft] = useState("");
  const items = parseDelimitedValue(value);

  const updateItems = (nextItems: string[]) => {
    onChange(nextItems.join(", "));
  };

  const addItems = (rawItems: string[]) => {
    const nextItems = [...items];

    rawItems.forEach((rawItem) => {
      const normalized = normalizeMultiValueItem(rawItem, prefix, transform);
      const duplicate = nextItems.some(
        (item) => item.toLowerCase() === normalized.toLowerCase(),
      );

      if (normalized && !duplicate) {
        nextItems.push(normalized);
      }
    });

    updateItems(nextItems);
    setDraft("");
  };

  const commitDraft = () => {
    if (!draft.trim()) {
      setDraft("");
      return;
    }

    addItems(draft.split(/[,\n]+/));
  };

  const removeItem = (itemToRemove: string) => {
    updateItems(items.filter((item) => item !== itemToRemove));
  };

  const handleDraftChange = (nextDraft: string) => {
    if (nextDraft.includes(",") || nextDraft.includes("\n")) {
      addItems(nextDraft.split(/[,\n]+/));
      return;
    }

    setDraft(nextDraft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Tab") {
      if (draft.trim()) {
        event.preventDefault();
        commitDraft();
      }
      return;
    }

    if (event.key === "Backspace" && !draft && items.length > 0) {
      event.preventDefault();
      const nextItems = [...items];
      const lastItem = nextItems.pop();
      updateItems(nextItems);
      setDraft(lastItem ? lastItem.replace(/^[#@]/, "") : "");
    }
  };

  return (
    <div
      className={`w-full rounded-[14px] border border-[#e7dcc9] bg-[#fffdfa] px-2.5 ${
        compact ? "py-1.5" : "py-2"
      } transition-colors focus-within:border-[#d1ac63] focus-within:ring-2 focus-within:ring-[#f7ebcb]`}
    >
      <div className="flex min-h-[34px] flex-wrap items-center gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#f7ebcb] px-2.5 py-1 text-xs font-semibold text-[#73551c]"
          >
            <span className="max-w-[70vw] truncate sm:max-w-[180px]">{item}</span>
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="rounded-full px-1 text-[#8a6a18] transition-colors hover:bg-[#ead59b] hover:text-[#4d3711]"
              aria-label={`Remove ${item}`}
            >
              x
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(event) => handleDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={items.length ? "Add another" : placeholder}
          className="min-w-[110px] flex-1 bg-transparent text-sm outline-none placeholder:text-[#a39170]"
        />
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#5c4f3a]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#9d8f7a]">{hint}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[#e7dcc9] bg-[#fffdf8] p-3 hover:border-[#d1ac63] transition-colors">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`h-5 w-9 rounded-full transition-colors ${checked ? "bg-[#c9973a]" : "bg-[#ddd4c2]"}`} />
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <div>
        <div className="text-xs font-semibold text-[#3a2e1e]">{label}</div>
        {description && <div className="text-[11px] text-[#9d8f7a]">{description}</div>}
      </div>
    </label>
  );
}

function Section({ title, sectionId, children }: { title: string; sectionId?: string; children: ReactNode }) {
  return (
    <div id={sectionId} className="space-y-3 scroll-mt-6">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-[#ede5d5]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#b09060]">{title}</span>
        <div className="h-px flex-1 bg-[#ede5d5]" />
      </div>
      {children}
    </div>
  );
}

function formatDateTimeLocal(value?: string) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return "";
  }
}

/* ================= PLATFORM PANELS ================= */

function FacebookSettings({ config, onChange }: { config: PlatformConfig; onChange: (key: keyof PlatformConfig, value: any) => void }) {
  return (
    <>
      <Section title="Visibility">
        <Field label="Post visibility">
          <select value={config.facebookVisibility} onChange={(e) => onChange("facebookVisibility", e.target.value)} className={selectCls}>
            <option value="EVERYONE">Public — everyone</option>
            <option value="FRIENDS">Friends only</option>
            <option value="ONLY_ME">Only me</option>
          </select>
        </Field>
      </Section>
      <Section title="Call to Action">
        <Field label="CTA button" hint="Adds a clickable button below the post.">
          <select value={config.facebookCta} onChange={(e) => onChange("facebookCta", e.target.value)} className={selectCls}>
            <option value="NO_BUTTON">No button</option>
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
      </Section>
      <Section title="Targeting">
        <Toggle checked={config.facebookTargetingEnabled} onChange={(v) => onChange("facebookTargetingEnabled", v)} label="Enable audience targeting" description="Restrict who sees this post by age or location." />
        {config.facebookTargetingEnabled && (
          <>
            <Field label="Target age range" hint='e.g. "18-35"'>
              <input value={config.facebookTargetAge} onChange={(e) => onChange("facebookTargetAge", e.target.value)} placeholder="18-65" className={inputCls} />
            </Field>
            <Field label="Target countries" hint="Add country codes one by one, e.g. US, GB, IN.">
              <MultiValueInput
                value={config.facebookTargetCountries}
                onChange={(value) => onChange("facebookTargetCountries", value)}
                placeholder="US"
                transform={(value) => value.toUpperCase()}
              />
            </Field>
          </>
        )}
      </Section>
    </>
  );
}

function InstagramSettings({
  config,
  highlightedFixTargetId,
  onChange,
}: {
  config: PlatformConfig;
  highlightedFixTargetId?: string | null;
  onChange: (key: keyof PlatformConfig, value: any) => void;
}) {
  return (
    <>
      <Section title="Format" sectionId="instagram-format">
        <Field label="Post type">
          <select
            id="instagram-post-type-field"
            value={config.instagramPostType}
            onChange={(e) => onChange("instagramPostType", e.target.value)}
            className={`${selectCls} ${highlightedFixTargetId === "instagram-post-type-field" ? highlightedFieldCls : ""}`}
          >
            <option value="post">Feed post</option>
            <option value="reel">Reel</option>
            <option value="story">Story</option>
            <option value="carousel">Carousel</option>
          </select>
        </Field>
        <Field label="Caption style">
          <select value={config.instagramCaptionStyle} onChange={(e) => onChange("instagramCaptionStyle", e.target.value)} className={selectCls}>
            <option value="balanced">Balanced</option>
            <option value="clean">Clean (no hashtags in caption)</option>
            <option value="creator">Creator (hashtags in caption)</option>
          </select>
        </Field>
      </Section>
      <Section title="Hashtags & Tags">
        <Field label="Extra hashtags" hint="Added to the post caption or first comment.">
          <MultiValueInput
            value={config.instagramHashtags}
            onChange={(value) => onChange("instagramHashtags", value)}
            placeholder="#photography"
            prefix="#"
          />
        </Field>
        <Field label="User tags" hint="Add @handles one by one to tag in the post.">
          <MultiValueInput
            value={config.instagramUserTags}
            onChange={(value) => onChange("instagramUserTags", value)}
            placeholder="@username"
            prefix="@"
          />
        </Field>
        <Field label="Location ID" hint="Instagram place ID for geotagging.">
          <input value={config.instagramLocationId} onChange={(e) => onChange("instagramLocationId", e.target.value)} placeholder="213385402" className={inputCls} />
        </Field>
      </Section>
      <Section title="First Comment">
        <Toggle checked={config.instagramFirstCommentEnabled} onChange={(v) => onChange("instagramFirstCommentEnabled", v)} label="Post hashtags as first comment" description="Keeps the caption clean while boosting reach." />
        {config.instagramFirstCommentEnabled && (
          <Field label="First comment text">
            <input value={config.instagramFirstComment} onChange={(e) => onChange("instagramFirstComment", e.target.value)} placeholder="#explore #trending" className={inputCls} />
          </Field>
        )}
      </Section>
      <Section title="Cross-posting">
        <Toggle checked={config.instagramShareToFacebook} onChange={(v) => onChange("instagramShareToFacebook", v)} label="Share to connected Facebook page" description="Cross-posts this to your linked Facebook page." />
      </Section>
    </>
  );
}

function LinkedInSettings({ config, onChange }: { config: PlatformConfig; onChange: (key: keyof PlatformConfig, value: any) => void }) {
  return (
    <>
      <Section title="Audience">
        <Field label="Visibility">
          <select value={config.linkedinAudience} onChange={(e) => onChange("linkedinAudience", e.target.value)} className={selectCls}>
            <option value="PUBLIC">Public — anyone on LinkedIn</option>
            <option value="CONNECTIONS">Connections only</option>
            <option value="LOGGED_IN">Logged-in members only</option>
          </select>
        </Field>
        <Field label="Publish as">
          <select value={config.linkedinEntityType} onChange={(e) => onChange("linkedinEntityType", e.target.value)} className={selectCls}>
            <option value="profile">Personal profile</option>
            <option value="page">Company page</option>
          </select>
        </Field>
      </Section>
      <Section title="Content">
        <Field label="Lifecycle state">
          <select value={config.linkedinLifecycleState} onChange={(e) => onChange("linkedinLifecycleState", e.target.value)} className={selectCls}>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </Field>
        <Field label="Extra hashtags" hint="Added to the LinkedIn post body.">
          <MultiValueInput
            value={config.linkedinHashtags}
            onChange={(value) => onChange("linkedinHashtags", value)}
            placeholder="#leadership"
            prefix="#"
          />
        </Field>
        <Field label="Content topics" hint="Add LinkedIn topic URNs one by one.">
          <MultiValueInput
            value={config.linkedinContentTopics}
            onChange={(value) => onChange("linkedinContentTopics", value)}
            placeholder="urn:li:topic:123"
          />
        </Field>
        <Toggle checked={config.linkedinMultiImageEnabled} onChange={(v) => onChange("linkedinMultiImageEnabled", v)} label="Multi-image post" description="Publish multiple images as a LinkedIn slideshow." />
      </Section>
    </>
  );
}

function TwitterSettings({ config, onChange }: { config: PlatformConfig; onChange: (key: keyof PlatformConfig, value: any) => void }) {
  return (
    <>
      <Section title="Replies & Reach">
        <Field label="Who can reply">
          <select value={config.twitterReplySettings} onChange={(e) => onChange("twitterReplySettings", e.target.value)} className={selectCls}>
            <option value="everyone">Everyone</option>
            <option value="mentionedUsers">Mentioned users only</option>
            <option value="following">People you follow</option>
            <option value="subscribers">Subscribers only</option>
          </select>
        </Field>
      </Section>
      <Section title="Post options">
        <Toggle checked={config.twitterThreadMode} onChange={(v) => onChange("twitterThreadMode", v)} label="Thread mode" description="Splits long content into a numbered thread." />
        <Toggle checked={config.twitterCardEnabled} onChange={(v) => onChange("twitterCardEnabled", v)} label="Show link preview card" description="Renders a rich card when the post contains a URL." />
        <Toggle checked={config.twitterSensitive} onChange={(v) => onChange("twitterSensitive", v)} label="Mark as sensitive content" description="Adds an age-gate warning to media in this post." />
        <Toggle checked={config.twitterForSuperFollowers} onChange={(v) => onChange("twitterForSuperFollowers", v)} label="Super followers only" description="Restricts this post to paid super followers." />
      </Section>
    </>
  );
}

function YouTubeSettings({
  config,
  highlightedFixTargetId,
  onChange,
}: {
  config: PlatformConfig;
  highlightedFixTargetId?: string | null;
  onChange: (key: keyof PlatformConfig, value: any) => void;
}) {
  return (
    <>
      <Section title="Video details" sectionId="youtube-video-details">
        <Field label="Video title *" hint="Required for YouTube uploads.">
          <input
            id="youtube-title-field"
            value={config.youtubeTitle}
            onChange={(e) => onChange("youtubeTitle", e.target.value)}
            placeholder="My awesome video"
            className={`${inputCls} ${highlightedFixTargetId === "youtube-title-field" ? highlightedFieldCls : ""}`}
          />
        </Field>
        <Field label="Tags" hint="Add keywords one by one to help with discovery.">
          <MultiValueInput
            value={config.youtubeTags}
            onChange={(value) => onChange("youtubeTags", value)}
            placeholder="marketing"
          />
        </Field>
        <Field label="Category ID" hint="YouTube category number, e.g. 22 = People & Blogs.">
          <input value={config.youtubeCategoryId} onChange={(e) => onChange("youtubeCategoryId", e.target.value)} placeholder="22" className={inputCls} />
        </Field>
      </Section>
      <Section title="Privacy & visibility">
        <Field label="Privacy status">
          <select value={config.youtubePrivacy} onChange={(e) => onChange("youtubePrivacy", e.target.value)} className={selectCls}>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </Field>
        <Field label="License">
          <select value={config.youtubeLicense} onChange={(e) => onChange("youtubeLicense", e.target.value)} className={selectCls}>
            <option value="youtube">Standard YouTube License</option>
            <option value="creativeCommon">Creative Commons – Attribution</option>
          </select>
        </Field>
        <Field label="Video language" hint='ISO 639-1 code, e.g. "en"'>
          <input value={config.youtubeLanguage} onChange={(e) => onChange("youtubeLanguage", e.target.value)} placeholder="en" className={inputCls} />
        </Field>
        <Field label="Audio language">
          <input value={config.youtubeDefaultAudioLanguage} onChange={(e) => onChange("youtubeDefaultAudioLanguage", e.target.value)} placeholder="en" className={inputCls} />
        </Field>
      </Section>
      <Section title="Options">
        <Toggle checked={config.youtubeNotifySubscribers} onChange={(v) => onChange("youtubeNotifySubscribers", v)} label="Notify subscribers" description="Send a notification to your subscribers when published." />
        <Toggle checked={config.youtubeEmbeddable} onChange={(v) => onChange("youtubeEmbeddable", v)} label="Allow embedding" description="Let others embed this video on their websites." />
        <Toggle checked={config.youtubeMadeForKids} onChange={(v) => onChange("youtubeMadeForKids", v)} label="Made for kids" description="Required if the content is directed at children." />
      </Section>
    </>
  );
}

function BloggerSettings({ config, onChange }: { config: PlatformConfig; onChange: (key: keyof PlatformConfig, value: any) => void }) {
  return (
    <>
      <Section title="Post details">
        <Field label="Post title" hint="Overrides the main caption as the article headline.">
          <input value={config.bloggerTitle} onChange={(e) => onChange("bloggerTitle", e.target.value)} placeholder="My blog post title" className={inputCls} />
        </Field>
        <Field label="Labels" hint="Add tags or categories one by one.">
          <MultiValueInput
            value={config.bloggerLabels}
            onChange={(value) => onChange("bloggerLabels", value)}
            placeholder="tech"
          />
        </Field>
        <Field label="Location" hint="Optional location to associate with the post.">
          <input value={config.bloggerLocation} onChange={(e) => onChange("bloggerLocation", e.target.value)} placeholder="New York, USA" className={inputCls} />
        </Field>
      </Section>
      <Section title="Publishing">
        <Toggle checked={config.bloggerIsDraft} onChange={(v) => onChange("bloggerIsDraft", v)} label="Save as draft" description="Post will be saved but not published publicly." />
        <Field label="Reader comments">
          <select value={config.bloggerReaderComments} onChange={(e) => onChange("bloggerReaderComments", e.target.value)} className={selectCls}>
            <option value="ALLOW">Allow comments</option>
            <option value="DONT_ALLOW_SHOW_EXISTING">Disable new, show existing</option>
            <option value="DONT_ALLOW_HIDE_EXISTING">Disable all comments</option>
          </select>
        </Field>
        <Field label="Meta robots tags" hint="Leave blank for default.">
          <MultiValueInput
            value={config.bloggerCustomMetaRobotsTags}
            onChange={(value) => onChange("bloggerCustomMetaRobotsTags", value)}
            placeholder="noindex"
          />
        </Field>
      </Section>
    </>
  );
}

function GoogleBusinessSettings({ config, onChange }: { config: PlatformConfig; onChange: (key: keyof PlatformConfig, value: any) => void }) {
  return (
    <>
      <Section title="Post type">
        <Field label="Update type">
          <select value={config.googleBusinessPostType} onChange={(e) => onChange("googleBusinessPostType", e.target.value)} className={selectCls}>
            <option value="STANDARD">Standard update</option>
            <option value="EVENT">Event</option>
            <option value="OFFER">Offer / Promotion</option>
          </select>
        </Field>
      </Section>
      {config.googleBusinessPostType === "EVENT" && (
        <Section title="Event details">
          <Field label="Event title">
            <input value={config.googleBusinessEventTitle} onChange={(e) => onChange("googleBusinessEventTitle", e.target.value)} placeholder="Grand Opening" className={inputCls} />
          </Field>
          <Field label="Start date & time">
            <input type="datetime-local" value={formatDateTimeLocal(config.googleBusinessEventStartDate)} onChange={(e) => onChange("googleBusinessEventStartDate", e.target.value)} className={inputCls} />
          </Field>
          <Field label="End date & time">
            <input type="datetime-local" value={formatDateTimeLocal(config.googleBusinessEventEndDate)} onChange={(e) => onChange("googleBusinessEventEndDate", e.target.value)} className={inputCls} />
          </Field>
        </Section>
      )}
      {config.googleBusinessPostType === "OFFER" && (
        <Section title="Offer details">
          <Field label="Coupon / promo code">
            <input value={config.googleBusinessOfferCode} onChange={(e) => onChange("googleBusinessOfferCode", e.target.value)} placeholder="SAVE20" className={inputCls} />
          </Field>
          <Field label="Redeem URL">
            <input value={config.googleBusinessOfferRedeemUrl} onChange={(e) => onChange("googleBusinessOfferRedeemUrl", e.target.value)} placeholder="https://example.com/offer" className={inputCls} />
          </Field>
          <Field label="Terms & conditions">
            <input value={config.googleBusinessOfferTerms} onChange={(e) => onChange("googleBusinessOfferTerms", e.target.value)} placeholder="Valid in-store only" className={inputCls} />
          </Field>
        </Section>
      )}
      <Section title="Call to Action">
        <Field label="CTA button">
          <select value={config.googleBusinessCta} onChange={(e) => onChange("googleBusinessCta", e.target.value)} className={selectCls}>
            <option value="NONE">No button</option>
            <option value="BOOK">Book</option>
            <option value="ORDER">Order online</option>
            <option value="SHOP">Shop</option>
            <option value="LEARN_MORE">Learn more</option>
            <option value="SIGN_UP">Sign up</option>
            <option value="CALL">Call now</option>
          </select>
        </Field>
        {config.googleBusinessCta !== "NONE" && config.googleBusinessCta !== "CALL" && (
          <Field label="CTA URL">
            <input value={config.googleBusinessCtaUrl} onChange={(e) => onChange("googleBusinessCtaUrl", e.target.value)} placeholder="https://example.com" className={inputCls} />
          </Field>
        )}
      </Section>
    </>
  );
}

function WordPressSettings({ config, onChange }: { config: PlatformConfig; onChange: (key: keyof PlatformConfig, value: any) => void }) {
  return (
    <>
      <Section title="Post details">
        <Field label="Post title" hint="Used as the article headline in WordPress.">
          <input value={config.wordpressTitle} onChange={(e) => onChange("wordpressTitle", e.target.value)} placeholder="My article title" className={inputCls} />
        </Field>
        <Field label="Excerpt" hint="Short summary shown in listings and RSS.">
          <textarea value={config.wordpressExcerpt} onChange={(e) => onChange("wordpressExcerpt", e.target.value)} placeholder="A brief summary of the post..." rows={2} className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Slug" hint="URL-friendly identifier, e.g. my-awesome-post.">
          <input value={config.wordpressSlug} onChange={(e) => onChange("wordpressSlug", e.target.value)} placeholder="my-awesome-post" className={inputCls} />
        </Field>
      </Section>
      <Section title="Publishing">
        <Field label="Status">
          <select value={config.wordpressStatus} onChange={(e) => onChange("wordpressStatus", e.target.value)} className={selectCls}>
            <option value="publish">Publish immediately</option>
            <option value="draft">Save as draft</option>
            <option value="private">Private</option>
            <option value="pending">Pending review</option>
            <option value="future">Scheduled (future)</option>
          </select>
        </Field>
        <Field label="Post format">
          <select value={config.wordpressFormat} onChange={(e) => onChange("wordpressFormat", e.target.value)} className={selectCls}>
            <option value="standard">Standard</option>
            <option value="aside">Aside</option>
            <option value="link">Link</option>
            <option value="quote">Quote</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="gallery">Gallery</option>
          </select>
        </Field>
        <Toggle checked={config.wordpressSticky} onChange={(v) => onChange("wordpressSticky", v)} label="Sticky post" description="Pin this post to the top of the blog." />
        <Toggle checked={config.wordpressFeaturedMediaEnabled} onChange={(v) => onChange("wordpressFeaturedMediaEnabled", v)} label="Use first image as featured media" description="Sets the featured image from attached media." />
      </Section>
      <Section title="Taxonomy">
        <Field label="Categories" hint="Add category names or IDs one by one.">
          <MultiValueInput
            value={config.wordpressCategories}
            onChange={(value) => onChange("wordpressCategories", value)}
            placeholder="News"
          />
        </Field>
        <Field label="Tags" hint="Add tag names one by one.">
          <MultiValueInput
            value={config.wordpressTags}
            onChange={(value) => onChange("wordpressTags", value)}
            placeholder="launch"
          />
        </Field>
      </Section>
      <Section title="Comments & Advanced">
        <Field label="Comments">
          <select value={config.wordpressCommentStatus} onChange={(e) => onChange("wordpressCommentStatus", e.target.value)} className={selectCls}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
        <Field label="Ping status">
          <select value={config.wordpressPingStatus} onChange={(e) => onChange("wordpressPingStatus", e.target.value)} className={selectCls}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
        <Field label="Author ID" hint="Leave blank to use the authenticated user.">
          <input value={config.wordpressAuthorId} onChange={(e) => onChange("wordpressAuthorId", e.target.value)} placeholder="1" className={inputCls} />
        </Field>
        <Field label="Password" hint="Set a password to protect this post.">
          <input type="password" value={config.wordpressPassword} onChange={(e) => onChange("wordpressPassword", e.target.value)} placeholder="••••••••" className={inputCls} />
        </Field>
      </Section>
    </>
  );
}

/* ================= MAIN COMPONENT ================= */

export function PlatformSettings({
  selectedPlatforms,
  platformConfigs,
  activePlatformTab,
  highlightedFixTargetId,
  onTabChange,
  onConfigChange,
}: Props) {
  if (!selectedPlatforms.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="text-3xl opacity-30">⚙️</div>
        <p className="text-sm font-medium text-[#9d8f7a]">
          Select a platform on the left to configure its settings
        </p>
      </div>
    );
  }

  const activeTab = activePlatformTab ?? selectedPlatforms[0];
  const config = platformConfigs[activeTab];

  const handleChange = (key: keyof PlatformConfig, value: any) => {
    onConfigChange(activeTab, key, value);
  };

  return (
    <div className="flex h-full flex-col">

      {/* TABS */}
      <div className="border-b border-[#eadfcb] bg-[#fffef9] px-3 pt-3">
        <div className="flex gap-1 overflow-x-auto">
          {selectedPlatforms.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => onTabChange(platform)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-t-xl border border-b-0 px-3 py-2 text-[11px] font-semibold transition-colors ${
                activeTab === platform
                  ? "border-[#e7dcc9] bg-white text-[#7a5c1f]"
                  : "border-transparent text-[#9d8f7a] hover:text-[#5c4f3a]"
              }`}
            >
              <PlatformLogo platform={platform} className="h-3.5 w-3.5" />
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <div className="flex items-center gap-2.5">
          <PlatformLogo platform={activeTab} className="h-5 w-5" />
          <div>
            <h3 className="text-sm font-bold text-[#2a1f0e]">{PLATFORM_LABELS[activeTab]} settings</h3>
            <p className="text-[11px] text-[#9d8f7a]">Configure publish options for this platform</p>
          </div>
        </div>

        {/* SCHEDULE — shared */}
        <Section title="Schedule">
          <Field label="Publish time" hint="Leave blank to publish immediately after creating.">
            <input
              type="datetime-local"
              value={formatDateTimeLocal(config.schedule)}
              onChange={(e) => handleChange("schedule", e.target.value)}
              className={inputCls}
            />
          </Field>
        </Section>

        {/* PLATFORM-SPECIFIC */}
        {activeTab === "facebook" && <FacebookSettings config={config} onChange={handleChange} />}
        {activeTab === "instagram" && <InstagramSettings config={config} highlightedFixTargetId={highlightedFixTargetId} onChange={handleChange} />}
        {activeTab === "linkedin" && <LinkedInSettings config={config} onChange={handleChange} />}
        {activeTab === "twitter" && <TwitterSettings config={config} onChange={handleChange} />}
        {activeTab === "youtube" && <YouTubeSettings config={config} highlightedFixTargetId={highlightedFixTargetId} onChange={handleChange} />}
        {activeTab === "blogger" && <BloggerSettings config={config} onChange={handleChange} />}
        {activeTab === "google_business" && <GoogleBusinessSettings config={config} onChange={handleChange} />}
        {activeTab === "wordpress" && <WordPressSettings config={config} onChange={handleChange} />}
      </div>
    </div>
  );
}
