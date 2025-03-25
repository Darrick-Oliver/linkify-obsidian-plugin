import { App, Modal, Setting } from "obsidian";

type LinkModalValues = {
	text: string;
	link: string;
};

export class EditLinkModal extends Modal {
	constructor(
		app: App,
		initial: LinkModalValues,
		onSubmit: (results: Partial<LinkModalValues>) => void
	) {
		super(app);
		this.setTitle("Edit link");

		const results: Partial<LinkModalValues> = {};
		new Setting(this.contentEl).setName("Text").addText((text) => {
			text.setValue(initial.text).onChange((value) => {
				results.text = value;
			});
		});
		new Setting(this.contentEl).setName("Link").addText((text) => {
			text.setValue(initial.link).onChange((value) => {
				results.link = value;
			});
		});

		new Setting(this.contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					onSubmit(results);
				})
		);
	}
}
