// src/utils/cleanMarkdown.ts

export const cleanMarkdown = (text: string): string => {
  return text.replace(/[`*]/g, "").trim();
};
