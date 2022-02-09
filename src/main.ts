import {
    Plugin,
    SearchComponent,
    Setting,
    moment,
    prepareFuzzySearch,
    FuzzyMatch,
    SearchResult,
    Notice
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

            settingTabs: { id: string; containerEl: HTMLDivElement }[];
        };
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

type Resource = {
    key: string;
    text: string;
    tab: string;
    desc?: string;
};

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

            this.locale = moment.locale();

            const resources = window.i18next.getResourceBundle(
                this.locale
            ).setting;

            for (const [key, value] of Object.entries(resources)) {
                if (typeof value == "string") continue;
                this.resources.push(
                    ...this.flattenResources(value, `setting.${key}`)
                );
            }
            console.log(
                "🚀 ~ file: main.ts ~ line 59 ~ this.resourceNames",
                this.resources
            );
        });
    }
    flattenResources(
        resource: NestedRecord | string,
        path?: string
    ): Resource[] {
        const nested: Resource[] = [];
        if (typeof resource == "string") {
            if (!/^(name$|section)/.test(resource)) {
                const item: Resource = {
                    key: resource,
                    text: window.i18next.t(`${path}.${resource}`),
                    tab: path.split(".")[1]
                };
                nested.push(item);
            }
        } else {
            for (const [key, value] of Object.entries(resource)) {
                if (typeof value == "object") {
                    nested.push(
                        ...this.flattenResources(value, `${path}.${key}`)
                    );
                } else if (!/^(name$|section)/.test(key)) {
                    let item: Resource;
                    if (/description$/.test(key)) {
                        const existing = nested.find(
                            (n) => key.replace("-description", "") == n.key
                        );
                        if (!existing) continue;
                        existing.desc = value;
                        continue;
                    } else {
                        item = {
                            key,
                            text: window.i18next.t(`${path}.${key}`),
                            tab: path.split(".")[1]
                        };
                    }
                    nested.push(item);
                }
            }
        }
        return nested;
    }
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

        this.search.setPlaceholder("Search core settings...").onChange((v) => {
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
            }
            const results = this.performFuzzySearch(v);
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
                                this.search.setValue("");
                                const tab = this.app.setting.settingTabs.find(
                                    (t) => t.id == result.resource.tab
                                );
                                if (!tab) {
                                    new Notice(
                                        "There was an issue opening the setting tab."
                                    );
                                    return;
                                }

                                this.app.setting.openTabById(tab.id);

                                try {
                                    const find = document.evaluate(
                                        `//div[text()="${result.resource.text}"]`,
                                        tab.containerEl,
                                        null,
                                        XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
                                        null
                                    );
                                    const el =
                                        find.iterateNext() as HTMLDivElement;
                                    if (!el) return;

                                    const setting = el.closest(".setting-item");
                                    if (!setting) return;

                                    setting.scrollIntoView(true);

                                    setting.addClass("is-flashing");
                                    this.registerInterval(
                                        window.setTimeout(
                                            () =>
                                                setting.removeClass(
                                                    "is-flashing"
                                                ),
                                            3000
                                        )
                                    );
                                } catch (e) {
                                    console.error(e);
                                }
                            });
                        });
                }
            } else {
                this.settingsResultsEl.setText("No results found :(");
            }
        });
    }

    performFuzzySearch(input: string) {
        const results: { result: SearchResult; resource: Resource }[] = [];
        for (const resource of this.resources) {
            const result = prepareFuzzySearch(input)(resource.text);
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
