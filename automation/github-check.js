
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const { projectRoot, settings, debugLog } = require("../config/settings");

const userDataDir = path.resolve(
    projectRoot,
    settings.Browser.UserDataDirectory
);

const profileUrl = settings.GitHub.ProfileUrl;

async function checkGitHubLogin() {
    fs.mkdirSync(userDataDir, { recursive: true });

    debugLog("Starting GitHub login check...");

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false
    });

    try {
        const page = context.pages()[0] || await context.newPage();

        await page.goto(profileUrl, {
            waitUntil: "domcontentloaded"
        });

        debugLog("Current URL:", page.url());
        debugLog("Page title:", await page.title());

        if (new URL(page.url()).pathname === "/login") {
            console.log("GitHub login required.");
            console.log("Please sign in using the opened browser.");

            await page.waitForURL(
                url =>
                    url.hostname === "github.com" &&
                    url.pathname === new URL(profileUrl).pathname,
                { timeout: 5 * 60 * 1000 }
            );
        }

        const currentUrl = new URL(page.url());
        const expectedUrl = new URL(profileUrl);

        if (
            currentUrl.hostname === expectedUrl.hostname &&
            currentUrl.pathname === expectedUrl.pathname
        ) {
            debugLog("GitHub profile page opened.");
            debugLog("Waiting 3 seconds...");

            await page.waitForTimeout(3000);

            console.log("GitHub Login: SUCCESS");
            return true;
        }

        console.log("GitHub login: NOT CONFIRMED");
        return false;
    }
    catch (error) {
        console.error("GitHub check failed:", error.message);
        throw error;
    }
    finally {
        await context.close();
    }
}

module.exports = checkGitHubLogin;
