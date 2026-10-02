import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirestoreService } from '../../../services/firestore.service';
import { Pizza, Ingredient } from '../../../services/product';

@Component({
  selector: 'app-gestione-modifica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestione-modifica.html',
  styleUrl: './gestione-modifica.css'
})
export class GestioneModificaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private firestoreService = inject(FirestoreService);

  @Input({ required: true }) mode: 'edit' | 'add' = 'edit';
  @Input({ required: true }) type: 'pizza' | 'ingredient' = 'pizza';
  @Input() pizza: Pizza | null = null;
  @Input() ingredient: Ingredient | null = null;
  @Input() generatedId = 1;
  @Input() availableCategories: string[] = [];

  @Output() save = new EventEmitter<{ type: 'pizza' | 'ingredient'; item: Pizza | Ingredient }>();
  @Output() close = new EventEmitter<void>();

  pizzaForm!: FormGroup;
  ingredientForm!: FormGroup;

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.initForms();
  }

  private initForms(): void {
    const isEdit = this.mode === 'edit';

    if (this.type === 'pizza') {
      const currentId = isEdit && this.pizza ? this.pizza.id : this.generatedId;
      const baseIngs = this.pizza?.baseIngredients ? this.pizza.baseIngredients.join(', ') : '';

      this.pizzaForm = this.fb.group({
        // L'ID è disabilitato/readonly in entrambi i casi: non modificabile!
        id: [{ value: currentId, disabled: true }, Validators.required],
        name: [this.pizza?.name ?? '', [Validators.required, Validators.minLength(2)]],
        category: [this.pizza?.category ?? (this.availableCategories[0] || 'Pizze Rosse'), Validators.required],
        description: [this.pizza?.description ?? ''],
        baseIngredients: [baseIngs],
        price: [this.pizza?.price ?? 7.0, [Validators.required, Validators.min(0)]],
        isBaby: [this.pizza?.isBaby ?? false],
        importoBaby: [this.pizza?.importoBaby ?? null, [Validators.min(0)]]
      });
    } else {
      const currentId = isEdit && this.ingredient ? this.ingredient.id : this.generatedId;

      this.ingredientForm = this.fb.group({
        // L'ID è disabilitato/readonly in entrambi i casi: non modificabile!
        id: [{ value: currentId, disabled: true }, Validators.required],
        nome: [this.ingredient?.nome ?? '', [Validators.required, Validators.minLength(2)]],
        categoria: [this.ingredient?.categoria ?? (this.availableCategories[0] || 'Base'), Validators.required],
        prezzo: [this.ingredient?.prezzo ?? 0.0, [Validators.required, Validators.min(0)]]
      });
    }
  }

  get effectiveId(): number {
    if (this.mode === 'edit') {
      return Number(this.type === 'pizza' ? this.pizza?.id : this.ingredient?.id) || this.generatedId;
    }
    return this.generatedId;
  }

  onSave(): void {
    this.errorMessage.set(null);

    if (this.type === 'pizza') {
      if (this.pizzaForm.invalid) {
        this.pizzaForm.markAllAsTouched();
        return;
      }

      this.isSubmitting.set(true);
      const raw = this.pizzaForm.getRawValue();

      // Converti ingredienti base da stringa separata da virgole ad array
      const ingredientsArray = (raw.baseIngredients as string || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const pizzaItem: Pizza = {
        id: this.effectiveId,
        name: raw.name.trim(),
        category: raw.category.trim(),
        description: (raw.description || '').trim(),
        baseIngredients: ingredientsArray,
        price: Number(raw.price),
        isBaby: Boolean(raw.isBaby),
        importoBaby: raw.importoBaby !== null && raw.importoBaby !== '' ? Number(raw.importoBaby) : null
      };

      this.firestoreService.saveMenuItem(pizzaItem).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.save.emit({ type: 'pizza', item: pizzaItem });
        },
        error: (err) => {
          console.error('Errore durante il salvataggio della pizza:', err);
          this.isSubmitting.set(false);
          this.errorMessage.set('Errore durante il salvataggio su Firestore. Riprova.');
        }
      });
    } else {
      if (this.ingredientForm.invalid) {
        this.ingredientForm.markAllAsTouched();
        return;
      }

      this.isSubmitting.set(true);
      const raw = this.ingredientForm.getRawValue();

      const ingredientItem: Ingredient = {
        id: this.effectiveId,
        nome: raw.nome.trim(),
        categoria: raw.categoria.trim(),
        prezzo: Number(raw.prezzo)
      };

      this.firestoreService.saveIngredient(ingredientItem).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.save.emit({ type: 'ingredient', item: ingredientItem });
        },
        error: (err) => {
          console.error('Errore durante il salvataggio dell\'ingrediente:', err);
          this.isSubmitting.set(false);
          this.errorMessage.set('Errore durante il salvataggio su Firestore. Riprova.');
        }
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
