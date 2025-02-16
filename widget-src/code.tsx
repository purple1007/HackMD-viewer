const { widget } = figma;
const {
  AutoLayout,
  Input,
  Text,
  useSyncedState,
  usePropertyMenu,
  useEffect,
  useWidgetId,
} = widget;

import { MarkdownParser } from "./MarkdownParser";
import { CONTAINER_SIZE, MD_CONST } from "./constants/markdown";
import { getHackMDId } from "./utils/hackMDId";

import { HackMDButton } from "./components/hackMDButton";
import { ContentLayout } from "./components/contentLayout";

function HackMDViewer() {
  const [url, setUrl] = useSyncedState("url", "");
  const [content, setContent] = useSyncedState("content", "");
  const [loading, setLoading] = useSyncedState("loading", false);
  const [error, setError] = useSyncedState("error", "");
  const [lastSyncTime, setLastSyncTime] = useSyncedState("lastSyncTime", "");

  const fetchHackMDContent = async (hackmdUrl: string, noteId?: string) => {
    try {
      const requestTime = new Date().toUTCString();
      setLastSyncTime(requestTime);
      setLoading(true);
      setError("");

      // 如果沒有傳入 noteId，則從 URL 解析
      const usedNoteId = noteId || getHackMDId(hackmdUrl);
      const publicResponse = await fetch(
        `https://hackmd.io/${usedNoteId}/download?t=${new Date().getTime()}`
      );
      if (!publicResponse.ok) {
        throw new Error("無法載入文件");
      }

      const content = await publicResponse.text();
      await setContent(content);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "無法讀取文件，請確認網址連結或瀏覽權限");
    } finally {
      setLoading(false);
    }
  };

  if (!url === false) {
    usePropertyMenu(
      [
        {
          itemType: "action",
          propertyName: "refresh",
          tooltip: "重新整理",
        },
      ],
      async ({ propertyName }: { propertyName: string }) => {
        if (propertyName === "refresh" && url) {
          await fetchHackMDContent(url);
        }
      }
    );
  }

  const renderContent = () => {
    if (loading) {
      return <Text>載入中...</Text>;
    }

    if (error) {
      return <Text fill={MD_CONST.COLOR.ERROR}>{error}</Text>;
    }

    if (content) {
      return MarkdownParser.renderMarkdownAsTree(content);

      const blocks = MarkdownParser.parseBlock(content);
      console.log("URL:", url);
      console.log("Parsed blocks:", blocks);
      return (
        <AutoLayout direction="vertical" width="fill-parent">
          {blocks.map((block, index) =>
            MarkdownParser.renderBlock(block, index)
          )}
        </AutoLayout>
      );
    }
    return null;
  };

  return (
    <AutoLayout direction="vertical" width="hug-contents">
      {/* 顯示按鈕 */}
      {!url ? (
        <HackMDButton
          onSuccess={async (url, noteId) => {
            await setUrl(url);
            await fetchHackMDContent(url, noteId);
          }}
        />
      ) : (
        <ContentLayout lastSyncTime={lastSyncTime} url={url}>
          {renderContent()}
        </ContentLayout>
      )}
    </AutoLayout>
  );
}

widget.register(HackMDViewer);
