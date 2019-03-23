/* Working copy for schema tables and functions 
	TABLES
	schemas - master tables
	schema_node - recursive parsed
	schema_map - maps a schema into the federated application schema
	           - for a schema, allow multiple paths for an element
			 

	VIEWS
	schemaNodeDefView - returns schema definitions for a schema
	schemaNodeSRView - returns the schemas and the references to the Definitions
	

*/

/* API DOC ***********************************************************************

    BUILD SCHEMA
	
    makeSchemaDef(schema_name, format, version, authoritative_source, federated_id, json_object) 
        Top level call for build of new schema
		
    makeSchemaDefNodes(schema_id, version_id, directive (new/update), json) 
		Builds the node table calls schema_def_jsontorow
		
    schema_def_jsontorow (schema_id, parent_id, level, schema_def type , json) 
	    Recursive function that translates json object into setof rows 

	NOTE - schemas need to be mapped into federated schema
	manual operation rite now
	
	the schema lookup can be an endpoint direct, or a process for object/arrays
	schema_map.stype - end, object, array
	schema_map.schema_node_id - allows mapping to schema object. can be empty
	
	
	USING SCHEMAS

	
	mdvalidate - validate record vs schema
	mdtranslate - 
	
	
	OUTPUT SCHEMAS 
	
	Transform and output
	
*/

-- Table: public.schemas
-- DROP TABLE public.schemas;

