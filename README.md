# GitHub Organization Keep Alive

A Node.js automation tool that verifies GitHub login status, organization SSO authentication, and access to a configured private GitHub repository.

## Features

- Checks whether the user is logged in to GitHub.
- Verifies authentication with a configured GitHub organization through its SSO flow.
- Checks access to a configured private organization repository.
- Uses a persistent Chromium browser profile to retain authentication sessions.
- Supports configurable debug logging.
- Records execution results in a JSON Lines log file.
- Supports automatic execution through Windows Task Scheduler with multiple daily execution times.

## Requirements

- Windows
- Node.js
- npm
- PowerShell 7
- Playwright and Chromium

Note: This version is designed for compatibility with PowerShell 7. Windows PowerShell 5.1 is not supported.

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Install the Playwright Chromium browser:

```bash
npx playwright install chromium
```

## Configuration

The automation uses two configuration files:

- `config/settings.json` – Shared default settings.
- `config/settings.local.json` – Optional machine-specific settings.

Local settings override the corresponding values in the shared settings file. Unspecified values remain unchanged.

Create `config/settings.local.json` if you need machine-specific configuration.

Example:

```json
{
  "Browser": {
    "UserDataDirectory": "browser-data/MyChromium"
  },
  "Logging": {
    "Debug": true
  }
}
```

The local settings file is excluded from Git to prevent user-specific configuration from being committed.

If `settings.local.json` does not exist, the automation uses `settings.json` exclusively.

## Usage

Run the automation manually:

```powershell
npm start
```

Alternatively:

```powershell
node automation/main.js
```

The automation performs the following checks:

1. **GitHub Login Check** – Verifies the GitHub login session.
2. **Organization SSO Check** – Checks access to the configured private repository. If access is unavailable, it starts the organization's SSO authentication flow and waits for access to become available.

If authentication is required, the Chromium browser opens. The user can complete the requested GitHub login, Microsoft sign-in, and MFA steps interactively.

## Scheduled Execution

The automation can be scheduled using Windows Task Scheduler.

Since authentication may require user interaction (e.g. login or MFA), the scheduled task must run only when the user is logged in. This allows the browser to open visibly and supports interactive authentication.

### Install the scheduled task

Run the following command from the project directory:

```powershell
.\install.ps1
```

The script creates or updates the scheduled task using the schedule configuration in `settings.json` and, if present, `settings.local.json`.

### Remove the scheduled task

```powershell
.\uninstall.ps1
```

This removes the scheduled task without deleting project files or configuration.

### Schedule Configuration

The schedule is configured through the `Schedule` section:

```json
"Schedule": {
  "Enabled": true,
  "Days": [1, 2, 3, 4, 5, 6, 7],
  "Times": [800, 1600, 0]
}
```

- `Enabled` – Enables or disables scheduled execution.
- `Days` – Days of the week using ISO numbering: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday.
- `Times` – One or more execution times in HHmm format. For example, `800` means 08:00, `1600` means 16:00, and `0` means