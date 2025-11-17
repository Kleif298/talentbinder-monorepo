-- Static insert into

-- 1.1 Branch
TRUNCATE TABLE Branch RESTART IDENTITY CASCADE;

INSERT INTO Branch (name)
       VALUES ('IT'), ('Mediamatik'), ('KV'), ('Kundendialog'), ('Detailhandel')
	   RETURNING branch_id, name;
-- IDs: 1=IT, 2=Mediamatik, 3=KV, 4=Kundendialog, 5=Detailhandel


-- 1.2 Apprenticeship
TRUNCATE TABLE Apprenticeship RESTART IDENTITY CASCADE;

INSERT INTO Apprenticeship (branch_id, name)
       VALUES 
	   (1, 'Applikationsentwickler EFZ'), -- IT (ID 1)
	   (1, 'Plattformentwickler EFZ'),    -- IT (ID 2)
	   (2, 'Mediamatiker EFZ'),            -- Mediamatik (ID 3)
	   (3, 'Kaufmann/-frau EFZ'),          -- KV (ID 4)
	   (4, 'Fachmann/Fachfrau Kundendialog EFZ'), -- Kundendialog (ID 5)
	   (5, 'Detailhandelsfachmann/-frau EFZ')  -- Detailhandel (ID 6)
	   RETURNING apprenticeship_id, name;



-- 1.3 Berufsbilder sind da um Brnachenzuteilung festzulegen

TRUNCATE TABLE Account RESTART IDENTITY CASCADE;

INSERT INTO account (email, first_name, last_name, role)
VALUES
		('leif.fieger@sunrise.net', 'Leif', 'Fieger', 'developer'),
        ('roman.stammbach@sunrise.net', 'Roman', 'Stammbach', 'berufsbilder'),
		('boris.kotz@sunrise.net', 'Boris', 'Kotz', 'berufsbilder')
		
RETURNING account_id, email, role;


-- 1.4 Zuteilung Branche und Berufsbilder

TRUNCATE TABLE Branch_Lead RESTART IDENTITY CASCADE;

INSERT INTO Branch_Lead (branch_id, account_id)
VALUES
        (1,1),
		(2,2)
		
RETURNING branch_id, account_id;

select 
	a.email, 
	b.name 
from 
	account a 
join 
	branch_lead bl on bl.account_id = a.account_id 
join branch b on b.branch_id = bl.branch_id;



-- Event-Types/Templates

TRUNCATE TABLE Location RESTART IDENTITY CASCADE;

INSERT INTO Location (name, address, city, plz)
VALUES 
	('Ambassador House', 'Thurgauerstrasse 101b', 'Glattpark', '8152'),
	('Berufsmesse Zürich', 'Wallisellenstrasse 49', 'Zürich', '8050')
	
RETURNING location_id, name, address, city, plz;


TRUNCATE TABLE Event_Type RESTART IDENTITY CASCADE;

INSERT INTO Event_Type (title, description, location_id, registrations_required, starting_at, ending_at)
VALUES
('Info-Morge', 'Allgemeine Präsentation und Q&A für Erstinteressenten.', 1, true, '09:00:00', '12:00:00'),
('Berufsmesse', 'Eine direkte Kontaktmöglichkeit mit einer großen Anzahl potenzieller Auszubildender, um sie über unsere Lehrberufe zu informieren, Fragen zu beantworten und erste Bewerberkontakte zu knüpfen.', 2, false, '10:00:00', '17:00:00')
RETURNING template_id, title;


SELECT et.title, et.starting_at, et.ending_at, l.name from Event_Type et join location l on et.location_id = l.location_id;

select * from Account;

select * from event;

update Account
set password_hash='$2a$08$LaBSuhqCUi6K4HdhHzcrqeuiqAIgbo3QRaDJylTE8B7CmuPWogjAK'
returning email, password_hash;


