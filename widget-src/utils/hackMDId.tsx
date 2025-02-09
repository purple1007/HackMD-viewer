export const getHackMDId = (urlString: string): string => {
  const urlPattern = /hackmd\.io\/(?:@[^/]+\/)?([^/]+)/
  const match = urlString.match(urlPattern)
  
  if (!match || !match[1]) {
    throw new Error('不是有效的 HackMD 連結')
  }
  
  return match[1]
}