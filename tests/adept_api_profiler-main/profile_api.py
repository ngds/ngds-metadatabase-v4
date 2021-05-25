import requests
import datetime

cont = True
url = "https://xdd.wisc.edu/api/articles?source=NGDS&full_results=true"
docs = []
start = datetime.datetime.now()
while cont:
    resp = requests.get(url)
    data = resp.json()['success']
    docs += data['data']
    url = data['next_page']
    if url == "":
        cont = False
finish = datetime.datetime.now()
print(f"Scrolled through {len(docs)} documents in {finish - start} ({len(docs)/(finish-start).seconds} per second).")
