import { Component } from '@angular/core';
import { PieceType } from '../Piece';
import { Cell } from '../Cell';
import { Position } from '../Position';
import { PieceComponent } from '../piece/piece.component';
import { State } from '../State';
import { GameOverComponent } from '../game-over/game-over.component';
import { GameService } from '../game.service';
import { JsonPipe } from '@angular/common';

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
  flip: boolean = false;
  promotePieces: number[] = [5, 4, 3, 2];
  constructor(private game: GameService,) { }

  whitesTurn(): boolean {
    return this.game.whitesTurn();
  }

  board(): Cell[][] {
    let board = this.game.board();
    if (this.flip) {
      let temp: Cell[][] = [];
      for (let i = 7; i >= 0; i--) {
        temp.push([]);
        for (let j = 7; j >= 0; j--) {
          temp[7 - i].push(board[i][j]);
        }
      }
      return temp;
    }
    return board;
  }

  promoteColumn(): number | undefined {
    return this.game.promoteColumn;
  }

  selectedCell(): Position | undefined {
    return this.game.selectedCell();
  }

  selectedPossibleMoves(): Cell[] {
    return this.game.selectedPossibleMoves()
  }

  state(): State {
    return this.game.state();
  }

  promote(type: PieceType) {
    this.game.promote(type);
  }

  select(cell: Cell) {
    this.game.select(cell);
  }

  restart() {
    this.game.restart();
  }

  pgnMoveRow(index: number): number {
    return Math.ceil(index / 2);
  }

  getPgnSplit(): string[] {
    return this.game.pgn.split(' ');
  }

  boardStates():Map<string,number>{
    return this.game.boardStates();
  }
}
