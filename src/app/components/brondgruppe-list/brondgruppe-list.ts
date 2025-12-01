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

	zoomToGroup(gruppe: { vejKode: string; broende: Array<{ clusterId: number | null }> }): void {
		// Find the most common cluster_id in this group
		const clusterCounts = new Map<number, number>();
		for (const brond of gruppe.broende) {
			if (brond.clusterId != null) {
				clusterCounts.set(brond.clusterId, (clusterCounts.get(brond.clusterId) || 0) + 1);
			}
		}

		// Get the cluster_id with the most brønde
		let bestClusterId: number | null = null;
		let maxCount = 0;
		for (const [id, count] of clusterCounts) {
			if (count > maxCount) {
				maxCount = count;
				bestClusterId = id;
			}
		}

		console.log('zoomToGroup:', gruppe.vejKode, 'clusterId:', bestClusterId, 'count:', maxCount);
		this.dataService.selectClusterId(bestClusterId);
	}
}
