#!/usr/bin/env python3
"""
Script to remove pages 2-45 from the flipbook HTML file.
This script properly handles nested divs and removes complete page structures.
"""

import re

# Read the HTML file
with open('/Users/topolina/Desktop/flipbook website/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find all page divs (not page-content divs)
page_starts = []
for i, line in enumerate(lines):
    if '<div class="page' in line and 'page-content' not in line:
        page_starts.append(i)

print(f"Found {len(page_starts)} pages")
print(f"Page 1 starts at line: {page_starts[0] + 1}")
print(f"Page 2 starts at line: {page_starts[1] + 1}")
print(f"Page 45 starts at line: {page_starts[44] + 1}")
print(f"Page 46 starts at line: {page_starts[45] + 1}")

# Function to find the closing </div> for a given opening <div>
def find_closing_div(lines, start_index):
    depth = 0
    for i in range(start_index, len(lines)):
        line = lines[i]
        # Count opening divs
        depth += line.count('<div')
        # Count closing divs
        depth -= line.count('</div>')
        
        if depth == 0:
            return i
    return -1

# Find where page 2 starts and page 45 ends
page_2_start = page_starts[1]  # Index for page 2
page_45_start = page_starts[44]  # Index for page 45
page_45_end = find_closing_div(lines, page_45_start)

print(f"\nPage 2 starts at line: {page_2_start + 1}")
print(f"Page 45 ends at line: {page_45_end + 1}")
print(f"Will remove lines {page_2_start + 1} to {page_45_end + 1}")

# Create new content by removing pages 2-45
new_lines = lines[:page_2_start] + lines[page_45_end + 1:]

# Write the modified content
with open('/Users/topolina/Desktop/flipbook website/index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\nSuccessfully removed pages 2-45!")
print(f"Original line count: {len(lines)}")
print(f"New line count: {len(new_lines)}")
print(f"Lines removed: {len(lines) - len(new_lines)}")
