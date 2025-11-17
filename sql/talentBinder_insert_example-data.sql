-- ************************************************************
-- Beispiel-Datenskript für TalentBinder (V1.0)
-- Fügt Beispiel-Accounts (Recruiter), Kandidaten, Events und Verknüpfungen hinzu.
-- ************************************************************

-- Setzt voraus, dass Branch, Apprenticeship, Location und Event_Type bereits befüllt sind.

-- ====================================================================
-- TEIL 1: Zusätzliche Account-Daten (Recruiter)
-- Die Accounts 1 und 2 (Leif und Roman) existieren bereits als 'berufsbilder'.
-- Wir fügen Recruiter (Lehrlinge/Hilfskräfte) hinzu.
-- ====================================================================

-- Passwort: 'pass' (für alle Accounts)
WITH password AS (
    SELECT crypt('passwort', gen_salt('bf', 8)) AS password_hash)
INSERT INTO account (email, password_hash, first_name, last_name, role)
SELECT v.email, np.password_hash, v.first_name, v.last_name, v.role::account_role
FROM password np,
     (VALUES
         ('max.muster@sunrise.net', 'Max', 'Muster', 'recruiter'), 	-- ID 3
         ('sarah.schmidt@sunrise.net', 'Sarah', 'Schmidt', 'recruiter'), 	-- ID 4
         ('anna.meier@sunrise.net', 'Anna', 'Meier', 'recruiter') 	-- ID 5
     ) AS v (email, first_name, last_name, role)
RETURNING account_id, email, role;

-- Account-IDs (zum Merken): 1=Leif (BB), 2=Roman (BB), 3=Max (Rec), 4=Sarah (Rec), 5=Anna (Rec)

-- ====================================================================
-- TEIL 2: Candidate (Kandidaten)
-- ====================================================================

TRUNCATE TABLE Candidate RESTART IDENTITY CASCADE;

INSERT INTO Candidate (first_name, last_name, email, candidate_status, created_by)
VALUES
    ('Elias', 'Haller', 'elias.haller@example.com', 'Favorit', 1), -- ID 1 (Erstellt von Leif/1)
    ('Lara', 'Schneider', 'lara.schneider@example.com', 'Normal', 2),  -- ID 2 (Erstellt von Roman/2)
    ('Noah', 'Fischer', 'noah.fischer@example.com', 'Normal', 1),   -- ID 3
    ('Mia', 'Keller', 'mia.keller@example.com', 'Eliminiert', 4)  -- ID 4 (Erstellt von Sarah/4)
RETURNING candidate_id, first_name, candidate_status;


-- ====================================================================
-- TEIL 3: Candidate_Apprenticeships (Lehrberufswünsche der Kandidaten)
-- Apprenticeship-IDs: 1=Applikationsentw., 2=Plattformentw., 3=Mediamatiker, 4=Kaufmann
-- ====================================================================

TRUNCATE TABLE Candidate_Apprenticeship RESTART IDENTITY CASCADE;

INSERT INTO Candidate_Apprenticeship (candidate_id, apprenticeship_id)
VALUES
    (1, 1), -- Elias (Favorit) interessiert sich für Applikationsentwickler EFZ
    (1, 2), -- Elias interessiert sich auch für Plattformentwickler EFZ
    (2, 4), -- Lara interessiert sich für Kaufmann/-frau EFZ
    (3, 3), -- Noah interessiert sich für Mediamatiker EFZ
    (4, 1)  -- Mia (Eliminiert) interessierte sich für Applikationsentwickler EFZ
RETURNING candidate_id, apprenticeship_id;


-- ====================================================================
-- TEIL 4: Event (Die geplanten Events)
-- Location-IDs: 1=Ambassador House, 2=Berufsmesse Zürich
-- Event_Type-IDs: 1=Info-Morge, 2=Berufsmesse
-- Branch-IDs: 1=IT, 2=Mediamatik, 3=KV
-- ====================================================================

TRUNCATE TABLE Event RESTART IDENTITY CASCADE;

-- Nächste Woche Dienstag (angenommen heute ist 13.11.2025)
INSERT INTO Event (branch_id, template_id, location_id, title, description, registration_required, invitations_sending_at, registrations_closing_at, created_by)
VALUES
    -- Event 1: IT Info-Morge (Regelmässiges Format)
    (1, 1, 1, 
     'IT Lehrstellen Info-Morge November', 
     'Detaillierte Präsentation über Applikations- und Plattformentwicklung.', 
     TRUE, '2025-11-17', '2025-11-19',
     1), -- Erstellt von Leif (1)

    -- Event 2: Berufsmesse (Grosses, branchenübergreifendes Event)
    (NULL, 2, 2, 
     'Berufsmesse Zürich - Stand Sunrise', 
     'Unser Auftritt an der grossen Berufsmesse.', 
     FALSE, NULL, NULL, 
     2) -- Erstellt von Roman (2)
