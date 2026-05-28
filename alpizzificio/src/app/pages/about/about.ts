import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements OnInit, OnDestroy {
  slides = ['/bancone.jpg', '/pizza.jpg', '/inforna.jpg'];
  currentSlide = 0;
  private autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private title: Title, private meta: Meta, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.title.setTitle('Chi Siamo – Al Pizzificio 77 | Aymavilles, Valle d\'Aosta');
    this.meta.updateTag({ name: 'description', content: 'Scopri la storia di Al Pizzificio 77: Federico e Ornela portano ad Aymavilles una pizza artigianale con impasto d\'autore, cottura avanzata e consegna calda con la Red Box.' });
    this.meta.updateTag({ property: 'og:title', content: 'Chi Siamo – Al Pizzificio 77' });
    this.meta.updateTag({ property: 'og:description', content: 'La storia di Al Pizzificio 77 ad Aymavilles: passione, qualità e innovazione per portarvi la pizza perfetta a casa.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.alpizzificio77.it/chi-siamo' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
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
