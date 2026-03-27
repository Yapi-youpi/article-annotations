import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, from, switchMap } from 'rxjs';

import { AnnotatedTextComponent } from '../../../annotations/components/annotated-text/annotated-text.component';
import { AnnotationListComponent } from '../../../annotations/components/annotation-list/annotation-list.component';
import { AnnotationsStore } from '../../../annotations/state/annotations.store';
import { ArticlesStore } from '../../state/articles.store';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ConfirmDeleteController } from '../../../../shared/utils/confirm-delete.controller';

@Component({
  selector: 'app-article-detail-page',
  standalone: true,
  imports: [RouterLink, AnnotatedTextComponent, AnnotationListComponent, ConfirmModalComponent],
  templateUrl: './article-detail-page.component.html',
  styleUrl: './article-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetailPageComponent {
  protected readonly articleFacade = inject(ArticlesStore);
  protected readonly annotationsFacade = inject(AnnotationsStore);
  private readonly router = inject(Router);

  readonly id = input<string | null>(null);

  protected readonly confirmDialog = new ConfirmDeleteController();

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.articleFacade.select(id);
          this.annotationsFacade.setActiveArticle(id);
          if (!id) return EMPTY;
          return from(
            Promise.all([this.articleFacade.loadById(id), this.annotationsFacade.loadByArticleId(id)]),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  onEdit(id: string): void {
    void this.router.navigate(['/articles', id, 'edit']);
  }

  onDelete(id: string): void {
    this.confirmDialog.open('Удалить статью?', 'Это действие нельзя отменить.', async () => {
      const deleted = await this.articleFacade.remove(id);
      if (deleted) {
        await this.router.navigate(['/articles']);
      }
    });
  }

  onDeleteAnnotation(annotationId: string): void {
    const articleId = this.id();
    if (!articleId) return;
    this.confirmDialog.open(
      'Удалить аннотацию?',
      'Аннотация будет удалена без возможности восстановления.',
      async () => {
        await this.annotationsFacade.remove(articleId, annotationId);
      },
    );
  }

  onUpdateAnnotation(payload: { id: string; text: string; color: string }): void {
    const articleId = this.id();
    if (!articleId) return;
    void this.annotationsFacade.update(articleId, payload.id, { text: payload.text, color: payload.color });
  }
}
