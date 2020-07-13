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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: records; Type: TABLE; Schema: public; Owner: ngdsdb
--

CREATE TABLE public.records (
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
);


ALTER TABLE public.records OWNER TO ngdsdb;

--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: public; Owner: ngdsdb
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (identifier);


--
-- Name: fts_gin_idx; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX fts_gin_idx ON public.records USING gin (anytext_tsvector);


--
-- Name: ix_records_abstract; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_abstract ON public.records USING btree (abstract);


--
-- Name: ix_records_accessconstraints; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_accessconstraints ON public.records USING btree (accessconstraints);


--
-- Name: ix_records_classification; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_classification ON public.records USING btree (classification);


--
-- Name: ix_records_conditionapplyingtoaccessanduse; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_conditionapplyingtoaccessanduse ON public.records USING btree (conditionapplyingtoaccessanduse);


--
-- Name: ix_records_contributor; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_contributor ON public.records USING btree (contributor);


--
-- Name: ix_records_couplingtype; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_couplingtype ON public.records USING btree (couplingtype);


--
-- Name: ix_records_creator; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_creator ON public.records USING btree (creator);


--
-- Name: ix_records_crs; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_crs ON public.records USING btree (crs);


--
-- Name: ix_records_date; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_date ON public.records USING btree (date);


--
-- Name: ix_records_date_creation; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_date_creation ON public.records USING btree (date_creation);


--
-- Name: ix_records_date_modified; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_date_modified ON public.records USING btree (date_modified);


--
-- Name: ix_records_date_publication; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_date_publication ON public.records USING btree (date_publication);


--
-- Name: ix_records_date_revision; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_date_revision ON public.records USING btree (date_revision);


--
-- Name: ix_records_degree; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_degree ON public.records USING btree (degree);


--
-- Name: ix_records_denominator; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_denominator ON public.records USING btree (denominator);


--
-- Name: ix_records_distanceuom; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_distanceuom ON public.records USING btree (distanceuom);


--
-- Name: ix_records_distancevalue; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_distancevalue ON public.records USING btree (distancevalue);


--
-- Name: ix_records_format; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_format ON public.records USING btree (format);


--
-- Name: ix_records_geodescode; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_geodescode ON public.records USING btree (geodescode);


--
-- Name: ix_records_insert_date; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_insert_date ON public.records USING btree (insert_date);


--
-- Name: ix_records_keywords; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_keywords ON public.records USING btree (keywords);


--
-- Name: ix_records_keywordstype; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_keywordstype ON public.records USING btree (keywordstype);


--
-- Name: ix_records_language; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_language ON public.records USING btree (language);


--
-- Name: ix_records_lineage; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_lineage ON public.records USING btree (lineage);


--
-- Name: ix_records_links; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_links ON public.records USING btree (links);


--
-- Name: ix_records_mdsource; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_mdsource ON public.records USING btree (mdsource);


--
-- Name: ix_records_operateson; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_operateson ON public.records USING btree (operateson);


--
-- Name: ix_records_operatesoname; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_operatesoname ON public.records USING btree (operatesoname);


--
-- Name: ix_records_operatesonidentifier; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_operatesonidentifier ON public.records USING btree (operatesonidentifier);


--
-- Name: ix_records_operation; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_operation ON public.records USING btree (operation);


--
-- Name: ix_records_organization; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_organization ON public.records USING btree (organization);


--
-- Name: ix_records_otherconstraints; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_otherconstraints ON public.records USING btree (otherconstraints);


--
-- Name: ix_records_parentidentifier; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_parentidentifier ON public.records USING btree (parentidentifier);


--
-- Name: ix_records_publisher; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_publisher ON public.records USING btree (publisher);


--
-- Name: ix_records_relation; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_relation ON public.records USING btree (relation);


--
-- Name: ix_records_resourcelanguage; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_resourcelanguage ON public.records USING btree (resourcelanguage);


--
-- Name: ix_records_responsiblepartyrole; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_responsiblepartyrole ON public.records USING btree (responsiblepartyrole);


--
-- Name: ix_records_schema; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_schema ON public.records USING btree (schema);


--
-- Name: ix_records_securityconstraints; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_securityconstraints ON public.records USING btree (securityconstraints);


--
-- Name: ix_records_servicetype; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_servicetype ON public.records USING btree (servicetype);


--
-- Name: ix_records_servicetypeversion; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_servicetypeversion ON public.records USING btree (servicetypeversion);


--
-- Name: ix_records_source; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_source ON public.records USING btree (source);


--
-- Name: ix_records_specificationdate; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_specificationdate ON public.records USING btree (specificationdate);


--
-- Name: ix_records_specificationdatetype; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_specificationdatetype ON public.records USING btree (specificationdatetype);


--
-- Name: ix_records_specificationtitle; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_specificationtitle ON public.records USING btree (specificationtitle);


--
-- Name: ix_records_time_begin; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_time_begin ON public.records USING btree (time_begin);


--
-- Name: ix_records_time_end; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_time_end ON public.records USING btree (time_end);


--
-- Name: ix_records_title; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_title ON public.records USING btree (title);


--
-- Name: ix_records_title_alternate; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_title_alternate ON public.records USING btree (title_alternate);


--
-- Name: ix_records_topicategory; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_topicategory ON public.records USING btree (topicategory);


--
-- Name: ix_records_type; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_type ON public.records USING btree (type);


--
-- Name: ix_records_typename; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX ix_records_typename ON public.records USING btree (typename);


--
-- Name: wkb_geometry_idx; Type: INDEX; Schema: public; Owner: ngdsdb
--

CREATE INDEX wkb_geometry_idx ON public.records USING gist (wkb_geometry);


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

