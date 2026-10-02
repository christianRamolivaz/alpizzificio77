import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from '@angular/fire/auth';
import { Observable, from, switchMap, of, tap, map, defer, shareReplay } from 'rxjs';
import { User } from '../models/index';
import { FirestoreService } from './firestore.service';
import { isUserAdmin } from '../config/admin.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestoreService = inject(FirestoreService);

  constructor() {}

  // Current user as Observable - delayed initialization until subscription
  user$ = defer(() => new Observable<User | null>(subscriber => {
    const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        this.firestoreService.getUser(firebaseUser.uid).subscribe({
          next: userData => {
            if (userData) {
              subscriber.next(userData);
            } else {
              subscriber.next({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Utente',
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: new Date()
              });
            }
          },
          error: () => {
            subscriber.next({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Utente',
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date()
            });
          }
        });
      } else {
        subscriber.next(null);
      }
    });
    return () => unsubscribe();
  })).pipe(shareReplay(1));

  /**
   * Observable che indica se l'utente attualmente loggato è un amministratore
   */
  isAdmin$ = this.user$.pipe(
    map(user => isUserAdmin(user)),
    shareReplay(1)
  );

  /**
   * Verifica se un utente specifico o loggato ha privilegi di amministratore
   */
  isAdmin(user?: User | null): boolean {
    if (user !== undefined) {
      return isUserAdmin(user);
    }
    const currentFirebaseUser = this.auth.currentUser;
    if (!currentFirebaseUser) return false;
    return isUserAdmin({
      uid: currentFirebaseUser.uid,
      email: currentFirebaseUser.email || '',
      displayName: currentFirebaseUser.displayName || '',
      createdAt: new Date()
    });
  }

  /**
   * Register a new user with email and password
   */
  register(email: string, password: string, displayName: string): Observable<User | null> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(({ user: firebaseUser }) => 
        from(updateProfile(firebaseUser, { displayName })).pipe(
          switchMap(() => this.firestoreService.createUser(firebaseUser.uid, {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName,
            createdAt: new Date(),
            preferences: { favoriteItems: [], allergens: [] }
          }))
        )
      )
    );
  }

  /**
   * Sign in with email and password
   */
  login(email: string, password: string): Observable<User | null> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(({ user: firebaseUser }) =>
        this.firestoreService.getUser(firebaseUser.uid).pipe(
          switchMap(existingUser => {
            // Se l'utente non esiste in Firestore, crealo
            if (!existingUser) {
              return this.firestoreService.createUser(firebaseUser.uid, {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Utente',
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: new Date(),
                preferences: { favoriteItems: [], allergens: [] }
              });
            }
            return of(existingUser);
          })
        )
      )
    );
  }

  /**
   * Sign in with Google
   */
  loginWithGoogle(): Observable<User | null> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(({ user: firebaseUser }) => {
        // Check if user exists in Firestore, if not create it
        return this.firestoreService.getUser(firebaseUser.uid).pipe(
          switchMap(existingUser => {
            if (existingUser) {
              return of(existingUser);
            }
            // Create new user
            return this.firestoreService.createUser(firebaseUser.uid, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous',
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date(),
              preferences: { favoriteItems: [], allergens: [] }
            });
          })
        );
      })
    );
  }

  /**
   * Sign out
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Get current user UID
   */
  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}
