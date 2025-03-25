import { App, Editor, Menu } from "obsidian";
import { getWordFromContext, matchMarkdownUrl } from "../utils";
import { EditLinkModal } from "../edit-link-modal";
import { EditorRange } from "../types/editor";

export class LinkInterceptorPlugin {
	app: App;
	editor: Editor;

	constructor(app: App, editor: Editor) {
		this.app = app;
		this.editor = editor;
	}

	public handle(evt: MouseEvent) {
		const target = evt.target as HTMLElement;

		if (target.tagName !== "A") return;

		const cursor = this.editor.getCursor();
		const lineContent = this.editor.getLine(cursor.line);
		const wordRange = getWordFromContext(cursor, cursor, lineContent);
		const wordValue = this.editor.getRange(wordRange.start, wordRange.end);
		const markdownUrlMatch = matchMarkdownUrl(wordValue);

		if (!markdownUrlMatch) return;

		evt.preventDefault();

		const [, text, link] = markdownUrlMatch;
		const [, textIndices, linkIndices] =
			// @ts-ignore
			markdownUrlMatch.indices as [
				[number, number],
				[number, number],
				[number, number]
			];

		const menu = this.createMenu({
			onEdit: () => {
				new EditLinkModal(this.app, { text, link }, (results) => {
					let textDiff = 0;
					if (results.text) {
						this.replaceRange(textIndices, wordRange, results.text);
						textDiff = text.length - results.text.length;
					}

					if (results.link) {
						this.replaceRange(
							linkIndices.map((value) => value - textDiff),
							wordRange,
							results.link
						);
					}
				}).open();
			},
			onOpenInBrowser: () => {
				window.open(link, "_blank");
			},
		});
		menu.showAtMouseEvent(evt);
	}

	private replaceRange(indices: number[], range: EditorRange, value: string) {
		const [linkStart, linkEnd] = indices;
		this.editor.replaceRange(
			value,
			{
				line: range.start.line,
				ch: range.start.ch + linkStart,
			},
			{
				line: range.end.line,
				ch: range.start.ch + linkEnd,
			}
		);
	}

	private createMenu({
		onEdit,
		onOpenInBrowser,
	}: {
		onEdit: () => void;
		onOpenInBrowser: () => void;
	}) {
		const menu = new Menu();

		menu.addItem((item) => item.setTitle("Edit Link").onClick(onEdit));
		menu.addItem((item) =>
			item.setTitle("Open in Browser").onClick(onOpenInBrowser)
		);

		return menu;
	}
}
