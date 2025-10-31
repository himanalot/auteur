#!/usr/bin/env python3
"""
Inspect the helix module to understand its structure
"""

import helix
from helix.client import Client

print("🔍 Inspecting helix module...")
print(f"helix module attributes: {dir(helix)}")

print("\n🔍 Inspecting Client...")
client = Client(local=True)
print(f"Client methods: {[method for method in dir(client) if not method.startswith('_')]}")

print("\n🔍 Testing client.query method signature...")
try:
    help(client.query)
except Exception as e:
    print(f"Error getting help: {e}")

# Try to find the MCP-related functions
print("\n🔍 Looking for MCP functions in helix module...")
for attr in dir(helix):
    if 'init' in attr.lower() or 'mcp' in attr.lower() or 'tool' in attr.lower():
        print(f"Found: {attr}")

# Check if there are submodules
print("\n🔍 Checking for submodules...")
try:
    import helix.client as client_module
    print(f"helix.client attributes: {dir(client_module)}")
except ImportError as e:
    print(f"No helix.client: {e}")

try:
    from helix import client as client_module2
    print(f"client module attributes: {dir(client_module2)}")
except ImportError as e:
    print(f"No client module: {e}")