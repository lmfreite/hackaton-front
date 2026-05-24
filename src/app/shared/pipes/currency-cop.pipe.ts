import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyCop', standalone: true })
export class CurrencyCopPipe implements PipeTransform {
  private formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  transform(value: number | null | undefined, signed = false): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const formatted = this.formatter.format(Math.abs(value));
    if (!signed) return formatted;
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
  }
}
