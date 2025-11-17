--
-- ************************************************************
-- SCHEMA DEFINITION SCRIPT: TalenBinder (V1.0)
-- ************************************************************
--
-- AUTOR: Leif Fieger
-- ERSTELLT AM: 15.09.2025
-- LETZTE ÄNDERUNG: 23.10.2025
-- 
-- FUNKTION:
-- 1. LÖSCHT ALLE EXISTIERENDEN TYPES UND TABELLEN.
-- 2. ERSTELLT TYPES UND TABELLEN.
--

-- ************************************************************
-- TEIL 1: ALLE TABELLEN LÖSCHEN
-- ************************************************************



-- 1.2 Tabellen löschen (Reihenfolge ist wichtig, um fk-Probleme zu vermeiden)
DROP TABLE IF EXISTS Event_Attendance CASCADE;
DROP TABLE IF EXISTS Event_Registration CASCADE;
DROP TABLE IF EXISTS Event_Recruiter CASCADE;
DROP TABLE IF EXISTS Audit_Log CASCADE;
DROP TABLE IF EXISTS Location CASCADE;
DROP TABLE IF EXISTS Event CASCADE;
DROP TABLE IF EXISTS Event_Type CASCADE;
DROP TABLE IF EXISTS Event_Session CASCADE;
DROP TABLE IF EXISTS Candidate_Apprenticeship CASCADE;
DROP TABLE IF EXISTS Candidate CASCADE;
DROP TABLE IF EXISTS Branch_Lead CASCADE;
DROP TABLE IF EXISTS Account CASCADE;
DROP TABLE IF EXISTS Apprenticeship CASCADE;
DROP TABLE IF EXISTS Branch CASCADE;

-- 1.1 ENUM-Typen löschen
DROP TYPE IF EXISTS candidate_status;
DROP TYPE IF EXISTS attendance_status;
DROP TYPE IF EXISTS account_role;

-- ************************************************************
-- TEIL 2: SCHEMA-DEFINITION (CREATE TYPES & TABLES)
-- ************************************************************

-- 2.1 ENUM-Typen
CREATE TYPE account_role AS ENUM ('berufsbilder', 'recruiter', 'developer');
COMMENT ON TYPE account_role IS 'Berufsbildner haben Admin-Rechte in ihrer Abteilung. Recruiter sind Lehrlinge und können Events bearbeiten';

CREATE TYPE attendance_status AS ENUM ('Angemeldet', 'Anwesend', 'Abwesend', 'Spontan');
COMMENT ON TYPE attendance_status IS 'Definiert den Anwesenheitsstatus des Kandidaten.';

CREATE TYPE candidate_status AS ENUM ('Favorit', 'Normal', 'Eliminiert');
COMMENT ON TYPE candidate_status IS 'Definiert den Bewertungstatus eines Bewerbers priorisiert, default, ausgeschieden.';


-- 2.2 Tabelle für die Berufsbranchen
CREATE TABLE Branch (
    branch_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);
COMMENT ON TABLE Branch IS 'Top-Level Gruppierung der Lehrberufe. Kann mehrere Leiter haben. Wird bei Events genutzt';


-- 2.3 Tabelle für die Lehrberufe
CREATE TABLE Apprenticeship (
    apprenticeship_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_apprenticeship_branch
        FOREIGN KEY (branch_id) REFERENCES Branch (branch_id)
		ON UPDATE CASCADE,

    UNIQUE (branch_id, name)
);
COMMENT ON TABLE Apprenticeship IS 'Detaillierte Unterscheidung, der Kandidat wird dieser Einheit zugeordnet.';


