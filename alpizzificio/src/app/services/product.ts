import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, catchError, map } from 'rxjs';
import { FirestoreService } from './firestore.service';

export interface Pizza {
  id: number | string;
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
  id: number | string;
  nome: string;
  categoria: string;
  prezzo: number;
}

@Injectable({
  providedIn: 'root',
})
export class Product {
  private http = inject(HttpClient);
  private firestoreService = inject(FirestoreService);
  private menuUrl = 'menu.json';
  private ingredientiUrl = 'ingredienti.json';

  /**
   * Recupera le pizze da Firestore.
   * Se la collezione è vuota, carica da menu.json e migra automaticamente i dati su Firestore.
   */
  getPizzas(): Observable<Pizza[]> {
    return this.firestoreService.getMenuItems().pipe(
      switchMap(items => {
        if (items.length === 0) {
          
          return this.http.get<Pizza[]>(this.menuUrl).pipe(
            switchMap(jsonPizzas => 
              this.firestoreService.seedMenu(jsonPizzas).pipe(
                map(() => jsonPizzas)
              )
            ),
            catchError(err => {
              console.error('Errore durante il recupero/seeding di menu.json:', err);
              return of([]);
            })
          );
        }
        
        return of(items);
      }),
      catchError(err => {
        console.warn('Errore Firestore getMenuItems, fallback su menu.json:', err);
        return this.http.get<Pizza[]>(this.menuUrl);
      })
    );
  }

  /**
   * Recupera gli ingredienti da Firestore.
   * Se la collezione è vuota, carica da ingredienti.json e migra automaticamente i dati su Firestore.
   */
  getIngredients(): Observable<Ingredient[]> {
    return this.firestoreService.getIngredients().pipe(
      switchMap(items => {
        if (items.length === 0) {
          
          return this.http.get<Ingredient[]>(this.ingredientiUrl).pipe(
            switchMap(jsonIngredients =>
              this.firestoreService.seedIngredients(jsonIngredients).pipe(
                map(() => jsonIngredients)
              )
            ),
            catchError(err => {
              console.error('Errore durante il recupero/seeding di ingredienti.json:', err);
              return of([]);
            })
          );
        }
        
        return of(items);
      }),
      catchError(err => {
        console.warn('Errore Firestore getIngredients, fallback su ingredienti.json:', err);
        return this.http.get<Ingredient[]>(this.ingredientiUrl);
      })
    );
  }

  /**
   * Forza il popolamento/ri-sincronizzazione iniziale di Firestore dai file JSON locali.
   */
  seedDatabase(): Observable<void> {
    return this.http.get<Pizza[]>(this.menuUrl).pipe(
      switchMap(pizzas => this.firestoreService.seedMenu(pizzas)),
      switchMap(() => this.http.get<Ingredient[]>(this.ingredientiUrl)),
      switchMap(ingredients => this.firestoreService.seedIngredients(ingredients))
    );
  }
}
