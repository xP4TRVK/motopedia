/* ================================================================================= */
/* =========================== 1. INICJALIZACJA I DANE ============================= */
/* ================================================================================= */

let currentPhotoIndex = 0;
let galleryData = [];

document.addEventListener('DOMContentLoaded', () => {
    zaladujDetale();
    sprawdzUprawnieniaAdmina();
    zaladujSekcjeUlubionych();
    zaladujKomentarze();
    zaladujPodobneAuta();
});

// Pobiera ID z URL i ściąga dane o aucie
async function zaladujDetale() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); 

    if (!id) {
        pokazPowiadomienie("Błąd: Brak ID pojazdu.");
        return;
    }

    try {
        const response = await fetch(`/api/pojazdy/${id}`);
        if (!response.ok) throw new Error("Nie znaleziono pojazdu");
        
        const auto = await response.json();

        // Wypełnianie pól tekstowych
        ustawTekst('auto-nazwa', `${auto.marka} ${auto.model}`);
        ustawTekst('auto-rok', `Rok produkcji: ${auto.rok_produkcji}`);
        ustawTekst('auto-silnik', auto.silnik);
        ustawTekst('auto-moc', `${auto.moc} KM`);
        ustawTekst('auto-opis', auto.opis || "Brak opisu.");

        // Obsługa Galerii
        galleryData = auto.galeria || [];
        
        // Jeśli nie ma galerii w tabeli 'zdjecia', użyj miniaturki z tabeli 'pojazdy'
        if (galleryData.length === 0 && auto.zdjecie_url) {
            galleryData = [{ url: auto.zdjecie_url }];
        }

        renderujGalerie();

    } catch (err) {
        console.error("Błąd: ", err);
        document.querySelector('.details-grid').innerHTML = '<h2 class="text-error">Nie znaleziono pojazdu.</h2>';
    }
}

// Pomocnicza funkcja (żeby nie pisać 10 razy if(document...))
function ustawTekst(id, tekst) {
    const el = document.getElementById(id);
    if (el) el.innerText = tekst;
}

/* ================================================================================= */
/* ============================ 2. OBSŁUGA GALERII ================================= */
/* ================================================================================= */

function renderujGalerie() {
    aktualizujWidok(); // Wyświetla pierwsze zdjęcie
    renderujMiniaturki();
}

// Generowanie miniaturek na dole
function renderujMiniaturki() {
    const thumbsContainer = document.getElementById('thumbnails-container');
    if (!thumbsContainer) return;

    thumbsContainer.innerHTML = galleryData.map((img, index) => `
        <img src="img/auta/${img.url}" 
             class="thumb-img" 
             onclick="ustawIndeks(${index})" 
             alt="Miniatura">
    `).join('');
    
    aktualizujKlasyMiniaturek();
}

// Główna funkcja zmiany (obsługuje strzałki lewo/prawo)
window.zmienZdjecie = (kierunek) => {
    currentPhotoIndex += kierunek;

    // Pętla (jak dojdziesz do końca, wraca na początek)
    if (currentPhotoIndex < 0) currentPhotoIndex = galleryData.length - 1;
    if (currentPhotoIndex >= galleryData.length) currentPhotoIndex = 0;

    aktualizujWidok();
};

// Funkcja dla kliknięcia w miniaturkę
window.ustawIndeks = (index) => {
    currentPhotoIndex = index;
    aktualizujWidok();
};

// Funkcja odświeżająca zdjęcie na stronie I w lightboxie
function aktualizujWidok() {
    if (!galleryData[currentPhotoIndex]) return;
    const url = `img/auta/${galleryData[currentPhotoIndex].url}`;

    // 1. Aktualizuj zdjęcie na stronie
    const mainImg = document.getElementById('main-photo');
    if (mainImg) mainImg.src = url;

    // 2. Aktualizuj zdjęcie w Lightboxie (jeśli istnieje)
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) lightboxImg.src = url;

    // 3. Aktualizuj licznik w Lightboxie
    const counter = document.getElementById('lightbox-counter');
    if (counter) counter.innerText = `${currentPhotoIndex + 1} / ${galleryData.length}`;

    aktualizujKlasyMiniaturek();
}

