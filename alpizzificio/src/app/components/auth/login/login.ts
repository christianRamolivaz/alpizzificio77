import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!).subscribe({
      next: (user: unknown) => {
        this.loading.set(false);
        if (user) {
          this.router.navigate(['/']);
        }
      },
      error: (err: FirebaseError) => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(err.code));
      }
    });
  }

  loginWithGoogle() {
    this.loading.set(true);
    this.error.set(null);

    this.authService.loginWithGoogle().subscribe({
      next: (user: unknown) => {
        this.loading.set(false);
        if (user) {
          this.router.navigate(['/']);
        }
      },
      error: (err: FirebaseError) => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(err.code));
      }
    });
  }

  private getErrorMessage(code: string): string {
    const messages: { [key: string]: string } = {
      'auth/invalid-email': 'Email non valida',
      'auth/user-disabled': 'Utente disabilitato',
      'auth/user-not-found': 'Utente non trovato',
      'auth/wrong-password': 'Password errata',
      'auth/invalid-credential': 'Email o password errati',
      'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi',
      'auth/popup-closed-by-user': 'Login con Google annullato'
    };
    return messages[code] || 'Errore di login. Riprova.';
  }
}
