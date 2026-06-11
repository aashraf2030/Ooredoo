import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/admin/payments']);
    }
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      this.authService.login(this.email(), this.password()).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('تم تسجيل الدخول بنجاح!');
          setTimeout(() => {
            this.router.navigate(['/admin/payments']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || 'حدث خطأ أثناء تسجيل الدخول'
          );
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  private validateForm(): boolean {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('الرجاء ملء جميع الحقول');
      return false;
    }

    if (!this.isValidEmail(this.email())) {
      this.errorMessage.set('الرجاء إدخال بريد إلكتروني صحيح');
      return false;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
