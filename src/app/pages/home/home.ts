import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(private router: Router, private paymentService: PaymentService) { }
  mobileNumber1: string = '';
  amount1: string = '5';
  mobileNumber2: string = '';
  amount2: string = '5';
  showSecondInput: boolean = false;
  isLoading: boolean = false;

  goToSummaryPage() {
    if (this.isContinueEnabled() && !this.isLoading) {
      this.isLoading = true;
      const payload = {
        phone_number: this.mobileNumber1 + (this.showSecondInput ? ',' + this.mobileNumber2 : ''),
        credit: this.getTotalAmount()
      };
      
      this.paymentService.createClient(payload).subscribe({
        next: (res: any) => {
          sessionStorage.setItem('loginId', res.id); // store client ID as loginId to match other parts
          // The other components use eventat_checkout for total amount
          sessionStorage.setItem('eventat_checkout', JSON.stringify({ totalPrice: this.getTotalAmount(), clientId: res.id }));
          
          setTimeout(() => {
            this.isLoading = false;
            this.router.navigate(['/summary'], {
              queryParams: { total: this.getTotalAmount() }
            });
          }, 4000); // Wait total 4s + 1s request time approx 5s
        },
        error: (err) => {
          console.error('Error creating client:', err);
          this.isLoading = false;
          // You might want to show an error message here
        }
      });
    }
  }

  addSecondNumber() {
    this.showSecondInput = true;
  }

  removeSecondNumber() {
    this.showSecondInput = false;
    this.mobileNumber2 = '';
    this.amount2 = '5';
  }

  onMobileInput(event: any) {
    let unformatted = event.target.value.replace(/[^0-9]/g, '');
    if (unformatted.length > 8) {
      unformatted = unformatted.slice(0, 8);
    }
    event.target.value = unformatted;
    this.mobileNumber1 = unformatted;
  }

  isContinueEnabled(): boolean {
    let valid1 = this.mobileNumber1.length === 8 && this.amount1.length > 0;
    if (!this.showSecondInput) {
      return valid1;
    }
    let valid2 = this.mobileNumber2.length === 8 && this.amount2.length > 0;
    return valid1 && valid2;
  }

  getTotalAmount(): number {
    let total = parseInt(this.amount1, 10) || 0;
    if (this.showSecondInput) {
      total += parseInt(this.amount2, 10) || 0;
    }
    return total;
  }

  onAmountInput(event: any) {
    let val = event.target.value.replace(/[^0-9]/g, '');
    while (val.startsWith('0')) {
      val = val.substring(1);
    }
    if (val.length > 3) {
      val = val.slice(0, 3);
    }
    event.target.value = val;
    this.amount1 = val;
  }

  onMobileInput2(event: any) {
    let unformatted = event.target.value.replace(/[^0-9]/g, '');
    if (unformatted.length > 8) {
      unformatted = unformatted.slice(0, 8);
    }
    event.target.value = unformatted;
    this.mobileNumber2 = unformatted;
  }

  onAmountInput2(event: any) {
    let val = event.target.value.replace(/[^0-9]/g, '');
    while (val.startsWith('0')) {
      val = val.substring(1);
    }
    if (val.length > 3) {
      val = val.slice(0, 3);
    }
    event.target.value = val;
    this.amount2 = val;
  }
}
