import { Component, Input, input } from '@angular/core';
import { State } from '../State';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [],
  templateUrl: './game-over.component.html',
  styleUrl: './game-over.component.scss'
})
export class GameOverComponent {
  @Input() white?: boolean;
  @Input() reason?: State;
}
