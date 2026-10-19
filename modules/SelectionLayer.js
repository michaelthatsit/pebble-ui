// The SDK's SelectionLayer (Eric Phillips' modular version, as in
// pebble-examples/ui-patterns): a row of cells, one active; Up/Down change the
// active cell's value with a bump animation (and repeat while held), Select
// slides to the next cell or completes on the last, Back slides to the
// previous cell or, on the first, lets the window pop.
//
//   SelectionLayer({ numCells: 3, cellWidths: [40, 40, 40], cellPadding: 4,
//                    activeBackgroundColor: GColor.Red, inactiveBackgroundColor: GColor.DarkGray,
//                    font: FONT_KEY.GOTHIC_28_BOLD, textColor: GColor.White, activeTextColor: GColor.White,
//                    active: true,
//                    callbacks: { getCellText(i), increment(i), decrement(i), complete() } },
//                  { left, top, width: 128, height: 34 })
//
// The layer draws outside its frame while animating (the C layer does not
// clip), so the Port is MARGIN larger than the frame on every side.
import { PBL_IF_COLOR_ELSE, GColor, FONT_KEY, TEXT_TOP_INSET } from "pebble-ui/sdk";
import Timer from "timer";

const MAX_SELECTION_LAYER_CELLS = 3;

const DEFAULT_CELL_PADDING = 10;
const DEFAULT_SELECTED_INDEX = 0;
const DEFAULT_FONT = FONT_KEY.GOTHIC_28_BOLD;
const DEFAULT_ACTIVE_COLOR = GColor.White;
const DEFAULT_INACTIVE_COLOR = PBL_IF_COLOR_ELSE(GColor.DarkGray, GColor.Black);

const BUTTON_HOLD_REPEAT_MS = 100;
const SETTLE_HEIGHT_DIFF = 6;

const BUMP_TEXT_DURATION_MS = 107;
const BUMP_SETTLE_DURATION_MS = 214;
const SLIDE_DURATION_MS = 107;
const SLIDE_SETTLE_DURATION_MS = 179;

const MARGIN = 10;

function pixelsForBumpSettle(animPercentComplete) {
	return animPercentComplete ? SETTLE_HEIGHT_DIFF - Math.floor((SETTLE_HEIGHT_DIFF * animPercentComplete) / 100) : 0;
}

function fontTopPadding(font) {
	return (font === FONT_KEY.GOTHIC_28_BOLD || font === FONT_KEY.GOTHIC_24_BOLD) ? 10 : 0;
}

function yOffsetWhichVerticallyCentersFont(font, height) {
	const fontHeight = font === FONT_KEY.GOTHIC_28_BOLD ? 18 : font === FONT_KEY.GOTHIC_24_BOLD ? 14 : 0;
	return Math.trunc(height / 2) - Math.trunc(fontHeight / 2) - fontTopPadding(font);
}

class SelectionLayerBehavior extends Behavior {
	onCreate(port, $) {
		this.numCells = Math.min($.numCells, MAX_SELECTION_LAYER_CELLS);
		this.cellWidths = $.cellWidths.slice(0, this.numCells);
		this.cellPadding = $.cellPadding ?? DEFAULT_CELL_PADDING;
		this.selectedCellIdx = DEFAULT_SELECTED_INDEX;
		this.font = $.font ?? DEFAULT_FONT;
		this.activeBackgroundColor = $.activeBackgroundColor ?? DEFAULT_ACTIVE_COLOR;
		this.inactiveBackgroundColor = $.inactiveBackgroundColor ?? DEFAULT_INACTIVE_COLOR;
		this.callbacks = $.callbacks;
		this.textColor = $.textColor ?? GColor.White; // a GContext's default text colour
		this.activeTextColor = $.activeTextColor ?? this.textColor;
		this.isActive = $.active ?? true;
		this.style = new Style({ font: this.font });
		this.textTopInset = TEXT_TOP_INSET[this.font] ?? 0;
		this.phase = null;
		this.bumpIsUpwards = false;
		this.bumpTextAnimProgress = 0;
		this.bumpSettleAnimProgress = 0;
		this.slideIsForward = false;
		this.slideAnimProgress = 0;
		this.slideSettleAnimProgress = 0;
	}
	onDisplayed(port) {
		port.focus();
	}
	onUndisplaying(port) {
		this.clearTimer();
		port.stop();
	}
	// selection_layer_set_active: an inactive layer shows no active cell and ignores the buttons.
	setActive(port, isActive) {
		if (isActive && !this.isActive)
			this.selectedCellIdx = 0;
		this.isActive = isActive;
		port.invalidate();
	}
	active(i) {
		return this.isActive && this.selectedCellIdx === i;
	}

