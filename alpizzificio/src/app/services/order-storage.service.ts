import { Injectable, inject } from '@angular/core';
import { CartItem, CartService } from './cart-service';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { Observable, switchMap } from 'rxjs';
import { Order as FirestoreOrder } from '../models/index';

/**
 * Servizio di integrazione tra CartService e Firestore
 * Permette di salvare gli ordini nel database
 */
@Injectable({
  providedIn: 'root'
})
export class OrderStorageService {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  /**
   * Salva l'ordine corrente del carrello su Firestore
   */
  saveOrderFromCart(
    deliveryAddress: string,
    notes: string = ''
  ): Observable<string> {
    return new Observable(observer => {
      const currentUserId = this.authService.getCurrentUserId();

      // Get current cart items
      this.cartService.getItems().pipe(
        switchMap(cartItems => {
          if (cartItems.length === 0) {
            throw new Error('Cart is empty');
          }

          // Convert cart items to order items
          const orderItems = cartItems.map(cartItem => ({
            menuItemId: String(cartItem.pizza.id || cartItem.pizza.name),
            name: cartItem.pizza.name,
            quantity: cartItem.quantity,
            price: (cartItem.isBaby && cartItem.pizza.importoBaby
              ? cartItem.pizza.importoBaby
              : cartItem.pizza.price) + cartItem.extraPrice,
            notes: this.formatCartItemNotes(cartItem)
          }));

          const totalPrice = this.cartService.getTotal();

          // Create order object
          const order: Omit<FirestoreOrder, 'id' | 'createdAt'> = {
            userId: currentUserId ?? null,
            items: orderItems,
            totalPrice,
            status: 'pending',
            deliveryAddress,
            notes
          };

          return this.firestoreService.createOrder(currentUserId ?? null, order);
        })
      ).subscribe({
        next: (orderId) => {
          observer.next(orderId);
          observer.complete();
          // Clear the cart after successful save
          this.cartService.clearCart();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  /**
   * Formatta le note per un singolo item del carrello
   */
  private formatCartItemNotes(cartItem: CartItem): string {
    const notes: string[] = [];
    
    if (cartItem.removedIngredients.length > 0) {
      notes.push(`Senza: ${cartItem.removedIngredients.join(', ')}`);
    }
    
    if (cartItem.addedIngredients.length > 0) {
      notes.push(`Aggiunti: ${cartItem.addedIngredients.join(', ')}`);
    }
    
    if (cartItem.note) {
      notes.push(`Nota: ${cartItem.note}`);
    }
    
    if (cartItem.isBaby) {
      notes.push('Versione Baby');
    }

    return notes.join(' | ');
  }

  /**
   * Ottiene gli ordini dell'utente autenticato
   */
  getUserOrders(): Observable<FirestoreOrder[]> {
    return new Observable(observer => {
      const currentUserId = this.authService.getCurrentUserId();
      if (!currentUserId) {
        observer.error(new Error('User not authenticated'));
        return;
      }

      this.firestoreService.getUserOrders(currentUserId).subscribe({
        next: (orders) => {
          observer.next(orders);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }
}
