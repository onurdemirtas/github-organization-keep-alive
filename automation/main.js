const fs = require("fs");
const path = require("path");

const { projectRoot, settings } = require("../config/settings");

const checkGitHubLogin = require("./github-check");
const checkOrganizationSso = require("./sso-check");

function writeLog(logEntry) {
    if (!settings.Logging.Enabled) {
        return;
    }

    const logDirectory = path.resolve(
        projectRoot,
        settings.Logging.Directory
    );

    fs.mkdirSync(logDirectory, { recursive: true });

    const logFile = path.join(
        logDirectory,
        settings.Logging.FileName
    );

    fs.appendFileSync(
        logFile,
        JSON.stringify(logEntry) + "\n",
        "utf8"
    );
}

async function main() {
    console.log("");
    console.log("==================================");
    console.log(" GitHub Organization Keep Alive");
    console.log("==================================");
    console.log("");

    console.log("[1/2] GitHub Login Check");
    const githubResult = await checkGitHubLogin();

    console.log("");
    console.log("[2/2] Organization SSO Check");

    let ssoResult = false;

    if (githubResult) {
        ssoResult = await checkOrganizationSso();
    } else {
        console.log("GitHub login doğrulanamadığı için SSO kontrolü atlandı.");
    }

    console.log("");
    console.log("==================================");
    console.log(" SUMMARY");
    console.log("==================================");
    console.log("GitHub Login    :", githubResult ? "SUCCESS" : "FAILED");
    console.log("Organization SSO:", ssoResult ? "SUCCESS" : "FAILED");
    console.log("");

    const overallResult = githubResult && ssoResult;

    writeLog({
        timestamp: new Date().toISOString(),
        githubLogin: githubResult ? "SUCCESS" : "FAILED",
        organizationSso: ssoResult ? "SUCCESS" : "FAILED",
        overallResult: overallResult ? "SUCCESS" : "FAILED"
    });

    if (!overallResult) {
        process.exitCode = 1;
    }
}

main().catch(error => {
    console.error("Automation failed:", error);

    writeLog({
        timestamp: new Date().toISOString(),
        overallResult: "ERROR",
        error: error.message
    });

    process.exitCode = 1;
});