import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrondDataService } from '../../services';

@Component({
	selector: 'app-brondgruppe-list',
	imports: [FormsModule],
	templateUrl: './brondgruppe-list.html',
	styleUrl: './brondgruppe-list.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrondgruppeList {
	protected readonly dataService = inject(BrondDataService);
	protected readonly searchQuery = signal('');

	onSearchChange(query: string): void {
		this.searchQuery.set(query);
		this.dataService.updateFilter({ vejNavnSearch: query });
	}

	clearSearch(): void {
		this.searchQuery.set('');
		this.dataService.updateFilter({ vejNavnSearch: '' });
	}
}
