# Fallback web server for Windows computers without Python.
# Built-in Windows PowerShell only. Listens on loopback, not the public network.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'site'))
if (-not (Test-Path (Join-Path $root 'index.html'))) {
    throw 'site/index.html not found. Extract the entire ZIP first.'
}

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = ([Net.IPEndPoint]$listener.LocalEndpoint).Port
$url = "http://127.0.0.1:$port/index.html"
Write-Host "wallBoard is running: $url"
Write-Host 'Admin: handled by the Django backend after integration.'
Write-Host 'Keep this window open. Press Ctrl+C to stop.'
Start-Process $url

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.webp' = 'image/webp'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
    '.webmanifest' = 'application/manifest+json'
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 4000
            $stream = $client.GetStream()
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
            $request = $reader.ReadLine()
            if (-not $request) { continue }
            do { $header = $reader.ReadLine() } while ($null -ne $header -and $header -ne '')
            $pieces = $request.Split(' ')
            if ($pieces.Length -lt 2) { continue }
            $method = $pieces[0]
            $pathOnly = $pieces[1].Split('?')[0]
            $relative = [Uri]::UnescapeDataString($pathOnly).Replace('/', [IO.Path]::DirectorySeparatorChar).TrimStart([IO.Path]::DirectorySeparatorChar)
            if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
            $file = [IO.Path]::GetFullPath((Join-Path $root $relative))
            $allowed = $file.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)
            $found = ($method -eq 'GET' -or $method -eq 'HEAD') -and $allowed -and (Test-Path $file -PathType Leaf)
            if ($found) {
                $body = [IO.File]::ReadAllBytes($file)
                $extension = [IO.Path]::GetExtension($file).ToLowerInvariant()
                $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
                $status = '200 OK'
            } else {
                $body = [Text.Encoding]::UTF8.GetBytes('Not found')
                $contentType = 'text/plain; charset=utf-8'
                $status = '404 Not Found'
            }
            $headers = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
            $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            if ($method -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
            $stream.Flush()
        } catch {
            Write-Host "Request error: $_"
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}
