# NexusMods Desktop Release Checklist

## Code signing

Windows Authenticode signing needs a real code-signing certificate from a trusted CA.
An OV certificate is usually enough; EV has stronger SmartScreen reputation but costs more
and normally requires a hardware token.

Electron Builder can sign automatically when these environment variables are set before
running the build:

```powershell
$env:CSC_LINK="C:\path\to\RDPSqu1ggs-code-signing.pfx"
$env:CSC_KEY_PASSWORD="your-pfx-password"
npm run dist
```

Do not commit the `.pfx` file or password. Keep both outside the repo.

To verify a finished EXE:

```powershell
Get-AuthenticodeSignature ".\dist\Scooters Toolbox-2.5.12-win-x64.exe" | Format-List
```

## Nexus-friendly build notes

- Upload the generated `.zip` as the preferred Nexus file when possible.
- Keep the portable `.exe` available as an alternate/manual file if users want one.
- Include the source repo/link, changelog, SHA256 hashes, and VirusTotal link in the mod page.
- Paste the live mod description from [`nexus-mod-description.md`](nexus-mod-description.md) (site: scooterstoolbox.com, Discord: https://discord.com/invite/DqetrAK2sJ).
- Avoid packers/obfuscators/UPX. The build should stay transparent.
- The desktop build disables remote telemetry/counters and remote serialization fallback.
