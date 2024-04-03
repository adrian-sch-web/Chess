import { Injectable } from '@angular/core';
import { Cell } from './Cell';
import { Piece, PieceType } from './Piece';
import { Position } from './Position';
import { CheckService } from './check.service';

@Injectable({
  providedIn: 'root'
})
export class MovesService {

  constructor(private check: CheckService) { }

  getPossibleMoves(piece: Piece, board: Cell[][], playerPieces: Piece[], opponentPieces: Piece[], whitesTurn: boolean, enPassent?: Position): Cell[] {
    let moves: Cell[] = this.allPotentialMoves(piece, board, playerPieces, whitesTurn, enPassent);
    return moves.filter(move => {
      if (piece.type != PieceType.King || Math.abs(move.position.column - piece.position.column) < 2) {
        return !this.check.kingInCheck([...playerPieces, { position: move.position, moved: true, type: piece.type }],
          opponentPieces.filter(a => move.position.row != a.position.row || move.position.column != a.position.column), whitesTurn);
      } else {
        return !this.check.kingInCheck([...playerPieces, piece], opponentPieces, whitesTurn) &&
          !this.check.kingInCheck([...playerPieces, {
            position: { row: piece.position.row, column: piece.position.column + Math.sign(move.position.column - piece.position.column) },
            moved: true,
            type: piece.type
          }],
            opponentPieces,
            whitesTurn) &&
          !this.check.kingInCheck([...playerPieces, { position: move.position, moved: true, type: piece.type }], opponentPieces, whitesTurn);
      }
    });
  }


  allPotentialMoves(piece: Piece, board: Cell[][], playerPieces: Piece[], whitesTurn: boolean, enPassent?: Position): Cell[] {
    let moves: Cell[] = [];
    switch (piece.type) {
      case PieceType.Pawn:
        moves = this.pawnMove(piece, board, whitesTurn, enPassent);
        break;
      case PieceType.Knight:
        moves = this.knightMove(piece, board, whitesTurn);
        break;
      case PieceType.Bishop:
        moves = this.bishopMove(piece, board, whitesTurn);
        break;
      case PieceType.Rook:
        moves = this.rookMove(piece, board, whitesTurn);
        break;
      case PieceType.Queen:
        moves = this.queenMove(piece, board, whitesTurn);
        break;
      case PieceType.King:
        moves = this.kingMove(
          piece,
          board,
          playerPieces,
          whitesTurn
        );
        break;
    }
    return moves;
  }

  pawnMove(piece: Piece, board: Cell[][], white: boolean, enPassent?: Position): Cell[] {
    let moves: Cell[] = [];
    let direction = white ? -1 : 1;
    let row = piece.position.row;
    let column = piece.position.column;
    if (board[row + direction][column].piece == PieceType.Empty) {
      moves.push(board[row + direction][column]);
      if (!piece.moved && board[row + 2 * direction][column].piece == PieceType.Empty) {
        moves.push(board[row + 2 * direction][column]);
      }
    }
    if (
      column < 7
      && ((board[row + direction][column + 1].piece != PieceType.Empty
        && board[row + direction][column + 1].white != white))
    ) {
      moves.push(board[row + direction][column + 1]);
    }
    if (column > 0
      && ((board[row + direction][column - 1].piece != PieceType.Empty
        && board[row + direction][column - 1].white != white))
    ) {
      moves.push(board[row + direction][column - 1]);
    }
    if (enPassent && enPassent.row == row && Math.abs(enPassent.column - column) == 1) {
      moves.push(board[enPassent.row + direction][enPassent.column]);
    }
    return moves;
  }

  knightMove(piece: Piece, board: Cell[][], white: boolean): Cell[] {
    let moves: Cell[] = [];
    let positions: Position[] = [];
    let row = piece.position.row;
    let column = piece.position.column;
    positions.push({ row: row + 1, column: column + 2 });
    positions.push({ row: row + 1, column: column - 2 });
    positions.push({ row: row + 2, column: column + 1 });
    positions.push({ row: row + 2, column: column - 1 });
    positions.push({ row: row - 1, column: column + 2 });
    positions.push({ row: row - 1, column: column - 2 });
    positions.push({ row: row - 2, column: column + 1 });
    positions.push({ row: row - 2, column: column - 1 });
    positions = positions.filter(position => {
      return position.row >= 0
        && position.row < 8
        && position.column >= 0
        && position.column < 8;
    })
    for (let position of positions) {
      if (board[position.row][position.column].piece == PieceType.Empty || board[position.row][position.column].white != white) {
        moves.push(board[position.row][position.column]);
      }
    }
    return moves;
  }

