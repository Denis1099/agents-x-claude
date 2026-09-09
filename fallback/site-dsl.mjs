/**
 * FALLBACK RENDERER — not the normal path.
 *
 * Emits one fixed layout: the landscaping design (deep canopy green, condensed
 * display type, services-as-legend). It exists so a failed live run has a
 * one-command rescue that produces a known-good site.
 *
 * The normal path is the agent designing for the business in front of it and
 * writing its own DSL — see skills/framer-site-builder/SKILL.md. Reaching for
 * this file by default is how every site ends up looking the same, which is the
 * one thing this project claims not to do.
 *
 * No Framer AI credits are consumed either way: `applyChanges` is a structured
 * canvas mutation, not a model call.
 */

const esc = (s) => String(s ?? '').replace(/"/g, '\\"');

/** Framer's design rules require smart apostrophes in canvas text. */
const smart = (s) => String(s ?? '').replace(/'/g, '’');

const t = (s) => esc(smart(s));

export const TOKENS = {
  shade: '#16211A',
  cedar: '#33503C',
  caliche: '#E7E2D4',
  granite: '#9A948B',
  lantana: '#D14A2C',
};

/** Swatch colours for the services legend, cycled. */
const SWATCHES = [TOKENS.cedar, TOKENS.granite, TOKENS.lantana, TOKENS.caliche];

const telHref = (phone) => `tel:+1${String(phone ?? '').replace(/\D/g, '')}`;

const article = (word) => (/^[aeiou]/i.test(String(word)) ? 'an' : 'a');

/**
 * Copy derived from listing data alone. Deliberately plain and concrete: every
 * line traces to a brief field, so an unattended run cannot fabricate.
 */
export function defaultContent(brief) {
  const cat = String(brief.category ?? 'local business').toLowerCase();
  const where = [brief.neighborhood, brief.city].filter(Boolean).join(', ');
  const services = (brief.serviceTags ?? []).slice(0, 6);
  const themes = (brief.reviewThemes ?? []).slice(0, 8).map((x) => x.tag);

  return {
    headline: brief.rating
      ? `${brief.city}’s ${brief.rating}-star ${cat}.`
      : `${cat} in ${brief.city}.`,
    sub: services.length
      ? `${services.slice(0, 4).join(', ')} — across ${where || brief.city}.`
      : `Serving ${where || brief.city}.`,
    ctaSecondary: 'See the work',

    servicesHeading: services.length
      ? `${services.length} services, one phone call.`
      : 'What we do.',
    services: services.map((name) => ({
      name,
      blurb: `${name} for homes and businesses across ${brief.city}.`,
    })),

    proofHeading: 'What people actually say.',
    proofThemes: themes,

    galleryHeading: 'Recent work.',

    aboutHeading: where ? `Working out of ${where}.` : `Working in ${brief.city}.`,
    aboutParas: [
      brief.address
        ? `${brief.name} works out of ${brief.address}, serving ${where || brief.city} and the surrounding area.`
        : `${brief.name} serves ${where || brief.city} and the surrounding area.`,
      services.length
        ? `Google lists ${services.length} services under this business — ${services.join(', ').toLowerCase()} — which means one number covers the whole job.`
        : `Reach them directly on the number below.`,
    ],

    contactHeading: `Tell ${brief.name} what you need.`,
  };
}

/* ------------------------------------------------------------------ */
/* Foundation                                                          */
/* ------------------------------------------------------------------ */

export function foundationDsl(breakpointId) {
  return [
    `+ColorStyleTokenNode tokShade name="Shade" light="${TOKENS.shade}";`,
    `+ColorStyleTokenNode tokCedar name="Cedar" light="${TOKENS.cedar}";`,
    `+ColorStyleTokenNode tokCaliche name="Caliche" light="${TOKENS.caliche}";`,
    `+ColorStyleTokenNode tokGranite name="Granite" light="${TOKENS.granite}";`,
    `+ColorStyleTokenNode tokLantana name="Lantana" light="${TOKENS.lantana}";`,

    `+TextStylePresetNode tsDisplay name="Display" tag="h1" fontName="Saira Condensed" fontWeight="900" fontSize="104px" lineHeight="0.9em" letterSpacing="-1px" textTransform="uppercase" textColor="var(--token-tokCaliche)" breakpoint.medium.fontSize="72px" breakpoint.small.fontSize="48px";`,
    `+TextStylePresetNode tsH2 name="Section Heading" tag="h2" fontName="Saira Condensed" fontWeight="800" fontSize="56px" lineHeight="0.95em" textTransform="uppercase" textColor="var(--token-tokCaliche)" breakpoint.medium.fontSize="42px" breakpoint.small.fontSize="34px";`,
    `+TextStylePresetNode tsH3 name="Card Heading" tag="h3" fontName="Saira Condensed" fontWeight="700" fontSize="26px" lineHeight="1.1em" textTransform="uppercase" letterSpacing="0.3px" textColor="var(--token-tokCaliche)";`,
    `+TextStylePresetNode tsSub name="Subhead" tag="p" fontName="Archivo" fontWeight="400" fontSize="19px" lineHeight="1.55em" textColor="var(--token-tokCaliche)" textWrapBalance="true" breakpoint.small.fontSize="16px";`,
    `+TextStylePresetNode tsBody name="Body" tag="p" fontName="Archivo" fontWeight="400" fontSize="16px" lineHeight="1.65em" textColor="var(--token-tokCaliche)";`,
    `+TextStylePresetNode tsEyebrow name="Eyebrow" tag="p" fontName="Archivo" fontWeight="600" fontSize="12px" letterSpacing="1.6px" textTransform="uppercase" textColor="var(--token-tokCaliche)";`,
    `+TextStylePresetNode tsWordmark name="Wordmark" tag="p" fontName="Saira Condensed" fontWeight="800" fontSize="22px" letterSpacing="0.5px" textTransform="uppercase" textColor="var(--token-tokCaliche)";`,
    `+TextStylePresetNode tsBtn name="Button Text" tag="p" fontName="Archivo" fontWeight="600" fontSize="15px" letterSpacing="0.3px" textColor="var(--token-tokCaliche)";`,
    `+TextStylePresetNode tsStat name="Stat" tag="p" fontName="Saira Condensed" fontWeight="900" fontSize="112px" lineHeight="0.85em" textColor="var(--token-tokCaliche)" breakpoint.small.fontSize="88px";`,

    `SET ${breakpointId} layout="stack" stackDirection="vertical" stackDistribution="start" stackAlignment="center" gap="0px" height="auto" fill="var(--token-tokShade)" overflow="clip";`,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

const SECTION_PAD = '104px 56px';
const INNER = 'width="1fr" maxWidth="1120px" height="auto"';

function heroDsl(brief, c, bp) {
  const photo = brief.photos[0]?.url ?? '';
  const tel = telHref(brief.phone);
  const ratingText = brief.rating
    ? `${brief.rating} ★ · ${brief.reviewCount ?? 0} Google reviews`
    : 'On Google';

  const out = [
    `+FrameNode hero parent="${bp}" index="0" name="Hero" htmlTag="section" layout="stack" stackDirection="vertical" stackDistribution="space-between" stackAlignment="center" gap="0px" width="1fr" height="88vh" minHeight="620px" padding="36px 56px 64px 56px" position="relative" overflow="clip" fill="${esc(photo)}" fillImagePositionX="center" fillImagePositionY="center";`,
    `+FrameNode heroScrim parent="hero" index="0" name="Scrim" position="absolute" left="0px" top="0px" width="100%" height="100%" fill="linear-gradient(180deg, rgba(22,33,26,0.30) 0%, rgba(22,33,26,0.62) 55%, rgba(22,33,26,0.94) 100%)" pointerEvents="none";`,

    `+FrameNode heroTop parent="hero" index="1" name="Top Bar" layout="stack" stackDirection="horizontal" stackDistribution="space-between" stackAlignment="center" gap="16px" ${INNER} position="relative" zIndex="1";`,
    `+RichTextNode wordmark parent="heroTop" index="0" text="${t(brief.name)}" textStylePreset="Wordmark" width="auto" height="auto";`,
    `+FrameNode ratingPill parent="heroTop" index="1" name="Rating" layout="stack" stackDirection="horizontal" stackAlignment="center" gap="8px" width="auto" height="auto" padding="8px 14px" radius="999px" border="1px solid rgba(231,226,212,0.35)" fill="rgba(22,33,26,0.35)" backgroundBlur="8px";`,
    `+RichTextNode ratingTxt parent="ratingPill" index="0" text="${esc(ratingText)}" textStylePreset="Eyebrow" width="auto" height="auto" openTypeFontFeatures.tnum="on";`,

    `+FrameNode heroBody parent="hero" index="2" name="Hero Content" layout="stack" stackDirection="vertical" stackAlignment="start" gap="22px" ${INNER} position="relative" zIndex="1";`,
    `+RichTextNode heroHead parent="heroBody" index="0" text="${t(c.headline)}" textStylePreset="Display" width="1fr" maxWidth="900px" height="auto";`,
    `+RichTextNode heroSub parent="heroBody" index="1" text="${t(c.sub)}" textStylePreset="Subhead" width="1fr" maxWidth="580px" height="auto";`,
    `+FrameNode heroCtas parent="heroBody" index="2" name="CTAs" layout="stack" stackDirection="horizontal" stackAlignment="center" gap="12px" width="auto" height="auto" stackWrapEnabled="false";`,
    `+FrameNode btnCall parent="heroCtas" index="0" name="Call Button" htmlTag="button" cursor="pointer" layout="stack" stackDirection="horizontal" stackAlignment="center" stackDistribution="center" gap="8px" width="auto" height="auto" padding="15px 26px" radius="6px" fill="var(--token-tokLantana)" link.href="${tel}" hoverEffect.scale="1.02" hoverEffect.transition="tween 0.2s";`,
    `+RichTextNode btnCallTxt parent="btnCall" index="0" text="Call ${esc(brief.phone)}" textStylePreset="Button Text" width="auto" height="auto";`,
  ];

  if (brief.photos.length > 1) {
    out.push(
      `+FrameNode btnWork parent="heroCtas" index="1" name="Work Button" htmlTag="button" cursor="pointer" layout="stack" stackDirection="horizontal" stackAlignment="center" stackDistribution="center" width="auto" height="auto" padding="15px 26px" radius="6px" border="1px solid rgba(231,226,212,0.5)" link.href="#work" link.smoothScroll="true" hoverEffect.backgroundColor="rgba(231,226,212,0.12)" hoverEffect.transition="tween 0.2s";`,
      `+RichTextNode btnWorkTxt parent="btnWork" index="0" text="${t(c.ctaSecondary)}" textStylePreset="Button Text" width="auto" height="auto";`,
    );
  }

  out.push(
    `SET heroBody appearEffect.trigger="onMount" appearEffect.enter.opacity="0" appearEffect.enter.y="22" appearEffect.enter.transition="spring-duration 0.7s 0.25 0s" appearEffect.enter.stagger="0.08s";`,
    `SET heroTop appearEffect.trigger="onMount" appearEffect.enter.opacity="0" appearEffect.enter.transition="spring-duration 0.6s 0.3 0.1s";`,
  );
  return out;
}

/**
 * The signature element: services rendered as a landscape-plan legend, each
 * trade keyed to a material swatch. Specific to this kind of business, and not
 * a card grid.
 */
function servicesDsl(c, bp) {
  if (!c.services?.length) return [];
  const out = [
    `+FrameNode svc parent="${bp}" index="1" name="Services" htmlTag="section" layout="stack" stackDirection="vertical" stackAlignment="center" gap="0px" width="1fr" height="auto" padding="${SECTION_PAD}" fill="var(--token-tokShade)";`,
    `+FrameNode svcInner parent="svc" index="0" layout="stack" stackDirection="vertical" stackAlignment="start" gap="48px" ${INNER};`,
    `+RichTextNode svcHead parent="svcInner" index="0" text="${t(c.servicesHeading)}" textStylePreset="Section Heading" width="1fr" maxWidth="760px" height="auto";`,
    `+FrameNode svcList parent="svcInner" index="1" name="Legend" layout="stack" stackDirection="vertical" stackAlignment="start" gap="0px" width="1fr" height="auto";`,
  ];

  c.services.forEach((s, i) => {
    const swatch = SWATCHES[i % SWATCHES.length];
    out.push(
      `+FrameNode svcRow${i} parent="svcList" index="${i}" name="${esc(s.name)}" layout="stack" stackDirection="horizontal" stackAlignment="start" gap="28px" width="1fr" height="auto" padding="28px 0px" borderTop="1px solid rgba(231,226,212,0.18)" hoverEffect.backgroundColor="rgba(231,226,212,0.04)" hoverEffect.transition="tween 0.2s";`,
      `+FrameNode svcSw${i} parent="svcRow${i}" index="0" name="Swatch" width="56px" height="56px" radius="3px" fill="${swatch}";`,
      `+FrameNode svcTxt${i} parent="svcRow${i}" index="1" layout="stack" stackDirection="vertical" stackAlignment="start" gap="8px" width="1fr" height="auto";`,
      `+RichTextNode svcName${i} parent="svcTxt${i}" index="0" text="${t(s.name)}" textStylePreset="Card Heading" width="1fr" height="auto";`,
      `+RichTextNode svcBlurb${i} parent="svcTxt${i}" index="1" text="${t(s.blurb)}" textStylePreset="Body" width="1fr" maxWidth="620px" height="auto" opacity="0.72";`,
    );
  });

  out.push(
    `SET svcInner appearEffect.trigger="onInView" appearEffect.threshold="0.15" appearEffect.enter.opacity="0" appearEffect.enter.y="24" appearEffect.enter.transition="spring-duration 0.6s 0.3 0s" appearEffect.enter.stagger="0.05s";`,
  );
  return out;
}

function proofDsl(brief, c, bp) {
  if (!brief.rating) return [];
  const out = [
    `+FrameNode proof parent="${bp}" index="2" name="Proof" htmlTag="section" layout="stack" stackDirection="vertical" stackAlignment="center" width="1fr" height="auto" padding="${SECTION_PAD}" fill="var(--token-tokCedar)";`,
    `+FrameNode proofInner parent="proof" index="0" layout="stack" stackDirection="horizontal" stackDistribution="space-between" stackAlignment="start" gap="64px" ${INNER} stackWrapEnabled="true";`,
    `+FrameNode proofLeft parent="proofInner" index="0" layout="stack" stackDirection="vertical" stackAlignment="start" gap="6px" width="auto" minWidth="260px" height="auto";`,
    `+RichTextNode proofStat parent="proofLeft" index="0" text="${brief.rating}" textStylePreset="Stat" width="auto" height="auto" openTypeFontFeatures.tnum="on";`,
    `+RichTextNode proofCap parent="proofLeft" index="1" text="${brief.reviewCount ?? 0} reviews on Google" textStylePreset="Eyebrow" width="auto" height="auto" opacity="0.75";`,
    `+FrameNode proofRight parent="proofInner" index="1" layout="stack" stackDirection="vertical" stackAlignment="start" gap="20px" width="1fr" minWidth="420px" height="auto";`,
    `+RichTextNode proofHead parent="proofRight" index="0" text="${t(c.proofHeading)}" textStylePreset="Section Heading" width="1fr" height="auto";`,
  ];

  if (c.proofThemes?.length) {
    out.push(
      `+FrameNode proofTags parent="proofRight" index="1" name="Themes" layout="stack" stackDirection="horizontal" stackAlignment="center" gap="10px" width="1fr" height="auto" stackWrapEnabled="true";`,
    );
    c.proofThemes.forEach((tag, i) => {
      out.push(
        `+FrameNode pTag${i} parent="proofTags" index="${i}" width="auto" height="auto" padding="9px 16px" radius="999px" border="1px solid rgba(231,226,212,0.4)";`,
        `+RichTextNode pTagT${i} parent="pTag${i}" index="0" text="${t(tag)}" textStylePreset="Eyebrow" width="auto" height="auto";`,
      );
    });
  }

  out.push(
    `+RichTextNode proofNote parent="proofRight" index="2" text="Rating and recurring review themes from this business’s public Google Business Profile." textStylePreset="Body" width="1fr" maxWidth="560px" height="auto" fontSize="13px" opacity="0.6";`,
    `SET proofInner appearEffect.trigger="onInView" appearEffect.threshold="0.2" appearEffect.enter.opacity="0" appearEffect.enter.y="24" appearEffect.enter.transition="spring-duration 0.6s 0.3 0s" appearEffect.enter.stagger="0.06s";`,
  );
  return out;
}

function galleryDsl(brief, c, bp) {
  const photos = brief.photos.slice(1, 10);
  if (photos.length < 2) return [];
  const out = [
    `+FrameNode gal parent="${bp}" index="3" name="Gallery" htmlTag="section" elementId="work" scrollTargetEnabled="true" layout="stack" stackDirection="vertical" stackAlignment="center" gap="0px" width="1fr" height="auto" padding="${SECTION_PAD}" fill="var(--token-tokShade)";`,
    `+FrameNode galInner parent="gal" index="0" layout="stack" stackDirection="vertical" stackAlignment="start" gap="40px" ${INNER};`,
    `+RichTextNode galHead parent="galInner" index="0" text="${t(c.galleryHeading)}" textStylePreset="Section Heading" width="1fr" height="auto";`,
    `+FrameNode galGrid parent="galInner" index="1" name="Grid" layout="grid" gridColumnCount="3" gridColumnMinWidth="240px" gridRowHeightType="auto" gridMasonry="true" gap="14px 14px" width="1fr" height="auto";`,
  ];
  photos.forEach((p, i) => {
    out.push(
      `+FrameNode galImg${i} parent="galGrid" index="${i}" name="Photo ${i + 1}" width="1fr" height="${i % 3 === 0 ? '360px' : '260px'}" radius="4px" overflow="clip" fill="${esc(p.url)}" fillImagePositionX="center" fillImagePositionY="center" hoverEffect.scale="1.03" hoverEffect.transition="tween 0.4s";`,
    );
  });
  out.push(
    `SET galInner appearEffect.trigger="onInView" appearEffect.threshold="0.1" appearEffect.enter.opacity="0" appearEffect.enter.y="24" appearEffect.enter.transition="spring-duration 0.6s 0.3 0s" appearEffect.enter.stagger="0.04s";`,
  );
  return out;
}

function aboutDsl(brief, c, bp) {
  const out = [
    `+FrameNode about parent="${bp}" index="4" name="About" htmlTag="section" layout="stack" stackDirection="vertical" stackAlignment="center" width="1fr" height="auto" padding="${SECTION_PAD}" fill="var(--token-tokCaliche)";`,
    `+FrameNode aboutInner parent="about" index="0" layout="stack" stackDirection="horizontal" stackDistribution="space-between" stackAlignment="start" gap="64px" ${INNER} stackWrapEnabled="true";`,
    `+FrameNode aboutLeft parent="aboutInner" index="0" layout="stack" stackDirection="vertical" stackAlignment="start" gap="24px" width="1fr" minWidth="320px" height="auto";`,
    `+RichTextNode aboutHead parent="aboutLeft" index="0" text="${t(c.aboutHeading)}" textStylePreset="Section Heading" width="1fr" height="auto" textColor="${TOKENS.shade}";`,
  ];
  (c.aboutParas ?? []).forEach((p, i) => {
    out.push(
      `+RichTextNode aboutP${i} parent="aboutLeft" index="${i + 1}" text="${t(p)}" textStylePreset="Body" width="1fr" maxWidth="560px" height="auto" textColor="${TOKENS.shade}" opacity="0.8";`,
    );
  });

  if (brief.hours?.length) {
    out.push(
      `+FrameNode hoursCard parent="aboutInner" index="1" name="Hours" layout="stack" stackDirection="vertical" stackAlignment="start" gap="14px" width="auto" minWidth="280px" height="auto" padding="28px" radius="6px" border="1px solid rgba(22,33,26,0.25)";`,
      `+RichTextNode hoursHead parent="hoursCard" index="0" text="Hours" textStylePreset="Card Heading" width="auto" height="auto" textColor="${TOKENS.shade}";`,
    );
    brief.hours.forEach((h, i) => {
      out.push(
        `+FrameNode hRow${i} parent="hoursCard" index="${i + 1}" layout="stack" stackDirection="horizontal" stackDistribution="space-between" gap="32px" width="1fr" height="auto";`,
        `+RichTextNode hDay${i} parent="hRow${i}" index="0" text="${t(h.day)}" textStylePreset="Body" width="auto" height="auto" textColor="${TOKENS.shade}" fontSize="14px";`,
        `+RichTextNode hVal${i} parent="hRow${i}" index="1" text="${t(h.hours)}" textStylePreset="Body" width="auto" height="auto" textColor="${TOKENS.shade}" fontSize="14px" opacity="0.7" openTypeFontFeatures.tnum="on";`,
      );
    });
  }

  out.push(
    `SET aboutInner appearEffect.trigger="onInView" appearEffect.threshold="0.15" appearEffect.enter.opacity="0" appearEffect.enter.y="24" appearEffect.enter.transition="spring-duration 0.6s 0.3 0s" appearEffect.enter.stagger="0.06s";`,
  );
  return out;
}

function contactDsl(brief, c, bp) {
  const tel = telHref(brief.phone);
  const out = [
    `+FrameNode contact parent="${bp}" index="5" name="Contact" htmlTag="footer" layout="stack" stackDirection="vertical" stackAlignment="center" width="1fr" height="auto" padding="${SECTION_PAD}" fill="var(--token-tokShade)";`,
    `+FrameNode contactInner parent="contact" index="0" layout="stack" stackDirection="vertical" stackAlignment="center" gap="22px" ${INNER};`,
    `+RichTextNode contactHead parent="contactInner" index="0" text="${t(c.contactHeading)}" textStylePreset="Section Heading" width="1fr" maxWidth="760px" height="auto" textAlignment="center";`,
    `+FrameNode phoneBtn parent="contactInner" index="1" name="Phone" htmlTag="button" cursor="pointer" layout="stack" stackAlignment="center" stackDistribution="center" width="auto" height="auto" padding="18px 34px" radius="6px" fill="var(--token-tokLantana)" link.href="${tel}" hoverEffect.scale="1.02" hoverEffect.transition="tween 0.2s";`,
    `+RichTextNode phoneTxt parent="phoneBtn" index="0" text="${esc(brief.phone)}" textStylePreset="Card Heading" width="auto" height="auto" openTypeFontFeatures.tnum="on";`,
  ];

  if (brief.address) {
    out.push(
      `+RichTextNode addrTxt parent="contactInner" index="2" text="${t(brief.address)}" textStylePreset="Body" width="1fr" height="auto" textAlignment="center" opacity="0.75";`,
    );
  }
  if (brief.mapsUrl) {
    out.push(
      `+RichTextNode mapsLink parent="contactInner" index="3" text="View on Google Maps" textStylePreset="Eyebrow" width="1fr" height="auto" textAlignment="center" textColor="var(--token-tokLantana)" link.href="${esc(brief.mapsUrl)}" link.openInNewTab="true";`,
    );
  }

  // The disclaimer is not optional. The business has not been consulted.
  out.push(
    `+RichTextNode disclaimer parent="contactInner" index="4" text="Concept site built from public Google listing data. Not affiliated with ${t(brief.name)}." textStylePreset="Body" width="1fr" maxWidth="620px" height="auto" textAlignment="center" fontSize="12px" opacity="0.45";`,
    `SET contactInner appearEffect.trigger="onInView" appearEffect.threshold="0.2" appearEffect.enter.opacity="0" appearEffect.enter.y="20" appearEffect.enter.transition="spring-duration 0.6s 0.3 0s" appearEffect.enter.stagger="0.06s";`,
  );
  return out;
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * @param {object} brief - a brief.json produced by the finder
 * @param {object} [options]
 * @param {string} options.breakpointId - the page's primary breakpoint FrameNode id
 * @param {object} [options.content] - authored copy; falls back to defaultContent
 * @returns {string} DSL for a single applyChanges call
 */
export function buildSiteDsl(brief, { breakpointId, content } = {}) {
  if (!breakpointId) throw new Error('breakpointId is required — read it from the live project.');
  const c = { ...defaultContent(brief), ...(content ?? {}) };

  return [
    foundationDsl(breakpointId),
    ...heroDsl(brief, c, breakpointId),
    ...servicesDsl(c, breakpointId),
    ...proofDsl(brief, c, breakpointId),
    ...galleryDsl(brief, c, breakpointId),
    ...aboutDsl(brief, c, breakpointId),
    ...contactDsl(brief, c, breakpointId),
  ].join('\n');
}
