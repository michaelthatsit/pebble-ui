// A menu of two-line cells, as menu_cell_basic_draw draws a title with a
// subtitle on these displays (measured): 61 px cells, the title's box 1 px
// down, the subtitle (Gothic 24, not the SDK's 18: the firmware scales it) 25
// px down; on round the unfocused cells stay 61 px and show the title alone,
// its box centred.
//
//   new SubtitleMenu({ items: [{ title: "Push Day", subtitle: "5 exercises" }, ...], onSelect(index, item) {...} })
import { ROUND, FONT_KEY, TEXT_TOP_INSET } from "pebble-ui/sdk";
import Menu, { TITLE_BOX, TITLE_INSET } from "pebble-ui/Menu";

const CELL = 61;
const TITLE_TOP = 1;
const SUBTITLE_TOP = 25;
const UNFOCUSED_TITLE_TOP = 13;

class SubtitleBehavior extends Behavior {
	onReload(row, highlighted) {
		const compact = ROUND && !highlighted;
		row.first.coordinates = { left: 0, right: 0, top: compact ? UNFOCUSED_TITLE_TOP : TITLE_TOP, height: TITLE_BOX };
		row.last.visible = !compact;
	}
}

const SubtitleItem = Container.template($ => ({
	left: 0, right: 0, Behavior: SubtitleBehavior,
	contents: [
		Label($, { left: 0, right: 0, top: TITLE_TOP, height: TITLE_BOX, style: $.menu.titleTopStyle, string: $.item.title }),
		Label($, { left: 0, right: 0, top: SUBTITLE_TOP, height: 24, style: $.menu.subtitleStyle, string: $.item.subtitle ?? "" }),
	],
}));

export class SubtitleMenu extends Menu {
	constructor(data) {
		super({ cellHeight: CELL, fixed: true, Item: SubtitleItem, ...data });
		const horizontal = ROUND ? "center" : "left", left = ROUND ? 0 : TITLE_INSET;
		this.titleTopStyle = new Style({ font: FONT_KEY.GOTHIC_24_BOLD, color: this.colors, horizontal, left, vertical: "top", top: TEXT_TOP_INSET[FONT_KEY.GOTHIC_24_BOLD] });
		this.subtitleStyle = new Style({ font: FONT_KEY.GOTHIC_24, color: this.colors, horizontal, left, vertical: "top", top: TEXT_TOP_INSET[FONT_KEY.GOTHIC_24] });
	}
}

export default SubtitleMenu;
