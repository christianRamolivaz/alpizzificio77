import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Menu } from "../menu/menu";
import { FirestoreService } from '../../services/firestore.service';
import { OpeningDay } from '../../models/index';

@Component({
  selector: 'app-home',
  imports: [Menu],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  realSlides = ['/graffito.jpeg', '/bancone.jpg', '/pizza.jpg', '/inforna.jpg'];
  // Clone last at start and first at end for infinite loop
  displaySlides = [this.realSlides[this.realSlides.length - 1], ...this.realSlides, this.realSlides[0]];
  currentSlide = 1; // start at first real slide (index 1)
  transitioning = true;
  days: OpeningDay[] = [];
  todayOpening: OpeningDay | null = null;
  openingStatusLabel = 'Stato apertura';
  closureMessage = 'Oggi siamo aperti e ti aspettiamo!';

  private autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private title: Title,
    private meta: Meta,
    private ngZone: NgZone,
    private firestoreService: FirestoreService
  ) {}

  get activeRealIndex(): number {
    return (this.currentSlide - 1 + this.realSlides.length) % this.realSlides.length;
  }

  private updateClosureState(): void {
    const todayOfWeek = new Date().getDay();
    this.todayOpening = this.days.find(day => day.dayOfWeek === todayOfWeek) ?? null;

    if (!this.days.length) {
      this.openingStatusLabel = 'Stato apertura';
      this.closureMessage = 'Stato apertura non disponibile al momento.';
      return;
    }

    if (this.todayOpening && !this.todayOpening.isOpen) {
      const closedDays = this.days
        .filter(day => !day.isOpen)
        .map(day => day.dayName)
        .join(', ');

      this.openingStatusLabel = 'Chiusura odierna';
      this.closureMessage = `Oggi siamo chiusi${this.todayOpening.dayName ? `: ${this.todayOpening.dayName}` : ''}.`;
      if (closedDays) {
        this.closureMessage += ` Giorni di chiusura: ${closedDays}.`;
      }
      return;
    }

    this.openingStatusLabel = 'Stato apertura';
    this.closureMessage = 'Oggi siamo aperti e ti aspettiamo!';
  }

  ngOnInit(): void {
    this.title.setTitle('Al Pizzificio 77 – Pizza Artigianale ad Aymavilles, Valle d\'Aosta');
    this.meta.updateTag({ name: 'description', content: 'Al Pizzificio 77 di Aymavilles: pizza artigianale con impasto a lievitazione lenta, farina Tipo 1 macinata a pietra e consegna calda a domicilio con la Red Box.' });
    this.meta.updateTag({ property: 'og:title', content: 'Al Pizzificio 77 – Pizza Artigianale ad Aymavilles' });
    this.meta.updateTag({ property: 'og:description', content: 'Pizza artigianale con farina Tipo 1 macinata a pietra e lievitazione lenta. Consegna calda a domicilio con la Red Box.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.alpizzificio77.it/' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    this.days = this.firestoreService.DEFAULT_OPENING_DAYS;
    this.updateClosureState();

    this.firestoreService.getOpeningDays().subscribe({
      next: (openingDays) => {
        this.days = openingDays;
        this.updateClosureState();
      },
      error: (err) => {
        console.warn('Errore caricamento apertura oggi:', err);
      }
    });

    setTimeout(() => this.startAutoPlay(), 0);
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  nextSlide(): void {
    this.transitioning = true;
    this.currentSlide++;
    if (this.currentSlide === this.displaySlides.length - 1) {
      // On clone of first: after transition, jump to real first
      setTimeout(() => {
        this.transitioning = false;
        this.currentSlide = 1;
        setTimeout(() => this.transitioning = true, 20);
      }, 500);
    }
  }

  prevSlide(): void {
    this.transitioning = true;
    this.currentSlide--;
    if (this.currentSlide === 0) {
      // On clone of last: after transition, jump to real last
      setTimeout(() => {
        this.transitioning = false;
        this.currentSlide = this.realSlides.length;
        setTimeout(() => this.transitioning = true, 20);
      }, 500);
    }
  }

  goToSlide(index: number): void {
    this.transitioning = true;
    this.currentSlide = index + 1;
    this.restartAutoPlay();
  }

  onManualNav(direction: 'prev' | 'next'): void {
    direction === 'next' ? this.nextSlide() : this.prevSlide();
    this.restartAutoPlay();
  }

  private startAutoPlay(): void {
    this.ngZone.runOutsideAngular(() => {
      this.autoPlayInterval = setInterval(() => {
        this.ngZone.run(() => this.nextSlide());
      }, 4000);
    });
  }

  private stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  private restartAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
