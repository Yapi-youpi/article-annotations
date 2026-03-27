import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ArticleListComponent } from '../../components/article-list/article-list.component';
import { ArticlesStore } from '../../state/articles.store';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ConfirmDeleteController } from '../../../../shared/utils/confirm-delete.controller';

@Component({
  selector: 'app-article-list-page',
  standalone: true,
  imports: [ArticleListComponent, ConfirmModalComponent],
  templateUrl: './article-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleListPageComponent implements OnInit {
  protected readonly store = inject(ArticlesStore);
  private readonly router = inject(Router);

  protected readonly confirmDialog = new ConfirmDeleteController();

  ngOnInit(): void {
    void this.store.loadAll();
  }

  onCreate(): void {
    void this.router.navigate(['/articles/new']);
  }

  onDelete(id: string): void {
    this.confirmDialog.open('Удалить статью?', 'Это действие нельзя отменить.', async () => {
      await this.store.remove(id);
    });
  }
}
