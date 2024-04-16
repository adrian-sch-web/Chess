import { BoardStateDTO } from "./BoardStateDTO";
import { Piece } from "./Piece";
import { Position } from "./Position";

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