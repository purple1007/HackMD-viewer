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

const CORS_BLOCKED =
  "無法從 Figma widget 呼叫 HackMD API：api.hackmd.io 沒有回傳 " +
  "Access-Control-Allow-Origin，瀏覽器會擋掉這個跨來源請求。" +
  "目前只有公開筆記可以顯示。";

const apiGet = async (token: string, path: string) => {
  try {
    return await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    // The Authorization header forces a preflight, which api.hackmd.io answers
    // without CORS headers, so the request never leaves the sandbox.
    throw new HackMDError(CORS_BLOCKED);
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

/**
 * Fetches raw markdown without a token.
 *
 * Only `/download` is reachable: it is the one HackMD route that sends
 * `Access-Control-Allow-Origin: *`. The `Accept: text/markdown` negotiation
 * works server-side but its response carries no ACAO, so a widget cannot read
 * it — don't waste a request on it.
 */
const fetchPublic = async (
  ref: NoteRef,
  hasToken: boolean
): Promise<FetchedNote> => {
  let lastStatus = 0;
  let blocked = false;

  for (const url of publicUrlsFor(ref)) {
    let response;
    try {
      response = await fetch(`${url}/download?t=${Date.now()}`);
    } catch (error) {
      // A private note's 403 carries no CORS headers, so the browser rejects the
      // response and fetch rejects rather than resolving with a status.
      blocked = true;
      continue;
    }
    if (response.ok) {
      const body = await response.text();
      if (!looksLikeHtml(body)) {
        return { content: body, source: "public" };
      }
    }
    lastStatus = response.status;
  }

  if (lastStatus && lastStatus !== 403 && lastStatus !== 404) {
    throw new HackMDError(`無法載入這篇筆記（${lastStatus}）。`);
  }

  // A 403 and a 404 both come back without CORS headers, so the browser hides
  // the status from us and both surface as a rejected fetch. Name both causes
  // rather than guessing at one.
  const causes = ["這篇筆記不是公開的"];
  if (ref.owner) {
    causes.push(
      "或是網址用了自訂 permalink（/@" +
        ref.owner +
        "/my-note），請改用筆記的短網址（/@" +
        ref.owner +
        "/xxxxxxxx）"
    );
  }
  throw new HackMDError(
    `無法載入這篇筆記：${causes.join("，")}。` +
      (hasToken
        ? "已設定 API token，但 Figma widget 無法呼叫 api.hackmd.io（該網域未回傳 CORS 標頭），所以目前讀不到私人筆記。"
        : "請把瀏覽權限改成「知道連結的人可讀」、發布這篇筆記，或改用短網址。")
  );
};

/**
 * Loads a note's markdown.
 *
 * The API is tried first when a token is set, so that any note the token can
 * read renders as soon as api.hackmd.io is reachable from a widget (see the CORS
 * note at the top of this file). Until then every call falls through to the
 * public download endpoint, the only CORS-enabled route.
 */
export const fetchNote = async (
  ref: NoteRef,
  token?: string,
  resolved?: { noteId?: string; teamPath?: string }
): Promise<FetchedNote> => {
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
      // Otherwise the note may still be publicly readable. fetchPublic's
      // messages already account for a token being present.
    }
  }

  return fetchPublic(ref, Boolean(token));
};
