export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type ArticlePayload = Pick<Article, 'title' | 'content'>;
