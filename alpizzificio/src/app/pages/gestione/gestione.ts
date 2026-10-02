import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FirestoreService } from '../../services/firestore.service';
import { Product, Pizza, Ingredient } from '../../services/product';
import { AuthService } from '../../services/auth.service';
import { OpeningDay } from '../../models';
import { GestioneModificaComponent } from './gestione-modifica/gestione-modifica';

export interface DeleteDialogState {
  isOpen: boolean;
  type: 'pizza' | 'ingredient';
  id: number | string;
  name: string;
}

@Component({
  selector: 'app-gestione',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GestioneModificaComponent],
  templateUrl: './gestione.html',
  styleUrl: './gestione.css'
})
export class Gestione implements OnInit {
  private firestoreService = inject(FirestoreService);
  private productService = inject(Product);
  private authService = inject(AuthService);
  private titleService = inject(Title);

  currentUser = this.authService.user$;

  // Scheda attiva: 'pizze', 'ingredienti', 'giorni'
  activeTab = signal<'pizze' | 'ingredienti' | 'giorni'>('pizze');

  // Dati
  pizzas = signal<Pizza[]>([]);
  ingredients = signal<Ingredient[]>([]);
  openingDays = signal<OpeningDay[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

  // Salvataggio stato giorni (ID giorno in fase di salvataggio)
  savingDayOfWeek = signal<number | null>(null);

  // Notifiche
  feedback = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Stato Modale di Modifica / Aggiunta
  isModalOpen = signal(false);
  modalMode = signal<'edit' | 'add'>('add');
  modalType = signal<'pizza' | 'ingredient'>('pizza');
  selectedPizza = signal<Pizza | null>(null);
  selectedIngredient = signal<Ingredient | null>(null);

  // Stato Dialog di Conferma Eliminazione
  deleteDialog = signal<DeleteDialogState | null>(null);
  isDeleting = signal(false);

  // Calcolo ID massimo + 1 per le pizze
  nextPizzaId = computed(() => {
    const max = this.pizzas().reduce((highest, item) => {
      const idNum = Number(item.id);
      return !isNaN(idNum) && idNum > highest ? idNum : highest;
    }, 0);
    return max + 1;
  });

  // Calcolo ID massimo + 1 per gli ingredienti
  nextIngredientId = computed(() => {
    const max = this.ingredients().reduce((highest, item) => {
      const idNum = Number(item.id);
      return !isNaN(idNum) && idNum > highest ? idNum : highest;
    }, 0);
    return max + 1;
  });

  // Categorie univoche disponibili
  pizzaCategories = computed(() => {
    const list = this.pizzas().map(p => p.category).filter(Boolean);
    return Array.from(new Set(list));
  });

  ingredientCategories = computed(() => {
    const list = this.ingredients().map(i => i.categoria).filter(Boolean);
    return Array.from(new Set(list));
  });

  // Pizze filtrate dalla ricerca
  filteredPizzas = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.pizzas();
    if (!q) return list;

    return list.filter(pizza =>
      String(pizza.id).includes(q) ||
      (pizza.name && pizza.name.toLowerCase().includes(q)) ||
      (pizza.category && pizza.category.toLowerCase().includes(q)) ||
      (pizza.description && pizza.description.toLowerCase().includes(q)) ||
      (pizza.baseIngredients && pizza.baseIngredients.some(bi => bi.toLowerCase().includes(q)))
    );
  });

  // Ingredienti filtrati dalla ricerca
  filteredIngredients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.ingredients();
    if (!q) return list;

    return list.filter(ing =>
      String(ing.id).includes(q) ||
      (ing.nome && ing.nome.toLowerCase().includes(q)) ||
      (ing.categoria && ing.categoria.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.titleService.setTitle('Gestione Menu & Ingredienti – Al Pizzificio 77');
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Carica le pizze da Firestore (con fallback/seeding di Product se vuoto)
    this.productService.getPizzas().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => Number(a.id) - Number(b.id));
        this.pizzas.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Errore caricamento pizze:', err);
        this.isLoading.set(false);
      }
    });

    // Carica gli ingredienti da Firestore (con fallback/seeding di Product se vuoto)
    this.productService.getIngredients().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => Number(a.id) - Number(b.id));
        this.ingredients.set(sorted);
      },
      error: (err) => {
        console.error('Errore caricamento ingredienti:', err);
      }
    });

    // Carica i giorni di apertura da Firestore
    this.firestoreService.getOpeningDays().subscribe({
      next: (days) => {
        const sorted = [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        this.openingDays.set(sorted);
      },
      error: (err) => {
        console.error('Errore caricamento giorni:', err);
      }
    });

  }

  // --- GESTIONE GIORNI DI APERTURA ---

  toggleDayOpen(day: OpeningDay): void {
    const updated: OpeningDay = { ...day, isOpen: !day.isOpen };
    this.saveDayChange(updated, `${updated.dayName} impostato come ${updated.isOpen ? 'Aperto' : 'Chiuso'}`);
  }

  toggleDayWeekend(day: OpeningDay): void {
    const updated: OpeningDay = { ...day, isWeekend: !day.isWeekend };
    this.saveDayChange(updated, `Orario di ${updated.dayName} impostato su: ${updated.isWeekend ? 'Weekend (18:00 - 22:30)' : 'Normale (18:00 - 21:30)'}`);
  }

  private saveDayChange(day: OpeningDay, successText: string): void {
    this.savingDayOfWeek.set(day.dayOfWeek);

    this.firestoreService.setOpeningDay(day).subscribe({
      next: () => {
        this.savingDayOfWeek.set(null);
        // Aggiorna lo stato locale
        this.openingDays.update(current =>
          current.map(d => d.dayOfWeek === day.dayOfWeek ? day : d)
        );
        this.showFeedback(successText, 'success');
      },
      error: (err) => {
        this.savingDayOfWeek.set(null);
        console.error('Errore salvataggio giorno di apertura:', err);
        this.showFeedback('Errore durante l\'aggiornamento del giorno su Firestore.', 'error');
      }
    });
  }

  refreshList(type: 'pizza' | 'ingredient'): void {
    if (type === 'pizza') {
      this.firestoreService.getMenuItems().subscribe(items => {
        const sorted = [...items].sort((a, b) => Number(a.id) - Number(b.id));
        this.pizzas.set(sorted);
      });
    } else {
      this.firestoreService.getIngredients().subscribe(items => {
        const sorted = [...items].sort((a, b) => Number(a.id) - Number(b.id));
        this.ingredients.set(sorted);
      });
    }
  }

  // --- AZIONI MODALE ---

  openAddNew(): void {
    const isPizza = this.activeTab() === 'pizze';
    this.modalMode.set('add');
    this.modalType.set(isPizza ? 'pizza' : 'ingredient');
    this.selectedPizza.set(null);
    this.selectedIngredient.set(null);
    this.isModalOpen.set(true);
  }

  openEditPizza(pizza: Pizza): void {
    this.modalMode.set('edit');
    this.modalType.set('pizza');
    this.selectedPizza.set(pizza);
    this.selectedIngredient.set(null);
    this.isModalOpen.set(true);
  }

  openEditIngredient(ingredient: Ingredient): void {
    this.modalMode.set('edit');
    this.modalType.set('ingredient');
    this.selectedPizza.set(null);
    this.selectedIngredient.set(ingredient);
    this.isModalOpen.set(true);
  }

  onModalClose(): void {
    this.isModalOpen.set(false);
    this.selectedPizza.set(null);
    this.selectedIngredient.set(null);
  }

  onItemSaved(result: { type: 'pizza' | 'ingredient'; item: Pizza | Ingredient }): void {
    this.onModalClose();
    this.refreshList(result.type);

    const isEdit = this.modalMode() === 'edit';
    const entityName = result.type === 'pizza' ? 'Pizza' : 'Ingrediente';
    const itemName = result.type === 'pizza'
      ? (result.item as Pizza).name
      : (result.item as Ingredient).nome;

    this.showFeedback(
      `${entityName} "${itemName}" (ID: ${result.item.id}) ${isEdit ? 'aggiornata con successo' : 'aggiunta con successo'} su Firestore!`,
      'success'
    );
  }

  // --- AZIONI ELIMINAZIONE ---

  promptDeletePizza(pizza: Pizza): void {
    this.deleteDialog.set({
      isOpen: true,
      type: 'pizza',
      id: pizza.id,
      name: pizza.name
    });
  }

  promptDeleteIngredient(ingredient: Ingredient): void {
    this.deleteDialog.set({
      isOpen: true,
      type: 'ingredient',
      id: ingredient.id,
      name: ingredient.nome
    });
  }

  closeDeleteDialog(): void {
    if (this.isDeleting()) return;
    this.deleteDialog.set(null);
  }

  confirmDelete(): void {
    const dialog = this.deleteDialog();
    if (!dialog) return;

    this.isDeleting.set(true);

    if (dialog.type === 'pizza') {
      this.firestoreService.deleteMenuItem(dialog.id).subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.deleteDialog.set(null);
          this.refreshList('pizza');
          this.showFeedback(`Pizza "${dialog.name}" (ID: ${dialog.id}) eliminata da Firestore.`, 'success');
        },
        error: (err) => {
          console.error('Errore eliminazione pizza:', err);
          this.isDeleting.set(false);
          this.showFeedback('Errore durante l\'eliminazione da Firestore.', 'error');
        }
      });
    } else {
      this.firestoreService.deleteIngredient(dialog.id).subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.deleteDialog.set(null);
          this.refreshList('ingredient');
          this.showFeedback(`Ingrediente "${dialog.name}" (ID: ${dialog.id}) eliminato da Firestore.`, 'success');
        },
        error: (err) => {
          console.error('Errore eliminazione ingrediente:', err);
          this.isDeleting.set(false);
          this.showFeedback('Errore durante l\'eliminazione da Firestore.', 'error');
        }
      });
    }
  }

  private showFeedback(message: string, type: 'success' | 'error'): void {
    this.feedback.set({ message, type });
    setTimeout(() => {
      this.feedback.set(null);
    }, 4500);
  }
}
