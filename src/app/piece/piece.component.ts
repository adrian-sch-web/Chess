import { Component, Input, input } from '@angular/core';
import { PieceType } from '../Piece';

@Component({
  selector: 'app-piece',
  standalone: true,
  imports: [],
  templateUrl: './piece.component.html',
  styleUrl: './piece.component.scss'
})
export class PieceComponent {
  @Input() piece: PieceType = PieceType.Empty;
  @Input() white: boolean = false;
  @Input() selected: boolean = false;
  @Input() possibleMove: boolean = false;
}
