/* ================================================================================= */
/* ======================== 1. NARZĘDZIA (TOASTY, POMOCNICZE) ====================== */
/* ================================================================================= */

// Funkcja wyświetlająca dymek z powiadomieniem
function pokazPowiadomienie(tekst) {
    const toast = document.getElementById("toast-box");
    if (!toast) return;

    toast.textContent = tekst;
    toast.classList.add("show");

    // Ukryj po 3 sekundach
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Funkcja pobierająca parametry z URL (np. ?id=5)
function pobierzParametrUrl(nazwa) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nazwa);
}

/* ================================================================================= */
/* =========================== 2. RENDEROWANIE KAFELKÓW ============================ */
/* ================================================================================= */

// Generuje HTML dla listy aut (używane w index.html i kolekcja.html)
function renderujKafelki(target, dane) {
    if (!target) return;

    if (dane.length === 0) {
        target.innerHTML = '<p class="render-error">Nie znaleziono pojazdów.</p>';
        return;
    }

    target.innerHTML = dane.map(auto => {
        // Ustalanie ścieżki zdjęcia (zabezpieczenie przed brakiem zdjęcia)
        const zdjecie = auto.zdjecie_url ? `img/auta/${auto.zdjecie_url}` : 'img/default-car.png';

        return `
        <a href="auto-detale.html?id=${auto.id}" class="card-link">
            <div class="card-mini">
                <div class="card-mini-img-wrapper">
                    <img src="${zdjecie}" alt="${auto.marka} ${auto.model}" loading="lazy">
                </div>
                <div class="card-mini-body">
                    <h3>${auto.marka}</h3>
                    <h4>${auto.model}</h4>
                    <p>${auto.silnik || 'Brak danych'}</p>
                    <p>${auto.moc ? auto.moc + ' KM' : '-'}</p>
                    <h5>${auto.rok_produkcji}</h5>
                </div>
            </div>
        </a>
        `;
    }).join('');
}

/* ================================================================================= */
/* ====================== 3. NAWIGACJA I SESJA UŻYTKOWNIKA ========================= */
/* ================================================================================= */

// script.js
function aktualizujNawigacje() {
    const login = localStorage.getItem('zalogowanyUzytkownik');
    const rola = localStorage.getItem('zalogowanaRola');
    const nazwa = localStorage.getItem('zalogowanaNazwa');
    const avatarUrl = localStorage.getItem('zalogowanyAvatar');
    
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');
    const notifTrigger = document.getElementById('notif-trigger'); // Nasz dzwonek w HTML

    const loginBtn = document.querySelector('.btn-primary');
    const existingProfile = document.querySelector('.user-profile-container');
    const targetElement = loginBtn || existingProfile;

    if (login && navLinks && navActions) {
        // 1. Zarządzanie dzwonkiem (SVG musi być w HTML każdego pliku)
        if (notifTrigger) {
            notifTrigger.classList.remove('hidden');
            sprawdzPowiadomienia(login); // Wywołujemy sprawdzanie "złotego" stanu
        }

        // 2. Link weryfikacji (bez stylu inline!)
        if (rola === 'admin' && !document.getElementById('nav-verify')) {
            const liVerify = document.createElement('li');
            liVerify.id = 'nav-verify';
            liVerify.innerHTML = `<a href="weryfikacja.html" class="nav-admin-link">PANEL ADMINISTRATORA</a>`;
            navLinks.appendChild(liVerify);
        }

        // 3. Przycisk DODAJ AUTO
        if (!document.getElementById('btn-add-car-nav')) {
            const addCarBtn = document.createElement('a');
            addCarBtn.href = 'dodaj-auto.html';
            addCarBtn.className = 'btn-add-car';
            addCarBtn.id = 'btn-add-car-nav';
            addCarBtn.textContent = '+ DODAJ AUTO';
            navActions.prepend(addCarBtn);
        }

        // 4. Budowanie dropdownu profilu
        if (targetElement) {
            const tekstDoWyswietlenia = nazwa || login;
            let avatarHtml = (avatarUrl && avatarUrl !== "null" && avatarUrl !== "undefined") 
                ? `<img src="${avatarUrl}" alt="Avatar">`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

            targetElement.outerHTML = `
            <div class="user-profile-container">
                <div class="user-name">${tekstDoWyswietlenia}</div>
                <div class="user-avatar-nav">${avatarHtml}</div>
                <div class="user-dropdown">
                    <a href="profil-publiczny.html?user=${encodeURIComponent(login)}" class="dropdown-item">👤 Profil</a>
                    <a href="moje-auta.html" class="dropdown-item">🚗 Moje pojazdy</a>
                    <a href="ulubione.html" class="dropdown-item">❤️ Ulubione</a>
                    <a href="profil.html" class="dropdown-item">⚙️ Ustawienia</a>
                    <div class="logout-btn" id="logout-btn">🚪 Wyloguj się</div>
                </div>
            </div>`;

            setTimeout(() => {
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) logoutBtn.addEventListener('click', wylogujSie);
            }, 100);
        }
    } else {
        // Jeśli wylogowany - ukryj dzwonek
        if (notifTrigger) notifTrigger.classList.add('hidden');
    }
}

function wylogujSie() {
    localStorage.clear(); // Czyści wszystko (login, rolę, avatar)
    localStorage.setItem('toastMessage', 'Wylogowano pomyślnie!');
    window.location.href = '/'; // Przekierowanie na stronę główną
}

