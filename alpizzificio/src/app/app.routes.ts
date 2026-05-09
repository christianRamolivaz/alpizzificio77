import { Routes } from '@angular/router';
import { About } from './pages/about/about';
import { Home } from './pages/home/home';
import { Menu } from './pages/menu/menu';
import { Summary } from './pages/summary/summary';

export const routes: Routes = [
  { path: '', component: About, title:"Alpizzificio77"},
  { path: 'home', component: Menu },
  { path: 'menu', component: Menu },
  { path: 'chi-siamo', component: About },
  { path: 'riepilogo', component: Summary },
  { path: '**', redirectTo: '' }
];
