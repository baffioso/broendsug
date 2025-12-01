import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BrondgruppeList } from '../brondgruppe-list/brondgruppe-list';
import { MapView } from '../map-view/map-view';
import { FilterModal } from '../filter-modal/filter-modal';

@Component({
	selector: 'app-main-view',
	imports: [BrondgruppeList, MapView, FilterModal],
	templateUrl: './main-view.html',
	styleUrl: './main-view.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainView {
	protected readonly showFilterModal = signal(false);

	toggleFilterModal(): void {
		this.showFilterModal.update((v) => !v);
	}
}
