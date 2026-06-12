async function run() {
    try {
        console.log('Fetching mentors from live backend via native fetch...');
        const response = await fetch('https://voix-avenir-backend.onrender.com/api/users');
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            return;
        }
        const mentors = await response.json() || [];
        console.log(`Found ${mentors.length} mentors:`);
        for (const m of mentors) {
            console.log(`\nID: ${m._id || m.id}`);
            console.log(`Name: ${m.name}`);
            console.log(`Role: ${m.role}`);
            console.log(`City: "${m.city}"`);
            console.log(`Profession: "${m.profession}"`);
            console.log(`Expertise: ${JSON.stringify(m.expertise)}`);
            console.log(`Photo: ${m.photo ? m.photo.substring(0, 50) + '...' : 'NULL'}`);
        }
    } catch (error) {
        console.error('Error fetching production mentors:', error.message);
    }
}

run();
