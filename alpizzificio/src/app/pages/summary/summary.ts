import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { firstValueFrom, map, take } from 'rxjs';
import { CartItem, CartService, isCustomized, buildNoteText } from '../../services/cart-service';
import { AuthService } from '../../services/auth.service';
import { OrderStorageService } from '../../services/order-storage.service';
import { FirestoreService } from '../../services/firestore.service';
import { OpeningDay } from '../../models/index';

@Component({
  selector: 'app-summary',
  imports: [AsyncPipe, CurrencyPipe, CommonModule, FormsModule],
  templateUrl: './summary.html',
  styleUrl: './summary.css',
})
export class Summary implements OnInit {
  private cartService = inject(CartService);
  private titleService = inject(Title);
  private meta = inject(Meta);
  private authService = inject(AuthService);
  private orderStorageService = inject(OrderStorageService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  todayOpening = signal<OpeningDay | null>(null);
  isLoadingOpening = signal<boolean>(true);

  isClosedToday = computed(() => {
    const opening = this.todayOpening();
    return opening ? !opening.isOpen : false;
  });

  isWeekendToday = computed(() => {
    const opening = this.todayOpening();
    return opening ? opening.isWeekend : false;
  });

  currentDayName = computed(() => {
    return this.todayOpening()?.dayName ?? '';
  });

  ngOnInit(): void {
    this.titleService.setTitle('Riepilogo Ordine \u2013 Al Pizzificio 77');
    this.meta.updateTag({ name: 'description', content: 'Controlla il tuo ordine e completa l\'acquisto su Al Pizzificio 77. Pizza artigianale con consegna calda a domicilio.' });
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    const todayOfWeek = new Date().getDay();
    this.firestoreService.getOpeningDay(todayOfWeek).subscribe({
      next: (opening) => {
        this.todayOpening.set(opening);
        this.isLoadingOpening.set(false);
      },
      error: (err) => {
        console.warn('Errore lettura orari dal database:', err);
        this.isLoadingOpening.set(false);
      }
    });
  }

  indirizzo = signal("");
  fasciaOraria = signal("");
  notesExpanded = signal(false);
  note = signal("");
  nominativo = signal("");
  dataConsegna = signal(new Date());
  ritiraDaNoi = signal(false);
  metodoPagamento = signal<'pos' | 'contanti' | null>(null);
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  user$ = this.authService.user$;

  // Fasce orarie normali (dalle 18:00 alle 21:30 di mezz'ora in mezz'ora)
  readonly FASCE_ORARIE_NORMALI = [
    '18:00/18:30', '18:30/19:00', '19:00/19:30', '19:30/20:00', '20:00/20:30', '20:30/21:00', '21:00/21:30'
  ];

  // Fasce orarie weekend (dalle 18:00 alle 22:30 di mezz'ora in mezz'ora)
  readonly FASCE_ORARIE_WEEKEND = [
    '18:00/18:30', '18:30/19:00', '19:00/19:30', '19:30/20:00', '20:00/20:30', '20:30/21:00', '21:00/21:30', '21:30/22:00', '22:00/22:30'
  ];

  cartItems$ = this.cartService.getItems();
  totale$ = this.cartItems$.pipe(
    map((items: CartItem[]) => items.reduce((sum: number, item: CartItem) => {
      const basePrice = item.isBaby && item.pizza.importoBaby ? item.pizza.importoBaby : item.pizza.price;
      return sum + ((basePrice + item.extraPrice) * item.quantity);
    }, 0))
  );

  get orariDisponibili(): Array<{ orario: string; disabilitato: boolean }> {
    if (this.isClosedToday()) {
      return [];
    }

    const fasce = this.isWeekendToday() ? this.FASCE_ORARIE_WEEKEND : this.FASCE_ORARIE_NORMALI;
    const now = new Date();
    const oraAttuale = now.getHours();
    const minutiAttuali = now.getMinutes();

    return fasce.map(orario => {
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

  get allSlotsPassed(): boolean {
    const orari = this.orariDisponibili;
    return orari.length > 0 && orari.every(o => o.disabilitato);
  }

  onRitiraDaNoiChange(val: boolean) {
    this.ritiraDaNoi.set(val);
    if (val) this.indirizzo.set('');
  }

  onMetodoPagamentoChange(val: 'pos' | 'contanti') {
    this.metodoPagamento.set(val);
  }

  toggleNotesPanel() {
    this.notesExpanded.update(val => !val);
  }

  incrementQuantity(cartItemId: string) {
    this.cartService.incrementQuantity(cartItemId);
  }

  decrementQuantity(cartItemId: string) {
    this.cartService.decrementQuantity(cartItemId);
  }

  removeItem(cartItemId: string) {
    this.cartService.removeFromCart(cartItemId);
  }

  isCustomized(item: CartItem): boolean { return isCustomized(item); }
  getNoteText(item: CartItem): string { return buildNoteText(item); }

  /**
   * Salva l'ordine nel database Firestore (richiede login)
   */
  saveOrder() {
    if (!this.validateForm()) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    const deliveryAddress = this.ritiraDaNoi() ? 'Ritiro in sede' : this.indirizzo();
    const notes = `Nominativo: ${this.nominativo()}\nOrario: ${this.fasciaOraria()}\nPagamento: ${this.metodoPagamento() === 'pos' ? 'POS' : 'Contanti'}\n${this.note()}`;

    this.orderStorageService.saveOrderFromCart(deliveryAddress, notes).subscribe({
      next: (orderId) => {
        this.isSaving.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(`Errore nel salvataggio: ${err.message}`);
        console.error('Save order error:', err);
      }
    });
  }

  /**
   * Salva sempre l'ordine, anche se l'utente non è autenticato.
   * In tal caso il campo userId viene lasciato a null.
   */
  saveOrLoginThenSave() {
    this.saveOrder();
  }

  private validateForm(): boolean {
    if (this.isClosedToday()) {
      alert('Ci dispiace, ma oggi la pizzeria è chiusa. Non è possibile effettuare ordini.');
      return false;
    }
    if (this.allSlotsPassed) {
      alert('Ci dispiace, tutte le fasce orarie per la giornata di oggi sono terminate.');
      return false;
    }
    if (!this.nominativo().trim()) {
      alert('Per favore, inserisci il nominativo.');
      return false;
    }
    if (!this.ritiraDaNoi() && !this.indirizzo().trim()) {
      alert('Per favore, inserisci un indirizzo di consegna o seleziona "Ritiro in sede".');
      return false;
    }
    if (!this.fasciaOraria()) {
      alert('Per favore, seleziona una fascia oraria.');
      return false;
    }
    if (!this.metodoPagamento()) {
      alert('Per favore, seleziona almeno un metodo di pagamento: POS o contanti.');
      return false;
    }
    return true;
  }

  static formatOrderMessage(
    items: CartItem[],
    fasciaOraria: string,
    indirizzo: string,
    note: string,
    nominativo: string = "",
    ritiraDaNoi: boolean = false,
    metodoPagamento: 'pos' | 'contanti' | null = null
  ): string {
    const righe = items.map(item => {
      const sizeSuffix = item.isBaby ? " (Baby)" : "";
      let riga = ` - ${item.quantity}x ${item.pizza.name}${sizeSuffix}`;
      if (item.addedIngredients.length > 0) riga += `\n   aggiunte: ${item.addedIngredients.join(', ')}`;
      const noteLine = buildNoteText(item);
      if (noteLine) riga += `\n   note: ${noteLine}`;
      return riga;
    });
    const messageParts = [];
    messageParts.push(`Ciao! vorrei effettuare il seguente ordine:`);
    if (nominativo.trim().length > 0) {
      messageParts.push(`Nominativo: ${nominativo}`);
    }
    messageParts.push(...righe);
    messageParts.push(`Orario indicato: ${fasciaOraria}`);
    messageParts.push(`Pagamento: ${metodoPagamento === 'pos' ? 'POS' : metodoPagamento === 'contanti' ? 'Contanti' : 'Non specificato'}`);
    if (ritiraDaNoi) {
      messageParts.push(`Ritiro in sede 🏠`);
    } else {
      messageParts.push(`Presso: ${indirizzo}`);
    }
    if (note.length > 0) messageParts.push(`Note: ${note}`);
    return messageParts.join('\n');
  }

  async sendViaWhatsApp() {
    if (this.isClosedToday()) {
      alert('Ci dispiace, ma oggi la pizzeria è chiusa. Non è possibile effettuare ordini.');
      return;
    }
    if (!(await this.validateCart())) return;
    if (!this.validateForm()) return;

    if (!this.metodoPagamento()) {
      alert('Seleziona almeno uno dei due metodi di pagamento.');
      return;
    }

    const items = await this.getCartItems();
    const msg = Summary.formatOrderMessage(
      items,
      this.fasciaOraria(),
      this.indirizzo(),
      this.note(),
      this.nominativo(),
      this.ritiraDaNoi(),
      this.metodoPagamento()
    );

    // const conferma = window.confirm('Inviare l\'ordine via WhatsApp?');
    // if (true) {
      const deliveryAddress = this.ritiraDaNoi() ? 'Ritiro in sede' : this.indirizzo();
      const notes = `Nominativo: ${this.nominativo()}\nOrario: ${this.fasciaOraria()}\nPagamento: ${this.metodoPagamento() === 'pos' ? 'POS' : 'Contanti'}\n${this.note()}`;

      try {
        await firstValueFrom(this.orderStorageService.saveOrderFromCart(deliveryAddress, notes));
      } catch (err) {
        console.error('Errore durante il salvataggio dell\'ordine prima di WhatsApp:', err);
        window.alert('Errore durante il salvataggio dell\'ordine. Riprova.');
        return;
      }

      const numeroWhatsApp = '+393520244094';
      const messaggioEncodato = encodeURIComponent(msg);
      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${messaggioEncodato}`;
      window.open(urlWhatsApp, '_blank');
      window.alert('✓ Assiccurarsi di aver inviato l\'ordine via whatsapp, grazie e a presto!');
    // }
  }

  private async validateCart(): Promise<boolean> {
    const items = await this.getCartItems();
    if (items.length === 0) {
      window.alert('Il carrello è vuoto!');
      return false;
    }
    return true;
  }

  private getCartItems(): Promise<CartItem[]> {
    return this.cartItems$.pipe(map(x => x ?? []), take(1)).toPromise() as Promise<CartItem[]>;
  }
}
