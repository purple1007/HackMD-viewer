const { widget } = figma;
const { AutoLayout, Text, useSyncedState, usePropertyMenu, useWidgetNodeId } =
  widget;

import { MarkdownTreeRenderer } from "./MarkdownTreeRenderer";
import { MD_CONST } from "./constants/markdown";
import { fetchNote, HackMDError, parseHackMDUrl } from "./api/hackmd";

import { HackMDButton } from "./components/hackMDButton";
import { ContentLayout } from "./components/contentLayout";
import {
  EditIcon,
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
/** Gap between the current widget and a newly spawned sibling. */
const SPAWN_GAP = 48;

type SettingsView = "url" | "markdown";

const VIEW_TITLE: Record<SettingsView, string> = {
  url: "Load a HackMD note",
  markdown: "Paste Markdown",
};
const VIEW_HEIGHT: Record<SettingsView, number> = {
  url: 180,
  markdown: 280,
};

/** Opens the iframe and resolves once it posts a message back (or is closed). */
const showSettingsUI = (
  view: SettingsView,
  onMessage: (msg: any) => Promise<void>,
  // `value` pre-fills the markdown textarea (for editing); `title` overrides
  // the window title.
  opts?: { value?: string; title?: string }
) =>
  new Promise<void>((resolve) => {
    figma.showUI(__html__, {
      width: UI_WIDTH,
      height: VIEW_HEIGHT[view],
      title: opts?.title ?? VIEW_TITLE[view],
    });
    figma.ui.postMessage({ type: "init", view, value: opts?.value });
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
  const widgetId = useWidgetNodeId();
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

  const hasContent = Boolean(url || content);

  /**
   * Spawns a copy of this widget beside it, showing the given content, and
   * leaves the current widget untouched. Returns false if the node can't be
   * found (then the caller falls back to updating in place).
   */
  const spawnBeside = (overrides: { [key: string]: unknown }): boolean => {
    const self = (figma as unknown as FigmaSceneApi).getNodeById(widgetId);
    if (!self) return false;
    const clone = self.cloneWidget({
      loading: false,
      error: "",
      ...overrides,
    });
    clone.x = self.x + self.width + SPAWN_GAP;
    clone.y = self.y;
    return true;
  };

  const fetchHackMDContent = async (
    hackmdUrl: string,
    // The cached canonical ids only apply to a refresh of the same note; a
    // freshly pasted URL must resolve from scratch or it could reuse them.
    resolved?: { noteId?: string; teamPath?: string },
    // When the widget already shows something, a newly loaded note opens in a
    // sibling instead of replacing what's here. A refresh updates in place.
    beside = false
  ) => {
    try {
      setLoading(true);
      setError("");

      const ref = parseHackMDUrl(hackmdUrl);
      const note = await fetchNote(ref, undefined, resolved);
      const next = {
        url: hackmdUrl,
        content: note.content,
        title: note.title || "",
        noteId: note.noteId || "",
        teamPath: note.teamPath || "",
        lastSyncTime: new Date().toUTCString(),
      };

      if (beside && hasContent && spawnBeside(next)) return;

      setUrl(next.url);
      setContent(next.content);
      setTitle(next.title);
      setNoteId(next.noteId);
      setTeamPath(next.teamPath);
      setLastSyncTime(next.lastSyncTime);
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

  // Shows pasted markdown directly, with no HackMD source behind it. Opens in a
  // sibling when the widget already shows something.
  const showPastedMarkdown = (markdown: string) => {
    const next = {
      url: "",
      content: markdown,
      title: "",
      noteId: "",
      teamPath: "",
      lastSyncTime: "",
    };
    if (hasContent && spawnBeside(next)) return;
    setUrl(next.url);
    setContent(next.content);
    setTitle(next.title);
    setNoteId(next.noteId);
    setTeamPath(next.teamPath);
    setLastSyncTime(next.lastSyncTime);
    setError("");
  };

  // Loads a note by URL. Used by the empty-state card and the toolbar's link icon.
  const openUrlSettings = async () => {
    await showSettingsUI("url", async (msg) => {
      if (msg.type !== "url" || !msg.value) return;
      await fetchHackMDContent(msg.value, undefined, true);
    });
  };

  // Renders pasted markdown. Reached from the empty-state card and the toolbar.
  const openMarkdownSettings = async () => {
    await showSettingsUI("markdown", async (msg) => {
      if (msg.type === "markdown" && (msg.value || "").trim()) {
        showPastedMarkdown(msg.value);
      }
    });
  };

  // Edits the markdown already shown here, updating it in place (not a sibling).
  // The panel opens pre-filled with the current source.
  const openEditMarkdown = async () => {
    await showSettingsUI(
      "markdown",
      async (msg) => {
        if (msg.type === "markdown" && (msg.value || "").trim()) {
          setContent(msg.value);
          setError("");
        }
      },
      { value: content, title: "Edit Markdown" }
    );
  };

  // Pasted markdown: no source url, but there is content.
  const isMarkdown = !url && Boolean(content);

  usePropertyMenu(
    [
      // Refresh only makes sense for a URL-loaded note.
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
      // Edit is offered only when this widget shows pasted markdown.
      ...(isMarkdown
        ? [
            {
              itemType: "action" as const,
              propertyName: "edit-markdown",
              tooltip: "Edit Markdown",
              icon: EditIcon,
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
        // Refresh updates this widget in place (not a sibling).
        await fetchHackMDContent(
          url,
          { noteId: noteId || undefined, teamPath: teamPath || undefined },
          false
        );
      } else if (propertyName === "load-url") {
        await openUrlSettings();
      } else if (propertyName === "paste-markdown") {
        await openMarkdownSettings();
      } else if (propertyName === "edit-markdown") {
        await openEditMarkdown();
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
        <HackMDButton
          onLoadUrl={openUrlSettings}
          onPasteMarkdown={openMarkdownSettings}
        />
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
