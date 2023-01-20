# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.3.5](https://github.com/valentine195/obsidian-settings-search/compare/1.3.4...1.3.5) (2023-01-20)


### Bug Fixes

* adds setting search loaded event ([ae4c2fb](https://github.com/valentine195/obsidian-settings-search/commit/ae4c2fb5a1572feb76fbfe540653f15e659e7157))

### [1.3.3](https://github.com/valentine195/obsidian-settings-search/compare/1.3.2...1.3.3) (2023-01-20)


### Bug Fixes

* expose removeTabResources ([8eb6990](https://github.com/valentine195/obsidian-settings-search/commit/8eb6990c92b6e08cca95e1f9f76d30848ffb9754))

### [1.3.2](https://github.com/valentine195/obsidian-settings-search/compare/1.3.1...1.3.2) (2023-01-20)


### Bug Fixes

* addResource -> addResources, removeResource -> removeResources, addResources now returns a deregister function ([1afdb45](https://github.com/valentine195/obsidian-settings-search/commit/1afdb45a8d5f4edba2c7e096d2de756bf7f29169))

### [1.3.1](https://github.com/valentine195/obsidian-settings-search/compare/1.3.0...1.3.1) (2023-01-20)


### Bug Fixes

* adds a way to remove external resources ([fe72419](https://github.com/valentine195/obsidian-settings-search/commit/fe724191a3b57d1d3558f5a024c0892aa3c2bd22))

## [1.3.0](https://github.com/valentine195/obsidian-settings-search/compare/1.2.0...1.3.0) (2023-01-19)


### Features

* adds ability for other plugins to add settings ([f35ee83](https://github.com/valentine195/obsidian-settings-search/commit/f35ee83d98ccb1f504d08ea7674895b7414a6403))


### Bug Fixes

* fixes jump to setting ([27e2b41](https://github.com/valentine195/obsidian-settings-search/commit/27e2b4150df338087d43fc67a6b14c3f010a6a9b))

## [1.2.0](https://github.com/valentine195/obsidian-settings-search/compare/1.1.0...1.2.0) (2022-03-23)


### Features

* Settings Search is now on mobile! closes [#9](https://github.com/valentine195/obsidian-settings-search/issues/9) ([8838d41](https://github.com/valentine195/obsidian-settings-search/commit/8838d41f41428d89cdead96bd68a692834aa446c))

## [1.1.0](https://github.com/valentine195/obsidian-settings-search/compare/1.0.7...1.1.0) (2022-03-17)


### Features

* Added keyboard navigation to search results (close [#3](https://github.com/valentine195/obsidian-settings-search/issues/3)) ([f178598](https://github.com/valentine195/obsidian-settings-search/commit/f17859842d8d79237e9c64a6a1df818fb31dfa94))

### [1.0.7](https://github.com/valentine195/obsidian-settings-search/compare/1.0.6...1.0.7) (2022-03-15)


### Bug Fixes

* Wait for SettingTab display call before grabbing settings (close [#13](https://github.com/valentine195/obsidian-settings-search/issues/13)) ([b1adc7f](https://github.com/valentine195/obsidian-settings-search/commit/b1adc7f35a36bfe6424e88665e418bce66b1ff2c))

### [1.0.6](https://github.com/valentine195/obsidian-settings-search/compare/1.0.5...1.0.6) (2022-03-10)


### Bug Fixes

* Adds check for nested details elements (close [#11](https://github.com/valentine195/obsidian-settings-search/issues/11)) ([0d07279](https://github.com/valentine195/obsidian-settings-search/commit/0d072796f9613357a8462a98431db89d2b7e4f29))
* Fixes padding issue on default theme (close [#12](https://github.com/valentine195/obsidian-settings-search/issues/12)) ([13a3e98](https://github.com/valentine195/obsidian-settings-search/commit/13a3e985519de3cc01ee4b61f55e3e0b53d03a03))

### [1.0.5](https://github.com/valentine195/obsidian-settings-search/compare/1.0.4...1.0.5) (2022-03-03)


### Bug Fixes

* Hotkeys are now always at the bottom of results (close [#10](https://github.com/valentine195/obsidian-settings-search/issues/10)) ([625d64e](https://github.com/valentine195/obsidian-settings-search/commit/625d64e4af28c559a017c1d07075d1f0e3c3fefd))

### [1.0.4](https://github.com/valentine195/obsidian-settings-search/compare/1.0.3...1.0.4) (2022-02-23)


### Bug Fixes

* Fixed settings search placeholder ([a71e4bb](https://github.com/valentine195/obsidian-settings-search/commit/a71e4bb99fdf1aa40ddfa17c0e64d79bcd5cc2b5))

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
