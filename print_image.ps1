Add-Type -AssemblyName System.Drawing
$script:imagePath = "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\balanced_ice_cream_1779975258364.png"
$script:printerName = "Epson L3250"

try {
    $script:image = [System.Drawing.Image]::FromFile($script:imagePath)
    $pd = New-Object System.Drawing.Printing.PrintDocument
    $pd.PrinterSettings.PrinterName = $script:printerName
    $pd.PrinterSettings.Copies = 1
    $pd.DefaultPageSettings.Landscape = $true

    $pd.add_PrintPage({
        param($sender, $e)
        
        $m = $e.MarginBounds
        $imgRatio = $script:image.Width / $script:image.Height
        $boundRatio = $m.Width / $m.Height
        
        if ($imgRatio -gt $boundRatio) {
            $h = $m.Width / $imgRatio
            $e.Graphics.DrawImage($script:image, $m.Left, $m.Top, $m.Width, [int]$h)
        } else {
            $w = $m.Height * $imgRatio
            $e.Graphics.DrawImage($script:image, $m.Left, $m.Top, [int]$w, $m.Height)
        }
    })
    
    $pd.Print()
    Write-Host "Printing successfully sent."
} catch {
    Write-Error "Failed to print: $_"
} finally {
    if ($script:image -ne $null) {
        $script:image.Dispose()
    }
}
