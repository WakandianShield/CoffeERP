import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  get<T>(path: string) {
    return firstValueFrom(this.http.get<T>('/api' + path));
  }
  post<T = unknown>(path: string, body: unknown) {
    return firstValueFrom(this.http.post<T>('/api' + path, body));
  }
  put(path: string, body: unknown) {
    return firstValueFrom(this.http.put('/api' + path, body));
  }
  async download(id: string) {
    const blob = await firstValueFrom(
      this.http.get(`/api/sales/${id}/xml`, { responseType: 'blob' }),
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${id}.xml`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
