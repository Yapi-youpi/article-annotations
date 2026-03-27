import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'articles',
  },
  {
    path: 'articles',
    loadChildren: () =>
      import('./features/articles/routes/articles.routes').then((m) => m.ARTICLES_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'articles',
  },
];

