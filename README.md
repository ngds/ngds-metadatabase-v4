# ngds-metadatabase-v4

The National Geothermal Data System (NGDS) supports the storage and search of information resources relevant to the discovery, understanding, and utilization of geothermal energy. It is a network of data providers supplying data and metadata, with an aggregating feature that provides a single entry point for searching resources available through the system

Build for https://test.geothermaldata.org

Requirements
- Postgres 11.1
	gdal
	ltree
-Nodejs 8.11.3 >=
    express
	pg
	csw-client
- Docker
	pyCsw - docker pull geopython/pycsw

##Spatial Components

The mapping and spatial search process utilize:

- leaflet client library 
- ESRI leaflet 
- pyCSW csw search features
- postGIS
- ArcGIS World Map
	
Status

- Basic Harvest functions working in database and application
- Basic search functions 
- CSW-client for harvest
New 1/21/2021
- Batch Editing Functions
- Added Introspection (web crawler) and link validation tools
- Added GeoDeepDive injection







	
	

