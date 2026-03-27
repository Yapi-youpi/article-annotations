import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ArticlePreviewPipe } from '../../pipes/article-preview.pipe';
import { Article } from '../../models/article.model';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [RouterLink, ArticlePreviewPipe],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleListComponent {
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly articles = input.required<Article[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly createArticle = output<void>();
  readonly deleteArticle = output<string>();

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }
}
