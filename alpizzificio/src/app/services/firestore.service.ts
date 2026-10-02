import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Query,
  QueryConstraint,
  addDoc,
  Timestamp,
  writeBatch
} from '@angular/fire/firestore';
import { Observable, from, of, map, catchError, switchMap } from 'rxjs';
import { User, MenuItem, Order, OrderItem, OpeningDay } from '../models/index';
import { Pizza, Ingredient } from './product';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);

  private readonly USERS_COLLECTION = 'users';
  private readonly MENU_COLLECTION = 'menu';
  private readonly INGREDIENTS_COLLECTION = 'ingredients';
  private readonly ORDERS_COLLECTION = 'orders';
  private readonly OPENING_DAYS_COLLECTION = 'opening_days';

  private readonly DAY_DOC_IDS = [
    '0_domenica',
    '1_lunedi',
    '2_martedi',
    '3_mercoledi',
    '4_giovedi',
    '5_venerdi',
    '6_sabato'
  ];

  readonly DEFAULT_OPENING_DAYS: OpeningDay[] = [
    { dayOfWeek: 0, dayName: 'Domenica', isOpen: true, isWeekend: true },
    { dayOfWeek: 1, dayName: 'Lunedì', isOpen: false, isWeekend: false },
    { dayOfWeek: 2, dayName: 'Martedì', isOpen: true, isWeekend: false },
    { dayOfWeek: 3, dayName: 'Mercoledì', isOpen: true, isWeekend: false },
    { dayOfWeek: 4, dayName: 'Giovedì', isOpen: true, isWeekend: false },
    { dayOfWeek: 5, dayName: 'Venerdì', isOpen: true, isWeekend: true },
    { dayOfWeek: 6, dayName: 'Sabato', isOpen: true, isWeekend: true },
  ];

  // ============= USERS =============

  /**
   * Create a new user document in Firestore
   */
  createUser(uid: string, userData: User): Observable<User> {
    const userDoc = doc(this.firestore, this.USERS_COLLECTION, uid);
    return from(setDoc(userDoc, {
      ...userData,
      createdAt: Timestamp.fromDate(userData.createdAt)
    })).pipe(
      map(() => userData),
      catchError(() => of(userData))
    );
  }

  /**
   * Get user by UID
   */
  getUser(uid: string): Observable<User | null> {
    const userDoc = doc(this.firestore, this.USERS_COLLECTION, uid);
    return from(getDoc(userDoc)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            ...data,
            createdAt: data['createdAt']?.toDate?.() || new Date()
          } as User;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Get all users (admin)
   */
  getUsers(): Observable<User[]> {
    const usersCollection = collection(this.firestore, this.USERS_COLLECTION);
    const q = query(usersCollection, orderBy('createdAt', 'desc'));

    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            uid: docSnap.id,
            ...data,
            createdAt: data['createdAt']?.toDate?.() || new Date()
          } as User;
        })
      ),
      catchError(() => of([]))
    );
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(uid: string, preferences: any): Observable<void> {
    const userDoc = doc(this.firestore, this.USERS_COLLECTION, uid);
    return from(updateDoc(userDoc, { preferences }));
  }

  /**
   * Update user role (admin/user)
   */
  updateUserRole(uid: string, role: 'admin' | 'user' | string): Observable<void> {
    const userDoc = doc(this.firestore, this.USERS_COLLECTION, uid);
    return from(updateDoc(userDoc, { role }));
  }

  // ============= MENU ITEMS =============

  /**
   * Get all menu items from Firestore
   */
  getMenuItems(): Observable<Pizza[]> {
    const menuCollection = collection(this.firestore, this.MENU_COLLECTION);
    return from(getDocs(menuCollection)).pipe(
      map(snapshot => {
        const items = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Pizza));
        return items.sort((a, b) => Number(a.id) - Number(b.id));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get menu items by category
   */
  getMenuItemsByCategory(category: string): Observable<Pizza[]> {
    const menuCollection = collection(this.firestore, this.MENU_COLLECTION);
    const q = query(menuCollection, where('category', '==', category));
    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Pizza))
      ),
      catchError(() => of([]))
    );
  }

  /**
   * Get single menu item
   */
  getMenuItem(id: string): Observable<Pizza | null> {
    const menuDoc = doc(this.firestore, this.MENU_COLLECTION, id);
    return from(getDoc(menuDoc)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Pizza;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Add menu item
   */
  addMenuItem(item: Omit<Pizza, 'id'>): Observable<string> {
    const menuCollection = collection(this.firestore, this.MENU_COLLECTION);
    return from(addDoc(menuCollection, item)).pipe(
      map(docRef => docRef.id),
      catchError(() => of(''))
    );
  }

  /**
   * Save or update menu item by document ID (string or number)
   */
  saveMenuItem(item: Pizza): Observable<void> {
    const docId = String(item.id);
    const menuDoc = doc(this.firestore, this.MENU_COLLECTION, docId);
    return from(setDoc(menuDoc, item, { merge: true }));
  }

  /**
   * Update menu item
   */
  updateMenuItem(id: string | number, item: Partial<Pizza>): Observable<void> {
    const menuDoc = doc(this.firestore, this.MENU_COLLECTION, String(id));
    return from(setDoc(menuDoc, item, { merge: true }));
  }

  /**
   * Delete menu item
   */
  deleteMenuItem(id: string | number): Observable<void> {
    const menuDoc = doc(this.firestore, this.MENU_COLLECTION, String(id));
    return from(deleteDoc(menuDoc));
  }

  /**
   * Popola inizialmente la collezione menu in batch
   */
  seedMenu(items: Pizza[]): Observable<void> {
    if (!items || items.length === 0) return of(undefined);
    const batch = writeBatch(this.firestore);
    items.forEach(item => {
      const docId = String(item.id);
      const docRef = doc(this.firestore, this.MENU_COLLECTION, docId);
      batch.set(docRef, item);
    });
    return from(batch.commit()).pipe(
      map(() => {
        console.log(`🎉 Popolamento "menu" su Firestore completato! (${items.length} elementi)`);
      }),
      catchError(err => {
        console.warn('Impossibile popolare "menu" su Firestore (verificare le Regole di Sicurezza in Firebase Console):', err.message || err);
        return of(undefined);
      })
    );
  }

  // ============= INGREDIENTS =============

  /**
   * Get all ingredients from Firestore
   */
  getIngredients(): Observable<Ingredient[]> {
    const ingredientsCollection = collection(this.firestore, this.INGREDIENTS_COLLECTION);
    return from(getDocs(ingredientsCollection)).pipe(
      map(snapshot => {
        const items = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Ingredient));
        return items.sort((a, b) => Number(a.id) - Number(b.id));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Add ingredient
   */
  addIngredient(item: Omit<Ingredient, 'id'>): Observable<string> {
    const ingredientsCollection = collection(this.firestore, this.INGREDIENTS_COLLECTION);
    return from(addDoc(ingredientsCollection, item)).pipe(
      map(docRef => docRef.id),
      catchError(() => of(''))
    );
  }

  /**
   * Save or update ingredient by document ID (string or number)
   */
  saveIngredient(item: Ingredient): Observable<void> {
    const docId = String(item.id);
    const ingredientDoc = doc(this.firestore, this.INGREDIENTS_COLLECTION, docId);
    return from(setDoc(ingredientDoc, item, { merge: true }));
  }

  /**
   * Update ingredient
   */
  updateIngredient(id: string | number, item: Partial<Ingredient>): Observable<void> {
    const ingredientDoc = doc(this.firestore, this.INGREDIENTS_COLLECTION, String(id));
    return from(setDoc(ingredientDoc, item, { merge: true }));
  }

  /**
   * Delete ingredient
   */
  deleteIngredient(id: string | number): Observable<void> {
    const ingredientDoc = doc(this.firestore, this.INGREDIENTS_COLLECTION, String(id));
    return from(deleteDoc(ingredientDoc));
  }

  /**
   * Popola inizialmente la collezione ingredients in batch
   */
  seedIngredients(items: Ingredient[]): Observable<void> {
    if (!items || items.length === 0) return of(undefined);
    const batch = writeBatch(this.firestore);
    items.forEach(item => {
      const docId = String(item.id);
      const docRef = doc(this.firestore, this.INGREDIENTS_COLLECTION, docId);
      batch.set(docRef, item);
    });
    return from(batch.commit()).pipe(
      map(() => {
        console.log(`🎉 Popolamento "ingredients" su Firestore completato! (${items.length} elementi)`);
      }),
      catchError(err => {
        console.warn('Impossibile popolare "ingredients" su Firestore (verificare le Regole di Sicurezza in Firebase Console):', err.message || err);
        return of(undefined);
      })
    );
  }

  // ============= ORDERS =============

  /**
   * Create a new order
   */
  createOrder(userId: string | null, order: Omit<Order, 'id' | 'createdAt'>): Observable<string> {
    const ordersCollection = collection(this.firestore, this.ORDERS_COLLECTION);
    return from(addDoc(ordersCollection, {
      ...order,
      userId,
      createdAt: Timestamp.now()
    })).pipe(
      map(docRef => docRef.id),
      catchError(() => of(''))
    );
  }

  /**
   * Get user's orders
   */
  getUserOrders(userId: string): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.ORDERS_COLLECTION);
    const q = query(
      ordersCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate?.() || new Date(),
          estimatedDelivery: doc.data()['estimatedDelivery']?.toDate?.()
        } as Order))
      ),
      catchError(() => of([]))
    );
  }

  /**
   * Get single order
   */
  getOrder(orderId: string): Observable<Order | null> {
    const orderDoc = doc(this.firestore, this.ORDERS_COLLECTION, orderId);
    return from(getDoc(orderDoc)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data['createdAt']?.toDate?.() || new Date(),
            estimatedDelivery: data['estimatedDelivery']?.toDate?.()
          } as Order;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId: string, status: Order['status']): Observable<void> {
    const orderDoc = doc(this.firestore, this.ORDERS_COLLECTION, orderId);
    return from(updateDoc(orderDoc, { status }));
  }

  /**
   * Get all orders (admin)
   */
  getAllOrders(): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.ORDERS_COLLECTION);
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));
    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate?.() || new Date(),
          estimatedDelivery: doc.data()['estimatedDelivery']?.toDate?.()
        } as Order))
      ),
      catchError(() => of([]))
    );
  }

  /**
   * Initialize menu with default items (if empty)
   */
  initializeMenuIfEmpty(defaultItems: Omit<MenuItem, 'id'>[]): Observable<void> {
    return this.getMenuItems().pipe(
      switchMap(items => {
        if (items.length === 0) {
          const promises = defaultItems.map(item => {
            const menuCollection = collection(this.firestore, this.MENU_COLLECTION);
            return addDoc(menuCollection, item);
          });
          return from(Promise.all(promises));
        }
        return of([]);
      }),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  // ============= OPENING DAYS & SCHEDULE =============

  /**
   * Ottiene la configurazione di apertura per un giorno specifico della settimana (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)
   */
  getOpeningDay(dayOfWeek: number): Observable<OpeningDay> {
    const defaultDay = this.DEFAULT_OPENING_DAYS.find(d => d.dayOfWeek === dayOfWeek) ?? {
      dayOfWeek,
      dayName: 'Giorno ' + dayOfWeek,
      isOpen: true,
      isWeekend: false
    };

    const docId = this.DAY_DOC_IDS[dayOfWeek] || String(dayOfWeek);
    const dayDoc = doc(this.firestore, this.OPENING_DAYS_COLLECTION, docId);

    return from(getDoc(dayDoc)).pipe(
      switchMap(docSnap => {
        if (docSnap.exists()) {
          return of({ ...defaultDay, ...docSnap.data() } as OpeningDay);
        }
        // Fallback: prova se esiste con ID solo numerico (es. '0', '1', ...)
        const numericDoc = doc(this.firestore, this.OPENING_DAYS_COLLECTION, String(dayOfWeek));
        return from(getDoc(numericDoc)).pipe(
          switchMap(numSnap => {
            if (numSnap.exists()) {
              return of({ ...defaultDay, ...numSnap.data() } as OpeningDay);
            }
            // Non esiste ancora su Firestore: semina i 7 giorni nel DB per permettere la gestione da console
            this.seedOpeningDays().subscribe();
            return of(defaultDay);
          })
        );
      }),
      catchError(err => {
        console.warn('Errore lettura opening_days da Firestore, uso default:', err);
        return of(defaultDay);
      })
    );
  }

  /**
   * Ottiene tutti i giorni della settimana con stato apertura e tipo orario
   */
  getOpeningDays(): Observable<OpeningDay[]> {
    const daysCollection = collection(this.firestore, this.OPENING_DAYS_COLLECTION);
    return from(getDocs(daysCollection)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          this.seedOpeningDays().subscribe();
          return this.DEFAULT_OPENING_DAYS;
        }
        const items = snapshot.docs.map(docSnap => docSnap.data() as OpeningDay);
        return items.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      }),
      catchError(() => of(this.DEFAULT_OPENING_DAYS))
    );
  }

  /**
   * Salva o aggiorna un giorno di apertura
   */
  setOpeningDay(day: OpeningDay): Observable<void> {
    const docId = this.DAY_DOC_IDS[day.dayOfWeek] || String(day.dayOfWeek);
    const dayDoc = doc(this.firestore, this.OPENING_DAYS_COLLECTION, docId);
    return from(setDoc(dayDoc, day, { merge: true }));
  }

  /**
   * Inizializza i 7 record su Firestore se non ancora presenti
   */
  seedOpeningDays(): Observable<void> {
    const batch = writeBatch(this.firestore);
    this.DEFAULT_OPENING_DAYS.forEach(day => {
      const docId = this.DAY_DOC_IDS[day.dayOfWeek];
      const docRef = doc(this.firestore, this.OPENING_DAYS_COLLECTION, docId);
      batch.set(docRef, day);
    });
    return from(batch.commit()).pipe(
      map(() => console.log('🎉 Giorni di apertura inizializzati con successo su Firestore!')),
      catchError(err => {
        console.warn('Impossibile salvare opening_days su Firestore:', err);
        return of(undefined);
      })
    );
  }
}
