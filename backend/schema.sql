CREATE TABLE IF NOT EXISTS colleges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'USA',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  event_calendar_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TEXT NOT NULL,
  end_time TEXT DEFAULT '',
  location_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  gmail TEXT NOT NULL UNIQUE,
  college_id INTEGER,
  profile_image TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(friend_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  FOREIGN KEY(requester_id) REFERENCES users(id),
  FOREIGN KEY(receiver_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO colleges
  (id, name, city, state, country, latitude, longitude, event_calendar_url)
VALUES
  (1, 'Stanford University', 'Stanford', 'CA', 'USA', 37.4275, -122.1697, 'https://events.stanford.edu'),
  (2, 'Massachusetts Institute of Technology', 'Cambridge', 'MA', 'USA', 42.3601, -71.0942, 'https://calendar.mit.edu'),
  (3, 'University of California, Berkeley', 'Berkeley', 'CA', 'USA', 37.8719, -122.2585, 'https://events.berkeley.edu'),
  (4, 'University of Michigan', 'Ann Arbor', 'MI', 'USA', 42.2780, -83.7382, 'https://events.umich.edu'),
  (5, 'University of Texas at Austin', 'Austin', 'TX', 'USA', 30.2849, -97.7341, 'https://calendar.utexas.edu'),
  (6, 'Harvard University', 'Cambridge', 'MA', 'USA', 42.3770, -71.1167, 'https://calendar.college.harvard.edu'),
  (7, 'University of California, Los Angeles', 'Los Angeles', 'CA', 'USA', 34.0689, -118.4452, 'https://community.ucla.edu'),
  (8, 'New York University', 'New York', 'NY', 'USA', 40.7295, -73.9965, 'https://events.nyu.edu'),
  (9, 'Georgia Institute of Technology', 'Atlanta', 'GA', 'USA', 33.7756, -84.3963, 'https://calendar.gatech.edu'),
  (10, 'University of Washington', 'Seattle', 'WA', 'USA', 47.6553, -122.3035, 'https://www.washington.edu/calendar'),
  (11, 'Duke University', 'Durham', 'NC', 'USA', 36.0014, -78.9382, 'https://calendar.duke.edu'),
  (12, 'University of Chicago', 'Chicago', 'IL', 'USA', 41.7897, -87.5997, 'https://events.uchicago.edu'),
  (13, 'Columbia University', 'New York', 'NY', 'USA', 40.8075, -73.9626, 'https://events.columbia.edu'),
  (14, 'Cornell University', 'Ithaca', 'NY', 'USA', 42.4534, -76.4735, 'https://events.cornell.edu'),
  (15, 'Arizona State University', 'Tempe', 'AZ', 'USA', 33.4242, -111.9281, 'https://asuevents.asu.edu'),
  (16, 'Princeton University', 'Princeton', 'NJ', 'USA', 40.3431, -74.6551, 'https://events.princeton.edu'),
  (17, 'Yale University', 'New Haven', 'CT', 'USA', 41.3163, -72.9223, 'https://calendar.yale.edu'),
  (18, 'University of Pennsylvania', 'Philadelphia', 'PA', 'USA', 39.9522, -75.1932, 'https://events.upenn.edu'),
  (19, 'Carnegie Mellon University', 'Pittsburgh', 'PA', 'USA', 40.4433, -79.9436, 'https://events.cmu.edu'),
  (20, 'Northwestern University', 'Evanston', 'IL', 'USA', 42.0565, -87.6753, 'https://planitpurple.northwestern.edu'),
  (21, 'University of Southern California', 'Los Angeles', 'CA', 'USA', 34.0224, -118.2851, 'https://calendar.usc.edu'),
  (22, 'California Institute of Technology', 'Pasadena', 'CA', 'USA', 34.1377, -118.1253, 'https://events.caltech.edu'),
  (23, 'University of Illinois Urbana-Champaign', 'Champaign', 'IL', 'USA', 40.1020, -88.2272, 'https://calendars.illinois.edu'),
  (24, 'Purdue University', 'West Lafayette', 'IN', 'USA', 40.4237, -86.9212, 'https://calendar.purdue.edu'),
  (25, 'University of Wisconsin-Madison', 'Madison', 'WI', 'USA', 43.0766, -89.4125, 'https://today.wisc.edu'),
  (26, 'University of Minnesota Twin Cities', 'Minneapolis', 'MN', 'USA', 44.9738, -93.2277, 'https://events.umn.edu'),
  (27, 'Ohio State University', 'Columbus', 'OH', 'USA', 40.0067, -83.0305, 'https://events.osu.edu'),
  (28, 'University of Florida', 'Gainesville', 'FL', 'USA', 29.6436, -82.3549, 'https://calendar.ufl.edu'),
  (29, 'Florida State University', 'Tallahassee', 'FL', 'USA', 30.4419, -84.2985, 'https://calendar.fsu.edu'),
  (30, 'University of North Carolina at Chapel Hill', 'Chapel Hill', 'NC', 'USA', 35.9049, -79.0469, 'https://events.unc.edu'),
  (31, 'North Carolina State University', 'Raleigh', 'NC', 'USA', 35.7847, -78.6821, 'https://calendar.ncsu.edu'),
  (32, 'University of Virginia', 'Charlottesville', 'VA', 'USA', 38.0336, -78.5080, 'https://calendar.virginia.edu'),
  (33, 'Virginia Tech', 'Blacksburg', 'VA', 'USA', 37.2284, -80.4234, 'https://calendar.vt.edu'),
  (34, 'University of Colorado Boulder', 'Boulder', 'CO', 'USA', 40.0076, -105.2659, 'https://calendar.colorado.edu'),
  (35, 'University of Oregon', 'Eugene', 'OR', 'USA', 44.0448, -123.0726, 'https://calendar.uoregon.edu'),
  (36, 'Oregon State University', 'Corvallis', 'OR', 'USA', 44.5638, -123.2794, 'https://events.oregonstate.edu'),
  (37, 'University of Notre Dame', 'Notre Dame', 'IN', 'USA', 41.7056, -86.2353, 'https://events.nd.edu'),
  (38, 'Vanderbilt University', 'Nashville', 'TN', 'USA', 36.1447, -86.8027, 'https://calendar.vanderbilt.edu'),
  (39, 'Rice University', 'Houston', 'TX', 'USA', 29.7174, -95.4018, 'https://events.rice.edu'),
  (40, 'University of Miami', 'Coral Gables', 'FL', 'USA', 25.7216, -80.2793, 'https://events.miami.edu');

INSERT OR IGNORE INTO events
  (id, college_id, title, description, start_time, end_time, location_name, latitude, longitude, source_url)
VALUES
  (1, 1, 'AI Builders Meetup', 'A student meetup for prototyping useful AI tools and sharing demos.', '2026-11-06 18:00', '2026-11-06 20:00', 'Huang Engineering Center', 37.4283, -122.1750, 'https://events.stanford.edu'),
  (2, 1, 'Campus Startup Pitch Night', 'Founders present early product ideas and receive feedback from peers.', '2026-11-10 19:00', '2026-11-10 21:00', 'Tresidder Memorial Union', 37.4236, -122.1702, 'https://events.stanford.edu'),
  (3, 2, 'Robotics Open Lab', 'Hands-on robotics demos and project team recruiting for students.', '2026-11-07 17:30', '2026-11-07 19:30', 'MIT Stata Center', 42.3610, -71.0906, 'https://calendar.mit.edu'),
  (4, 2, 'Climate Tech Hack Session', 'Small teams explore software ideas for climate data and energy use.', '2026-11-13 16:00', '2026-11-13 19:00', 'MIT Media Lab', 42.3608, -71.0874, 'https://calendar.mit.edu'),
  (5, 3, 'Data Science Career Mixer', 'Students meet campus groups and local teams hiring data interns.', '2026-11-08 18:00', '2026-11-08 20:00', 'Sutardja Dai Hall', 37.8756, -122.2588, 'https://events.berkeley.edu'),
  (6, 4, 'Health Innovation Showcase', 'Student teams demo prototypes for health and accessibility.', '2026-11-09 15:00', '2026-11-09 17:00', 'Michigan Union', 42.2750, -83.7413, 'https://events.umich.edu'),
  (7, 5, 'Longhorn Product Sprint', 'A fast product-building session for designers, engineers, and founders.', '2026-11-11 18:30', '2026-11-11 21:00', 'Gates Dell Complex', 30.2862, -97.7364, 'https://calendar.utexas.edu'),
  (8, 6, 'Public Service Project Fair', 'Campus teams recruit volunteers for local policy, tutoring, and civic projects.', '2026-11-06 16:00', '2026-11-06 18:00', 'Smith Campus Center', 42.3736, -71.1190, 'https://calendar.college.harvard.edu'),
  (9, 6, 'Bio + AI Research Forum', 'Student researchers share short talks on machine learning in biology.', '2026-11-12 17:00', '2026-11-12 19:00', 'Science Center', 42.3763, -71.1166, 'https://calendar.college.harvard.edu'),
  (10, 7, 'Bruin Game Design Night', 'A collaborative game jam kickoff for artists, designers, and programmers.', '2026-11-05 19:00', '2026-11-05 22:00', 'Ackerman Union', 34.0703, -118.4449, 'https://community.ucla.edu'),
  (11, 8, 'Urban Tech Speaker Series', 'Builders discuss software projects for transit, housing, and public space.', '2026-11-09 18:00', '2026-11-09 20:00', 'Kimmel Center', 40.7298, -73.9975, 'https://events.nyu.edu'),
  (12, 9, 'AI Hardware Demo Day', 'Engineering teams show embedded AI projects and rapid prototypes.', '2026-11-10 17:30', '2026-11-10 20:00', 'Klaus Advanced Computing Building', 33.7772, -84.3960, 'https://calendar.gatech.edu'),
  (13, 10, 'Sustainability Data Lab', 'Students analyze campus energy and transportation datasets.', '2026-11-07 15:00', '2026-11-07 17:00', 'Suzzallo Library', 47.6559, -122.3084, 'https://www.washington.edu/calendar'),
  (14, 11, 'Student Founder Coffee Chats', 'Casual founder matching and project feedback for early startup teams.', '2026-11-14 10:00', '2026-11-14 12:00', 'Bryan Center', 36.0019, -78.9403, 'https://calendar.duke.edu'),
  (15, 12, 'Civic Data Hack Night', 'A practical build night for public interest datasets and dashboards.', '2026-11-12 18:30', '2026-11-12 21:00', 'Regenstein Library', 41.7922, -87.6008, 'https://events.uchicago.edu'),
  (16, 13, 'Media Innovation Showcase', 'Student teams demo storytelling, video, and publishing tools.', '2026-11-11 17:00', '2026-11-11 19:00', 'Lerner Hall', 40.8068, -73.9630, 'https://events.columbia.edu'),
  (17, 14, 'AgTech Prototype Review', 'Builders present hardware and software ideas for agriculture and climate.', '2026-11-13 16:30', '2026-11-13 18:30', 'Gates Hall', 42.4440, -76.4812, 'https://events.cornell.edu'),
  (18, 15, 'Desert Innovation Sprint', 'A maker sprint focused on heat, mobility, water, and city life.', '2026-11-06 18:00', '2026-11-06 21:00', 'Memorial Union', 33.4170, -111.9347, 'https://asuevents.asu.edu'),
  (19, 16, 'Policy + AI Colloquium', 'Students discuss public-sector uses of AI and responsible deployment.', '2026-11-16 17:00', '2026-11-16 18:30', 'Friend Center', 40.3505, -74.6527, 'https://events.princeton.edu'),
  (20, 17, 'Creative Coding Studio', 'A workshop for generative art, music visuals, and browser-based experiments.', '2026-11-07 18:00', '2026-11-07 20:00', 'Tsai Center for Innovative Thinking', 41.3117, -72.9271, 'https://calendar.yale.edu'),
  (21, 18, 'Health Data Design Review', 'Cross-disciplinary teams review prototypes for patient education tools.', '2026-11-10 16:00', '2026-11-10 18:00', 'Houston Hall', 39.9509, -75.1937, 'https://events.upenn.edu'),
  (22, 19, 'Human-Computer Interaction Demo Hour', 'Students demo research prototypes across accessibility, learning, and robotics.', '2026-11-12 17:30', '2026-11-12 19:00', 'Gates Hillman Center', 40.4435, -79.9443, 'https://events.cmu.edu'),
  (23, 20, 'Journalism Tools Sprint', 'A build session for campus media, fact-checking, and community storytelling.', '2026-11-13 15:00', '2026-11-13 17:30', 'Norris University Center', 42.0534, -87.6728, 'https://planitpurple.northwestern.edu'),
  (24, 21, 'Venture Studio Open Pitch', 'Student founders share product ideas and find project teammates.', '2026-11-09 18:30', '2026-11-09 20:30', 'Fertitta Hall', 34.0186, -118.2828, 'https://calendar.usc.edu'),
  (25, 22, 'Space Systems Research Night', 'Labs present student opportunities in aerospace, sensors, and robotics.', '2026-11-14 17:00', '2026-11-14 19:00', 'Cahill Center', 34.1379, -118.1256, 'https://events.caltech.edu'),
  (26, 23, 'Open Source Systems Meetup', 'A technical meetup for distributed systems, compilers, and open source maintainers.', '2026-11-06 17:00', '2026-11-06 19:00', 'Siebel Center for Computer Science', 40.1138, -88.2249, 'https://calendars.illinois.edu'),
  (27, 24, 'Boilermaker Robotics Showcase', 'Student robotics teams present autonomous systems and competition builds.', '2026-11-08 14:00', '2026-11-08 17:00', 'Armstrong Hall', 40.4313, -86.9147, 'https://calendar.purdue.edu'),
  (28, 25, 'Badger Data Visualization Night', 'Students build dashboards from civic and campus datasets.', '2026-11-11 18:00', '2026-11-11 20:00', 'Discovery Building', 43.0737, -89.4088, 'https://today.wisc.edu'),
  (29, 26, 'Climate Resilience Design Jam', 'A rapid design jam focused on extreme weather, energy, and local planning.', '2026-11-12 16:30', '2026-11-12 19:00', 'Coffman Memorial Union', 44.9729, -93.2354, 'https://events.umn.edu'),
  (30, 27, 'Sports Analytics Roundtable', 'Students explore modeling, scouting, and fan engagement projects.', '2026-11-10 19:00', '2026-11-10 20:30', 'Ohio Union', 39.9977, -83.0086, 'https://events.osu.edu'),
  (31, 28, 'Gator Startup Lab', 'A founder lab for validating student project ideas with mentors.', '2026-11-07 10:00', '2026-11-07 13:00', 'Reitz Union', 29.6465, -82.3478, 'https://calendar.ufl.edu'),
  (32, 29, 'Music Tech Listening Lab', 'A workshop on audio tools, playlists, and live event discovery.', '2026-11-09 18:00', '2026-11-09 20:00', 'Student Union', 30.4442, -84.2974, 'https://calendar.fsu.edu'),
  (33, 30, 'Public Health Product Night', 'Teams prototype tools for health communication and campus wellness.', '2026-11-13 17:30', '2026-11-13 19:30', 'Carolina Union', 35.9109, -79.0479, 'https://events.unc.edu'),
  (34, 31, 'Wolfpack Maker Expo', 'Student teams display hardware, sustainability, and design projects.', '2026-11-06 15:00', '2026-11-06 18:00', 'Talley Student Union', 35.7839, -78.6707, 'https://calendar.ncsu.edu'),
  (35, 32, 'Ethics in Software Forum', 'A discussion forum on privacy, campus data, and student-built tools.', '2026-11-11 16:00', '2026-11-11 17:30', 'Newcomb Hall', 38.0356, -78.5067, 'https://calendar.virginia.edu'),
  (36, 33, 'Hokie Cyber Defense Night', 'A hands-on cybersecurity practice session for student teams.', '2026-11-12 18:00', '2026-11-12 21:00', 'Torgersen Hall', 37.2296, -80.4203, 'https://calendar.vt.edu'),
  (37, 34, 'Outdoor Tech Demo Day', 'Teams demo apps and sensors for trails, weather, and campus mobility.', '2026-11-14 13:00', '2026-11-14 16:00', 'University Memorial Center', 40.0068, -105.2704, 'https://calendar.colorado.edu'),
  (38, 35, 'Media Arts Prototype Night', 'Students share tools for video, design, and live performance.', '2026-11-07 18:30', '2026-11-07 20:30', 'Erb Memorial Union', 44.0449, -123.0730, 'https://calendar.uoregon.edu'),
  (39, 36, 'Food Systems Innovation Fair', 'Student teams explore agriculture, logistics, and sustainability projects.', '2026-11-10 16:00', '2026-11-10 18:00', 'Memorial Union', 44.5652, -123.2789, 'https://events.oregonstate.edu'),
  (40, 37, 'Social Impact Tech Lab', 'Students prototype civic and nonprofit tools with local partners.', '2026-11-13 17:00', '2026-11-13 19:00', 'Duncan Student Center', 41.6982, -86.2347, 'https://events.nd.edu'),
  (41, 38, 'Music City Creator Meetup', 'A meetup for event apps, music discovery, and creator tools.', '2026-11-06 18:00', '2026-11-06 20:00', 'Sarratt Student Center', 36.1444, -86.8039, 'https://calendar.vanderbilt.edu'),
  (42, 39, 'Energy Transition Hack Night', 'Students build prototypes for energy data, grids, and climate decisions.', '2026-11-12 18:00', '2026-11-12 21:00', 'Duncan Hall', 29.7192, -95.3994, 'https://events.rice.edu'),
  (43, 40, 'Ocean Data Innovation Session', 'A project night for marine science, weather, and coastal resilience tools.', '2026-11-09 17:30', '2026-11-09 19:30', 'Shalala Student Center', 25.7192, -80.2792, 'https://events.miami.edu');

DELETE FROM colleges
WHERE id NOT IN (1, 2, 5, 14, 17, 21, 24, 29, 31, 34, 35, 36, 40);

DELETE FROM events
WHERE college_id NOT IN (1, 2, 5, 14, 17, 21, 24, 29, 31, 34, 35, 36, 40);
