#!/usr/bin/pwsh
$v = $(npm pkg get version)
$v = $v -replace '"',''
mv festivalmanager.exe releases/festivalmanager-$v.exe