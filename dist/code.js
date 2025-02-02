(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
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

  // widget-src/parser/InlineParser.tsx
  var InlineParser = class {
    static cleanMarkdown(text) {
      return text.replace(/[`*]/g, "").trim();
    }
    static parseInline(text) {
      const segments = [];
      let currentText = "";
      let inBold = false;
      let inItalic = false;
      let inCode = false;
      let inHighlight = false;
      let inStrikethrough = false;
      let i = 0;
      while (i < text.length) {
        if (text[i] === "`" && !inBold && !inItalic) {
          if (currentText) {
            segments.push({
              text: currentText,
              style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough }
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
              text: currentText,
              style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough }
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
              text: currentText,
              style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough }
            });
            currentText = "";
          }
          inBold = !inBold;
          i += 2;
          continue;
        }
        if (text.startsWith("~~", i) && !inCode) {
          if (currentText) {
            segments.push({
              text: currentText,
              style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough }
            });
            currentText = "";
          }
          inStrikethrough = !inStrikethrough;
          i += 2;
          continue;
        }
        if (text[i] === "*" && !text.startsWith("**", i) && !inCode) {
          if (currentText) {
            segments.push({
              text: currentText,
              style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough }
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
          text: InlineParser.cleanMarkdown(currentText),
          style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight, strikethrough: inStrikethrough }
        });
      }
      return segments;
    }
  };

  // widget-src/parser/BlockParser.tsx
  var BlockParser = class {
    static parseBlock(markdown) {
      var _a, _b;
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
            content: InlineParser.cleanMarkdown(headingMatch[2]),
            level: headingMatch[1].length
          };
          continue;
        }
        const listMatch = line.match(/^[-*]\s+(.+)/);
        if (listMatch) {
          const segments = InlineParser.parseInline(listMatch[1]);
          if (!currentBlock || currentBlock.type !== "list") {
            if (currentBlock)
              blocks.push(currentBlock);
            currentBlock = {
              type: "list",
              content: "",
              items: [{ content: listMatch[1], segments }]
            };
          } else {
            (_a = currentBlock.items) == null ? void 0 : _a.push({ content: listMatch[1], segments });
          }
          continue;
        }
        if (line.trim()) {
          const segments = InlineParser.parseInline(line);
          if (!currentBlock || currentBlock.type !== "paragraph") {
            if (currentBlock)
              blocks.push(currentBlock);
            currentBlock = {
              type: "paragraph",
              content: InlineParser.cleanMarkdown(line),
              segments
            };
          } else {
            (_b = currentBlock.segments) == null ? void 0 : _b.push(...segments);
            currentBlock.content += " " + InlineParser.cleanMarkdown(line);
          }
          continue;
        }
      }
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      return blocks;
    }
  };

  // widget-src/constants/markdown.tsx
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

  // widget-src/utils/styles.ts
  var getTextStyle = (style) => {
    return {
      fontWeight: (style == null ? void 0 : style.bold) ? "bold" : "normal",
      fill: (style == null ? void 0 : style.href) ? "#0066CC" : (style == null ? void 0 : style.highlight) ? "#DFA424" : "#232323",
      italic: (style == null ? void 0 : style.italic) ? true : false,
      textDecoration: (style == null ? void 0 : style.href) ? "underline" : (style == null ? void 0 : style.strikethrough) ? "strikethrough" : "none",
      fontSize: MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE
    };
  };

  // widget-src/renderer/BlockRenderer.tsx
  var { widget } = figma;
  var { AutoLayout, Span, Text } = widget;
  var BlockRenderer = class {
    static renderBlock(block, index) {
      if (block.type === "list") {
        return this.renderList(block, index);
      }
      return this.renderText(block, index);
    }
    static renderList(block, index) {
      var _a;
      return /* @__PURE__ */ figma.widget.h(AutoLayout, {
        key: index,
        direction: "vertical",
        spacing: 12,
        padding: { top: 12, bottom: 12 }
      }, (_a = block.items) == null ? void 0 : _a.map((item, itemIndex) => {
        var _a2;
        return /* @__PURE__ */ figma.widget.h(AutoLayout, {
          key: itemIndex,
          direction: "horizontal",
          spacing: 3,
          verticalAlignItems: "center",
          width: "fill-parent",
          padding: { left: 6 }
        }, /* @__PURE__ */ figma.widget.h(Text, {
          fill: "#232323",
          width: 18
        }, item.ordered ? `${itemIndex + 1}.` : ""), /* @__PURE__ */ figma.widget.h(Text, {
          width: "fill-parent"
        }, (_a2 = item.segments) == null ? void 0 : _a2.map((segment, segIndex) => /* @__PURE__ */ figma.widget.h(Span, __spreadValues({
          key: segIndex
        }, getTextStyle(segment.style)), segment.text))));
      }));
    }
    static renderText(block, index) {
      var _a;
      return /* @__PURE__ */ figma.widget.h(Text, {
        key: index,
        fill: "#232323",
        fontSize: block.level ? 24 - block.level * 2 : 16,
        fontWeight: block.type === "heading" ? "bold" : "normal"
      }, (_a = block.segments) == null ? void 0 : _a.map((segment, segIndex) => /* @__PURE__ */ figma.widget.h(Span, __spreadValues({
        key: `${index}-${segIndex}`
      }, getTextStyle(segment.style)), segment.text)));
    }
  };

  // widget-src/MarkdownParser.tsx
  var MarkdownParser = class {
    static parseBlock(markdown) {
      return BlockParser.parseBlock(markdown);
    }
    static renderBlock(block, index) {
      return BlockRenderer.renderBlock(block, index);
    }
  };

  // widget-src/code.tsx
  var { widget: widget2 } = figma;
  var { AutoLayout: AutoLayout2, Input, Text: Text2, useSyncedState, usePropertyMenu } = widget2;
  function HackMDViewer() {
    const [url, setUrl] = useSyncedState("url", "");
    const [content, setContent] = useSyncedState("content", "");
    const [loading, setLoading] = useSyncedState("loading", false);
    const [error, setError] = useSyncedState("error", "");
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
        tooltip: "\u91CD\u65B0\u6574\u7406"
      }
    ], (_0) => __async(this, [_0], function* ({ propertyName }) {
      if (propertyName === "refresh") {
        yield fetchContent();
      }
    }));
    const renderContent = () => {
      if (loading) {
        return /* @__PURE__ */ figma.widget.h(AutoLayout2, null, /* @__PURE__ */ figma.widget.h(Text2, null, "\u8F09\u5165\u4E2D..."));
      }
      if (error) {
        return /* @__PURE__ */ figma.widget.h(AutoLayout2, null, /* @__PURE__ */ figma.widget.h(Text2, {
          fill: "#FF0000"
        }, error));
      }
      if (content) {
        const blocks = MarkdownParser.parseBlock(content);
        console.log("Parsed blocks:", blocks);
        return /* @__PURE__ */ figma.widget.h(AutoLayout2, {
          direction: "vertical"
        }, blocks.map((block, index) => MarkdownParser.renderBlock(block, index)));
      }
      return null;
    };
    return /* @__PURE__ */ figma.widget.h(AutoLayout2, {
      direction: "vertical",
      padding: CONTAINER_SIZE.PADDING,
      width: CONTAINER_SIZE.WIDTH,
      fill: "#F5F5F5",
      cornerRadius: 8,
      effect: {
        type: "drop-shadow",
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 2 },
        blur: 4
      },
      spacing: 8
    }, /* @__PURE__ */ figma.widget.h(AutoLayout2, {
      width: "fill-parent",
      fill: "#eee",
      padding: 10,
      cornerRadius: 4
    }, /* @__PURE__ */ figma.widget.h(Input, {
      value: url,
      placeholder: "\u8F38\u5165 HackMD \u9023\u7D50...",
      onTextEditEnd: (e) => {
        setUrl(e.characters);
        fetchContent();
      },
      width: "fill-parent"
    })), renderContent());
  }
  widget2.register(HackMDViewer);
})();
