import { Component, computed, effect, signal } from '@angular/core';
import { Piece, PieceType } from '../Piece';
import { Cell } from '../Cell';
import { Position } from '../Position';
import { PieceComponent } from '../piece/piece.component';
import { State } from '../State';
import { GameOverComponent } from '../game-over/game-over.component';
import { CheckService } from '../check.service';
import { MovesService } from '../moves.service';
import { NotationService } from '../notation.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    PieceComponent,
    GameOverComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {

  constructor(
    private check: CheckService,
    private moves: MovesService,
    private notation: NotationService
  ) {
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
  // portatable game notation
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
    let pieces = this.whitesTurn() ? this.whitePieces() : this.blackPieces();
    for (let piece of pieces) {
      let pieceMoves = this.getPossibleMoves(piece);
      if (pieceMoves.length > 0) {
        moves.set(this.board()[piece.position.row][piece.position.column], pieceMoves);
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
      (start.column != end.column ? this.notation.columnLetter(start.column) + "x" : "")
      + this.notation.cellName(end) + "=" + this.notation.letter(type);
    this.executeMove(start, end, type);
    this.promoteColumn = undefined;
    this.selectedCell.set(undefined);
    this.whitesTurn.update(turn => !turn);
  }

  getPossibleMoves(piece: Piece): Cell[] {
    let moves: Cell[];
    switch (piece.type) {
      case PieceType.Pawn:
        moves = this.moves.pawnMove(piece, this.board(), this.whitesTurn(), this.enPassent);
        break;
      case PieceType.Knight:
        moves = this.moves.knightMove(piece, this.board(), this.whitesTurn());
        break;
      case PieceType.Bishop:
        moves = this.moves.bishopMove(piece, this.board(), this.whitesTurn());
        break;
      case PieceType.Rook:
        moves = this.moves.rookMove(piece, this.board(), this.whitesTurn());
        break;
      case PieceType.Queen:
        moves = this.moves.queenMove(piece, this.board(), this.whitesTurn());
        break;
      case PieceType.King:
        moves = this.moves.kingMove(
          piece,
          this.board(),
          this.whitesTurn() ? this.whitePieces() : this.blackPieces(),
          this.whitesTurn()
        );
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
              (start.column != end.column ? this.notation.columnLetter(start.column) + "x" : "") :
              (this.notation.letter(type) + this.solveAmbiguity(start, end, type) + (this.board()[end.row][end.column].piece == PieceType.Empty ? "" : "x"))
          )
          + this.notation.cellName(end)));
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
      return this.notation.columnLetter(start.column);
    }
    let sameRow = player.filter(piece => piece.position.row == start.row)
    if (sameRow.length == 1) {
      return "" + (8 - start.row);
    }
    return this.notation.cellName(start);
  }

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
