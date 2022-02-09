const config = require("./webpack.config.js");

// const folder = ;

module.exports = {
    ...config,
    mode: "development",
    devtool: "eval",
    output: {
        ...config.output,
        path:
            "C:/Users/jvalentine/Documents/The Price of Revenge/.obsidian/plugins/" +
            folder
    },
    watchOptions: {
        ignored: ["styles.css", "*.js", "**/node_modules"]
    }
};