  bishopMove(piece: Piece, board: Cell[][], white: boolean): Cell[] {
    let moves: Cell[] = [];
    let row = piece.position.row;
    let column = piece.position.column;
    for (let i = 1; row + i <= 7 && column + i <= 7; i++) {
      if (board[row + i][column + i].piece == PieceType.Empty) {
        moves.push(board[row + i][column + i]);
        continue;
      }
      if (board[row + i][column + i].white != white) {
        moves.push(board[row + i][column + i]);
      }
      break;
    }
    for (let i = 1; row + i <= 7 && column - i >= 0; i++) {
      if (board[row + i][column - i].piece == PieceType.Empty) {
        moves.push(board[row + i][column - i]);
        continue;
      }
      if (board[row + i][column - i].white != white) {
        moves.push(board[row + i][column - i]);
      }
      break;
    }
    for (let i = 1; row - i >= 0 && column + i <= 7; i++) {
      if (board[row - i][column + i].piece == PieceType.Empty) {
        moves.push(board[row - i][column + i]);
        continue;
      }
      if (board[row - i][column + i].white != white) {
        moves.push(board[row - i][column + i]);
      }
      break;
    }
    for (let i = 1; row - i >= 0 && column - i >= 0; i++) {
      if (board[row - i][column - i].piece == PieceType.Empty) {
        moves.push(board[row - i][column - i]);
        continue;
      }
      if (board[row - i][column - i].white != white) {
        moves.push(board[row - i][column - i]);
      }
      break;
    }
    return moves;
  }

  rookMove(piece: Piece, board: Cell[][], white: boolean): Cell[] {
    let moves: Cell[] = [];
    let row = piece.position.row;
    let column = piece.position.column;
    for (let i = 1; row + i <= 7; i++) {
      if (board[row + i][column].piece == PieceType.Empty) {
        moves.push(board[row + i][column]);
        continue;
      }
      if (board[row + i][column].white != white) {
        moves.push(board[row + i][column]);
      }
      break;
    }
    for (let i = 1; row - i >= 0; i++) {
      if (board[row - i][column].piece == PieceType.Empty) {
        moves.push(board[row - i][column]);
        continue;
      }
      if (board[row - i][column].white != white) {
        moves.push(board[row - i][column]);
      }
      break;
    }
    for (let i = 1; column + i <= 7; i++) {
      if (board[row][column + i].piece == PieceType.Empty) {
        moves.push(board[row][column + i]);
        continue;
      }
      if (board[row][column + i].white != white) {
        moves.push(board[row][column + i]);
      }
      break;
    }
    for (let i = 1; column - i >= 0; i++) {
      if (board[row][column - i].piece == PieceType.Empty) {
        moves.push(board[row][column - i]);
        continue;
      }
      if (board[row][column - i].white != white) {
        moves.push(board[row][column - i]);
      }
      break;
    }
    return moves;
  }

  queenMove(piece: Piece, board: Cell[][], white: boolean): Cell[] {
    let moves: Cell[] = [...this.bishopMove(piece, board, white), ...this.rookMove(piece, board, white)];
    return moves;
  }

  kingMove(piece: Piece, board: Cell[][], pieces: Piece[], white: boolean): Cell[] {
    let moves: Cell[] = [];
    let row = piece.position.row;
    let column = piece.position.column;
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (i == 0 && j == 0) {
          continue;
        }
        if (row + i < 0 || row + i > 7) {
          continue;
        }
        if (column + j < 0 || column + j > 7) {
          continue;
        }
        if (board[row + i][column + j].piece == PieceType.Empty
          || board[row + i][column + j].white == !white) {
          moves.push(board[row + i][column + j]);
          continue;
        }
      }
    }
    if (!piece.moved) {
      let rooks = pieces.filter(piece => piece.type == PieceType.Rook);;
      for (let rook of rooks) {
        if (rook.moved) {
          continue;
        }
        let empty = true;
        let direction = (rook.position.column - column) / Math.abs(rook.position.column - column);
        for (let column = piece.position.column + direction; column != rook.position.column; column += direction) {
          if (board[piece.position.row][column].piece != PieceType.Empty) {
            empty = false;
          }
        }
        if (empty) {
          moves.push(board[piece.position.row][piece.position.column + 2 * direction]);
        }
      }
    }
    return moves;
  }
}
