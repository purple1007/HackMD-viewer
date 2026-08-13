const { widget } = figma;
const { AutoLayout, Text, useSyncedState, usePropertyMenu } = widget;

import { MarkdownTreeRenderer } from "./MarkdownTreeRenderer";
import { MD_CONST } from "./constants/markdown";
import { fetchNote, HackMDError, parseHackMDUrl } from "./api/hackmd";
import { clearToken, getToken, setToken } from "./utils/token";

import { HackMDButton } from "./components/hackMDButton";
import { ContentLayout } from "./components/contentLayout";
import { GearIcon, NewNoteIcon, RefreshIcon } from "./components/icons";

/** Opens the iframe and resolves once it posts a message back (or is closed). */
const showSettingsUI = (
  view: "url" | "token",
  hasToken: boolean,
  onMessage: (msg: any) => Promise<void>
) =>
  new Promise<void>((resolve) => {
    figma.showUI(__html__, {
      width: 320,
      height: view === "token" ? 280 : 220,
      title: view === "token" ? "HackMD API token" : "HackMD URL setting",
    });
    figma.ui.postMessage({ type: "init", view, hasToken });
    figma.ui.onmessage = async (msg) => {
      await onMessage(msg);
      resolve();
    };
  });

function HackMDViewer() {
  const [url, setUrl] = useSyncedState("url", "");
  const [content, setContent] = useSyncedState("content", "");
  const [title, setTitle] = useSyncedState("title", "");
  const [loading, setLoading] = useSyncedState("loading", false);
  const [error, setError] = useSyncedState("error", "");
  const [lastSyncTime, setLastSyncTime] = useSyncedState("lastSyncTime", "");
  // Canonical ids from a previous API lookup, so a refresh is a single request.
  const [noteId, setNoteId] = useSyncedState<string>("noteId", "");
  const [teamPath, setTeamPath] = useSyncedState<string>("teamPath", "");

  const fetchHackMDContent = async (
    hackmdUrl: string,
    // The cached canonical ids only apply to a refresh of the same note; a
    // freshly pasted URL must resolve from scratch or it could reuse them.
    resolved?: { noteId?: string; teamPath?: string }
  ) => {
    try {
      setLoading(true);
      setError("");

      const ref = parseHackMDUrl(hackmdUrl);
      // The token is per-user and only readable from an async context.
      const token = await getToken();
      const note = await fetchNote(ref, token, resolved);

      setContent(note.content);
      setTitle(note.title || "");
      setNoteId(note.noteId || "");
      setTeamPath(note.teamPath || "");
      setLastSyncTime(new Date().toUTCString());
    } catch (err) {
      // Anything that isn't a HackMDError is a raw sandbox failure (a rejected
      // fetch reads as "Failed to fetch"), which tells the reader nothing.
      setError(
        err instanceof HackMDError
          ? err.message
          : "無法讀取文件，請確認網址連結或瀏覽權限。"
      );
    } finally {
      setLoading(false);
    }
  };

  const openTokenSettings = async () => {
    const hasToken = Boolean(await getToken());
    await showSettingsUI("token", hasToken, async (msg) => {
      if (msg.type === "token" && msg.value) {
        await setToken(msg.value);
      } else if (msg.type === "clear-token") {
        await clearToken();
      } else {
        return;
      }
      // Re-fetch with the current note using the cached ids.
      if (url) {
        await fetchHackMDContent(url, {
          noteId: noteId || undefined,
          teamPath: teamPath || undefined,
        });
      }
    });
  };

  // Opens the URL panel to load a note. Used both by the empty-state card and by
  // the toolbar. A new URL is a fresh note, so the cached ids are dropped.
  const openUrlSettings = async () => {
    const hasToken = Boolean(await getToken());
    await showSettingsUI("url", hasToken, async (msg) => {
      if (msg.type !== "url" || !msg.value) return;
      // Persist the token first: fetchHackMDContent reads it back.
      if (msg.token) await setToken(msg.token);
      setUrl(msg.value);
      setNoteId("");
      setTeamPath("");
      await fetchHackMDContent(msg.value);
    });
  };

  usePropertyMenu(
    [
      {
        itemType: "action" as const,
        propertyName: "token",
        tooltip: "設定 HackMD API token",
        icon: GearIcon,
      },
      ...(url
        ? [
            {
              itemType: "action" as const,
              propertyName: "refresh",
              tooltip: "重新整理",
              icon: RefreshIcon,
            },
          ]
        : []),
      {
        itemType: "action" as const,
        propertyName: "open-url",
        tooltip: "載入其他筆記",
        icon: NewNoteIcon,
      },
    ],
    async ({ propertyName }: { propertyName: string }) => {
      if (propertyName === "refresh" && url) {
        await fetchHackMDContent(url, {
          noteId: noteId || undefined,
          teamPath: teamPath || undefined,
        });
      } else if (propertyName === "token") {
        await openTokenSettings();
      } else if (propertyName === "open-url") {
        await openUrlSettings();
      }
    }
  );

  const renderContent = () => {
    if (loading) {
      return <Text>載入中...</Text>;
    }

    if (error) {
      return <Text fill={MD_CONST.COLOR.ERROR}>{error}</Text>;
    }

    if (content) {
      return MarkdownTreeRenderer.renderMarkdownAsTree(content);
    }

    return null;
  };

  return (
    <AutoLayout direction="vertical" width="hug-contents">
      {/* 顯示按鈕 */}
      {!url ? (
        <HackMDButton onClick={openUrlSettings} />
      ) : (
        <ContentLayout lastSyncTime={lastSyncTime} url={url} title={title}>
          {renderContent()}
        </ContentLayout>
      )}
    </AutoLayout>
  );
}

widget.register(HackMDViewer);
