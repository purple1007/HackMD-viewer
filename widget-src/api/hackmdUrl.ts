/**
 * HackMD note URL parsing.
 *
 * Imported by both the widget sandbox and the iframe, so it must stay free of
 * `figma.*`, of DOM APIs, and of `fetch` — whose shape differs between the two.
 * It also avoids `URL`, which the widget sandbox does not provide.
 */

const PUBLIC_BASE = "https://hackmd.io";

/** Path segments that are view modes rather than part of the note's slug. */
const VIEW_MODES = [
  "edit",
  "view",
  "both",
  "slide",
  "print",
  "download",
  "publish",
];

export interface NoteRef {
  /** `@name` prefix of a team or user scoped URL, without the `@`. */
  owner?: string;
  /** The note id, short id or permalink taken from the URL. */
  slug: string;
  /** Published notes live under /s/ and have no API id of their own. */
  published: boolean;
}

/** An error with a message that is safe to show in the widget. */
export class HackMDError extends Error {
  /** When true, don't quietly downgrade to the public endpoint. */
  readonly fatal: boolean;

  constructor(message: string, fatal = false) {
    super(message);
    this.fatal = fatal;
  }
}

/**
 * Pulls the owner and slug out of a HackMD note URL.
 *
 * Handles `hackmd.io/<slug>`, `hackmd.io/@owner/<slug>`, `hackmd.io/s/<id>`,
 * any trailing view mode (`/edit`, `/view`, …) and any query or hash.
 */
export const parseHackMDUrl = (urlString: string): NoteRef => {
  const match = /^(?:https?:\/\/)?(?:www\.)?hackmd\.io\/(.+)$/i.exec(
    urlString.trim()
  );
  if (!match) {
    throw new HackMDError("不是有效的 HackMD 連結");
  }

  const segments = match[1]
    .split(/[?#]/)[0]
    .split("/")
    .filter((segment) => segment.length > 0)
    .filter((segment) => VIEW_MODES.indexOf(segment) === -1);

  if (segments[0] === "s") {
    if (!segments[1]) throw new HackMDError("不是有效的 HackMD 連結");
    return { slug: segments[1], published: true };
  }

  if (segments[0] && segments[0].charAt(0) === "@") {
    if (!segments[1]) throw new HackMDError("不是有效的 HackMD 連結");
    return { owner: segments[0].slice(1), slug: segments[1], published: false };
  }

  if (!segments[0]) throw new HackMDError("不是有效的 HackMD 連結");
  return { slug: segments[0], published: false };
};

/** Public note URLs to try, most specific first. */
export const publicUrlsFor = (ref: NoteRef): string[] => {
  if (ref.published) return [`${PUBLIC_BASE}/s/${ref.slug}`];
  const urls = [`${PUBLIC_BASE}/${ref.slug}`];
  if (ref.owner) {
    urls.unshift(`${PUBLIC_BASE}/@${ref.owner}/${ref.slug}`);
  }
  return urls;
};
