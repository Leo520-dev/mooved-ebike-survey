import requests
import re

# Fetch the latest index.html from GitHub Pages
response = requests.get('https://leo520-dev.github.io/mooved-ebike-survey/')
html = response.text

print("=== GitHub Pages Content Analysis ===")
print(f"Status: {response.status_code}")
print(f"Length: {len(html)} characters")

# Check for key elements
checks = [
    ('submitBtn ID', 'id="submitBtn"' in html),
    ('white theme', '--bg:#ffffff' in html),
    ('githubRequest function', 'async function githubRequest' in html),
    ('CORS mode', "mode: 'cors'" in html),
    ('adminLogin function', 'async function adminLogin' in html),
    ('loadAdminData function', 'async function loadAdminData' in html),
    ('token input', 'githubTokenInput' in html),
    ('vehicle cards', 'vehicleCardsContainer' in html),
]

print("\n=== Feature Checks ===")
for name, result in checks:
    status = "✅" if result else "❌"
    print(f"{status} {name}: {result}")

# Check for the actual submit button HTML
submit_btn_match = re.search(r'<button[^>]*id="submitBtn"[^>]*>.*?</button>', html)
if submit_btn_match:
    print(f"\n✅ Submit Button Found:")
    print(f"   {submit_btn_match.group(0)}")
else:
    print("\n❌ Submit Button NOT found with id='submitBtn'")

# Check for the githubRequest function implementation
github_request_match = re.search(r'async function githubRequest\(url, options\) \{[\s\S]*?\n\}', html)
if github_request_match:
    print(f"\n✅ githubRequest function found:")
    print(f"   {github_request_match.group(0)[:200]}...")
else:
    print("\n❌ githubRequest function NOT found")

print("\n📊 Summary:")
all_passed = all(result for _, result in checks)
if all_passed:
    print("✅ All features are present and correct!")
else:
    print("❌ Some features are missing or incorrect.")