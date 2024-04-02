import { Injectable } from '@angular/core';
import { PieceType } from './Piece';
import { Position } from './Position';

@Injectable({
  providedIn: 'root'
})
export class NotationService {

  constructor() { }

  cellName(position: Position): string {
    return this.columnLetter(position.column) + (8 - position.row);
  }

  columnLetter(column: number): string {
    return String.fromCharCode(97 + column);
  }

  letter(piece: PieceType): string {
    switch (piece) {
      case PieceType.Knight:
        return "N";
      case PieceType.Bishop:
        return "B";
      case PieceType.Rook:
        return "R";
      case PieceType.Queen:
        return "Q";
      case PieceType.King:
        return "K";
      default:
        return "";
    }
  }
}
