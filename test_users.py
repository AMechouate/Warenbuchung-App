#!/usr/bin/env python3
import json
import subprocess
import sys

print("=== Warenbuchung User Test ===\n")
print("Testing different users and passwords...\n")

users = [
    ("admin", "admin123"),
    ("user1", "admin123"),
    ("user2", "admin123")
]

for i, (username, password) in enumerate(users, 1):
    print(f"{i}. Testing {username} user:")
    
    try:
        result = subprocess.run(
            ['curl', '-s', '-X', 'POST', 'http://localhost:5232/api/auth/login',
             '-H', 'Content-Type: application/json',
             '-d', json.dumps({"username": username, "password": password})],
            capture_output=True,
            text=True,
            check=True
        )
        
        data = json.loads(result.stdout)
        
        if 'token' in data:
            print(f"✅ {username} / {password} - SUCCESS")
            locations = data.get('user', {}).get('locations', [])
            if locations:
                print(f"   Locations: {', '.join(locations)}")
            else:
                print("   Locations: none")
        else:
            print(f"❌ {username} / {password} - FAILED (no token)")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ {username} / {password} - FAILED (curl error)")
    except json.JSONDecodeError as e:
        print(f"❌ {username} / {password} - FAILED (invalid response)")
    except Exception as e:
        print(f"❌ {username} / {password} - FAILED ({str(e)})")
    
    print()

print("=== Test Complete ===")
