-- 2.4 Tabelle für die Nutzer
CREATE TABLE Account (
	account_id serial PRIMARY KEY,
	first_name varchar(64)NOT NULL,
	last_name varchar(64)NOT NULL	,
	email text UNIQUE NOT NULL,
	uid VARCHAR(100) UNIQUE,
	password_hash VARCHAR(100),
	role account_role NOT NULL DEFAULT 'recruiter',
	last_ldap_sync TIMESTAMP DEFAULT NOW(),
	created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE Account IS 'Speichert Berufsbildner und Recruiter.';


-- 2.5 Brückentabelle: Branch_Lead (N:M Beziehung)
CREATE TABLE Branch_Lead (
    branch_lead_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL,
    account_id INT NOT NULL,

    CONSTRAINT fk_lead_branch
        FOREIGN KEY (branch_id) REFERENCES Branch (branch_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_lead_account
        FOREIGN KEY (account_id) REFERENCES Account (account_id)
		ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE (branch_id, account_id)
);
COMMENT ON TABLE Branch_Lead IS 'Löst die M:N-Beziehung auf: Definiert, welche Trainer für welche Branchen zuständig sind.';


-- 2.6 Tabelle für die Kandidaten
CREATE TABLE Candidate (
    candidate_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
	candidate_status candidate_status NOT NULL DEFAULT 'Normal',
	
    -- Audit-Felder
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT,

	
	CONSTRAINT fk_candidate_account
	    FOREIGN KEY (created_by) REFERENCES Account (account_id)
        ON UPDATE CASCADE ON DELETE SET NULL

);
COMMENT ON TABLE Candidate IS 'Kandidaten sind spezifischen Lehrberufen zugeordnet. Nur Trainer/Berufsbildner dürfen die Stammdaten nachträglich bearbeiten.';

-- WICHTIGER HINWEIS: Dieses Skript setzt voraus, dass die Tabellen 
-- 'Branch' (mit branch_id) und 'Account' (mit account_id) bereits existieren.

CREATE TABLE Location (
	location_id SERIAL PRIMARY KEY,
	name VARCHAR(100),
	address VARCHAR(100),
	city VARCHAR(40),
	plz CHAR(4),

	UNIQUE (address, plz)
);

-- 2.7 Tabelle für Event-Vorlagen
CREATE TABLE Event_Type (
    template_id SERIAL PRIMARY KEY,
	location_id INT NOT NULL,
	
    title VARCHAR(255) NOT NULL,
    description TEXT,
	registrations_required BOOLEAN,
	starting_at time, -- used by session
	ending_at time, -- used by session
	multiple_sessions BOOLEAN,

	CONSTRAINT fk_et_location
		FOREIGN KEY (location_id) REFERENCES Location (location_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
COMMENT ON TABLE Event_Type IS 'Type und Template für Events. Beinhaltet Info-Morgen, Berusmesse, Schnupperwoche usw.';



-- 2.8 Tabelle für die Events (Der Metadaten-Container)
CREATE TABLE Event (
    event_id SERIAL PRIMARY KEY,
    branch_id INT,
    template_id INT,
	location_id INT NOT NULL,
	
    title VARCHAR(255) NOT NULL,
	description text,
	
    invitations_sending_at DATE,
    registrations_closing_at DATE,
	registration_required BOOLEAN,
    invitations_sent BOOLEAN NOT NULL DEFAULT FALSE,
	
    -- Audit-Felder
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT,

    -- FK-Beziehungen
    CONSTRAINT fk_event_branch
        FOREIGN KEY (branch_id) REFERENCES Branch (branch_id)
		ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_Event_Type
        FOREIGN KEY (template_id) REFERENCES Event_Type (template_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

	CONSTRAINT fk_event_account
        FOREIGN KEY (created_by) REFERENCES Account (account_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

	CONSTRAINT fk_e_location
		FOREIGN KEY (location_id) REFERENCES Location (location_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON COLUMN Event.branch_id IS 'Steuert die Event-Sichtbarkeit: NULL = Offen für alle Branchen; Wert = Nur für diese Gruppe.';
COMMENT ON COLUMN Event.invitations_sent IS 'Gibt an, ob Einladungen versendet wurden. Kann nur einmal von FALSE auf TRUE gesetzt werden.';


-- 2.9 Tabelle für die Event-Sessions/Tage
-- Speichert die konkreten Zeitfenster. Jedes Mehrtages-Event hat mehrere Einträge hier.
CREATE TABLE Event_Session (
    session_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,

	--description VARCHAR(100),

	date_at date NOT NULL,
    starting_at time NOT NULL,
    ending_at time NOT NULL,
    
    session_location VARCHAR(255),

    CONSTRAINT fk_session_event
        FOREIGN KEY (event_id) REFERENCES Event (event_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_start_before_end
        CHECK (starting_at < ending_at)
);

-- 2.9 Brückentabelle: Event_Recruiter
CREATE TABLE Event_Recruiter (
    event_recruiter_id SERIAL PRIMARY KEY,
    session_id INT NOT NULL,
    recruiter_id INT NOT NULL,
    
    CONSTRAINT fk_er_session
        FOREIGN KEY (session_id) REFERENCES Event_Session (session_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    
    CONSTRAINT fk_er_recruiter
        FOREIGN KEY (recruiter_id) REFERENCES Account (account_id)
		ON UPDATE CASCADE ON DELETE CASCADE,
        
    UNIQUE (session_id, recruiter_id)
);


-- 2.10 Protokolltabelle: Event_Registration
CREATE TABLE Event_Registration (
    registration_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    candidate_id INT NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_er_event
        FOREIGN KEY (event_id) REFERENCES Event (event_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_er_candidate
        FOREIGN KEY (candidate_id) REFERENCES Candidate (candidate_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE (event_id, candidate_id)
);


-- 2.11 Protokolltabelle: Event_Attendance (Feedback)
CREATE TABLE Event_Attendance (
    attendance_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    candidate_id INT NOT NULL,
    attendance attendance_status NOT NULL,
	status candidate_status,
    comment TEXT,

    -- Audit-Felder
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT,

    CONSTRAINT fk_ea_event
        FOREIGN KEY (event_id) REFERENCES Event (event_id)
		ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_ea_candidate
        FOREIGN KEY (candidate_id) REFERENCES Candidate (candidate_id)
		ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_ea_account
        FOREIGN KEY (created_by) REFERENCES Account (account_id)
        ON UPDATE CASCADE ON DELETE SET NULL,


    UNIQUE (event_id, candidate_id, created_by)
);
COMMENT ON TABLE Event_Attendance IS 'Speichert Anwesenheit und Feedback zum Kandidaten (durch Recruiter) während des Events.';


-- 2.12 CAndiat
CREATE TABLE Candidate_Apprenticeship (
	ca_id SERIAL PRIMARY KEY,
	candidate_id INT,
	apprenticeship_id INT,

	CONSTRAINT fk_ca_candidate
	    FOREIGN KEY (candidate_id) REFERENCES Candidate (candidate_id)
        ON UPDATE CASCADE ON DELETE CASCADE,	

	CONSTRAINT fk_ca_apprenticeship
	    FOREIGN KEY (apprenticeship_id) REFERENCES Apprenticeship (apprenticeship_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 2.13 AUDIT-LOG TABELLE
CREATE TABLE Audit_Log (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_id INT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    
    CONSTRAINT fk_audit_account
        FOREIGN KEY (account_id) REFERENCES Account (account_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);












