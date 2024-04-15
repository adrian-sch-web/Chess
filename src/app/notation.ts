import { PieceType } from './data-objects/Piece';
import { Position } from './data-objects/Position';



export class Notation {

  constructor() { }

  static cellName(position: Position): string {
    return this.columnLetter(position.column) + (8 - position.row);
  }

  static columnLetter(column: number): string {
    return String.fromCharCode(97 + column);
  }

  static letter(piece: PieceType): string {
    switch (piece) {
      case PieceType.Knight:
        return 'N';
      case PieceType.Bishop:
        return 'B';
      case PieceType.Rook:
        return 'R';
      case PieceType.Queen:
        return 'Q';
      case PieceType.King:
        return 'K';
      default:
        return '';
    }
  }
}
