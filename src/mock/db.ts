import type { Channel } from '@/types/api'
import { ARTICLE_SEEDS, type ChannelAlias } from './articles'
import { avatarImage, coverImage } from './image'

/** 演示账号 */
export const DEMO_ACCOUNT = { username: 'admin', password: 'admin123' }

export interface UserRecord {
  id: number
  username: string
  password: string
  nickname: string
  email: string
  user_pic: string
}

export interface ArticleRecord {
  id: number
  title: string
  cate_id: number
  cover_img: string
  content: string
  state: '已发布' | '草稿'
  pub_date: string
}

export interface MockDb {
  /** 种子版本，升级后旧的本地缓存会自动失效 */
  version: number
  users: UserRecord[]
  channels: Channel[]
  articles: ArticleRecord[]
  /** token -> username */
  tokens: Record<string, string>
}

/** 种子数据变更时递增，避免旧缓存覆盖新数据 */
const SEED_VERSION = 2
const STORAGE_KEY = 'big-event-mock-db'
const DAY = 86400000

const CHANNELS: Channel[] = [
  { id: 1, cate_name: '前端开发', cate_alias: 'frontend' },
  { id: 2, cate_name: '后端开发', cate_alias: 'backend' },
  { id: 3, cate_name: '数据库', cate_alias: 'database' },
  { id: 4, cate_name: '人工智能', cate_alias: 'ai' },
  { id: 5, cate_name: '运维部署', cate_alias: 'devops' },
  { id: 6, cate_name: '产品设计', cate_alias: 'design' },
]

/** 生成自增 id，省去额外维护 seq 计数 */
export function nextId(list: { id: number }[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

/** 发布时间：距今天数 + 按索引打散的时分，避免所有文章都是整点 */
function publishDate(daysAgo: number, index: number) {
  const hours = ((index * 5) % 9) * 3600000
  const minutes = ((index * 17) % 60) * 60000
  return new Date(Date.now() - daysAgo * DAY - hours - minutes).toISOString()
}

function createArticles(): ArticleRecord[] {
  const findChannel = (alias: ChannelAlias) => CHANNELS.find((item) => item.cate_alias === alias)!
  const total = ARTICLE_SEEDS.length

  return ARTICLE_SEEDS.map((seed, index) => {
    // 越早发布 id 越小，与真实自增主键一致
    const id = total - index
    return {
      id,
      title: seed.title,
      cate_id: findChannel(seed.cate).id,
      cover_img: coverImage(id),
      content: seed.content,
      state: seed.state,
      pub_date: publishDate(seed.daysAgo, index),
    }
  })
}

function createSeed(): MockDb {
  return {
    version: SEED_VERSION,
    users: [
      {
        id: 1,
        username: DEMO_ACCOUNT.username,
        password: DEMO_ACCOUNT.password,
        nickname: '管理员',
        email: 'admin@example.com',
        user_pic: avatarImage(1),
      },
    ],
    channels: CHANNELS.map((item) => ({ ...item })),
    articles: createArticles(),
    tokens: {},
  }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as MockDb) : null
    if (parsed?.version === SEED_VERSION && parsed.users?.length) return parsed
  } catch {
    // 数据损坏时回退到种子数据
  }
  const seed = createSeed()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

/** 内存中的数据库，页面刷新后从 localStorage 恢复改动 */
export const mockDb: MockDb = load()

/** 把内存数据写回 localStorage */
export function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDb))
}

/** 重置演示数据（清空本地改动） */
export function resetMockDb() {
  Object.assign(mockDb, createSeed())
  persist()
}