RETURNING event_id, title, branch_id;

-- Event-IDs: 1=IT Info-Morge, 2=Berufsmesse Zürich


-- ====================================================================
-- TEIL 5: Event_Session (Die tatsächlichen Tage und Zeiten der Events)
-- ====================================================================

TRUNCATE TABLE Event_Session RESTART IDENTITY CASCADE;

INSERT INTO Event_Session (event_id, date_at, starting_at, ending_at)
VALUES
    -- Session für Event 1: Info-Morge (Nächsten Dienstag)
    (1, '2025-11-18', '09:00:00', '10:00:00'),

    -- Session für Event 2: Berufsmesse (Geht 3 Tage, nur 1. Tag als Beispiel)
    (2, '2025-11-20', '10:00:00', '17:00:00')
RETURNING session_id, event_id, date_at;


-- ====================================================================
-- TEIL 6: Event_Recruiter (Welche Accounts nehmen an welchen Events teil)
-- Account-IDs: 1=Leif (BB), 2=Roman (BB), 3=Max (Rec), 4=Sarah (Rec), 5=Anna (Rec)
-- Event-IDs: 1=IT Info-Morge, 2=Berufsmesse Zürich
-- ====================================================================

TRUNCATE TABLE Event_Recruiter RESTART IDENTITY CASCADE;

INSERT INTO Event_Recruiter (session_id, recruiter_id)
VALUES
    -- IT Info-Morge (Event 1): Geleitet von Leif, unterstützt von Max
    (1, 1), -- Leif (Berufsbildner)
    (1, 3), -- Max (Recruiter)

    -- Berufsmesse (Event 2): Team besteht aus Roman, Sarah, Anna
    (2, 2), -- Roman (Berufsbildner)
    (2, 4), -- Sarah (Recruiter)
    (2, 5)  -- Anna (Recruiter)
RETURNING session_id, recruiter_id;


-- ====================================================================
-- TEIL 7: Event_Registration (Welche Kandidaten sind angemeldet)
-- Candidate-IDs: 1=Elias, 2=Lara, 3=Noah, 4=Mia
-- Event-IDs: 1=IT Info-Morge, 2=Berufsmesse Zürich (Braucht keine Registrierung)
-- ====================================================================

TRUNCATE TABLE Event_Registration RESTART IDENTITY CASCADE;

INSERT INTO Event_Registration (event_id, candidate_id)
VALUES
    -- Elias und Mia sind für den IT Info-Morge angemeldet (Event 1)
    (1, 1), -- Elias (Favorit)
    (1, 4)  -- Mia (Eliminiert)
RETURNING event_id, candidate_id;


-- ====================================================================
-- TEIL 8: Event_Attendance (Anwesenheit und Feedback)
-- Angenommen, das Event 1 (Info-Morge) fand statt.
-- Account-ID 1 (Leif) erfasst die Anwesenheit.
-- ====================================================================

TRUNCATE TABLE Event_Attendance RESTART IDENTITY CASCADE;

INSERT INTO Event_Attendance (event_id, candidate_id, attendance, status, comment, created_by)
VALUES
    -- Elias Haller war anwesend, der Status wird als 'Favorit' bestätigt.
    (1, 1, 'Anwesend', 'Favorit', 'Sehr gut vorbereitet, großes Interesse an Applikationsentwicklung.', 1),

    -- Mia Keller war abwesend.
    (1, 4, 'Abwesend', NULL, 'Kandidatin ist nicht erschienen.', 1),

    -- Noah Fischer (Kandidat 3) kam spontan zur Berufsmesse (Event 2). Roman erfasst dies.
    (2, 3, 'Spontan', 'Favorit', 'Sehr engagierter Kandidat, direkt zum Mediamatiker BB weitergeleitet.', 2)
RETURNING event_id, candidate_id, attendance;


select * from event_type;

UPDATE Account
set password_hash='$2a$08$LaBSuhqCUi6K4HdhHzcrqeuiqAIgbo3QRaDJylTE8B7CmuPWogjAK'
where email='leif.fieger@sunrise.net'
returning email, password_hash;

UPDATE Account
set role='developer'
where email='leif.fieger@sunrise.net'
returning email, role;
