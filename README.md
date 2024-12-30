# NGDS-Metadatabase-v4

Hosted on AWS Cloud 
The National Geothermal Data System (NGDS) supports the storage and search of information resources relevant to the discovery, understanding, and utilization of geothermal energy. It is a network of data providers supplying data and metadata, with an aggregating feature that provides a single entry point for searching resources available through the system

Production build for https://data.geothermaldata.org

##Requirements
- Ubuntu AL2023
- Postgres 15.8
-Nodejs v20.18.0 	
Docker: 25.0.5
PyCSW: geopython/pycsw:2.4.2
	
Refer to Installation Notes in /docs for requirement details

##Node Applications

4 nodejs applications provide web services

- ngds-app      - primary user interface
- ngds-pool     - database middle ware for high throughput
- ngds-pysearch - database middle ware for pycsw
- ngds-server-v2 - admin fucntions

## Database

This system  uses 2 postgres databases. 

- geothermal 
- pycsw2


DOCKER

The pycsw environment is contained in a docker container and connects to the postgres pycsw database.

##Spatial Components

The mapping and spatial search process utilize:

- leaflet client library 
- ESRI leaflet 
- pyCSW csw search features
- postGIS
- ArcGIS World Map

Startup Commands

1 - sudo service postgresql start

    Postgres - database includes 2 schemas pycsw and geothermal 
    
2 - sudo docker container start pycsw

    Dockerized version of pycsw - provides standard OGC interface

3 - systemctl start ngds-pg-pool 

    node.js middleware implmentation provides high performance pooling
    to the geothermal database

4 - systemctl start ngds-pysearch

    node.js middleware implmentation provides high perf pooling
    to the pycsw database
 
5 - systemctl start ngds-app

    node.js user interface and api front end













	
	

