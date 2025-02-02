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
      let inUrl = false;
      let urlText = "";
      let url = "";
      let i = 0;
      while (i < text.length) {
        if (text[i] === "[" && !inCode && !inBold && !inItalic && !inHighlight && !inStrikethrough) {
          if (currentText.trim()) {
            segments.push({
              text: currentText,
              style: {
                bold: inBold,
                italic: inItalic,
                highlight: inHighlight,
                strikethrough: inStrikethrough
              }
            });
          }
          currentText = "";
          inUrl = true;
          i++;
          continue;
        }
        if (text[i] === "]" && inUrl) {
          urlText = currentText;
          currentText = "";
          i++;
          if (text[i] === "(" && i < text.length) {
            i++;
            while (i < text.length && text[i] !== ")") {
              url += text[i];
              i++;
            }
            if (text[i] === ")" && urlText.trim()) {
              segments.push({
                text: urlText,
                style: {
                  bold: inBold,
                  italic: inItalic,
                  highlight: inHighlight,
                  strikethrough: inStrikethrough,
                  href: url
                }
              });
              inUrl = false;
              urlText = "";
              url = "";
              i++;
              continue;
            }
          }
        }
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
      if (currentText.trim()) {
        segments.push({
          text: currentText,
          style: {
            bold: inBold,
            italic: inItalic,
            highlight: inHighlight,
            strikethrough: inStrikethrough
          }
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
        const orderedListRegex = /^(\d+)\.\s+(.+)/;
        const uncheckedRegex = /^(?:[*-]\s*)?\[\s\]\s*(.*)$/;
        const checkedRegex = /^(?:[*-]\s*)?\[x\]\s*(.*)$/i;
        const listRegex = /^[-*]\s+(.+)/;
        const orderedListMatch = line.match(orderedListRegex);
        const uncheckedMatch = line.match(uncheckedRegex);
        const checkedMatch = line.match(checkedRegex);
        const listMatch = line.match(listRegex);
        if (uncheckedMatch || checkedMatch || listMatch || orderedListMatch) {
          const match = orderedListMatch || checkedMatch || uncheckedMatch || listMatch;
          if (!match)
            continue;
          const content = orderedListMatch ? match[2] : match[1];
          const segments = InlineParser.parseInline(content);
          const listItem = {
            content: InlineParser.cleanMarkdown(content),
            segments,
            checkable: Boolean(checkedMatch || uncheckedMatch),
            checked: Boolean(checkedMatch),
            ordered: Boolean(orderedListMatch),
            number: orderedListMatch ? parseInt(match[1]) : void 0
          };
          if (!currentBlock || currentBlock.type !== "list") {
            if (currentBlock)
              blocks.push(currentBlock);
            currentBlock = {
              type: "list",
              content: "",
              items: [listItem]
            };
          } else {
            (_a = currentBlock.items) == null ? void 0 : _a.push(listItem);
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
      return /* @__PURE__ */ figma.widget.h(Text, {
        key: index,
        width: CONTAINER_SIZE.WIDTH - CONTAINER_SIZE.PADDING * 2,
        fill: "#232323",
        fontSize: block.type === "heading" ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level] : MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE,
        fontWeight: block.type === "heading" ? "extra-bold" : "normal",
        lineHeight: block.type === "heading" ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level] * 1.6 : 28
      }, block.segments ? block.segments.map((segment, segIndex) => /* @__PURE__ */ figma.widget.h(Span, __spreadValues({
        key: `${index}-${segIndex}`
      }, getTextStyle(segment.style)), segment.text)) : block.content);
    }
  };

  // widget-src/components/icons.tsx
  var UnCheckIcon = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 5C3 3.89543 3.89543 3 5 3H17C18.1046 3 19 3.89543 19 5V17C19 18.1046 18.1046 19 17 19H5C3.89543 19 3 18.1046 3 17V5Z" fill="#564DFF"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M15.6553 7.84467C15.9482 8.13756 15.9482 8.61244 15.6553 8.90533L10.4053 14.1553C10.1124 14.4482 9.63756 14.4482 9.34467 14.1553L6.71967 11.5303C6.42678 11.2374 6.42678 10.7626 6.71967 10.4697C7.01256 10.1768 7.48744 10.1768 7.78033 10.4697L9.875 12.5643L14.5947 7.84467C14.8876 7.55178 15.3624 7.55178 15.6553 7.84467Z" fill="white"/>
</svg>`;
  var CheckIcon = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 3.5H17C17.8284 3.5 18.5 4.17157 18.5 5V17C18.5 17.8284 17.8284 18.5 17 18.5H5C4.17157 18.5 3.5 17.8284 3.5 17V5C3.5 4.17157 4.17157 3.5 5 3.5Z" fill="#FDFDFD"/>
<path d="M5 3.5H17C17.8284 3.5 18.5 4.17157 18.5 5V17C18.5 17.8284 17.8284 18.5 17 18.5H5C4.17157 18.5 3.5 17.8284 3.5 17V5C3.5 4.17157 4.17157 3.5 5 3.5Z" stroke="#D4D4D8"/>
</svg>
`;
  var Dot = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="7" cy="7" r="3" fill="#232323"/>
</svg>
`;

  // widget-src/renderer/ListRenderer.tsx
  var { widget: widget2 } = figma;
  var { AutoLayout: AutoLayout2, Span: Span2, Text: Text2, SVG } = widget2;
  var ListRenderer = class {
    static renderList(block, index) {
      var _a;
      return /* @__PURE__ */ figma.widget.h(AutoLayout2, {
        key: index,
        direction: "vertical",
        width: CONTAINER_SIZE.WIDTH - CONTAINER_SIZE.PADDING * 2,
        spacing: 12,
        padding: { top: 12, bottom: 12 }
      }, (_a = block.items) == null ? void 0 : _a.map((item, itemIndex) => {
        var _a2;
        return /* @__PURE__ */ figma.widget.h(AutoLayout2, {
          key: itemIndex,
          direction: "horizontal",
          spacing: 3,
          verticalAlignItems: "center",
          width: "fill-parent",
          padding: { left: 6 }
        }, item.ordered ? /* @__PURE__ */ figma.widget.h(Text2, {
          fill: "#232323",
          width: 18
        }, itemIndex + 1, ".") : item.checkable ? /* @__PURE__ */ figma.widget.h(SVG, {
          src: item.checked ? CheckIcon : UnCheckIcon
        }) : /* @__PURE__ */ figma.widget.h(SVG, {
          src: Dot
        }), /* @__PURE__ */ figma.widget.h(Text2, {
          width: "fill-parent"
        }, (_a2 = item.segments) == null ? void 0 : _a2.map((segment, segIndex) => /* @__PURE__ */ figma.widget.h(Span2, __spreadValues({
          key: segIndex
        }, this.getTextStyle(segment.style)), segment.text))));
      }));
    }
    static getTextStyle(style) {
      return {
        fontWeight: (style == null ? void 0 : style.bold) ? "bold" : "normal",
        fill: (style == null ? void 0 : style.href) ? "#0066CC" : "#232323",
        italic: (style == null ? void 0 : style.italic) ? true : false,
        textDecoration: (style == null ? void 0 : style.href) ? "underline" : (style == null ? void 0 : style.strikethrough) ? "strikethrough" : "none"
      };
    }
  };

  // widget-src/MarkdownParser.tsx
  var MarkdownParser = class {
    static parseBlock(markdown) {
      return BlockParser.parseBlock(markdown);
    }
    static renderBlock(block, index) {
      if (block.type === "list") {
        return ListRenderer.renderList(block, index);
      }
      return BlockRenderer.renderBlock(block, index);
    }
  };

  // widget-src/code.tsx
  var { widget: widget3 } = figma;
  var { AutoLayout: AutoLayout3, Input, Text: Text3, useSyncedState, usePropertyMenu } = widget3;
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
        return /* @__PURE__ */ figma.widget.h(AutoLayout3, null, /* @__PURE__ */ figma.widget.h(Text3, null, "\u8F09\u5165\u4E2D..."));
      }
      if (error) {
        return /* @__PURE__ */ figma.widget.h(AutoLayout3, null, /* @__PURE__ */ figma.widget.h(Text3, {
          fill: "#FF0000"
        }, error));
      }
      if (content) {
        const blocks = MarkdownParser.parseBlock(content);
        return /* @__PURE__ */ figma.widget.h(AutoLayout3, {
          direction: "vertical"
        }, blocks.map((block, index) => MarkdownParser.renderBlock(block, index)));
      }
      return null;
    };
    return /* @__PURE__ */ figma.widget.h(AutoLayout3, {
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
    }, /* @__PURE__ */ figma.widget.h(AutoLayout3, {
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
  widget3.register(HackMDViewer);
})();
