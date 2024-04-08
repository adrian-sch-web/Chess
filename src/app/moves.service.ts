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
      if (piece.type !== PieceType.King || Math.abs(move.position.column - piece.position.column) < 2) {
        return !this.check.kingInCheck([...playerPieces, { position: move.position, moved: true, type: piece.type }],
          opponentPieces.filter(a => move.position.row !== a.position.row || move.position.column !== a.position.column), whitesTurn);
      }
      //castle
      return !this.check.kingInCheck([...playerPieces, piece], opponentPieces, whitesTurn) &&
        !this.check.kingInCheck([...playerPieces, {
          position: { row: piece.position.row, column: piece.position.column + Math.sign(move.position.column - piece.position.column) },
          moved: true,
          type: piece.type
        }],
          opponentPieces,
          whitesTurn) &&
        !this.check.kingInCheck([...playerPieces, { position: move.position, moved: true, type: piece.type }], opponentPieces, whitesTurn);
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
    if (board[row + direction][column].piece === PieceType.Empty) {
      moves.push(board[row + direction][column]);
      //double move if start position
      if (!piece.moved && board[row + 2 * direction][column].piece === PieceType.Empty) {
        moves.push(board[row + 2 * direction][column]);
      }
    }
    //diagonal pawn moves at captures
    if (
      column < 7
      && ((board[row + direction][column + 1].piece !== PieceType.Empty
        && board[row + direction][column + 1].white !== white))
    ) {
      moves.push(board[row + direction][column + 1]);
    }
    if (column > 0
      && ((board[row + direction][column - 1].piece !== PieceType.Empty
        && board[row + direction][column - 1].white !== white))
    ) {
      moves.push(board[row + direction][column - 1]);
    }
    //en Passent check
    if (enPassent?.row === row && Math.abs(enPassent.column - column) === 1) {
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
      return this.inField(position.row, position.column);
    })
    for (let position of positions) {
      if (board[position.row][position.column].piece === PieceType.Empty || board[position.row][position.column].white !== white) {
        moves.push(board[position.row][position.column]);
      }
    }
    return moves;
  }

  bishopMove(piece: Piece, board: Cell[][], white: boolean): Cell[] {
    let moves: Cell[] = [];
    //down right
    moves.push(...this.straightLineMoves(board, piece.position, 1, 1, white));
    //down left
    moves.push(...this.straightLineMoves(board, piece.position, 1, -1, white));
    //up right
    moves.push(...this.straightLineMoves(board, piece.position, -1, 1, white));
    //up left
    moves.push(...this.straightLineMoves(board, piece.position, -1, -1, white));
    return moves;
  }

  rookMove(piece: Piece, board: Cell[][], white: boolean): Cell[] {
    let moves: Cell[] = [];
    //up
    moves.push(...this.straightLineMoves(board, piece.position, -1, 0, white));
    //down
    moves.push(...this.straightLineMoves(board, piece.position, 1, 0, white));
    //left
    moves.push(...this.straightLineMoves(board, piece.position, 0, -1, white));
    //right
    moves.push(...this.straightLineMoves(board, piece.position, 0, 1, white));
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
        if (i === 0 && j === 0) {
          continue;
        }
        if (!this.inField(row + i, column + 1)) {
          continue;
        }
        if (board[row + i][column + j].piece === PieceType.Empty
          || board[row + i][column + j].white === !white) {
          moves.push(board[row + i][column + j]);
          continue;
        }
      }
    }
    // castle
    if (!piece.moved) {
      let rooks = pieces.filter(piece => piece.type === PieceType.Rook);;
      for (let rook of rooks) {
        if (rook.moved) {
          continue;
        }
        let empty = true;
        let direction = (rook.position.column - column) / Math.abs(rook.position.column - column);
        for (let column = piece.position.column + direction; column !== rook.position.column; column += direction) {
          if (board[piece.position.row][column].piece !== PieceType.Empty) {
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

  straightLineMoves(board: Cell[][], position: Position, rowDirection: number, colDirection: number, white: boolean): Cell[] {
    let moves: Cell[] = [];
    for (let i = 1; this.inField(position.row + i * rowDirection, position.column + i * colDirection); i++) {
      if (board[position.row + i * rowDirection][position.column + i * colDirection].piece === PieceType.Empty) {
        moves.push(board[position.row + i * rowDirection][position.column + i * colDirection]);
        continue;
      }
      if (board[position.row + i * rowDirection][position.column + i * colDirection].white !== white) {
        moves.push(board[position.row + i * rowDirection][position.column + i * colDirection]);
      }
      break;
    }
    return moves;
  }

  inField(row: number, column: number): boolean {
    return row >= 0 && row <= 7 && column >= 0 && column <= 7;
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
