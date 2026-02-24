# Specification

## Summary
**Goal:** Fix the AI not making moves in 1 Player and Auto Play modes in Chess Master.

**Planned changes:**
- Fix the bug in `ChessGame.tsx` where the AI (Black) does not automatically play after the human (White) makes a move in 1 Player mode
- Fix the bug in `ChessGame.tsx` where AI moves do not alternate correctly in Auto Play mode
- Audit and fix `useEffect` hooks and state update flow to eliminate stale closures, missing dependencies, and race conditions that cause AI move triggers to be silently dropped
- Use `useRef` for mutable values (current board, current player) read inside `setTimeout` or async callbacks driving the AI move loop

**User-visible outcome:** After making a move in 1 Player mode, the AI automatically responds with its move (with thinking indicator and delay). In Auto Play mode, both sides alternate moves continuously until the game ends or the user stops it.
