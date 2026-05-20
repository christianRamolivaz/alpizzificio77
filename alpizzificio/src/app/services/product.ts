import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Pizza {
  id: number;
  category: string;
  name: string;
  description: string;
  baseIngredients: string[];
  price: number;
  importoBaby?: number | null;
  isBaby: boolean;
}

export type MenuItem = Pizza;

export interface Ingredient {
  id: number;
  nome: string;
  categoria: string;
  prezzo: number;
}

@Injectable({
  providedIn: 'root',
})
export class Product {
  private http = inject(HttpClient);
  private menuUrl = 'menu.json';
  private ingredientiUrl = 'ingredienti.json';

  getPizzas(): Observable<Pizza[]> {
    return this.http.get<Pizza[]>(this.menuUrl);
  }

  getIngredients(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.ingredientiUrl);
  }
}
