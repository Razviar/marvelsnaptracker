// Hook for @electron/windows-sign (via maker-squirrel `windowsSign.hookModulePath`).
// windows-sign's built-in signtool path always dual-signs (SHA-1 with a legacy /t timestamp,
// then SHA-256), which Azure Trusted Signing rejects, so this signs each file directly with
// the Windows SDK signtool and the Trusted Signing dlib. Requires a logged-in Azure CLI
// (`az login`) with the Certificate Profile Signer role on the account named in metadata.json.
const {execFileSync} = require('child_process');
const path = require('path');

const SIGNTOOL =
  process.env.SIGNTOOL_PATH || 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\signtool.exe';
const TRUSTED_SIGNING_DIR = process.env.TRUSTED_SIGNING_DIR || path.join(process.env.LOCALAPPDATA, 'TrustedSigning');

module.exports = function sign(file) {
  execFileSync(
    SIGNTOOL,
    [
      'sign',
      '/fd',
      'SHA256',
      '/tr',
      'http://timestamp.acs.microsoft.com',
      '/td',
      'SHA256',
      '/dlib',
      path.join(TRUSTED_SIGNING_DIR, 'bin', 'x64', 'Azure.CodeSigning.Dlib.dll'),
      '/dmdf',
      path.join(TRUSTED_SIGNING_DIR, 'metadata.json'),
      file,
    ],
    {stdio: 'inherit'}
  );
};
