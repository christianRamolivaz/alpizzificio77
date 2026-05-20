import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements OnInit {
  constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('Chi Siamo – Al Pizzificio 77 | Aymavilles, Valle d\'Aosta');
    this.meta.updateTag({ name: 'description', content: 'Scopri la storia di Al Pizzificio 77: Federico e Ornela portano ad Aymavilles una pizza artigianale con impasto d\'autore, cottura avanzata e consegna calda con la Red Box.' });
    this.meta.updateTag({ property: 'og:title', content: 'Chi Siamo – Al Pizzificio 77' });
    this.meta.updateTag({ property: 'og:description', content: 'La storia di Al Pizzificio 77 ad Aymavilles: passione, qualità e innovazione per portarvi la pizza perfetta a casa.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.alpizzificio77.it/chi-siamo' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
  }
}
