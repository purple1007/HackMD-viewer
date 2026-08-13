/**
 * HackMD API v1 client — https://api.hackmd.io/v1/docs
 *
 * Widget-sandbox only: the sandbox's fetch returns a FetchResponse (headers
 * come back as a plain `headersObject`), not a DOM Response.
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
      return "HackMD API token 無效或已被撤銷，請重新設定。";
    case 403:
      return "這個 API token 沒有讀取這篇筆記的權限。";
    case 404:
      return "找不到這篇筆記，請確認網址是否正確。";
    case 429:
      return retryAfter
        ? `已達 HackMD API 速率限制，請於 ${retryAfter} 秒後再試。`
        : "已達 HackMD API 速率限制，請稍後再試。";
    default:
      return `HackMD API 回應錯誤（${status}）。`;
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

const apiGet = async (token: string, path: string) =>
  fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

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
        const note = notes.find((candidate) => matchesSlug(candidate, ref.slug));
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
      messageForStatus(direct.status, header(direct.headersObject, "Retry-After")),
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
      messageForStatus(response.status, header(response.headersObject, "Retry-After")),
      response.status === 403
    );
  }

  throw new HackMDError(messageForStatus(direct.status));
};

/** A 200 that is really the "note not found" page rather than markdown. */
const looksLikeHtml = (body: string) => /^\s*<(?:!doctype|html)\b/i.test(body);

/**
 * Fetches raw markdown without a token.
 *
 * `/download` is the cleanest source but 404s for `@owner/<permalink>` URLs, so
 * fall back to HackMD's content negotiation, which honours `Accept:
 * text/markdown` on any note URL.
 */
const fetchPublic = async (
  ref: NoteRef,
  hasToken: boolean
): Promise<FetchedNote> => {
  const urls = publicUrlsFor(ref);
  let lastStatus = 0;

  const attempts: { url: string; markdownAccept: boolean }[] = [
    ...urls.map((url) => ({ url: `${url}/download`, markdownAccept: false })),
    ...urls.map((url) => ({ url, markdownAccept: true })),
  ];

  for (const attempt of attempts) {
    const response = await fetch(`${attempt.url}?t=${Date.now()}`, {
      headers: attempt.markdownAccept
        ? { Accept: "text/markdown;q=1.0, text/html;q=0.1" }
        : undefined,
    });
    if (response.ok) {
      const body = await response.text();
      if (!looksLikeHtml(body)) {
        return { content: body, source: "public" };
      }
    }
    lastStatus = response.status;
  }

  if (lastStatus === 404) {
    throw new HackMDError("找不到這篇筆記，請確認網址是否正確。");
  }
  throw new HackMDError(
    hasToken
      ? "無法載入這篇筆記：API token 讀不到它，它也不是公開筆記。"
      : "無法載入這篇筆記。若它不是公開筆記，請在 widget 選單設定 HackMD API token。"
  );
};

/**
 * Loads a note's markdown.
 *
 * With a token the API is tried first, so any note the token can read renders —
 * the note does not have to be public. Without one (or if the API cannot serve
 * it) this falls back to the public download endpoint.
 */
export const fetchNote = async (
  ref: NoteRef,
  token?: string,
  resolved?: { noteId?: string; teamPath?: string }
): Promise<FetchedNote> => {
  let apiError: HackMDError | undefined;

  // Published /s/ links have no API id; go straight to the public endpoint.
  if (token && !ref.published) {
    try {
      return await fetchViaApi(token, ref, resolved);
    } catch (error) {
      // An invalid token or an outright denial is worth reporting rather than
      // silently downgrading to the public endpoint.
      if (error instanceof HackMDError && error.fatal) {
        throw error;
      }
      // Otherwise the note may still be publicly readable.
      if (error instanceof HackMDError) apiError = error;
    }
  }

  try {
    return await fetchPublic(ref, Boolean(token));
  } catch (error) {
    // The API's reason is more specific than "it isn't public either".
    throw apiError ?? error;
  }
};