function aktualizujKlasyMiniaturek() {
    const thumbs = document.querySelectorAll('.thumb-img');
    thumbs.forEach((t, i) => {
        if (i === currentPhotoIndex) t.classList.add('active');
        else t.classList.remove('active');
    });
}

/* --- LIGHTBOX LOGIKA --- */

window.otworzLightbox = () => {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
        modal.classList.add('modal-active');
        aktualizujWidok(); // Upewnij się, że wczytane jest dobre zdjęcie
    }
};

window.zamknijLightbox = () => {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.remove('modal-active');
};

// Obsługa klawiatury (Escape i Strzałki)
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightbox-modal');
    // Działa tylko gdy Lightbox jest otwarty
    if (modal && modal.classList.contains('modal-active')) {
        if (e.key === 'Escape') zamknijLightbox();
        if (e.key === 'ArrowLeft') zmienZdjecie(-1);
        if (e.key === 'ArrowRight') zmienZdjecie(1);
    }
});

/* ================================================================================= */
/* ========================== 3. FUNKCJE ADMINISTRATORA ============================ */
/* ================================================================================= */

function sprawdzUprawnieniaAdmina() {
    const rola = localStorage.getItem('zalogowanaRola');
    
    // Pobieramy nowy kontener z HTML (już bez stylów w JS!)
    const container = document.getElementById('admin-actions-container');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    // Tylko admin widzi te przyciski
    if (rola === 'admin' && container && id) {

        container.innerHTML = `
            <a href="edycja-auto?id=${id}&zrodlo=detale" class="btn-primary">EDYTUJ</a>
            <button class="btn-danger" onclick="otworzModalUsuwaniaPojazdu()">USUŃ POJAZD</button>
        `;
    }
}

/* ======================== MODAL USUWANIA POJAZDU (ADMIN) ======================== */

// 1. Wywoływane przyciskiem "USUŃ" w panelu admina (na stronie detali)
window.otworzModalUsuwaniaPojazdu = () => {
    const modal = document.getElementById('delete-vehicle-modal');
    if (modal) modal.classList.add('modal-active');
};

// 2. Zamykanie
window.zamknijModalPojazduAdmin = () => {
    const modal = document.getElementById('delete-vehicle-modal');
    if (modal) modal.classList.remove('modal-active');
};

// 3. Potwierdzenie (Fizyczne usunięcie)
window.potwierdzUsunieciePojazduAdmin = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) return;

    try {
        const response = await fetch(`/api/pojazdy/${id}?login=${login}`, { 
            method: 'DELETE' 
        });
        
        if (response.ok) {
            window.location.href = 'kolekcja.html'; // Wyrzuca do kolekcji po usunięciu
        } else {
            alert("Nie udało się usunąć pojazdu.");
        }
    } catch (err) {
        console.error(err);
        alert("Błąd serwera.");
    }
};


/* ================================================================================= */
/* ========================== 4. SYSTEM ULUBIONYCH (SERDUSZKA) ===================== */
/* ================================================================================= */

async function zaladujSekcjeUlubionych() {
    const container = document.getElementById('user-actions-container');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const login = localStorage.getItem('zalogowanyUzytkownik');

    if (!container || !id) return;

    try {
        // 1. Pobierz status z serwera
        // Jeśli użytkownik niezalogowany, wysyłamy samo ID. Jeśli zalogowany, dodajemy ?login=...
        let url = `/api/ulubione/status/${id}`;
        if (login) url += `?login=${login}`;

        const response = await fetch(url);
        const data = await response.json();

        // 2. Wygeneruj przycisk
        const isLikedClass = data.isLiked ? 'liked' : '';
        const likeText = data.likes === 1 ? 'osoba lubi to' : 'osób lubi to';

        container.innerHTML = `
            <button id="like-btn" class="btn-like ${isLikedClass}" onclick="przelaczUlubione(${id})">
                <svg viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span id="like-count">${data.likes}</span>
                <span class="like-label">Polubień</span>
            </button>
        `;

    } catch (err) {
        console.error("Błąd ładowania ulubionych:", err);
    }
}

