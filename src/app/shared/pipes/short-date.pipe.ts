import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'shortDateEs', standalone: true })
export class ShortDateEsPipe implements PipeTransform {
  private formatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  transform(value: Date | string | null | undefined): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    return this.formatter.format(date).replace('.', '');
  }
}
