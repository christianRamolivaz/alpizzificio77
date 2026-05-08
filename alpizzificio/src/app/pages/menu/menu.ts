
import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart-service';
import { Pizza, Product } from '../../services/product';

@Component({
  selector: 'app-menu',
  imports: [AsyncPipe, CurrencyPipe, CommonModule, RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  private productService = inject(Product);
  private cartService = inject(CartService);
  pizzas$ = this.productService.getPizzas();

  addToCart(pizza: Pizza) {
    this.cartService.addToCart(pizza);
    // Il feedback ora è gestito dal componente globale Cart
  }
}
