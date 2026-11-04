
$projectRoot = $PSScriptRoot
$outputFile = Join-Path $projectRoot "project-export.txt"

$includeExtensions = @(
    ".js",
    ".json",
    ".ps1",
    ".md",
    ".gitignore"
)

$excludeDirectories = @(
    "node_modules",
    "browser-data",
    ".git",
    "logs"
)

$excludeFiles = @(
    "package-lock.json",
    "project-export.txt",
    "settings.local.json"
)

$files = Get-ChildItem -Path $projectRoot -Recurse -File |
    Where-Object {
        $relativePath = $_.FullName.Substring($projectRoot.Length)
        $extension = $_.Extension.ToLower()

        $extensionAllowed = $includeExtensions -contains $extension -or
                            $_.Name -eq ".gitignore"

        $directoryExcluded = $false

        foreach ($directory in $excludeDirectories) {
            if ($relativePath -match "(^|[\\/])$([regex]::Escape($directory))([\\/]|$)") {
                $directoryExcluded = $true
                break
            }
        }

        $fileExcluded = $excludeFiles -contains $_.Name

        $extensionAllowed -and
        -not $directoryExcluded -and
        -not $fileExcluded
    } |
    Sort-Object FullName

$export = foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($projectRoot.Length + 1)

    @"
==================================================
FILE: $relativePath
==================================================

$([System.IO.File]::ReadAllText($file.FullName))

"@
}

$export | Set-Content -Path $outputFile -Encoding utf8

Write-Host "Project export completed."
Write-Host "File: $outputFile"
Write-Host "Included files: $($files.Count)"
