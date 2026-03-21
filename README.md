# DUFL Ultimate Frisbee Sideline App

A professional Ultimate Frisbee sideline application designed for iPad, featuring scoreboards, ABBA gender matching, and stats tracking. This app helps manage Ultimate Frisbee games with a clean, modern interface optimized for touch devices.

## Features

- **Scoreboard Management**: Track scores, timeouts, and game clock
- **ABBA Gender Matching**: Automatic gender ratio balancing for fair play
- **Stats Tracking**: Record player statistics and game events
- **PWA Support**: Installable as a Progressive Web App on iPad
- **Offline Capability**: Works offline with service worker caching
- **Portable Version**: Single-file HTML version for easy sharing
- **Local Server**: Built-in development server for testing

## File Structure

```
DUFL/
├── index.html              # Main HTML file with app structure
├── styles.css              # CSS styles for the application
├── app.js                  # JavaScript logic for app functionality
├── manifest.json           # PWA manifest for installation
├── sw.js                   # Service worker for offline functionality
├── icons/                  # PWA icons
│   ├── icon-192.png
│   └── icon-512.png
├── bundle.py               # Python script to create portable version
├── server.py               # Python script to run local development server
├── dufl_portable.html      # Bundled single-file version (final outcome)
└── README.md               # This file
```

## Usage

### Running Locally

1. **Start the local server**:
   ```bash
   python server.py
   ```

2. **Access the app**:
   - On your Mac: Open `http://localhost:8000` in your browser
   - On mobile devices: Use the IP address shown in the terminal output (ensure same Wi-Fi network)

### Creating Portable Version

The `bundle.py` script integrates all the site's contents (HTML, CSS, JS, and images) into a single `dufl_portable.html` file for easy distribution.

1. **Run the bundler**:
   ```bash
   python bundle.py
   ```

2. **Result**: `dufl_portable.html` is created, containing all assets inlined.

### Installing as PWA

1. Open the app in Safari on iPad
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will be available as a native-like experience

## Requirements

- Python 3.x (for running `bundle.py` and `server.py`)
- Modern web browser with PWA support (Safari, Chrome)
- iPad recommended for optimal experience

## Development

- Edit `index.html` for structure changes
- Modify `styles.css` for styling
- Update `app.js` for functionality
- Run `server.py` for live testing
- Use `bundle.py` to create distributable version

## License

[Add license information here]