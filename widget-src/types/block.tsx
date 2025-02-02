// src/types/block.ts

import { TextSegment } from './text';

export interface StyledBlock {
  segments?: TextSegment[];
  type: string;
  content: string;
  level?: number;
  items?: {
    content: string;
    checked?: boolean;
    segments: TextSegment[];
    checkable?: boolean;
    ordered?: boolean;
  }[];
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  };
}