import { PieceType } from "./Piece";
import { Position } from "./Position";

export interface Cell{
    position: Position,
    piece: PieceType,
    white: boolean
}