#!/usr/bin/pwsh

param(
    [parameter(ValueFromPipeline)]$input,
    [parameter(Position=0)] [String] $file
)

if (($file.length -le 0) -and ($input.length -le 0)) {
	Write-Error "You need to supply a file!"

	exit 123;
}

if ($file.length -gt 0){
    $content = (Get-Content $file | Select -First 1)
}else{
    $content = $input[0].ToString()
}

$fileVersion = $content.Split('.')
$fileVersion[-1] = [int]$fileVersion[-1] + 1
$fileVersion -join "."