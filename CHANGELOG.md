# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.3](https://github.com/valentine195/obsidian-settings-search/compare/1.0.2...1.0.3) (2022-02-23)


### Bug Fixes

* Loading plugin no longer closes the active settings tab ([317c1e2](https://github.com/valentine195/obsidian-settings-search/commit/317c1e2ad104f36d044c1c9ecc8e0182a0c16c96))
* Settings indexing is no longer blocks the main process ([ee7b7b9](https://github.com/valentine195/obsidian-settings-search/commit/ee7b7b947cf3e00c987e122141e5ab19155a830b))
* Unloading the plugin no longer re-loads the active settings tab ([5579a8d](https://github.com/valentine195/obsidian-settings-search/commit/5579a8d5d55a85465431509e9ce33da3040707fc))

### [1.0.2](https://github.com/valentine195/obsidian-settings-search/compare/1.0.1...1.0.2) (2022-02-17)


### Bug Fixes

* call hide() on settings tabs ([78ea4c9](https://github.com/valentine195/obsidian-settings-search/commit/78ea4c9fc9de8bd1307607ec9ae9c27cf3429c8f))
* calls tab.hide after building settings tab resources to properly unload ([7de69f6](https://github.com/valentine195/obsidian-settings-search/commit/7de69f65d5e5fe040c090199f45af32a7fcd6010))

### [1.0.1](https://github.com/valentine195/obsidian-settings-search/compare/1.0.0...1.0.1) (2022-02-15)


### Bug Fixes

* fixed issue where settings with no descriptions would break fuzzy search (close [#6](https://github.com/valentine195/obsidian-settings-search/issues/6)) ([fecf025](https://github.com/valentine195/obsidian-settings-search/commit/fecf02500f90437487aed33133c1cf4ae1ad3b24))

## [1.0.0](https://github.com/valentine195/obsidian-settings-search/compare/0.0.2...1.0.0) (2022-02-14)


### Features

* can now open plugin settings directly from search results (close [#4](https://github.com/valentine195/obsidian-settings-search/issues/4)) ([a0d6b6f](https://github.com/valentine195/obsidian-settings-search/commit/a0d6b6f591b0126243287cb09fc407ee5398b2b9))


### Bug Fixes

* patches setting open to focus search field on open (close [#2](https://github.com/valentine195/obsidian-settings-search/issues/2)) ([1b6561e](https://github.com/valentine195/obsidian-settings-search/commit/1b6561e690061df0eaf535ee55f336fd369a2378))
* settings descriptions are now recreated as-is (closes [#5](https://github.com/valentine195/obsidian-settings-search/issues/5)) ([2b3678c](https://github.com/valentine195/obsidian-settings-search/commit/2b3678c8730fd0d7fd5fe8dbffa413e2e58b0f1d))

### 0.0.2 (2022-02-10)
