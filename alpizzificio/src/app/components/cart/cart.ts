import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CartService, CartItem, isCustomized, buildNoteText } from '../../services/cart-service';
import { map } from 'rxjs/operators';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent {
  private cartService = inject(CartService);
  showCart = false;
  feedbackId: number | null = null;
  feedbackText = '';

  cartItems$ = this.cartService.getItems();
  cartCount$ = this.cartItems$.pipe(
    map((items: CartItem[]) => items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0))
  );

  toggleCart() {
    this.showCart = !this.showCart;
  }

  showFeedback(msg: string) {
    this.feedbackText = msg;
    if (this.feedbackId) clearTimeout(this.feedbackId);
    this.feedbackId = window.setTimeout(() => {
      this.feedbackText = '';
      this.feedbackId = null;
    }, 1200);
  }

  incrementQuantity(cartItemId: string) {
    this.cartService.incrementQuantity(cartItemId);
  }

  decrementItem(cartItemId: string) {
    this.cartService.decrementQuantity(cartItemId);
    this.showFeedback('Quantità aggiornata');
  }

  removeItem(cartItemId: string) {
    this.cartService.removeFromCart(cartItemId);
    this.showFeedback('Riga rimossa');
  }

  isCustomized(item: CartItem): boolean { return isCustomized(item); }
  getNoteText(item: CartItem): string { return buildNoteText(item); }
}
