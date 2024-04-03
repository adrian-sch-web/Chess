import { Injectable, computed, effect, signal } from '@angular/core';
import { CheckService } from './check.service';
import { MovesService } from './moves.service';
import { NotationService } from './notation.service';
import { State } from './State';
import { Cell } from './Cell';
import { Piece, PieceType } from './Piece';
import { Position } from './Position';

@Injectable({
  providedIn: 'root'
})
export class GameService {

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
        case State.InsufficientMaterial:
          this.pgn += " 1/2-1/2";
      }
    });
  }

  whitePieces = signal<Piece[]>(this.moves.startPosition(true));
  blackPieces = signal<Piece[]>(this.moves.startPosition(false));
  selectedCell = signal<Position | undefined>(undefined);
  whitesTurn = signal<boolean>(true);
  movesSinceChange = signal<number>(0);
  boardStates = signal<Map<string, number>>(new Map());
  //stores the Position of potential En Passent targets
  enPassent?: Position;
  promoteColumn?: number;
  turnCount: number = 0;
  // portable game notation
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
    if (
      this.check.insufficienMaterialCheck(this.whitePieces()) &&
      this.check.insufficienMaterialCheck(this.blackPieces())
    ) {
      return State.InsufficientMaterial;
    }
    return State.Running;
  });

  possibleMoves = computed<Map<Cell, Cell[]>>(() => {
    let moves = new Map<Cell, Cell[]>();
    let playerPieces = this.whitesTurn() ? this.whitePieces() : this.blackPieces();
    let opponentPieces = this.whitesTurn() ? this.blackPieces() : this.whitePieces();
    for (let piece of playerPieces) {
      let pieceMoves = this.moves.getPossibleMoves(
        piece,
        this.board(),
        playerPieces.filter(a => a.position.row != piece.position.row || a.position.column != piece.position.column),
        opponentPieces,
        this.whitesTurn(),
        this.enPassent
      );
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
      this.movesSinceChange.update(moveCount => moveCount + 1)
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

  select(cell: Cell) {
    if (this.state() != State.Running) {
      return;
    }
    if (this.selectedCell() != undefined) {
      if (this.selectedPossibleMoves().indexOf(cell) != -1) {
        if (this.board()[this.selectedCell()!.row][this.selectedCell()!.column].piece == PieceType.Pawn &&
          (cell.position.row == 0 || cell.position.row == 7)) {
          this.promoteColumn = cell.position.column;
          return;
        }
        this.move(this.selectedCell()!, cell.position);
        return;
      }
    }
    this.promoteColumn = undefined;
    this.selectedCell.set(cell.position);
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
      let playerPieces = this.whitesTurn() ? this.whitePieces() : this.blackPieces();
      let opponentPieces = this.whitesTurn() ? this.blackPieces() : this.whitePieces();
      return this.moves.getPossibleMoves(
        piece,
        this.board(),
        playerPieces.filter(a => a.position.row != piece.position.row || a.position.column != piece.position.column),
        opponentPieces,
        this.whitesTurn(),
        this.enPassent
      ).some(move => move.position.row == end.row && move.position.column == end.column);
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

  saveBoardState() {
    let boardState: string = this.check.getFEN(this.board(), this.whitesTurn());
    if (this.boardStates().has(boardState)) {
      this.boardStates.update(state => state.set(boardState, state.get(boardState)! + 1));
    }
    else {
      this.boardStates.update(state => state.set(boardState, 1))
    }
  }

  restart() {
    this.whitePieces.set(this.moves.startPosition(true));
    this.blackPieces.set(this.moves.startPosition(false));
    this.selectedCell.set(undefined);
    this.whitesTurn.set(true);
    this.movesSinceChange.set(0);
    this.boardStates.set(new Map());
    this.enPassent = undefined;
    this.promoteColumn = undefined;
    this.turnCount = 0;
    this.pgn = "";
  }
}
