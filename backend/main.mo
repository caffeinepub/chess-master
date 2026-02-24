import AccessControl "authorization/access-control";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import MixinAuthorization "authorization/MixinAuthorization";



actor {
  type PieceType = { #pawn; #knight; #bishop; #rook; #queen; #king };
  type Color = { #white; #black };
  type Position = { x : Nat; y : Nat };
  type Piece = { pieceType : PieceType; position : Position; color : Color };
  type GameState = {
    board : [[?Piece]];
    currentTurn : Color;
    winner : ?Color;
    startTime : Time.Time;
    whitePlayer : Principal;
    blackPlayer : Principal;
    enPassantTarget : ?Position;
  };
  public type PlayerStats = { points : Nat; wins : Nat; gamesPlayed : Nat; draws : Nat; losses : Nat };
  type UserProfile = { name : Text };
  type AIMatchResult = { #win; #loss; #draw };

  let games = Map.empty<Text, GameState>();
  let playerStats = Map.empty<Principal, PlayerStats>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  func getOrInitStats(p : Principal) : PlayerStats {
    switch (playerStats.get(p)) {
      case (null) {
        {
          points = 0;
          wins = 0;
          gamesPlayed = 0;
          draws = 0;
          losses = 0;
        };
      };
      case (?stats) { stats };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getPlayerStats() : async PlayerStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get player stats");
    };
    getOrInitStats(caller);
  };

  public shared ({ caller }) func recordAIMatchResult(result : AIMatchResult) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record AI match results");
    };

    let current = getOrInitStats(caller);

    let updated : PlayerStats = switch (result) {
      case (#win) {
        {
          current with
          points = current.points + 10;
          wins = current.wins + 1;
          gamesPlayed = current.gamesPlayed + 1;
        };
      };
      case (#loss) {
        {
          current with
          gamesPlayed = current.gamesPlayed + 1;
          losses = current.losses + 1;
        };
      };
      case (#draw) {
        {
          current with
          points = current.points + 3;
          draws = current.draws + 1;
          gamesPlayed = current.gamesPlayed + 1;
        };
      };
    };

    playerStats.add(caller, updated);
  };

  public shared ({ caller }) func createGame(gameId : Text, whitePlayer : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create games");
    };

    if (games.containsKey(gameId)) {
      Runtime.trap("Game with this ID already exists");
    };

    let emptyBoard : [[?Piece]] = Array.tabulate(
      8,
      func(i) {
        Array.tabulate(8, func(j) { null });
      },
    );

    let gameState : GameState = {
      board = emptyBoard;
      currentTurn = #white;
      winner = null;
      startTime = Time.now();
      whitePlayer;
      blackPlayer = Principal.fromText("aaaaa-aa");
      enPassantTarget = null;
    };

    games.add(gameId, gameState);
  };

  public shared ({ caller }) func joinGame(gameId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join games");
    };

    switch (games.get(gameId)) {
      case (null) { Runtime.trap("Game not found") };
      case (?gameState) {
        if (gameState.blackPlayer != Principal.fromText("aaaaa-aa")) {
          Runtime.trap("Game already has two players");
        };

        if (caller == gameState.whitePlayer) {
          Runtime.trap("Cannot join your own game as the opposing player");
        };

        let updatedGameState = { gameState with blackPlayer = caller };
        games.add(gameId, updatedGameState);
      };
    };
  };

  public query ({ caller }) func getGameState(gameId : Text) : async ?GameState {
    switch (games.get(gameId)) {
      case (null) { Runtime.trap("Game not found") };
      case (?gameState) {
        if (
          caller != gameState.whitePlayer and
          caller != gameState.blackPlayer and
          not AccessControl.isAdmin(accessControlState, caller)
        ) {
          Runtime.trap("Unauthorized: Only players or admin can view game");
        };
        ?gameState;
      };
    };
  };

  public shared ({ caller }) func updateStats(winner : ?Principal, white : Principal, black : Principal, isDraw : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update stats");
    };

    let whiteStats = getOrInitStats(white);
    let blackStats = getOrInitStats(black);

    switch (winner, isDraw) {
      case (?winningPlayer, false) {
        let winnerStats = getOrInitStats(winningPlayer);

        let loser = if (winningPlayer == white) { black } else { white };
        let loserStats = if (winningPlayer == white) { blackStats } else { whiteStats };

        playerStats.add(
          winningPlayer,
          {
            winnerStats with
            points = winnerStats.points + 10;
            wins = winnerStats.wins + 1;
            gamesPlayed = winnerStats.gamesPlayed + 1;
          },
        );
        playerStats.add(
          loser,
          {
            loserStats with
            gamesPlayed = loserStats.gamesPlayed + 1;
            losses = loserStats.losses + 1;
          },
        );
      };
      case (_, true) {
        playerStats.add(
          white,
          {
            whiteStats with
            points = whiteStats.points + 3;
            draws = whiteStats.draws + 1;
            gamesPlayed = whiteStats.gamesPlayed + 1;
          },
        );
        playerStats.add(
          black,
          {
            blackStats with
            points = blackStats.points + 3;
            draws = blackStats.draws + 1;
            gamesPlayed = blackStats.gamesPlayed + 1;
          },
        );
      };
      case (_, _) {};
    };
  };

  public query func getLeaderboard() : async [(Principal, PlayerStats)] {
    playerStats.toArray();
  };
};