	// Drawing

	onDraw(port) { // (x, y, width, height) would be the area to redraw; the layer's size is the port's
		const h = port.height - 2 * MARGIN;
		this.drawCellBackgrounds(port, h);
		if (this.slideAnimProgress || this.slideSettleAnimProgress)
			this.drawSlider(port, h);
		this.drawText(port, h);
	}
	drawCellBackgrounds(port, h) {
		for (let i = 0, currentXOffset = 0; i < this.numCells; i++) {
			const width = this.cellWidths[i];
			if (!width)
				continue;
			let yOffset = 0;
			if (this.selectedCellIdx === i && this.bumpIsUpwards)
				yOffset = -pixelsForBumpSettle(this.bumpSettleAnimProgress);
			let height = h;
			if (this.selectedCellIdx === i)
				height += pixelsForBumpSettle(this.bumpSettleAnimProgress);
			let color = this.inactiveBackgroundColor;
			if (this.active(i) && !this.slideAnimProgress)
				color = this.activeBackgroundColor;
			port.fillColor(color, MARGIN + currentXOffset, MARGIN + yOffset, width, height);
			currentXOffset += width + this.cellPadding;
		}
	}
	// The selection box on its way to the next cell (slide: it moves and grows
	// by the padding), then the overshoot shrinking back (settle).
	drawSlider(port, h) {
		const forward = this.slideIsForward ? 1 : -1;
		let x = 0;
		for (let i = 0; i < this.selectedCellIdx; i++)
			x += this.cellWidths[i] + this.cellPadding;
		let width;
		if (this.slideAnimProgress) {
			const current = this.cellWidths[this.selectedCellIdx];
			const next = this.cellWidths[this.selectedCellIdx + forward];
			const moved = Math.trunc(((next + this.cellPadding) * this.slideAnimProgress) / 100);
			const grown = Math.trunc(((next - current + this.cellPadding) * this.slideAnimProgress) / 100);
			width = current + grown;
			x += forward * moved - (forward < 0 ? grown : 0);
		}
		else {
			width = Math.trunc((this.cellPadding * this.slideSettleAnimProgress) / 100);
			x += forward > 0 ? this.cellWidths[this.selectedCellIdx] : -width;
		}
		port.fillColor(this.activeBackgroundColor, MARGIN + x, MARGIN, width, h);
	}
	drawText(port, h) {
		for (let i = 0, currentXOffset = 0; i < this.numCells; i++) {
			const text = this.callbacks.getCellText(i);
			if (text != null) {
				let height = h;
				if (this.selectedCellIdx === i)
					height += pixelsForBumpSettle(this.bumpSettleAnimProgress);
				let yOffset = yOffsetWhichVerticallyCentersFont(this.font, height);
				if (this.selectedCellIdx === i && this.bumpIsUpwards)
					yOffset -= pixelsForBumpSettle(this.bumpSettleAnimProgress);
				if (this.selectedCellIdx === i) {
					let delta = Math.trunc((this.bumpTextAnimProgress * fontTopPadding(this.font)) / 100);
					if (this.bumpIsUpwards)
						delta = -delta;
					yOffset += delta;
				}
				// Port.drawString draws from (x, y) whatever the style says: centre and inset by hand.
				const textX = currentXOffset + Math.trunc((this.cellWidths[i] - this.style.measure(text).width) / 2);
				const color = this.active(i) && !this.slideAnimProgress ? this.activeTextColor : this.textColor;
				port.drawString(text, this.style, color, MARGIN + textX, MARGIN + yOffset + this.textTopInset, this.cellWidths[i], height);
			}
			currentXOffset += this.cellWidths[i] + this.cellPadding;
		}
	}

