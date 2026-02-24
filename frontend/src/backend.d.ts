import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Position {
    x: bigint;
    y: bigint;
}
export interface Piece {
    pieceType: PieceType;
    color: Color;
    position: Position;
}
export interface GameState {
    startTime: Time;
    whitePlayer: Principal;
    blackPlayer: Principal;
    winner?: Color;
    enPassantTarget?: Position;
    currentTurn: Color;
    board: Array<Array<Piece | null>>;
}
export interface UserProfile {
    name: string;
}
export interface PlayerStats {
    gamesPlayed: bigint;
    wins: bigint;
    losses: bigint;
    draws: bigint;
    points: bigint;
}
export enum AIMatchResult {
    win = "win",
    draw = "draw",
    loss = "loss"
}
export enum Color {
    black = "black",
    white = "white"
}
export enum PieceType {
    king = "king",
    pawn = "pawn",
    rook = "rook",
    queen = "queen",
    knight = "knight",
    bishop = "bishop"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGame(gameId: string, whitePlayer: Principal): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGameState(gameId: string): Promise<GameState | null>;
    getLeaderboard(): Promise<Array<[Principal, PlayerStats]>>;
    getPlayerStats(): Promise<PlayerStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinGame(gameId: string): Promise<void>;
    recordAIMatchResult(result: AIMatchResult): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateStats(winner: Principal | null, white: Principal, black: Principal, isDraw: boolean): Promise<void>;
}
