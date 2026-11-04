
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const { projectRoot, settings, debugLog } = require("../config/settings");

const userDataDir = path.resolve(
    projectRoot,
    settings.Browser.UserDataDirectory
);

const ssoUrl = settings.Organization.SsoUrl;
const repositoryUrl = settings.Organization.PrivateRepositoryUrl;

const ssoTimeout = 10 * 60 * 1000;
const accessCheckInterval = 5000;

async function isRepositoryAccessible(page) {
    await page.goto(repositoryUrl, {
        waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(3000);

    const currentUrl = new URL(page.url());
    const pageTitle = await page.title();

    return (
        currentUrl.hostname === "github.com" &&
        currentUrl.pathname.toLowerCase() ===
            new URL(repositoryUrl).pathname.toLowerCase() &&
        !pageTitle.toLowerCase().includes("sign in") &&
        await page.locator("article.markdown-body")
            .first()
            .isVisible()
            .catch(() => false)
    );
}


async function waitForRepositoryAccess(context, ssoPage) {
    const probePage = await context.newPage();

    const startedAt = Date.now();

    try {
        debugLog("");
        debugLog("Waiting for private repository access...");
        debugLog("Complete any requested steps in the SSO browser tab.");
        debugLog("Waiting up to 10 minutes...");

        // Open the repository tab, then return focus to the SSO tab.
        await probePage.bringToFront();
        await ssoPage.bringToFront();

        while (Date.now() - startedAt < ssoTimeout) {
            if (await isRepositoryAccessible(probePage)) {
                await probePage.bringToFront();

                debugLog("Private repository access confirmed.");
                debugLog("Current URL:", probePage.url());
                debugLog("Page title:", await probePage.title());

                debugLog("Private repository visible. Waiting 3 seconds...");
                await probePage.waitForTimeout(3000);

                return true;
            }

            await new Promise(resolve =>
                setTimeout(resolve, accessCheckInterval)
            );
        }

        return false;
    }
    finally {
        await probePage.close().catch(() => {});
    }
}

async function checkOrganizationSso() {
    fs.mkdirSync(userDataDir, { recursive: true });

    debugLog(`Starting ${settings.Organization.Name} SSO check...`);

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false
    });

    try {
        const page = context.pages()[0] || await context.newPage();

        debugLog("Checking private repository access...");

        if (await isRepositoryAccessible(page)) {
            debugLog("Private repository access already available.");

            console.log("Organization SSO: SUCCESS");
            console.log("Private repository access: SUCCESS");

            return true;
        }

        debugLog("Private repository access unavailable.");
        debugLog("Starting organization SSO flow...");

        await page.goto(ssoUrl, {
            waitUntil: "domcontentloaded"
        });

        debugLog(`${settings.Organization.Name} SSO page opened.`);

        const continueButton = page.getByRole("button", {
            name: /continue/i
        });

        const continueLink = page.getByRole("link", {
            name: /continue/i
        });

        if (await continueButton.isVisible().catch(() => false)) {
            await continueButton.click();
        } else if (await continueLink.isVisible().catch(() => false)) {
            await continueLink.click();
        } else {
            console.log("Continue button not found.");
            console.log("Please check the browser.");

            return false;
        }

        debugLog("");
        debugLog("Complete Microsoft sign-in if requested.");
        debugLog("Complete SMS MFA if requested.");

        const repositoryAccessible = await waitForRepositoryAccess(
            context,
            page
        );

        if (repositoryAccessible) {
            debugLog("Private repository page opened.");

            console.log("Organization SSO: SUCCESS");
            console.log("Private repository access: SUCCESS");

            return true;
        }

        console.log("Private repository access: FAILED");
        console.log("SSO completion timeout.");

        return false;
    }
    catch (error) {
        console.error("SSO check failed:", error.message);
        throw error;
    }
    finally {
        await context.close();
    }
}

module.exports = checkOrganizationSso;
