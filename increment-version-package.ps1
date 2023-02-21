#!/usr/bin/pwsh

if ($args.length -le 0) {
	Write-Error "You need to supply a file!"

	exit 123;
}

$file = $args[0]
$packageJson = $(Get-Content $file | ConvertFrom-Json)
$packageJson.version = $packageJson.version | & "$PSScriptRoot/increment-version.ps1"
($packageJson | ConvertTo-Json) | out-file $file -Encoding "ASCII"