// Funkcja kliknięcia
window.przelaczUlubione = async (pojazdId) => {
    const login = localStorage.getItem('zalogowanyUzytkownik');

    // Jeśli niezalogowany -> przekieruj lub poinformuj
    if (!login) {
        const modal = document.getElementById('login-required-modal');
        if (modal) {
            modal.classList.add('modal-active');
        } else {
            // Fallback (tylko na wszelki wypadek)
            window.location.href = 'logowanie.html';
        }
        return; // Przerywamy funkcję
    }

    const btn = document.getElementById('like-btn');
    const countSpan = document.getElementById('like-count');

    // Optymistyczna aktualizacja UI (zanim serwer odpowie, my już zmieniamy kolor - lepsze wrażenie szybkości)
    const wasLiked = btn.classList.contains('liked');
    btn.classList.toggle('liked');
    
    // Aktualizacja licznika "na żywo" w przeglądarce
    let currentCount = parseInt(countSpan.innerText);
    if (wasLiked) {
        countSpan.innerText = currentCount - 1; // Odejmij
    } else {
        countSpan.innerText = currentCount + 1; // Dodaj
    }

    // Wysyłka do serwera w tle
    try {
        await fetch('/api/ulubione/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, pojazdId })
        });
        // Nie musimy nic robić po sukcesie, bo UI już zaktualizowaliśmy
    } catch (err) {
        console.error("Błąd zapisu like:", err);
        alert("Wystąpił błąd połączenia.");
        // Cofnij zmiany w razie błędu
        btn.classList.toggle('liked'); 
    }
};

/* ================================================================================= */
/* ========================== 5. SYSTEM KOMENTARZY ================================= */
/* ================================================================================= */

