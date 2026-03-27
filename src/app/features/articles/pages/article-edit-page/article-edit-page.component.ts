import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, from, switchMap } from 'rxjs';

import {
  AnnotationCreatePayload,
  AnnotationCreatePopupComponent,
} from '../../../annotations/components/annotation-create-popup/annotation-create-popup.component';
import { AnnotatedTextComponent } from '../../../annotations/components/annotated-text/annotated-text.component';
import { AnnotationListComponent } from '../../../annotations/components/annotation-list/annotation-list.component';
import { Annotation, AnnotationSelection } from '../../../annotations/models/annotation.model';
import { AnnotationsStore } from '../../../annotations/state/annotations.store';
import { ANNOTATION_COLOR_PRESETS } from '../../../annotations/constants/colors';
import { ArticleFormComponent } from '../../components/article-form/article-form.component';
import { ArticlePayload } from '../../models/article.model';
import { ArticlesStore } from '../../state/articles.store';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ConfirmDeleteController } from '../../../../shared/utils/confirm-delete.controller';

@Component({
  selector: 'app-article-edit-page',
  standalone: true,
  imports: [
    RouterLink,
    ArticleFormComponent,
    AnnotatedTextComponent,
    AnnotationListComponent,
    AnnotationCreatePopupComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './article-edit-page.component.html',
  styleUrl: './article-edit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleEditPageComponent {
  protected readonly facade = inject(ArticlesStore);
  protected readonly annotationsFacade = inject(AnnotationsStore);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly id = input<string | null>(null);
  protected readonly isEditMode = computed(() => this.id() !== null);

  protected initialValue: ArticlePayload | null = null;
  protected currentContent = '';
  protected pendingSelection: AnnotationSelection | null = null;
  protected annotationPopupX = 0;
  protected annotationPopupY = 0;
  protected readonly colorPresets = ANNOTATION_COLOR_PRESETS;
  protected draftAnnotations: Annotation[] = [];
  protected readonly confirmDialog = new ConfirmDeleteController();

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          if (!id) {
            this.annotationsFacade.setActiveArticle(null);
            this.initialValue = null;
            this.currentContent = '';
            this.draftAnnotations = [];
            this.pendingSelection = null;
            return EMPTY;
          }
          this.annotationsFacade.setActiveArticle(id);
          return from(
            Promise.all([this.facade.loadById(id), this.annotationsFacade.loadByArticleId(id)]),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const selected = this.facade.selectedArticle();
        this.initialValue = selected ? { title: selected.title, content: selected.content } : null;
        this.currentContent = selected?.content ?? '';
        this.cdr.markForCheck();
      });
  }

  protected get displayedAnnotations(): Annotation[] {
    return this.isEditMode() ? this.annotationsFacade.annotations() : this.draftAnnotations;
  }

  protected get annotationsLoading(): boolean {
    return this.isEditMode() ? this.annotationsFacade.loading() || this.annotationsFacade.mutating() : false;
  }

  protected get annotationsError(): string | null {
    return this.isEditMode() ? this.annotationsFacade.error() : null;
  }

  async onSubmit(payload: ArticlePayload): Promise<void> {
    const id = this.id();
    if (this.isEditMode() && id) {
      const updated = await this.facade.update(id, payload);
      if (updated) {
        await this.router.navigate(['/articles', updated.id]);
      }
      return;
    }

    const created = await this.facade.create(payload);
    if (created) {
      await this.persistDraftAnnotations(created.id);
      await this.router.navigate(['/articles', created.id]);
    }
  }

  onCancel(): void {
    const id = this.id();
    void this.router.navigate(id ? ['/articles', id] : ['/articles']);
  }

  onAnnotationSelected(payload: AnnotationSelection | null): void {
    if (!payload) {
      this.pendingSelection = null;
      return;
    }
    this.pendingSelection = payload;
    this.annotationPopupX = Math.max(8, Math.min(payload.anchorX + 12, window.innerWidth - 380));
    this.annotationPopupY = Math.max(8, Math.min(payload.anchorY + 12, window.innerHeight - 280));
  }

  onAnnotationCreated(payload: AnnotationCreatePayload): void {
    this.pendingSelection = null;

    const id = this.id();
    if (this.isEditMode() && id) {
      void this.annotationsFacade.create(id, payload);
      return;
    }

    this.draftAnnotations = [
      ...this.draftAnnotations,
      {
        id: `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        articleId: '__draft__',
        createdAt: new Date().toISOString(),
        ...payload,
      },
    ].sort((a, b) => a.position - b.position);
  }

  onDeleteAnnotation(annotationId: string): void {
    if (this.isEditMode()) {
      const articleId = this.id()!;
      this.confirmDialog.open(
        'Удалить аннотацию?',
        'Аннотация будет удалена без возможности восстановления.',
        async () => {
          await this.annotationsFacade.remove(articleId, annotationId);
        },
      );
      return;
    }

    this.confirmDialog.open(
      'Удалить аннотацию?',
      'Аннотация будет удалена без возможности восстановления.',
      async () => {
        this.draftAnnotations = this.draftAnnotations.filter((item) => item.id !== annotationId);
      },
    );
  }

  onUpdateAnnotation(payload: { id: string; text: string; color: string }): void {
    if (this.isEditMode()) {
      void this.annotationsFacade.update(this.id()!, payload.id, { text: payload.text, color: payload.color });
      return;
    }

    this.draftAnnotations = this.draftAnnotations.map((item) =>
      item.id === payload.id ? { ...item, text: payload.text, color: payload.color } : item,
    );
  }

  onContentChanged(value: string): void {
    this.currentContent = value;
  }

  private async persistDraftAnnotations(articleId: string): Promise<void> {
    await Promise.all(
      this.draftAnnotations.map((item) =>
        this.annotationsFacade.create(articleId, {
          selectedText: item.selectedText,
          text: item.text,
          color: item.color,
          position: item.position,
        }),
      ),
    );
    this.draftAnnotations = [];
  }
}
