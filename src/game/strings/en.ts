/**
 * All user-facing English strings, in one place for easy review and future
 * localisation. Import `EN` and reference keys rather than hardcoding copy.
 */
export const EN = {
	/** Page + game title and tagline. */
	title: "Caticorn Cave Rescue",
	tagline: "Free every caticorn, then reach the glowing exit. Mind the pits!",
	metaDescription:
		"Save the caticorns trapped in the cave! A PixiJS platformer.",

	/** Start / character-select screen. */
	chooseHero: "Choose your hero",
	startButton: "Start rescue",
	controlsHint: "Move: Arrow keys / WASD  ·  Jump: Up / Space / W",

	/** In-canvas HUD. */
	hudRescued: (rescued: number, total: number) => `Rescued ${rescued}/${total}`,
	hudScore: (score: number) => `Score ${score}`,
	hudLives: (lives: number) => `Lives ${lives}`,
	/** Level readout, e.g. "The Shallows  ·  2/4". */
	hudLevel: (name: string, index: number, total: number) =>
		`${name}  ·  ${index}/${total}`,

	/** Win / lose overlay. */
	wonTitle: "All caticorns saved!",
	wonSub: "You cleared every cave. Hero of the realm.",
	lostTitle: "Out of lives",
	lostSub: (rescued: number) => `You rescued ${rescued} this run. Try again?`,
	playAgain: "Play again",
	/** Game-over summary shown on the start screen, e.g. "Game over - 4 caticorns saved in 1:23". */
	runSummary: (rescued: number, time: string) =>
		`Game over - ${rescued} caticorn${rescued === 1 ? "" : "s"} saved in ${time}. Pick a hero to try again!`,

	/** Touch control button labels / aria. */
	moveLeft: "Move left",
	moveRight: "Move right",
	jump: "Jump",

	/** Shown on portrait phones prompting the player to turn the device. */
	rotateHint: "Rotate your device to landscape to play",

	/** Fullscreen toggle. */
	fullscreen: "Fullscreen",
	exitFullscreen: "Exit",

	/** Footer controls line. */
	controlsFooter:
		"Controls: Arrow keys / WASD to move, Up / Space / W to jump. Bounce on trampolines, dodge baddies, avoid the poop!",

	/** Character display names (keyed by PlayerVariant id). */
	characters: {
		aubrey: "Aubrey",
		quinn: "Quinn",
		summer: "Summer",
		hallie: "Hallie",
	} as Record<string, string>,

	/** Level display names (keyed by internal level name). */
	levels: {
		"The Shallows": "The Shallows",
		"Crystal Hollow": "Crystal Hollow",
		"Bat Roost": "Bat Roost",
		"Dragon's Maw": "Dragon's Maw",
	} as Record<string, string>,
} as const;
