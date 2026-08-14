const { widget } = figma;
const { AutoLayout, Text, useSyncedState, usePropertyMenu } = widget;

import { MarkdownTreeRenderer } from "./MarkdownTreeRenderer";
import { MD_CONST } from "./constants/markdown";
import { fetchNote, HackMDError, parseHackMDUrl } from "./api/hackmd";
import { clearToken, getToken, setToken } from "./utils/token";

import { HackMDButton } from "./components/hackMDButton";
import { ContentLayout } from "./components/contentLayout";
import {
  GearIcon,
  MarkdownIcon,
  RefreshIcon,
  UrlLinkIcon,
} from "./components/icons";

/** Widget width choices offered in the toolbar (value in px, as a string). */
const WIDTH_OPTIONS = [
  { option: "600", label: "600px" },
  { option: "860", label: "860px" },
  { option: "960", label: "960px" },
];

const UI_WIDTH = 320;

/** Opens the iframe and resolves once it posts a message back (or is closed). */
type SettingsView = "url" | "token" | "markdown";

const VIEW_TITLE: Record<SettingsView, string> = {
  url: "Load a HackMD note",
  token: "HackMD API token",
  markdown: "Paste Markdown",
};
const VIEW_HEIGHT: Record<SettingsView, number> = {
  url: 180,
  token: 240,
  markdown: 280,
};

const showSettingsUI = (
  view: SettingsView,
  hasToken: boolean,
  onMessage: (msg: any) => Promise<void>
) =>
  new Promise<void>((resolve) => {
    figma.showUI(__html__, {
      width: UI_WIDTH,
      height: VIEW_HEIGHT[view],
      title: VIEW_TITLE[view],
    });
    figma.ui.postMessage({ type: "init", view, hasToken });
    figma.ui.onmessage = async (msg) => {
      // The iframe reports its content height so we can trim dead space.
      if (msg.type === "resize" && typeof msg.height === "number") {
        figma.ui.resize(UI_WIDTH, Math.max(120, Math.min(600, msg.height)));
        return;
      }
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
  // Widget width in px, chosen from the toolbar dropdown.
  const [width, setWidth] = useSyncedState("width", "600");

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
          : "Couldn't load the note. Check the URL or your access permissions."
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

  // Shows pasted markdown directly, with no HackMD source behind it.
  const showPastedMarkdown = (markdown: string) => {
    setUrl("");
    setNoteId("");
    setTeamPath("");
    setTitle("");
    setError("");
    setLastSyncTime("");
    setContent(markdown);
  };

  // Loads a note by URL. Used by the empty-state card and the toolbar's link icon.
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

  // Renders pasted markdown. Reached from the toolbar's markdown icon.
  const openMarkdownSettings = async () => {
    const hasToken = Boolean(await getToken());
    await showSettingsUI("markdown", hasToken, async (msg) => {
      if (msg.type === "markdown" && (msg.value || "").trim()) {
        showPastedMarkdown(msg.value);
      }
    });
  };

  usePropertyMenu(
    [
      {
        itemType: "action" as const,
        propertyName: "token",
        tooltip: "API token",
        icon: GearIcon,
      },
      ...(url
        ? [
            {
              itemType: "action" as const,
              propertyName: "refresh",
              tooltip: "Refresh",
              icon: RefreshIcon,
            },
          ]
        : []),
      {
        itemType: "action" as const,
        propertyName: "load-url",
        tooltip: "Load HackMD note",
        icon: UrlLinkIcon,
      },
      {
        itemType: "action" as const,
        propertyName: "paste-markdown",
        tooltip: "Paste Markdown",
        icon: MarkdownIcon,
      },
      { itemType: "separator" as const },
      {
        itemType: "dropdown" as const,
        propertyName: "width",
        tooltip: "Width",
        selectedOption: width,
        options: WIDTH_OPTIONS,
      },
    ],
    async ({
      propertyName,
      propertyValue,
    }: {
      propertyName: string;
      propertyValue?: string;
    }) => {
      if (propertyName === "refresh" && url) {
        await fetchHackMDContent(url, {
          noteId: noteId || undefined,
          teamPath: teamPath || undefined,
        });
      } else if (propertyName === "token") {
        await openTokenSettings();
      } else if (propertyName === "load-url") {
        await openUrlSettings();
      } else if (propertyName === "paste-markdown") {
        await openMarkdownSettings();
      } else if (propertyName === "width" && propertyValue) {
        setWidth(propertyValue);
      }
    }
  );

  const renderContent = () => {
    if (loading) {
      return <Text>Loading…</Text>;
    }

    if (error) {
      return <Text fill={MD_CONST.COLOR.ERROR}>{error}</Text>;
    }

    if (content) {
      return MarkdownTreeRenderer.renderMarkdownAsTree(content);
    }

    return null;
  };

  // Empty only when there's neither a loaded note (url) nor pasted markdown.
  const isEmpty = !url && !content;

  return (
    <AutoLayout direction="vertical" width="hug-contents">
      {isEmpty ? (
        <HackMDButton onClick={openUrlSettings} />
      ) : (
        <ContentLayout
          lastSyncTime={lastSyncTime}
          url={url}
          title={title}
          width={Number(width)}
        >
          {renderContent()}
        </ContentLayout>
      )}
    </AutoLayout>
  );
}

widget.register(HackMDViewer);
