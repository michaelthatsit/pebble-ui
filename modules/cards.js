// A card menu, after fitsky's workout type menu: a MenuLayer whose cells fill
// the screen, each a colour card with a name (Gothic 28 Bold) over a category
// (Gothic 18); Up and Down page between cards.
//
//   new CardMenu({ items: [{ title: "Running", subtitle: "Cardio", color: GColor.IslamicGreen }, ...],
//                  onSelect(index, item) {...} })
import { PBL_IF_COLOR_ELSE, GColor, FONT_KEY, textLayerStyle } from "pebble-ui/sdk";
import Menu from "pebble-ui/Menu";

const color = PBL_IF_COLOR_ELSE(GColor.White, GColor.Black);
const titleStyle = textLayerStyle(FONT_KEY.GOTHIC_28_BOLD, color, "center");
const subtitleStyle = textLayerStyle(FONT_KEY.GOTHIC_18, color, "center");

const Card = Container.template($ => ({
	left: 0, right: 0, skin: new Skin({ fill: PBL_IF_COLOR_ELSE($.item.color ?? GColor.White, GColor.White) }),
	contents: [
		Label($, { left: 10, right: 10, top: (screen.height >> 1) - 20, height: 40, style: titleStyle, string: $.item.title }),
		Label($, { left: 10, right: 10, top: (screen.height >> 1) + 16, height: 24, style: subtitleStyle, string: $.item.subtitle ?? "" }),
	],
}));

export class CardMenu extends Menu {
	constructor(data) {
		super({
			...data,
			cellHeight: screen.height, fixed: true, Item: Card,
			normal: [GColor.Black, GColor.White], highlight: [GColor.Black, GColor.White],
		});
	}
}

export default CardMenu;
