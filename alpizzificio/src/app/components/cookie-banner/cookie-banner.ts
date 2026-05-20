import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../services/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.css',
})
export class CookieBannerComponent {
  protected consent = inject(CookieConsentService);

  /** Mostra il pannello di personalizzazione */
  showCustomPanel = signal(false);

  /** Stato locale del pannello custom */
  analyticsChoice = signal(false);
  marketingChoice = signal(false);

  acceptAll(): void {
    this.consent.acceptAll();
  }

  rejectAll(): void {
    this.consent.rejectAll();
  }

  openCustom(): void {
    this.analyticsChoice.set(this.consent.consent().analytics);
    this.marketingChoice.set(this.consent.consent().marketing);
    this.showCustomPanel.set(true);
  }

  saveCustom(): void {
    this.consent.saveCustom(this.analyticsChoice(), this.marketingChoice());
    this.showCustomPanel.set(false);
  }

  cancelCustom(): void {
    this.showCustomPanel.set(false);
  }
}
