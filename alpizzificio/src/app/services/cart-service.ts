
import { Injectable } from '@angular/core';
import { Pizza } from './product';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  /** Identificatore univoco della riga: permette più righe per lo stesso prodotto con personalizzazioni diverse. */
  cartItemId: string;
  pizza: Pizza;
  quantity: number;
  /** Ingredienti base rimossi rispetto alla ricetta originale. */
  removedIngredients: string[];
  /** Ingredienti aggiuntivi richiesti dal cliente. */
  addedIngredients: string[];
  /** Nota libera per questa specifica riga. */
  note: string;
  /** Costo aggiuntivo degli ingredienti extra (somma dei prezzi degli ingredienti aggiunti). */
  extraPrice: number;
}

export interface CartOrder {
  cartItems: CartItem[];
  note: string;
  indirizzo: string;
  orario: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private items: CartItem[] = [];
  private items$ = new BehaviorSubject<CartItem[]>([]);

  /**
   * Aggiunge sempre una nuova riga al carrello, anche se il prodotto è già presente.
   * Ogni riga mantiene una propria personalizzazione.
   */
  addToCart(
    pizza: Pizza,
    customization?: { addedIngredients?: string[]; removedIngredients?: string[]; note?: string; extraPrice?: number }
  ): string {
    const cartItemId = crypto.randomUUID();
    this.items.push({
      cartItemId,
      pizza,
      quantity: 1,
      addedIngredients: customization?.addedIngredients ?? [],
      removedIngredients: customization?.removedIngredients ?? [],
      note: customization?.note ?? '',
      extraPrice: customization?.extraPrice ?? 0,
    });
    this.items$.next([...this.items]);
    return cartItemId;
  }

  incrementQuantity(cartItemId: string) {
    const found = this.items.find(item => item.cartItemId === cartItemId);
    if (found) {
      found.quantity++;
      this.items$.next([...this.items]);
    }
  }

  decrementQuantity(cartItemId: string) {
    const found = this.items.find(item => item.cartItemId === cartItemId);
    if (found) {
      found.quantity--;
      if (found.quantity <= 0) {
        this.removeFromCart(cartItemId);
      } else {
        this.items$.next([...this.items]);
      }
    }
  }

  removeFromCart(cartItemId: string) {
    this.items = this.items.filter(item => item.cartItemId !== cartItemId);
    this.items$.next([...this.items]);
  }

  getItems(): Observable<CartItem[]> {
    return this.items$.asObservable();
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.pizza.price + item.extraPrice) * item.quantity, 0);
  }

  clearCart() {
    this.items = [];
    this.items$.next([]);
  }

  /**
   * Aggiunge una pizza senza personalizzazione:
   * se esiste già una riga non personalizzata per quella pizza, incrementa la quantità;
   * altrimenti crea una nuova riga.
   */
  addOrIncrementPlain(pizza: Pizza): void {
    const existing = this.items.find(
      item => item.pizza.id === pizza.id && !isCustomized(item)
    );
    if (existing) {
      existing.quantity++;
      this.items$.next([...this.items]);
    } else {
      this.addToCart(pizza);
    }
  }
}

/** Restituisce true se l'elemento ha almeno una personalizzazione (ingredienti o nota). */
export function isCustomized(item: CartItem): boolean {
  return (
    item.addedIngredients.length > 0 ||
    item.removedIngredients.length > 0 ||
    !!item.note
  );
}

/** Costruisce la stringa della riga "note" unendo note libere e ingredienti rimossi. */
export function buildNoteText(item: CartItem): string {
  const parts: string[] = [];
  if (item.note) parts.push(item.note);
  for (const ing of item.removedIngredients) parts.push(`NO ${ing}`);
  return parts.join(', ');
}