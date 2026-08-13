/**
 * The HackMD API token lives in clientStorage, not in synced state.
 *
 * Synced state is written into the Figma file: every collaborator — and every
 * other plugin that can read the file — would be able to read the token, which
 * carries the full permissions of the user's HackMD account. clientStorage is
 * scoped to this widget on this user's machine.
 *
 * clientStorage is async and widget rendering is synchronous, so read the token
 * inside an event handler (onClick, property menu) rather than during render.
 */
const TOKEN_KEY = "hackmd-api-token";

export const getToken = async (): Promise<string | undefined> => {
  const stored = await figma.clientStorage.getAsync(TOKEN_KEY);
  return typeof stored === "string" && stored.length > 0 ? stored : undefined;
};

export const setToken = async (token: string): Promise<void> => {
  await figma.clientStorage.setAsync(TOKEN_KEY, token.trim());
};

export const clearToken = async (): Promise<void> => {
  await figma.clientStorage.deleteAsync(TOKEN_KEY);
};
