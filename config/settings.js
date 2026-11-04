const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const settingsPath = path.join(__dirname, "settings.json");
const localSettingsPath = path.join(__dirname, "settings.local.json");

const settings = JSON.parse(
    fs.readFileSync(settingsPath, "utf8")
);

function mergeSettings(target, source) {
    for (const key of Object.keys(source)) {
        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])
        ) {
            target[key] = mergeSettings(
                target[key] || {},
                source[key]
            );
        } else {
            target[key] = source[key];
        }
    }

    return target;
}

if (fs.existsSync(localSettingsPath)) {
    const localSettings = JSON.parse(
        fs.readFileSync(localSettingsPath, "utf8")
    );

    mergeSettings(settings, localSettings);
}

function debugLog(...args) {
    if (settings.Logging.Debug) {
        console.log(...args);
    }
}

module.exports = {
    projectRoot,
    settings,
    debugLog
};