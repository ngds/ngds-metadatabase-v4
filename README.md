# NGDS-Metadatabase-v4

The National Geothermal Data System (NGDS) supports the storage and search of information resources relevant to the discovery, understanding, and utilization of geothermal energy. It is a network of data providers supplying data and metadata, with an aggregating feature that provides a single entry point for searching resources available through the system

Production build for https://data.geothermaldata.org

##Requirements
- Ubuntu 20.04
- Postgres 12
-Nodejs 8.11.3 	
- Docker
	pyCsw - docker pull geopython/pycsw

Refer to Installation Notes in /docs for requirement details

##Node Applications

4 nodejs applications provide web services

- ngds-app-ssl  - primary user interface
- ngds-app      - http/https redirector
- ngds-pool     - database middle ware for high throughput
- ngds-pysearch - database middle ware for pycsw

## Database

This system  uses 2 postgres databases. 

- geothermal 
- pycsw 

##Docker

The pycsw environment is contained in a docker container and connects to the postgres pycsw database.

##Spatial Components

The mapping and spatial search process utilize:

- leaflet client library 
- ESRI leaflet 
- pyCSW csw search features
- postGIS
- ArcGIS World Map

##Updates

- Endpoint Ingestion API Call










	
	

