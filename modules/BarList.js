// A titled list of horizontal bars, after fitsky's heart rate zones: a label,
// a ProgressLayer and a value per row, the rows sharing the height under the
// title.
//
//   new BarList({ title: "Heart Rate Zones", rows: [{ label: "Z1", value: 40, text: "2:10", color: GColor.VividCerulean }, ...],
//                 statusBar: true })
//
// Layout (fitsky's): title Gothic 18 Bold at the top; rows from y 32, each
// (h - 40) / n tall with 4 px between; labels 26 px wide in Gothic 14 Bold,
// values 46 px wide in Gothic 14, the bar between them with 2 px corners.
// With statusBar (true, or { color }) a pebble-ui/StatusBar sits above and the
// layout starts under it; map that module too.
import { PBL_IF_COLOR_ELSE, STATUS_BAR_LAYER_HEIGHT, GColor, FONT_KEY, textLayerStyle } from "pebble-ui/sdk";
import { ProgressLayer } from "pebble-ui/ProgressLayer";
import View from "pebble-ui/View";

const BarListContainer = Container.template($ => {
	const top = $.statusBar ? STATUS_BAR_LAYER_HEIGHT : 0;
	const w = screen.width, h = screen.height - top, n = $.rows.length;
	const barY = top + 32, barH = Math.trunc((h - 40) / n) - 4, labelW = 26, timeW = 46;
	const barX = labelW + 4, barW = w - barX - timeW - 8;
	const labelStyle = textLayerStyle(FONT_KEY.GOTHIC_14_BOLD, $.color, "left");
	const valueStyle = textLayerStyle(FONT_KEY.GOTHIC_14, $.color, "left");
	const contents = [
		Label($, { left: 0, right: 0, top: top + 4, height: 24, style: textLayerStyle(FONT_KEY.GOTHIC_18_BOLD, $.color, "center"), string: $.title ?? "" }),
	];
	if ($.statusBar)
		contents.push(importNow("pebble-ui/StatusBar").StatusBar({ color: $.statusBar.color ?? $.color }));
	$.rows.forEach((row, i) => {
		const y = barY + i * (barH + 4);
		contents.push(Label($, { left: 4, width: labelW, top: y, height: barH, style: labelStyle, string: row.label ?? "" }));
		contents.push(ProgressLayer({ width: barW, progress: row.value ?? 0, cornerRadius: 2, foregroundColor: row.color ?? GColor.Black, backgroundColor: $.trackColor }, { left: barX, top: y + 2, width: barW, height: barH - 4 }));
		contents.push(Label($, { left: barX + barW + 4, width: timeW, top: y, height: barH, style: valueStyle, string: row.text ?? "" }));
	});
	return { skin: new Skin({ fill: $.background }), Behavior: $.constructor.Behavior, contents };
});

export default class BarList extends View {
	constructor(data) {
		super(data);
		this.title = data.title;
		this.rows = data.rows;
		this.statusBar = data.statusBar === true ? {} : data.statusBar;
		this.background = data.background ?? GColor.White;
		this.color = data.color ?? GColor.Black;
		this.trackColor = data.trackColor ?? PBL_IF_COLOR_ELSE(GColor.LightGray, GColor.Black);
	}
	get Template() { return BarListContainer }
}
