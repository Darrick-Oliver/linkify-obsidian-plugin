import LinkifyPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class LinkifySettingsTab extends PluginSettingTab {
	plugin: LinkifyPlugin;

	constructor(app: App, plugin: LinkifyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("URL Regular Expression")
			.setDesc(
				"Regular Expression used to determine whether text is a URL or not"
			)
			.addText((text) =>
				text.onChange(async (value) => {
					this.plugin.settings.isUrlRegex = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
