import { Component, computed, effect, signal } from '@angular/core';
import { Piece, PieceType } from '../Piece';
import { JsonPipe } from '@angular/common';
import { Cell } from '../Cell';
import { Position } from '../Position';
import { PieceComponent } from '../piece/piece.component';
import { State } from '../State';
import { GameOverComponent } from '../game-over/game-over.component';
import { CheckService } from '../check.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    PieceComponent,
    GameOverComponent,
    JsonPipe
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {

  constructor(private check: CheckService) {
    // increments the turncounter
    effect(() => {
      if (this.whitesTurn()) {
        this.turnCount++;
      }
      this.pgnAddCheck();
    });
    // updates notation after game end
    effect(() => {
      switch (this.state()) {
        case State.CheckMate:
          this.pgn += "#";
          this.pgn += this.whitesTurn() ? " 0-1" : " 1-0";
          break;
        case State.StaleMate:
        case State.ThreeFoldRepitition:
        case State.MovesRule:
          this.pgn += " 1/2-1/2";
      }
    });
  }

  whitePieces = signal<Piece[]>(this.check.startPosition(true));
  blackPieces = signal<Piece[]>(this.check.startPosition(false));
  selectedCell = signal<Position | undefined>(undefined);
  whitesTurn = signal<boolean>(true);
  movesSinceChange = signal<number>(0);
  boardStates = signal<Map<string, number>>(new Map());
  enPassent?: Position;
  promoteColumn?: number;
  turnCount: number = 0;
  pgn: string = "";

  state = computed<State>(() => {
    if (this.possibleMoves().size == 0) {
      if (this.check.kingInCheck(this.whitesTurn() ? this.whitePieces() : this.blackPieces(),
        this.whitesTurn() ? this.blackPieces() : this.whitePieces(), this.whitesTurn())) {
        return State.CheckMate;
      }
      return State.StaleMate;
    }
    if (this.movesSinceChange() >= 80) {
      return State.MovesRule;
    }
    for (var value of this.boardStates().values()) {
      if (value == 3) {
        return State.ThreeFoldRepitition
      }
    }
    return State.Running;
  });



  possibleMoves = computed<Map<Cell, Cell[]>>(() => {
    let moves = new Map<Cell, Cell[]>();
    if (this.whitesTurn()) {
      for (let piece of this.whitePieces()) {
        let pieceMoves = this.getPossibleMoves(piece);
        if (pieceMoves.length > 0) {
          moves.set(this.board()[piece.position.row][piece.position.column], pieceMoves);
        }
      }
    } else {
      for (let piece of this.blackPieces()) {
        let pieceMoves = this.getPossibleMoves(piece);
        if (pieceMoves.length > 0) {
          moves.set(this.board()[piece.position.row][piece.position.column], pieceMoves);
        }
      }
    }
    return moves;
  });

  selectedPossibleMoves = computed<Cell[]>(() => {
    let temp: Cell[] | undefined;
    let select = this.selectedCell();
    if (select != undefined) {
      temp = this.possibleMoves().get(this.board()[select.row][select.column]);
    }
    if (temp != undefined) {
      return temp;
    }
    return [];
  });

  board = computed<Cell[][]>(() => {
    let temp: Cell[][] = [];
    for (let i = 0; i < 8; i++) {
      temp.push([]);
      for (let j = 0; j < 8; j++) {
        temp[i].push({ position: { row: i, column: j }, piece: PieceType.Empty, white: false })
      }
    }
    for (let piece of this.whitePieces()) {
      temp[piece.position.row][piece.position.column] = { position: piece.position, piece: piece.type, white: true };
    }
    for (let piece of this.blackPieces()) {
      temp[piece.position.row][piece.position.column] = { position: piece.position, piece: piece.type, white: false };
    }
    return temp;
  })



  promote(type: PieceType) {
    let start = this.selectedCell()!;
    let end: Position = { row: this.whitesTurn() ? 0 : 7, column: this.promoteColumn! };
    this.enPassent = undefined;
    this.pgn += " " + (this.whitesTurn() ? this.turnCount + "." : "") +
      (start.column != end.column ? this.columnLetter(start.column) + "x" : "")
      + this.cellName(end) + "=" + this.letter(type);
    this.executeMove(start, end, type);
    this.promoteColumn = undefined;
    this.selectedCell.set(undefined);
    this.whitesTurn.update(turn => !turn);
  }

  getPossibleMoves(piece: Piece): Cell[] {
    let moves: Cell[];
    switch (piece.type) {
      case PieceType.Pawn:
        moves = this.pawnMove(piece, this.whitesTurn());
        break;
      case PieceType.Knight:
        moves = this.knightMove(piece, this.whitesTurn());
        break;
      case PieceType.Bishop:
        moves = this.bishopMove(piece, this.whitesTurn());
        break;
      case PieceType.Rook:
        moves = this.rookMove(piece, this.whitesTurn());
        break;
      case PieceType.Queen:
        moves = this.queenMove(piece, this.whitesTurn());
        break;
      case PieceType.King:
        moves = this.kingMove(piece, this.whitesTurn());
        break;
      default:
        return [];
    }
    let playerPieces: Piece[];
    let opponentPieces: Piece[];
    if (this.whitesTurn()) {
      playerPieces = this.whitePieces().filter(a => a.position.row != piece.position.row || a.position.column != piece.position.column);
      opponentPieces = this.blackPieces()
    } else {
      playerPieces = this.blackPieces().filter(a => a.position.row != piece.position.row || a.position.column != piece.position.column);
      opponentPieces = this.whitePieces();
    }
    return moves.filter(move => {
      if (piece.type != PieceType.King || Math.abs(move.position.column - piece.position.column) < 2) {
        return !this.check.kingInCheck([...playerPieces, { position: move.position, moved: true, type: piece.type }],
          opponentPieces.filter(a => move.position.row != a.position.row || move.position.column != a.position.column), this.whitesTurn());
      } else {
        return !this.check.kingInCheck([...playerPieces, piece], opponentPieces, this.whitesTurn()) &&
          !this.check.kingInCheck([...playerPieces, {
            position: { row: piece.position.row, column: piece.position.column + Math.sign(move.position.column - piece.position.column) },
            moved: true,
            type: piece.type
          }],
            opponentPieces,
            this.whitesTurn()) &&
          !this.check.kingInCheck([...playerPieces, { position: move.position, moved: true, type: piece.type }], opponentPieces, this.whitesTurn());
      }
    });
  }

  pawnMove(piece: Piece, white: boolean): Cell[] {
    let moves: Cell[] = [];
    let direction = white ? -1 : 1;
    let row = piece.position.row;
    let column = piece.position.column;
    if (this.board()[row + direction][column].piece == PieceType.Empty) {
      moves.push(this.board()[row + direction][column]);
      if (!piece.moved && this.board()[row + 2 * direction][column].piece == PieceType.Empty) {
        moves.push(this.board()[row + 2 * direction][column]);
      }
    }
    if (
      column < 7
      && ((this.board()[row + direction][column + 1].piece != PieceType.Empty
        && this.board()[row + direction][column + 1].white != white))
    ) {
      moves.push(this.board()[row + direction][column + 1]);
    }
    if (column > 0
      && ((this.board()[row + direction][column - 1].piece != PieceType.Empty
        && this.board()[row + direction][column - 1].white != white))
    ) {
      moves.push(this.board()[row + direction][column - 1]);
    }
    if (this.enPassent && this.enPassent.row == row && Math.abs(this.enPassent.column - column) == 1) {
      moves.push(this.board()[this.enPassent.row + direction][this.enPassent.column]);
    }
    return moves;
  }

  knightMove(piece: Piece, white: boolean): Cell[] {
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
      if (this.board()[position.row][position.column].piece == PieceType.Empty || this.board()[position.row][position.column].white != white) {
        moves.push(this.board()[position.row][position.column]);
      }
    }
    return moves;
  }

  bishopMove(piece: Piece, white: boolean): Cell[] {
    let moves: Cell[] = [];
    let row = piece.position.row;
    let column = piece.position.column;
    for (let i = 1; row + i <= 7 && column + i <= 7; i++) {
      if (this.board()[row + i][column + i].piece == PieceType.Empty) {
        moves.push(this.board()[row + i][column + i]);
        continue;
      }
      if (this.board()[row + i][column + i].white != white) {
        moves.push(this.board()[row + i][column + i]);
      }
      break;
    }
    for (let i = 1; row + i <= 7 && column - i >= 0; i++) {
      if (this.board()[row + i][column - i].piece == PieceType.Empty) {
        moves.push(this.board()[row + i][column - i]);
        continue;
      }
      if (this.board()[row + i][column - i].white != white) {
        moves.push(this.board()[row + i][column - i]);
      }
      break;
    }
    for (let i = 1; row - i >= 0 && column + i <= 7; i++) {
      if (this.board()[row - i][column + i].piece == PieceType.Empty) {
        moves.push(this.board()[row - i][column + i]);
        continue;
      }
      if (this.board()[row - i][column + i].white != white) {
        moves.push(this.board()[row - i][column + i]);
      }
      break;
    }
    for (let i = 1; row - i >= 0 && column - i >= 0; i++) {
      if (this.board()[row - i][column - i].piece == PieceType.Empty) {
        moves.push(this.board()[row - i][column - i]);
        continue;
      }
      if (this.board()[row - i][column - i].white != white) {
        moves.push(this.board()[row - i][column - i]);
      }
      break;
    }
    return moves;
  }

  rookMove(piece: Piece, white: boolean): Cell[] {
    let moves: Cell[] = [];
    let row = piece.position.row;
    let column = piece.position.column;
    for (let i = 1; row + i <= 7; i++) {
      if (this.board()[row + i][column].piece == PieceType.Empty) {
        moves.push(this.board()[row + i][column]);
        continue;
      }
      if (this.board()[row + i][column].white != white) {
        moves.push(this.board()[row + i][column]);
      }
      break;
    }
    for (let i = 1; row - i >= 0; i++) {
      if (this.board()[row - i][column].piece == PieceType.Empty) {
        moves.push(this.board()[row - i][column]);
        continue;
      }
      if (this.board()[row - i][column].white != white) {
        moves.push(this.board()[row - i][column]);
      }
      break;
    }
    for (let i = 1; column + i <= 7; i++) {
      if (this.board()[row][column + i].piece == PieceType.Empty) {
        moves.push(this.board()[row][column + i]);
        continue;
      }
      if (this.board()[row][column + i].white != white) {
        moves.push(this.board()[row][column + i]);
      }
      break;
    }
    for (let i = 1; column - i >= 0; i++) {
      if (this.board()[row][column - i].piece == PieceType.Empty) {
        moves.push(this.board()[row][column - i]);
        continue;
      }
      if (this.board()[row][column - i].white != white) {
        moves.push(this.board()[row][column - i]);
      }
      break;
    }
    return moves;
  }

  queenMove(piece: Piece, white: boolean): Cell[] {
    let moves: Cell[] = [...this.bishopMove(piece, white), ...this.rookMove(piece, white)];
    return moves;
  }

  kingMove(piece: Piece, white: boolean): Cell[] {
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
        if (this.board()[row + i][column + j].piece == PieceType.Empty
          || this.board()[row + i][column + j].white == !white) {
          moves.push(this.board()[row + i][column + j]);
          continue;
        }
      }
    }
    if (!piece.moved) {
      let rooks: Piece[];
      if (white) {
        rooks = this.whitePieces().filter(piece => piece.type == PieceType.Rook);
      }
      else {
        rooks = this.blackPieces().filter(piece => piece.type == PieceType.Rook);
      }
      for (let rook of rooks) {
        if (rook.moved) {
          continue;
        }
        let empty = true;
        let direction = (rook.position.column - column) / Math.abs(rook.position.column - column);
        for (let column = piece.position.column + direction; column != rook.position.column; column += direction) {
          if (this.board()[piece.position.row][column].piece != PieceType.Empty) {
            empty = false;
          }
        }
        if (empty) {
          moves.push(this.board()[piece.position.row][piece.position.column + 2 * direction]);
        }
      }
    }
    return moves;
  }

  move(start: Position, end: Position) {
    this.enPassent = undefined;
    if (this.board()[start.row][start.column].piece == PieceType.Pawn) {
      if (Math.abs(end.row - start.row) != 1) {
        this.enPassent = end;
      }
      if (start.column != end.column && this.board()[end.row][end.column].piece == PieceType.Empty) {
        if (this.whitesTurn()) {
          this.blackPieces.update(pieces => [...pieces.filter(piece =>
            piece.position.row != start.row || piece.position.column != end.column
          )])
        } else {
          this.whitePieces.update(pieces => [...pieces.filter(piece =>
            piece.position.row != start.row || piece.position.column != end.column
          )])
        }
      }
    }
    this.pgn += this.createPgn(start, end, this.board()[start.row][start.column].piece);
    this.executeMove(start, end, this.board()[start.row][start.column].piece);
    this.selectedCell.set(undefined);
    this.whitesTurn.update(turn => !turn);
    this.saveBoardState();
  }

  executeMove(start: Position, end: Position, type: PieceType) {
    let castle = type == PieceType.King && Math.abs(start.column - end.column) > 1;
    let player: Piece[];
    let opponent: Piece[];
    if (type == PieceType.Empty) {
      return;
    }
    player = this.whitesTurn() ? this.whitePieces() : this.blackPieces();
    opponent = this.whitesTurn() ? this.blackPieces() : this.whitePieces();
    let toMove = player.find(piece => piece.position.row == start.row && piece.position.column == start.column);
    if (toMove?.type == PieceType.Pawn ||
      ((toMove?.type == PieceType.King || toMove?.type == PieceType.Rook) && !toMove.moved) ||
      this.board()[end.row][end.column].piece != PieceType.Empty) {
      this.movesSinceChange.set(1);
      this.boardStates.set(new Map());
    } else {
      this.movesSinceChange.update(a => a + 1)
    }
    opponent = opponent.filter(piece => piece.position.row != end.row || piece.position.column != end.column);
    player = player.filter(piece => piece.position.row != start.row || piece.position.column != start.column);
    player.push({ position: end, moved: true, type: type });
    if (castle) {
      if (start.column > end.column) {
        player = player.filter(piece => piece.position.row != end.row || piece.position.column != 0);
        player.push({ position: { row: end.row, column: end.column + 1 }, type: PieceType.Rook, moved: true });
      }
      else {
        player = player.filter(piece => piece.position.row != end.row || piece.position.column != 7);
        player.push({ position: { row: end.row, column: end.column - 1 }, type: PieceType.Rook, moved: true });
      }
    }
    this.whitePieces.set(this.whitesTurn() ? player : opponent);
    this.blackPieces.set(this.whitesTurn() ? opponent : player);

  }

  select(cell: Cell, position: Position) {
    if (this.state() != State.Running) {
      return;
    }
    if (this.selectedCell() != undefined) {
      if (this.selectedPossibleMoves().indexOf(cell) != -1) {
        if (this.board()[this.selectedCell()!.row][this.selectedCell()!.column].piece == PieceType.Pawn &&
          (position.row == 0 || position.row == 7)) {
          this.promoteColumn = position.column;
          return;
        }
        this.move(this.selectedCell()!, position);
        return;
      }
    }
    this.promoteColumn = undefined;
    this.selectedCell.set(position);
  }


  createPgn(start: Position, end: Position, type: PieceType): string {
    return " " + (this.whitesTurn() ? this.turnCount + "." : "") +
      (type == PieceType.King && end.column - start.column > 1 ? "O-O" :
        type == PieceType.King && start.column - end.column > 1 ? "O-O-O" : (
          (
            type == PieceType.Pawn ?
              (start.column != end.column ? this.columnLetter(start.column) + "x" : "") :
              (this.letter(type) + this.solveAmbiguity(start, end, type) + (this.board()[end.row][end.column].piece == PieceType.Empty ? "" : "x"))
          )
          + this.cellName(end)));
  }

  solveAmbiguity(start: Position, end: Position, type: PieceType): string {
    let player = this.whitesTurn() ? this.whitePieces() : this.blackPieces();
    player = player.filter(a => a.type == type);
    player = player.filter(piece => {
      return this.getPossibleMoves(piece).some(move => move.position.row == end.row && move.position.column == end.column);
    })
    if (player.length == 1) {
      return "";
    }
    let sameColumn = player.filter(piece => piece.position.column == start.column);
    if (sameColumn.length == 1) {
      return this.columnLetter(start.column);
    }
    let sameRow = player.filter(piece => piece.position.row == start.row)
    if (sameRow.length == 1) {
      return "" + (8 - start.row);
    }
    return this.cellName(start);
  }

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

  // portatable game notation
  pgnAddCheck() {
    let player = this.whitesTurn() ? this.whitePieces() : this.blackPieces();
    let opponent = this.whitesTurn() ? this.blackPieces() : this.whitePieces();
    if (this.state() != State.CheckMate && this.check.kingInCheck(player, opponent, this.whitesTurn())) {
      this.pgn += "+";
    }
  }

  pgnMoveRow(index: number): number {
    return Math.ceil(index / 2);
  }

  getPgnSplit(): string[] {
    return this.pgn.split(' ');
  }

  saveBoardState() {
    let boardState: string = this.check.getFEN(this.board(), this.whitesTurn());
    if (this.boardStates().has(boardState)) {
      this.boardStates.update(state => state.set(boardState, state.get(boardState)! + 1));
    }
    else {
      this.boardStates.update(state => state.set(boardState, 1))
    }
  }
}
