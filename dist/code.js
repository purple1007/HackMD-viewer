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
                href: url,
                style: {
                  bold: inBold,
                  italic: inItalic,
                  highlight: inHighlight,
                  strikethrough: inStrikethrough
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
        const imageMatch = line.match(/^!\[(.*?)\]\((.*?)(?:\s*=\s*(\d+%?x?))?\)$/);
        if (imageMatch) {
          if (currentBlock)
            blocks.push(currentBlock);
          let width = imageMatch[3] || "fill-parent";
          width = width.replace("x", "");
          let widthNumber = width.includes("%") ? parseFloat(width) : parseInt(width, 10);
          currentBlock = {
            type: "image",
            src: imageMatch[2],
            alt: imageMatch[1],
            width: widthNumber || "fill-parent"
          };
          blocks.push(currentBlock);
          currentBlock = null;
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
  var getTextStyle = (style, href) => {
    const textDecoration = href ? "underline" : (style == null ? void 0 : style.strikethrough) ? "strikethrough" : "none";
    return __spreadValues({
      fontWeight: (style == null ? void 0 : style.bold) ? "bold" : "normal",
      fill: href ? "#0066CC" : (style == null ? void 0 : style.highlight) ? "#DFA424" : "#232323",
      italic: Boolean(style == null ? void 0 : style.italic),
      textDecoration,
      fontSize: MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE
    }, href && { href });
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
        }, getTextStyle(segment.style, segment.href)), segment.text))));
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
      }, getTextStyle(segment.style, segment.href)), segment.text)) : block.content);
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
  var ImageBroken = `<svg width="36" height="34" viewBox="0 0 36 34" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.2" d="M19.3516 20.9594L13.2578 14.8656C13.1417 14.7494 13.0039 14.6572 12.8521 14.5943C12.7004 14.5314 12.5377 14.499 12.3734 14.499C12.2092 14.499 12.0465 14.5314 11.8948 14.5943C11.743 14.6572 11.6052 14.7494 11.4891 14.8656L3 23.3578V5.75C3 5.41848 3.1317 5.10054 3.36612 4.86612C3.60054 4.6317 3.91848 4.5 4.25 4.5H31.75C32.0815 4.5 32.3995 4.6317 32.6339 4.86612C32.8683 5.10054 33 5.41848 33 5.75V10.75L25.5 13.25L23 19.5L19.3516 20.9594Z" fill="#E29898"/>
<path d="M14.25 29.5H4.25C3.91848 29.5 3.60054 29.3683 3.36612 29.1339C3.1317 28.8995 3 28.5815 3 28.25V5.75C3 5.41848 3.1317 5.10054 3.36612 4.86612C3.60054 4.6317 3.91848 4.5 4.25 4.5H31.75C32.0815 4.5 32.3995 4.6317 32.6339 4.86612C32.8683 5.10054 33 5.41848 33 5.75V10.75L25.5 13.25L23 19.5L16.75 22L14.25 29.5Z" stroke="#E29898" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19.5203 29.5L20.7609 25.7812L26.8546 23.3468L29.289 17.2531L33.0078 16.0125V28.25C33.0078 28.5815 32.8761 28.8994 32.6416 29.1338C32.4072 29.3683 32.0893 29.5 31.7578 29.5H19.5203Z" stroke="#E29898" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 23.3578L11.4906 14.8656C11.6067 14.7494 11.7446 14.6572 11.8963 14.5943C12.0481 14.5314 12.2107 14.499 12.375 14.499C12.5393 14.499 12.7019 14.5314 12.8537 14.5943C13.0054 14.6572 13.1433 14.7494 13.2594 14.8656L19.3531 20.9594" stroke="#E29898" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

`;
  var LogoIcon = `<svg width='26' height='24' viewBox='0 0 26 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M25.6553 12.9807C25.6613 11.9633 25.3451 11.3932 24.5459 10.9963L19.6578 8.57006C19.4646 8.47389 19.2669 8.38917 19.0669 8.3159L19.0352 5.0249C19.0133 4.05713 18.7205 3.44121 17.9213 3.04434L13.0332 0.61806C11.3291 -0.228351 9.32846 -0.203928 7.64476 0.682171L1.36352 3.98844C0.667706 4.35479 0.308477 5.03405 0.292628 5.72401L0.000565878 10.7055C-0.0115091 11.1757 0.16886 11.6794 0.618652 11.9481L5.84861 15.0674C6.15878 15.2528 6.48179 15.407 6.8131 15.5306L6.65386 18.6774C6.63424 19.1758 6.79196 19.6322 7.24251 19.9001L12.4725 23.0193C14.3154 24.1184 16.5991 24.1367 18.4586 23.0667L25.1195 19.2338C25.5791 18.9697 25.7308 18.508 25.73 18.005L25.6538 12.9807H25.6553ZM6.65763 8.80284C5.54825 8.29301 2.52574 6.69406 2.29329 6.56507C1.77256 6.27429 1.74841 5.96595 1.77558 5.59502C1.78766 5.42482 1.84199 5.25768 1.93708 5.11114C2.03217 4.96384 2.16802 4.83791 2.34461 4.74861C2.59441 4.62268 8.32548 1.72091 8.32548 1.72091C9.44996 1.15537 10.7541 1.0821 11.9261 1.50111C12.0936 1.56064 12.2581 1.63085 12.4196 1.71099C13.486 2.2399 15.6195 3.29773 16.6851 3.82893C16.6874 3.83046 16.6927 3.83275 16.6957 3.83427C17.1379 4.0579 17.3221 4.51964 17.2458 4.93942C17.1938 5.22944 17.0436 5.48283 16.7153 5.66219C16.6323 5.70798 12.0506 8.16555 11.1382 8.65325C9.74655 9.39815 8.09455 9.46226 6.65839 8.80207L6.65763 8.80284ZM23.8516 13.0326C23.8071 13.3425 23.6327 13.6371 23.3241 13.8195L17.6285 17.1891C16.2074 18.0294 14.4565 18.0599 13.0075 17.27L8.8281 14.9895C8.06964 14.5758 8.06512 13.4768 8.82055 13.0563L14.4754 9.9118C15.7893 9.1814 17.3681 9.12568 18.7288 9.76297L23.232 11.871C23.6169 12.0511 23.8282 12.4068 23.8591 12.7769C23.8659 12.8624 23.8637 12.9487 23.8516 13.0334V13.0326Z' fill='url(#paint0_linear_120_31)'/>
<defs>
<linearGradient id='paint0_linear_120_31' x1='5.67098' y1='2.03929' x2='18.6077' y2='22.7249' gradientUnits='userSpaceOnUse'>
<stop stop-color='#9894F9'/>
<stop offset='1' stop-color='#453AFF'/>
</linearGradient>
</defs>
</svg>`;
  var LogoWordMark = `<svg width='83' height='16' viewBox='0 0 83 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path d='M8.93341 15.7503V1.59824H12.3548V15.7503H8.93341ZM0.22998 15.7503V1.59824H3.65133V15.7503H0.22998ZM1.59052 10.2512V7.13778H10.7341V10.2512H1.59052Z' fill='black'/>
<path d='M21.3838 15.7503V9.1595C21.3838 8.6069 21.2304 8.20255 20.9236 7.94647C20.6302 7.6769 20.2167 7.54212 19.6831 7.54212C19.1629 7.54212 18.6961 7.64321 18.2826 7.84538C17.8824 8.03407 17.4956 8.35081 17.1221 8.79559L15.2014 6.91539C15.8416 6.25495 16.5752 5.73604 17.4022 5.35866C18.2292 4.98127 19.1296 4.79257 20.1033 4.79257C20.997 4.79257 21.7706 4.92735 22.4242 5.19692C23.0778 5.46648 23.5847 5.87756 23.9448 6.43017C24.3049 6.98278 24.485 7.68364 24.485 8.53277V15.7503H21.3838ZM18.6227 15.9525C17.9558 15.9525 17.3489 15.8177 16.802 15.5482C16.2684 15.2786 15.8416 14.9079 15.5215 14.4362C15.2147 13.951 15.0613 13.3849 15.0613 12.738C15.0613 12.1854 15.1613 11.7001 15.3614 11.2823C15.5615 10.8645 15.8549 10.5208 16.2418 10.2512C16.6419 9.96819 17.1354 9.75928 17.7223 9.6245C18.3226 9.47624 19.0162 9.40211 19.8032 9.40211H23.0244L22.8444 11.4441H19.8832C19.6031 11.4441 19.3563 11.471 19.1429 11.5249C18.9295 11.5654 18.7494 11.6395 18.6027 11.7473C18.456 11.8417 18.3426 11.9562 18.2626 12.091C18.1959 12.2258 18.1625 12.3875 18.1625 12.5762C18.1625 12.7784 18.2159 12.9536 18.3226 13.1019C18.4293 13.2501 18.5693 13.3647 18.7427 13.4456C18.9295 13.5264 19.1429 13.5669 19.383 13.5669C19.7298 13.5669 20.0566 13.513 20.3634 13.4051C20.6835 13.2838 20.9636 13.1154 21.2037 12.8997C21.4572 12.684 21.6572 12.4347 21.804 12.1517L22.3642 13.6073C22.0841 14.0656 21.7439 14.4699 21.3438 14.8203C20.957 15.1708 20.5301 15.4471 20.0633 15.6492C19.6098 15.8514 19.1296 15.9525 18.6227 15.9525Z' fill='black'/>
<path d='M31.9161 15.9525C30.889 15.9525 29.962 15.7099 29.135 15.2247C28.3213 14.7395 27.6811 14.079 27.2142 13.2434C26.7474 12.3943 26.5139 11.4441 26.5139 10.3928C26.5139 9.3145 26.7474 8.35755 27.2142 7.5219C27.6811 6.67278 28.3213 6.00561 29.135 5.52039C29.962 5.03518 30.889 4.79257 31.9161 4.79257C32.8631 4.79257 33.7301 4.96779 34.5171 5.31822C35.3174 5.65517 35.9443 6.12017 36.3978 6.71321L34.6571 8.85624C34.4837 8.62711 34.2703 8.4182 34.0169 8.22951C33.7635 8.04081 33.4833 7.89255 33.1766 7.78473C32.8698 7.6769 32.5496 7.62299 32.2162 7.62299C31.7093 7.62299 31.2625 7.74429 30.8757 7.9869C30.4888 8.21603 30.1887 8.53951 29.9753 8.95733C29.7619 9.37515 29.6552 9.84689 29.6552 10.3725C29.6552 10.8847 29.7619 11.3497 29.9753 11.7675C30.2021 12.1719 30.5088 12.4954 30.8957 12.738C31.2825 12.9806 31.716 13.1019 32.1962 13.1019C32.543 13.1019 32.8631 13.0547 33.1566 12.9604C33.45 12.866 33.7168 12.7312 33.9569 12.556C34.2103 12.3808 34.4437 12.1719 34.6571 11.9293L36.3978 14.0723C35.9443 14.6384 35.3107 15.0966 34.4971 15.4471C33.6834 15.784 32.8231 15.9525 31.9161 15.9525Z' fill='black'/>
<path d='M41.4383 12.5964L40.2978 10.1299L45.2398 5.01496H49.4614L41.4383 12.5964ZM38.357 15.7503V0.789551H41.5783V15.7503H38.357ZM45.5399 15.7503L41.8384 10.8982L44.1193 9.11907L49.3614 15.7503H45.5399Z' fill='black'/>
<path d='M51.4213 15.7503V1.59824H54.4825L59.5645 9.94798L57.4036 9.92776L62.5456 1.59824H65.5068V15.7503H62.1855V11.4643C62.1855 10.2243 62.2122 9.11233 62.2655 8.12842C62.3322 7.13104 62.4389 6.15387 62.5856 5.19692L62.9658 6.24821L59.1043 12.2932H57.7437L53.9623 6.28865L54.3424 5.19692C54.5025 6.09995 54.6092 7.03669 54.6625 8.00712C54.7292 8.96407 54.7626 10.1165 54.7626 11.4643V15.7503H51.4213Z' fill='black'/>
<path d='M69.1869 15.7503V1.59824H75.0892C76.1162 1.59824 77.0566 1.77346 77.9103 2.12389C78.764 2.46084 79.4976 2.94606 80.1112 3.57953C80.7247 4.19953 81.1983 4.94757 81.5317 5.82365C81.8652 6.68626 82.0319 7.63647 82.0319 8.67429C82.0319 9.72559 81.8652 10.6825 81.5317 11.5451C81.1983 12.4077 80.7247 13.1558 80.1112 13.7893C79.4976 14.4093 78.764 14.8945 77.9103 15.2449C77.07 15.5819 76.1296 15.7503 75.0892 15.7503H69.1869ZM72.6082 13.3647L72.168 12.6975H74.9891C75.536 12.6975 76.0296 12.6032 76.4697 12.4145C76.9099 12.2258 77.2834 11.9562 77.5902 11.6058C77.9103 11.2419 78.1504 10.8173 78.3104 10.3321C78.4839 9.83341 78.5706 9.28081 78.5706 8.67429C78.5706 8.06777 78.4839 7.5219 78.3104 7.03669C78.1504 6.538 77.9103 6.11343 77.5902 5.763C77.2834 5.39909 76.9099 5.12279 76.4697 4.93409C76.0296 4.7454 75.536 4.65105 74.9891 4.65105H72.108L72.6082 4.02431V13.3647Z' fill='black'/>
</svg>`;
  var LinkIcon = `<svg width='18' height='19' viewBox='0 0 18 19' fill='none' xmlns='http://www.w3.org/2000/svg'>
<g clip-path='url(#clip0_121_851)'>
<path d='M9.5625 8.9375L15.1875 3.3125' stroke='#564DFF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>
<path d='M15.1875 7.8125L15.1868 3.3132L10.6875 3.3125' stroke='#564DFF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>
<path d='M12.9375 10.0625V15.125C12.9375 15.2742 12.8782 15.4173 12.7727 15.5227C12.6673 15.6282 12.5242 15.6875 12.375 15.6875H3.375C3.22582 15.6875 3.08274 15.6282 2.97725 15.5227C2.87176 15.4173 2.8125 15.2742 2.8125 15.125V6.125C2.8125 5.97582 2.87176 5.83274 2.97725 5.72725C3.08274 5.62176 3.22582 5.5625 3.375 5.5625H8.4375' stroke='#564DFF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>
</g>
<defs>
<clipPath id='clip0_121_851'>
<rect width='18' height='18' fill='white' transform='translate(0 0.5)'/>
</clipPath>
</defs>
</svg>`;

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
        }, getTextStyle(segment.style, segment.href)), segment.text))));
      }));
    }
  };

  // widget-src/renderer/ImageRenderer.tsx
  var { widget: widget3 } = figma;
  var { AutoLayout: AutoLayout3, Image, Text: Text3, Span: Span3, SVG: SVG2 } = widget3;
  var ImageRenderer = class {
    static renderImage(block, index) {
      const isValidUrl = (url) => {
        try {
          console.log("Checking URL:", url);
          const urlPattern = new RegExp("^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$", "i");
          return urlPattern.test(url);
        } catch (e) {
          console.error(`Error checking URL: ${url}`, e);
          return false;
        }
      };
      if (!isValidUrl(block.src)) {
        const RedText = "#CF7E7E";
        return /* @__PURE__ */ figma.widget.h(AutoLayout3, {
          key: index,
          padding: 12,
          width: "fill-parent",
          fill: "#F2E1E3",
          direction: "vertical",
          spacing: 6,
          cornerRadius: 4
        }, /* @__PURE__ */ figma.widget.h(SVG2, {
          src: ImageBroken
        }), /* @__PURE__ */ figma.widget.h(Text3, {
          fill: RedText
        }, "\u5716\u7247\u7DB2\u5740\u7121\u6548"), /* @__PURE__ */ figma.widget.h(Text3, {
          fill: RedText
        }, "\u5716\u7247\u7DB2\u5740\uFF1A", /* @__PURE__ */ figma.widget.h(Span3, {
          href: block.src,
          textDecoration: "underline"
        }, block.src), " "), /* @__PURE__ */ figma.widget.h(Text3, {
          fill: RedText
        }, " \u7DB2\u5740\u7121\u6548\u7684\u539F\u56E0\uFF0C\u53EF\u80FD\u662F CORS \u554F\u984C\uFF0C\u8ACB\u66F4\u63DB\u5716\u7247\u7DB2\u5740\u3002"));
      }
      return /* @__PURE__ */ figma.widget.h(Image, {
        key: index,
        src: block.src,
        width: "fill-parent",
        height: 300,
        cornerRadius: 6,
        onError: () => {
          console.error("Unable to load image:", block.src);
        }
      });
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
      if (block.type === "image") {
        return ImageRenderer.renderImage(block, index);
      }
      return BlockRenderer.renderBlock(block, index);
    }
  };

  // widget-src/utils/hackMDId.tsx
  var getHackMDId = (urlString) => {
    const urlPattern = /hackmd\.io\/(?:@[^/]+\/)?([^/]+)/;
    const match = urlString.match(urlPattern);
    if (!match || !match[1]) {
      throw new Error("\u4E0D\u662F\u6709\u6548\u7684 HackMD \u9023\u7D50");
    }
    return match[1];
  };

  // widget-src/components/hackMDButton.tsx
  var { widget: widget4 } = figma;
  var { AutoLayout: AutoLayout4, Text: Text4, Frame, SVG: SVG3 } = widget4;
  var HackMDButton = ({ onSuccess }) => {
    return /* @__PURE__ */ figma.widget.h(AutoLayout4, {
      name: "Frame7",
      fill: "#FFF",
      stroke: "#C7C7C7",
      cornerRadius: 8,
      overflow: "visible",
      direction: "vertical",
      spacing: 6,
      padding: { vertical: 20, horizontal: 16 },
      width: 325
    }, /* @__PURE__ */ figma.widget.h(Frame, {
      name: "HackMD Logo",
      width: 114,
      height: 24
    }, /* @__PURE__ */ figma.widget.h(Frame, {
      name: "HackMD Logo / Icon / Primary",
      x: {
        type: "horizontal-scale",
        leftOffsetPercent: 0,
        rightOffsetPercent: 77.43
      },
      y: {
        type: "vertical-scale",
        topOffsetPercent: 0,
        bottomOffsetPercent: 0
      },
      width: 25.73,
      height: 24
    }, /* @__PURE__ */ figma.widget.h(SVG3, {
      name: "Vector",
      x: {
        type: "horizontal-scale",
        leftOffsetPercent: 0,
        rightOffsetPercent: 0
      },
      y: {
        type: "vertical-scale",
        topOffsetPercent: 0,
        bottomOffsetPercent: 0.598
      },
      height: 24,
      width: 26,
      src: LogoIcon
    })), /* @__PURE__ */ figma.widget.h(Frame, {
      name: "HackMD Logo / Wordmark",
      x: {
        type: "horizontal-scale",
        leftOffsetPercent: 27.395,
        rightOffsetPercent: 0.84
      },
      y: {
        type: "vertical-scale",
        topOffsetPercent: 15.789,
        bottomOffsetPercent: 21.02
      },
      overflow: "visible",
      width: 81.813,
      height: 15.166
    }, /* @__PURE__ */ figma.widget.h(SVG3, {
      name: "HackMD",
      x: {
        type: "horizontal-scale",
        leftOffsetPercent: 0,
        rightOffsetPercent: 0.013
      },
      y: {
        type: "vertical-scale",
        topOffsetPercent: 0,
        bottomOffsetPercent: 0.019
      },
      height: 15,
      width: 82,
      src: LogoWordMark
    }))), /* @__PURE__ */ figma.widget.h(AutoLayout4, {
      name: "Frame 8",
      overflow: "visible",
      spacing: 10,
      padding: {
        top: 0,
        right: 0,
        bottom: 16,
        left: 0
      },
      width: "fill-parent",
      horizontalAlignItems: "center",
      verticalAlignItems: "center"
    }, /* @__PURE__ */ figma.widget.h(Text4, {
      name: "Past your hackmd note into Figma",
      fill: "#747474",
      width: "fill-parent",
      fontFamily: "Inter",
      fontSize: 18,
      fontWeight: 500
    }, "Paste your HackMD note into Figma")), /* @__PURE__ */ figma.widget.h(AutoLayout4, {
      name: "Frame 4",
      fill: "#564DFF",
      cornerRadius: 8,
      overflow: "visible",
      spacing: 5,
      padding: {
        vertical: 8,
        horizontal: 12
      },
      width: "fill-parent",
      horizontalAlignItems: "center",
      verticalAlignItems: "center"
    }, /* @__PURE__ */ figma.widget.h(Text4, {
      name: "Get started",
      fill: "#FFF",
      fontFamily: "Inter",
      fontSize: 20,
      fontWeight: 500,
      onClick: () => {
        return new Promise((resolve) => {
          figma.showUI(__html__, {
            width: 280,
            height: 200,
            title: "HackMD URL setting"
          });
          figma.ui.onmessage = (msg) => __async(void 0, null, function* () {
            if (msg.type === "url" && msg.value) {
              yield onSuccess(msg.value, msg.noteId);
              resolve();
            }
          });
        });
      }
    }, "Get started")));
  };

  // widget-src/components/contentLayout.tsx
  var { widget: widget5 } = figma;
  var { AutoLayout: AutoLayout5, Text: Text5, Frame: Frame2, SVG: SVG4, Line } = widget5;
  var ContentLayout = ({ children, url, lastSyncTime }) => {
    return /* @__PURE__ */ figma.widget.h(AutoLayout5, {
      name: "Container",
      fill: "#FAFAFA",
      stroke: "#C7C7C7",
      cornerRadius: 16,
      overflow: "visible",
      direction: "vertical",
      spacing: 12,
      padding: 28,
      width: 620,
      verticalAlignItems: "center",
      horizontalAlignItems: "center"
    }, /* @__PURE__ */ figma.widget.h(AutoLayout5, {
      name: "Container",
      overflow: "visible",
      direction: "vertical",
      spacing: 10,
      width: "fill-parent",
      horizontalAlignItems: "end"
    }, /* @__PURE__ */ figma.widget.h(AutoLayout5, {
      name: "Link Button",
      fill: "#F3F3F3",
      cornerRadius: 4,
      overflow: "visible",
      spacing: 2,
      padding: { vertical: 4, horizontal: 10 },
      horizontalAlignItems: "end",
      verticalAlignItems: "center"
    }, /* @__PURE__ */ figma.widget.h(Frame2, {
      name: "ArrowSquareOut",
      strokeWidth: 0,
      width: 18,
      height: 18
    }, /* @__PURE__ */ figma.widget.h(SVG4, {
      name: "Vector_Vector_Vector_Vector",
      height: 18,
      width: 18,
      src: LinkIcon
    })), /* @__PURE__ */ figma.widget.h(Text5, {
      name: "Link Text",
      fill: "#564DFF",
      fontFamily: "Inter",
      href: url
    }, "View Original Note", " "))), /* @__PURE__ */ figma.widget.h(Line, {
      length: "fill-parent",
      stroke: "#D9D9D9"
    }), /* @__PURE__ */ figma.widget.h(AutoLayout5, {
      name: "Note-Content Container",
      overflow: "visible",
      spacing: 10,
      width: "fill-parent",
      horizontalAlignItems: "center",
      verticalAlignItems: "center"
    }, children), /* @__PURE__ */ figma.widget.h(AutoLayout5, {
      name: "SyncInfoContainer",
      overflow: "visible",
      direction: "vertical",
      spacing: 12,
      width: 564,
      verticalAlignItems: "center"
    }, /* @__PURE__ */ figma.widget.h(Line, {
      length: "fill-parent",
      stroke: "#D9D9D9"
    }), /* @__PURE__ */ figma.widget.h(AutoLayout5, {
      name: "Frame 9",
      overflow: "visible",
      spacing: 4,
      verticalAlignItems: "center"
    }, /* @__PURE__ */ figma.widget.h(Text5, {
      name: "Sync Label",
      fill: "#ADADAD",
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: 500
    }, "Last Synced:", " "), /* @__PURE__ */ figma.widget.h(Text5, {
      name: "Sync Date",
      fill: "#444",
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: 500
    }, lastSyncTime || "Not synced yet"))));
  };

  // widget-src/code.tsx
  var { widget: widget6 } = figma;
  var { AutoLayout: AutoLayout6, Input, Text: Text6, useSyncedState, usePropertyMenu, useEffect, useWidgetId } = widget6;
  function HackMDViewer() {
    const [url, setUrl] = useSyncedState("url", "");
    const [content, setContent] = useSyncedState("content", "");
    const [loading, setLoading] = useSyncedState("loading", false);
    const [error, setError] = useSyncedState("error", "");
    const [lastSyncTime, setLastSyncTime] = useSyncedState("lastSyncTime", "");
    const fetchHackMDContent = (hackmdUrl, noteId) => __async(this, null, function* () {
      try {
        const requestTime = new Date().toUTCString();
        setLastSyncTime(requestTime);
        setLoading(true);
        setError("");
        const usedNoteId = noteId || getHackMDId(hackmdUrl);
        const publicResponse = yield fetch(`https://hackmd.io/${usedNoteId}/download?t=${new Date().getTime()}`);
        if (!publicResponse.ok) {
          throw new Error("\u7121\u6CD5\u8F09\u5165\u6587\u4EF6");
        }
        const content2 = yield publicResponse.text();
        yield setContent(content2);
      } catch (err) {
        const error2 = err;
        setError(error2.message || "\u7121\u6CD5\u8B80\u53D6\u6587\u4EF6\uFF0C\u8ACB\u78BA\u8A8D\u7DB2\u5740\u9023\u7D50\u6216\u700F\u89BD\u6B0A\u9650");
      } finally {
        setLoading(false);
      }
    });
    if (!url === false) {
      usePropertyMenu([
        {
          itemType: "action",
          propertyName: "refresh",
          tooltip: "\u91CD\u65B0\u6574\u7406"
        }
      ], (_0) => __async(this, [_0], function* ({ propertyName }) {
        if (propertyName === "refresh" && url) {
          yield fetchHackMDContent(url);
        }
      }));
    }
    const renderContent = () => {
      if (loading) {
        return /* @__PURE__ */ figma.widget.h(Text6, null, "\u8F09\u5165\u4E2D...");
      }
      if (error) {
        return /* @__PURE__ */ figma.widget.h(Text6, {
          fill: "#FF0000"
        }, error);
      }
      if (content) {
        const blocks = MarkdownParser.parseBlock(content);
        console.log("URL:", url);
        console.log("Parsed blocks:", blocks);
        return /* @__PURE__ */ figma.widget.h(AutoLayout6, {
          direction: "vertical",
          width: "fill-parent"
        }, blocks.map((block, index) => MarkdownParser.renderBlock(block, index)));
      }
      return null;
    };
    return /* @__PURE__ */ figma.widget.h(AutoLayout6, {
      direction: "vertical",
      width: "hug-contents"
    }, !url ? /* @__PURE__ */ figma.widget.h(HackMDButton, {
      onSuccess: (url2, noteId) => __async(this, null, function* () {
        yield setUrl(url2);
        yield fetchHackMDContent(url2, noteId);
      })
    }) : /* @__PURE__ */ figma.widget.h(ContentLayout, {
      lastSyncTime,
      url
    }, renderContent()));
  }
  widget6.register(HackMDViewer);
})();
