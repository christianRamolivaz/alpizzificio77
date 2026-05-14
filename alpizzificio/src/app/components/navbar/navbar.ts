import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Product } from '../../services/product';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private productService = inject(Product);
  private router = inject(Router);

  menuOpen = false;
  mobileMenuExpanded = false;

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
}
