import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrondDataService } from '../../services';

@Component({
  selector: 'app-filter-modal',
  imports: [FormsModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterModal {
  protected readonly dataService = inject(BrondDataService);
  readonly close = output<void>();

  protected startDate = signal<string>('');
  protected endDate = signal<string>('');

  constructor() {
    const filter = this.dataService.filter();
    if (filter.dateRange?.start) {
      this.startDate.set(this.formatDate(filter.dateRange.start));
    }
    if (filter.dateRange?.end) {
      this.endDate.set(this.formatDate(filter.dateRange.end));
    }
  }

  onClose(): void {
    this.close.emit();
  }

  apply(): void {
    const start = this.startDate() ? new Date(this.startDate()) : null;
    let end = this.endDate() ? new Date(this.endDate()) : null;

    if (end) {
      // Set to end of day
      end.setHours(23, 59, 59, 999);
    }

    this.dataService.updateFilter({
      dateRange: { start, end }
    });
    this.onClose();
  }

  reset(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.dataService.updateFilter({
      dateRange: undefined
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
