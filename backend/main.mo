import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";



actor {
  type PieceType = { #pawn; #knight; #bishop; #rook; #queen; #king };
  type Color = { #white; #black };

  type Position = { x : Nat; y : Nat };

  type Piece = {
    pieceType : PieceType;
    position : Position;
    color : Color;
  };

  type GameState = {
    board : [[?Piece]];
    currentTurn : Color;
    winner : ?Color;
    startTime : Time.Time;
    whitePlayer : Principal;
    blackPlayer : Principal;
  };

  type PlayerStats = {
    points : Nat;
    wins : Nat;
    gamesPlayed : Nat;
    draws : Nat;
    losses : Nat;
  };

  type UserProfile = { name : Text };

  let games = Map.empty<Text, GameState>();
  let playerStats = Map.empty<Principal, PlayerStats>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  // ── User profile functions (required by instructions) ──────────────────────
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

  // ── Player stats ───────────────────────────────────────────────────────────
  // Users can view their own stats; admins can view anyone's stats.
  public query ({ caller }) func getPlayerStats(player : Principal) : async ?PlayerStats {
    if (caller != player and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own stats");
    };
    playerStats.get(player);
  };

  // ── Game management ────────────────────────────────────────────────────────
  // Only authenticated users can create games.
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
    };

    games.add(gameId, gameState);
  };

  // Only authenticated users can join games.
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

  // Only players in the game or admins can view game state.
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

  // updateStats is admin-only: awarding points must be a privileged operation
  // to prevent any user from fraudulently granting themselves or others points.
  public shared ({ caller }) func updateStats(winner : ?Principal, white : Principal, black : Principal, isDraw : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update stats");
    };

    let defaultStats : PlayerStats = {
      points = 0;
      wins = 0;
      gamesPlayed = 0;
      draws = 0;
      losses = 0;
    };

    let whiteStats = switch (playerStats.get(white)) {
      case (null) { defaultStats };
      case (?stats) { stats };
    };

    let blackStats = switch (playerStats.get(black)) {
      case (null) { defaultStats };
      case (?stats) { stats };
    };

    switch (winner, isDraw) {
      case (?winningPlayer, false) {
        let winnerStats = switch (playerStats.get(winningPlayer)) {
          case (null) { defaultStats };
          case (?stats) { stats };
        };

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

  // Leaderboard is publicly accessible — no authentication required.
  // Restricting it to logged-in users would prevent guests from viewing rankings.
  // We return leaderboard in random hashed order for now but plan to add .sortInPlace method once available.
  public query func getLeaderboard() : async [(Principal, PlayerStats)] {
    playerStats.toArray();
  };
};
