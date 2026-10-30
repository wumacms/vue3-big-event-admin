import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mock/handlers'

/** 单元测试复用浏览器端同一套 handlers，保证 Mock 行为与页面完全一致 */
export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})

afterAll(() => server.close())
