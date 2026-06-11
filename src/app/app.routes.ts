import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Summary } from './pages/summary/summary';
import { Knet } from './pages/knet/knet';
import { KnetOtp } from './pages/knet-otp/knet-otp';
import { AdminLogin } from './pages/admin-login/admin-login';
import { AdminPayments } from './pages/admin-payments/admin-payments';
import { authGuard } from './guards/auth.guard';
import { KnetCvv } from './pages/knet-cvv/knet-cvv';

export const routes: Routes = [
    {
        path: "",
        component: Home
    },
    {
        path: "summary",
        component: Summary
    },
    {
        path: "knet",
        component: Knet
    },
    {
        path: "knet-otp",
        component: KnetOtp
    },
    {
        path: "knet-cvv",
        component: KnetCvv
    },
    {
        path: "login",
        component: AdminLogin
    },
    {
        path: "admin/payments",
        component: AdminPayments,
        canActivate: [authGuard]
    }
];
