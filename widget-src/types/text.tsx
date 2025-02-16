// src/types/text.ts

export interface TextSegment {
  text: string;
  href?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    highlight?: boolean;
    strikethrough?: boolean;
  };
}
