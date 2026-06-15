import os
import time
import json
import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

CACHE_FILE = 'releases_cache.json'
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(FEED_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        entries = root.findall('atom:entry', ns)
        
        all_parsed_items = []
        
        for entry in entries:
            date_str = entry.find('atom:title', ns).text
            updated_str = entry.find('atom:updated', ns).text
            
            link_el = entry.find('atom:link', ns)
            link_str = link_el.attrib.get('href') if link_el is not None else ""
            
            content_el = entry.find('atom:content', ns)
            
            if content_el is not None and content_el.text:
                soup = BeautifulSoup(content_el.text, 'html.parser')
                
                current_type = None
                current_html_parts = []
                
                for child in soup.contents:
                    if child.name == 'h3':
                        if current_type and current_html_parts:
                            all_parsed_items.append({
                                'date': date_str,
                                'updated': updated_str,
                                'link': link_str,
                                'type': current_type,
                                'content': "".join(str(c) for c in current_html_parts).strip()
                            })
                        current_type = child.get_text().strip()
                        current_html_parts = []
                    elif child.name is not None:
                        current_html_parts.append(child)
                    elif isinstance(child, str) and child.strip():
                        current_html_parts.append(child)
                
                # Add the last item
                if current_type and current_html_parts:
                    all_parsed_items.append({
                        'date': date_str,
                        'updated': updated_str,
                        'link': link_str,
                        'type': current_type,
                        'content': "".join(str(c) for c in current_html_parts).strip()
                    })
        
        # Save cache
        cache_data = {
            'timestamp': time.time(),
            'items': all_parsed_items
        }
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
        return all_parsed_items, None
    except Exception as e:
        return None, str(e)

def get_releases(force_refresh=False):
    # Try reading cache
    if not force_refresh and os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            # If cache is less than 1 hour old, use it
            if time.time() - cache_data.get('timestamp', 0) < 3600:
                return cache_data.get('items', []), None
        except Exception:
            pass
            
    # Cache miss or forced refresh
    return fetch_and_parse_feed()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def api_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    items, error = get_releases(force_refresh=force_refresh)
    if error:
        return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'items': items})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
