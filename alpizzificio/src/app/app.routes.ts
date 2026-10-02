import { Routes } from '@angular/router';
import { About } from './pages/about/about';
import { Home } from './pages/home/home';
import { Menu } from './pages/menu/menu';
import { Summary } from './pages/summary/summary';
import { PrivacyCookie } from './pages/privacy-cookie/privacy-cookie';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { Gestione } from './pages/gestione/gestione';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Accedi – Al Pizzificio 77' },
  { path: 'register', component: RegisterComponent, title: 'Registrati – Al Pizzificio 77' },
  { path: '', component: Home, title: 'Al Pizzificio 77 – Pizza Artigianale ad Aymavilles, Valle d\'Aosta' },
  { path: 'home', component: Menu, title: 'Menu – Al Pizzificio 77' },
  { path: 'menu', component: Menu, title: 'Menu Pizze – Al Pizzificio 77 | Aymavilles' },
  { path: 'chi-siamo', component: About, title: 'Chi Siamo – Al Pizzificio 77 | Aymavilles, Valle d\'Aosta' },
  { path: 'riepilogo', component: Summary, title: 'Riepilogo Ordine – Al Pizzificio 77' },
  { path: 'gestione', component: Gestione, canActivate: [adminGuard], title: 'Gestione Menu & Ingredienti – Al Pizzificio 77' },
  { path: 'privacy-cookie', component: PrivacyCookie, title: 'Cookie Policy – Al Pizzificio 77' },
  { path: '**', redirectTo: '' }
];
