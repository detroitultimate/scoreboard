import http.server
import socketserver
import socket

PORT = 8000

def get_local_ip():
    try:
        # Create a dummy socket to find the local IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    # Disable cache for easier testing
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def start_server():
    ip = get_local_ip()
    handler = Handler
    
    # Allow the server to restart immediately without 'Address already in use' errors
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("\n" + "="*50)
        print("DUFL LOCAL TEST SERVER")
        print("="*50)
        print(f"\n1. Make sure your phone is on the SAME Wi-Fi as this Mac.")
        print(f"2. Open Safari or Chrome on your phone.")
        print(f"3. Type this URL into your phone's browser:")
        print(f"\n   http://{ip}:{PORT}")
        print(f"\n   (or locally on this Mac: http://localhost:{PORT})")
        print("\n" + "="*50)
        print("Press Ctrl+C to stop the server.")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    start_server()
