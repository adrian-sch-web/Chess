import { Component, Input } from '@angular/core';
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

  Reason(): string {
    switch (this.reason) {
      case State.StaleMate:
        return 'Stalemate';
      case State.InsufficientMaterial:
        return 'Insufficient Material';
      case State.MovesRule:
        return '40 Moves Rule';
      case State.ThreeFoldRepitition:
        return 'Three Fold Repitition';
    }
    return '';
  }
}
