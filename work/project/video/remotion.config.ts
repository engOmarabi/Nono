import { Config } from "@remotion/cli/config";

// Use the Chromium headless shell already installed in this environment
// instead of letting Remotion download its own (network egress is
// restricted to an allowlist that doesn't include remotion.media).
Config.setBrowserExecutable(
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
);
