-- ************************************************************
-- TRIGGER DEFINITION SCRIPT: TalenBinder (V1.1)
-- ************************************************************
--
-- AUTOR: Leif Fieger
-- ERSTELLT AM: 22.09.2025
-- LETZTE ÄNDERUNG: 22.10.2025
-- 
-- FUNKTION:
-- 1. LÖSCHT ALLE VORHANDENEN DB - FUNKTIONEN.
-- 2. ERSTELLT DIE FUNKTIONEN.
--

-- ************************************************************
-- TEIL 1: DYNAMISCHE ZUGRIFFSLOGIK (TRIGGER DEFINITIONEN)
-- ************************************************************

-- Trigger-Funktionen löschen
DROP FUNCTION IF EXISTS check_event_modification_time();
DROP FUNCTION IF EXISTS check_invitations_sent_update();
DROP FUNCTION IF EXISTS check_candidate_modification_access();


-- 1.1. Funktion: Prüft, ob ein Event in der Vergangenheit liegt.
CREATE OR REPLACE FUNCTION check_event_modification_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Prüft, ob das Event-Datum in der Vergangenheit liegt (nur bei UPDATE relevant)
    IF OLD.date < CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Fehler: Events können nach dem Stattfinden (Datum: %) nicht mehr bearbeitet werden.', OLD.date;
    END IF;

    -- Aktualisiere immer den Zeitstempel und den Bearbeiter, da dies die letzte Barriere ist
    NEW.updated_at := CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.2. Funktion: Prüft, ob der Einladungsstatus korrekt geändert wird.
CREATE OR REPLACE FUNCTION check_invitations_sent_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Prüft nur, wenn der Wert geändert wird
    IF NEW.invitations_sent <> OLD.invitations_sent THEN
        -- Wenn versucht wird, von TRUE auf FALSE zurückzuwechseln
        IF OLD.invitations_sent IS TRUE AND NEW.invitations_sent IS FALSE THEN
            RAISE EXCEPTION 'Fehler: Der Einladungsstatus kann nicht von "versendet" auf "nicht versendet" zurückgesetzt werden.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.3. Funktion: Prüft die Rolle des Nutzers für die Kandidaten-Stammdaten
CREATE OR REPLACE FUNCTION check_candidate_modification_access()
RETURNS TRIGGER AS $$
DECLARE
    changer_role user_role;
BEGIN
    -- Wenn modified_by_user_id NULL ist, wird die Bearbeitung zugelassen (häufig bei Erst-Erstellung,
    -- sollte aber von der Applikation immer befüllt werden, um Sicherheit zu gewährleisten).
    IF NEW.modified_by_user_id IS NULL THEN
        -- Für INSERT zulassen
        RETURN NEW;
    END IF;

    -- Lese die Rolle des Nutzers
    SELECT role INTO changer_role
    FROM "User"
    WHERE user_id = NEW.modified_by_user_id;

    -- Wende die Regel an: Nur MANAGER dürfen die Stammdaten (UPDATE) ändern
    IF TG_OP = 'UPDATE' AND changer_role = 'Recruiter' THEN
        RAISE EXCEPTION 'Zugriff verweigert: Nur Manager (Berufsbildner/Leiter) dürfen die Kandidaten-Stammdaten nachträglich bearbeiten.';
    END IF;

    -- Aktualisiere immer den Zeitstempel
    NEW.updated_at := CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ************************************************************
-- TEIL 2: TRIGGER ANWENDEN
-- ************************************************************

-- Event Trigger
CREATE TRIGGER event_before_update_time
BEFORE UPDATE ON Event
FOR EACH ROW
EXECUTE FUNCTION check_event_modification_time();

CREATE TRIGGER event_invitation_update
BEFORE UPDATE OF invitations_sent ON Event
FOR EACH ROW
EXECUTE FUNCTION check_invitations_sent_update();

-- Candidate Trigger
CREATE TRIGGER candidate_before_modification
BEFORE UPDATE OR INSERT ON Candidate
FOR EACH ROW
EXECUTE FUNCTION check_candidate_modification_access();

-- WICHTIG: Die Applikation MUSS bei jedem INSERT/UPDATE in den Kerntabellen
-- das Feld modified_by_user_id mit der ID des aktuell angemeldeten Nutzers befüllen!

