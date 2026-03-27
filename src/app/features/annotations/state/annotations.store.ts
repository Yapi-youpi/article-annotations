import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AnnotationApiService } from '../data/annotation-api.service';
import { Annotation, CreateAnnotationDto, UpdateAnnotationDto } from '../models/annotation.model';

@Injectable({ providedIn: 'root' })
export class AnnotationsStore {
  private readonly api = inject(AnnotationApiService);

  private readonly _annotationsByArticleId = signal<Record<string, Annotation[]>>({});
  /** true только во время загрузки аннотаций статьи */
  private readonly _loading = signal(false);
  /** true во время мутаций: create, update, remove */
  private readonly _mutating = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _activeArticleId = signal<string | null>(null);

  readonly loading = computed(() => this._loading());
  readonly mutating = computed(() => this._mutating());
  readonly error = computed(() => this._error());
  readonly activeArticleId = computed(() => this._activeArticleId());
  readonly annotations = computed(() => {
    const articleId = this._activeArticleId();
    if (!articleId) return [];
    return this._annotationsByArticleId()[articleId] ?? [];
  });
  readonly totalCount = computed(() => this.annotations().length);

  setActiveArticle(articleId: string | null): void {
    this._activeArticleId.set(articleId);
  }

  async loadByArticleId(articleId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._activeArticleId.set(articleId);
    try {
      const annotations = await firstValueFrom(this.api.getByArticleId(articleId));
      this._annotationsByArticleId.update((state) => ({ ...state, [articleId]: annotations }));
    } catch {
      this._error.set('Не удалось загрузить аннотации.');
    } finally {
      this._loading.set(false);
    }
  }

  async create(articleId: string, payload: CreateAnnotationDto): Promise<Annotation | null> {
    this._mutating.set(true);
    this._error.set(null);
    try {
      const created = await firstValueFrom(this.api.create(articleId, payload));
      this._annotationsByArticleId.update((state) => ({
        ...state,
        [articleId]: [...(state[articleId] ?? []), created].sort((a, b) => a.position - b.position),
      }));
      return created;
    } catch {
      this._error.set('Не удалось создать аннотацию.');
      return null;
    } finally {
      this._mutating.set(false);
    }
  }

  async remove(articleId: string, annotationId: string): Promise<boolean> {
    this._mutating.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(this.api.delete(annotationId));
      this._annotationsByArticleId.update((state) => ({
        ...state,
        [articleId]: (state[articleId] ?? []).filter((item) => item.id !== annotationId),
      }));
      return true;
    } catch {
      this._error.set('Не удалось удалить аннотацию.');
      return false;
    } finally {
      this._mutating.set(false);
    }
  }

  async update(articleId: string, annotationId: string, payload: UpdateAnnotationDto): Promise<Annotation | null> {
    this._mutating.set(true);
    this._error.set(null);
    try {
      const updated = await firstValueFrom(this.api.update(annotationId, payload));
      this._annotationsByArticleId.update((state) => ({
        ...state,
        [articleId]: (state[articleId] ?? []).map((item) => (item.id === annotationId ? updated : item)),
      }));
      return updated;
    } catch {
      this._error.set('Не удалось обновить аннотацию.');
      return null;
    } finally {
      this._mutating.set(false);
    }
  }

  /**
   * Каскадное удаление всех аннотаций статьи.
   * Вызывается из ArticlesStore при удалении статьи.
   * Не управляет _loading/_mutating намеренно — это внутренняя утилита.
   */
  async deleteByArticle(articleId: string): Promise<void> {
    await firstValueFrom(this.api.deleteByArticleId(articleId));
    this._annotationsByArticleId.update((state) => {
      const { [articleId]: _removed, ...rest } = state;
      return rest;
    });
  }
}
