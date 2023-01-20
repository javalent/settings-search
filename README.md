## Settings Search

This plugin adds global search to the Obsidian settings.

That's it. That's the plugin.

### Keyboard Navigation

You can use the keyboard to navigate the search results. The up and down arrow keys can be used to move through the results, and the enter button will take you to the setting.

## Plugin Authors - Adding Settings Dynamically

This plugin works by rendering all of the setting tabs and grabbing any rendered setting.

Sometimes, settings are rendered dynamically and thus not available when a tab is rendered. If you want to interface with the plugin and add your settings dynamically, you can do so using the API. It is available on the `window` as `window.SettingsSearch`.

```ts
interface Resource {
    //Id of your settings tab. This is usually the ID of your plugin as defined in the manifest.
    tab: string;
    //Name of your settings tab. This is usually the name of your plugin as defined in the manifest. This is used to organize the settings under headers when searching.
    name: string;
    //The name of the setting to add.
    text: string;
    //An optional description string to add to the setting.
    desc: string;
}

SettingsSearch.addResource(resource: Resource);
SettingsSearch.removeResource(resource: Resource);

```