CREATE TABLE public.schemas
(
    schema_id bigint NOT NULL DEFAULT nextval('schemas_schema_id_seq'::regclass),
    schema_name text COLLATE pg_catalog."default" NOT NULL,
	version int,
    format text COLLATE pg_catalog."default",
    auth_source text COLLATE pg_catalog."default",
    create_date timestamp without time zone,
    federated_id bigint,
    CONSTRAINT schemas_pkey PRIMARY KEY (schema_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.schemas
    OWNER to postgres;
	
	
create sequence schema_node_node_id_seq;

-- DROP TABLE public.schema_node;

-- Table: public.schema_node
-- data_type - object, array, string, attribute
-- def_type - schema, definition, reference
-- node constraint - FK reference to process rules
-- node_cardinality - 0 (not required), 1 - only 1 allowed, 2 - mult

CREATE TABLE public.schema_node
(
    node_id bigint NOT NULL DEFAULT nextval('schema_node_node_id_seq'::regclass),
    schema_id bigint,
	version_id int,
    parent_id bigint,
    node_name text COLLATE pg_catalog."default",
    node_datatype text COLLATE pg_catalog."default",
    node_def_type text,
	node_prefix text,
	node_val text,
    node_constraint bigint,
	node_cardinality int,
    CONSTRAINT schema_node_pkey PRIMARY KEY (node_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.schema_node
    OWNER to postgres;
	
-- Table: public.schema_map
-- DROP TABLE public.schema_map;

CREATE TABLE public.schema_map
(
    map_id bigint NOT NULL DEFAULT nextval('schema_map_map_id_seq'::regclass),
    schema_id bigint,
    fed_elem text COLLATE pg_catalog."default",
    map_path text COLLATE pg_catalog."default",
    schema_node_id bigint,
    stype text COLLATE pg_catalog."default",
    ruleset_id integer,
    CONSTRAINT schema_map_pkey PRIMARY KEY (map_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.schema_map
    OWNER to postgres;
	
/* Views */
create or replace view schemaNodeDefView (node_id, schema_id, version_id, parent_id, node_name, node_val, lvl, mpath) 
 AS
 WITH RECURSIVE c(node_id, schema_id, version_id, parent_id, node_name, node_val, lvl, mpath) AS (
			SELECT node_id, 
                   schema_id,
                   version_id, 
				   parent_id, 
				   node_name, 
				   node_val,
				   1 as lvl,
                   '' as mpath
			FROM  schema_node m	where parent_id = 0 and node_def_type = 'd'
		 UNION ALL
			SELECT 	m.node_id, 
                    m.schema_id, 
					m.version_id, 
					m.parent_id, 
					m.node_name, 
					m.node_val, 
					lvl+1,
                    CASE WHEN LENGTH(c.mpath) = 0 THEN
                        m.node_name
                    ELSE 
                       
					    c.mpath || '.'|| m.node_name
                    END as mpath
			FROM   schema_node m, c
			WHERE m.parent_id = c.node_id and
			      m.version_id = c.version_id  and 
                  m.node_def_type = 'd'
       
	)
	select node_id, schema_id, version_id, parent_id, node_name, node_val, lvl, mpath
    from c order by version_id, mpath;

/* This provides the schema view without definitions but including references */
	
create or replace view schemaNodeSRView (node_id, schema_id, version_id, parent_id, node_name, node_val, lvl, mpath) 
 AS
 WITH RECURSIVE c(node_id, schema_id, version_id, parent_id, node_name, node_val, lvl, mpath) AS (
			SELECT node_id, 
                   schema_id,
                   version_id, 
				   parent_id, 
				   node_name, 
				   node_val,
				   1 as lvl,
                   node_name as mpath
			FROM  schema_node m	where parent_id = 0 and node_def_type in ('s','r')
		 UNION ALL
			SELECT 	m.node_id, 
                    m.schema_id, 
					m.version_id, 
					m.parent_id, 
					m.node_name, 
					m.node_val, 
					lvl+1,
                    CASE WHEN LENGTH(c.mpath) = 0 THEN
                        m.node_name
                    ELSE 
                        CASE WHEN m.node_name = '$ref' THEN
                            c.mpath
                        ELSE
                            c.mpath || '.'|| m.node_name
                        END
                    END as mpath
			FROM   schema_node m, c
			WHERE m.parent_id = c.node_id and
			      m.version_id = c.version_id  and 
                  m.node_def_type in ('s','r')
       
	)
	select node_id, schema_id, version_id, parent_id, node_name, node_val, lvl, mpath
    from c order by version_id, mpath;

create type schema_def_row as ( i bigint, schem int, p bigint, l int, n text, stype text, prefix text, dtype text, val json );
/* 1- schema id, parent id, level, schema def type (s or d)

*/

/* Schema Definition - Top level external API
   Input - $1 - Name, $2 -format, version, authsource, 
   system gen - id create date
   federated - 0  indicates default
   
*/

create or replace function makeSchemaDef(text, text, int, text, bigint, json) RETURNS setof schema_def_row 
AS $$
DECLARE
    
    sid int;
    vers int;
BEGIN
	    vers := $3;
		insert into schemas (schema_name, format, version, auth_source, create_date, federated_id) 
            values ($1, $2, vers, $4,CURRENT_TIMESTAMP, $5) returning schema_id into sid;
			
		perform makeSchemaDefNodes(sid, $3,'new', $6::json);
			
END;
$$ LANGUAGE 'plpgsql' VOLATILE;


/* makeSchemaDefNodes - parse json into rows and insert into schema_node file
   $1 - schema id
   $2  - version id
   $3  - directive, new 
   $3 - json
*/

create or replace function makeSchemaDefNodes(int, int, text, json) RETURNS setof schema_def_row 
AS $$
DECLARE
	sdr schema_def_row%ROWTYPE;
    snid bigint;
    svid int;
    pid bigint;
    sdname text;
    sdval text;
	stype text;
	dtype text;
    
BEGIN

    IF $2 = 'new' THEN
		-- check if dependent md records if overwriting
		
	ELSEIF $2 = 'update' THEN
		-- nothing yet
	END IF;
	
    svid := $2;
	
    FOR sdr IN
		 select * from schema_def_jsontorow($1,$2,0,0,'s', $4::json) order by i,p
	LOOP
        snid := sdr.i;
        pid := sdr.p;
        sdname := sdr.n;
		stype := sdr.stype;
        IF sdr.stype = 'object' then
           sdval := '{}';
        ELSEIF sdr.stype = 'array' then
            sdval := '[]';
        ELSE
            sdval := sdr.val;
        END IF; 
		return NEXT sdr;
        insert into schema_node (node_id, schema_id, parent_id, node_name, node_datatype, node_def_type, node_prefix, node_value) 
            values (snid, svid, pid, sdname, stype, sdr.dtype, sdr.prefix, sdval);
	END LOOP;
    RETURN;
END;
$$ LANGUAGE 'plpgsql' VOLATILE;

create type schema_def_row as ( i bigint, schem int, p bigint, l int, n text, stype text, dtype text, val json );

create or replace function schema_def_jsontorow (int, bigint, int, text, json) RETURNS setof schema_def_row
-- $1-schema id, $2 - parent_id, $3 - level, $4 - schema_def type, $5 - content 
AS $$
DECLARE

	lev int;
	sd   schema_def_row%ROWTYPE;
    sda  schema_def_row%ROWTYPE;
    sdo  schema_def_row%ROWTYPE;
	sdd  schema_def_row%ROWTYPE;
    
    pid bigint;
    arrcount int;
    jav json;
    attrname text;
    r record;
    pf int;
    refval text;
    cname text;
    arrpath text;
    otp text;
    refdef text[];
    defval text;
    
BEGIN
  
	FOR sd IN
		select nextval('SCHEMA_SEQ') as i,
			$1 as schem,
			$2 as p,
			$3 as l,
			key as n, 
			json_typeof(value) as stype, 
            '' as prefix,
			$4 as dtype,	
			value as val
		from json_each($5::json) 	
	
	LOOP
    
		-- Parse namespace and put in prefix    
      
        pf  := STRPOS(sd.n,':'); 
        IF pf > 1  THEN
            sd.prefix := SPLIT_PART(sd.n,':',1);
            sd.n :=  SPLIT_PART(sd.n,':',2);
        END IF;
        
        attrname := LEFT(sd.n,1);
        If attrname = '@' then
            sd.stype := 'attribute';
        END IF;
        
        if sd.n = '$ref' THEN
            sd.dtype := 'r';
                    
        END IF;
         
		if sd.n = 'definitions' THEN	
             sd.dtype := 'd';
             defval := sd.val;
			 RETURN NEXT sd;
             pid := sd.i;
             lev := sd.l+1;
			 FOR sdd in 
                select i, schem, p, l, n, stype, prefix, dtype, val from (
                    select (schema_def_jsontorow).i, 
                    (schema_def_jsontorow).schem, 
                    (schema_def_jsontorow).p,
                    (schema_def_jsontorow).l, 
                    (schema_def_jsontorow).n as n,
                    (schema_def_jsontorow).stype, 
                    (schema_def_jsontorow).prefix, 
                    (schema_def_jsontorow).dtype, 
                    (schema_def_jsontorow).val from schema_def_jsontorow($1,pid,lev,'d',defval::json)  
                ) d
		    LOOP 
                sdd.dtype := 'd';
               
                RETURN NEXT sdd;
            END LOOP;
            lev := lev - 1;
			
		ELSE
			RETURN NEXT sd;
		END IF;

        IF sd.stype = 'object' then
           pid := sd.i;
           lev := sd.l+1;
          
           FOR sdo in 
                select i, schem, p, l, n, stype, prefix, dtype, val from (
                    select (schema_def_jsontorow).i, 
                    (schema_def_jsontorow).schem, 
                    (schema_def_jsontorow).p,
                    (schema_def_jsontorow).l, 
                    (schema_def_jsontorow).n as n,
                    (schema_def_jsontorow).stype, 
                    (schema_def_jsontorow).prefix, 
					(schema_def_jsontorow).dtype, 
                    (schema_def_jsontorow).val from schema_def_jsontorow($1,pid,lev,$4,sd.val::json)  
                ) d
		    LOOP 

                RETURN NEXT sdo;
            END LOOP;
            
            lev := lev - 1;
              
        ELSEIF sd.stype = 'array'  then
            pid := sd.i;
		    lev := sd.l;
			arrcount := 0;
            
            for r in (select * from json_array_elements(sd.val))
			loop
                jav := row_to_json(r);
                arrcount := arrcount+1;
                lev := lev + 1;
                                
                FOR sda in 
					select i, schem, p, l, n, stype, prefix, dtype, val from (
				 		select (schema_def_jsontorow).i, 
						(schema_def_jsontorow).schem, 
						(schema_def_jsontorow).p,
						(schema_def_jsontorow).l, 
						(schema_def_jsontorow).n as n,
						(schema_def_jsontorow).stype, 
                        (schema_def_jsontorow).prefix, 
                        (schema_def_jsontorow).dtype, 
						(schema_def_jsontorow).val from schema_def_jsontorow($1,pid,lev,$4,jav::json)  
				 	) d
				LOOP    
                    IF  sda.l = lev THEN
                        sda.n := arrcount;
                    END IF;                     
					RETURN NEXT sda;
				END LOOP;
                lev := lev - 1;        
           end loop;
           
        ELSE
           pid := sd.i;
        END IF; 
        
    END LOOP;
	RETURN;		 		
END;
$$ LANGUAGE 'plpgsql' VOLATILE;


/* Schema mapped get metdata Operations */
-- $1 - schema id, $1 version id, $2 - federated element name
--create type mdnorow as ( i bigint, ver int, p bigint, n text, ntype text, nval text, mpath text );
--create type scorow as ( i bigint, ver int, p bigint, n text, ntype text, nval text, mpath text, rsid integer );
create type scorow as ( i bigint, ver int, p bigint, n text, ntype text, nval text, mpath text, rsid integer, spath text );


create or replace function smd_find (int, bigint, int, text, json) RETURNS setof scorow
-- $1-schema id, $2 - parent_id, $3 - level, $4 - schema_def type, $5 - content 
AS $$
DECLARE


BEGIN

	RETURN;		 		
END;
$$ LANGUAGE 'plpgsql' VOLATILE;




