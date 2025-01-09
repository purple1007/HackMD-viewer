(() => {
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // widget-src/MarkdownParser.tsx
  var { widget } = figma;
  var { Span, Text } = widget;
  var MARKDOWN_CONSTANTS = {
    HEADING_SIZES: {
      1: 32,
      2: 24,
      3: 18,
      4: 16,
      5: 14,
      6: 12
    },
    REGULAR_FONT_SIZE: 16
  };
  var CONTAINER_SIZE = {
    WIDTH: 600,
    PADDING: 16
  };
  var MarkdownParser = class {
    static parseInline(text) {
      const segments = [];
      let currentText = "";
      let inBold = false;
      let inItalic = false;
      let inCode = false;
      let inHighlight = false;
      let i = 0;
      while (i < text.length) {
        if (text[i] === "`" && !inBold && !inItalic) {
          if (currentText) {
            segments.push({
              text: currentText.replace(/[`*]/g, ""),
              style: { bold: inBold, italic: inItalic, highlight: inHighlight }
            });
            currentText = "";
          }
          inCode = !inCode;
          i++;
          continue;
        }
        if (text.startsWith("==", i)) {
          if (currentText) {
            segments.push({
              text: currentText.replace(/==/g, ""),
              style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight }
            });
            currentText = "";
          }
          inHighlight = !inHighlight;
          i += 2;
          continue;
        }
        if (text.startsWith("**", i) && !inCode) {
          if (currentText) {
            segments.push({
              text: currentText.replace(/[`*]/g, ""),
              style: { bold: inBold, italic: inItalic, highlight: inHighlight }
            });
            currentText = "";
          }
          inBold = !inBold;
          i += 2;
          continue;
        }
        if (text[i] === "*" && !text.startsWith("**", i) && !inCode) {
          if (currentText) {
            segments.push({
              text: currentText.replace(/[`*]/g, ""),
              style: { bold: inBold, italic: inItalic, highlight: inHighlight }
            });
            currentText = "";
          }
          inItalic = !inItalic;
          i++;
          continue;
        }
        currentText += text[i];
        i++;
      }
      if (currentText) {
        segments.push({
          text: currentText.replace(/==/g, "").replace(/[`*]/g, ""),
          style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight }
        });
      }
      return segments;
    }
    static cleanMarkdown(text) {
      return text.replace(/[`*]/g, "").trim();
    }
    static parseBlock(markdown) {
      const blocks = [];
      const lines = markdown.split("\n");
      let currentBlock = null;
      for (const line of lines) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
          if (currentBlock)
            blocks.push(currentBlock);
          currentBlock = {
            type: "heading",
            content: this.cleanMarkdown(headingMatch[2]),
            level: headingMatch[1].length
          };
          continue;
        }
        const listMatch = line.match(/^[-*]\s+(.+)/);
        if (listMatch) {
          if ((currentBlock == null ? void 0 : currentBlock.type) !== "list") {
            if (currentBlock)
              blocks.push(currentBlock);
            currentBlock = {
              type: "list",
              content: this.cleanMarkdown(listMatch[1])
            };
          } else {
            currentBlock.content += "\n" + listMatch[1];
          }
          continue;
        }
        const codeMatch = line.match(/^```(.+)/);
        if (codeMatch) {
          if (currentBlock)
            blocks.push(currentBlock);
          currentBlock = {
            type: "code",
            content: codeMatch[1]
          };
          continue;
        }
        if (line.trim()) {
          const segments = this.parseInline(line);
          if ((currentBlock == null ? void 0 : currentBlock.type) !== "paragraph") {
            if (currentBlock)
              blocks.push(currentBlock);
            currentBlock = {
              type: "paragraph",
              content: this.cleanMarkdown(line),
              segments
            };
          } else {
            currentBlock.segments = [
              ...currentBlock.segments || [],
              ...segments
            ];
            currentBlock.content += " " + this.cleanMarkdown(line);
          }
          continue;
        }
      }
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      return blocks;
    }
    static renderBlock(block, index) {
      return /* @__PURE__ */ figma.widget.h(Text, {
        key: index,
        width: CONTAINER_SIZE.WIDTH - CONTAINER_SIZE.PADDING * 2,
        fontSize: block.type === "heading" ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level] : MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE,
        fontWeight: block.type === "heading" ? "extra-bold" : "normal",
        horizontalAlignText: "left",
        lineHeight: block.type === "heading" ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level] * 1.6 : 28
      }, block.segments ? block.segments.map((segment, segIndex) => {
        var _a, _b, _c;
        return /* @__PURE__ */ figma.widget.h(Span, {
          key: `${index}-${segIndex}`,
          fontWeight: ((_a = segment.style) == null ? void 0 : _a.bold) ? "bold" : "normal",
          fill: ((_b = segment.style) == null ? void 0 : _b.highlight) ? "#FF0000" : "#000000",
          fontSize: ((_c = segment.style) == null ? void 0 : _c.highlight) ? 40 : 16
        }, segment.text);
      }) : block.content);
    }
  };

  // widget-src/code.tsx
  var { widget: widget2 } = figma;
  var { AutoLayout, Span: Span2, Text: Text2, Input, useSyncedState, usePropertyMenu } = widget2;
  var refreshIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.65 2.35a8 8 0 1 0 1.4 1.4L13.65 2.35z" fill="currentColor"/></svg>`;
  var keyIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.33a4.67 4.67 0 0 1 4.67 4.67A4.67 4.67 0 0 1 8 10.67 4.67 4.67 0 0 1 3.33 6 4.67 4.67 0 0 1 8 1.33z" fill="currentColor"/></svg>`;
  function HackMDViewer() {
    const [url, setUrl] = useSyncedState("url", "");
    const [content, setContent] = useSyncedState("content", "");
    const [loading, setLoading] = useSyncedState("loading", false);
    const [error, setError] = useSyncedState("error", "");
    const [apiKey, setApiKey] = useSyncedState("apiKey", "");
    const getHackMDId = (urlString) => {
      const urlPattern = /hackmd\.io\/(?:@[^/]+\/)?([^/]+)/;
      const match = urlString.match(urlPattern);
      if (!match || !match[1]) {
        throw new Error("\u4E0D\u662F\u6709\u6548\u7684 HackMD \u9023\u7D50");
      }
      return match[1];
    };
    const fetchContent = () => __async(this, null, function* () {
      if (!url) {
        setError("\u8ACB\u8F38\u5165 HackMD \u9023\u7D50");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const noteId = getHackMDId(url);
        if (apiKey) {
          try {
            const response = yield fetch(`https://api.hackmd.io/v1/notes/${noteId}?t=${new Date().getTime()}`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              }
            });
            if (!response.ok) {
              throw new Error(`API \u932F\u8AA4: ${response.status}`);
            }
            const data = yield response.json();
            setContent(data.content);
            return;
          } catch (err) {
            console.error("API request failed:", err);
          }
        }
        const publicResponse = yield fetch(`https://hackmd.io/${noteId}/download?t=${new Date().getTime()}`);
        if (!publicResponse.ok) {
          throw new Error("\u7121\u6CD5\u8F09\u5165\u6587\u4EF6");
        }
        const content2 = yield publicResponse.text();
        setContent(content2);
      } catch (err) {
        const error2 = err;
        setError(error2.message || "\u7121\u6CD5\u8B80\u53D6\u6587\u4EF6\uFF0C\u8ACB\u78BA\u8A8D\u6587\u4EF6\u6B0A\u9650\u6216 API Key \u8A2D\u5B9A");
      } finally {
        setLoading(false);
      }
    });
    usePropertyMenu([
      {
        itemType: "action",
        propertyName: "refresh",
        tooltip: "\u91CD\u65B0\u6574\u7406",
        icon: refreshIcon
      },
      {
        itemType: "separator"
      },
      {
        itemType: "action",
        propertyName: "setApiKey",
        tooltip: "\u8A2D\u5B9A API Key",
        icon: keyIcon
      }
    ], (_0) => __async(this, [_0], function* ({ propertyName }) {
      if (propertyName === "refresh") {
        yield fetchContent();
      } else if (propertyName === "setApiKey") {
        figma.showUI(__html__, { width: 320, height: 160 });
        figma.ui.onmessage = (message) => {
          if (message.type === "setApiKey" && message.apiKey) {
            setApiKey(message.apiKey);
            figma.closePlugin();
          }
        };
      }
    }));
    const renderContent = () => {
      if (loading) {
        return /* @__PURE__ */ figma.widget.h(AutoLayout, null, /* @__PURE__ */ figma.widget.h(Text2, null, "\u8F09\u5165\u4E2D..."));
      }
      if (error) {
        return /* @__PURE__ */ figma.widget.h(AutoLayout, null, /* @__PURE__ */ figma.widget.h(Text2, {
          fill: "#FF0000"
        }, error));
      }
      if (content) {
        const blocks = MarkdownParser.parseBlock(content);
        console.log("Parsed blocks:", blocks);
        return /* @__PURE__ */ figma.widget.h(AutoLayout, {
          direction: "vertical",
          fill: "#ffffff"
        }, blocks.map((block, index) => MarkdownParser.renderBlock(block, index)));
      }
      return null;
    };
    return /* @__PURE__ */ figma.widget.h(AutoLayout, {
      direction: "vertical",
      padding: CONTAINER_SIZE.PADDING,
      width: CONTAINER_SIZE.WIDTH,
      fill: "#FFFFFF",
      cornerRadius: 8,
      effect: {
        type: "drop-shadow",
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 2 },
        blur: 4
      },
      spacing: 8
    }, /* @__PURE__ */ figma.widget.h(AutoLayout, {
      width: "fill-parent"
    }, /* @__PURE__ */ figma.widget.h(Input, {
      value: url,
      placeholder: "\u8F38\u5165 HackMD \u9023\u7D50...",
      onTextEditEnd: (e) => {
        setUrl(e.characters);
        fetchContent();
      },
      width: "fill-parent"
    })), renderContent(), !apiKey && /* @__PURE__ */ figma.widget.h(AutoLayout, null, /* @__PURE__ */ figma.widget.h(Text2, {
      fill: "#FF6B00"
    }, "\u63D0\u793A\uFF1A\u8A2D\u5B9A API Key \u53EF\u4EE5\u5B58\u53D6\u79C1\u4EBA\u6587\u4EF6")));
  }
  widget2.register(HackMDViewer);
})();
