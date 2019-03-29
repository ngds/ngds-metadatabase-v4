/* - NGDS metadata tables and functions
     G. Hudman
	 AZGS 
	 3/12/2019

	 
	TABLES 
	
	md_record - top level entity - unique identifer for a record
	md_version - version tracker for each record
	mdvnode - recursive deconstructed data for each record/version
	
	
	API

	HARVEST Functions
	
	makeMdRecord - top level metadata record insert
	makeMdVersion - create a new metadata version 
	makeNodeJ - uses jtor and insert data into mdvnode
	mdn_jtor - parses json object into rows

	VIEWS  Functions
	
	mdn_jsonout(version_id) - provides a json object based on the id
	mdn_bag - internal used by jsonout
	
	mdn_get_object() - get each instance (top level) of an object in a record 
	mdn_find_object() - return the full object given its node id
	

	VIEWS 
	
	mdview - errors - replaced with mdn_bag, but a view would be useful problem with the treepath - invalid characters
	
*/

	
/* METADATA Tables 
md_record - Master metadata 
md_version - version tracker refer to md_record 
mdvnode - md version recursive

*/

CREATE TABLE public.md_record
(
    md_id bigint NOT NULL DEFAULT nextval('md_record_md_id_seq'::regclass),
    guid text COLLATE pg_catalog."default",
    dataset_id bigint,
    citation_id text COLLATE pg_catalog."default",
    citation_title text COLLATE pg_catalog."default",
    CONSTRAINT md_record_pkey PRIMARY KEY (md_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.md_record
    OWNER to postgres;

CREATE TABLE public.md_version
(
    mdv_id bigint NOT NULL DEFAULT nextval('md_version_mdv_id_seq'::regclass),
    md_id bigint,
    version_id bigint,
    parent_id bigint,
    status text COLLATE pg_catalog."default",
    content_url text COLLATE pg_catalog."default",
    source_schema_id bigint,
    create_date timestamp without time zone,
    end_date timestamp without time zone,
    CONSTRAINT md_version_pkey PRIMARY KEY (mdv_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.md_version
    OWNER to postgres;
	
	
DROP TABLE public.mdvnode;

CREATE TABLE public.mdvnode
(
    node_id bigint NOT NULL,
    version_id bigint,
    parent_id bigint,
    node_name text COLLATE pg_catalog."default",
	node_prefix text COLLATE pg_catalog."default",
    node_value text COLLATE pg_catalog."default",
    CONSTRAINT mdvnode_pkey PRIMARY KEY (node_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.mdvnode
    OWNER to postgres;
		
CREATE UNIQUE INDEX mdnode_idx ON mdvnode (node_id);

-- Build functions ***********************************************************************************

-- makemdrecord
-- $1 - guid, $2 - is dataset id, $3 citation id, $4 - title, $5 is the schema id, $6 record object
-- issues 1 - the title is already in the json somewhere ... why should call process have to find
--        2 - if it exists update info ?
-- 

create or replace function makemdrecord(text, int, text, text, int, json) RETURNS json
AS $$

DECLARE

	md bigint;
	mdstatus text;
	mdebug text;
    mx text;
    mdstate text[];
    mdj json;
    mdvstate json;
    r record;
        
BEGIN
    md := 0;
	mdstatus := 'start';
	mdstate := ARRAY['makeRecord','Init'];
    select into md md_id 
		from md_record 
		where guid = $1;
		
	if md is null then
	   
		insert into md_record (guid, 
			dataset_id, 
			citation_id, 
			citation_title ) 
		values ($1, $2, $3, $4) returning md_id into md;
		mdstatus := 'NewRecordID'||md;
        mdstate := array_cat(mdstate, ARRAY['recordID',md::text]);
        --vstate := array_append(ARRAY['nodes',rc::text]);
		if md is not null then
			select * into mdvstate FROM makemdversion(md::int, $5, $6);
            for r in (select key,value from json_each(mdvstate))
            loop
                mdstate :=array_cat(mdstate,ARRAY[r.key,r.value]);
            end loop;
	    else 
			mdstatus := mdstatus||' Record Insert Error';
            mdstate := array_cat(mdstate,ARRAY['RecordStatus','insert error']);
		end if;
		
	ELSE 
        mx := $6::text;
        
		--mdebug := 'Params: '||md||$5||'length- '||length(mx);
	    select * into mdvstate FROM makemdversion(md::int, $5, $6);
		mdstatus := 'Add Version '||mdstatus;
        
        for r in (select key,value from json_each_text(mdvstate))
        loop
            mdstate :=array_cat(mdstate,ARRAY[r.key,r.value]);
        end loop;
       
		
	end if;
	mdstatus := '{"status" : "'||mdstatus||'" }';
    
    mdj := json_object(mdstate);
    
    RETURN mdj;
END;
$$ LANGUAGE 'plpgsql' VOLATILE;


-- makemdversion 
-- $1 - md_record id
-- $2 - schema_id 
-- $3 - json object

create or replace function makemdversion(int, int, json) RETURNS json
AS $$

DECLARE

	mv bigint;
    mvi int;
    rc int;
	vid bigint;
	vstatus text;
    mxr mdnrow;
    cdata json;
    vstate text[];


BEGIN
    mv  := 0;
	vid := 0;
	vstatus := 'Make Version '||$1||$2;
    vstate := ARRAY['makeVersion','Init'];
    --cdata := {};
    
	select into mv, vid 
        md_version.mdv_id, md_version.version_id
		from md_version 
		where md_id = $1 and version_id = (select max(version_id) from md_version where md_id = $1);
    
    
    if vid is not null then
	   vid := vid + 1;
       vstatus := vstatus||' record exists - add version '||vid::text;

       update md_version set end_date = CURRENT_TIMESTAMP where mdv_id = mv;
    else
        vid := 1;
        vstatus := vstatus||' new record - version '||vid::text;
        
    end if;
	vstate := array_cat(vstate,ARRAY['Version',vid::text]);
    
	insert into md_version (md_id, 
		version_id, 
		parent_id, 
		status, 
		create_date, 
		source_schema_id) 
    values ($1, vid, 0, 'NEW',CURRENT_TIMESTAMP, $2) returning mdv_id into mv;
    
    vstatus := vstatus||' complete '||mv;
    vstate := array_cat(vstate,ARRAY['VersionID',mv::text]);
    
    rc :=0;
    
    mvi := mv::int;
    for mxr in
 
        select * from makeNodeJ(mvi,$3::json)
    LOOP
        rc := rc + 1;
    END LOOP;
    vstate := array_cat(vstate,ARRAY['nodes',rc::text]);
    cdata := json_object(vstate);
    
    vstatus := vstatus||' node count '||rc::text;
    RETURN cdata;
END;

$$ LANGUAGE 'plpgsql' VOLATILE;


-- Insert rows from json $1 is version_id

create or replace function makeNodeJ(int, json) RETURNS setof mdnrow 
AS $$
DECLARE
	rd mdnrow%ROWTYPE;
    mdid bigint;
    mvid bigint;
    pid bigint;
    mdname text;
	pref text;
    mdval text;
    
BEGIN
    mvid := $1;
    FOR rd IN     
		 select * from mdn_jtor($1,0,0, $2::json) order by i,p
	LOOP
        mdid := rd.i;
        pid := rd.p;
        mdname := rd.n;
		pref := rd.pref;
        IF rd.jtype = 'object' then
           mdval := '{}';
        ELSEIF rd.jtype = 'array' then
            mdval := '[]';
        ELSE
            mdval := rd.val;
        END IF; 
		return NEXT rd;
		
        --insert into mdvnode (node_id, version_id, parent_id, node_name, node_value) 
           -- values (mdid, mvid, pid, mdname, mdval);
        insert into mdvnode (node_id, version_id, parent_id, node_prefix, node_name, node_value) 
           values (mdid, mvid, pid, pref, mdname, mdval);			
	END LOOP;
    RETURN;
END;
$$ LANGUAGE 'plpgsql' VOLATILE;


-- create type mdnrow as ( i bigint, ver int, p bigint, l int, n text, jtype text, val json );
create type mdnrow as ( i bigint, ver int, p bigint, l int, n text, pref text, jtype text, val json );

-- converts json object to rows

ccreate or replace function mdn_jtor (int, bigint, int, json) RETURNS setof mdnrow
AS $$
DECLARE

	lev int;
	rd mdnrow%ROWTYPE;
	rda mdnrow%ROWTYPE;
	rdo mdnrow%ROWTYPE;
	pid bigint;
	aid  bigint;
    aopid bigint;
	arrcount int;
    objkey text;
	jt text;
	jk text;
	jv json;
	r record;
	jav json;
	jta text;
	
	pf int;
	attrname text;
	
BEGIN
  
	FOR rd IN
		select nextval('JSEQ') as i,
			$1 as ver,
			$2 as p,
			$3 as l,
			key as n, 
            '' as pref,
			json_typeof(value) as jt, 
			value as val
		from json_each($4::json) 	
	
	LOOP
		jt := rd.jtype;
		jv := rd.val;
		
		pf  := STRPOS(rd.n,':'); 
        IF pf > 1  THEN
            rd.pref := SPLIT_PART(rd.n,':',1);
            rd.n :=  SPLIT_PART(rd.n,':',2);
        END IF;
        
        attrname := LEFT(rd.n,1);
        If attrname = '@' then
            rd.jtype := 'attribute';
        END IF;
		
		IF  rd.n = 'value' THEN
            rd.n := '';
        END IF;
	  
		RETURN NEXT rd;
		
		IF jt = 'array' THEN
		    pid := rd.i;
		    lev := rd.l;
			arrcount := 0;
                    
			for r in (select * from json_array_elements(jv))
			loop 
			    jav := row_to_json(r);
				jta := json_typeof(jav);		   
				arrcount := arrcount+1;
				lev := lev + 1;
				
				FOR rda in 
					select i, ver, p, l, n, pref, jtype, val from (
				 		select (mdn_jtor).i, 
						(mdn_jtor).ver, 
						(mdn_jtor).p,
						(mdn_jtor).l, 
						(mdn_jtor).n as n,
						(mdn_jtor).pref as pref,
						(mdn_jtor).jtype, 
						(mdn_jtor).val from mdn_jtor($1,pid,lev,jav::json)  
				 	) d
				LOOP    
                    IF  rda.l = lev THEN
                        rda.n := arrcount;
                    END IF;                     
					RETURN NEXT rda;
				END LOOP;
                lev := lev - 1;
			end loop;
			
				
		ELSEIF jt = 'object' THEN
		    
             aid := rd.i;
             pid := $2;
		     lev := rd.l+1;
			      
			 FOR rdo in 
			    select i, ver, p, l, n, pref, jtype, val from (
				 select (mdn_jtor).i, 
					(mdn_jtor).ver, 
					(mdn_jtor).p,
					(mdn_jtor).l, 
					(mdn_jtor).n,
					(mdn_jtor).pref,
					(mdn_jtor).jtype, 
					(mdn_jtor).val from mdn_jtor($1,aid,lev,jv::json)  
				 ) d
			 LOOP
			     RETURN NEXT rdo;
			 END LOOP;
             lev := lev - 1;
            
        END IF;
	END LOOP;
	RETURN;
		 		
END;
$$ LANGUAGE 'plpgsql' VOLATILE;


-- Functions that builds a valid json for output

create type mdnbrow as ( i bigint, ver int, p bigint, n text, ntype text, nval text );

-- wrapper - $1 is the version id

create or replace function mdn_jsonout(int) 
returns text AS $$
BEGIN 
	select '{'||string_agg('"'||n||'":'||nval,',')||'}' as nb from mdn_bag($1,0)
END;
$$ LANGUAGE 'plpgsql' VOLATILE;

-- Interal function used by mdn_jsonout
-- Add prefix !

create or replace function mdn_bag (int, bigint) RETURNS setof mdnbrow
AS $$
DECLARE
	rd mdnbrow%ROWTYPE;
	rda mdnbrow%ROWTYPE;
	rdo mdnbrow%ROWTYPE;
	ro text;
    rav text;

BEGIN

	FOR rd IN
		select node_id, version_id, parent_id, 
		node_name, 
		CASE WHEN node_value = '[]' THEN
             'array'
             WHEN node_value = '{}' THEN
             'object'
             ELSE
             ''
        END as ntype,			 
		node_value
		from mdvnode
		where version_id = $1 AND parent_id = $2
		    
	LOOP    	
		IF rd.ntype = 'array' THEN	    
			for rda in 
                select * from mdn_bag($1, rd.i)
		    loop
                rav := rda.nval;
               
                if rav = '' then
                    rav := rav||rda.nval;
                else 
                    rav := rav||','||rda.nval;
                end if;
			end loop;
			
            rd.nval := '['||rav||']';
		END IF;	
		IF rd.ntype = 'object' THEN
			for rdo in 
				select * from mdn_bag($1, rd.i)
		    loop
				
                if rd.nval = '{}' then
                   rd.nval := '"'||rdo.n||'":'||rdo.nval;
                else 
                     rd.nval := rd.nval||',"'||rdo.n||'":'||rdo.nval;
                end if;
			   
			end loop;
            rd.nval := '{'||rd.nval||'}';
		
					
		END IF;

	    RETURN next rd;
	END LOOP;
	
END;
$$ LANGUAGE 'plpgsql' VOLATILE;

-- Sample query
select '{'||string_agg('"'||n||'":'||nval,',')||'}' as nb from mdn_bag(19,0)


-- Used in view script

create function pathfilter(text) RETURNS text
  AS $$
     select replace(replace(replace(replace(replace($1,':','0xC'),'$','0xD'),',','0xM'),'@','0xA'),' ','0xS') $$
  LANGUAGE SQL;
 
-- View script
identificationInfo.MD_DataIdentification.citation.CI_Citation.title.CharacterString

-- version without tree path

CREATE OR REPLACE VIEW public.mdview AS
 WITH RECURSIVE c(node_id, version_id, parent_id, node_name, node_value, lvl, mpath) AS (
         SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            1 AS lvl,
            m.node_name AS mpath
           FROM mdvnode m
          WHERE m.parent_id = 0
        UNION ALL
         SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            c_1.lvl + 1,
            (c_1.mpath || '.'::text) || m.node_name AS mpath
           FROM mdvnode m,
            c c_1
          WHERE m.parent_id = c_1.node_id AND m.version_id = c_1.version_id
        )
 SELECT c.node_id,
    c.version_id,
    c.parent_id,
    c.node_name,
    c.node_value,
    c.lvl,
    c.mpath
   FROM c
  ORDER BY c.version_id, c.mpath;

ALTER TABLE public.mdview
    OWNER TO postgres;
-- OBJECT tools for schema mapping
-- $1 - version id, $2 - objectname
-- returns list of objects

/* Useful queries used in nodeJS application */

-- Return a record with schema mapping

select * from mdview, schema_map where version_id in 
	(select mdv_id from md_version where md_id = 
		(select md_id from md_record where guid = %1 ) and end_date is null) and 
			mdview.mpath = schema_map.map_path and schema_map.schema_id = $2

-- Record search

 select * from md_record where md_id in 
    (select md_id from md_version where mdv_id in 
        (Select distinct(version_id) from mdview where node_value like %$1%))


			

create type mdnorow as ( i bigint, ver int, p bigint, n text, ntype text, nval text, mpath text );


-- find object doesnt use schema mapping
-- $1 version id, $2 - name
create or replace function mdn_find_object (int, text) RETURNS setof mdnorow
AS $$
DECLARE
	rd mdnorow%ROWTYPE;
	
BEGIN

	FOR rd IN
    
		select node_id, version_id, parent_id, 
		node_name, 
		CASE WHEN node_value = '[]' THEN
             'array'
             WHEN node_value = '{}' THEN
             'object'
             ELSE
             ''
        END as ntype,			 
		node_value,
        mpath 
		from mdview
		where version_id = $1 AND node_name = $2
		    
	LOOP    
      	RETURN next rd;		
	END LOOP;	
END;
$$ LANGUAGE 'plpgsql' VOLATILE;	


/* Features below are not in use */

-- find object 2 
create or replace function mdn_find_cursor (refcursor, text) RETURNS setof mdnorow
AS $$
DECLARE
	rd mdnorow%ROWTYPE;
	
BEGIN

	FOR rd IN
    
		select node_id, version_id, parent_id, 
		node_name, 
		CASE WHEN node_value = '[]' THEN
             'array'
             WHEN node_value = '{}' THEN
             'object'
             ELSE
             ''
        END as ntype,			 
		node_value,
        mpath 
		from mdview
		where version_id = $1 AND node_name = $2
		    
	LOOP    
      	RETURN next rd;		
	END LOOP;	
END;
$$ LANGUAGE 'plpgsql' VOLATILE;	

-- mdn_get_object2 overrides mdn_get_object

create or replace function mdn_get_object2 (bigint, text) RETURNS setof mdnorow
AS $$
DECLARE
   
    obid ALIAS FOR $1;
    ptype ALIAS FOR $2;
	ro mdnorow%ROWTYPE;
	rc mdnorow%ROWTYPE;
    relpath text;

BEGIN

    relpath := 'relative';
    FOR ro IN
		select node_id, 
		version_id, 
		parent_id, 
		node_name, 
		CASE WHEN node_value = '[]' THEN
			 'array'
			 WHEN node_value = '{}' THEN
			 'object'
			 ELSE
			 ''
		END as ntype,			 
		node_value,
		mpath 
		from mdview
		where node_id = obid
	LOOP 
       
        if ptype = 'rel' then
             relpath := substr(ro.mpath, strpos(ro.mpath, ro.n) );
            ro.mpath := relpath;
        end if;
        
        RETURN next ro;
        IF ro.ntype = 'object' OR ro.ntype = 'array' THEN
            for rc in
                select i as node_id, 
		            ver as version_id, 
		            p as parent_id, 
		            n as node_name, 
		            CASE WHEN nval = '[]' THEN
			            'array'
	                WHEN nval = '{}' THEN
			            'object'
			        ELSE
			        ''
		            END as ntype,			 
		            nval as node_value,
		            mpath 
                from mdn_get_children(obid)
                
            loop
                if ptype = 'rel' then
                    rc.mpath := substr(rc.mpath, strpos(rc.mpath, relpath ) );
                end if;
                return next rc;
            end loop;
        END IF;
    END LOOP;
    return;
END;
$$ LANGUAGE 'plpgsql' VOLATILE;	

-- oid, mpath, sv, rp 
create or replace function mdn_lookup_object (bigint, text, text, text, text) RETURNS scorow
AS $$
DECLARE
   
    obid ALIAS FOR $1;
    searchpath ALIAS FOR $2;
	searchval ALIAS FOR $3;
	rp ALIAS FOR $4;
	rn ALIAS FOR $5;
	rv text;
	cmdo CURSOR ( i bigint ) FOR select * from mdn_get_object2(i,'rel');
	md mdnorow%ROWTYPE;
	sc scorow%ROWTYPE;
	lfound boolean;

BEGIN	
	sc.i := 0;
				
	lfound := false;
	open cmdo(i:=smd.i);
    LOOP
		fetch cmdo into md;
        exit when not found;
		if md.mpath = sp AND md.nval = sv then
			lfound := true;
		end if;
	END Loop;
	if lfound then
		move first cmdo;
		LOOP
			fetch cmdo into md;
			exit when not found;
			if md.mpath = rp then
				sc.i := md.node_id;
				sc.ver := md.version_id;
				sc.p := md.parent_id;
				sc.n := md.node_name;
				sc.ntype := 'typetest';
				sc.nval := md.node_value;
				sc.mpath := md.mpath;
				sc.spath := md.mpath;
				rv := md.node_value;
			end if;
		END Loop;
	end if;
	close cmdo;
	return
		
END;
$$ LANGUAGE 'plpgsql' VOLATILE;	


create or replace function mdn_get_object (bigint) RETURNS setof mdnorow
AS $$
DECLARE
   
	ro mdnorow%ROWTYPE;
	rc mdnorow%ROWTYPE;

BEGIN

    FOR ro IN
		select node_id, 
		version_id, 
		parent_id, 
		node_name, 
		CASE WHEN node_value = '[]' THEN
			 'array'
			 WHEN node_value = '{}' THEN
			 'object'
			 ELSE
			 ''
		END as ntype,			 
		node_value,
		mpath 
		from mdview
		where node_id = $1	    
	LOOP 
        RETURN next ro;
        IF ro.ntype = 'object' OR ro.ntype = 'array' THEN
            for rc in
                select i as node_id, 
		            ver as version_id, 
		            p as parent_id, 
		            n as node_name, 
		            CASE WHEN nval = '[]' THEN
			            'array'
	                WHEN nval = '{}' THEN
			            'object'
			        ELSE
			        ''
		            END as ntype,			 
		            nval as node_value,
		            mpath 
                from mdn_get_children($1)
                
            loop
                return next rc;
            end loop;
        END IF;
    END LOOP;
    return;
END;
$$ LANGUAGE 'plpgsql' VOLATILE;	



-- get object child elements from $1 node_id
create or replace function mdn_get_children (bigint) RETURNS setof mdnorow
AS $$
DECLARE
   
	rd mdnorow%ROWTYPE;
	rda mdnorow%ROWTYPE;
	rdo mdnorow%ROWTYPE;

	pid bigint;

BEGIN

	pid := $1;
	
	FOR rd IN

		select node_id, 
		version_id, 
		parent_id, 
		node_name, 
		CASE WHEN node_value = '[]' THEN
			 'array'
			 WHEN node_value = '{}' THEN
			 'object'
			 ELSE
			 ''
		END as ntype,			 
		node_value,
		mpath 
		from mdview
		where parent_id = pid
			
		    
	LOOP    
      	RETURN next rd;
		IF rd.ntype = 'array' THEN	    
			for rda in 
                select * from mdn_get_children(rd.i)
		    loop
				RETURN next rda;
			end loop;		
          
		END IF;	
		IF rd.ntype = 'object' THEN
			for rdo in 
				select * from mdn_get_children(rd.i)
		    loop
				return next rdo;
			end loop;
		
		END IF;
		
		
	END LOOP;
	RETURN;
	
END;
$$ LANGUAGE 'plpgsql' VOLATILE;	
	
/* Obsolete mdview uses ltree - which is fussy with special characters */	
CREATE OR REPLACE VIEW public.mdview AS
 WITH RECURSIVE c(node_id, version_id, parent_id, node_name, node_value, lvl, mpath) AS (
         SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            1 AS lvl,
            text2ltree(pathfilter(m.node_name)) AS mpath
           FROM mdvnode m
          WHERE m.parent_id = 0
        UNION ALL
         SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            c_1.lvl + 1,
            c_1.mpath || text2ltree(pathfilter(m.node_name)) AS mpath
           FROM mdvnode m,
            c c_1
          WHERE m.parent_id = c_1.node_id AND m.version_id = c_1.version_id
        )
 SELECT c.node_id,
    c.version_id,
    c.parent_id,
    c.node_name,
    c.node_value,
    c.lvl,
    c.mpath
   FROM c
  ORDER BY c.version_id, c.mpath;

ALTER TABLE public.mdview
    OWNER TO postgres;

