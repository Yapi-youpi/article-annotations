import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ArticleApiService } from '../data/article-api.service';
import { Article, ArticlePayload } from '../models/article.model';
import { AnnotationsStore } from '../../annotations/state/annotations.store';

@Injectable({ providedIn: 'root' })
export class ArticlesStore {
  private readonly api = inject(ArticleApiService);
  private readonly annotationsStore = inject(AnnotationsStore);

  private readonly _articles = signal<Article[]>([]);
  private readonly _selectedArticleId = signal<string | null>(null);
  /** true только во время начальной загрузки списка / отдельной статьи */
  private readonly _listLoading = signal(false);
  /** true во время мутаций: create, update, remove */
  private readonly _mutating = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly articles = computed(() => this._articles());
  readonly selectedArticleId = computed(() => this._selectedArticleId());
  /** Индикатор загрузки данных (loadAll / loadById) */
  readonly loading = computed(() => this._listLoading());
  /** Индикатор выполнения мутации (create / update / remove) */
  readonly mutating = computed(() => this._mutating());
  readonly error = computed(() => this._error());
  readonly totalCount = computed(() => this._articles().length);
  readonly selectedArticle = computed(
    () => this._articles().find((article) => article.id === this._selectedArticleId()) ?? null,
  );

  async loadAll(): Promise<void> {
    this._listLoading.set(true);
    this._error.set(null);
    try {
      const articles = await firstValueFrom(this.api.getArticles());
      this._articles.set(articles);
    } catch {
      this._error.set('Не удалось загрузить статьи.');
    } finally {
      this._listLoading.set(false);
    }
  }

  async loadById(id: string): Promise<void> {
    this._listLoading.set(true);
    this._error.set(null);
    this._selectedArticleId.set(id);
    try {
      const article = await firstValueFrom(this.api.getArticleById(id));
      this._articles.update((items) => {
        const index = items.findIndex((item) => item.id === article.id);
        if (index === -1) return [...items, article];
        const copy = [...items];
        copy[index] = article;
        return copy;
      });
    } catch {
      this._error.set('Не удалось загрузить статью.');
    } finally {
      this._listLoading.set(false);
    }
  }

  async create(payload: ArticlePayload): Promise<Article | null> {
    this._mutating.set(true);
    this._error.set(null);
    try {
      const created = await firstValueFrom(this.api.createArticle(payload));
      this._articles.update((items) => [created, ...items]);
      this._selectedArticleId.set(created.id);
      return created;
    } catch {
      this._error.set('Не удалось создать статью.');
      return null;
    } finally {
      this._mutating.set(false);
    }
  }

  async update(id: string, payload: ArticlePayload): Promise<Article | null> {
    this._mutating.set(true);
    this._error.set(null);
    try {
      const updated = await firstValueFrom(this.api.updateArticle(id, payload));
      this._articles.update((items) => items.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch {
      this._error.set('Не удалось обновить статью.');
      return null;
    } finally {
      this._mutating.set(false);
    }
  }

  async remove(id: string): Promise<boolean> {
    this._mutating.set(true);
    this._error.set(null);
    try {
      // Сначала удаляем аннотации, затем статью — если аннотации не удалятся, статья остаётся
      await this.annotationsStore.deleteByArticle(id);
      await firstValueFrom(this.api.deleteArticle(id));
      this._articles.update((items) => items.filter((item) => item.id !== id));
      if (this._selectedArticleId() === id) {
        this._selectedArticleId.set(null);
      }
      return true;
    } catch {
      this._error.set('Не удалось удалить статью.');
      return false;
    } finally {
      this._mutating.set(false);
    }
  }

  select(id: string | null): void {
    this._selectedArticleId.set(id);
  }
}
