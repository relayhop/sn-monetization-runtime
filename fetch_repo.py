```python
import subprocess
import json
import urllib.request

# Fetch repo info
result = subprocess.run(
    ["git", "clone", "https://github.com/relayhop/sn-monetization-runtime", "/tmp/sn-monetization-runtime"],
    capture_output=True, text=True
)

# Fetch issue
req = urllib.request.Request("https://api.github.com/repos/relayhop/sn-monetization-runtime/issues/1226")
with urllib.request.urlopen(req) as response:
    issue = json.loads(response.read().decode())
    print(json.dumps(issue, indent=2))
