# Setup Guide

This guide walks you through downloading, configuring, running, and scheduling GitHub Organization Keep Alive.

You do not need prior experience with Node.js or Playwright. Follow the steps in order.

## 1. Before You Start

Make sure you have:

- A Windows computer.
- An internet connection.
- A GitHub account.
- Access to the target GitHub organization and its private repository.
- Permission to complete the organization's SSO and MFA authentication when required.

You will also need:

- PowerShell 7.
- Node.js LTS (npm is included with Node.js).

**Important:** This application is designed for PowerShell 7. Windows PowerShell 5.1 is not supported.

## 2. Download the Application

You can download the application in either of two ways.

### Option A – Clone using Git

If Git is installed, open PowerShell 7 and run:

```powershell
git clone https://github.com/onurdemirtas/github-organization-keep-alive.git
```

### Option B – Download as ZIP

If you do not have Git:

1. Open the [GitHub repository](https://github.com/onurdemirtas/github-organization-keep-alive).
2. Click **Code → Download ZIP**.
3. Extract the downloaded ZIP file to a folder on your computer.

You do not need Git for the ZIP installation.

For the remaining steps, open PowerShell 7 in the application folder.

## 3. Install PowerShell 7

If PowerShell 7 is not installed:

1. Visit the [official PowerShell installation guide](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows).
2. Download and install PowerShell 7 for Windows.
3. Open PowerShell 7.

Verify the installation:

```powershell
pwsh -v
```

The command should display the installed PowerShell version.

## 4. Install Node.js and npm

The application requires Node.js and npm.

1. Visit the [official Node.js website](https://nodejs.org/).
2. Download and install the **LTS version**.
3. Follow the installation wizard. Make sure npm and the option to add Node.js to PATH are included.
4. Close and reopen PowerShell 7.

Verify the installation:

```powershell
node --version
npm --version
```

Both commands should display version numbers.

npm is included with Node.js, so you do not need to install it separately.

## 5. Install Node.js Dependencies

Navigate to the application folder and run:

```powershell
npm install
```

This command reads the project's `package.json` and `package-lock.json` files and downloads the required Node.js packages.

The downloaded packages are placed in the `node_modules` folder.

This step installs the application dependencies. It does not install the Chromium browser.

## 6. Install the Chromium Browser

Run:

```powershell
npx playwright install chromium
```

This downloads the Chromium browser version required by Playwright.

Playwright uses this browser to automate GitHub login and organization authentication.

This is a separate step from `npm install`.

## 7. Configure the Application

The application uses two configuration files:

- `config/settings.json` – Shared default settings.
- `config/settings.local.json` – Organization-specific and machine-specific settings.

Local settings override corresponding values in the shared settings file. Unspecified values continue to use the defaults.

### 7.1. Review settings.json

Open:

```text
config/settings.json
```

Review the default configuration, especially the `Schedule` section.

Example:

```json
"Schedule": {
  "Enabled": true,
  "Days": [1, 2, 3, 4, 5, 6, 7],
  "Times": [800, 1600, 0]
}
```

- `Enabled` – Enables or disables scheduled execution.
- `Days` – Days of the week using ISO numbering: Monday = 1, Tuesday = 2, ..., Sunday = 7.
- `Times` – One or more execution times in HHmm format. For example, `800` means 08:00, `1600` means 16:00, and `0` means 00:00.

Adjust these values according to your requirements.

### 7.2. Create settings.local.json

Create a new file:

```text
config/settings.local.json
```

At a minimum, configure the `Organization` section with your own GitHub organization and private repository details.

Example:

```json
{
  "Organization": {
    "Name": "YourOrganization",
    "GitHubUrl": "https://github.com/YourOrganization",
    "SsoUrl": "https://github.com/orgs/YourOrganization/sso",
    "PrivateRepositoryUrl": "https://github.com/YourOrganization/YourPrivateRepository"
  }
}
```

Replace the example values with your actual organization and repository information.

You can also override machine-specific settings, for example:

```json
{
  "Organization": {
    "Name": "YourOrganization",
    "GitHubUrl": "https://github.com/YourOrganization",
    "SsoUrl": "https://github.com/orgs/YourOrganization/sso",
    "PrivateRepositoryUrl": "https://github.com/YourOrganization/YourPrivateRepository"
  },
  "Browser": {
    "UserDataDirectory": "browser-data"
  },
  "Logging": {
    "Debug": false
  }
}
```

**Important:**

- Use valid JSON syntax. Property names and string values must be enclosed in double quotes.
- Do not add comments to JSON files.
- Make sure the repository URL points to the private repository you want to monitor.
- `settings.local.json` is excluded from Git and should not be committed or shared.

If `settings.local.json` does not exist, the application uses `settings.json` exclusively.

## 8. Run the Application for the First Time

Run:

```powershell
npm start
```

Chromium will open and the application will perform its authentication checks.

During the first run, you may need to:

1. Sign in to GitHub.
2. Complete your organization's SSO authentication.
3. Sign in to Microsoft if requested.
4. Complete MFA if requested.

Follow the instructions displayed in the browser and wait for the automation to finish.

The application uses a persistent Chromium profile. This allows authentication sessions to be reused in subsequent executions.

## 9. Verify the Authentication Session

Run the application again:

```powershell
npm start
```

If your authentication sessions are still valid, the application should reuse them without requiring you to sign in again.

It should verify:

- Your GitHub login session.
- Your organization's SSO authentication.
- Access to the configured private repository.

**Note:** GitHub, Microsoft, or your organization's security policies may require authentication or MFA again when a session expires or additional verification is needed.

Make sure the manual execution completes successfully before proceeding.

## 10. Install the Scheduled Task

Once manual execution works correctly, install the Windows scheduled task.

Run:

```powershell
.\install.ps1
```

The script creates or updates a Windows Task Scheduler task using the schedule configuration in `settings.json`, with any values in the `Schedule` section of `settings.local.json` overriding the corresponding defaults.

### Verify the scheduled task

1. Open **Windows Task Scheduler**.
2. Find **GitHub Organization Keep Alive** in the Task Scheduler Library.
3. Open the task properties.
4. Review the **Triggers** tab and verify the configured days and execution times.
5. Review the **Actions** tab and verify the Node.js executable and application script.
6. Check the task's security settings.

**Important:** The task must run only when the user is logged in.

The application opens a visible browser and may require interactive login or MFA. Running the task in the background without an interactive user session is not supported.

### Test the scheduled task manually

In Task Scheduler:

1. Select **GitHub Organization Keep Alive**.
2. Click **Run**.
3. Verify that Chromium opens and the automation completes.
4. Check the task's **Last Run Result**.

This confirms that the scheduled task can launch the application.

## 11. Check Execution Logs

The application writes execution logs to:

```text
logs/activity.log
```

Each execution result is stored as a separate JSON line.

If an execution fails, inspect this file for additional information.

Debug logging can be enabled through the `Logging` section in `settings.local.json`:

```json
{
  "Logging": {
    "Debug": true
  }
}
```

## 12. Update the Schedule

If you change the `Schedule` configuration, run the installation script again:

```powershell
.\install.ps1
```

This updates the existing scheduled task with the new days and execution times.

## 13. Uninstall the Scheduled Task

To remove the scheduled task, run:

```powershell
.\uninstall.ps1
```

This removes the Windows scheduled task.

It does not delete:

- Application files.
- Configuration files.
- The persistent Chromium browser profile.
- Execution logs.
- Installed Node.js dependencies.

You can delete the application folder separately if you no longer need it.

## 14. Browser Profile and Authentication Data

The Chromium browser profile is stored in the configured directory, for example:

```text
browser-data
```

It retains authentication sessions and browser data between executions.

Keep this directory intact if you want to reuse your existing login sessions.

**Security considerations:**

- Do not delete the browser profile unless you are prepared to authenticate again.
- Do not commit the browser profile to Git.
- Do not share the browser profile with other users.
- Treat this directory as sensitive because it may contain authentication cookies and session data.

## 15. Troubleshooting

### `node` or `npm` is not recognized

Make sure Node.js is installed and available in your system PATH.

Close and reopen PowerShell 7 after installation.

### `pwsh` is not recognized

Make sure PowerShell 7 is installed and reopen your terminal.

### Chromium is missing

Run:

```powershell
npx playwright install chromium
```

### Organization authentication fails

Verify the organization URLs and private repository URL in `settings.local.json`.

Make sure your GitHub account has access to the organization and repository, and complete any required SSO authorization.

### Authentication is requested again

Complete the requested GitHub login, SSO, or MFA steps in the browser.

Authentication sessions may expire according to your organization's security policies.

### The scheduled task does not open the browser

Verify that:

- The Windows user is logged in.
- The task is configured to run only when the user is logged in.
- The task's action points to the correct Node.js executable and application script.
- The task's working directory is the application folder.

For additional information about the application, see [README.md](README.md).