	// Animations: one phase at a time, on the Port's clock.

	run(port, phase, duration) {
		this.phase = phase;
		port.duration = duration;
		port.time = 0;
		port.start();
	}
	onTimeChanged(port) {
		const fraction = port.fraction;
		switch (this.phase) {
		case "bumpText": this.bumpTextAnimProgress = Math.round(100 * Math.quadEaseIn(fraction)); break;
		case "bumpSettle": this.bumpSettleAnimProgress = Math.round(100 * Math.quadEaseOut(fraction)); break;
		case "slide": this.slideAnimProgress = Math.round(100 * Math.quadEaseIn(fraction)); break;
		case "slideSettle": this.slideSettleAnimProgress = 100 - Math.round(100 * Math.quadEaseOut(fraction)); break;
		}
		port.invalidate();
	}
	onFinished(port) {
		switch (this.phase) {
		case "bumpText":
			this.bumpTextAnimProgress = 0;
			this.change(this.bumpIsUpwards);
			this.run(port, "bumpSettle", BUMP_SETTLE_DURATION_MS);
			break;
		case "bumpSettle":
			this.bumpSettleAnimProgress = 0;
			this.phase = null;
			break;
		case "slide":
			this.slideAnimProgress = 0;
			this.selectedCellIdx += this.slideIsForward ? 1 : -1;
			this.run(port, "slideSettle", SLIDE_SETTLE_DURATION_MS);
			break;
		case "slideSettle":
			this.slideSettleAnimProgress = 0;
			this.phase = null;
			break;
		}
		port.invalidate();
	}
	cancelSlide(port) {
		if (this.phase === "slide")
			this.selectedCellIdx += this.slideIsForward ? 1 : -1;
		if (this.phase === "slide" || this.phase === "slideSettle") {
			port.stop();
			this.slideAnimProgress = this.slideSettleAnimProgress = 0;
			this.phase = null;
		}
	}
	change(upwards) {
		if (upwards)
			this.callbacks.increment(this.selectedCellIdx, 1);
		else
			this.callbacks.decrement(this.selectedCellIdx, 1);
	}

	// Buttons

	pressUpDown(port, upwards) {
		if (!this.isActive)
			return true;
		if (this.phase) {
			this.change(upwards);
			port.invalidate();
		}
		else {
			this.bumpIsUpwards = upwards;
			this.run(port, "bumpText", BUMP_TEXT_DURATION_MS);
		}
		this.clearTimer();
		this.timer = Timer.set(() => {
			this.change(upwards);
			port.invalidate();
		}, BUTTON_HOLD_REPEAT_MS, BUTTON_HOLD_REPEAT_MS);
		return true;
	}
	clearTimer() {
		if (this.timer !== undefined) {
			Timer.clear(this.timer);
			this.timer = undefined;
		}
	}
	onPressUp(port) {
		return this.pressUpDown(port, true);
	}
	onPressDown(port) {
		return this.pressUpDown(port, false);
	}
	onReleaseUp(port) {
		this.clearTimer();
		return true;
	}
	onReleaseDown(port) {
		this.clearTimer();
		return true;
	}
	onPressSelect(port) {
		if (!this.isActive)
			return true;
		this.cancelSlide(port);
		if (this.selectedCellIdx >= this.numCells - 1) {
			this.selectedCellIdx = 0;
			this.callbacks.complete();
		}
		else {
			this.slideIsForward = true;
			this.run(port, "slide", SLIDE_DURATION_MS);
		}
		return true;
	}
	onPressBack(port) {
		if (!this.isActive)
			return false;
		this.cancelSlide(port);
		if (this.selectedCellIdx === 0)
			return false; // the window pops
		this.slideIsForward = false;
		this.run(port, "slide", SLIDE_DURATION_MS);
		return true;
	}
}

export function SelectionLayer($, frame) {
	return new Port($, {
		left: frame.left - MARGIN, top: frame.top - MARGIN,
		width: frame.width + 2 * MARGIN, height: frame.height + 2 * MARGIN,
		Behavior: SelectionLayerBehavior,
	});
}

export default SelectionLayer;
