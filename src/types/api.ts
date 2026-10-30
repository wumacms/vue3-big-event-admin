export interface Channel {
  id: number
  cate_name: string
  cate_alias: string
}

export interface Article {
  id: number
  title: string
  cate_name: string
  pub_date: string
  state: '已发布' | '草稿'
  cover_img?: string
}

export interface ArticleDetail extends Article {
  cate_id: number
  content: string
  cover_img: string
}

export interface PageResult<T> {
  total: number
  items: T[]
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  email: string
  user_pic: string
}
