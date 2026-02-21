/* ================================================================================= */
/* ======================== 1. SEKCJA HERO (ŁADOWANIE 3 LOSOWYCH AUT) ============== */
/* ================================================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    const kontenerHero = document.getElementById('lista-pojazdow-hero');
    
    if (!kontenerHero) return;

    try {
        // ZMIANA: Pobieramy z endpointu /losowe, a nie wszystkie!
        const response = await fetch('/api/pojazdy/losowe'); 
        
        if (!response.ok) throw new Error("Błąd sieci");
        
        const pojazdy = await response.json();

        // Jeśli baza jest pusta lub ma mało aut, obsłuż to
        if (pojazdy.length === 0) {
            kontenerHero.innerHTML = '<p class="text-muted-center">Baza jest pusta.</p>';
            return;
        }

        // Renderujemy kafelki (korzystamy z funkcji globalnej z script.js)
        if (typeof renderujKafelki === 'function') {
            renderujKafelki(kontenerHero, pojazdy);
        }

    } catch (err) {
        console.error("❌ Błąd ładowania Hero: ", err);
        kontenerHero.innerHTML = '<p class="text-muted-center">Nie udało się załadować pojazdów.</p>';
    }
});

/* ================================================================================= */
/* ======================== 2. WYSZUKIWARKA (PRZEKIEROWANIE) ======================= */
/* ================================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn'); 
    const searchInput = document.getElementById('car-search');
    const btnTarget = searchBtn || document.querySelector('.search-submit-button');

    if (btnTarget && searchInput) {
        const wykonajSzukanie = () => {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                window.location.href = `kolekcja.html?search=${encodeURIComponent(query)}`;
            }
        };

        btnTarget.addEventListener('click', wykonajSzukanie);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') wykonajSzukanie();
        });
    }
});

/* ================================================================================= */
/* ======================== 3. MODAL (OKNO INFO) =================================== */
/* ================================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('info-modal');
    const openBtn = document.getElementById('open-info-modal');
    const closeBtn = document.getElementById('close-info-modal');

    if (!modal || !openBtn || !closeBtn) return;

    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('modal-active');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('modal-active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('modal-active');
        }
    });
});