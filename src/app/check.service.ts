import { Injectable } from '@angular/core';
import { Piece, PieceType } from './Piece';
import { Cell } from './Cell';

@Injectable({
  providedIn: 'root'
})
export class CheckService {

  constructor() { }

  kingInCheck(player: Piece[], opponent: Piece[], white: boolean): boolean {
    let opponentDirection = white ? -1 : 1;
    let king = player.find(piece => piece.type == PieceType.King);
    if (king == undefined) {
      return true;
    }
    for (let opponentPiece of opponent) {
      switch (opponentPiece.type) {
        case PieceType.Pawn:
          if (
            Math.abs(opponentPiece.position.column - king.position.column) == 1
            && king.position.row + opponentDirection == opponentPiece.position.row
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

  knightCheckTest(king: Piece, opponent: Piece) {
    let pieceRow = opponent.position.row;
    let pieceColumn = opponent.position.column;
    let kingRow = king.position.row;
    let kingColumn = king.position.column;
    return (pieceRow == kingRow + 1 && opponent.position.row == king.position.row + 2)
      || (pieceRow == kingRow + 1 && pieceColumn == kingColumn - 2)
      || (pieceRow == kingRow - 1 && pieceColumn == kingColumn + 2)
      || (pieceRow == kingRow - 1 && pieceColumn == kingColumn - 2)
      || (pieceRow == kingRow + 2 && pieceColumn == kingColumn + 1)
      || (pieceRow == kingRow + 2 && pieceColumn == kingColumn - 1)
      || (pieceRow == kingRow - 2 && pieceColumn == kingColumn + 1)
      || (pieceRow == kingRow - 2 && pieceColumn == kingColumn - 1)
  }

  bishopCheckTest(king: Piece, opponent: Piece, pieces: Piece[]): boolean {
    if (Math.abs(king.position.row - opponent.position.row) == Math.abs(king.position.column - opponent.position.column)) {
      let rowDif = opponent.position.row - king.position.row;
      let colDif = opponent.position.column - king.position.column;
      for (let i = 1; i < Math.abs(rowDif); i++) {
        if (pieces.some(piece => king.position.row + i * Math.sign(rowDif) == piece.position.row
          && king.position.column + i * Math.sign(colDif) == piece.position.column
        )) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  RookCheckTest(king: Piece, opponent: Piece, pieces: Piece[]): boolean {
    if (king.position.row == opponent.position.row || king.position.column == opponent.position.column) {
      let rowDif = opponent.position.row - king.position.row;
      let colDif = opponent.position.column - king.position.column;
      for (let i = 1; i < Math.max(Math.abs(rowDif), Math.abs(colDif)); i++) {
        if (pieces.some(piece => king.position.row + i * Math.sign(rowDif) == piece.position.row
          && king.position.column + i * Math.sign(colDif) == piece.position.column
        )) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  getFEN(board: Cell[][], white: boolean): string {
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

  startPosition(white: boolean): Piece[] {
    let pieces: Piece[] = [];
    for (let i = 0; i < 8; i++) {
      pieces.push({
        position: { column: i, row: white ? 6 : 1 },
        moved: false,
        type: PieceType.Pawn
      })
    }
    pieces.push({
      position: { column: 0, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.Rook
    })
    pieces.push({
      position: { column: 1, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.Knight
    })
    pieces.push({
      position: { column: 2, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.Bishop
    })
    pieces.push({
      position: { column: 3, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.Queen
    })
    pieces.push({
      position: { column: 4, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.King
    })
    pieces.push({
      position: { column: 5, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.Bishop
    })
    pieces.push({
      position: { column: 6, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.Knight
    })
    pieces.push({
      position: { column: 7, row: white ? 7 : 0 },
      moved: false,
      type: PieceType.Rook
    })
    return pieces;
  }
}
