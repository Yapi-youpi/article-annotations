import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/data/base-api.service';
import { Annotation, CreateAnnotationDto, UpdateAnnotationDto } from '../models/annotation.model';
import { DEFAULT_ANNOTATION_COLOR } from '../constants/colors';

@Injectable({ providedIn: 'root' })
export class AnnotationApiService extends BaseApiService {
  protected override readonly responseDelayMs = 220;
  private readonly storageKey = 'enterprise.annotations.v1';

  getByArticleId(articleId: string): Observable<Annotation[]> {
    return this.simulateRequest(() =>
      this.readFromStorage().filter((item) => item.articleId === articleId),
    );
  }

  create(articleId: string, payload: CreateAnnotationDto): Observable<Annotation> {
    return this.simulateRequest(() => {
      const created: Annotation = {
        id: this.createId(),
        articleId,
        selectedText: payload.selectedText,
        text: payload.text,
        color: payload.color,
        position: payload.position,
        createdAt: new Date().toISOString(),
      };
      this.writeToStorage([...this.readFromStorage(), created]);
      return created;
    });
  }

  update(annotationId: string, payload: UpdateAnnotationDto): Observable<Annotation> {
    return this.simulateRequest(() => {
      const annotations = this.readFromStorage();
      const index = annotations.findIndex((item) => item.id === annotationId);
      if (index === -1) throw new Error('Аннотация не найдена.');
      const updated: Annotation = { ...annotations[index], ...payload };
      annotations[index] = updated;
      this.writeToStorage(annotations);
      return updated;
    });
  }

  delete(annotationId: string): Observable<void> {
    return this.simulateRequest(() => {
      this.writeToStorage(this.readFromStorage().filter((item) => item.id !== annotationId));
    });
  }

  /** Удаляет все аннотации, принадлежащие статье. Вызывается при каскадном удалении статьи. */
  deleteByArticleId(articleId: string): Observable<void> {
    return this.simulateRequest(() => {
      this.writeToStorage(this.readFromStorage().filter((item) => item.articleId !== articleId));
    });
  }

  private readFromStorage(): Annotation[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Array<Partial<Annotation>>;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => Boolean(item?.id && item?.articleId && typeof item?.text === 'string'))
        .map((item) => ({
          id: item.id!,
          articleId: item.articleId!,
          selectedText: typeof item.selectedText === 'string' ? item.selectedText : item.text!,
          text: item.text!,
          color: typeof item.color === 'string' ? item.color : DEFAULT_ANNOTATION_COLOR,
          position: typeof item.position === 'number' ? item.position : 0,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(0).toISOString(),
        }));
    } catch {
      return [];
    }
  }

  private writeToStorage(items: Annotation[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
