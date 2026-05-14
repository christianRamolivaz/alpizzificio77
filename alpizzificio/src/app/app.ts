import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { CartComponent } from './components/cart/cart';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, CartComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('alpizzificio77');
}
