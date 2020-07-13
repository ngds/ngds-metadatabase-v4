--
-- PostgreSQL database dump
--

-- Dumped from database version 12.2 (Ubuntu 12.2-4)
-- Dumped by pg_dump version 12.2 (Ubuntu 12.2-4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ltree; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;


--
-- Name: EXTENSION ltree; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: postgres_fdw; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgres_fdw WITH SCHEMA public;


--
-- Name: EXTENSION postgres_fdw; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgres_fdw IS 'foreign-data wrapper for remote PostgreSQL servers';


--
-- Name: tablefunc; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;


--
-- Name: EXTENSION tablefunc; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION tablefunc IS 'functions that manipulate whole tables, including crosstab';


--
-- Name: colvid; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.colvid AS (
	vid bigint
);


ALTER TYPE public.colvid OWNER TO ngdsdb;

--
-- Name: linkrecord; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.linkrecord AS (
	lname text,
	ldesc text,
	proto text,
	linkurl text
);


ALTER TYPE public.linkrecord OWNER TO ngdsdb;

--
-- Name: maprecord; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.maprecord AS (
	node_id bigint,
	vers bigint,
	p bigint,
	node_name text,
	node_value text,
	fed_elem text,
	map_path text
);


ALTER TYPE public.maprecord OWNER TO ngdsdb;

--
-- Name: mdnbrow; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.mdnbrow AS (
	i bigint,
	ver integer,
	p bigint,
	n text,
	ntype text,
	nval text
);


ALTER TYPE public.mdnbrow OWNER TO ngdsdb;

--
-- Name: mdnorow; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.mdnorow AS (
	i bigint,
	ver integer,
	p bigint,
	n text,
	ntype text,
	nval text,
	mpath text
);


ALTER TYPE public.mdnorow OWNER TO ngdsdb;

--
-- Name: mdnrow; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.mdnrow AS (
	i bigint,
	ver integer,
	p bigint,
	l integer,
	n text,
	pref text,
	jtype text,
	val json
);


ALTER TYPE public.mdnrow OWNER TO ngdsdb;

--
-- Name: schema_def_row; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.schema_def_row AS (
	i bigint,
	schem integer,
	p bigint,
	l integer,
	n text,
	stype text,
	prefix text,
	dtype text,
	val json
);


ALTER TYPE public.schema_def_row OWNER TO ngdsdb;

--
-- Name: scorow; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.scorow AS (
	i bigint,
	ver integer,
	p bigint,
	n text,
	ntype text,
	nval text,
	mpath text,
	rsid integer,
	spath text
);


ALTER TYPE public.scorow OWNER TO ngdsdb;

--
-- Name: viewrecord; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.viewrecord AS (
	node_id bigint,
	vers bigint,
	p bigint,
	node_name text,
	node_value text,
	lvl integer,
	map_path text
);


ALTER TYPE public.viewrecord OWNER TO ngdsdb;

--
-- Name: clear_collection(bigint, bigint, integer); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.clear_collection(bigint, bigint, integer) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    cid  ALIAS FOR $1;
	vid  ALIAS FOR $2;
	lim  ALIAS FOR $3;
	md   md_record%ROWTYPE;
	mv   md_version%ROWTYPE;
	vn   mdvnode%ROWTYPE;
	
	cr   bigint;
	cv   bigint;
	cn   bigint;
	nt   text;
    guid text;
	pystat text;
	
BEGIN
    nt := 'start-clear-collection';
	if lim = 0 then
		lim = 99999;
	end if;
	 RAISE NOTICE 'started clear collection';
	for md in 
        select * from md_record where dataset_id = cid limit lim
    loop
	    nt := nt||'Rec-'|| md.md_id::text;
		guid := md.guid;
		for mv in 
			select * from md_version where md_id = md.md_id 
		loop
		    nt := nt||' >Vers-' || mv.mdv_id::text || ' '|| mv.version_id::text;
			if vid = 0 OR vid = mv.version_id then
			    delete from mdvnode where version_id = mv.mdv_id;
				delete from md_path where version_id = mv.mdv_id;
				nt := nt||' >Delete Nodes for '|| mv.mdv_id::text;
			end if;
		end loop;
		
		if vid = 0 then
			delete from md_version where md_id = md.md_id;
		else
			delete from md_version where md_id = md.md_id and version_id = vid;
		end if;
		select * into pystat from clear_pycsw_record(guid);
		
		nt := nt||' >Delete versions for '|| md.md_id::text;
		delete from md_record where md_id = md.md_id;
		nt := nt||' >Delete record for '|| md.md_id::text;
		
	end loop;
    nt := '-Success-'||nt;
	return nt;
   
END;
$_$;


ALTER FUNCTION public.clear_collection(bigint, bigint, integer) OWNER TO ngdsdb;

--
-- Name: clear_collection_activity(bigint, bigint, integer); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.clear_collection_activity(bigint, bigint, integer) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    cid  ALIAS FOR $1;
	vid  ALIAS FOR $2;
	lim  ALIAS FOR $3;
	g    text[];
	crs  text;
	castatus text;
BEGIN

	select * into crs from new_collection_activity(bigint,'clear-harvest','now', g);
	castatus := SUBSTRING(crs,1,9);
	if ( castatus = 'complete-') THEN
		select * into crs from clear_collection(bigint,'clear-harvest','now', g);
	    castatus = crs;
	END IF;
	return castatus;
END;
$_$;


ALTER FUNCTION public.clear_collection_activity(bigint, bigint, integer) OWNER TO ngdsdb;

--
-- Name: clear_pycsw_record(text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.clear_pycsw_record(text) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
   guid ALIAS FOR $1;
   pyB boolean;
BEGIN

	select exists (
		select identifier from public.records where identifier = guid
	) into pyB;
	
	if  pyB then
		delete from public.records where identifier = guid;
	end if;
	
	return pyB::text;
END;
$_$;


ALTER FUNCTION public.clear_pycsw_record(text) OWNER TO ngdsdb;

--
-- Name: collection_setpath(bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.collection_setpath(bigint) RETURNS SETOF public.colvid
    LANGUAGE plpgsql
    AS $_$
DECLARE
    collection_id ALIAS FOR $1;
	rd record;
	rc int;
BEGIN
	for rd in 
		select v.mdv_id as vid
		from md_version v, md_record m where m.dataset_id = $1 and
		v.md_id = m.md_id and v.end_date is null and v.mdv_id not in 
		(select distinct version_id from md_path)
		limit 5000
	LOOP
		RETURN next rd;	
		PERFORM mdv_setpath(rd.vid);
	END LOOP;
	return;
END;
$_$;


ALTER FUNCTION public.collection_setpath(bigint) OWNER TO ngdsdb;

--
-- Name: exec_db_collection_activity(bigint, bigint, text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.exec_db_collection_activity(bigint, bigint, text) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    set_id		ALIAS FOR $1;
	caid 		ALIAS FOR $2;
	actype 		ALIAS FOR $3;
	jq   		record; --cap_jobque%ROWTYPE;
	
BEGIN

	update collection_activity set status = 'running' where ca_id = caid;
	
	for jq in 
		select j.pjq_id, j.status, j.created, j.completed,  p.process_call, p.process_params
		from process_definition p, cap_jobque j 
		where  p.pd_id = j.pd_id and j.ca_id = caid
		
	loop
	    RAISE NOTICE 'pr0cess call % % ', jq.pjq_id, jq.process_call;
		
		if jq.status = 'new' then
			update cap_jobque set status = 'running' where pjq_id = jq.pjq_id;
			RAISE NOTICE 'jq % % ', set_id, jq.process_call;
			execute jq.process_call using set_id, 0, 99999;
			update cap_jobque set status = 'complete', completed = current_timestamp  
				where pjq_id = jq.pjq_id;
		end if;
	    
	end loop;
	
	update collection_activity set status = 'complete', end_date = current_timestamp 
		where ca_id = caid;
	return 'ok';
	
END;
$_$;


ALTER FUNCTION public.exec_db_collection_activity(bigint, bigint, text) OWNER TO ngdsdb;

--
-- Name: getmappedobject(text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.getmappedobject(text) RETURNS SETOF public.maprecord
    LANGUAGE sql
    AS $_$
with gmr as (
	select * from getMappedRecord($1)
), chl as (
	select m.node_id as paro, c.* from gmr m, mdvchildren(m.vers,m.node_id) c  where m.node_value = '[]'
), svom as (
	select o.fed_elem, o.relmapath from schema_map m, schema_object_map o where
	    m.map_id = o.map_id and 
		m.schema_id = ( select source_schema_id from md_version where mdv_id = 
			(select distinct(vers) from gmr ))
), chm as (
	select node_id,vers,chl.paro as paro,node_name,node_value,lvl,fed_elem, map_path 
	from chl, svom where map_path similar to relmapath
)				   
select node_id, vers, p, node_name, node_value,fed_elem, map_path 
from gmr
union					   
select node_id, vers,paro,fed_elem, node_value, 'child', map_path 
from chm 
$_$;


ALTER FUNCTION public.getmappedobject(text) OWNER TO ngdsdb;

--
-- Name: getmappedrecord(text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.getmappedrecord(text) RETURNS SETOF public.maprecord
    LANGUAGE sql
    AS $_$
with mvr as (
   select v.md_id, v.mdv_id, source_schema_id 
   from md_record r, md_version v where 
   r.md_id = v.md_id and r.guId = $1 and v.end_date is null
), mdq as (
	select node_id, vers as version_id, 
	p as parent_id, node_name, node_value,  lvl, map_path
	from mdv( ( select mdv_id from mvr)::bigint )
)
select node_id, version_id, parent_id, node_name, node_value, fed_elem, v.map_path
from mdq v, schema_map s, mvr where 
    v.version_id = mvr.mdv_id and 
	v.map_path = s.map_path and
	s.schema_id = mvr.source_schema_id
$_$;


ALTER FUNCTION public.getmappedrecord(text) OWNER TO ngdsdb;

--
-- Name: makemdrecord(text, integer, text, text, integer, json); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.makemdrecord(text, integer, text, text, integer, json) RETURNS json
    LANGUAGE plpgsql
    AS $_$
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
                mdstate :=array_cat(mdstate,ARRAY[r.key::text,r.value::text]);
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
            mdstate :=array_cat(mdstate,ARRAY[r.key::text,r.value::text]);
        end loop;
       
		
	end if;
	mdstatus := '{"status" : "'||mdstatus||'" }';
    
    mdj := json_object(mdstate);
    
    RETURN mdj;

END;
$_$;


ALTER FUNCTION public.makemdrecord(text, integer, text, text, integer, json) OWNER TO ngdsdb;

--
-- Name: makemdversion(integer, integer, json); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.makemdversion(integer, integer, json) RETURNS json
    LANGUAGE plpgsql
    AS $_$
DECLARE

	mv bigint;
    mvi int;
    rc int;
	vid bigint;
	vstatus text;
    mxr mdnrow;
    cdata json;
    vstate text[];
	vr viewrecord;

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
       update md_version set end_date = CURRENT_TIMESTAMP, status = 'archive' where mdv_id = mv;
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
	PERFORM mdv_setpath(mv);
    vstate := array_cat(vstate,ARRAY['nodes',rc::text]);
    cdata := json_object(vstate);
    
    vstatus := vstatus||' node count '||rc::text;
    RETURN cdata;
END;
$_$;


ALTER FUNCTION public.makemdversion(integer, integer, json) OWNER TO ngdsdb;

--
-- Name: makenodej(integer, json); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.makenodej(integer, json) RETURNS SETOF public.mdnrow
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION public.makenodej(integer, json) OWNER TO ngdsdb;

--
-- Name: makeschemadef(text, text, integer, text, bigint, json); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.makeschemadef(text, text, integer, text, bigint, json) RETURNS SETOF public.schema_def_row
    LANGUAGE plpgsql
    AS $_$
DECLARE
    
    sid int;
    vers int;
BEGIN
	    vers := $3;
		insert into schemas (schema_name, format, version, auth_source, create_date, federated_id) 
            values ($1, $2, vers, $4,CURRENT_TIMESTAMP, $5) returning schema_id into sid;
			
		perform makeSchemaDefNodes(sid, $3,'new', $6::json);
			
END;
$_$;


ALTER FUNCTION public.makeschemadef(text, text, integer, text, bigint, json) OWNER TO ngdsdb;

--
-- Name: makeschemadefnodes(integer, integer, text, json); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.makeschemadefnodes(integer, integer, text, json) RETURNS SETOF public.schema_def_row
    LANGUAGE plpgsql
    AS $_$
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

    IF $3 = 'new' THEN
		-- check if dependent md records if overwriting
		
	ELSEIF $3 = 'update' THEN
		-- nothing yet
	END IF;
	
    svid := $2;
	
    FOR sdr IN
		 select * from schema_def_jsontorow($1,0,0,'s',$4::json) order by i,p
	LOOP
        snid := sdr.i;
        pid := sdr.p;
        sdname := sdr.n;
		stype := sdr.stype;
        sdval := '';  
      
        IF sdr.dtype = 'r' OR sdr.stype = 'attribute' or sdr.stype = 'string' THEN
              sdval := sdr.val::text;      
        END IF;

		return NEXT sdr;
        insert into schema_node (node_id, schema_id, version_id, parent_id, node_name, node_datatype, node_def_type, node_prefix, node_val,node_constraint) 
            values (snid, $1, svid, pid, sdname, stype, sdr.dtype, sdr.prefix, sdval, 0);
	END LOOP;
    RETURN;
END;
$_$;


ALTER FUNCTION public.makeschemadefnodes(integer, integer, text, json) OWNER TO ngdsdb;

--
-- Name: md_cursor(bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.md_cursor(bigint) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
nodrow mdvnode%rowtype;
rc integer;
rl integer;
pt integer;
rt text;
findt text;
replt text;
mdo text;
ndname text;
rtype text;
rval text;
parentid bigint;
--ref refcursor;
cx CURSOR FOR SELECT * FROM mdvnode WHERE version_id = 1387 order by parent_id;
BEGIN
rc := 0;
parentid :=0;
--OPEN ref FOR SELECT * FROM mdvnode WHERE version_id = 1387 order by parent_id;
--return ref;
mdo := '{';
OPEN cx;
LOOP
	 FETCH cx INTO nodrow;  
     EXIT WHEN NOT FOUND;	 
	 rc := rc + 1;
	 --rt := rt||nodrow.node_id::text||nodrow.parent_id::text;	
	 rtype := 'e';
    
	if length(nodrow.node_prefix) > 0 then
		ndname := nodrow.node_prefix||':'||nodrow.node_name;
	else
		ndname := nodrow.node_name;
	end if;
		
	 if nodrow.node_value = '{}' then
	 	rtype := 'o';
		rval := '{XX-'||nodrow.node_id::text||'-XX}';	
		rt := '{"'||ndname||'": '||rval||' }';
	 end if;
	 if nodrow.node_value = '[]' then
	 	rtype := 'a';
		rval := '[XA-'||nodrow.node_id::text||'-AX]';
		rt := '{"'||ndname||'": '||rval||' }';
	 end if;
	 if rtype = 'e' then
	 	 rt := '"'||nodrow.node_name||'":'||nodrow.node_value;
	 end if;
	 
	 if nodrow.parent_id > 0 then
	 	findt := 'XX-'||nodrow.parent_id::text||'-XX';
	    pt := position(findt in mdo);
		RAISE NOTICE 'object search(%) %', nodrow.parent_id, pt;
		if pt > 0 then
			replt := findt||rt||',';
			select replace(mdo,findt,replt) into mdo;
		end if;
		findt := 'XA-'||nodrow.parent_id::text||'-AX';
	    pt := position(findt in mdo);
		if pt > 0 then
			replt := findt||'ADDED-'||rt;
			select replace(mdo,findt,replt) into mdo;
		end if;
	 else 
	 	mdo := mdo||rt;
	 end if;
	 
END LOOP;
select REGEXP_REPLACE(mdo,'[XX-]\d[-XX]','founf','g') into mdo;
select REGEXP_REPLACE(mdo,'XA-*-AX','','g') into mdo;
close cx;
mdo := mdo||'}';
return mdo;
END;
$$;


ALTER FUNCTION public.md_cursor(bigint) OWNER TO ngdsdb;

--
-- Name: mdguid_json(text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdguid_json(text) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    vid bigint;
	jt text;
BEGIN 
	select mdv_id into vid from md_version v, md_record m
    	where v.md_id = m.md_id and M.GUID = $1 AND v.end_date is null;
		
	select '{'||string_agg('"'||node_name||'":'||node_value,',')||'}' into jt from mdv(vid);
	return jt;
END;
$_$;


ALTER FUNCTION public.mdguid_json(text) OWNER TO ngdsdb;

--
-- Name: mdn_bag(integer, bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdn_bag(integer, bigint) RETURNS SETOF public.mdnbrow
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION public.mdn_bag(integer, bigint) OWNER TO ngdsdb;

--
-- Name: mdn_find_object(integer, text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdn_find_object(integer, text) RETURNS SETOF public.mdnorow
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION public.mdn_find_object(integer, text) OWNER TO ngdsdb;

--
-- Name: mdn_get_object2(bigint, text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdn_get_object2(bigint, text) RETURNS SETOF public.mdnorow
    LANGUAGE plpgsql
    AS $_$
DECLARE
   
    obid ALIAS FOR $1;
    ptype ALIAS FOR $2;
	ro mdnorow%ROWTYPE;
	rc mdnorow%ROWTYPE;
    relpath text;

BEGIN
    --ptype := pg_typeof($2);
    --RAISE NOTICE 'type (%)', ptype;
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
             --relpath := strpos(ro.mpath, ro.n))::text;
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
                    --rc.mpath := relpath;
                end if;
                return next rc;
            end loop;
        END IF;
    END LOOP;
    return;
END;
$_$;


ALTER FUNCTION public.mdn_get_object2(bigint, text) OWNER TO ngdsdb;

--
-- Name: mdn_jsonout(integer); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdn_jsonout(integer) RETURNS text
    LANGUAGE sql
    AS $_$ 
	select '{'||string_agg('"'||n||'":'||nval,',')||'}' as nb from mdn_bag($1,0);
$_$;


ALTER FUNCTION public.mdn_jsonout(integer) OWNER TO ngdsdb;

--
-- Name: mdn_jtor(integer, bigint, integer, json); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdn_jtor(integer, bigint, integer, json) RETURNS SETOF public.mdnrow
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION public.mdn_jtor(integer, bigint, integer, json) OWNER TO ngdsdb;

--
-- Name: mdn_lookup_object(bigint, text, text, text, text); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdn_lookup_object(bigint, text, text, text, text) RETURNS public.scorow
    LANGUAGE plpgsql
    AS $_$
DECLARE
   
    obid ALIAS FOR $1;
    sp ALIAS FOR $2;
	sv ALIAS FOR $3;
	rp ALIAS FOR $4;
	rn ALIAS FOR $5;
	rv text;
	cmdo CURSOR ( i bigint ) FOR select * from mdn_get_object2(i,'rel');
	md mdnorow%ROWTYPE;
	sc scorow%ROWTYPE;
	lfound boolean;

BEGIN	
	sc.i := 0;
	sv := replace(sv,'"','');			
	lfound := false;
    --RAISE NOTICE 'LO - start lookup time  % % ', sv, clock_timestamp()::text;
	open cmdo(i:=obid);
    LOOP
		fetch cmdo into md;
        exit when not found;
      
		if md.mpath = sp AND replace(md.nval,'"','') = sv then
			lfound := true;
		end if;
	END Loop;
    --close cmdo;
    
	if lfound then
        --RAISE NOTICE 'found % % ', sp, sv;
		move first in cmdo;
        --open cmdo(i:=obid);
		LOOP
			fetch cmdo into md;
			exit when not found;
			if md.mpath = rp then
                --RAISE NOTICE 'LO - cursor loop -  lookup time  % % ', md.mpath, clock_timestamp()::text;
                --RAISE NOTICE 'found lookup % % ',md.i::text, md.mpath;
				sc.i := md.i;
				sc.ver := md.ver;
				sc.p := md.p;
				sc.n := rn;
				sc.ntype := 'typetest';
				sc.nval := clock_timestamp()::text; --md.nval;
				sc.mpath := md.mpath;
				sc.spath := md.mpath;
				rv := md.nval;
                exit;
			end if;
		END Loop;
	end if;
	close cmdo;
	return sc;
		
END;
$_$;


ALTER FUNCTION public.mdn_lookup_object(bigint, text, text, text, text) OWNER TO ngdsdb;

--
-- Name: mdv(bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdv(bigint) RETURNS SETOF public.viewrecord
    LANGUAGE sql
    AS $_$
 WITH RECURSIVE c(node_id, version_id, parent_id, node_name, node_value, lvl, mpath) AS (
         SELECT m.node_id,
            m.vers as version_id,
            m.p as parent_id,
            m.node_name,
            m.node_value,
            1 AS lvl,
            m.node_name AS mpath
           FROM mdvone($1) m
          WHERE m.p = 0
         UNION ALL
         SELECT m.node_id,
            m.vers as version_id,
            m.p as parent_id,
            m.node_name,
            m.node_value,
            c_1.lvl + 1,
            (c_1.mpath || '.'::text) || m.node_name AS mpath
           FROM mdvone($1) m,
            c c_1
          WHERE m.p = c_1.node_id AND 
	 			m.vers = c_1.version_id 
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
$_$;


ALTER FUNCTION public.mdv(bigint) OWNER TO ngdsdb;

--
-- Name: mdv_setpath(bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdv_setpath(bigint) RETURNS SETOF public.viewrecord
    LANGUAGE plpgsql
    AS $_$
DECLARE
    mdversion_id ALIAS FOR $1;
	mdstatus text;
	rd  viewrecord%ROWTYPE;
	rc int;
BEGIN
	mdstatus := 'init';
	rc := 0;
	--select count(*) into rc from md_path where version_id = md_version;
	--if rc > 0 then
	delete from md_path where version_id = mdversion_id;
	mdstatus := 'delete existing';
	FOR rd IN
		select * from mdv(mdversion_id) where node_value not in ('{}','[]')	    
	LOOP 
		RETURN next rd;	
		insert into md_path (node_id, md_path, version_id) values ( rd.node_id, rd.map_path::tsvector, rd.vers );
		rc := rc + 1;
      	
	END LOOP;	
	mdstatus := 'complete added '||rc::text;
	return;
END;
$_$;


ALTER FUNCTION public.mdv_setpath(bigint) OWNER TO ngdsdb;

--
-- Name: mdvchildren(bigint, bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdvchildren(bigint, bigint) RETURNS SETOF public.viewrecord
    LANGUAGE sql
    AS $_$
 WITH RECURSIVE c(node_id, version_id, parent_id, node_name, node_value, lvl, mpath) AS (
         SELECT m.node_id,
            m.vers as version_id,
            m.p as parent_id,
            m.node_name,
            m.node_value,
            1 AS lvl,
            m.node_name AS mpath
           FROM mdvone($1) m
          WHERE m.p = $2
         UNION ALL
         SELECT m.node_id,
            m.vers as version_id,
            m.p as parent_id,
            m.node_name,
            m.node_value,
            c_1.lvl + 1,
            (c_1.mpath || '.'::text) || m.node_name AS mpath
           FROM mdvone($1) m,
            c c_1
          WHERE m.p = c_1.node_id AND 
	 			m.vers = c_1.version_id 
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
$_$;


ALTER FUNCTION public.mdvchildren(bigint, bigint) OWNER TO ngdsdb;

--
-- Name: mdvone(bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.mdvone(bigint) RETURNS SETOF public.viewrecord
    LANGUAGE sql
    AS $_$
    SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            1 AS lvl,
            m.node_name AS mpath
     FROM mdvnode m
     WHERE m.version_id = $1
  ORDER BY version_id, mpath;
$_$;


ALTER FUNCTION public.mdvone(bigint) OWNER TO ngdsdb;

--
-- Name: new_collection_activity(bigint, text, text, text[]); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.new_collection_activity(bigint, text, text, text[]) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
   colset_id ALIAS FOR $1;
   act_id bigint;
   
   act_name ALIAS FOR $2;
   directive ALIAS FOR $3;
   guids ALIAS FOR $4;
   actype text;
   actdate timestamp without time zone;
   i int;
   agent_id bigint;
   status text;
   qmsg text;
   caid bigint;
   
BEGIN

	status := 'begin';
    select ad_id, activity_type, agentid INTO act_id, actype, agent_id
	from activity_definition where activity_name = act_name;
	
	if ( directive = 'schedule' ) then 
	    -- *** Temporary
		actdate := current_timestamp;
	else 
		actdate := current_timestamp;
	end if;
	
	INSERT INTO collection_activity 
		(set_id, ca_type, create_date, activity_id, agent_id, status, version_state, action_date) 
	values
		(colset_id, actype, current_timestamp, act_id, agent_id, 'new',directive, actdate ) 
	returning ca_id into caid;
	status := 'coll-act';
	
	INSERT INTO CAP_JOBQUE
		(pd_id, ca_id, ad_id, jobtype,status, created) 
	select pd_id, caid, act_id, process_type,'new', current_timestamp 
		from process_definition where activity_definition_id = act_id;	
	status := 'jobque';
	
	status := 'complete-'||actype||'-'||caid::text;
	
	if ( actype = 'cap_record' ) then
		foreach i in ARRAY guids
		loop
			INSERT INTO CAP_RECORDS (ca_id, pjq_id, mdv_id,status,guid,modified) values
			(caid, 0,0,'new',guids[i],current_timestamp);
		end loop;
	end if;
	
	if ( directive = 'schedule' ) then 
		status := 'scheduled';
	
	elseif ( directive = 'now' ) then 
		if ( agent_id = 1 ) then
			-- start a node job
			PERFORM pg_notify('jobmsg','newaction-'||status);
		elseif (agent_id = 2 ) then
			-- db job
			RAISE NOTICE 'execute  % % ', colset_id, caid;									 
			PERFORM exec_db_collection_activity(colset_id, caid, actype);
		
		end if;
	else 
	    -- no op test
		status := 'no operational directive';
	end if;
	
	return status;
	
END;
$_$;


ALTER FUNCTION public.new_collection_activity(bigint, text, text, text[]) OWNER TO ngdsdb;

--
-- Name: schema_def_jsontorow(integer, bigint, integer, text, json); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.schema_def_jsontorow(integer, bigint, integer, text, json) RETURNS SETOF public.schema_def_row
    LANGUAGE plpgsql
    AS $_$
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
			--$4||text2ltree(pathfilter(key)) as spath,
			value as val
		from json_each($5::json) 	
	
	LOOP
    
        --pf := SPLIT_PART(sd.n,':',1);
		-- Parse namespace and put in prefix
        
        --sd.prefix := STRPOS(sd.n,':'); 
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
            --refval := sd.val;
           -- refdef := string_to_array(refval,'/');
            --sd.prefix :=  SPLIT_PART(refval,'/',3); --refdef[3];          
            --if refdef[0] = '#' AND refdef[1] = 'definitions' THEN
			--    sd.val := refdef[2];
			--END IF;
            
        END IF;
         
		if sd.n = 'definitions' THEN
			 --sd.stype := 'definit';
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
                --sdd.prefix := sdd.val;
				--sd.stype = 'definition';
                RETURN NEXT sdd;
            END LOOP;
            lev := lev - 1;
			 --refdef := string_to_array(
		ELSE
			RETURN NEXT sd;
		END IF;
					
		
		--	refdef := string_to_array(sd.val,'/');
		--	sd.stype := 'definition';
			--sd.
			/*if refdef[0] = '#' AND refdef[1] = 'definitions' THEN
			
			
			END IF;
			*/
		
		
		
		--END IF;
			
		
   
        IF sd.stype = 'object' then
           pid := sd.i;
           lev := sd.l+1;
           --otp := sd.spath;
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
                    -- (schema_def_jsontorowor).spath, 
                    (schema_def_jsontorow).val from schema_def_jsontorow($1,pid,lev,$4,sd.val::json)  
                ) d
		    LOOP 
                --sdo.dtype := 'sdo';
                
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
                --arrpath = sd.spath::text||'.'||arrcount::text;
                
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
$_$;


ALTER FUNCTION public.schema_def_jsontorow(integer, bigint, integer, text, json) OWNER TO ngdsdb;

--
-- Name: pycsw_fdw; Type: SERVER; Schema: -; Owner: postgres
--

CREATE SERVER pycsw_fdw FOREIGN DATA WRAPPER postgres_fdw OPTIONS (
    dbname 'pycsw',
    host 'localhost'
);


ALTER SERVER pycsw_fdw OWNER TO postgres;

--
-- Name: USER MAPPING ngdsdb SERVER pycsw_fdw; Type: USER MAPPING; Schema: -; Owner: postgres
--

CREATE USER MAPPING FOR ngdsdb SERVER pycsw_fdw OPTIONS (
    password 'pyremA',
    "user" 'py_fdw'
);


--
-- Name: USER MAPPING postgres SERVER pycsw_fdw; Type: USER MAPPING; Schema: -; Owner: postgres
--

CREATE USER MAPPING FOR postgres SERVER pycsw_fdw;


--
-- Name: activity_definition_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.activity_definition_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_definition_id_seq OWNER TO ngdsdb;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_definition; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.activity_definition (
    ad_id integer DEFAULT nextval('public.activity_definition_id_seq'::regclass) NOT NULL,
    activity_name text,
    activity_type text,
    create_date timestamp without time zone,
    userid integer,
    agentid integer,
    activity_description text,
    activity_parameters json
);


ALTER TABLE public.activity_definition OWNER TO ngdsdb;

--
-- Name: agent_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.agent_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agent_id_seq OWNER TO ngdsdb;

--
-- Name: agent; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.agent (
    agent_id bigint DEFAULT nextval('public.agent_id_seq'::regclass) NOT NULL,
    name text NOT NULL,
    role text,
    role_type text,
    created timestamp without time zone,
    state text DEFAULT 'active'::text NOT NULL
);


ALTER TABLE public.agent OWNER TO ngdsdb;

--
-- Name: md_path; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.md_path (
    node_id bigint NOT NULL,
    md_path tsvector,
    version_id bigint
);


ALTER TABLE public.md_path OWNER TO ngdsdb;

--
-- Name: md_record; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.md_record (
    md_id bigint NOT NULL,
    guid text,
    dataset_id bigint,
    citation_id text,
    citation_title text
);


ALTER TABLE public.md_record OWNER TO ngdsdb;

--
-- Name: md_version; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.md_version (
    mdv_id bigint NOT NULL,
    md_id bigint,
    version_id bigint,
    parent_id bigint,
    status text,
    content_url text,
    source_schema_id bigint,
    create_date timestamp without time zone,
    end_date timestamp without time zone
);


ALTER TABLE public.md_version OWNER TO ngdsdb;

--
-- Name: mdvnode; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.mdvnode (
    node_id bigint NOT NULL,
    version_id bigint,
    parent_id bigint,
    node_name text,
    node_value text,
    node_prefix text
);


ALTER TABLE public.mdvnode OWNER TO ngdsdb;

--
-- Name: mdview2; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.mdview2 AS
 SELECT n.node_id,
    n.version_id,
    n.parent_id,
    n.node_name,
    n.node_value,
    1 AS lvl,
    p.md_path AS mpath
   FROM public.mdvnode n,
    public.md_path p
  WHERE (n.node_id = p.node_id);


ALTER TABLE public.mdview2 OWNER TO ngdsdb;

--
-- Name: author_cache; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.author_cache AS
 WITH authpath AS (
         SELECT mdview2.version_id,
            ("substring"((mdview2.mpath)::text, 2, ("position"((mdview2.mpath)::text, 'CI_ResponsibleParty'::text) - 2)) || 'CI_ResponsibleParty.individualName.CharacterString'::text) AS np,
            mdview2.node_value
           FROM public.mdview2
          WHERE (((mdview2.node_name = 'codeListValue'::text) AND (mdview2.node_value ~~ '%author%'::text)) OR ((mdview2.node_name = 'codeListValue'::text) AND (mdview2.node_value ~~ '%originator%'::text)))
        ), mdg AS (
         SELECT r.guid,
            v.mdv_id AS version_id
           FROM public.md_record r,
            public.md_version v
          WHERE (r.md_id = v.md_id)
        ), ap AS (
         SELECT a.version_id,
            m.guid,
            ((''''::text || a.np) || ''''::text) AS npath
           FROM authpath a,
            mdg m
          WHERE (a.version_id = m.version_id)
        ), authlist AS (
         SELECT a.guid,
            m.version_id,
            m.node_value AS author,
            m.mpath AS apath
           FROM public.mdview2 m,
            ap a
          WHERE ((m.version_id = a.version_id) AND ((m.mpath)::text = a.npath))
        )
 SELECT authlist.guid,
    authlist.version_id,
    authlist.author,
    authlist.apath
   FROM authlist
  WITH NO DATA;


ALTER TABLE public.author_cache OWNER TO ngdsdb;

--
-- Name: author_facet; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.author_facet AS
 WITH authpath AS (
         SELECT mdview2.version_id,
            ("substring"((mdview2.mpath)::text, 2, ("position"((mdview2.mpath)::text, 'CI_ResponsibleParty'::text) - 2)) || 'CI_ResponsibleParty.individualName.CharacterString'::text) AS np
           FROM public.mdview2
          WHERE ((mdview2.node_name = 'codeListValue'::text) AND (mdview2.node_value ~~ '%author%'::text))
        ), ap AS (
         SELECT authpath.version_id,
            ((''''::text || authpath.np) || ''''::text) AS npath
           FROM authpath
        ), authlist AS (
         SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            m.lvl,
            m.mpath,
            a.version_id,
            a.npath
           FROM public.mdview2 m,
            ap a
          WHERE ((m.version_id = a.version_id) AND ((m.mpath)::text = a.npath))
        )
 SELECT DISTINCT authlist.node_value,
    count(authlist.node_value) AS count
   FROM authlist authlist(node_id, version_id, parent_id, node_name, node_value, lvl, mpath, version_id_1, npath)
  GROUP BY authlist.node_value
  ORDER BY (count(authlist.node_value)) DESC
 LIMIT 20
  WITH NO DATA;


ALTER TABLE public.author_facet OWNER TO ngdsdb;

--
-- Name: author_register; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.author_register AS
 WITH authpath AS (
         SELECT mdview2.version_id,
            ("substring"((mdview2.mpath)::text, 2, ("position"((mdview2.mpath)::text, 'CI_ResponsibleParty'::text) - 2)) || 'CI_ResponsibleParty.individualName.CharacterString'::text) AS np,
            mdview2.node_value
           FROM public.mdview2
          WHERE ((mdview2.node_name = 'codeListValue'::text) AND (mdview2.node_value ~~ '%author%'::text))
        ), mdg AS (
         SELECT r.guid,
            v.mdv_id AS version_id
           FROM public.md_record r,
            public.md_version v
          WHERE (r.md_id = v.md_id)
        ), ap AS (
         SELECT a.version_id,
            m.guid,
            ((''''::text || a.np) || ''''::text) AS npath
           FROM authpath a,
            mdg m
          WHERE (a.version_id = m.version_id)
        ), authlist AS (
         SELECT a.guid,
            m.version_id,
            m.node_value AS author,
            m.mpath AS apath
           FROM public.mdview2 m,
            ap a
          WHERE ((m.version_id = a.version_id) AND ((m.mpath)::text = a.npath))
        )
 SELECT authlist.guid,
    authlist.version_id,
    authlist.author,
    authlist.apath
   FROM authlist
  WITH NO DATA;


ALTER TABLE public.author_register OWNER TO ngdsdb;

--
-- Name: pjq_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.pjq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pjq_seq OWNER TO ngdsdb;

--
-- Name: cap_jobque; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.cap_jobque (
    pjq_id bigint DEFAULT nextval('public.pjq_seq'::regclass) NOT NULL,
    pd_id bigint,
    ca_id bigint,
    ad_id bigint,
    jobtype text,
    status text,
    created timestamp without time zone,
    completed timestamp without time zone
);


ALTER TABLE public.cap_jobque OWNER TO ngdsdb;

--
-- Name: cap_req_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.cap_req_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cap_req_id_seq OWNER TO ngdsdb;

--
-- Name: cap_records; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.cap_records (
    cpr_id bigint DEFAULT nextval('public.cap_req_id_seq'::regclass) NOT NULL,
    ca_id bigint,
    pjq_id bigint,
    mdv_id bigint,
    status text,
    guid text,
    modified timestamp without time zone
);


ALTER TABLE public.cap_records OWNER TO ngdsdb;

--
-- Name: cap_records_archive; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.cap_records_archive (
    cpr_id bigint,
    ca_id bigint,
    pjq_id bigint,
    mdv_id bigint,
    status text,
    guid text,
    modified timestamp without time zone
);


ALTER TABLE public.cap_records_archive OWNER TO ngdsdb;

--
-- Name: category_facet; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.category_facet AS
 WITH cur_version AS (
         SELECT md_version.mdv_id
           FROM public.md_version
          WHERE (md_version.end_date IS NULL)
        )
 SELECT DISTINCT lower(mdview2.node_value) AS node_value,
    count(mdview2.node_value) AS count
   FROM public.mdview2,
    cur_version
  WHERE ((cur_version.mdv_id = mdview2.version_id) AND ((mdview2.mpath)::text ~~ '%keyword%'::text))
  GROUP BY mdview2.node_value
  ORDER BY (count(mdview2.node_value)) DESC
 LIMIT 50
  WITH NO DATA;


ALTER TABLE public.category_facet OWNER TO ngdsdb;

--
-- Name: vocab_record_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.vocab_record_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vocab_record_seq OWNER TO ngdsdb;

--
-- Name: vocabulary_record; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.vocabulary_record (
    record_id bigint DEFAULT nextval('public.vocab_record_seq'::regclass) NOT NULL,
    vc_id integer,
    value text,
    status text,
    name text
);


ALTER TABLE public.vocabulary_record OWNER TO ngdsdb;

--
-- Name: cm_facet; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.cm_facet AS
 WITH cnm AS (
         SELECT (('"usgincm:'::text || vocabulary_record.value) || '"'::text) AS kv,
            vocabulary_record.name AS kd
           FROM public.vocabulary_record
          WHERE ((vocabulary_record.vc_id = 2) AND (vocabulary_record.status = 'active'::text))
        ), mdv AS (
         SELECT mdview2.node_id,
            mdview2.version_id,
            mdview2.parent_id,
            mdview2.node_name,
            mdview2.node_value,
            mdview2.lvl,
            mdview2.mpath
           FROM public.mdview2
          WHERE (((mdview2.mpath)::text ~~ '%keyword%'::text) AND (mdview2.node_value ~~* '%usgincm:%'::text))
        )
 SELECT cnm.kd AS node_value,
    count(mdv.node_value) AS count
   FROM mdv,
    cnm
  WHERE (((mdv.mpath)::text ~~ '%keyword%'::text) AND (mdv.node_value ~~* cnm.kv))
  GROUP BY mdv.node_value, cnm.kd
  ORDER BY (count(mdv.node_value)) DESC;


ALTER TABLE public.cm_facet OWNER TO ngdsdb;

--
-- Name: cm_register; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.cm_register AS
 WITH cnm AS (
         SELECT (('"usgincm:'::text || vocabulary_record.value) || '"'::text) AS kv,
            vocabulary_record.name AS kd
           FROM public.vocabulary_record
          WHERE ((vocabulary_record.vc_id = 2) AND (vocabulary_record.status = 'active'::text))
        ), mdg AS (
         SELECT r.guid,
            v.mdv_id AS version_id
           FROM public.md_record r,
            public.md_version v
          WHERE (r.md_id = v.md_id)
        ), mdv AS (
         SELECT mdg.guid,
            mdview2.version_id,
            mdview2.node_value,
            mdview2.mpath
           FROM public.mdview2,
            mdg
          WHERE ((mdview2.version_id = mdg.version_id) AND ((mdview2.mpath)::text ~~ '%keyword%'::text) AND (mdview2.node_value ~~* '%usgincm:%'::text))
        )
 SELECT mdv.guid,
    mdv.version_id,
    mdv.node_value AS cm,
    mdv.mpath
   FROM mdv
  WITH NO DATA;


ALTER TABLE public.cm_register OWNER TO ngdsdb;

--
-- Name: collection_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.collection_activity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.collection_activity_id_seq OWNER TO ngdsdb;

--
-- Name: collection_activity; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.collection_activity (
    ca_id bigint DEFAULT nextval('public.collection_activity_id_seq'::regclass) NOT NULL,
    set_id bigint,
    ca_type text,
    create_date timestamp without time zone,
    end_date timestamp without time zone,
    activity_id bigint,
    agent_id bigint,
    parent_caid bigint,
    status text,
    version_state text,
    action_date timestamp without time zone
);


ALTER TABLE public.collection_activity OWNER TO ngdsdb;

--
-- Name: collections_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.collections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.collections_id_seq OWNER TO ngdsdb;

--
-- Name: collections; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.collections (
    set_id bigint DEFAULT nextval('public.collections_id_seq'::regclass) NOT NULL,
    set_name text,
    set_type text,
    status text,
    create_date timestamp without time zone,
    end_date timestamp without time zone,
    user_id bigint,
    activity_definition_id bigint,
    source_url text,
    set_description text,
    schema_id bigint,
    url_params json
);


ALTER TABLE public.collections OWNER TO ngdsdb;

--
-- Name: collections_process_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.collections_process_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.collections_process_id_seq OWNER TO ngdsdb;

--
-- Name: dt_register; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.dt_register AS
 WITH md AS (
         SELECT m.guid,
            v.md_id,
            v.mdv_id
           FROM public.md_version v,
            public.md_record m
          WHERE ((m.md_id = v.md_id) AND (v.end_date IS NULL))
        ), mdv AS (
         SELECT z.guid,
            z.version_id,
            z.node_name,
            z.nv,
            "right"(z.nv, 3) AS ext
           FROM ( SELECT a.node_name,
                    btrim(a.node_value, '"'::text) AS nv,
                    m.guid,
                    a.version_id
                   FROM public.mdview2 a,
                    md m
                  WHERE ((a.version_id = m.mdv_id) AND ((a.mpath)::text ~~ '%URL%'::text))) z
          WHERE (length(z.nv) > 1)
        ), cnm AS (
         SELECT vocabulary_record.value AS kv,
            vocabulary_record.name AS kd
           FROM public.vocabulary_record
          WHERE ((vocabulary_record.vc_id = 1) AND (vocabulary_record.status = 'active'::text))
        ), mdc AS (
         SELECT mdv.guid,
            mdv.version_id,
            mdv.nv,
            mdv.ext
           FROM mdv,
            cnm
          WHERE (mdv.ext = lower(cnm.kv))
        ), mde AS (
         SELECT v.guid,
            v.version_id,
            v.nv,
            ('catalog: '::text || split_part(v.nv, '/'::text, 3)) AS ext
           FROM mdv v,
            ( SELECT mdv.guid
                   FROM mdv
                EXCEPT
                 SELECT mdc.guid
                   FROM mdc) g
          WHERE ((v.guid = g.guid) AND (v.nv !~~ '%service=%'::text) AND (v.nv !~~ '%MapServer%'::text))
        ), mvs AS (
         SELECT k.guid,
            k.version_id,
            k.nv,
                CASE
                    WHEN (k.nv ~~ '%wfs%'::text) THEN 'wfs'::text
                    WHEN (k.nv ~~ '%wms%'::text) THEN 'wms'::text
                    WHEN (k.nv ~~ '%MapServer%'::text) THEN 'MapServer'::text
                    ELSE 'other'::text
                END AS ext
           FROM ( SELECT mdv.guid,
                    mdv.version_id,
                    mdv.node_name,
                    mdv.nv,
                    mdv.ext
                   FROM mdv
                  WHERE ((mdv.nv ~~ '%service=%'::text) OR (mdv.nv ~~ '%MapServer%'::text))) k
        ), mvc AS (
         SELECT z.guid,
            z.version_id,
            z.nv,
            'catalog'::text AS ext
           FROM ( SELECT mdv.guid,
                    mdv.version_id,
                    mdv.nv,
                    string_to_array(mdv.nv, '/'::text) AS mc
                   FROM mdv
                  WHERE ((mdv.nv !~~ '%service=%'::text) AND (mdv.nv !~~ '%MapServer%'::text))) z
          WHERE (z.mc[array_length(z.mc, 1)] ~ '^([0-9]+[.]?[0-9]*|[.][0-9]+)$'::text)
        )
 SELECT mdc.guid,
    mdc.version_id,
    mdc.nv,
    mdc.ext
   FROM mdc
UNION
 SELECT mde.guid,
    mde.version_id,
    mde.nv,
    mde.ext
   FROM mde
UNION
 SELECT mvs.guid,
    mvs.version_id,
    mvs.nv,
    mvs.ext
   FROM mvs
  WITH NO DATA;


ALTER TABLE public.dt_register OWNER TO ngdsdb;

--
-- Name: records; Type: FOREIGN TABLE; Schema: public; Owner: ngdsdb
--

CREATE FOREIGN TABLE public.records (
    identifier text NOT NULL,
    typename text NOT NULL,
    schema text NOT NULL,
    mdsource text NOT NULL,
    insert_date text NOT NULL,
    xml text NOT NULL,
    anytext text NOT NULL,
    language text,
    type text,
    title text,
    title_alternate text,
    abstract text,
    keywords text,
    keywordstype text,
    parentidentifier text,
    relation text,
    time_begin text,
    time_end text,
    topicategory text,
    resourcelanguage text,
    creator text,
    publisher text,
    contributor text,
    organization text,
    securityconstraints text,
    accessconstraints text,
    otherconstraints text,
    date text,
    date_revision text,
    date_creation text,
    date_publication text,
    date_modified text,
    format text,
    source text,
    crs text,
    geodescode text,
    denominator text,
    distancevalue text,
    distanceuom text,
    wkt_geometry text,
    servicetype text,
    servicetypeversion text,
    operation text,
    couplingtype text,
    operateson text,
    operatesonidentifier text,
    operatesoname text,
    degree text,
    classification text,
    conditionapplyingtoaccessanduse text,
    lineage text,
    responsiblepartyrole text,
    specificationtitle text,
    specificationdate text,
    specificationdatetype text,
    links text,
    anytext_tsvector tsvector,
    wkb_geometry public.geometry(Geometry,4326)
)
SERVER pycsw_fdw
OPTIONS (
    schema_name 'public',
    table_name 'records'
);


ALTER FOREIGN TABLE public.records OWNER TO ngdsdb;

--
-- Name: res_insp_rid_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.res_insp_rid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.res_insp_rid_seq OWNER TO ngdsdb;

--
-- Name: resource_inspection; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.resource_inspection (
    rid bigint DEFAULT nextval('public.res_insp_rid_seq'::regclass) NOT NULL,
    guid text NOT NULL,
    parentid bigint,
    orig_url text,
    content_type text,
    v_date timestamp without time zone,
    proc_name text,
    url_status text,
    ident_url text,
    http_cont_len bigint,
    http_last_mod timestamp without time zone
);


ALTER TABLE public.resource_inspection OWNER TO ngdsdb;

--
-- Name: resource_links; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.resource_links AS
 WITH baslink AS (
         SELECT x.identifier,
            string_to_array(x.la, ','::text) AS lkz
           FROM ( SELECT records.identifier,
                    unnest(string_to_array(records.links, '^'::text)) AS la
                   FROM public.records) x
        ), flink AS (
         SELECT baslink.identifier,
            array_length(baslink.lkz, 1) AS arl,
            baslink.lkz[1] AS linkdesc,
            baslink.lkz[2] AS lparams,
            baslink.lkz[3] AS ltype,
            baslink.lkz[4] AS lurl
           FROM baslink
          WHERE (array_length(baslink.lkz, 1) = 4)
        ), glink AS (
         SELECT baslink.identifier,
            array_length(baslink.lkz, 1) AS arl,
            baslink.lkz[1] AS linkdesc,
            array_to_string(baslink.lkz[2:(array_length(baslink.lkz, 1) - 2)], ','::text) AS lparams,
            baslink.lkz[(array_length(baslink.lkz, 1) - 1)] AS ltype,
            baslink.lkz[array_length(baslink.lkz, 1)] AS lurl
           FROM baslink
          WHERE (array_length(baslink.lkz, 1) > 4)
        )
 SELECT flink.identifier,
    flink.arl AS alength,
    flink.linkdesc AS ldesc,
    flink.lparams,
    flink.ltype,
    flink.lurl
   FROM flink
UNION
 SELECT glink.identifier,
    glink.arl AS alength,
    glink.linkdesc AS ldesc,
    glink.lparams,
    glink.ltype,
    glink.lurl
   FROM glink;


ALTER TABLE public.resource_links OWNER TO ngdsdb;

--
-- Name: inspection; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.inspection AS
 WITH cv AS (
         SELECT r.guid,
            v.mdv_id AS vid,
            v.source_schema_id AS sid
           FROM public.md_record r,
            public.md_version v
          WHERE ((v.md_id = r.md_id) AND (v.end_date IS NULL))
        ), lkup AS (
         SELECT t.dtype,
            t.url
           FROM ( VALUES ('dataset_uri'::text,'MD_Metadata.dataSetURI.CharacterString'::text), ('identifier'::text,'MD_Metadata.identificationInfo.MD_DataIdentification.citation.CI_Citation.identifier.MD_Identifier.code.CharacterString'::text)) t(dtype, url)
        ), mp AS (
         SELECT z.version_id,
            z.nurl,
            z.mxp,
            lkup.dtype,
            lkup.url
           FROM ( SELECT mdview2.version_id,
                    btrim(mdview2.node_value, '"'::text) AS nurl,
                    btrim((mdview2.mpath)::text, ''''::text) AS mxp
                   FROM public.mdview2) z,
            lkup
          WHERE (z.mxp = lkup.url)
        ), lpv AS (
         SELECT a.guid,
            json_build_array(json_build_object('url', ('http://test.geothermaldata.org/action/dataset?id='::text || a.guid), 'name', 'National Geothermal Data System'), json_build_object('url', a.idx, 'name', 'identifier'), json_build_object('url', a.dsu, 'name', 'dataset_uri')) AS lnka
           FROM ( SELECT z.guid,
                    max(z.idf) AS idx,
                    max(z.dsu) AS dsu
                   FROM ( SELECT cv.guid,
                                CASE
                                    WHEN (mp.dtype = 'identifier'::text) THEN mp.nurl
                                    ELSE NULL::text
                                END AS idf,
                                CASE
                                    WHEN (mp.dtype = 'dataset_uri'::text) THEN mp.nurl
                                    ELSE NULL::text
                                END AS dsu
                           FROM mp,
                            cv
                          WHERE (mp.version_id = cv.vid)
                          ORDER BY cv.guid) z
                  GROUP BY z.guid) a
        ), pyv AS (
         SELECT records.identifier,
            records.title,
            records.abstract,
            records.organization,
            records.date_modified,
            records.date_publication,
            records.source AS dsu,
            date_part('year'::text, (records.date_publication)::timestamp without time zone) AS pubyear
           FROM public.records
          ORDER BY records.date_modified DESC
        ), arv AS (
         SELECT j.guid,
            json_agg(j.aj) AS jsa
           FROM ( SELECT r.identifier AS guid,
                    a.author,
                    json_build_object('name', btrim(a.author, '"'::text)) AS aj
                   FROM (pyv r
                     LEFT JOIN public.author_cache a ON ((r.identifier = a.guid)))) j
          GROUP BY j.guid
        ), rlv AS (
         SELECT l.identifier AS rid,
            json_agg(l.lj) AS rlnks
           FROM ( SELECT l_1.identifier,
                    json_build_object('name', l_1.ldesc, 'type', i.content_type, 'url', l_1.lurl, 'url_status', i.url_status) AS lj
                   FROM (public.resource_links l_1
                     LEFT JOIN public.resource_inspection i ON (((l_1.identifier = i.guid) AND (l_1.lurl = i.orig_url))))) l
          GROUP BY l.identifier
        ), jag AS (
         SELECT pyv.identifier,
            pyv.date_modified,
            pyv.date_publication,
            json_build_object('ngds_id', pyv.identifier, 'title', pyv.title, 'abstract', pyv.abstract, 'year', pyv.pubyear, 'author', arv.jsa, 'organization', pyv.organization, 'links', lpv.lnka, 'files', rlv.rlnks) AS jso
           FROM pyv,
            arv,
            lpv,
            rlv
          WHERE ((pyv.identifier = arv.guid) AND (pyv.identifier = lpv.guid) AND (pyv.identifier = rlv.rid))
        )
 SELECT jag.identifier,
    jag.date_modified,
    jag.date_publication,
    jag.jso
   FROM jag
  WITH NO DATA;


ALTER TABLE public.inspection OWNER TO ngdsdb;

--
-- Name: jseq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.jseq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jseq OWNER TO ngdsdb;

--
-- Name: jz; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.jz
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jz OWNER TO ngdsdb;

--
-- Name: keyword_ta; Type: MATERIALIZED VIEW; Schema: public; Owner: ngdsdb
--

CREATE MATERIALIZED VIEW public.keyword_ta AS
 SELECT DISTINCT y.zex
   FROM ( SELECT z.identifier,
            lower(unnest(string_to_array(z.rex, ';'::text))) AS zex
           FROM ( SELECT records.identifier,
                    lower(unnest(string_to_array(records.keywords, ','::text))) AS rex
                   FROM public.records) z) y
  GROUP BY y.zex
  ORDER BY y.zex
  WITH NO DATA;


ALTER TABLE public.keyword_ta OWNER TO ngdsdb;

--
-- Name: md_curversion; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.md_curversion AS
 WITH cv AS (
         SELECT r.guid,
            v.mdv_id AS vid,
            v.source_schema_id AS schem,
            v.create_date
           FROM public.md_record r,
            public.md_version v
          WHERE ((r.md_id = v.md_id) AND (v.end_date IS NULL))
        )
 SELECT cv.guid,
    cv.schem AS sid,
    m.node_name,
    m.node_value,
    m.mpath
   FROM cv,
    public.mdview2 m
  WHERE (cv.vid = m.version_id);


ALTER TABLE public.md_curversion OWNER TO ngdsdb;

--
-- Name: md_path_archive; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.md_path_archive (
    node_id bigint,
    md_path tsvector,
    version_id bigint
);


ALTER TABLE public.md_path_archive OWNER TO ngdsdb;

--
-- Name: md_record_archive; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.md_record_archive (
    md_id bigint,
    guid text,
    dataset_id bigint,
    citation_id text,
    citation_title text
);


ALTER TABLE public.md_record_archive OWNER TO ngdsdb;

--
-- Name: md_record_md_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.md_record_md_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.md_record_md_id_seq OWNER TO ngdsdb;

--
-- Name: md_record_md_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ngdsdb
--

ALTER SEQUENCE public.md_record_md_id_seq OWNED BY public.md_record.md_id;


--
-- Name: md_version_archive; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.md_version_archive (
    mdv_id bigint,
    md_id bigint,
    version_id bigint,
    parent_id bigint,
    status text,
    content_url text,
    source_schema_id bigint,
    create_date timestamp without time zone,
    end_date timestamp without time zone
);


ALTER TABLE public.md_version_archive OWNER TO ngdsdb;

--
-- Name: md_version_mdv_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.md_version_mdv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.md_version_mdv_id_seq OWNER TO ngdsdb;

--
-- Name: md_version_mdv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ngdsdb
--

ALTER SEQUENCE public.md_version_mdv_id_seq OWNED BY public.md_version.mdv_id;


--
-- Name: mdc_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.mdc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.mdc_id_seq OWNER TO ngdsdb;

--
-- Name: mdview; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.mdview AS
 WITH RECURSIVE c(node_id, version_id, parent_id, node_name, node_value, lvl, mpath) AS (
         SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            1 AS lvl,
            m.node_name AS mpath
           FROM public.mdvnode m
          WHERE (m.parent_id = 0)
        UNION ALL
         SELECT m.node_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_value,
            (c_1.lvl + 1),
            ((c_1.mpath || '.'::text) || m.node_name) AS mpath
           FROM public.mdvnode m,
            c c_1
          WHERE ((m.parent_id = c_1.node_id) AND (m.version_id = c_1.version_id))
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


ALTER TABLE public.mdview OWNER TO ngdsdb;

--
-- Name: mdvnode_archive; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.mdvnode_archive (
    node_id bigint,
    version_id bigint,
    parent_id bigint,
    node_name text,
    node_value text,
    node_prefix text
);


ALTER TABLE public.mdvnode_archive OWNER TO ngdsdb;

--
-- Name: process_definition_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.process_definition_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.process_definition_id_seq OWNER TO ngdsdb;

--
-- Name: process_definition; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.process_definition (
    pd_id bigint DEFAULT nextval('public.process_definition_id_seq'::regclass) NOT NULL,
    process_name text,
    process_type text,
    create_date timestamp without time zone,
    userid integer,
    agentid integer,
    activity_definition_id integer,
    process_order integer,
    process_scope text,
    process_call text,
    process_params json
);


ALTER TABLE public.process_definition OWNER TO ngdsdb;

--
-- Name: process_jobque; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.process_jobque AS
 SELECT a.ad_id,
    a.activity_name,
    a.activity_type,
    ca.ca_id,
    ca.ca_type,
    ca.create_date,
    ca.end_date,
    ca.status AS castatus,
    j.pjq_id,
    j.jobtype,
    j.status AS pjstatus,
    j.created,
    j.completed,
    p.process_order,
    p.process_scope,
    p.process_call,
    p.process_params,
    c.set_id,
    c.schema_id,
    c.source_url,
    c.url_params
   FROM public.activity_definition a,
    public.collection_activity ca,
    public.cap_jobque j,
    public.process_definition p,
    public.collections c
  WHERE ((a.ad_id = ca.activity_id) AND (ca.ca_id = j.ca_id) AND (p.pd_id = j.pd_id) AND (ca.set_id = c.set_id))
  ORDER BY p.process_order;


ALTER TABLE public.process_jobque OWNER TO ngdsdb;

--
-- Name: process_ruleset; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.process_ruleset (
    rs_id bigint NOT NULL,
    process_id bigint,
    ruleset_name text,
    create_date timestamp without time zone,
    userid integer,
    agentid integer
);


ALTER TABLE public.process_ruleset OWNER TO ngdsdb;

--
-- Name: process_ruleset_rs_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.process_ruleset_rs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.process_ruleset_rs_id_seq OWNER TO ngdsdb;

--
-- Name: process_ruleset_rs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ngdsdb
--

ALTER SEQUENCE public.process_ruleset_rs_id_seq OWNED BY public.process_ruleset.rs_id;


--
-- Name: rule_definitions; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.rule_definitions (
    rule_id bigint NOT NULL,
    ruleset_id bigint,
    rule_name text,
    rule_type text,
    rule_operation text,
    search_value text,
    search_path text,
    replace_value text,
    return_path text,
    status text,
    elem_name text
);


ALTER TABLE public.rule_definitions OWNER TO ngdsdb;

--
-- Name: pv_active_ruleset; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.pv_active_ruleset AS
 SELECT p.rs_id AS ruleset_id,
    p.ruleset_name,
    r.rule_id,
    r.rule_name,
    r.rule_type,
    r.elem_name,
    r.rule_operation,
    r.search_value,
    r.search_path,
    r.replace_value,
    r.return_path
   FROM public.process_ruleset p,
    public.rule_definitions r
  WHERE ((p.rs_id = r.ruleset_id) AND (r.status = 'active'::text));


ALTER TABLE public.pv_active_ruleset OWNER TO ngdsdb;

--
-- Name: res_ins_map_rimid_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.res_ins_map_rimid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.res_ins_map_rimid_seq OWNER TO ngdsdb;

--
-- Name: resource_inspect_map; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.resource_inspect_map (
    rimid bigint DEFAULT nextval('public.res_ins_map_rimid_seq'::regclass) NOT NULL,
    proctype text,
    bas_url text,
    sel_path text,
    elem_text text,
    elem_lookup text
);


ALTER TABLE public.resource_inspect_map OWNER TO ngdsdb;

--
-- Name: rule_definitions_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.rule_definitions_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rule_definitions_rule_id_seq OWNER TO ngdsdb;

--
-- Name: rule_definitions_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ngdsdb
--

ALTER SEQUENCE public.rule_definitions_rule_id_seq OWNED BY public.rule_definitions.rule_id;


--
-- Name: schema_map; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.schema_map (
    map_id bigint NOT NULL,
    schema_id bigint,
    fed_elem text,
    map_path text,
    schema_node_id bigint,
    stype text,
    ruleset_id integer
);


ALTER TABLE public.schema_map OWNER TO ngdsdb;

--
-- Name: schema_map_map_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.schema_map_map_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schema_map_map_id_seq OWNER TO ngdsdb;

--
-- Name: schema_map_map_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ngdsdb
--

ALTER SEQUENCE public.schema_map_map_id_seq OWNED BY public.schema_map.map_id;


--
-- Name: schema_map_object_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.schema_map_object_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schema_map_object_id_seq OWNER TO ngdsdb;

--
-- Name: schema_node_node_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.schema_node_node_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schema_node_node_id_seq OWNER TO ngdsdb;

--
-- Name: schema_node; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.schema_node (
    node_id bigint DEFAULT nextval('public.schema_node_node_id_seq'::regclass) NOT NULL,
    schema_id bigint,
    version_id integer,
    parent_id bigint,
    node_name text,
    node_datatype text,
    node_def_type text,
    node_prefix text,
    node_val text,
    node_constraint bigint,
    node_cardinality integer,
    node_dependency text
);


ALTER TABLE public.schema_node OWNER TO ngdsdb;

--
-- Name: schema_object_map; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.schema_object_map (
    moid bigint DEFAULT nextval('public.schema_map_object_id_seq'::regclass) NOT NULL,
    map_id bigint,
    fed_elem text,
    relmapath text,
    omtype text,
    ruleset_id integer
);


ALTER TABLE public.schema_object_map OWNER TO ngdsdb;

--
-- Name: schema_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.schema_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schema_seq OWNER TO ngdsdb;

--
-- Name: schemanodedefview; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.schemanodedefview AS
 WITH RECURSIVE c(node_id, schema_id, version_id, parent_id, node_name, node_val, node_datatype, node_def_type, lvl, mpath) AS (
         SELECT m.node_id,
            m.schema_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_val,
            m.node_datatype,
            m.node_def_type,
            1 AS lvl,
            ''::text AS mpath
           FROM public.schema_node m
          WHERE ((m.parent_id = 0) AND (m.node_def_type = 'd'::text))
        UNION ALL
         SELECT m.node_id,
            m.schema_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_val,
            m.node_datatype,
            m.node_def_type,
            (c_1.lvl + 1),
                CASE
                    WHEN (length(c_1.mpath) = 0) THEN m.node_name
                    ELSE ((c_1.mpath || '.'::text) || m.node_name)
                END AS mpath
           FROM public.schema_node m,
            c c_1
          WHERE ((m.parent_id = c_1.node_id) AND (m.version_id = c_1.version_id) AND (m.node_def_type = 'd'::text))
        )
 SELECT c.node_id,
    c.schema_id,
    c.version_id,
    c.parent_id,
    c.node_name,
    c.node_val,
    c.node_datatype,
    c.node_def_type,
    c.lvl,
    c.mpath
   FROM c
  ORDER BY c.version_id, c.mpath;


ALTER TABLE public.schemanodedefview OWNER TO ngdsdb;

--
-- Name: schemanodesrview; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.schemanodesrview AS
 WITH RECURSIVE c(node_id, schema_id, version_id, parent_id, node_name, node_val, node_datatype, node_def_type, lvl, mpath) AS (
         SELECT m.node_id,
            m.schema_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_val,
            m.node_datatype,
            m.node_def_type,
            1 AS lvl,
            m.node_name AS mpath
           FROM public.schema_node m
          WHERE ((m.parent_id = 0) AND (m.node_def_type = ANY (ARRAY['s'::text, 'r'::text])))
        UNION ALL
         SELECT m.node_id,
            m.schema_id,
            m.version_id,
            m.parent_id,
            m.node_name,
            m.node_val,
            m.node_datatype,
            m.node_def_type,
            (c_1.lvl + 1),
                CASE
                    WHEN (length(c_1.mpath) = 0) THEN m.node_name
                    ELSE
                    CASE
                        WHEN (m.node_name = '$ref'::text) THEN c_1.mpath
                        ELSE ((c_1.mpath || '.'::text) || m.node_name)
                    END
                END AS mpath
           FROM public.schema_node m,
            c c_1
          WHERE ((m.parent_id = c_1.node_id) AND (m.version_id = c_1.version_id) AND (m.node_def_type = ANY (ARRAY['s'::text, 'r'::text])))
        )
 SELECT c.node_id,
    c.schema_id,
    c.version_id,
    c.parent_id,
    c.node_name,
    c.node_val,
    c.node_datatype,
    c.node_def_type,
    c.lvl,
    c.mpath
   FROM c
  ORDER BY c.version_id, c.mpath;


ALTER TABLE public.schemanodesrview OWNER TO ngdsdb;

--
-- Name: schemas; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.schemas (
    schema_id bigint NOT NULL,
    schema_name text NOT NULL,
    format text,
    version text,
    auth_source text,
    create_date timestamp without time zone,
    federated_id bigint,
    status text
);


ALTER TABLE public.schemas OWNER TO ngdsdb;

--
-- Name: schemas_schema_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.schemas_schema_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schemas_schema_id_seq OWNER TO ngdsdb;

--
-- Name: schemas_schema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ngdsdb
--

ALTER SEQUENCE public.schemas_schema_id_seq OWNED BY public.schemas.schema_id;


--
-- Name: scmseq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.scmseq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.scmseq OWNER TO ngdsdb;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: ngdsdb
--

CREATE SEQUENCE public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO ngdsdb;

--
-- Name: users; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.users (
    user_id bigint DEFAULT nextval('public.user_id_seq'::regclass) NOT NULL,
    name text NOT NULL,
    apikey text,
    agent_id bigint,
    created timestamp without time zone,
    password text,
    fullname text,
    email text,
    state text DEFAULT 'active'::text NOT NULL
);


ALTER TABLE public.users OWNER TO ngdsdb;

--
-- Name: vocabulary_collection; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.vocabulary_collection (
    vc_id integer NOT NULL,
    vc_name text,
    vc_type text,
    status text,
    source_url text,
    activity_id bigint
);


ALTER TABLE public.vocabulary_collection OWNER TO ngdsdb;

--
-- Name: md_record md_id; Type: DEFAULT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.md_record ALTER COLUMN md_id SET DEFAULT nextval('public.md_record_md_id_seq'::regclass);


--
-- Name: md_version mdv_id; Type: DEFAULT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.md_version ALTER COLUMN mdv_id SET DEFAULT nextval('public.md_version_mdv_id_seq'::regclass);


--
-- Name: process_ruleset rs_id; Type: DEFAULT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.process_ruleset ALTER COLUMN rs_id SET DEFAULT nextval('public.process_ruleset_rs_id_seq'::regclass);


--
-- Name: rule_definitions rule_id; Type: DEFAULT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.rule_definitions ALTER COLUMN rule_id SET DEFAULT nextval('public.rule_definitions_rule_id_seq'::regclass);


--
-- Name: schema_map map_id; Type: DEFAULT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.schema_map ALTER COLUMN map_id SET DEFAULT nextval('public.schema_map_map_id_seq'::regclass);


--
-- Name: schemas schema_id; Type: DEFAULT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.schemas ALTER COLUMN schema_id SET DEFAULT nextval('public.schemas_schema_id_seq'::regclass);


--
-- Name: activity_definition activity_definition_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.activity_definition
    ADD CONSTRAINT activity_definition_pkey PRIMARY KEY (ad_id);


--
-- Name: agent agent_name_key; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.agent
    ADD CONSTRAINT agent_name_key UNIQUE (name);


--
-- Name: agent agent_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.agent
    ADD CONSTRAINT agent_pkey PRIMARY KEY (agent_id);


--
-- Name: collection_activity ca_id_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.collection_activity
    ADD CONSTRAINT ca_id_pkey PRIMARY KEY (ca_id);


--
-- Name: cap_records cpr_id_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.cap_records
    ADD CONSTRAINT cpr_id_pkey PRIMARY KEY (cpr_id);


--
-- Name: md_record md_record_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.md_record
    ADD CONSTRAINT md_record_pkey PRIMARY KEY (md_id);


--
-- Name: md_version md_version_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.md_version
    ADD CONSTRAINT md_version_pkey PRIMARY KEY (mdv_id);


--
-- Name: mdvnode mdvnode_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.mdvnode
    ADD CONSTRAINT mdvnode_pkey PRIMARY KEY (node_id);


--
-- Name: cap_jobque pjq_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.cap_jobque
    ADD CONSTRAINT pjq_pkey PRIMARY KEY (pjq_id);


--
-- Name: process_definition process_definition_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.process_definition
    ADD CONSTRAINT process_definition_pkey PRIMARY KEY (pd_id);


--
-- Name: process_ruleset process_ruleset_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.process_ruleset
    ADD CONSTRAINT process_ruleset_pkey PRIMARY KEY (rs_id);


--
-- Name: resource_inspection resource_introspection_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.resource_inspection
    ADD CONSTRAINT resource_introspection_pkey PRIMARY KEY (rid);


--
-- Name: rule_definitions rule_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.rule_definitions
    ADD CONSTRAINT rule_definitions_pkey PRIMARY KEY (rule_id);


--
-- Name: schema_map schema_map_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.schema_map
    ADD CONSTRAINT schema_map_pkey PRIMARY KEY (map_id);


--
-- Name: schema_node schema_node_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.schema_node
    ADD CONSTRAINT schema_node_pkey PRIMARY KEY (node_id);


--
-- Name: schema_object_map schema_object_map_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.schema_object_map
    ADD CONSTRAINT schema_object_map_pkey PRIMARY KEY (moid);


--
-- Name: schemas schemas_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.schemas
    ADD CONSTRAINT schemas_pkey PRIMARY KEY (schema_id);


--
-- Name: collections set_id_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT set_id_pkey PRIMARY KEY (set_id);


--
-- Name: users user_name_key; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_name_key UNIQUE (name);


--
-- Name: users user_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- Name: vocabulary_collection vocabulary_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.vocabulary_collection
    ADD CONSTRAINT vocabulary_collection_pkey PRIMARY KEY (vc_id);


--
-- Name: vocabulary_record vocabulary_record_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.vocabulary_record
    ADD CONSTRAINT vocabulary_record_pkey PRIMARY KEY (record_id);


--
-- Name: keyword_ta_zex_idx; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX keyword_ta_zex_idx ON public.keyword_ta USING btree (zex);


--
-- Name: md_nodepath_g_idx; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX md_nodepath_g_idx ON public.md_path USING gist (md_path);


--
-- Name: md_nodepath_idx; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE UNIQUE INDEX md_nodepath_idx ON public.md_path USING btree (node_id);


--
-- Name: md_search_idx; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX md_search_idx ON public.mdvnode USING gin (node_value public.gin_trgm_ops);


--
-- Name: mdnode_idx; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE UNIQUE INDEX mdnode_idx ON public.mdvnode USING btree (node_id);


--
-- Name: FOREIGN SERVER pycsw_fdw; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON FOREIGN SERVER pycsw_fdw TO ngdsdb;


--
-- PostgreSQL database dump complete
--

