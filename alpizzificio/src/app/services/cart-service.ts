
import { Injectable } from '@angular/core';
import { Pizza } from './product';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private items: CartItem[] = [];
  private items$ = new BehaviorSubject<CartItem[]>([]);

  addToCart(pizza: Pizza | number) {
    const found = this.items.find(item => item.pizza.id === (typeof pizza === 'number' ? pizza : pizza.id));
    if (found) {
      found.quantity++;
    } else {
      this.items.push({ pizza: typeof pizza === 'number' ? { id: pizza } as Pizza : pizza, quantity: 1, note: "" });
    }
    this.items$.next([...this.items]);
  }

  removeFromCart(pizzaId: number) {
    this.items = this.items.filter(item => item.pizza.id !== pizzaId);
    this.items$.next([...this.items]);
  }

  decrementQuantity(pizzaId: number) {
    const found = this.items.find(item => item.pizza.id === pizzaId);
    if (found) {
      found.quantity--;
      if (found.quantity <= 0) {
        this.removeFromCart(pizzaId);
      } else {
        this.items$.next([...this.items]);
      }
    }
  }

  getItems(): Observable<CartItem[]> {
    return this.items$.asObservable();
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.pizza.price * item.quantity, 0);
  }

  clearCart() {
    this.items = [];
    this.items$.next([]);
  }
}

export interface CartItem {
  pizza: Pizza;
  quantity: number;
  note: string;
}

export interface cart{
  cartItem: CartItem[]
  note: string;
  indirizzo: string;
  orario:string;
}