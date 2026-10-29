// A testable product hypothesis, not a claim of validated customer demand.
export const productScope={
 audience:'Makers preparing hands-on demonstrations',
 task:'Explain one everyday mechanism, then test a separate craft study.',
 outcome:'One source-linked explanation, one conceptual drawing, and an honest observation from a separate model.',
};
export const investigationGoals=[
 {id:'motion',title:'What makes it move?',description:'Follow a visible working surface or motion path.',prompt:'For a hands-on maker demonstration, explain one visible motion-transfer principle in the main object. Tie the explanation to photographed parts. If motion cannot be established from these photos, say so; do not invent mechanisms.'},
 {id:'support',title:'What keeps it stable?',description:'Trace visible supports, shape and load paths.',prompt:'For a hands-on maker demonstration, explain one support or stability principle in the main object. Tie the explanation to visible shape and supports. Do not invent loads, measurements, hidden joints or material specifications.'},
 {id:'shape',title:'Why is it shaped this way?',description:'Connect a visible shape to a possible function.',prompt:'For a hands-on maker demonstration, explain one possible relationship between the main object’s visible shape and function. Separate visible geometry from inferred design intent. Say what cannot be established from the photos.'},
] as const;
