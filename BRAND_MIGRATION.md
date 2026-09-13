# TraceRx brand migration — September 13, 2026

The product, Python package, imports, API title, generated training documents,
download names, launcher, React packages, optional Web3 app, Docker command,
deployment configuration and documentation now use TraceRx (`tracerx` in code).

Repository: https://github.com/BluePaper1122/TraceRx
Live service: https://resistlens.onrender.com/

The Render service display name is TraceRx and its Git source is the renamed
repository, branch main. The original assigned hostname is retained; no claim
is made that tracerx.onrender.com belongs to this project. The visual QA script
accepts TRACERX_URL to test a future address.

## Compatibility and scope

- Git history and other team branches are preserved; historical commits still
  contain the former name. This migration updates main, without rewriting history.
- Browser storage migration reads the former prefix once and writes the new
  prefix, preserving sessions/preferences on the same origin. Browser storage
  does not automatically transfer to a different hostname.
- The regenerated synthetic-documents.zip uses the new branding. Download this
  version for exact-match demo extraction; previously downloaded fixtures can
  carry different hashes. The independent 48-image benchmark has neutral lab
  headers and remains unchanged.
- Historical local checkout paths in older reports remain accurate. The tested
  release checkout is work/tracerx-release under this task workspace. The
  original outputs/resistlens checkout and its test-branch are preserved.
- No credentials or database schemas were changed. Environment files were
  excluded from the branding replacement. Compiled Python cache files were
  removed from tracking and ignored.
- Account-level Render workspace branding was not changed.

## Validation

115 Python tests passed, including API and synthetic model checks. The React
production build passed. Dependency deprecation/core-detection warnings remain;
passing tests do not constitute clinical validation or an error-free guarantee.
Branding changes do not change the clinical workflow rules or train a model.
