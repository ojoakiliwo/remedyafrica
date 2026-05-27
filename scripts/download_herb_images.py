#!/usr/bin/env python3
"""
Download herb images from Wikimedia Commons
Usage: python scripts/download_herb_images.py --csv herbs_all_100_combined.csv --output public/herb-images
"""

import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import argparse
from pathlib import Path
from typing import Optional, Dict, List

# Wikimedia Commons API endpoints
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "RemedyAfricaBot/1.0 (educational herb database project)"


def search_commons(query: str, limit: int = 5) -> List[Dict]:
    """
    Search Wikimedia Commons for images matching the query.
    Returns list of search results with title and snippet.
    """
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srnamespace": 6,  # File namespace
        "srlimit": limit,
        "format": "json",
        "origin": "*"
    }
    
    url = f"{COMMONS_API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("query", {}).get("search", [])
    except Exception as e:
        print(f"  ⚠️  Search failed for '{query}': {e}")
        return []


def get_image_info(filename: str) -> Optional[Dict]:
    """
    Get full image URL and metadata for a Commons file.
    """
    params = {
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "format": "json",
        "origin": "*"
    }
    
    url = f"{COMMONS_API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            
            for page_id, page in pages.items():
                if "imageinfo" in page:
                    info = page["imageinfo"][0]
                    metadata = info.get("extmetadata", {})
                    
                    return {
                        "url": info.get("url"),
                        "descriptionurl": info.get("descriptionurl"),
                        "width": info.get("width"),
                        "height": info.get("height"),
                        "mime": info.get("mime"),
                        "license": metadata.get("License", {}).get("value", "Unknown"),
                        "license_short": metadata.get("LicenseShortName", {}).get("value", "Unknown"),
                        "artist": metadata.get("Artist", {}).get("value", "Unknown"),
                        "credit": metadata.get("Credit", {}).get("value", ""),
                    }
    except Exception as e:
        print(f"  ⚠️  Failed to get image info for '{filename}': {e}")
    
    return None


def download_image(url: str, output_path: Path) -> bool:
    """
    Download an image from URL to local path.
    """
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f"  ⚠️  Download failed: {e}")
        return False


def sanitize_filename(name: str) -> str:
    """
    Create a safe filename from herb name.
    """
    # Replace spaces with hyphens, remove special chars
    safe = "".join(c if c.isalnum() or c in " -_" else "-" for c in name)
    safe = safe.strip().replace(" ", "-").lower()
    safe = "-".join(filter(None, safe.split("-")))  # Remove double hyphens
    return safe[:100]  # Limit length


def main():
    parser = argparse.ArgumentParser(description="Download herb images from Wikimedia Commons")
    parser.add_argument("--csv", required=True, help="Path to herbs CSV file")
    parser.add_argument("--output", default="public/herb-images", help="Output directory for images")
    parser.add_argument("--max", type=int, default=0, help="Max herbs to process (0 = all)")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between requests (seconds)")
    parser.add_argument("--skip-existing", action="store_true", help="Skip if image already exists")
    parser.add_argument("--min-width", type=int, default=400, help="Minimum image width")
    args = parser.parse_args()
    
    csv_path = Path(args.csv)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Attribution log
    attribution_file = output_dir / "attribution.json"
    attributions = {}
    if attribution_file.exists():
        with open(attribution_file, "r", encoding="utf-8") as f:
            attributions = json.load(f)
    
    # Read CSV
    herbs = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            herbs.append(row)
    
    if args.max > 0:
        herbs = herbs[:args.max]
    
    print(f"🌿 Processing {len(herbs)} herbs...")
    print(f"📁 Output: {output_dir.absolute()}")
    print(f"⏱️  Delay: {args.delay}s between requests")
    print("-" * 60)
    
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    for i, herb in enumerate(herbs, 1):
        name = herb.get("name", "").strip()
        scientific_name = herb.get("scientificName", "").strip()
        
        if not scientific_name:
            print(f"[{i}/{len(herbs)}] ⏭️  Skipping '{name}' — no scientific name")
            continue
        
        # Create safe filename
        safe_name = sanitize_filename(name)
        output_path = output_dir / f"{safe_name}.jpg"
        
        # Check if already exists
        if args.skip_existing and output_path.exists():
            print(f"[{i}/{len(herbs)}] ⏭️  Skipping '{name}' — already exists")
            skip_count += 1
            continue
        
        print(f"[{i}/{len(herbs)}] 🔍 Searching: {scientific_name}")
        
        # Search strategy: try scientific name first, then common name
        search_queries = [
            f'"{scientific_name}"',  # Exact scientific name
            scientific_name,          # Loose scientific name
            f"{name} herb plant",     # Common name + context
        ]
        
        image_info = None
        for query in search_queries:
            results = search_commons(query, limit=3)
            
            for result in results:
                filename = result["title"].replace("File:", "")
                
                # Skip diagrams, maps, and non-photo files
                lower_name = filename.lower()
                skip_keywords = ["diagram", "map", "chart", "illustration", "drawing", "icon", "logo"]
                if any(kw in lower_name for kw in skip_keywords):
                    continue
                
                info = get_image_info(filename)
                if info and info.get("url"):
                    # Check minimum size
                    if info.get("width", 0) >= args.min_width:
                        image_info = info
                        print(f"  ✅ Found: {filename} ({info['width']}x{info['height']})")
                        break
            
            if image_info:
                break
            
            time.sleep(0.5)  # Brief pause between search queries
        
        if not image_info:
            print(f"  ❌ No suitable image found for '{scientific_name}'")
            fail_count += 1
            time.sleep(args.delay)
            continue
        
        # Download the image
        print(f"  ⬇️  Downloading...")
        if download_image(image_info["url"], output_path):
            # Save attribution
            attributions[safe_name] = {
                "herb_name": name,
                "scientific_name": scientific_name,
                "filename": f"{safe_name}.jpg",
                "source_url": image_info.get("descriptionurl", ""),
                "image_url": image_info.get("url", ""),
                "license": image_info.get("license_short", "Unknown"),
                "artist": image_info.get("artist", "Unknown"),
                "credit": image_info.get("credit", ""),
            }
            
            # Save attribution after each success
            with open(attribution_file, "w", encoding="utf-8") as f:
                json.dump(attributions, f, indent=2, ensure_ascii=False)
            
            print(f"  💾 Saved: {output_path.name}")
            success_count += 1
        else:
            fail_count += 1
        
        time.sleep(args.delay)
    
    print("-" * 60)
    print(f"✅ Complete! Success: {success_count}, Skipped: {skip_count}, Failed: {fail_count}")
    print(f"📄 Attribution log: {attribution_file}")
    print(f"\nNext steps:")
    print(f"  1. Review images in: {output_dir}")
    print(f"  2. Upload to Firebase Storage via admin panel")
    print(f"  3. Or copy to public/ folder for static serving")


if __name__ == "__main__":
    main()