import asyncio
import json
import websockets
import keyboard

connected_clients = set()

async def handler(websocket):
    connected_clients.add(websocket)
    print(f"🔌 Nové připojení! Aktivních klientů: {len(connected_clients)}")
    
    try:
        async for message in websocket:
            # 1. Přeposlání ostatním klientům (např. synchronizace jiné webové klávesnice)
            active_clients = connected_clients.copy()
            for client in active_clients:
                if client != websocket:
                    try:
                        await client.send(message)
                    except websockets.ConnectionClosed:
                        connected_clients.remove(client)

            # 2. Rozlišení stisku a uvolnění klávesy
            try:
                data = json.loads(message)
                event_type = data.get("event")  # "keydown" nebo "keyup"
                key_name = data.get("key")

                if key_name:
                    if event_type == "keydown":
                        keyboard.press(key_name)  # Drží klávesu dole
                        print(f"Držím klávesu: '{key_name}'")
                    elif event_type == "keyup":
                        keyboard.release(key_name)  # Pustí klávesu
                        print(f"Pouštím klávesu: '{key_name}'")
            except Exception as e:
                print(f"Chyba při simulaci klávesy: {e}")

    except websockets.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        print(f"Klient odpojen. Zbývá: {len(connected_clients)}")

async def main():
    async with websockets.serve(handler, "0.0.0.0", 808):
        print("WebSocket server běží na ws://192.168.43.164:808")
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server byl vypnut.")