async function zaladujKomentarze() {
    const list = document.getElementById('comments-list');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    // Obsługa widoczności formularza
    const addBox = document.getElementById('add-comment-box');
    const loginMsg = document.getElementById('login-to-comment-msg');
    
    const userLogin = localStorage.getItem('zalogowanyUzytkownik'); // Nasz prywatny login
    const rola = localStorage.getItem('zalogowanaRola');
    
    if (userLogin) {
        if(addBox) addBox.classList.remove('hidden');
        if(loginMsg) loginMsg.classList.add('hidden');
    } else {
        if(addBox) addBox.classList.add('hidden');
        if(loginMsg) loginMsg.classList.remove('hidden');
    }

    if (!id || !list) return;

    try {
        const response = await fetch(`/api/komentarze/${id}`);
        const komentarze = await response.json();

        if (komentarze.length === 0) {
            list.innerHTML = '<p class="comment-empty">Brak komentarzy. Bądź pierwszy!</p>';
            return;
        }

        list.innerHTML = komentarze.map(k => {
            const data = new Date(k.data_dodania).toLocaleString('pl-PL', { 
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            // Wyświetlamy NAZWĘ, a nie login (jeśli dostępna)
            const authorDisplayName = k.nazwa_uzytkownika || k.uzytkownik_login;

            // Link do profilu publicznego (używamy nazwy wyświetlanej w URL!)
            const profileLink = `profil-publiczny.html?user=${encodeURIComponent(authorDisplayName)}`;

            let avatarSrc;
            if (k.avatar_url) {
                avatarSrc = k.avatar_url.startsWith('/') ? k.avatar_url : '/' + k.avatar_url;
            } else {
                avatarSrc = `https://ui-avatars.com/api/?name=${authorDisplayName}&background=random`;
            }

            // Przycisk usuwania (Tylko jeśli to mój komentarz LUB jestem adminem)
            // Uwaga: Porównujemy k.uzytkownik_login (bo to identyfikator w bazie) z naszym loginem z localStorage
            let deleteBtn = '';
            if (userLogin === k.uzytkownik_login || rola === 'admin') {
                deleteBtn = `<button class="btn-delete-comment" onclick="otworzModalUsuwania(${k.id})" title="Usuń">&times;</button>`;
            }

            return `
                <div class="comment-item">
                    <a href="${profileLink}">
                        <img src="${avatarSrc}" alt="Avatar" class="comment-avatar">
                    </a>
                    <div class="comment-content">
                        <div class="comment-header">
                            <a href="${profileLink}" class="comment-author-link">
                                ${authorDisplayName}
                            </a>
                            <div class="comment-contents">
                                <span class="comment-date">${data}</span>
                                ${deleteBtn}
                            </div>
                        </div>
                        <div class="comment-text">${k.tresc}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Błąd komentarzy:", err);
    }
}

/* ======================== MODAL USUWANIA KOMENTARZA ======================== */

let idKomentarzaDoUsuniecia = null; // Zmienna pomocnicza do przechowywania ID

// 1. Otwieranie modala (kliknięcie w "X" przy komentarzu)
window.otworzModalUsuwania = (id) => {
    idKomentarzaDoUsuniecia = id; // Zapamiętujemy, który komentarz chcemy usunąć
    const modal = document.getElementById('delete-comment-modal');
    // Używamy klasy .modal-active, tak jak ustaliliśmy przy sprzątaniu kodu
    if (modal) modal.classList.add('modal-active');
};

// 2. Zamykanie modala (Przycisk "ANULUJ" lub kliknięcie poza)
window.zamknijModalUsuwania = () => {
    idKomentarzaDoUsuniecia = null; // Czyścimy ID dla bezpieczeństwa
    const modal = document.getElementById('delete-comment-modal');
    if (modal) modal.classList.remove('modal-active');
};

// 3. Fizyczne usunięcie (Przycisk "USUŃ" wewnątrz modala)
window.potwierdzUsuniecieKomentarza = async () => {
    if (!idKomentarzaDoUsuniecia) return;

    try {
        const response = await fetch(`/api/komentarze/${idKomentarzaDoUsuniecia}`, { 
            method: 'DELETE' 
        });

        if (response.ok) {
            pokazPowiadomienie("Komentarz usunięty.");
            zaladujKomentarze();    // Odśwież listę komentarzy
            zamknijModalUsuwania(); // Zamknij modal po sukcesie
        } else {
            pokazPowiadomienie("Nie udało się usunąć komentarza.");
        }
    } catch (err) {
        console.error(err);
        pokazPowiadomienie("Błąd serwera.");
    }
};

// 4. Zamykanie modala kliknięciem w tło (opcjonalne, dla wygody)
document.addEventListener('click', (e) => {
    const modal = document.getElementById('delete-comment-modal');
    if (modal && e.target === modal) {
        zamknijModalUsuwania();
    }
});

/* ================================================================================= */
/* ===================== 6. ŁADOWANIE PODOBNYCH AUT W DETALACH ===================== */
/* ================================================================================= */

async function zaladujPodobneAuta() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const kontener = document.getElementById('podobne-auta-grid');

    if (!id || !kontener) return;

    try {
        const response = await fetch(`/api/pojazdy/podobne/${id}`);
        if (!response.ok) return;

        const auta = await response.json();

        if (auta.length === 0) {
            kontener.innerHTML = '<p class="render-error">Brak podobnych pojazdów.</p>';
            return;
        }

        // Korzystamy z globalnej funkcji renderujKafelki z pliku script.js
        if (typeof renderujKafelki === 'function') {
            renderujKafelki(kontener, auta);
        }

    } catch (err) {
        console.error("Błąd ładowania podobnych aut:", err);
    }
}

// 4. Dodawanie komentarza (z Toastem)
window.dodajKomentarz = async () => {
    const textInput = document.getElementById('comment-text');
    const tresc = textInput.value.trim();
    const params = new URLSearchParams(window.location.search);
    const pojazdId = params.get('id');
    const login = localStorage.getItem('zalogowanyUzytkownik');

    if (!tresc) {
        pokazPowiadomienie("Wpisz treść komentarza!"); // Toast zamiast alertu
        return;
    }

    try {
        const response = await fetch('/api/komentarze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pojazdId, login, tresc })
        });

        if (response.ok) {
            textInput.value = ""; // Wyczyść pole
            zaladujKomentarze();  // Odśwież listę
            // ZMIANA: Toast
            pokazPowiadomienie("Komentarz dodany pomyślnie!");
        } else {
            pokazPowiadomienie("Wystąpił błąd podczas dodawania.");
        }
    } catch (err) {
        console.error(err);
        pokazPowiadomienie("Błąd serwera.");
    }
};



