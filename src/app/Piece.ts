import { Position } from "./Position";

export interface Piece {
    position: Position;
    moved: boolean;
    type: PieceType;
}

export enum PieceType {
    Empty,
    Pawn,
    Knight,
    Bishop,
    Rook,
    Queen,
    King
}