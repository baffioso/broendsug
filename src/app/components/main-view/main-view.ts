import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-main-view',
  imports: [],
  templateUrl: './main-view.html',
  styleUrl: './main-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainView {}
