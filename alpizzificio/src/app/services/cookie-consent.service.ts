import { Injectable, signal, computed } from '@angular/core';

export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

export interface CookieConsent {
  status: ConsentStatus;
  /** Cookie strettamente necessari (sempre true) */
  necessary: boolean;
  /** Cookie analitici (es. Google Analytics) */
  analytics: boolean;
  /** Cookie di marketing */
  marketing: boolean;
  /** Timestamp in ms */
  timestamp: number;
}

const STORAGE_KEY = 'alpizzificio_cookie_consent';

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly _consent = signal<CookieConsent>(this.load());

  /** Consenso corrente */
  readonly consent = this._consent.asReadonly();

  /** true se il banner deve essere mostrato */
  readonly showBanner = computed(() => this._consent().status === 'pending');

  /** true se i cookie analitici sono stati accettati */
  readonly analyticsEnabled = computed(
    () => this._consent().status === 'accepted' && this._consent().analytics
  );

  /** true se i cookie di marketing sono stati accettati */
  readonly marketingEnabled = computed(
    () => this._consent().status === 'accepted' && this._consent().marketing
  );

  /** Accetta tutti i cookie */
  acceptAll(): void {
    this.save({ status: 'accepted', necessary: true, analytics: true, marketing: true });
  }

  /** Rifiuta i cookie non necessari */
  rejectAll(): void {
    this.save({ status: 'rejected', necessary: true, analytics: false, marketing: false });
  }

  /** Salva una scelta personalizzata */
  saveCustom(analytics: boolean, marketing: boolean): void {
    this.save({ status: 'accepted', necessary: true, analytics, marketing });
  }

  /** Reimposta il consenso (mostra di nuovo il banner) */
  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._consent.set({ status: 'pending', necessary: true, analytics: false, marketing: false, timestamp: 0 });
  }

  private save(partial: Omit<CookieConsent, 'timestamp'>): void {
    const consent: CookieConsent = { ...partial, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    this._consent.set(consent);
  }

  private load(): CookieConsent {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CookieConsent;
        // Se il consenso ha più di 12 mesi, lo resettiamo
        const twelveMonths = 365 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < twelveMonths) {
          return parsed;
        }
      }
    } catch {
      // localStorage non disponibile o JSON corrotto
    }
    return { status: 'pending', necessary: true, analytics: false, marketing: false, timestamp: 0 };
  }
}
