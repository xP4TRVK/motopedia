/* ================================================================================= */
/* ========================== 1. ZMIENNE GLOBALNE ================================== */
/* ================================================================================= */

let currentOffset = 0;       
const LIMIT = 10;            
let isLoading = false;       
let allLoaded = false;       
let currentSearchQuery = ''; 

// Obiekt trzymający stan filtrów (Domyślne wartości)
let filters = {
    sort: 'newest',
    power: 'all',
    year: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicjalizacja Wyszukiwania z URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSearchQuery = urlParams.get('search') || '';

    const inputSzukania = document.getElementById('searchInput');
    if (inputSzukania) inputSzukania.value = currentSearchQuery;

    if (currentSearchQuery) {
        const tytul = document.querySelector('.container-title-glow');
        if (tytul) tytul.innerText = `WYNIKI DLA: "${currentSearchQuery.toUpperCase()}"`;
    }

    // 2. Obsługa przycisku FILTRY (Pokaż/Ukryj Panel)
    const filterBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');

    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
            filterBtn.classList.toggle('active');
        });
    }

    // 3. Obsługa Zmian w Filtrach (3 Selecty)
    // Pobieramy elementy po ID (muszą pasować do HTML)
    const selectSort = document.getElementById('sortFilter');
    const selectPower = document.getElementById('powerFilter');
    const selectYear = document.getElementById('yearFilter');

    const aktualizujFiltry = () => {
        if (selectSort) filters.sort = selectSort.value;
        if (selectPower) filters.power = selectPower.value;
        if (selectYear) filters.year = selectYear.value;
        
        przeladujListeVehicles();
    };

    if (selectSort) selectSort.addEventListener('change', aktualizujFiltry);
    if (selectPower) selectPower.addEventListener('change', aktualizujFiltry);
    if (selectYear) selectYear.addEventListener('change', aktualizujFiltry);

    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // 1. Resetujemy Selecty w HTML na domyślne wartości
            if (selectSort) selectSort.value = 'newest';
            if (selectPower) selectPower.value = 'all';
            if (selectYear) selectYear.value = 'all';

            // 2. Resetujemy stan w JS
            filters.sort = 'newest';
            filters.power = 'all';
            filters.year = 'all';

            // 3. Przeładowujemy listę
            przeladujListeVehicles();
        });
    }

    // 4. Obsługa WYSZUKIWARKI (Kliknięcie lupy lub Enter)
    const searchBtn = document.getElementById('searchBtn');

    const wykonajSzukanie = () => {
        const query = inputSzukania.value.trim();
        // Przeładowujemy stronę z parametrem search (najbezpieczniej dla UX)
        window.location.href = `kolekcja.html?search=${encodeURIComponent(query)}`;
    };

    if (searchBtn) searchBtn.addEventListener('click', wykonajSzukanie);
    if (inputSzukania) {
        inputSzukania.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') wykonajSzukanie();
        });
    }

    // Sprawdzanie, czy auto zostało właśnie usunięte
    const urlParamsCheck = new URLSearchParams(window.location.search);
    if (urlParamsCheck.get('deleted') === 'true') {
        // Wywołujemy toast już na nowej stronie
        if (typeof pokazPowiadomienie === 'function') {
            pokazPowiadomienie("Pojazd został pomyślnie usunięty! 🗑️");
        }
        
        // Opcjonalnie: czyścimy URL, żeby po odświeżeniu (F5) komunikat nie wyskoczył znowu
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Startowe ładowanie danych
    zaladujPartiePojazdow();

    // Infinite Scroll
    window.addEventListener('scroll', obsluzScrollowanie);
});

/* ================================================================================= */
/* ========================== 2. FUNKCJE POMOCNICZE (RESET) ======================== */
/* ================================================================================= */

function przeladujListeVehicles() {
    // Resetujemy liczniki
    currentOffset = 0;
    allLoaded = false;
    
    // Czyścimy kontener z autami
    const kontener = document.getElementById('lista-pojazdow-pelna');
    if (kontener) {
        kontener.innerHTML = '';
        
        // Usuwamy komunikat końca listy jeśli istnieje
        const endMsg = document.getElementById('end-msg');
        if (endMsg) endMsg.remove();
    }
    
    // Ładujemy od zera z nowymi filtrami
    zaladujPartiePojazdow();
}

