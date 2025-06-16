let users = []
let currentUserIndex = 0
let genderPreference = 'any';


// fetching users from API
async function fetchUsers() {
    try {
        let url = 'https://randomuser.me/api/?results=10';
        if (genderPreference !== 'any') {
            url += `&gender=${genderPreference}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok.");

        const data = await response.json();
        users = data.results;
        currentUserIndex = 0;
        renderProfile();
    } catch (error) {
        console.log("Failed to fetch users:", error);
    }
}



//gender filter.

document.getElementById('gender-filter').addEventListener('change', (e) => {
    genderPreference = e.target.value;
    currentUserIndex = 0;

    // Show "Loading profiles..." message
    const profileContainer = document.querySelector('#profile-card-container');
    profileContainer.innerHTML = `<h2>Loading profiles...</h2>`;
    fetchUsers(); // Refetch users with new preference
});




// 

const profileContainer = document.querySelector('#profile-card-container')

function renderProfile() {

    // // also fetches 10 more profiles, if clicked on the button.
    // if (currentUserIndex >= users.length) {
    //     profileContainer.innerHTML = `
    //     <h2>No more profiles.</h2>
    //     <button id="load-more-btn">🔄 Get More Profiles</button>
    // `;

    //     document.getElementById('load-more-btn').addEventListener('click', async () => {
    //         await fetchMoreProfiles(); // We'll define this next
    //     });
    //     return;
    // }

    if (currentUserIndex >= users.length) {
        profileContainer.innerHTML = `<h2>Loading more profiles...</h2>`;
        fetchMoreProfiles();  //  Automatically load more profiles
        return
    }


    // clearing the previous card
    profileContainer.innerHTML = ''

    const user = users[currentUserIndex]
    const profilePic = document.createElement('div')
    profilePic.classList.add('profile-pic')
    profilePic.style.backgroundImage = `url(${user.picture.large})`

    const profileDetails = document.createElement('div')
    profileDetails.classList.add('profile-details')
    profileDetails.innerHTML = `<h2>${user.name.first} ${user.name.last}, ${user.dob.age}</h2>
                                <p>${user.gender}</p>
                                <p>${user.location.city}, ${user.location.country}</p>`;

    profileContainer.appendChild(profilePic)
    profileContainer.appendChild(profileDetails)
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch profiles
    fetchUsers();

    // 2. Load previous matches into the sidebar
    loadAndRenderMatches();
});




// Event Handling
document.getElementById('like-btn').addEventListener('click', () => {
    const user = users[currentUserIndex]; // get current user
    console.log('Liked:', user.name.first);

    // Save to matches
    let matches = JSON.parse(localStorage.getItem('matches')) || [];
    // matches.push(user);
    // localStorage.setItem('matches', JSON.stringify(matches));
    // Check if the user already exists in matches
    const alreadyMatched = matches.some(match => match.login.uuid === user.login.uuid);
    if (!alreadyMatched) {
        matches.push(user);
        localStorage.setItem('matches', JSON.stringify(matches));
    }


    // Animate
    const card = profileContainer.querySelector('.profile-pic');
    card.style.transform = 'translateX(100px) rotate(20deg)';

    setTimeout(() => {
        currentUserIndex++;
        renderProfile();
        loadAndRenderMatches(); // reload match list after update
    }, 300);
});


async function fetchMoreProfiles() {
    try {
        let url = 'https://randomuser.me/api/?results=10';
        if (genderPreference !== 'any') {
            url += `&gender=${genderPreference}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch more users.");

        const data = await response.json();
        users = data.results;
        currentUserIndex = 0;
        renderProfile();
    } catch (error) {
        console.error("Error fetching more profiles:", error);
    }
}


// Even if no new match is added, it’s better to keep the sidebar in sync (for future logic too):
document.getElementById('nope-btn').addEventListener('click', () => {
    console.log('Skipped:', users[currentUserIndex].name.first);
    // Best Practice: Add a visual effect before moving on
    const card = profileContainer.querySelector('.profile-pic');
    card.style.transform = 'translateX(-100px) rotate(-20deg)';

    // Use setTimeout to allow the animation to be seen
    setTimeout(() => {
        currentUserIndex++;
        renderProfile();
        loadAndRenderMatches(); // <--- ADD THIS HERE TOO
    }, 300);
});


// app.js (continued)

const matchesList = document.getElementById('matches-list');

function loadAndRenderMatches() {
    const matches = JSON.parse(localStorage.getItem('matches')) || [];

    if (matches.length === 0) {
        matchesList.innerHTML = '<li>No matches yet!</li>';
        return;
    }

    matchesList.innerHTML = matches.map(match => `
        <li data-id="${match.login.uuid}">
            <img src="${match.picture.thumbnail}" alt="${match.name.first}">
            <span>${match.name.first}</span>
        </li>
    `).join('');
}


// opening the messaging option when clicked on any your matches.
matchesList.addEventListener('click', e => {
    const targetLi = e.target.closest('li');
    if (targetLi && targetLi.dataset.id) {
        openChat(targetLi.dataset.id);
    }
});


function openChat(userId) {
    const matches = JSON.parse(localStorage.getItem('matches')) || [];
    const user = matches.find(match => match.login.uuid === userId);

    const messages = JSON.parse(localStorage.getItem(`chat-${userId}`)) || [];

    const chatBox = document.getElementById('secret-messenger');
    const form = document.getElementById('message-form');
    const input = document.getElementById('message-input');

    // Clear and re-attach the chat body
    let chatBody = chatBox.querySelector('.chat-body');
    if (chatBody) chatBody.remove();
    chatBody = document.createElement('div');
    chatBody.className = 'chat-body';
    chatBox.insertBefore(chatBody, form);

    chatBody.innerHTML = messages.map(msg => `<div>${msg}</div>`).join('');

    form.onsubmit = e => {
        e.preventDefault();
        const newMsg = input.value;
        messages.push(newMsg);
        localStorage.setItem(`chat-${userId}`, JSON.stringify(messages));
        chatBody.innerHTML += `<div>${newMsg}</div>`;
        input.value = '';
    };

    document.getElementById('overlay').classList.remove('hidden');
    chatBox.classList.remove('hidden');

    document.getElementById('chat-header').innerHTML = `
    <span>Messaging ${user.name.first}</span>
    <button id="close-chat">✖️</button>`;

    // Add event listener for close button
    document.getElementById('close-chat').addEventListener('click', () => {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('secret-messenger').classList.add('hidden');
    });

}


document.getElementById('clear-matches-btn').addEventListener('click', () => {
    // Clear match data
    const matches = JSON.parse(localStorage.getItem('matches')) || [];

    // Remove each user's chat history
    matches.forEach(match => {
        localStorage.removeItem(`chat-${match.login.uuid}`);
    });

    // Clear match list and reload UI
    localStorage.removeItem('matches');
    loadAndRenderMatches();

    alert("All matches cleared!");
});