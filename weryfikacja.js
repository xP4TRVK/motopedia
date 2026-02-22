/* ================================================================================= */
/* ========================== 1. INICJALIZACJA (TYLKO ADMIN) ======================= */
/* ================================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    sprawdzUprawnienia();
    zaladujKolejke();
    zaladujStatystyki();
});

function sprawdzUprawnienia() {
    const rola = localStorage.getItem('zalogowanaRola');
    if (rola !== 'admin') {
        // Jeśli nie admin, wyrzuć na stronę główną
        window.location.href = 'index.html';
    }
}

/* ================================================================================= */
/* ========================== 2. POBIERANIE DANYCH ================================= */
/* ================================================================================= */

async function zaladujKolejke() {
    const listaWeryfikacji = document.getElementById('lista-weryfikacji');
    if (!listaWeryfikacji) return;

    try {
        const response = await fetch('/api/pojazdy/pending');
        if (!response.ok) throw new Error("Błąd pobierania danych");

        const auta = await response.json();

        if (auta.length === 0) {
            listaWeryfikacji.innerHTML = '<p class="verify-empty-msg">Brak zgłoszeń do weryfikacji. Wszystko czyste! 🧹</p>';
        } else {
            renderujListe(listaWeryfikacji, auta);
        }

    } catch (err) {
        console.error("Błąd ładowania listy:", err);
        listaWeryfikacji.innerHTML = '<p class="verify-warning-msg">Błąd połączenia z serwerem.</p>';
    }
}

/* ================================================================================= */
/* ========================== 3. RENDEROWANIE KART ================================= */
/* ================================================================================= */

function renderujListe(container, auta) {
    container.innerHTML = '';
    
    auta.forEach(auto => {
        const card = document.createElement('div');
        card.className = 'verify-card';

        // Ścieżka zdjęcia (zabezpieczenie braku fotki)
        const zdjecie = auto.zdjecie_url 
        ? (auto.zdjecie_url.startsWith('http') ? auto.zdjecie_url : `/img/auta/${auto.zdjecie_url}`) 
        : 'img/default-car.png';

        card.innerHTML = `
            <div class="verify-img">
                <img src="${zdjecie}" alt="Auto">
            </div>
            <div class="verify-info">
                <h2>${auto.marka} ${auto.model}</h2>
                <p>${auto.rok_produkcji} | ${auto.silnik || '-'} | ${auto.moc ? auto.moc + ' KM' : '-'}</p>
                <p class="verify-desc">${auto.opis || 'Brak opisu.'}</p>
                
                <div class="verify-actions">
                    <button class="btn-approve" onclick="window.decyzja(${auto.id}, 'approve')">ZATWIERDŹ</button>
                    <button class="btn-danger" onclick="window.decyzja(${auto.id}, 'reject')">ODRZUĆ</button>
                    <button class="btn-primary" onclick="window.idzDoEdycji(${auto.id})">EDYTUJ</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/* ================================================================================= */
/* ========================== 4. AKCJE (ZATWIERDŹ / ODRZUĆ / EDYTUJ) =============== */
/* ================================================================================= */

let idDoOdrzucenia = null; // Przechowuje ID auta, które chcemy odrzucić

// Główna funkcja wywoływana przez przyciski
window.decyzja = async (id, akcja) => {
    
    // SCENARIUSZ 1: ODRZUCANIE (Otwieramy modal)
    if (akcja === 'reject') {
        idDoOdrzucenia = id;
        const modal = document.getElementById('reject-modal');
        if (modal) modal.classList.add('modal-active');
        return; // Kończymy, czekamy na kliknięcie w modalu
    }

    // SCENARIUSZ 2: ZATWIERDZANIE (Robimy od razu)
    if (akcja === 'approve') {
        try {
            const response = await fetch(`/api/pojazdy/zatwierdz/${id}`, { method: 'PUT' });
            if (response.ok) {
                localStorage.setItem('toastMessage', 'Pojazd zatwierdzony!');
                location.reload();
            } else {
                pokazPowiadomienie("Błąd serwera przy zatwierdzaniu.");
            }
        } catch (err) {
            console.error(err);
        }
    }
};

// --- FUNKCJE OBSŁUGUJĄCE MODAL ---

// 1. Zamknij modal (Anuluj)
window.zamknijModalOdrzucania = () => {
    idDoOdrzucenia = null;
    document.getElementById('reject-modal').classList.remove('modal-active');
};

// 2. Wykonaj odrzucenie (Po kliknięciu przycisku w modalu)
window.potwierdzOdrzucenie = async () => {
    if (!idDoOdrzucenia) return;

    try {
        const response = await fetch(`/api/pojazdy/odrzuc/${idDoOdrzucenia}`, { method: 'PUT' });
        
        if (response.ok) {
            localStorage.setItem('toastMessage', 'Pojazd odrzucony (trafia do poprawek).');
            location.reload(); 
        } else {
            pokazPowiadomienie("Wystąpił błąd podczas odrzucania.");
        }
    } catch (err) {
        console.error("Błąd:", err);
        pokazPowiadomienie("Błąd serwera.");
    }
};

window.idzDoEdycji = (id) => {
    // Przekierowanie do edycji z flagą źródła, żeby edytor wiedział, gdzie wrócić
    window.location.href = `edycja-auto.html?id=${id}&zrodlo=weryfikacja`;
};

/* ================================================================================= */
/* ============================ 5. STATYSTYKI WITRYNY ============================== */
/* ================================================================================= */

async function zaladujStatystyki() {
    try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Wpisujemy liczby w odpowiednie miejsca
        document.getElementById('stats-users').innerText = data.users;
        document.getElementById('stats-cars').innerText = data.cars;
        document.getElementById('stats-pending').innerText = data.pending;
        
    } catch (err) {
        console.error("Błąd statystyk:", err);
    }
}