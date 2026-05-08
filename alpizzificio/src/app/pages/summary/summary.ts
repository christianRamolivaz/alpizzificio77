import { Component, inject, signal } from '@angular/core';
import { CartItem, CartService } from '../../services/cart-service';
import { Product, Pizza } from '../../services/product';
import { OrderService } from '../../services/order-service';
import { map, take } from 'rxjs';
import { AsyncPipe, CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-summary',
  imports: [AsyncPipe, CurrencyPipe, CommonModule, FormsModule],
  templateUrl: './summary.html',
  styleUrl: './summary.css',
})
export class Summary {
  private productService = inject(Product);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);

  indirizzo = signal("");
  fasciaOraria = signal("");
  notesExpanded = signal(false);
  note = signal("");

  private readonly ORARI_BASE = [
    '19:00/19:30', '19:30/20:00', '20:00/20:30', '20:30/21:00', '21:00/21:30', '21:30/22:00'
  ];

  cartItems$ = this.cartService.getItems();
  totale$ = this.cartItems$.pipe(
    map((items: CartItem[]) => items.reduce((sum: number, item: CartItem) => sum + (item.pizza.price * item.quantity), 0))
  );

  

  get orariDisponibili(): Array<{ orario: string; disabilitato: boolean }> {
    const now = new Date();
    const oraAttuale = now.getHours();
    const minutiAttuali = now.getMinutes();

    return this.ORARI_BASE.map(orario => {
      // Estrai l'ora di inizio (prima dello slash)
      const oraInizio = orario.split('/')[0];
      const [ore, minuti] = oraInizio.split(':').map(Number);
      const oraInMinuti = ore * 60 + minuti;
      const oraAttualInMinuti = oraAttuale * 60 + minutiAttuali;

      return {
        orario,
        disabilitato: oraAttualInMinuti >= oraInMinuti
      };
    });
  }

  toggleNotesPanel() {
    this.notesExpanded.update(val => !val);
  }

  incrementQuantity(pizzaId: number) {
    this.cartService.addToCart(this.getCartItemPizza(pizzaId)!);
  }

  decrementQuantity(pizzaId: number) {
    this.cartService.decrementQuantity(pizzaId);
  }

  removeItem(pizzaId: number) {
    this.cartService.removeFromCart(pizzaId);
  }

  private getCartItemPizza(pizzaId: number): Pizza | undefined {
    // Questo è un helper per ottenere l'oggetto Pizza da un ID
    // Useremo una variabile locale nel componente
    let pizza: Pizza | undefined;
    this.cartItems$.pipe(take(1)).subscribe(items => {
      const item = items.find(i => i.pizza.id === pizzaId);
      if (item) {
        pizza = item.pizza;
      }
    });
    return pizza;
  }
  /**
   * Restituisce un messaggio formattato per l'ordine da inviare.
   * @param items Array di CartItem
   * @param fasciaOraria Fascia oraria dell'ordine
   * @param indirizzo Indirizzo di consegna
   */
  static formatOrderMessage(items: CartItem[], fasciaOraria: string, indirizzo: string, note: string): string {
    const righe = items.map(item => `${item.pizza.name} ${item.quantity}`);
    return [
      `Ciao! vorrei effettuare il seguente ordine:`,
      ...righe,
      `orario indicato: ${fasciaOraria}`,
      `presso: ${indirizzo}`,
      note.length > 0 ? (`Note: `+note)
      : ``
    ].join('\n');
  }
  // Invia l'ordine via WhatsApp
  async sendViaWhatsApp() {
    if (!(await this.validateCart())) return;

    const items = await this.getCartItems();
    const msg = Summary.formatOrderMessage(items, this.fasciaOraria(), this.indirizzo(), this.note());
    
    const conferma = window.confirm('Inviare l\'ordine via WhatsApp?');
    if (conferma) {
      const numeroWhatsApp = '3520244094';
      const messaggioEncodato = encodeURIComponent(msg);
      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${messaggioEncodato}`;
      window.open(urlWhatsApp, '_blank');
      window.alert('✓ Ordine inviato a presto!');
      this.cartService.clearCart();
    }
  }

  // Invia l'ordine via Email
  async sendViaEmail() {
    if (!(await this.validateCart())) return;

    const items = await this.getCartItems();
    
    const conferma = window.confirm('Inviare l\'ordine via email?');
    if (conferma) {
      const invioRiuscito = await this.orderService.sendOrder(items);
      
      if (invioRiuscito) {
        window.alert('✓ Ordine inviato via email!');
        this.cartService.clearCart();
      } else {
        window.alert('✗ Errore nell\'invio dell\'ordine. Riprova più tardi.');
      }
    }
  }

  // Chiama la pizzeria
  async callPizzeria() {
    if (!(await this.validateCart())) return;

    const numeroTelefono = '3514964337';
    const conferma = window.confirm('Chiamare la pizzeria?');
    if (conferma) {
      window.location.href = `tel:+39${numeroTelefono}`;
      window.alert('✓ Chiamata in corso...');
      this.cartService.clearCart();
    }
  }

  // Helper: valida il carrello
  private async validateCart(): Promise<boolean> {
    const items = await this.getCartItems();
    if (items.length === 0) {
      window.alert('Il carrello è vuoto!');
      return false;
    }
    return true;
  }

  // Helper: recupera gli elementi del carrello
  private getCartItems(): Promise<CartItem[]> {
    return this.cartItems$.pipe(map(x => x ?? []), take(1)).toPromise() as Promise<CartItem[]>;
  }
}
