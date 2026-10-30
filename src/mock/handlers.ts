import { http, HttpResponse, delay } from 'msw'
import { mockDb, nextId, persist, type ArticleRecord, type UserRecord } from './db'
import type { Article } from '@/types/api'

/* ---------------- 响应工具 ---------------- */

/**
 * 接口路径前缀：开发环境为 ''，GitHub Pages 等子路径部署时为 '/repo'。
 * Mock 请求必须落在 Service Worker 的作用域内，否则拦截不到。
 */
const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

/** 声明接口路径，例如 api('/login') → /api/login */
const api = (path: string) => `${API_BASE}${path}`

/** 业务成功：{ code: 0, message, data } */
function ok(data: unknown = null) {
  return HttpResponse.json({ code: 0, message: 'success', data })
}

/** 业务失败：默认 200 + code 1，需要 HTTP 语义时传 status */
function fail(message: string, status = 200) {
  return HttpResponse.json({ code: 1, message, data: null }, { status })
}

/** 模拟网络延迟；单元测试中不加延迟 */
const tick = () => (import.meta.env.MODE === 'test' ? Promise.resolve() : delay(260))

/** 从 Authorization 头解析当前登录用户 */
function authUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const username = token ? mockDb.tokens[token] : undefined
  return mockDb.users.find((user) => user.username === username)
}

/** 需要登录的接口统一入口：未登录返回 401，登录后把用户传给业务处理 */
async function withAuth(
  request: Request,
  handler: (user: UserRecord) => Response | Promise<Response>,
): Promise<Response> {
  const user = authUser(request)
  if (!user) return fail('身份认证失败', 401)
  await tick()
  return handler(user)
}

/** 读取 JSON 请求体 */
async function json<T extends Record<string, unknown>>(request: Request) {
  return (await request.json()) as T
}

/* ---------------- 用户 ---------------- */

const userHandlers = [
  http.post(api('/register'), async ({ request }) => {
    await tick()
    const { username = '', password = '', repassword = '' } = await json<Record<string, string>>(
      request,
    )
    if (!username.trim() || !password) return fail('用户名和密码不能为空')
    if (password !== repassword) return fail('两次输入的密码不一致')
    if (mockDb.users.some((user) => user.username === username)) return fail('用户名已被占用')

    mockDb.users.push({
      id: nextId(mockDb.users),
      username,
      password,
      nickname: username,
      email: '',
      user_pic: '',
    })
    persist()
    return ok()
  }),

  http.post(api('/login'), async ({ request }) => {
    await tick()
    const { username, password } = await json<Record<string, string>>(request)
    const user = mockDb.users.find(
      (item) => item.username === username && item.password === password,
    )
    if (!user) return fail('用户名或密码错误')

    const token = `mock-token-${user.username}-${Date.now()}`
    mockDb.tokens[token] = user.username
    persist()
    return ok({ token })
  }),

  http.get(api('/user/info'), ({ request }) =>
    withAuth(request, (user) => {
      const { id, username, nickname, email, user_pic } = user
      return ok({ id, username, nickname, email, user_pic })
    }),
  ),

  http.patch(api('/user/info'), ({ request }) =>
    withAuth(request, async (user) => {
      const { nickname = '', email = '' } = await json<Record<string, string>>(request)
      if (!nickname.trim()) return fail('昵称不能为空')
      if (email && !/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(email)) return fail('邮箱格式不正确')

      Object.assign(user, { nickname: nickname.trim(), email })
      persist()
      return ok()
    }),
  ),

  http.patch(api('/user/avatar'), ({ request }) =>
    withAuth(request, async (user) => {
      const { avatar = '' } = await json<Record<string, string>>(request)
      if (!avatar) return fail('请选择头像')

      user.user_pic = avatar
      persist()
      return ok()
    }),
  ),
]

/* ---------------- 文章分类 ---------------- */

const channelHandlers = [
  http.get(api('/user/channel'), ({ request }) =>
    withAuth(request, () => ok({ channels: mockDb.channels })),
  ),

  http.post(api('/user/channel'), ({ request }) =>
    withAuth(request, async () => {
      const { cate_name = '', cate_alias = '' } = await json<Record<string, string>>(request)
      const name = cate_name.trim()
      const alias = cate_alias.trim()
      if (!name || !alias) return fail('分类名称和别名不能为空')
      if (mockDb.channels.some((item) => item.cate_alias === alias)) return fail('分类别名已存在')

      mockDb.channels.push({ id: nextId(mockDb.channels), cate_name: name, cate_alias: alias })
      persist()
      return ok()
    }),
  ),

  http.put(api('/user/channel'), ({ request }) =>
    withAuth(request, async () => {
      const { id, cate_name = '', cate_alias = '' } = await json<Record<string, string>>(request)
      const channel = mockDb.channels.find((item) => item.id === Number(id))
      if (!channel) return fail('分类不存在')

      const name = cate_name.trim()
      const alias = cate_alias.trim()
      if (!name || !alias) return fail('分类名称和别名不能为空')
      if (mockDb.channels.some((item) => item.cate_alias === alias && item.id !== channel.id)) {
        return fail('分类别名已存在')
      }

      Object.assign(channel, { cate_name: name, cate_alias: alias })
      persist()
      return ok()
    }),
  ),

  http.delete(api('/user/channel'), ({ request }) =>
    withAuth(request, () => {
      const id = Number(new URL(request.url).searchParams.get('id'))
      const index = mockDb.channels.findIndex((item) => item.id === id)
      if (index < 0) return fail('分类不存在')
      if (mockDb.articles.some((item) => item.cate_id === id)) {
        return fail('该分类下还有文章，无法删除')
      }

      mockDb.channels.splice(index, 1)
      persist()
      return ok()
    }),
  ),
]

