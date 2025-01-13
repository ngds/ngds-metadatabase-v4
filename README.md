# NGDS-Metadatabase-v4

## AWS Cloud Version

The National Geothermal Data System (NGDS) supports the storage and search of information resources relevant to the discovery, understanding, and utilization of geothermal energy. It is a network of data providers supplying data and metadata, with an aggregating feature that provides a single entry point for searching resources available through the system

Production build for https://data.geothermaldata.org

## Requirements
- AL2023
- Postgres 15.8
- Nodejs v20.18.0 	
- Docker: 25.0.5
- PyCSW: geopython/pycsw:2.4.2
	
Refer to AWS Cloud Migration Installation in /docs for requirement details

## Node Applications

4 nodejs applications provide web services

- ngds-app      - primary user interface
- ngds-pool     - database middle ware for high throughput
- ngds-pysearch - database middle ware for pycsw
- ngds-server-v2 - admin fucntions (run as needed)

## Database

This system  uses 2 postgres databases that are connected with the fdw extension. 

- geothermal 
- pycsw2

## DOCKER

The pycsw environment is contained in a docker container and connects to the postgres pycsw database.
See installation notes for details.

## Spatial Components

The mapping and spatial search process utilize:

- leaflet client library 
- ESRI leaflet 
- pyCSW csw search features
- postGIS - custom version built for current configuration (see notes in doc folder)
- ArcGIS World Map

## Startup Commands

System is configured to restart all services on reboot. In case of errors, the recommended order
is as follows:

1 - sudo service start postgresql

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













	
	

