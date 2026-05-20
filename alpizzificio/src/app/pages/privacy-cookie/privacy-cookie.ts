import { Component, inject } from '@angular/core';
import { CookieConsentService } from '../../services/cookie-consent.service';

@Component({
  selector: 'app-privacy-cookie',
  imports: [],
  templateUrl: './privacy-cookie.html',
  styleUrl: './privacy-cookie.css',
})
export class PrivacyCookie {
  protected consent = inject(CookieConsentService);

  resetConsent(): void {
    this.consent.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get currentStatus(): string {
    const s = this.consent.consent().status;
    if (s === 'accepted') {
      const c = this.consent.consent();
      const parts = ['tecnici'];
      if (c.analytics) parts.push('analitici');
      if (c.marketing) parts.push('marketing');
      return 'Accettati: ' + parts.join(', ');
    }
    if (s === 'rejected') return 'Solo cookie tecnici (non necessari rifiutati)';
    return 'Non ancora espressa';
  }
}
