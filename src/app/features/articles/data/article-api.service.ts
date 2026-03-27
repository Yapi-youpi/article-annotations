import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/data/base-api.service';
import { Article, ArticlePayload } from '../models/article.model';

@Injectable({ providedIn: 'root' })
export class ArticleApiService extends BaseApiService {
  protected override readonly responseDelayMs = 250;
  private readonly storageKey = 'enterprise.articles.v1';

  getArticles(): Observable<Article[]> {
    return this.simulateRequest(() => this.readFromStorage());
  }

  getArticleById(id: string): Observable<Article> {
    return this.simulateRequest(() => {
      const article = this.readFromStorage().find((item) => item.id === id);
      if (!article) throw new Error('Статья не найдена.');
      return article;
    });
  }

  createArticle(payload: ArticlePayload): Observable<Article> {
    return this.simulateRequest(() => {
      const now = new Date().toISOString();
      const created: Article = {
        id: this.createId(),
        title: payload.title,
        content: payload.content,
        createdAt: now,
        updatedAt: now,
      };
      this.writeToStorage([created, ...this.readFromStorage()]);
      return created;
    });
  }

  updateArticle(id: string, payload: ArticlePayload): Observable<Article> {
    return this.simulateRequest(() => {
      const items = this.readFromStorage();
      const current = items.find((item) => item.id === id);
      if (!current) throw new Error('Статья не найдена.');
      const updated: Article = { ...current, ...payload, updatedAt: new Date().toISOString() };
      this.writeToStorage(items.map((item) => (item.id === id ? updated : item)));
      return updated;
    });
  }

  deleteArticle(id: string): Observable<void> {
    return this.simulateRequest(() => {
      this.writeToStorage(this.readFromStorage().filter((item) => item.id !== id));
    });
  }

  private readFromStorage(): Article[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Array<Partial<Article>>;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is Article =>
          typeof item?.id === 'string' &&
          typeof item?.title === 'string' &&
          typeof item?.content === 'string' &&
          typeof item?.createdAt === 'string' &&
          typeof item?.updatedAt === 'string',
      );
    } catch {
      return [];
    }
  }

  private writeToStorage(items: Article[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
