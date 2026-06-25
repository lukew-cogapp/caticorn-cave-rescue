/** Keyboard wiring for the game: a held-key set + key event handlers. */
export interface InputHandlers {
	/** Currently-held input keys (lowercased / arrow names). */
	readonly keys: Set<string>;
	readonly onKeyDown: (e: KeyboardEvent) => void;
	readonly onKeyUp: (e: KeyboardEvent) => void;
}

/**
 * Build the keyboard handlers + held-key set. Movement/jump keys are tracked in
 * the set; arrow keys + space have their default scroll prevented. P toggles
 * pause (only once a run has started) via the supplied callbacks, and is not a
 * movement key.
 *
 * @param isStarted Returns whether a run is in progress (gates the P key).
 * @param togglePause Invoked when P is pressed mid-run.
 */
export function createInput(
	isStarted: () => boolean,
	togglePause: () => void,
): InputHandlers {
	const keys = new Set<string>();
	const onKeyDown = (e: KeyboardEvent): void => {
		if (
			["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
		) {
			e.preventDefault();
		}
		// P toggles pause (only mid-run); it isn't a movement key.
		if ((e.key === "p" || e.key === "P") && isStarted()) {
			togglePause();
			return;
		}
		keys.add(e.key);
	};
	const onKeyUp = (e: KeyboardEvent): void => {
		keys.delete(e.key);
	};
	return { keys, onKeyDown, onKeyUp };
}
