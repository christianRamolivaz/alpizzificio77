import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Pizza {
  id: number;
  name: string;
  description: string;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class Product {
  private http = inject(HttpClient);
  private menuUrl = 'menu.json'; // Path relativo alla cartella public/assets (Angular serve i file statici da public)

  getPizzas(): Observable<Pizza[]> {
    return this.http.get<Pizza[]>(this.menuUrl);
  }
}
