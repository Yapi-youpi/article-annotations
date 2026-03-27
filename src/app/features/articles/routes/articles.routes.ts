import { Routes } from '@angular/router';

export const ARTICLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/article-list-page/article-list-page.component').then((m) => m.ArticleListPageComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('../pages/article-edit-page/article-edit-page.component').then((m) => m.ArticleEditPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/article-detail-page/article-detail-page.component').then((m) => m.ArticleDetailPageComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('../pages/article-edit-page/article-edit-page.component').then((m) => m.ArticleEditPageComponent),
  },
];
