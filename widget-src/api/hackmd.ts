/**
 * HackMD API v1 client — https://api.hackmd.io/v1/docs
 *
 * Widget-sandbox only: the sandbox's fetch returns a FetchResponse (headers
 * come back as a plain `headersObject`), not a DOM Response.
 *
 * ## CORS
 *
 * A widget's fetch is a real browser fetch from a null-origin iframe, so it can
 * only reach endpoints that send `Access-Control-Allow-Origin: *`
 * (https://developers.figma.com/docs/plugins/making-network-requests/).
 * `networkAccess.allowedDomains` is a whitelist, not a proxy. Measured:
 *
 *   hackmd.io/{shortId}/download          200  ACAO: *   <- usable
 *   hackmd.io/@owner/{shortId}/download   200  ACAO: *   <- usable
 *   hackmd.io/s/{publishId}/download      200  ACAO: *   <- usable
 *   hackmd.io/@owner/{permalink}/download 404  no route
 *   hackmd.io/@owner/{permalink}          200  no ACAO
 *   api.hackmd.io/v1/*                    ---  no ACAO, preflight 400s
 *
 * So the authenticated path below cannot currently run inside a widget: reading
 * private notes needs api.hackmd.io to send `Access-Control-Allow-Origin: *`
 * plus `Access-Control-Allow-Headers: Authorization` on its preflight. The
 * client is kept — it is correct against the documented API and starts working
 * the moment those headers land — but its failure is reported honestly rather
 * than surfacing as a bare "Failed to fetch".
 */

import {
  HackMDError,
  NoteRef,
  parseHackMDUrl,
  publicUrlsFor,
} from "./hackmdUrl";

export { HackMDError, parseHackMDUrl };
export type { NoteRef };

const API_BASE = "https://api.hackmd.io/v1";

export interface FetchedNote {
  content: string;
  title?: string;
  /** Epoch millis of the note's last edit, when the API reports one. */
  lastChangedAt?: number;
  /** Where the markdown came from, for the UI to explain itself. */
  source: "api" | "public";
  /** Canonical ids, so a later refresh can skip the lookup. */
  noteId?: string;
  teamPath?: string;
}

/** Header lookup that doesn't assume the sandbox's casing. */
const header = (
  headersObject: { [name: string]: string },
  name: string
): string | undefined => {
  const key = Object.keys(headersObject || {}).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase()
  );
  return key ? headersObject[key] : undefined;
};

const messageForStatus = (status: number, retryAfter?: string) => {
  switch (status) {
    case 401:
      return "Your HackMD API token is invalid or was revoked. Update it from the gear icon in the toolbar.";
    case 403:
      return "This API token doesn't have access to this note.";
    case 404:
      return "Note not found. Check the URL and try again.";
    case 429:
      return retryAfter
        ? `HackMD rate limit reached. Try again in ${retryAfter}s.`
        : "HackMD rate limit reached. Try again shortly.";
    default:
      return `HackMD API error (${status}). Try again.`;
  }
};

interface ApiNote {
  id: string;
  title?: string;
  content?: string;
  shortId?: string;
  permalink?: string | null;
  teamPath?: string | null;
  lastChangedAt?: number;
}

const CORS_BLOCKED =
  "Private notes can't be loaded yet: Figma widgets can't reach the HackMD " +
  "API (api.hackmd.io doesn't send CORS headers). Only public notes are " +
  "supported for now.";

/** How long any single request may run before we give up on it. */
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Rejects if `promise` hasn't settled within `ms`. A CORS-blocked request in
 * the widget sandbox can stay pending for a very long time before the network
 * layer fails — without this the widget would sit on "Loading…" and look frozen.
 * The underlying fetch may still be in flight; we just stop waiting on it.
 */
const withTimeout = <T>(promise: Promise<T>, message: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new HackMDError(message)),
      REQUEST_TIMEOUT_MS
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

