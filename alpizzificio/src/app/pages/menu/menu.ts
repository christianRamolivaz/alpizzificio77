
import { CurrencyPipe, CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { CartService } from '../../services/cart-service';
import { Ingredient, Pizza, Product } from '../../services/product';

interface MenuCategory {
  category: string;
  items: Pizza[];
}

export interface CustomizationState {
  pizza: Pizza;
  removedIngredients: Set<string>;
  addedIngredients: string[];
  note: string;
  newIngredient: string;
}

/** Categorie per cui non ha senso la personalizzazione ingredienti */
const NO_CUSTOMIZE_CATEGORIES = new Set(['Bevande', 'Dolci', 'Antipasti e Fritti', 'Calzoncini Fritti Ripieni']);

@Component({
  selector: 'app-menu',
  imports: [CurrencyPipe, CommonModule, RouterLink, FormsModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  private productService = inject(Product);
  private cartService = inject(CartService);

  constructor(private titleService: Title, private meta: Meta) {
    this.titleService.setTitle('Menu Pizze – Al Pizzificio 77 | Aymavilles');
    this.meta.updateTag({ name: 'description', content: 'Scopri il menu di Al Pizzificio 77: pizze artigianali, antipasti, dolci e bevande. Ordina online con consegna calda a domicilio ad Aymavilles e dintorni.' });
    this.meta.updateTag({ property: 'og:title', content: 'Menu – Al Pizzificio 77' });
    this.meta.updateTag({ property: 'og:description', content: 'Sfoglia le nostre pizze artigianali e ordina online. Consegna calda a domicilio con la Red Box.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.alpizzificio77.it/menu' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    inject(ActivatedRoute).queryParamMap.subscribe(params => {
      const cat = params.get('categoria');
      this.selectedCategories.set(cat ? new Set([cat]) : new Set());
    });
  }

  /** Signal derivato dall'observable HTTP – si aggiorna automaticamente */
  allCategories = toSignal(
    this.productService.getPizzas().pipe(
      map(items => {
        const groups: Record<string, Pizza[]> = {};
        for (const item of items) {
          const cat = item.category ?? 'Altro';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
        }
        return Object.entries(groups).map(
          ([category, list]) => ({ category, items: list } as MenuCategory)
        );
      })
    ),
    { initialValue: [] as MenuCategory[] }
  );

  /** Tutti gli ingredienti caricati da ingredienti.json */
  allIngredients = toSignal(this.productService.getIngredients(), { initialValue: [] as Ingredient[] });

  /** Ingredienti disponibili: esclude già aggiunti e ingredienti base del piatto aperto */
  getAvailableIngredients(): Ingredient[] {
    if (!this.activeCustomization) return this.allIngredients();
    const added = new Set(this.activeCustomization.addedIngredients);
    const base = new Set(
      this.activeCustomization.pizza.baseIngredients.map(i => i.toLowerCase())
    );
    return this.allIngredients().filter(
      i => !added.has(i.nome) && !base.has(i.nome.toLowerCase())
    );
  }

  /** Set delle categorie selezionate nel filtro (vuoto = tutte) */
  selectedCategories = signal(new Set<string>());

  /** Set delle categorie collassate */
  collapsedCategories = signal(new Set<string>());

  filteredCategories = computed(() => {
    const sel = this.selectedCategories();
    const all = this.allCategories();
    if (sel.size === 0) return all;
    return all.filter(g => sel.has(g.category));
  });

  isCategorySelected(cat: string): boolean {
    return this.selectedCategories().has(cat);
  }

  toggleCategoryFilter(cat: string) {
    this.selectedCategories.update(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  clearCategoryFilter() {
    this.selectedCategories.set(new Set());
  }

  isCategoryCollapsed(cat: string): boolean {
    return this.collapsedCategories().has(cat);
  }

  toggleCategoryCollapse(cat: string) {
    this.collapsedCategories.update(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  canCustomize(category: string): boolean {
    return !NO_CUSTOMIZE_CATEGORIES.has(category);
  }

  /** Calcola il costo extra degli ingredienti aggiunti nella personalizzazione attiva */
  get currentExtraPrice(): number {
    if (!this.activeCustomization) return 0;
    const ingredients = this.allIngredients();
    return this.activeCustomization.addedIngredients.reduce((sum, name) => {
      const found = ingredients.find(i => i.nome === name);
      return sum + (found?.prezzo ?? 0);
    }, 0);
  }

  /** Prezzo totale (base + extra) mostrato nel pannello di personalizzazione */
  get currentTotalPrice(): number {
    if (!this.activeCustomization) return 0;
    return this.activeCustomization.pizza.price + this.currentExtraPrice;
  }

  activeCustomization: CustomizationState | null = null;

  quickAddToCart(pizza: Pizza) {
    this.cartService.addOrIncrementPlain(pizza);
  }

  openCustomization(pizza: Pizza) {
    if (this.activeCustomization?.pizza.id === pizza.id) {
      this.activeCustomization = null;
      return;
    }
    this.activeCustomization = {
      pizza,
      removedIngredients: new Set(),
      addedIngredients: [],
      note: '',
      newIngredient: '',
    };
  }

  isIngredientIncluded(ingredient: string): boolean {
    return !this.activeCustomization?.removedIngredients.has(ingredient);
  }

  toggleIngredient(ingredient: string) {
    if (!this.activeCustomization) return;
    if (this.activeCustomization.removedIngredients.has(ingredient)) {
      this.activeCustomization.removedIngredients.delete(ingredient);
    } else {
      this.activeCustomization.removedIngredients.add(ingredient);
    }
  }

  addIngredient() {
    if (!this.activeCustomization) return;
    const val = this.activeCustomization.newIngredient.trim();
    if (val && !this.activeCustomization.addedIngredients.includes(val)) {
      this.activeCustomization.addedIngredients.push(val);
    }
    this.activeCustomization.newIngredient = '';
  }

  onIngredientSelected(ingredientName: string) {
    if (!this.activeCustomization) return;
    if (ingredientName && !this.activeCustomization.addedIngredients.includes(ingredientName)) {
      this.activeCustomization.addedIngredients.push(ingredientName);
      this.activeCustomization.newIngredient = '';
    }
  }

  removeAddedIngredient(ingredient: string) {
    if (!this.activeCustomization) return;
    this.activeCustomization.addedIngredients =
      this.activeCustomization.addedIngredients.filter(i => i !== ingredient);
  }

  confirmAddToCart() {
    if (!this.activeCustomization) return;
    const { pizza, removedIngredients, addedIngredients, note } = this.activeCustomization;
    const extraPrice = this.currentExtraPrice;
    this.cartService.addToCart(pizza, {
      removedIngredients: [...removedIngredients],
      addedIngredients: [...addedIngredients],
      note,
      extraPrice,
    });
    this.activeCustomization = null;
  }

  cancelCustomization() {
    this.activeCustomization = null;
  }
}
