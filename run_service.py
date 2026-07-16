import os
import subprocess

os.environ["PYTHONUNBUFFERED"] = "1"  # Zajištění okamžitého výstupu do konzole
os.set_handle_inheritable
subprocess.Popen(["python", "webserver.py"], creationflags=subprocess.CREATE_NEW_CONSOLE)
subprocess.Popen(["python", "reciver.py"], creationflags=subprocess.CREATE_NEW_CONSOLE)