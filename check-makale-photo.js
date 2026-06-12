async function run() {
    try {
        console.log('Fetching Makale Traore profile from production API...');
        const response = await fetch('https://voix-avenir-backend.onrender.com/api/users');
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            return;
        }
        const mentors = await response.json() || [];
        const makale = mentors.find(m => m.name.includes('Makale'));
        if (!makale) {
            console.error('Makale Traore not found in the list!');
            return;
        }
        
        console.log(`ID: ${makale._id || makale.id}`);
        console.log(`Name: ${makale.name}`);
        console.log(`Photo field is present: ${!!makale.photo}`);
        if (makale.photo) {
            console.log(`Photo length: ${makale.photo.length}`);
            console.log(`Photo starts with: "${makale.photo.substring(0, 100)}"`);
            console.log(`Photo ends with: "${makale.photo.substring(makale.photo.length - 100)}"`);
            
            // Check if there are spaces or invalid characters
            const hasSpaces = makale.photo.includes(' ');
            console.log(`Photo contains spaces: ${hasSpaces}`);
            if (hasSpaces) {
                console.log('Space indexes:', [...makale.photo.matchAll(/ /g)].map(m => m.index));
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
