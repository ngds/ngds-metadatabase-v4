
/* Collection Master table */
CREATE TABLE public.collections
(
    set_id bigint NOT NULL DEFAULT nextval('collections_id_seq'::regclass),
    set_name text COLLATE pg_catalog."default",
    set_type text COLLATE pg_catalog."default",
    status text COLLATE pg_catalog."default",
    create_date timestamp without time zone,
    end_date timestamp without time zone,
    user_id bigint,
    activity_definition_id bigint,
    source_url text COLLATE pg_catalog."default",
    CONSTRAINT set_id_pkey PRIMARY KEY (set_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.collections
    OWNER to postgres;

/* Associates collections with the processes run on those collections */
CREATE TABLE public.collections_process
(
    mdc_id bigint NOT NULL DEFAULT nextval('collections_process_id_seq'::regclass),
    set_id bigint,
    mdc_type text COLLATE pg_catalog."default",
    create_date timestamp without time zone,
    end_date timestamp without time zone,
    activity_id bigint,
    agent_id bigint,
    parent_mdc_id bigint,
    status text COLLATE pg_catalog."default",
    version_state text COLLATE pg_catalog."default",
    CONSTRAINT mdc_id_pkey PRIMARY KEY (mdc_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.collections_process
    OWNER to postgres;

-- Defines the records that processed for a specific collection_process
CREATE TABLE public.collection_process_records
(
    cr_id bigint NOT NULL DEFAULT nextval('mdc_id_seq'::regclass),
    mdc_id bigint,
    mdv_id bigint,
    CONSTRAINT mdcr_pkey PRIMARY KEY (cr_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.collection_process_records
    OWNER to postgres;
	
