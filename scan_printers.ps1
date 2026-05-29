$ips = 1..254 | ForEach-Object { "192.168.2.$_" }
$results = @()
$runspacePool = [runspacefactory]::CreateRunspacePool(1, 20)
$runspacePool.Open()

$jobs = foreach ($ip in $ips) {
    $powershell = [powershell]::Create().AddScript({
        param($targetIp)
        $client = [System.Net.Sockets.TcpClient]::new()
        try {
            $task = $client.ConnectAsync($targetIp, 9100)
            if ($task.Wait(500)) {
                if ($client.Connected) {
                    return $targetIp
                }
            }
        } catch {} finally {
            $client.Close()
        }
        return $null
    }).AddArgument($ip)
    $powershell.RunspacePool = $runspacePool
    [PSCustomObject]@{
        Pipe = $powershell
        Result = $powershell.BeginInvoke()
    }
}

foreach ($job in $jobs) {
    $res = $job.Pipe.EndInvoke($job.Result)
    if ($res) {
        $results += $res
        Write-Host "Found printer at $res"
    }
    $job.Pipe.Dispose()
}
$runspacePool.Close()
