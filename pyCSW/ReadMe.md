# ngds-metadatabase-v4 pyCSW 


Installation

docker pull geopython/pycsw

docker run -p 8000:8000 geopython/pycsw

Attach and configure

docker exec -ti --user root <container#> /bin/sh

Install/edit the following files from the config directory:

/etc/pycsw/pycsw.cfg

Edit the pycsw.cfg to include database user/password and allowed_ips # for local host

/usr/lib/python3.5/site-packages/pycsw/plugins/profiles/apiso/apiso.py - Patched lines 389 - 397

Exit and restart the container

Tests





https://github.com/geopython/pycsw


