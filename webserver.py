import os
import http.server
import socketserver

# Nastavení portu a cílové složky
PORT = 80
DIRECTORY = "./web"

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Inicializace handleru s nastavením kořenové složky pro web
        super().__init__(*args, directory=DIRECTORY, **kwargs)

# Kontrola, zda složka vůbec existuje, aby program nespadl
if not os.path.exists(DIRECTORY):
    print(False, f"Chyba: Složka '{DIRECTORY}' neexistuje! Vytvoř ji prosím.")
    exit(1)

# Povolení opětovného použití portu (předchází chybě 'Address already in use')
socketserver.TCPServer.allow_reuse_address = True

print(f"Spouštím server pro složku '{DIRECTORY}'...")
print(f"Dostupný na: http://localhost:{PORT} nebo na tvé lokální IP adrese.")

try:
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHttpRequestHandler) as httpd:
        httpd.serve_forever()
except PermissionError:
    print("\n[CHYBA] Pro běh na portu 80 potřebuješ administrátorská práva (root/administrator)!")
    print("Zkus program spustit jako Správce (Windows) nebo pomocí 'sudo' (Linux/macOS).")
except KeyboardInterrupt:
    print("\nServer byl úspěšně vypnut.")