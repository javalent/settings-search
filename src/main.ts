import {
    Plugin,
    SearchComponent,
    Setting,
    SearchResult,
    Notice,
    prepareSimpleSearch,
    SettingTab,
    Scope,
    Platform,
    setIcon
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
            onClose(): void;

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
declare global {
    interface Window {
        SettingsSearch?: {
            addResources: SettingsSearch["addResources"];
            removeResources: SettingsSearch["removeResources"];
        };
    }
}

interface Resource {
    tab: string;
    //tab name
    name: string;
    text: string;
    desc: string;
    external?: boolean;
}
export default class SettingsSearch extends Plugin {
    settingsSearchEl: HTMLDivElement = createDiv(
        "settings-search-container vertical-tab-header-group"
    );
    settingsResultsContainerEl = createDiv(
        "settings-search-results-container vertical-tab-content"
    );
    settingsNavItemContainer = this.settingsSearchEl
        .createDiv("vertical-tab-header-group-items")
        .createDiv("vertical-tab-nav-item settings-search-input");
    settingsResultsEl: HTMLDivElement;
    search: SearchComponent;
    locale: string;

    resources: Resource[] = [];
    results: Resource[] = [];

    async onload() {
        (window["SettingsSearch"] = {
            addResources: this.addResources.bind(this),
            removeResources: this.removeResources.bind(this)
        }) && this.register(() => delete window["SettingsSearch"]);

        this.app.workspace.onLayoutReady(async () => {
            this.settingsResultsContainerEl.createEl("h3", {
                text: "Settings Search Results"
            });
            this.settingsResultsEl = this.settingsResultsContainerEl.createDiv(
                "settings-search-results"
            );

            this.buildScope();
            this.buildSearch();
            this.buildResources();
            this.buildPluginResources();
            this.patchSettings();
        });
    }
    tabIndex = 0;
    pluginTabIndex = 0;
    buildResources() {
        const tab = this.app.setting.settingTabs[this.tabIndex];
        if (tab) {
            this.getTabResources(tab);
            this.tabIndex++;
            setTimeout(() => this.buildResources());
        }
    }
    buildPluginResources() {
        const tab = this.app.setting.pluginTabs[this.pluginTabIndex];
        if (tab) {
            this.getTabResources(tab);
            this.pluginTabIndex++;
            setTimeout(() => this.buildPluginResources());
        }
    }
    get manifests() {
        return Object.values(this.app.plugins.manifests);
    }
    settingCache: Map<Resource, Setting> = new Map();
    public addResourceToCache(resource: Resource) {
        if (!resource || !resource.text || !resource.name || !resource.tab) {
            return new Error("A valid resource must be provided.");
        }

        let name: DocumentFragment | string;
        if (resource.external) {
            name = createFragment((el) => {
                setIcon(
                    el.createSpan({
                        attr: {
                            "aria-label":
                                "This setting was added by another plugin."
                        }
                    }),
                    "info"
                );
                el.createSpan({ text: resource.name });
            });
        } else {
            name = resource.name;
        }
        const setting = new Setting(createDiv())
            .setName(name)
            .setDesc(
                createFragment(
                    (e) => (e.createDiv().innerHTML = resource.desc ?? "")
                )
            );
        if (resource.external) {
            setting.settingEl.addClass("set-externally");
        }
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
        this.settingCache.set(resource, setting);
    }
    getResourceFromCache(resource: Resource) {
        if (!this.settingCache.has(resource)) {
            this.addResourceToCache(resource);
        }
        return this.settingCache.get(resource);
    }
    removeResourcesFromCache(resources: Resource[]) {
        for (const resource of resources) {
            this.settingCache.delete(resource);
        }
    }
    addResources(...resources: Resource[]) {
        for (const resource of resources) {
            resource.external = true;
            if (this.resources.find((k) => this.equivalent(resource, k)))
                continue;
            this.resources.push(resource);
            this.addResourceToCache(resource);
        }
        return () => this.removeResources(...resources);
    }
    equivalent(resource1: Resource, resource2: Resource) {
        return (
            resource1.name == resource2.name &&
            resource1.tab == resource2.tab &&
            resource1.text == resource2.text &&
            resource1.desc == resource2.desc &&
            resource1.external == resource2.external
        );
    }
    removeResources(...resources: Resource[]) {
        const removing = [];
        const keys = [...this.settingCache.keys()];
        for (const resource of resources) {
            if (
                !resource ||
                !resource.text ||
                !resource.name ||
                !resource.tab
            ) {
                continue;
            }
            resource.external = true;
            this.resources = this.resources.filter(
                (r) => !this.equivalent(resource, r)
            );
            removing.push(
                ...keys.filter(
                    (k) => k == resource || this.equivalent(resource, k)
                )
            );
        }
        this.removeResourcesFromCache(removing);
    }
    removeTabResources(tab: string) {
        const removing = this.resources.filter((t) => t.tab == tab);
        this.resources = this.resources.filter((t) => t.tab != tab);
        this.removeResourcesFromCache(removing);
    }
    async getTabResources(tab: SettingTab) {
        await tab.display();

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
        if (this.app.setting.activeTab?.id == tab.id) return;
        tab.containerEl.detach();
        tab.hide();
    }
    patchSettings() {
        const self = this;

        this.register(
            around(this.app.setting, {
                onOpen: function (next) {
                    return function () {
                        next.apply(this);
                        if (!Platform.isMobile) self.search.inputEl.focus();
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
                            self.removeTabResources(tab.id);
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
                        self.app.keymap.popScope(self.scope);
                        return next.call(this, tab);
                    };
                },
                openTabById: function (next) {
                    return function (tab: string) {
                        self.searchAppended = false;
                        self.app.keymap.popScope(self.scope);
                        return next.call(this, tab);
                    };
                },
                onClose: function (next) {
                    return function () {
                        if (Platform.isMobile) {
                            self.detach();
                        }
                        return next.call(this);
                    };
                }
            })
        );
    }

    buildSearch() {
        const tempSetting = new Setting(createDiv()).addSearch((s) => {
            this.search = s;
        });

        this.settingsNavItemContainer.append(tempSetting.controlEl);

        tempSetting.settingEl.detach();

        this.search.onChange((v) => {
            this.onChange(v);
        });
        this.search.setPlaceholder("Search settings...");
        this.app.setting.tabHeadersEl.prepend(this.settingsSearchEl);
    }

    searchAppended = false;
    activeIndex = -1;
    activeSetting: Setting;
    scope = new Scope(this.app.scope);
    buildScope() {
        this.scope.register([], "ArrowDown", () => {
            if (this.activeSetting) {
                this.activeSetting.settingEl.removeClass("active");
            }
            this.activeIndex =
                (((this.activeIndex + 1) % this.results.length) +
                    this.results.length) %
                this.results.length;

            this.centerActiveSetting();
        });
        this.scope.register([], "ArrowUp", () => {
            if (this.activeSetting) {
                this.activeSetting.settingEl.removeClass("active");
            }
            this.activeIndex =
                (((this.activeIndex - 1) % this.results.length) +
                    this.results.length) %
                this.results.length;

            this.centerActiveSetting();
        });
        this.scope.register([], "Enter", () => {
            if (this.activeSetting) {
                this.showResult(this.results[this.activeIndex]);
            }
        });
    }

    centerActiveSetting() {
        const result = this.results[this.activeIndex];
        this.activeSetting = this.getResourceFromCache(result);
        this.activeSetting.settingEl.addClass("active");

        this.activeSetting.settingEl.scrollIntoView({
            behavior: "auto",
            block: "nearest"
        });
    }
    mobileContainers: HTMLElement[] = [];
    detachFromMobile() {
        if (Platform.isMobile) {
            this.settingsResultsContainerEl.detach();
            for (const header of this.mobileContainers) {
                this.app.setting.tabHeadersEl.append(header);
            }
            this.search.setValue("");
        }
    }
    detachFromDesktop() {
        if (Platform.isDesktop) {
            this.app.setting.openTabById(this.app.setting.lastTabId);
        }
    }
    detach() {
        this.detachFromDesktop();
        this.detachFromMobile();
        this.searchAppended = false;
    }
    onChange(v: string) {
        if (!v) {
            this.detach();
            this.app.keymap.popScope(this.scope);
            return;
        }
        if (!this.searchAppended) {
            this.activeIndex = -1;
            this.app.keymap.popScope(this.scope);
            this.app.keymap.pushScope(this.scope);
            if (this.activeSetting) {
                this.activeSetting.settingEl.removeClass("active");
                this.activeSetting = null;
            }

            if (!Platform.isMobile) {
                this.app.setting.activeTab.navEl.removeClass("is-active");
                this.app.setting.tabContentContainer.empty();
                this.app.setting.tabContentContainer.append(
                    this.settingsResultsContainerEl
                );
            } else {
                const headers =
                    this.app.setting.tabHeadersEl.querySelectorAll<HTMLElement>(
                        ".vertical-tab-header-group:not(.settings-search-container)"
                    );
                for (const header of Array.from(headers)) {
                    this.mobileContainers.push(header);
                    header.detach();
                }
                this.app.setting.tabHeadersEl.append(
                    this.settingsResultsContainerEl
                );
            }
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
            /* if ("hotkeys" in headers) {
                this.settingsResultsEl.appendChild(headers["hotkeys"]);
            } */
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
        this.app.keymap.popScope(this.scope);
        this.detach();

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

            let details = setting.closest("details");
            while (details) {
                details.setAttr("open", "open");
                details = details.parentElement?.closest("details");
            }

            setting.scrollIntoView(true);

            setting.addClass("is-flashing");
            window.setTimeout(() => setting.removeClass("is-flashing"), 3000);
        } catch (e) {
            console.error(e);
        }
    }

    performFuzzySearch(input: string) {
        const results: Resource[] = [],
            hotkeys: Resource[] = [];
        for (const resource of this.resources) {
            let result =
                prepareSimpleSearch(input)(resource.text) ??
                prepareSimpleSearch(input)(resource.desc);
            if (result) {
                if (resource.tab == "hotkeys") {
                    hotkeys.push(resource);
                } else {
                    results.push(resource);
                }
            }
        }
        this.results = [...results, ...hotkeys];
        return this.results;
    }

    onunload() {
        this.settingsSearchEl.detach();

        this.settingsResultsEl.detach();
        this.detach();
        if (this.searchAppended && Platform.isDesktop)
            this.app.setting.openTabById(this.app.setting.lastTabId);
    }
}
