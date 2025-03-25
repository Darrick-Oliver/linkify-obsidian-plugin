import { Plugin } from "obsidian";
import { LinkInterceptorPlugin } from "src/plugins/link-interceptor-plugin";
import { PastePlugin } from "src/plugins/paste-plugin";
import { DEFAULT_SETTINGS, LinkifySettings } from "src/settings";
import { LinkifySettingsTab } from "src/settings/linkify-settings-tab";

export default class LinkifyPlugin extends Plugin {
	settings: LinkifySettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new LinkifySettingsTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("editor-paste", (evt, editor) => {
				const plugin = new PastePlugin(editor, this.settings);
				plugin.handle(evt);
			})
		);

		this.registerDomEvent(document, "mousedown", (evt) => {
			const activeEditor = this.app.workspace.activeEditor;
			if (activeEditor && activeEditor.editor) {
				const plugin = new LinkInterceptorPlugin(
					this.app,
					activeEditor.editor
				);
				plugin.handle(evt);
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
