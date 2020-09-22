--
-- PostgreSQL database dump
--

-- Dumped from database version 12.4 (Ubuntu 12.4-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.3

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
-- Name: plpython3u; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpython3u WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpython3u; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpython3u IS 'PL/Python3U untrusted procedural language';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: frecrow; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.frecrow AS (
	identifier text,
	title text,
	organization text,
	abstract text,
	date_modified text,
	links text
);


ALTER TYPE public.frecrow OWNER TO ngdsdb;

--
-- Name: psfrow; Type: TYPE; Schema: public; Owner: ngdsdb
--

CREATE TYPE public.psfrow AS (
	guid text,
	foundrec bigint,
	citation_title text,
	organization text,
	abstract text,
	create_date text,
	wkt_geometry text,
	links text
);


ALTER TYPE public.psfrow OWNER TO ngdsdb;

--
-- Name: findguids(text, text, bigint, bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.findguids(text, text, bigint, bigint) RETURNS SETOF public.psfrow
    LANGUAGE plpgsql
    AS $_$
DECLARE
	guids ALIAS FOR $1;
	so ALIAS FOR $2;
	lim ALIAS FOR $3;
	ofs ALIAS FOR $4;
	ga text[];
	rd psfrow%ROWTYPE;
	
BEGIN
    ga := string_to_array(guids,',');
	
	FOR rd IN
	    with zib as (
			select unnest(ga) as id
		), bx as (
			select count(id) as foundrec from zib
		)
		select r.identifier, foundrec, r.title, r.organization,
		r.abstract, r.date_modified, r.wkt_geometry, r.links 
		from records r, zib, bx where 
			r.identifier = zib.id
		order by so
		limit lim offset ofs
	LOOP
      	RETURN next rd;		
	END LOOP;	
	return;
END;
$_$;


ALTER FUNCTION public.findguids(text, text, bigint, bigint) OWNER TO ngdsdb;

--
-- Name: findnewrec(bigint, bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.findnewrec(bigint, bigint) RETURNS SETOF public.psfrow
    LANGUAGE plpgsql
    AS $_$
DECLARE
	lim ALIAS FOR $1;
	ofs ALIAS FOR $2;
	rd psfrow%ROWTYPE;
	
BEGIN

	FOR rd IN
	    with bx as (
			select count(*) as foundrec from records
		)
		select identifier, foundrec, title, organization,
		abstract, date_modified, wkt_geometry, links 
		from records, bx 
		order by date_modified desc
		limit lim offset ofs
	LOOP
      	RETURN next rd;		
	END LOOP;	
	return;
END;
$_$;


ALTER FUNCTION public.findnewrec(bigint, bigint) OWNER TO ngdsdb;

--
-- Name: findrec(text, text, bigint, bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.findrec(text, text, bigint, bigint) RETURNS SETOF public.psfrow
    LANGUAGE plpgsql
    AS $_$
DECLARE
	qry ALIAS FOR $1;
	so ALIAS FOR $2;
	lim ALIAS FOR $3;
	ofs ALIAS FOR $4;
	rd psfrow%ROWTYPE;
	
BEGIN
    qry := replace(qry,' ',' & ');
	FOR rd IN
	    with cv as (
			select identifier, title, organization,
			abstract, date_modified, wkt_geometry, links 
			from records 
			where anytext_tsvector @@to_tsquery (qry)
		), bx as (
			select count(identifier) as foundrec from cv
		) 
		select identifier, 
				foundrec, 
				title, 
				organization, 
				abstract,
				date_modified, 
				wkt_geometry, 
				links
				from cv, bx
		order by so
		limit lim offset ofs
	LOOP
      	RETURN next rd;		
	END LOOP;	
	return;
END;
$_$;


ALTER FUNCTION public.findrec(text, text, bigint, bigint) OWNER TO ngdsdb;

--
-- Name: qfind(text, text, bigint, bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.qfind(text, text, bigint, bigint) RETURNS SETOF record
    LANGUAGE plpgsql
    AS $_$
DECLARE
	qry ALIAS FOR $1;
	so ALIAS FOR $2;
	lim ALIAS FOR $3;
	ofs ALIAS FOR $4;
	rd record;
	
BEGIN

	FOR rd IN
		select identifier, title, organization,
		abstract, date_modified, wkt_geometry, links 
		from records 
		where anytext_tsvector @@to_tsquery (qry)
		order by so
		limit lim offset ofs
	LOOP
      	RETURN next rd;		
	END LOOP;	
	return;
END;
$_$;


ALTER FUNCTION public.qfind(text, text, bigint, bigint) OWNER TO ngdsdb;

--
-- Name: records_update_geometry(); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.records_update_geometry() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.wkt_geometry IS NULL THEN
        RETURN NEW;
    END IF;
    NEW.wkb_geometry := ST_GeomFromText(NEW.wkt_geometry,4326);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.records_update_geometry() OWNER TO ngdsdb;

--
-- Name: testguids(text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.testguids(text, text, integer, integer) RETURNS SETOF public.frecrow
    LANGUAGE plpgsql
    AS $_$
DECLARE
	guids ALIAS FOR $1;
    so ALIAS FOR $2;
	lim ALIAS FOR $3;
	ofs ALIAS FOR $4;
	ga text[];
	rd frecrow%ROWTYPE;
	
BEGIN
    ga := string_to_array(guids,',');	
	FOR rd IN
	    with zib as (
			select unnest(ga) as id
		)
		select r.identifier,  
			r.title, 
			r.organization,
			r.abstract, r.date_modified, r.wkt_geometry, 
			r.links 
		from zib, records r where 
		zib.id = r.identifier
		order by so
		limit lim offset ofs
	LOOP
      	RETURN next rd;		
	END LOOP;	
	return;
END;
$_$;


ALTER FUNCTION public.testguids(text, text, integer, integer) OWNER TO ngdsdb;

--
-- Name: testguids(text, text, bigint, bigint); Type: FUNCTION; Schema: public; Owner: ngdsdb
--

CREATE FUNCTION public.testguids(text, text, bigint, bigint) RETURNS SETOF public.frecrow
    LANGUAGE plpgsql
    AS $_$
DECLARE
	guids ALIAS FOR $1;
    so ALIAS FOR $2;
	lim ALIAS FOR $3;
	ofs ALIAS FOR $4;
	ga text[];
	rd frecrow%ROWTYPE;
	
BEGIN
    ga := string_to_array(guids,',');
	
	FOR rd IN
	    with zib as (
			select unnest(ga) as id
		)
		select r.identifier,  
			r.title, 
			r.organization,
			r.abstract, r.date_modified, r.wkt_geometry, 
			r.links 
		from zib, records r where 
		zib.id = r.identifier
		order by so
		limit 10 offset 0
	LOOP
      	RETURN next rd;		
	END LOOP;	
	return;
END;
$_$;


ALTER FUNCTION public.testguids(text, text, bigint, bigint) OWNER TO ngdsdb;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: sparams; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.sparams (
    qry text,
    so text,
    lim integer,
    ofs integer
);


ALTER TABLE public.sparams OWNER TO ngdsdb;

--
-- Name: qsearch; Type: VIEW; Schema: public; Owner: ngdsdb
--

CREATE VIEW public.qsearch AS
 WITH s AS (
         SELECT sparams.qry,
            sparams.so,
            sparams.lim,
            sparams.ofs
           FROM public.sparams
        ), z AS (
         SELECT f.identifier,
            f.title,
            f.organization,
            f.abstract,
            f.date_modified,
            f.wkt_geometry,
            f.links
           FROM public.qfind(( SELECT s.qry
                   FROM s), ( SELECT s.so
                   FROM s), (( SELECT s.lim
                   FROM s))::bigint, (( SELECT s.ofs
                   FROM s))::bigint) f(identifier text, title text, organization text, abstract text, date_modified text, wkt_geometry text, links text)
        )
 SELECT z.identifier,
    z.title,
    z.organization,
    z.abstract,
    z.date_modified,
    z.wkt_geometry,
    z.links
   FROM z;


ALTER TABLE public.qsearch OWNER TO ngdsdb;



--
-- Name: records ftsupdate; Type: TRIGGER; Schema: public; Owner: ngdsdb
--

CREATE TRIGGER ftsupdate BEFORE INSERT OR UPDATE ON public.records FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('anytext_tsvector', 'pg_catalog.english', 'anytext');


--
-- Name: records records_update_geometry; Type: TRIGGER; Schema: public; Owner: ngdsdb
--

CREATE TRIGGER records_update_geometry BEFORE INSERT OR UPDATE ON public.records FOR EACH ROW EXECUTE FUNCTION public.records_update_geometry();


--
-- Name: TABLE geography_columns; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRUNCATE,UPDATE ON TABLE public.geography_columns TO py_fdw;


--
-- Name: TABLE geometry_columns; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRUNCATE,UPDATE ON TABLE public.geometry_columns TO py_fdw;


--
-- Name: TABLE qsearch; Type: ACL; Schema: public; Owner: ngdsdb
--

GRANT SELECT ON TABLE public.qsearch TO py_fdw;


--
-- Name: TABLE records; Type: ACL; Schema: public; Owner: ngdsdb
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRUNCATE,UPDATE ON TABLE public.records TO py_fdw;


--
-- Name: TABLE spatial_ref_sys; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRUNCATE,UPDATE ON TABLE public.spatial_ref_sys TO py_fdw;


--
-- PostgreSQL database dump complete
--

