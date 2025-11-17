SELECT 
	c.candidate_id as id, 
	c.first_name, 
	c.last_name, 
	c.email, 
	c.candidate_status as status,
	c.created_at,
	a.name as apprenticeship,
	a.apprenticeship_id
FROM 
	Candidate c
LEFT JOIN 
	Candidate_Apprenticeship ca ON c.candidate_id = ca.candidate_id
LEFT JOIN 
	Apprenticeship a ON ca.apprenticeship_id = a.apprenticeship_id;

select * from Account;

		