const apiGet = async (token: string, path: string) => {
  try {
    return await withTimeout(
      fetch(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
      CORS_BLOCKED
    );
  } catch (error) {
    // The Authorization header forces a preflight that api.hackmd.io answers
    // without CORS headers, so the request never completes — surface that
    // rather than let a rejected/handing fetch escape as "Failed to fetch".
    throw error instanceof HackMDError ? error : new HackMDError(CORS_BLOCKED);
  }
};

/** True when a note from a listing is the one the URL pointed at. */
const matchesSlug = (note: ApiNote, slug: string) =>
  note.id === slug || note.shortId === slug || note.permalink === slug;

/**
 * Resolves an `@owner/slug` URL to a canonical note id by listing the owner's
 * notes. `GET /notes/{id}` only accepts an id or short id, not a permalink.
 */
const resolveByOwner = async (
  token: string,
  ref: NoteRef
): Promise<{ noteId: string; teamPath?: string } | null> => {
  const teamsResponse = await apiGet(token, "/teams");
  if (teamsResponse.ok) {
    const teams: { path?: string }[] = await teamsResponse.json();
    const team = teams.find(
      (candidate) =>
        (candidate.path || "").toLowerCase() === (ref.owner || "").toLowerCase()
    );
    if (team?.path) {
      const listed = await apiGet(
        token,
        `/teams/${encodeURIComponent(team.path)}/notes`
      );
      if (listed.ok) {
        const notes: ApiNote[] = await listed.json();
        const note = notes.find((candidate) =>
          matchesSlug(candidate, ref.slug)
        );
        if (note) return { noteId: note.id, teamPath: team.path };
      }
    }
  }

  const listed = await apiGet(token, "/notes");
  if (listed.ok) {
    const notes: ApiNote[] = await listed.json();
    const note = notes.find((candidate) => matchesSlug(candidate, ref.slug));
    if (note) return { noteId: note.id };
  }

  return null;
};

const notePath = (noteId: string, teamPath?: string) =>
  teamPath
    ? `/teams/${encodeURIComponent(teamPath)}/notes/${encodeURIComponent(
        noteId
      )}`
    : `/notes/${encodeURIComponent(noteId)}`;

const toFetchedNote = (note: ApiNote, teamPath?: string): FetchedNote => ({
  content: note.content || "",
  title: note.title,
  lastChangedAt: note.lastChangedAt,
  source: "api",
  noteId: note.id,
  teamPath: teamPath || note.teamPath || undefined,
});

/** Fetches raw markdown through the authenticated API. */
const fetchViaApi = async (
  token: string,
  ref: NoteRef,
  resolved?: { noteId?: string; teamPath?: string }
): Promise<FetchedNote> => {
  // A previous fetch already resolved the canonical id — one request is enough.
  if (resolved?.noteId) {
    const response = await apiGet(
      token,
      notePath(resolved.noteId, resolved.teamPath)
    );
    if (response.ok) {
      return toFetchedNote(await response.json(), resolved.teamPath);
    }
    if (response.status === 401) {
      throw new HackMDError(messageForStatus(401), true);
    }
    // The note may have moved; fall through to a fresh lookup.
  }

  const direct = await apiGet(token, `/notes/${encodeURIComponent(ref.slug)}`);
  if (direct.ok) {
    return toFetchedNote(await direct.json());
  }
  if (direct.status === 401 || direct.status === 429) {
    throw new HackMDError(
      messageForStatus(
        direct.status,
        header(direct.headersObject, "Retry-After")
      ),
      true
    );
  }

  const owned = ref.owner ? await resolveByOwner(token, ref) : null;
  if (owned) {
    const response = await apiGet(
      token,
      notePath(owned.noteId, owned.teamPath)
    );
    if (response.ok) {
      return toFetchedNote(await response.json(), owned.teamPath);
    }
    throw new HackMDError(
      messageForStatus(
        response.status,
        header(response.headersObject, "Retry-After")
      ),
      response.status === 403
    );
  }

  throw new HackMDError(messageForStatus(direct.status));
};

/** A 200 that is really the "note not found" page rather than markdown. */
const looksLikeHtml = (body: string) => /^\s*<(?:!doctype|html)\b/i.test(body);

/** Marker error meaning "download didn't work, and it wasn't a server error". */
const NOT_PUBLIC = "not-public";

/**
 * Fetches raw markdown from the public `/download` endpoint — the one HackMD
 * route that sends `Access-Control-Allow-Origin: *`, so the only route a
 * null-origin widget can actually read. Resolves for public / link-readable /
 * published notes; rejects (without hanging) for everything else.
 */
const fetchPublic = async (ref: NoteRef): Promise<FetchedNote> => {
  let lastStatus = 0;

  for (const url of publicUrlsFor(ref)) {
    let response;
    try {
      response = await withTimeout(
        fetch(`${url}/download?t=${Date.now()}`),
        "Timed out reaching HackMD. Try again."
      );
    } catch (error) {
      // A private note's 403 (no CORS headers) and a timeout both land here; a
      // later URL in the list may still work, so keep going.
      continue;
    }
    if (response.ok) {
      const body = await response.text();
      // A 200 can still be the "note not found" HTML page rather than markdown.
      if (!looksLikeHtml(body)) {
        return { content: body, source: "public" };
      }
    }
    lastStatus = response.status;
  }

  if (lastStatus && lastStatus !== 403 && lastStatus !== 404) {
    throw new HackMDError(
      `Couldn't load this note (${lastStatus}). Try again.`
    );
  }
  throw new HackMDError(NOT_PUBLIC);
};

/**
 * Loads a note's markdown.
 *
 * Public `/download` is tried first: it is the only CORS-reachable route, so it
 * is both the fast path for public notes and the only path that can succeed in a
 * widget today. The authenticated API is a fallback for when a note is not
 * public — it cannot run in a widget yet (api.hackmd.io sends no CORS headers),
 * but it is written and wired so it starts working the moment those headers
 * land. Every request is time-boxed so a blocked call can't freeze the widget.
 */
export const fetchNote = async (
  ref: NoteRef,
  token?: string,
  resolved?: { noteId?: string; teamPath?: string }
): Promise<FetchedNote> => {
  try {
    return await fetchPublic(ref);
  } catch (publicError) {
    // A server error from /download (not a plain "not public") is worth keeping.
    const publicSpecific =
      publicError instanceof HackMDError && publicError.message !== NOT_PUBLIC
        ? publicError
        : undefined;

    // Not public. With a token the note might still be readable via the API.
    if (token && !ref.published) {
      try {
        return await fetchViaApi(token, ref, resolved);
      } catch (apiError) {
        // A definite answer (invalid token, denied) beats the generic message.
        if (apiError instanceof HackMDError && apiError.fatal) throw apiError;
      }
    }

    throw (
      publicSpecific ?? new HackMDError(notPublicMessage(ref, Boolean(token)))
    );
  }
};

/** The message shown when a note can't be read without (working) API access. */
const notPublicMessage = (ref: NoteRef, hasToken: boolean): string => {
  const base = hasToken
    ? // A token is set but the API is unreachable from a widget today.
      "Couldn't load this note. It isn't public, and Figma widgets can't reach the HackMD API yet, so private notes aren't supported for now."
    : "Couldn't load this note. Make sure it's shared with \"Anyone with the link\" or published, or add an API token from the gear icon for private notes.";

  // A custom permalink URL has no reachable download route; the short link does.
  if (ref.owner) {
    return `${base} If you're using a custom permalink, try the note's short link (hackmd.io/@${ref.owner}/xxxxxxxx) instead.`;
  }
  return base;
};
