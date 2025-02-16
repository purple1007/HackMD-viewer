// src/types/block.ts

import { TextSegment } from "./text";

export interface styledImage {
  type: "image";
  src: string;
}

export interface StyledBlock {
  segments?: TextSegment[];
  type: string;
  content: string;
  level?: number;
  items?: ListItem[];
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  };
}

export interface ListItem {
  content: string;
  segments: any[];
  checkable?: boolean;
  checked?: boolean;
  ordered?: boolean;
  number?: number;
}
