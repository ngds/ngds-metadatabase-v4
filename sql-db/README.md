# ngds-metadatabase-v4 Database Notes
April 9, 2020


Requirements

postgres v11.0 or greater
Extensions
main database - geothermal
- extensions pg_trm,  tablefunc, postgres_fdw, postgis

pycsw database 
- extensions plpythonu, postgis


Metadata Database Description

Metadata Tables - flexible, recursive data structure that allows any metadata tree object to be parsed and unparsed. Provides versioning control.
	
	md_record - top level entity - unique identifer for a record
	md_version - version tracker for each record
	mdvnode - recursive deconstructed data for each record/version
	md_path - includes a derived path definition for each mdvnode endpoint.
	
 Metdata Schema Tables - define the structure of metadata.  Schema definitions are designed so that metadata records can be mapped new schema structures without  changing the originating data.  These schema functions allow admin control over how the metadata record is utilized, without having to modify UI code.

	Schemas - Master table of metadata schemas
	schema_node - is the deconstructed schema 
	schema_map - translates a schema into a federated schema or other schema
	schema_object_map - allows definition of schema objects.
	
Activity & Process Tables - defines the automation controls and log of changes that occur.

	Activity_definition - Master level definition, made up of zero-many processes
	Process Definition - process definition can be external jobs, or zero to many process_rulesets
	Process_ruleset - A PR is a set of rules that that can be applied to a metadata record or set of records
	rule_definitions - defines each rule.  A rule can be different types and acts on a node endpoint or object.  Conditional logic is defined

User, Roles & Access Tables

	Agent - defines the set of system agents and roles
	Users - identifies users and defnines system access level.
	
Data Quality Tables
	resource_inspect_map - Provide the set of inspection rules that can be applied to metadata record sets.
	resource_inspection - The record of resource link inspection that can be the result of header check, rule defined page crawls, or catalog endpoint mapping.
	
Collection Tables

	Collections - user defined groups of metadata records.  A standard 		collection is the set of harvest sources
	collection_activity - relates the collection to a processing job.
	cap_jobque - record of a activity & process executions.
	
	cap_records - is the transaction log of processed records for a job. Identifies specific version changes

User Interface Entities - used primarily for customized typeahead datastores.

	vocbulary_collection
	vocabulary_record

VIEWS 

	cm_facet - content model statistics for UI.
	cv - most current version of metadata records
	
	Views sued in metadata harvesting admin functions
	harvest_job_history -
	harvest_source_hdr -
	
	md_curversion - top level info for current version
	mdview2 - View of metadata with a ts_vector search index for the 
	metadata element json path.
	process_jobque - aggregation of activity, process & collection data that is primarily used for job tracking within the NGDS Server node application.
	resource_links - View of the pycsw.records that is optimized for lookup of resource link objects.
	
	Schema Views - schemas can be imported using standard metadata schema formats - which consist of schema object definition and resource definitions. 
	
	schemacount - provides metadata stats for each schema 
	schemanodedefview - metadata schema object definition view
	schemanodesrview - metadata schema resource definition view.
	
	
Materialized VIEWS - Materialized view provide caching of complex datasets.

	author_cache - same as _register
	author_facet - view of authors with usage stats
	author_register - view of authors by guid
	category_facet - content model facet stats
	cm_register - content model by guid
	dt_register - data type (pdf, txt, etc) by guid
	gislinkupdate - from pycsw.records.links by guid (identifier
	inspection - json object by guid for performant ingestion API call.
	keyword_ta - keyword type ahead datastore

Database functions 

	HARVEST Functions
	
	makeMdRecord - top level metadata record insert
	makeMdVersion - create a new metadata version 
	makeNodeJ - uses jtor and insert data into mdvnode
	mdn_jtor - parses json object into rows
	md_vms(guid, version id) - returns schema mapped metadata for guid.
	mdn_jsonout(version id), mdguid_json(guid) - returns json object in text format of record.
	
	mdv(version_id integer) - returns md table based on metadata version id
	mdv_setpath(version_id integer) - populates the md_path table for a record
	mdv_validate(federated schema_id,target schema id, md version_id) - returns the state of a md record based on schema requirements for each metadata element.
	mdn_bag(md version_id, parent_id) - returns metadata object. non-zero parent id allows return of subset of a md record.
	
	EDIT Functions
	batch_edit_collect (collection_activity_id, process_job_id, collection_id)
		Process batch job
	batch_edit_status( collection_id, col_activity_id, proc_id, status)
		Update batch job status
	batchguidqry(field, qry, guids ) - Return records that match field query
		in the set of guids. 
	batchqry (field, query)- return records that match field query
	
	cleary_pycsw_record(guid) - remove specified pycsw record 
	
	COLLECTION FUNCTIONS
	clear_collection(collection_id,version_id,limit)  - removes records belonging to a collection. deletes from md tables and pycsw tables. 
	clear_collection_activity(collection, version_id, limit) - runs a new clear-harvest' job for a collection.
	new_collection_activity (collection id, activity, directive, guids[]) - sets up a new job (activity/process) to execute on a collection. The job can be immediate, scheduled, executed within database, executed in node server application.
	
	INSPECTION & INGESTION FUNCTIONS
	geturlcheck (guid text, url text)
	crawl_rule_links (rule_id integer)
	inspect_rule_link3 (rule_id integer) - returns the links identified in metadatabase that match the criteria defined in specified rule.
	refresh_resource_link_cache - updates the inspection materialized view.
	
	SCHEMA FUNCTIONS
	makeschemadef - create new schema definition(schema id, version id)
	makeschemadefnodes - populates the schema_nodes tables for a schema based 
	on schema definition.
	schema_def_jsontorow - used by above functions
	schemapv -
	scmap_insert -
	scmap_update
	
	VIEW Functions
	
	mdn_jsonout(version_id) - provides a json object based on the id
	mdn_bag - internal used by jsonout
	
	mdn_get_object() - get each instance (top level) of an object in a record 
	mdn_find_object() - return the full object given its node id
	
