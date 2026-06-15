import re

file_path = 'c:/Users/Admin/Downloads/n50k-blueprint-sales_1/src/pages/AdminDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to remove the sections for:
# - AdminAnnouncements
# - AdminCoupons
# - AdminQnA
# - AdminReviews
# These sections are between:
# // ─── ANNOUNCEMENT BROADCAST MODULE ───────────────────────────────────────────
# and
# function AdminOverview() {

pattern = r'// ─── ANNOUNCEMENT BROADCAST MODULE ───────────────────────────────────────────.*?function AdminOverview\(\)'

# Let's perform the replacement
new_content, count = re.subn(pattern, 'function AdminOverview()', content, flags=re.DOTALL)

print(f"Substituted: {count}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
