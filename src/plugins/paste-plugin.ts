import { Editor, EditorPosition, EditorSelection, Menu } from "obsidian";
import {
	arePositionsEqual,
	getWordFromContext,
	matchMarkdownUrl,
	isUrl,
} from "../utils";
import { OrderedRange } from "../types/range";
import { LinkifySettings } from "src/settings";

type ReplacementType = "TEXT" | "URL";
type Replacement = {
	type: ReplacementType;
	cursorPosition: OrderedRange;
	position: OrderedRange;
};

export class PastePlugin {
	private editor: Editor;
	private settings: LinkifySettings;

	constructor(editor: Editor, settings: LinkifySettings) {
		this.editor = editor;
		this.settings = settings;
	}

	public handle(evt: ClipboardEvent) {
		const { clipboardData } = evt;
		const selections = this.editor.listSelections();

		if (!clipboardData || !this.isValidEvent(evt)) {
			return;
		}

		evt.preventDefault();

		const url = clipboardData.getData("text/plain");
		const replacements = this.getReplacements(selections);

		for (const replacement of replacements) {
			switch (replacement.type) {
				case "TEXT":
					this.handleTextReplacement(url, replacement.position);
					break;
				case "URL":
					this.handleUrlReplacement(
						url,
						replacement.position,
						replacement.cursorPosition
					);
					break;
				default:
			}
		}
	}

	private isValidEvent({ clipboardData }: ClipboardEvent) {
		return (
			clipboardData &&
			this.isDataOnlyUrl(clipboardData) &&
			this.editor.somethingSelected()
		);
	}

	private isDataOnlyUrl(data: DataTransfer) {
		return (
			data.types.length === 1 &&
			data.types[0] === "text/plain" &&
			isUrl(data.getData("text/plain"), this.settings.isUrlRegex)
		);
	}

	private getReplacements(selections: EditorSelection[]): Replacement[] {
		const replacements = [] as Replacement[];

		for (const selection of selections) {
			const { start, end } = this.getOrderedRange(
				selection.anchor,
				selection.head
			);
			const selectionString = this.editor.getRange(start, end);

			if (selectionString.match(/\s+/) || start.line !== end.line) {
				// Not a url if it contains any whitespace
				replacements.push({
					type: "TEXT",
					cursorPosition: { start, end },
					position: { start, end },
				});
				continue;
			}

			const lineContent = this.editor.getLine(start.line);
			const wordRange = getWordFromContext(start, end, lineContent);
			replacements.push({
				...this.getReplacement(wordRange),
				cursorPosition: { start, end },
			});
		}

		return replacements;
	}

	private getOrderedRange(anchor: EditorPosition, head: EditorPosition) {
		const start =
			anchor.line < head.line ||
			(anchor.line === head.line && anchor.ch <= head.ch)
				? anchor
				: head;
		const end = start === anchor ? head : anchor;
		return { start, end };
	}

	private getReplacement(
		range: OrderedRange
	): Omit<Replacement, "cursorPosition"> {
		const normalUrlMatch = isUrl(
			this.editor.getRange(range.start, range.end),
			this.settings.isUrlRegex
		);
		const markdownUrlMatch = matchMarkdownUrl(
			this.editor.getRange(range.start, range.end)
		);

		if (normalUrlMatch) {
			return {
				type: "URL",
				position: range,
			};
		} else if (markdownUrlMatch) {
			const [, , linkIndices] =
				// @ts-ignore
				markdownUrlMatch.indices as [
					[number, number],
					[number, number],
					[number, number]
				];

			const [startIndex, endIndex] = linkIndices;
			return {
				type: "URL",
				position: {
					start: {
						line: range.start.line,
						ch: range.start.ch + startIndex,
					},
					end: {
						line: range.end.line,
						ch: range.start.ch + endIndex,
					},
				},
			};
		} else {
			return {
				type: "TEXT",
				position: range,
			};
		}
	}

	private handleTextReplacement(url: string, range: OrderedRange) {
		const selectedString = this.editor.getRange(range.start, range.end);

		this.editor.replaceRange(
			`[${selectedString}](${url})`,
			range.start,
			range.end
		);

		// TODO: setting?
		this.editor.blur();
		this.editor.setCursor({
			line: range.end.line,
			ch: range.end.ch + url.length + 4,
		});
	}

	private handleUrlReplacement(
		replacement: string,
		range: OrderedRange,
		cursorRange: OrderedRange
	) {
		if (
			arePositionsEqual(range.start, cursorRange.start) &&
			arePositionsEqual(range.end, cursorRange.end)
		) {
			this.editor.replaceRange(replacement, range.start, range.end);
		} else {
			// If the user hasn't selected the entire link, ask if they want to replace the entire thing
			this.showUrlReplaceMenu({
				onEntire: () =>
					this.editor.replaceRange(
						replacement,
						range.start,
						range.end
					),
				onPartial: () =>
					this.editor.replaceRange(
						replacement,
						cursorRange.start,
						cursorRange.end
					),
			});
		}
	}

	private showUrlReplaceMenu({
		onEntire,
		onPartial,
	}: {
		onEntire: () => void;
		onPartial: () => void;
	}) {
		const menu = new Menu();
		const coords = this.getCoordsAtCursor();

		menu.addItem((item) =>
			item.setTitle("Replace Entire URL").onClick(onEntire)
		);
		menu.addItem((item) =>
			item.setTitle("Replace Selection").onClick(onPartial)
		);

		menu.showAtPosition({ x: coords.left, y: coords.top });
	}

	private getCoordsAtCursor() {
		// @ts-ignore
		return this.editor.cm.coordsAtPos(
			this.editor.posToOffset(this.editor.getCursor())
		) as {
			bottom: number;
			left: number;
			right: number;
			top: number;
		};
	}
}
