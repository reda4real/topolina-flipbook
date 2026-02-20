# package_project.ps1
$ErrorActionPreference = "Stop"

$exclude = @(
    "node_modules",
    ".git",
    ".env",
    "deploy.zip",
    "*.log",
    ".DS_Store"
)

$source = Get-Item .
$destination = "deploy.zip"

Write-Host "Packaging project to '$destination'..."
Write-Host "   Excluding: $($exclude -join ', ')"

if (Test-Path $destination) {
    Remove-Item $destination
}

# Get all items, filter exclusions, and compress
$items = Get-ChildItem -Path $source | Where-Object { 
    $name = $_.Name
    $exclude -notcontains $name
}

Compress-Archive -Path $items.FullName -DestinationPath $destination -Force

Write-Host "Created '$destination' successfully!"
Write-Host "Upload this file to your hosting file manager."
