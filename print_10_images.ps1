Add-Type -AssemblyName System.Drawing
$script:printerName = "Epson L3250 SIMSIZ"

$imagesToPrint = @(
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\pkg_ice_cream_1_1779975512768.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\pkg_ice_cream_2_1779975526409.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\pkg_ice_cream_3_1779975540956.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\pkg_ice_cream_4_1779975559406.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\ice_cream_1_1779975350281.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\ice_cream_2_1779975362959.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\ice_cream_3_1779975375733.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\ice_cream_4_1779975395090.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\ice_cream_5_1779975411590.png",
    "C:\Users\Profit\.gemini\antigravity\brain\f71f13c2-c4fa-49d6-801a-bed21fc82d5c\ice_cream_6_1779975425118.png"
)

foreach ($imgPath in $imagesToPrint) {
    if (Test-Path $imgPath) {
        try {
            $script:image = [System.Drawing.Image]::FromFile($imgPath)
            $pd = New-Object System.Drawing.Printing.PrintDocument
            $pd.PrinterSettings.PrinterName = $script:printerName
            $pd.PrinterSettings.Copies = 1
            # Switch to Portrait for better fit without cutting the top/bottom ice cream
            $pd.DefaultPageSettings.Landscape = $false
            $pd.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)

            # Set A4 paper size explicitly
            $a4 = $pd.PrinterSettings.PaperSizes | Where-Object { $_.Kind -eq [System.Drawing.Printing.PaperKind]::A4 }
            if ($a4 -ne $null) {
                $pd.DefaultPageSettings.PaperSize = $a4
            }

            $pd.add_PrintPage({
                param($sender, $e)
                
                $m = $e.PageBounds
                $scale = [math]::Max($m.Width / $script:image.Width, $m.Height / $script:image.Height)
                $w = $script:image.Width * $scale
                $h = $script:image.Height * $scale
                $x = $m.Left + ($m.Width - $w) / 2
                $y = $m.Top + ($m.Height - $h) / 2
                
                $e.Graphics.DrawImage($script:image, [float]$x, [float]$y, [float]$w, [float]$h)
            })
            
            $pd.Print()
            $script:image.Dispose()
            Start-Sleep -Seconds 1 # small delay between prints
        } catch {
            Write-Error "Failed to print $imgPath : $_"
        }
    } else {
        Write-Warning "File not found: $imgPath"
    }
}
Write-Host "All 10 A4 images sent to printer successfully."
