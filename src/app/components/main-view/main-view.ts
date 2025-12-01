import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrondgruppeList } from '../brondgruppe-list/brondgruppe-list';

@Component({
	selector: 'app-main-view',
	imports: [BrondgruppeList],
	templateUrl: './main-view.html',
	styleUrl: './main-view.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainView {}