/* ---------------- 文章 ---------------- */

function toArticleItem(record: ArticleRecord): Article {
  const channel = mockDb.channels.find((item) => item.id === record.cate_id)
  return {
    id: record.id,
    title: record.title,
    cate_name: channel?.cate_name ?? '未分类',
    pub_date: record.pub_date,
    state: record.state,
    cover_img: record.cover_img,
  }
}

/** Blob 转 base64，浏览器与 Node（单测）通用 */
async function blobToDataUrl(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`
}

/** 文章提交体是 FormData（含封面文件），统一解析成普通对象 */
async function readArticleForm(request: Request) {
  const form = await request.formData()
  const cover = form.get('cover_img')
  return {
    title: String(form.get('title') ?? '').trim(),
    content: String(form.get('content') ?? ''),
    cate_id: Number(form.get('cate_id') ?? 0),
    state: String(form.get('state') ?? '草稿') as ArticleRecord['state'],
    cover: cover instanceof Blob ? await blobToDataUrl(cover) : '',
  }
}

/** 提交前校验，返回错误文案或 null */
function validateArticle(input: { title: string; cate_id: number; content: string }) {
  if (!input.title) return '文章标题不能为空'
  if (!input.cate_id) return '请选择文章分类'
  if (!input.content) return '文章内容不能为空'
  return null
}

const articleHandlers = [
  http.get(api('/article'), ({ request }) =>
    withAuth(request, () => {
      const params = new URL(request.url).searchParams
      const pagenum = Number(params.get('pagenum') ?? 1)
      const pagesize = Math.max(1, Number(params.get('pagesize') ?? 5))
      const cateId = Number(params.get('cate_id') ?? 0)
      const state = params.get('state') ?? ''

      const list = mockDb.articles
        .filter((item) => (!cateId || item.cate_id === cateId) && (!state || item.state === state))
        // 与真实后端一致：按发布时间倒序
        .sort((a, b) => b.pub_date.localeCompare(a.pub_date))
      const start = (pagenum - 1) * pagesize

      return ok({
        total: list.length,
        items: list.slice(start, start + pagesize).map(toArticleItem),
      })
    }),
  ),

  http.get(api('/article/detail'), ({ request }) =>
    withAuth(request, () => {
      const id = Number(new URL(request.url).searchParams.get('id'))
      const record = mockDb.articles.find((item) => item.id === id)
      if (!record) return fail('文章不存在')

      return ok({
        ...toArticleItem(record),
        cate_id: record.cate_id,
        content: record.content,
        cover_img: record.cover_img,
      })
    }),
  ),

  http.post(api('/article'), ({ request }) =>
    withAuth(request, async () => {
      const input = await readArticleForm(request)
      const error = validateArticle(input)
      if (error) return fail(error)
      if (!input.cover) return fail('请上传文章封面')

      mockDb.articles.push({
        id: nextId(mockDb.articles),
        title: input.title,
        cate_id: input.cate_id,
        content: input.content,
        state: input.state,
        cover_img: input.cover,
        pub_date: new Date().toISOString(),
      })
      persist()
      return ok()
    }),
  ),

  http.put(api('/article'), ({ request }) =>
    withAuth(request, async () => {
      const id = Number(new URL(request.url).searchParams.get('id'))
      const record = mockDb.articles.find((item) => item.id === id)
      if (!record) return fail('文章不存在')

      const input = await readArticleForm(request)
      const error = validateArticle(input)
      if (error) return fail(error)

      Object.assign(record, {
        title: input.title,
        cate_id: input.cate_id,
        content: input.content,
        state: input.state,
        // 未重新上传封面时沿用原封面
        cover_img: input.cover || record.cover_img,
      })
      persist()
      return ok()
    }),
  ),

  http.delete(api('/article'), ({ request }) =>
    withAuth(request, () => {
      const id = Number(new URL(request.url).searchParams.get('id'))
      const index = mockDb.articles.findIndex((item) => item.id === id)
      if (index < 0) return fail('文章不存在')

      mockDb.articles.splice(index, 1)
      persist()
      return ok()
    }),
  ),
]

/** 所有 Mock 接口：浏览器（Service Worker）与单元测试（Node）共用同一套 */
export const handlers = [...userHandlers, ...channelHandlers, ...articleHandlers]
