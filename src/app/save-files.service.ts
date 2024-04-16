import { Injectable } from '@angular/core';
import { GameService } from './game.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { GameDTO } from './data-objects/GameDTO';

@Injectable({
  providedIn: 'root'
})
export class SaveFilesService {
  private url = 'https://localhost:7190/SaveLoadChess';

  constructor(private http: HttpClient) { }

  async save(gameDto: GameDTO):Promise<string> {
    let id = await firstValueFrom(this.http.post(this.url + '/SaveGame', gameDto));
    return id.toString();
  }

  async load(input: string): Promise<GameDTO> {
    let gameDto = await firstValueFrom(this.http.get<GameDTO>(this.url + '/LoadGame?key=' + input));
    return gameDto;
  }
}