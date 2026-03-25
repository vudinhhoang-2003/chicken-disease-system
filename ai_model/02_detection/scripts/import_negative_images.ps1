param(
    [string]$SourceRoot = "D:\Chicken_Disease_System\ai_model\negative_images",
    [string]$DatasetRoot = "D:\Chicken_Disease_System\ai_model\02_detection\data\merged_dataset",
    [int]$Seed = 42
)

$ErrorActionPreference = "Stop"

function Get-SanitizedName {
    param([string]$Value)

    $sanitized = $Value.ToLowerInvariant() -replace "[^a-z0-9]+", "_"
    return $sanitized.Trim("_")
}

if (-not (Test-Path $SourceRoot)) {
    throw "SourceRoot not found: $SourceRoot"
}

if (-not (Test-Path $DatasetRoot)) {
    throw "DatasetRoot not found: $DatasetRoot"
}

$allowedExtensions = @(".jpg", ".jpeg", ".png", ".bmp", ".webp")
$allFiles = Get-ChildItem $SourceRoot -Recurse -File |
    Where-Object { $allowedExtensions -contains $_.Extension.ToLowerInvariant() }

if (-not $allFiles) {
    throw "No image files found in $SourceRoot"
}

$shuffled = $allFiles | Sort-Object FullName | Get-Random -Count $allFiles.Count -SetSeed $Seed
$total = $shuffled.Count

$trainCount = [int][math]::Floor($total * 0.8)
$validCount = [int][math]::Floor($total * 0.1)
$testCount = $total - $trainCount - $validCount

$splits = @(
    @{ Name = "train"; Files = $shuffled[0..($trainCount - 1)] },
    @{ Name = "valid"; Files = $shuffled[$trainCount..($trainCount + $validCount - 1)] },
    @{ Name = "test"; Files = $shuffled[($trainCount + $validCount)..($total - 1)] }
)

$manifest = New-Object System.Collections.Generic.List[object]

foreach ($split in $splits) {
    $splitName = $split.Name
    $imagesDir = Join-Path $DatasetRoot "$splitName\images"
    $labelsDir = Join-Path $DatasetRoot "$splitName\labels"

    New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null
    New-Item -ItemType Directory -Force -Path $labelsDir | Out-Null

    $index = 1
    foreach ($file in $split.Files) {
        $category = Get-SanitizedName -Value $file.Directory.Name
        $extension = $file.Extension.ToLowerInvariant()
        $baseName = "neg_{0}_{1}_{2:d4}" -f $splitName, $category, $index

        $destImage = Join-Path $imagesDir ($baseName + $extension)
        $destLabel = Join-Path $labelsDir ($baseName + ".txt")

        Copy-Item $file.FullName $destImage -Force
        New-Item -ItemType File -Path $destLabel -Force | Out-Null

        $manifest.Add([pscustomobject]@{
            split = $splitName
            source = $file.FullName
            image = $destImage
            label = $destLabel
        }) | Out-Null

        $index++
    }
}

$manifestPath = Join-Path $DatasetRoot "negative_import_manifest.csv"
$manifest | Export-Csv -Path $manifestPath -NoTypeInformation -Encoding UTF8

Write-Host "Imported $total negative images."
Write-Host "Train: $trainCount"
Write-Host "Valid: $validCount"
Write-Host "Test : $testCount"
Write-Host "Manifest: $manifestPath"
