import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  registerForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: this.passwordMatchValidator
  });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ 'passwordMismatch': true });
      return { 'passwordMismatch': true };
    }
    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password, displayName } = this.registerForm.value;
    this.authService.register(email!, password!, displayName!).subscribe({
      next: (user: unknown) => {
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
      'auth/email-already-in-use': 'Email già registrata',
      'auth/invalid-email': 'Email non valida',
      'auth/weak-password': 'Password troppo debole',
      'auth/operation-not-allowed': 'Registrazione non disponibile',
      'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi'
    };
    return messages[code] || 'Errore di registrazione. Riprova.';
  }
}