/* ================================================================================= */
/* ============================ 4. INICJALIZACJA STRONY ============================ */
/* ================================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Uruchom logikę nawigacji
    aktualizujNawigacje();

    // 2. Sprawdź czy jest komunikat do wyświetlenia (np. po przekierowaniu)
    const msg = localStorage.getItem('toastMessage');
    if (msg) {
        pokazPowiadomienie(msg);
        localStorage.removeItem('toastMessage');
    }

    // 3. Obsługa Hamburgera (Menu mobilne)
    const hamburgerBtn = document.getElementById('hamburger-icon');
    const navLinksList = document.querySelector('.nav-links');

    if (hamburgerBtn && navLinksList) {
        hamburgerBtn.addEventListener('click', () => {
            // Przełączanie klasy w CSS (trzeba będzie dodać klasę .active w CSS dla RWD)
            navLinksList.classList.toggle('active');
            
            // Opcjonalnie: Zmiana wyglądu ikony hamburgera
            hamburgerBtn.classList.toggle('open');
        });
    }
});

/* ================================================================================= */
/* ========================== POWIADOMIENIA (LOGIKA) =============================== */
/* ================================================================================= */

// 1. Sprawdza czy zapalić "złoty" kolor (wywoływane przy ładowaniu strony)
async function sprawdzPowiadomienia(login) {
    const dzwonek = document.getElementById('notif-trigger');
    if (!dzwonek) return;

    try {
        // ZMIANA: Dodajemy ?t=... żeby ominąć cache przeglądarki
        const res = await fetch(`/api/powiadomienia/${login}?t=${Date.now()}`);
        if (!res.ok) return;
        const dane = await res.json();
        
        const maNowe = dane.some(n => n.czy_przeczytane === false);
        
        if (maNowe) dzwonek.classList.add('has-new');
        else dzwonek.classList.remove('has-new');
        
    } catch (err) {
        console.error("Błąd dzwonka:", err);
    }
}

// 2. Obsługa interakcji (Kliknięcia)
document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('notif-trigger');
    const dropdown = document.getElementById('notif-dropdown');

    // A. Obsługa usuwania ("X") - delegacja zdarzeń
    if (dropdown) {
        dropdown.addEventListener('click', async (e) => {
            // Sprawdzamy czy kliknięto w X
            if (e.target.classList.contains('notif-delete-btn')) {
                e.stopPropagation(); // Nie zamykaj dropdownu
                const id = e.target.getAttribute('data-id');
                await usunPowiadomienie(id, e.target);
            }
        });
    }

    // B. Kliknięcie w dzwonek
    if (trigger && dropdown) {
        trigger.addEventListener('click', async (e) => {
            // Ignoruj kliknięcia wewnątrz dropdownu (żeby się nie zamykał przy czytaniu)
            if (e.target.closest('.notif-dropdown')) return;

            // Przełącz widoczność
            dropdown.classList.toggle('hidden');

            // JEŚLI OTWIERAMY:
            if (!dropdown.classList.contains('hidden')) {
                const login = localStorage.getItem('zalogowanyUzytkownik');
                
                // 1. Ładujemy listę
                await zaladujListePowiadomien(login, dropdown);

                // 2. Jeśli dzwonek był złoty, oznaczamy wszystko jako przeczytane
                if (trigger.classList.contains('has-new')) {
                    await fetch(`/api/powiadomienia/przeczytane/${login}`, { method: 'PUT' });
                    trigger.classList.remove('has-new'); // Zgaś złoty kolor
                }
            }
        });

        // C. Kliknięcie poza dzwonkiem -> Zamknij
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
});

// 3. Renderowanie HTML listy
async function zaladujListePowiadomien(login, container) {
    try {
        // ZMIANA: Tutaj też omijamy cache
        const res = await fetch(`/api/powiadomienia/${login}?t=${Date.now()}`);
        const dane = await res.json();

        if (dane.length === 0) {
            container.innerHTML = '<div class="notif-empty">Brak powiadomień 📭</div>';
        } else {
            container.innerHTML = dane.map(n => `
                <div class="notif-item ${n.czy_przeczytane ? '' : 'unread'}">
                    <button class="notif-delete-btn" data-id="${n.id}" title="Usuń">&times;</button>
                    <span>${n.tresc}</span>
                    <small>${new Date(n.data_dodania).toLocaleString()}</small>
                </div>
            `).join('');
        }
    } catch (err) {
        container.innerHTML = '<div class="notif-empty">Błąd ładowania.</div>';
    }
}

// 4. Funkcja usuwająca (X)
async function usunPowiadomienie(id, btnElement) {
    try {
        const res = await fetch(`/api/powiadomienia/${id}`, { method: 'DELETE' });
        if (res.ok) {
            // Usuwamy element z listy
            const item = btnElement.closest('.notif-item');
            item.remove();

            // Sprawdzamy czy lista nie zrobiła się pusta
            const container = document.getElementById('notif-dropdown');
            if (container.children.length === 0) {
                container.innerHTML = '<div class="notif-empty">Brak powiadomień 📭</div>';
            }
        }
    } catch (err) {
        console.error("Błąd usuwania:", err);
    }
}

/* ================================================================================= */
/* ======================== 5. NAWIGACJA MOBILNA (HAMBURGER) ======================= */
/* ================================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-icon');
    const nav = document.getElementById('main-nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            // Przełączamy klasę .nav-active na głównym kontenerze nawigacji
            nav.classList.toggle('nav-active');
            
            // Opcjonalnie: blokujemy przewijanie strony, gdy menu jest otwarte
            document.body.classList.toggle('no-scroll');
        });
    }

    // Zamknij menu po kliknięciu w link (żeby nie wisiało otwarte po przejściu)
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-active');
            document.body.classList.remove('no-scroll');
        });
    });
});