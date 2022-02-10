import {
    Plugin,
    SearchComponent,
    Setting,
    SearchResult,
    Notice,
    prepareSimpleSearch
} from "obsidian";
import { PluginSettings } from "./@types";

const DEFAULT_SETTINGS: PluginSettings = {};

declare module "obsidian" {
    interface App {
        setting: {
            lastTabId: string;
            openTabById(id: string): void;

            tabContentContainer: HTMLDivElement;
            tabHeadersEl: HTMLDivElement;

            settingTabs: SettingTab[];
            pluginTabs: PluginSettingTab[];
        };
    }
    interface SettingTab {
        id: string;
        name: string;
    }
    interface PluginSettingTab {
        name: string;
    }
}

type NestedRecord = {
    [name: string]: string | NestedRecord;
};

declare global {
    interface Window {
        i18next: {
            getResourceBundle(lang: string): { setting: NestedRecord };
            t(key: string): string;
        };
    }
}

interface Resource {
    tab: string;
    text: string;
    desc: string;
    name: string;
}
export default class MyPlugin extends Plugin {
    settings: PluginSettings;
    settingsSearchEl: HTMLDivElement = createDiv(
        "settings-search-container vertical-tab-header-group"
    );
    settingsResultsContainerEl = createDiv(
        "settings-search-results-container vertical-tab-content"
    );
    settingsResultsEl: HTMLDivElement;
    search: SearchComponent;
    locale: string;

    resources: Resource[] = [];

    async onload() {
        this.buildSearch();
        this.app.workspace.onLayoutReady(async () => {
            await this.loadSettings();

            this.settingsResultsContainerEl.createEl("h3", {
                text: "Settings Search Results"
            });
            this.settingsResultsEl = this.settingsResultsContainerEl.createDiv(
                "settings-search-results"
            );

            this.buildResources();
            this.patchSettings();
        });
    }
    buildResources() {
        for (const tab of this.app.setting.settingTabs) {
            if (tab.id == "hotkeys") continue;
            tab.display();
            const settings = tab.containerEl.querySelectorAll<HTMLDivElement>(
                ".setting-item:not(.setting-item-header)"
            );
            for (const el of Array.from(settings)) {
                const text =
                    el.querySelector<HTMLDivElement>(
                        ".setting-item-name"
                    )?.textContent;
                const desc = el.querySelector<HTMLDivElement>(
                    ".setting-item-description"
                )?.textContent;
                this.resources.push({
                    tab: tab.id,
                    name: tab.name,
                    text,
                    desc
                });
            }
            tab.containerEl.detach();
        }

        for (const tab of this.app.setting.pluginTabs) {
            tab.display();
            const settings = tab.containerEl.querySelectorAll<HTMLDivElement>(
                ".setting-item:not(.setting-item-header)"
            );
            for (const el of Array.from(settings)) {
                const text =
                    el.querySelector<HTMLDivElement>(
                        ".setting-item-name"
                    )?.textContent;
                if (!text) continue;
                const desc = el.querySelector<HTMLDivElement>(
                    ".setting-item-description"
                )?.textContent;
                this.resources.push({
                    tab: tab.id,
                    name: tab.name,
                    text,
                    desc
                });
            }
            tab.containerEl.detach();
        }
    }

    patchSettings() {}
    searchAppended = false;
    buildSearch() {
        this.app.setting.tabHeadersEl.prepend(this.settingsSearchEl);
        const tempSetting = new Setting(createDiv()).addSearch((s) => {
            this.search = s;
        });

        this.settingsSearchEl
            .createDiv("vertical-tab-header-group-items")
            .createDiv("vertical-tab-nav-item settings-search-input")
            .append(tempSetting.controlEl);

        tempSetting.settingEl.detach();

        this.search.setPlaceholder("Search settings...").onChange((v) => {
            this.onChange(v);
        });
    }
    onChange(v: string) {
        if (!v) {
            this.app.setting.openTabById(this.app.setting.lastTabId);
            this.searchAppended = false;
            return;
        }
        if (!this.searchAppended) {
            this.app.setting.tabContentContainer.empty();
            this.app.setting.tabContentContainer.append(
                this.settingsResultsContainerEl
            );
            this.searchAppended = true;
        }
        this.appendResults(this.performFuzzySearch(v));
    }
    appendResults(results: { result: SearchResult; resource: Resource }[]) {
        this.settingsResultsEl.empty();
        if (results.length) {
            const headers: Record<string, HTMLElement> = {};
            for (const result of results) {
                if (!(result.resource.tab in headers)) {
                    headers[result.resource.tab] =
                        this.settingsResultsEl.createDiv();
                    new Setting(headers[result.resource.tab])
                        .setHeading()
                        .setName(
                            result.resource.name ??
                                window.i18next.t(
                                    `setting.${result.resource.tab}.name`
                                )
                        );
                }
                new Setting(headers[result.resource.tab])
                    .setName(result.resource.text)
                    .setDesc(result.resource.desc ?? "")
                    .addExtraButton((b) => {
                        b.setIcon("magnifying-glass").onClick(() => {
                            this.showResult(result.resource);
                        });
                    });
            }
        } else {
            this.settingsResultsEl.setText("No results found :(");
        }
    }

    showResult(result: Resource) {
        this.search.setValue("");
        const tab =
            this.app.setting.settingTabs.find((t) => t.id == result.tab) ??
            this.app.setting.pluginTabs.find((t) => t.id == result.tab);
        if (!tab) {
            new Notice("There was an issue opening the setting tab.");
            return;
        }

        this.app.setting.openTabById(tab.id);

        try {
            const names =
                tab.containerEl.querySelectorAll(".setting-item-name");
            const el = Array.from(names).find(
                (n) => n.textContent == result.text
            );
            if (!el) return;

            const setting = el.closest(".setting-item");
            if (!setting) return;

            if (tab.id == "obsidian-style-settings") {
                let collapsed = setting.closest(".style-settings-container");
                let previous = collapsed?.previousElementSibling;

                while (
                    previous != null &&
                    previous.hasClass("is-collapsed") &&
                    previous.hasClass("style-settings-heading")
                ) {
                    previous.removeClass("is-collapsed");
                    collapsed = collapsed.parentElement?.closest(
                        ".style-settings-container"
                    );
                    previous = collapsed?.previousElementSibling;
                }
            }

            setting.scrollIntoView(true);

            setting.addClass("is-flashing");
            this.registerInterval(
                window.setTimeout(
                    () => setting.removeClass("is-flashing"),
                    3000
                )
            );
        } catch (e) {
            console.error(e);
        }
    }

    performFuzzySearch(input: string) {
        const results: { result: SearchResult; resource: Resource }[] = [];
        for (const resource of this.resources) {
            const result =
                prepareSimpleSearch(input)(resource.text) ??
                prepareSimpleSearch(input)(resource.desc);
            if (result) {
                results.push({ result, resource });
            }
        }
        return results;
    }

    onunload() {
        this.settingsSearchEl.detach();
        this.settingsResultsEl.detach();
        this.app.setting.openTabById(this.app.setting.lastTabId);
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
