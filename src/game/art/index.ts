import { PLAYER_H, PLAYER_W } from "../types";

export {
	CATICORN_PALETTE_COUNT,
	CHARACTERS,
	drawCaticorn,
	drawGhost,
	drawPlayer,
	type PlayerVariant,
} from "./characters";
export { drawFirefly, drawParticle } from "./particles";
export {
	drawCage,
	drawExit,
	drawExitGlow,
	drawFlute,
	drawMonster,
	drawPoop,
	drawShackle,
	drawTrampoline,
} from "./props";
export { drawBackground, drawDecor, drawGrassBlades } from "./scenery";

// Reference the player dimensions so they stay in sync with the renderer scale.
void PLAYER_W;
void PLAYER_H;
