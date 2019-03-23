
/* Collection Master table */
CREATE TABLE public.collections
(
	set_id bigint NOT NULL DEFAULT nextval('schemas_schema_id_seq'::regclass),
	set_name text,
	set_type text,
	status text, 
	create_date timestamp without time zone,
	end_date timestamp without time zone,
	user_id bigint,
	activity_id bigint,
	agent_id bigint,
	parent_set_id bigint,
	source_id bigint,
	source_url text,
	CONSTRAINT set_id_pkey PRIMARY KEY (set_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.collections
    OWNER to postgres;

/* Define processes and versions associate collection */	
CREATE TABLE public.md_collections
(
	mdc_id bigint NOT NULL DEFAULT nextval('schemas_schema_id_seq'::regclass),
	set_id bigint,
	activity_id bigint,
	agent_id bigint,
	create_date timestamp without time zone,
	end_date timestamp without time zone,
	status text, 
	version_state text,
	CONSTRAINT mdc_id_pkey PRIMARY KEY (mdc_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.md_collections
    OWNER to postgres;
	
	
/* Associate md_collections to md_records   */
CREATE TABLE public.md_collection_records
(
	cr_id bigint NOT NULL DEFAULT nextval('schemas_schema_id_seq'::regclass),
	mdc_id bigint,
	mdv_id bigint,
	CONSTRAINT mdcr_pkey PRIMARY KEY (cr_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
	