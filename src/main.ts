import {
    Plugin,
    SearchComponent,
    Setting,
    SearchResult,
    Notice,
    prepareSimpleSearch,
    SettingTab
} from "obsidian";

import { around } from "monkey-around";

declare module "obsidian" {
    interface App {
        internalPlugins: {
            plugins: Record<
                string,
                { _loaded: boolean; instance: { name: string; id: string } }
            >;
        };
        plugins: {
            manifests: Record<string, PluginManifest>;
            plugins: Record<string, Plugin>;
            getPlugin(id: string): Plugin;
        };
        setting: {
            onOpen(): void;

            openTabById(id: string): void;
            openTab(tab: SettingTab): void;

            isPluginSettingTab(tab: SettingTab): boolean;
            addSettingTab(tab: SettingTab): void;
            removeSettingTab(tab: SettingTab): void;

            activeTab: SettingTab;
            lastTabId: string;

            pluginTabs: PluginSettingTab[];
            settingTabs: SettingTab[];

            tabContentContainer: HTMLDivElement;
            tabHeadersEl: HTMLDivElement;
        };
    }
    interface Plugin {
        _loaded: boolean;
    }
    interface PluginSettingTab {
        name: string;
    }
    interface SettingTab {
        id: string;
        name: string;
        navEl: HTMLElement;
    }
}

interface Resource {
    tab: string;
    text: string;
    desc: string;
    name: string;
}
export default class SettingsSearch extends Plugin {
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
    results: Resource[] = [];

