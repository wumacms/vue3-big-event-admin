/**
 * 演示用图片地址：
 * - 封面走 Lorem Picsum（免费图片 API，同一 seed 每次返回同一张图）
 * - 头像走 Unsplash CDN 直链（公开图片，无需密钥）
 */

/** 封面图：16:9，seed 由文章 id 决定，保证每次加载都是同一张 */
export function coverImage(seed: string | number) {
  return `https://picsum.photos/seed/big-event-${seed}/640/360`
}

/** Unsplash 人像图的 photo id，按索引轮换 */
const AVATAR_IDS = [
  '1472099645785-5658abf4ff4e',
  '1494790108377-be9c29b29330',
  '1500648767791-00dcc994a43e',
  '1534528741775-53994a69daeb',
  '1507003211169-0a1dd7228f2d',
  '1517841905240-472988babdf9',
  '1544005313-94ddf0286df2',
  '1506794778202-cad84cf45f1d',
]

/** 默认头像：200x200，自动裁到人脸 */
export function avatarImage(index = 0) {
  const id = AVATAR_IDS[index % AVATAR_IDS.length]!
  return `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&crop=faces`
}
