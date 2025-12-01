import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrondgruppeList } from '../brondgruppe-list/brondgruppe-list';
import { MapView } from '../map-view/map-view';

@Component({
	selector: 'app-main-view',
	imports: [BrondgruppeList, MapView],
	templateUrl: './main-view.html',
	styleUrl: './main-view.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainView {}
