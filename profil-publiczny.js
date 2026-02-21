document.addEventListener('DOMContentLoaded', () => {
    inicjalizujProfilPubliczny();
});

async function inicjalizujProfilPubliczny() {
    // 1. Pobieramy nick z URL (np. profil-publiczny.html?user=Marek)
    const params = new URLSearchParams(window.location.search);
    const login = params.get('user');

    if (!login) {
        window.location.href = 'index.html'; // Brak parametru -> Wyrzucamy
        return;
    }

    await zaladujDaneOsobowe(login);
    await zaladujGarazUzytkownika(login);
}

// Pobiera avatar, datę rejestracji itp.
// Pobiera avatar, datę rejestracji itp.
async function zaladujDaneOsobowe(login) {
    const header = document.getElementById('public-profile-header');
    
    try {
        const res = await fetch(`/api/public-profile/${login}`);
        if (!res.ok) throw new Error("Nie znaleziono użytkownika");
        
        const user = await res.json();

        // Formatowanie daty
        const dataRej = new Date(user.data_rejestracji).toLocaleDateString('pl-PL');
        
        // --- NAPRAWA AVATARA ---
        let avatarHtml;
        if (user.avatar && user.avatar !== 'null') {
            // Jeśli ścieżka w bazie to np. "/img/avatars/plik.jpg", używamy jej bezpośrednio
            // Jeśli to sama nazwa pliku, dodajemy folder.
            let src = user.avatar.startsWith('/') ? user.avatar : '/img/avatars/' + user.avatar;
            avatarHtml = `<img src="${src}" alt="${user.login}" class="profile-avatar-large">`;
        } else {
            // Domyślna ikona SVG (jeśli brak zdjęcia)
            avatarHtml = `
                <div class="profile-avatar-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>`;
        }
        // -----------------------

        // Generujemy HTML
        header.innerHTML = `
            <div class="avatar-large-container">
                ${avatarHtml}
            </div>
            <h1 class="profile-name-display">${user.login}</h1>
            <p class="profile-role-badge" data-role="${user.rola}">${user.rola.toUpperCase()}</p>
            <p class="profile-join-date">Dołączył: <b>${dataRej}</b></p>
            <p class="profile-stats">Suma polubień: <b id="profile-total-likes">0</b> ❤️</p>
        `;

        document.getElementById('garage-title').innerText = `GARAŻ UŻYTKOWNIKA ${user.login.toUpperCase()}`;

        const likesElem = document.getElementById('profile-total-likes');
        if (likesElem) {
        likesElem.textContent = user.total_likes;
}
    } catch (err) {
        console.error(err);
        header.innerHTML = `<h3>Nie znaleziono użytkownika "${login}"</h3>`;
    }
}

// Pobiera tylko ZATWIERDZONE auta tego użytkownika
async function zaladujGarazUzytkownika(login) {
    const grid = document.getElementById('user-garage-grid');
    
    try {
        const res = await fetch(`/api/public-garage/${login}`);
        const auta = await res.json();

        if (auta.length === 0) {
            // Pusty stan - używamy klas, które już mamy w CSS (te same co w Ulubione/Kolekcja)
            grid.classList.add('grid-off-mode');
            grid.innerHTML = `
                <div class="no-result-box no-results-box">
                    <h3>Garaż jest pusty 💨</h3>
                    <p>Ten użytkownik nie dodał jeszcze żadnego pojazdu lub czekają one na weryfikację.</p>
                </div>
            `;
        } else {
            grid.classList.remove('grid-off-mode');
            if (typeof renderujKafelki === 'function') {
                renderujKafelki(grid, auta);
            }
        }
    } catch (err) {
        console.error(err);
    }
}