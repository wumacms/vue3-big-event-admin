const FORBIDDEN_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta']

/**
 * 简易富文本清洗：移除脚本类标签与事件属性，避免 v-html 渲染时执行注入代码。
 * 仅用于展示后端返回的文章内容。
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')

  FORBIDDEN_TAGS.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((node) => node.remove())
  })

  doc.body.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name)
      }
    })
  })

  return doc.body.innerHTML
}

/** 去掉标签后判断内容是否为空（富文本编辑器空内容通常是 <p><br></p>） */
export function isHtmlEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0
}
