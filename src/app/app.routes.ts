import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'curso-detail/:id',
    loadComponent: () => import('./pages/curso-detail/curso-detail.page').then(m => m.CursoDetailPage)
  },
];