    async onload() {
        this.app.workspace.onLayoutReady(async () => {
            this.settingsResultsContainerEl.createEl("h3", {
                text: "Settings Search Results"
            });
            this.settingsResultsEl = this.settingsResultsContainerEl.createDiv(
                "settings-search-results"
            );

            this.buildSearch();
            this.buildResources();
            this.patchSettings();
        });
    }
    buildResources() {
        for (const tab of this.app.setting.settingTabs) {
            if (tab.id == "hotkeys") continue;
            this.getTabResources(tab);
        }
        for (const tab of this.app.setting.pluginTabs) {
            this.getTabResources(tab);
        }
    }
    get manifests() {
        return Object.values(this.app.plugins.manifests);
    }
    settingCache: Map<string, Setting> = new Map();
    addResourceToCache(resource: Resource) {
        const setting = new Setting(createDiv())
            .setName(resource.text)
            .setDesc(
                createFragment(
                    (e) => (e.createDiv().innerHTML = resource.desc ?? "")
                )
            );

        if (resource.tab == "community-plugins") {
            let plugin = this.manifests.find((p) => p.name == resource.text);
            if (
                plugin &&
                this.app.plugins.getPlugin(plugin.id)?._loaded &&
                this.app.setting.pluginTabs.find((t) => t.id == plugin.id)
            ) {
                setting.addExtraButton((b) => {
                    b.setTooltip(`Open ${resource.text} Settings`).onClick(
                        () => {
                            this.app.setting.openTabById(plugin.id);
                        }
                    );
                });
            }
        }
        if (resource.tab == "plugins") {
            const plugins = Object.values(this.app.internalPlugins.plugins);
            const plugin = plugins.find(
                (p) => p._loaded && p.instance.name == resource.text
            );

            if (
                plugin &&
                this.app.setting.pluginTabs.find(
                    (t) => t.id == plugin.instance.id
                )
            ) {
                setting.addExtraButton((b) => {
                    b.setTooltip(`Open ${resource.text} Settings`).onClick(
                        () => {
                            this.app.setting.openTabById(plugin.instance.id);
                        }
                    );
                });
            }
        }
        setting.addExtraButton((b) => {
            b.setIcon("forward-arrow").onClick(() => {
                this.showResult(resource);
            });
        });
        this.settingCache.set(resource.text, setting);
    }
    getResourceFromCache(resource: Resource) {
        if (!this.settingCache.has(resource.text)) {
            this.addResourceToCache(resource);
        }
        return this.settingCache.get(resource.text);
    }
    removeResourcesFromCache(resources: Resource[]) {
        for (const resource of resources) {
            this.settingCache.delete(resource.text);
        }
    }
    getTabResources(tab: SettingTab) {
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

            const desc =
                el.querySelector<HTMLDivElement>(".setting-item-description")
                    ?.innerHTML ?? "";

            const resource = {
                tab: tab.id,
                name: tab.name,
                text,
                desc
            };

            this.resources.push(resource);
            this.addResourceToCache(resource);
        }
        tab.containerEl.detach();
    }

    patchSettings() {
        const self = this;

        this.register(
            around(this.app.setting, {
                onOpen: function (next) {
                    return function () {
                        next.apply(this);
                        self.search.inputEl.focus();
                        return next;
                    };
                }
            })
        );

        //Patch addSettingTab to capture changes to plugin settings.
        this.register(
            around(this.app.setting, {
                addSettingTab: function (next) {
                    return function (tab: SettingTab) {
                        self.getTabResources(tab);
                        return next.call(this, tab);
                    };
                }
            })
        );

        //Patch removeSettingTab to capture changes to plugin settings.
        this.register(
            around(this.app.setting, {
                removeSettingTab: function (next) {
                    return function (tab: SettingTab) {
                        if (this.isPluginSettingTab(tab)) {
                            const removing = self.resources.filter(
                                (t) => t.tab == tab.id
                            );
                            self.resources = self.resources.filter(
                                (t) => t.tab != tab.id
                            );
                            self.removeResourcesFromCache(removing);
                        }
                        return next.call(this, tab);
                    };
                }
            })
        );

        this.register(
            around(this.app.setting, {
                openTab: function (next) {
                    return function (tab: SettingTab) {
                        self.searchAppended = false;
                        return next.call(this, tab);
                    };
                },
                openTabById: function (next) {
                    return function (tab: string) {
                        self.searchAppended = false;
                        return next.call(this, tab);
                    };
                }
            })
        );
    }

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

    searchAppended = false;
    onChange(v: string) {
        if (!v) {
            this.app.setting.openTabById(this.app.setting.lastTabId);
            this.searchAppended = false;
            return;
        }
        if (!this.searchAppended) {
            this.app.setting.activeTab.navEl.removeClass("is-active");
            this.app.setting.tabContentContainer.empty();
            this.app.setting.tabContentContainer.append(
                this.settingsResultsContainerEl
            );
            this.searchAppended = true;
        }
        this.appendResults(this.performFuzzySearch(v));
    }
    getMatchText(text: string, result: SearchResult) {
        const matchElements: Record<number, HTMLElement> = {};
        return createFragment((content) => {
            for (let i = 0; i < text.length; i++) {
                let match = result.matches.find((m) => m[0] === i);
                if (match) {
                    const index = result.matches.indexOf(match);
                    if (!matchElements[index]) {
                        matchElements[index] = createSpan(
                            "suggestion-highlight"
                        );
                    }
                    let element = matchElements[index];
                    content.appendChild(element);
                    element.appendText(text.substring(match[0], match[1]));

                    i += match[1] - match[0] - 1;
                    continue;
                }

                content.appendText(text[i]);
            }
        });
    }
    appendResults(results: Resource[]) {
        this.settingsResultsEl.empty();
        if (results.length) {
            const headers: Record<string, HTMLElement> = {};
            for (const resource of results) {
                if (!(resource.tab in headers)) {
                    headers[resource.tab] = this.settingsResultsEl.createDiv();
                    new Setting(headers[resource.tab])
                        .setHeading()
                        .setName(resource.name);
                }

                const setting = this.getResourceFromCache(resource);

                headers[resource.tab].append(setting.settingEl);
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
        const results: Resource[] = [];
        for (const resource of this.resources) {
            let result =
                prepareSimpleSearch(input)(resource.text) ??
                prepareSimpleSearch(input)(resource.desc);
            if (result) {
                results.push(resource);
            }
        }
        this.results = results;
        return results;
    }

    onunload() {
        this.settingsSearchEl.detach();
        this.settingsResultsEl.detach();
        this.app.setting.openTabById(this.app.setting.lastTabId);
    }
}
