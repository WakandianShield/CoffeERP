import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CartItem } from './models';
interface Order {
  id: string;
  saleId: string;
}
interface Session {
  start(options: { presentationMode: string }, order: Promise<{ orderId: string }>): Promise<void>;
}
interface Sdk {
  findEligibleMethods(options: {
    currencyCode: string;
  }): Promise<{ isEligible(method: string): boolean }>;
  createPayPalOneTimePaymentSession(options: {
    onApprove: (data: { orderId: string }) => Promise<void>;
    onCancel: () => void;
    onError: () => void;
  }): Session;
}
declare global {
  interface Window {
    paypal: {
      createInstance(options: {
        clientId: string;
        components: string[];
        pageType: string;
      }): Promise<Sdk>;
    };
  }
}
@Injectable({ providedIn: 'root' })
export class PaypalService {
  private api = inject(ApiService);
  private loading?: Promise<void>;
  // Angular no ejecuta scripts incrustados en templates. Cargamos el SDK una sola vez.
  async setup(callbacks: {
    onApprove: (data: { orderId: string }) => Promise<void>;
    onCancel: () => void;
    onError: () => void;
  }) {
    const config = await this.api.get<{ clientId: string }>('/sales/config');
    if (!config.clientId)
      throw new Error('PayPal pendiente de configurar. Puedes registrar ventas en efectivo.');
    if (!this.loading)
      this.loading = new Promise<void>((resolve, reject) => {
        if (window.paypal) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://www.sandbox.paypal.com/web-sdk/v6/core';
        script.onload = () => resolve();
        script.onerror = () => {
          script.remove();
          this.loading = undefined;
          reject(new Error('No se pudo cargar PayPal'));
        };
        document.head.appendChild(script);
      });
    await this.loading;
    const sdk = await window.paypal.createInstance({
      clientId: config.clientId,
      components: ['paypal-payments'],
      pageType: 'checkout',
    });
    if (!(await sdk.findEligibleMethods({ currencyCode: 'MXN' })).isEligible('paypal'))
      throw new Error('PayPal no está disponible en este navegador');
    return sdk.createPayPalOneTimePaymentSession(callbacks);
  }
  create(customer: string, email: string, productos: CartItem[]) {
    return this.api.post<Order>('/sales/paypal', { customer, email, productos });
  }
}
