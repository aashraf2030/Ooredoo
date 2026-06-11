import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-summary',
  imports: [],
  templateUrl: './summary.html',
  styleUrl: './summary.css',
})
export class Summary implements OnInit {
  totalAmount: number = 0;
  selectedPayment: string = 'KNET';

  cardNumber: string = '';
  cardDate: string = '';
  cardCVV: string = '';
  cardName: string = '';

  showCreditCardError: boolean = false;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.totalAmount = params['total'] || 0;
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  selectPayment(method: string) {
    this.selectedPayment = method;
    if (method === 'CreditCard') {
      this.showCreditCardError = true;
    } else {
      this.showCreditCardError = false;
    }
  }

  onCardNumberInput(event: any) {
    let val = event.target.value.replace(/[^0-9]/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    this.cardNumber = val;
    
    // Add space every 4 digits
    let formatted = val.replace(/(.{4})/g, '$1 ').trim();
    event.target.value = formatted;
  }

  onCardDateInput(event: any) {
    let val = event.target.value.replace(/[^0-9]/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    
    // Validate Month (cannot exceed 12)
    if (val.length >= 2) {
      let mm = val.slice(0, 2);
      if (parseInt(mm) > 12) {
        val = '12' + val.slice(2);
      }
    }
    
    this.cardDate = val;

    if (val.length >= 3) {
      event.target.value = val.slice(0, 2) + '/' + val.slice(2);
    } else {
      event.target.value = val;
    }
  }

  onCardCVVInput(event: any) {
    let val = event.target.value.replace(/[^0-9]/g, '');
    if (val.length > 3) val = val.slice(0, 3);
    this.cardCVV = val;
    event.target.value = val;
  }

  onCardNameInput(event: any) {
    let val = event.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    this.cardName = val;
    event.target.value = val;
  }

  isPayEnabled(): boolean {
    if (this.selectedPayment === 'KNET') return true;
    if (this.selectedPayment === 'CreditCard') {
      return this.cardNumber.length === 16 && 
             this.cardDate.length === 4 && 
             this.cardCVV.length === 3 && 
             this.cardName.trim().length > 0;
    }
    return false;
  }

  onPay() {
    if (this.isPayEnabled() && !this.isLoading) {
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        // Redirect based on selected payment
        if (this.selectedPayment === 'KNET') {
          this.router.navigate(['/knet'], { queryParams: { amount: this.totalAmount } });
        } else {
          window.location.href = 'https://www.ooredoo.com.kw/';
        }
      }, 5000);
    }
  }
}
