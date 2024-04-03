import { Injectable } from '@angular/core';
import { CheckService } from './check.service';
import { MovesService } from './moves.service';
import { NotationService } from './notation.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(
    private check: CheckService,
    private moves: MovesService,
    private notation: NotationService
  ) {
    // // increments the turncounter
    // effect(() => {
    //   if (this.whitesTurn()) {
    //     this.turnCount++;
    //   }
    //   this.pgnAddCheck();
    // });
    // // updates notation after game end
    // effect(() => {
    //   switch (this.state()) {
    //     case State.CheckMate:
    //       this.pgn += "#";
    //       this.pgn += this.whitesTurn() ? " 0-1" : " 1-0";
    //       break;
    //     case State.StaleMate:
    //     case State.ThreeFoldRepitition:
    //     case State.MovesRule:
    //     case State.InsufficientMaterial:
    //       this.pgn += " 1/2-1/2";
    //   }
    // });
  }
}
