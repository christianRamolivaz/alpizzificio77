import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Menu } from "../menu/menu";

@Component({
  selector: 'app-home',
  imports: [Menu],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('Al Pizzificio 77 – Pizza Artigianale ad Aymavilles, Valle d\'Aosta');
    this.meta.updateTag({ name: 'description', content: 'Al Pizzificio 77 di Aymavilles: pizza artigianale con impasto a lievitazione lenta, farina Tipo 1 macinata a pietra e consegna calda a domicilio con la Red Box.' });
    this.meta.updateTag({ property: 'og:title', content: 'Al Pizzificio 77 – Pizza Artigianale ad Aymavilles' });
    this.meta.updateTag({ property: 'og:description', content: 'Pizza artigianale con farina Tipo 1 macinata a pietra e lievitazione lenta. Consegna calda a domicilio con la Red Box.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.alpizzificio77.it/' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
  }
}
