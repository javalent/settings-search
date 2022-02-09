import "./main.css";

import { Plugin } from "obsidian";
import { PluginSettings } from "./@types";

const DEFAULT_SETTINGS: PluginSettings = {};

export default class MyPlugin extends Plugin {
    settings: PluginSettings;
    async onload() {
        await this.loadSettings();
    }

    onunload() {}

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