/* ================================================================================= */
/* ========================== 3. POBIERANIE DANYCH (CORE) ========================== */
/* ================================================================================= */

async function zaladujPartiePojazdow() {
    if (isLoading || allLoaded) return;

    isLoading = true;
    pokazLoader(true);
    const kontener = document.getElementById('lista-pojazdow-pelna');

    try {
        // Budujemy URL z parametrami: limit, offset ORAZ filtry
        let url = `/api/pojazdy?limit=${LIMIT}&offset=${currentOffset}&t=${Date.now()}`;
        url += `&sort=${filters.sort}`;
        url += `&power=${filters.power}`;
        url += `&year=${filters.year}`;
        
        if (currentSearchQuery) {
            url += `&search=${encodeURIComponent(currentSearchQuery)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Błąd sieci");
        
        const noweAuta = await response.json();

        // SCENARIUSZ 1: Brak wyników na start (Pusta baza lub zbyt ścisłe filtry)
        if (currentOffset === 0 && noweAuta.length === 0) {
            wyswietlBrakWynikow(kontener, currentSearchQuery);
            allLoaded = true;
            pokazLoader(false);
            return;
        }

        // SCENARIUSZ 2: Koniec danych (przyszło mniej niż LIMIT)
        if (noweAuta.length < LIMIT) {
            allLoaded = true;
        }

        // SCENARIUSZ 3: Mamy dane -> Renderujemy
        kontener.classList.remove('grid-off-mode');

        if (typeof renderujKafelki === 'function') {
            // Używamy tymczasowego diva, żeby renderujKafelki nie skasowało poprzednich
            // (zakładając że funkcja renderujKafelki używa innerHTML = ...)
            const tempDiv = document.createElement('div');
            renderujKafelki(tempDiv, noweAuta);
            
            // Przenosimy wygenerowane kafelki do głównego kontenera
            while (tempDiv.firstChild) {
                kontener.appendChild(tempDiv.firstChild);
            }
        }

        currentOffset += noweAuta.length;

        if (allLoaded && currentOffset > 0) {
            pokazKoniecListy(kontener);
        }

    } catch (err) {
        console.error(err);
        if (currentOffset === 0) {
            kontener.innerHTML = '<p class="collection-error-msg">Wystąpił błąd podczas ładowania kolekcji.</p>';
        }
    } finally {
        isLoading = false;
        pokazLoader(false);
    }
}

/* ================================================================================= */
/* ========================== 4. UI HELPERS (LOADER, SCROLL) ======================= */
/* ================================================================================= */

function obsluzScrollowanie() {
    // Jeśli jesteśmy blisko dołu strony (100px), ładuj więcej
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
        zaladujPartiePojazdow();
    }
}

function pokazLoader(czyPokazac) {
    let loader = document.getElementById('collection-loader');
    
    // Tworzymy loader dynamicznie, jeśli go nie ma
    if (!loader && czyPokazac) {
        const kontener = document.getElementById('lista-pojazdow-pelna');
        if (kontener) {
            loader = document.createElement('div');
            loader.id = 'collection-loader';
            loader.className = 'loader-container';
            loader.innerHTML = '<div class="spinner"></div>';
            kontener.parentNode.insertBefore(loader, kontener.nextSibling);
        }
    }

    if (loader) {
        if (czyPokazac) loader.classList.add('show');
        else loader.classList.remove('show');
    }
}

function pokazKoniecListy(kontenerGrid) {
    if (document.getElementById('end-msg')) return;
    const msg = document.createElement('div');
    msg.id = 'end-msg';
    msg.className = 'end-message';
    msg.innerText = "To już wszystkie pojazdy spełniające kryteria 🏁";
    kontenerGrid.parentNode.insertBefore(msg, kontenerGrid.nextSibling);
}

function wyswietlBrakWynikow(container, fraza) {
    container.classList.add('grid-off-mode');
    
    // Tekst zależny od tego, czy szukamy, czy filtrujemy
    let tekst = "Żadne auto nie pasuje do wybranych filtrów.";
    if (fraza) tekst = `Nie znaleziono pojazdów dla frazy: "<b>${fraza}</b>"`;

    container.innerHTML = `
        <div class="no-result-box">
            <h3>Brak wyników 🔍</h3>
            <p>${tekst}</p>
            <button onclick="window.location.href='kolekcja.html'" class="btn-danger">RESETUJ FILTRY</button>
        </div>
    `;
}