import { Routes } from '@angular/router';
import { About } from './pages/about/about';
import { Home } from './pages/home/home';
import { Menu } from './pages/menu/menu';
import { Summary } from './pages/summary/summary';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'menu', component: Menu },
  { path: 'about', component: About },
  { path: 'summary', component: Summary },
  { path: '**', redirectTo: '' }
];
