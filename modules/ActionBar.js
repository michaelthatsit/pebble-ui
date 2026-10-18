// An ActionBarLayer: the bar at the right edge, ACTION_BAR_WIDTH wide, with
// icons for Up, Select and Down. Put it last in the window so it is on top.
//
//   ActionBar({ background: GColor.JaegerGreen, up: bitmapSkin(RESOURCE_ID.TICK), down: bitmapSkin(RESOURCE_ID.CROSS) })
//
// $: background (the window's colour: on round the bar's inner edge is an
// anti-aliased arc blended into it), color (the bar's, Black), up / select /
// down (Skins, drawn where the firmware puts its icons: measured for Up and
// Down; Select is centred, unmeasured). The buttons themselves are the
// window's to handle.
import { ROUND, ACTION_BAR_WIDTH, GColor, colorLevels, blendToBlack } from "pebble-ui/sdk";

const ICON_LEFT = ROUND ? 10 : 9;
const ICON_TOP = ROUND ? 80 : 45;
// Round: the inner edge is a circle of this radius centred this far right of the
// bar's left edge (fitted to the C app on the gabbro emulator).
const ROUND_RADIUS = 274.4;

class RoundBarBehavior extends Behavior {
	onCreate(port, $) {
		this.color = $.color ?? GColor.Black;
		this.levels = colorLevels($.background ?? GColor.White);
	}
	onDraw(port) {
		const width = port.width, height = port.height;
		const cx = width - ACTION_BAR_WIDTH + ROUND_RADIUS, cy = height / 2;
		for (let row = 0; row < height; row++) {
			const dy = row + 0.5 - cy;
			const edge = cx - Math.sqrt(ROUND_RADIUS * ROUND_RADIUS - dy * dy);
			const left = Math.ceil(edge);
			if (left >= width)
				continue;
			port.fillColor(this.color, left, row, width - left, 1);
			const coverage = left - edge;
			if (coverage > 0)
				port.fillColor(blendToBlack(this.levels, coverage), left - 1, row, 1, 1);
		}
	}
}

const icon = ($, skin, where) => skin ? Content($, { right: ACTION_BAR_WIDTH - ICON_LEFT - skin.width, skin, ...where }) : null;

export const ActionBar = Container.template($ => ({
	left: 0, right: 0, top: 0, bottom: 0,
	contents: [
		ROUND
			? Port($, { left: 0, right: 0, top: 0, bottom: 0, Behavior: RoundBarBehavior })
			: Content($, { right: 0, top: 0, bottom: 0, width: ACTION_BAR_WIDTH, skin: new Skin({ fill: $.color ?? GColor.Black }) }),
		icon($, $.up, { top: ICON_TOP }),
		icon($, $.select, {}),
		icon($, $.down, { bottom: ICON_TOP }),
	],
}));

export default ActionBar;
