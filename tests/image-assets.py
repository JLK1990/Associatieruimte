"""Serve the real static files and check every configured image and preview path."""
import functools, http.server, json, pathlib, re, struct, threading, urllib.request
root = pathlib.Path(__file__).resolve().parent.parent
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f'http://127.0.0.1:{server.server_port}/'
def get(path):
    with urllib.request.urlopen(base + path) as response:
        assert response.status == 200
        return response.read(), response.headers.get_content_type()
def size(data):
    assert data[:4] == b'RIFF' and data[8:12] == b'WEBP'
    offset = 12
    while offset + 8 <= len(data):
        tag = data[offset:offset+4]
        n = struct.unpack_from('<I', data, offset+4)[0]
        chunk = data[offset+8:offset+8+n]
        if tag == b'VP8X': return (1+int.from_bytes(chunk[4:7],'little'), 1+int.from_bytes(chunk[7:10],'little'))
        if tag == b'VP8 ': return tuple(v & 0x3fff for v in struct.unpack_from('<HH', chunk, 6))
        if tag == b'VP8L':
            bits = int.from_bytes(chunk[1:5], 'little')
            return (1+(bits&0x3fff),1+((bits>>14)&0x3fff))
        offset += 8+n+(n%2)
    raise AssertionError('Missing image payload')
try:
    config = json.loads(get('questions.json')[0])
    assert len(config['imagePool']) == 20
    assert len({im['id'] for im in config['imagePool']}) == 20
    for im in config['imagePool']:
        data, mime = get(im['src'])
        assert mime == 'image/webp'
        assert size(data) == (1024,1024), im['src']
    preview = get('images/candidates/preview.html')[0].decode()
    paths = re.findall(r'<img src="([^"]+)"', preview)
    assert len(paths) == 20
    for path in paths: get('images/candidates/' + path)
    print('PASS image assets: all 20 configured paths and preview images return HTTP 200, image/webp, 1024x1024')
finally:
    server.shutdown()
    server.server_close()
