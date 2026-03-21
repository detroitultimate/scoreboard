import os
import base64
import re

def bundle():
    # File paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(base_dir, 'index.html')
    styles_path = os.path.join(base_dir, 'styles.css')
    app_path = os.path.join(base_dir, 'app.js')
    logo_path = os.path.join(base_dir, 'dufl-header.jpg')
    output_path = os.path.join(base_dir, 'dufl_portable.html')

    print("Bundling DUFL App into a single file...")

    # Read index.html
    with open(index_path, 'r') as f:
        html = f.read()

    # Inline CSS
    with open(styles_path, 'r') as f:
        css = f.read()
    html = re.sub(r'<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>', html)

    # Inline JS
    with open(app_path, 'r') as f:
        js = f.read()
    html = re.sub(r'<script src="app.js"></script>', f'<script>\n{js}\n</script>', html)

    # Inline Logo
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            logo_data = base64.b64encode(f.read()).decode('utf-8')
        html = html.replace('src="dufl-header.jpg"', f'src="data:image/jpeg;base64,{logo_data}"')

    # Remove PWA specific meta/links that won't work in a single file
    html = re.sub(r'<link rel="manifest" href="manifest.json">', '', html)
    
    # Note: Service worker registration in app.js might still try to run, 
    # but it will fail gracefully in a local file or single-file deployment.

    # Write output
    with open(output_path, 'w') as f:
        f.write(html)

    print(f"Success! Portable version created: {output_path}")

if __name__ == "__main__":
    bundle()
