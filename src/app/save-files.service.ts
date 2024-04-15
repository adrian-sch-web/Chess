import { Injectable } from '@angular/core';
import { GameService } from './game.service';
import { Piece } from './data-objects/Piece';
import { Position } from './data-objects/Position';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

@Injectable({
  providedIn: 'root'
})
export class SaveFilesService {
  private url = 'https://localhost:7190/SaveLoadChess';
  public saveId: string = "";


  constructor(private game: GameService, private http: HttpClient) { }

  async save() {
    let gameDto = new GameDTO(
      this.game.whitePieces(),
      this.game.blackPieces(),
      this.game.whitesTurn(),
      this.game.turnCount,
      this.game.movesSinceChange(),
      this.game.pgn,
      this.game.enPassent
    );
    let states = this.game.boardStates();
    for (let entry of states) {
      gameDto.boardStates.push(new BoardStateDTO(entry[0], entry[1]));
    }
    let id = await firstValueFrom(this.http.post(this.url + '/SaveGame', gameDto));
    this.saveId = id.toString();
  }

  async load(input: string) {
    let gameDto = await firstValueFrom(this.http.get<GameDTO>(this.url + '/LoadGame?key=' + input));
    this.game.whitePieces.set(gameDto.whitePieces);
    this.game.blackPieces.set(gameDto.blackPieces);
    this.game.whitesTurn.set(gameDto.whitesTurn);
    this.game.turnCount = gameDto.turnCount;
    this.game.movesSinceChange.set(gameDto.movesSinceChange);
    this.game.enPassent = gameDto.enPassent;
    var readStates = gameDto.boardStates;
    let writeStates: Map<string,number> = new Map<string,number>();
    for(let state of readStates){
      writeStates.set(state.state,state.occurences);
    }
    this.game.boardStates.set(writeStates);
  }
}

export class GameDTO {
  whitePieces: Piece[];
  blackPieces: Piece[];
  whitesTurn: boolean;
  turnCount: number;
  movesSinceChange: number;
  boardStates: BoardStateDTO[] = [];
  enPassent?: Position;
  notation: string;
  id?: string;

  constructor(
    whitePieces: Piece[],
    blackPieces: Piece[],
    whitesTurn: boolean,
    turnCount: number,
    movesSinceChange: number,
    notation: string,
    enPassent?: Position,
    id?: string,
  ) {
    this.id = id;
    this.whitePieces = whitePieces;
    this.blackPieces = blackPieces;
    this.whitesTurn = whitesTurn;
    this.turnCount = turnCount;
    this.movesSinceChange = movesSinceChange
    this.notation = notation;
    this.enPassent = enPassent;
  }
}

export class BoardStateDTO {
  state: string;
  occurences: number;

  constructor(state: string, occurences: number) {
    this.state = state;
    this.occurences = occurences;
  }
}