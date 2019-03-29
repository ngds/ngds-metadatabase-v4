-- Table: public.rule_definitions

-- DROP TABLE public.rule_definitions;

-- Table: public.process_ruleset

-- DROP TABLE public.process_ruleset;

CREATE SEQUENCE activity_definition_id_seq;

CREATE TABLE public.activity_definition
(
    ad_id bigint NOT NULL DEFAULT nextval('activity_definition_id_seq'::regclass),
    activity_name text COLLATE pg_catalog."default",
	activity_type text COLLATE pg_catalog."default",
    create_date timestamp without time zone,
    userid integer,
    agentid integer,
    CONSTRAINT process_definition_pkey PRIMARY KEY (ad_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE SEQUENCE process_definition_id_seq;

-- process scope - once, each (run one record - then let next step run), all (run each record before going to next step), last

CREATE TABLE public.process_definition
(
    pd_id bigint NOT NULL DEFAULT nextval('process_definition_id_seq'::regclass),
    process_name text COLLATE pg_catalog."default",
	process_type text COLLATE pg_catalog."default",
    create_date timestamp without time zone,
    userid integer,
    agentid integer,
	activity_definition_id integer,
	process_order integer,
	process_scope text,
    CONSTRAINT process_definition_pkey PRIMARY KEY (pd_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.process_ruleset
    OWNER to postgres;
	
CREATE TABLE public.process_ruleset
(
    rs_id bigint NOT NULL DEFAULT nextval('process_ruleset_rs_id_seq'::regclass),
    process_id bigint,
    ruleset_name text COLLATE pg_catalog."default",
    create_date timestamp without time zone,
    userid integer,
    agentid integer,
    CONSTRAINT process_ruleset_pkey PRIMARY KEY (rs_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.process_ruleset
    OWNER to postgres;

CREATE TABLE public.rule_definitions
(
    rule_id bigint NOT NULL DEFAULT nextval('rule_definitions_rule_id_seq'::regclass),
    ruleset_id bigint,
    rule_name text COLLATE pg_catalog."default",
    rule_type text COLLATE pg_catalog."default",
    rule_operation text COLLATE pg_catalog."default",
    search_value text COLLATE pg_catalog."default",
    search_path text COLLATE pg_catalog."default",
    replace_value text COLLATE pg_catalog."default",
    return_path text COLLATE pg_catalog."default",
    status text COLLATE pg_catalog."default",
    elem_name text COLLATE pg_catalog."default",
    CONSTRAINT rule_definitions_pkey PRIMARY KEY (rule_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.rule_definitions
    OWNER to postgres;
	
create or replace view public.pv_active_ruleset as
    select p.rs_id as ruleset_id, 
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
    from process_ruleset p, rule_definitions r
    where p.rs_id = r.ruleset_id and 
        r.status = 'active';	

		
	
-- Process schema map returns everything mapped in a record to a schema

create type scorow as ( i bigint, ver int, p bigint, n text, ntype text, nval text, mpath text, rsid integer );


create or replace function process_schema_map(bigint, bigint) returns setof scorow
AS $$
DECLARE
  
  sep scorow%ROWTYPE;
  spo scorow%ROWTYPE;
  spx scorow%ROWTYPE;
  ps  pv_active_ruleset%ROWTYPE;
  mo  refcursor; -- for(i bigint) select * from mdn_get_object(i); --  
  mr  mdnorow%ROWTYPE;
  
BEGIN

    for sep in
        select node_id, 
        version_id, 
        parent_id, 
        fed_elem,
        CASE WHEN node_value = '[]' THEN
             'array'
             WHEN node_value = '{}' THEN
             'object'
             ELSE
             ''
        END as ntype,
        node_value, 
        mpath,
        ruleset_id,
        map_path
        from mdview, schema_map 
        where version_id = $1 and 
            schema_id = $2 and
        map_path = mpath and 
        stype = 'end'
    loop
        return next sep;
    end loop;
    
    for spo in
        select node_id, 
        version_id, 
        parent_id, 
        fed_elem,
        CASE WHEN node_value = '[]' THEN
             'array'
             WHEN node_value = '{}' THEN
             'object'
             ELSE
             ''
        END as ntype,
        node_value, 
        mpath,
        ruleset_id,
        map_path
        from mdview, schema_map 
        where version_id = $1 and 
            schema_id = $2 and
        map_path = node_name and 
        stype = 'object'
    loop

        
        if spo.rsid IS NOT NULL then
            -- spo.nval := 'NOT NULL';
            for ps in 
               select *
                from pv_active_ruleset 
                where ruleset_id = spo.rsid and
                    elem_name = spo.n
            loop
                   
                if ps.rule_operation = 'LOOKUP' then
                     
                        spx := mdn_lookup_object(spo.i,ps.search_path,ps.search_value,ps.return_path,ps.replace_value);                          
                        if spx.i = 0 then
                            -- not found   
                        else
                            spx.n := spo.n||'.'||spx.n;
                            spx.ntype := spo.ntype;
                            spx.mpath := spo.mpath;
                            spx.rsid := spo.rsid;
                            return next spx;
                        end if;

                end if;
                
                if ps.rule_operation = 'LIST' then
                 
                end if;
                 
            end loop;
        
        else 
            --return next spo;    
        end if;
        
        
    end loop;
 
    return;

END;
$$ LANGUAGE 'plpgsql' VOLATILE;


-- OBJECTID, 2 - search path, 3 - search value, 4 - replace path, 5 - replace 
create or replace function mdn_lookup_object (bigint, text, text, text, text) RETURNS scorow
AS $$
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
	open cmdo(i:=obid);
    LOOP
		fetch cmdo into md;
        exit when not found;
      
		if md.mpath = sp AND replace(md.nval,'"','') = sv then
			lfound := true;
		end if;
	END Loop;
	if lfound then
        --RAISE NOTICE 'found % % ', sp, sv;
		move first in cmdo;
		LOOP
			fetch cmdo into md;
			exit when not found;
			if md.mpath = rp then
                --RAISE NOTICE 'found lookup % % ',md.i::text, md.mpath;
				sc.i := md.i;
				sc.ver := md.ver;
				sc.p := md.p;
				sc.n := rn;
				sc.ntype := 'typetest';
				sc.nval := md.nval;
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
$$ LANGUAGE 'plpgsql' VOLATILE;	
