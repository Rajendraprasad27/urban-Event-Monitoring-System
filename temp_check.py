import urllib.request, traceback, sys
try:
    r = urllib.request.urlopen("http://127.0.0.1:8000")
    print("STATUS", r.status)
    print(r.read().decode("utf-8"))
except Exception:
    traceback.print_exc()
    sys.exit(1)
