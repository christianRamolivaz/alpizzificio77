import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { CartItem } from './cart-service';

/**
 * Servizio per la gestione dell'invio degli ordini.
 * Utilizza EmailJS per inviare il messaggio direttamente alla pizzeria.
 */
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  // Credenziali EmailJS (da configurare nel tuo account)
  private readonly PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Da configurare
  private readonly SERVICE_ID = 'YOUR_SERVICE_ID'; // Da configurare
  private readonly TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Da configurare
  private readonly PIZZERIA_EMAIL = 'pizzeria@example.com'; // Email della pizzeria

  constructor() {
    // Inizializza EmailJS
    emailjs.init(this.PUBLIC_KEY);
  }

  /**
   * Formatta il messaggio dell'ordine
   */
  private formatOrderMessage(items: CartItem[], nomeCliente = 'MARIO ROSSI', orario = '19/19:30'): string {
    const righe = items.map(item => `${item.pizza.name} x${item.quantity}`);
    return [
      `DA: ${nomeCliente}:`,
      ...righe,
      `orario indicato: ${orario}`
    ].join('\n');
  }

  /**
   * Invia l'ordine alla pizzeria via email
   */
  async sendOrder(items: CartItem[], nomeCliente = 'MARIO ROSSI', orario = '19/19:30'): Promise<boolean> {
    try {
      const messaggioOrdine = this.formatOrderMessage(items, nomeCliente, orario);
      
      // Parametri da inviare al template EmailJS
      const templateParams = {
        to_email: this.PIZZERIA_EMAIL,
        subject: `Nuovo ordine - ${nomeCliente}`,
        message: messaggioOrdine,
        client_name: nomeCliente,
        client_time: orario
      };

      // Invia l'email
      const response = await emailjs.send(this.SERVICE_ID, this.TEMPLATE_ID, templateParams);
      
      if (response.status === 200) {
        console.log('Ordine inviato con successo!', response);
        return true;
      }
    } catch (error) {
      console.error('Errore nell\'invio dell\'ordine:', error);
    }
    return false;
  }
}
