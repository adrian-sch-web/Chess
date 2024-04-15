import { Piece, PieceType } from './data-objects/Piece';
import { Cell } from './data-objects/Cell';

export class CheckService {

  constructor() { }

  static kingInCheck(player: Piece[], opponent: Piece[], white: boolean): boolean {
  static kingInCheck(player: Piece[], opponent: Piece[], white: boolean): boolean {
    let opponentDirection = white ? -1 : 1;
    let king = player.find(piece => piece.type === PieceType.King);
    if (king === undefined) {
      return true;
    }
    for (let opponentPiece of opponent) {
      switch (opponentPiece.type) {
        case PieceType.Pawn:
          if (
            Math.abs(opponentPiece.position.column - king.position.column) === 1
            && king.position.row + opponentDirection === opponentPiece.position.row
          ) {
            return true;
          }
          break;
        case PieceType.Knight:
          if (this.knightCheckTest(king, opponentPiece)) {
            return true;
          }
          break;
        case PieceType.Bishop:
          if (this.bishopCheckTest(king, opponentPiece, [...player, ...opponent])) {
            return true;
          }
          break;
        case PieceType.Rook:
          if (this.RookCheckTest(king, opponentPiece, [...player, ...opponent])) {
            return true;
          }
          break;
        case PieceType.Queen:
          if (this.bishopCheckTest(king, opponentPiece, [...player, ...opponent])
            || this.RookCheckTest(king, opponentPiece, [...player, ...opponent])) {
            return true;
          }
          break;
        case PieceType.King:
          if (Math.abs(king.position.row - opponentPiece.position.row) <= 1
            && Math.abs(king.position.column - opponentPiece.position.column) <= 1) {
            return true;
          }
          break;
      }
    }
    return false;
  }

  static knightCheckTest(king: Piece, opponent: Piece) {
  static knightCheckTest(king: Piece, opponent: Piece) {
    let pieceRow = opponent.position.row;
    let pieceColumn = opponent.position.column;
    let kingRow = king.position.row;
    let kingColumn = king.position.column;
    return (pieceRow === kingRow + 1 && opponent.position.row === king.position.row + 2)
      || (pieceRow === kingRow + 1 && pieceColumn === kingColumn - 2)
      || (pieceRow === kingRow - 1 && pieceColumn === kingColumn + 2)
      || (pieceRow === kingRow - 1 && pieceColumn === kingColumn - 2)
      || (pieceRow === kingRow + 2 && pieceColumn === kingColumn + 1)
      || (pieceRow === kingRow + 2 && pieceColumn === kingColumn - 1)
      || (pieceRow === kingRow - 2 && pieceColumn === kingColumn + 1)
      || (pieceRow === kingRow - 2 && pieceColumn === kingColumn - 1)
  }

  static bishopCheckTest(king: Piece, opponent: Piece, pieces: Piece[]): boolean {
  static bishopCheckTest(king: Piece, opponent: Piece, pieces: Piece[]): boolean {
    if (Math.abs(king.position.row - opponent.position.row) === Math.abs(king.position.column - opponent.position.column)) {
      let rowDif = opponent.position.row - king.position.row;
      let colDif = opponent.position.column - king.position.column;
      for (let i = 1; i < Math.abs(rowDif); i++) {
        if (pieces.some(piece => king.position.row + i * Math.sign(rowDif) === piece.position.row
          && king.position.column + i * Math.sign(colDif) === piece.position.column
        )) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  static RookCheckTest(king: Piece, opponent: Piece, pieces: Piece[]): boolean {
  static RookCheckTest(king: Piece, opponent: Piece, pieces: Piece[]): boolean {
    if (king.position.row === opponent.position.row || king.position.column === opponent.position.column) {
      let rowDif = opponent.position.row - king.position.row;
      let colDif = opponent.position.column - king.position.column;
      for (let i = 1; i < Math.max(Math.abs(rowDif), Math.abs(colDif)); i++) {
        if (pieces.some(piece => king.position.row + i * Math.sign(rowDif) === piece.position.row
          && king.position.column + i * Math.sign(colDif) === piece.position.column
        )) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  static insufficienMaterialCheck(pieces: Piece[]): boolean {
  static insufficienMaterialCheck(pieces: Piece[]): boolean {
    if (pieces.length > 2) {
      return false;
    }
    if (pieces.length === 1) {
      return true;
    }
    if (pieces.findIndex(a => a.type === PieceType.Knight) !== -1) {
      return true;
    }
    if (pieces.findIndex(a => a.type === PieceType.Bishop) !== -1) {
      return true;
    }
    return false;
  }

  static getFEN(board: Cell[][], white: boolean): string {
  static getFEN(board: Cell[][], white: boolean): string {
    let stateFEN: string = '';
    for (let i = 0; i < board[0].length; i++) {
      for (let j = 0; j < board.length; j++) {
        switch (board[j][i].piece) {
          case PieceType.Empty:
            stateFEN += 'e';
            break;
          case PieceType.Pawn:
            stateFEN += board[j][i].white ? 'P' : 'p';
            break;
          case PieceType.Knight:
            stateFEN += board[j][i].white ? 'N' : 'n';
            break;
          case PieceType.Bishop:
            stateFEN += board[j][i].white ? 'B' : 'b';
            break;
          case PieceType.Rook:
            stateFEN += board[j][i].white ? 'R' : 'r';
            break;
          case PieceType.Queen:
            stateFEN += board[j][i].white ? 'Q' : 'q';
            break;
          case PieceType.King:
            stateFEN += board[j][i].white ? 'K' : 'k';
            break;
        }
      }
    }
    stateFEN += white ? 'w' : 'b';
    return stateFEN;
  }
}
