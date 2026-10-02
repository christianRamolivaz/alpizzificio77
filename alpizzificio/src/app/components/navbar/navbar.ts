import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Product } from '../../services/product';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css', './navbar-mobile.css'],
})
export class Navbar {
  private productService = inject(Product);
  private authService = inject(AuthService);
  private router = inject(Router);

  menuOpen = false;
  mobileMenuExpanded = false;

  user = toSignal(this.authService.user$, { initialValue: null });
  isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false });

  categories = toSignal(
    this.productService.getPizzas().pipe(
      map(items => [...new Set(items.map(i => i.category))])
    ),
    { initialValue: [] as string[] }
  );

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) this.mobileMenuExpanded = false;
  }

  goToCategory(cat: string) {
    this.router.navigate(['/menu'], { queryParams: { categoria: cat } });
    this.menuOpen = false;
    this.mobileMenuExpanded = false;
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
      this.menuOpen = false;
    });
  }
}
