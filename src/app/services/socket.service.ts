import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  constructor() { }

  listen(eventName: string): Observable<any> {
    // Return a mock observable that fakes a successful payment status
    return of({ status: 'SUCCESS', id: 'txn-mock' }).pipe(delay(2000));
  }
}
