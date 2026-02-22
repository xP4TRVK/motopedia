document.addEventListener('DOMContentLoaded', () => {
    sprawdzLogowanie(); 
    zaladujMojePojazdy();
});

// Funkcja sprawdzająca logowanie (jeśli nie masz jej w script.js)
function sprawdzLogowanie() {
    const login = localStorage.getItem('zalogowanyUzytkownik');
    if (!login) {
        window.location.href = 'logowanie.html';
    }
}

// Główna funkcja pobierająca
async function zaladujMojePojazdy() {
    const login = localStorage.getItem('zalogowanyUzytkownik');
    console.log("👤 Pobieranie aut dla użytkownika:", login); // LOG 1

    try {
        const response = await fetch(`/api/moje-pojazdy/${login}`);
        
        // Sprawdzenie czy odpowiedź jest OK
        if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.status}`);
        }

        const auta = await response.json();
        console.log("🚗 Dane otrzymane z serwera:", auta); // LOG 2

        // Zabezpieczenie: Czy to na pewno tablica?
        if (!Array.isArray(auta)) {
            console.error("Błąd: Serwer nie zwrócił tablicy!", auta);
            return;
        }

        // Dzielimy auta na dwa worki
        const opublikowane = auta.filter(a => a.status === 'approved');
        const zgloszenia = auta.filter(a => a.status === 'pending' || a.status === 'rejected');

        console.log(`✅ Opublikowane: ${opublikowane.length}, ⏳ Zgłoszenia: ${zgloszenia.length}`); // LOG 3

        // Aktualizujemy liczniki w zakładkach
        const countPub = document.getElementById('count-published');
        const countSub = document.getElementById('count-submissions');
        
        if(countPub) countPub.innerText = opublikowane.length;
        if(countSub) countSub.innerText = zgloszenia.length;

        // Renderujemy listy
        renderujListe(opublikowane, 'list-published', false);
        renderujListe(zgloszenia, 'list-submissions', true);

    } catch (err) {
        console.error("❌ Błąd krytyczny w moje-auta.js:", err);
        const container = document.getElementById('list-published');
        if (container) container.innerHTML = '<p class="my-car-error">Wystąpił błąd pobierania danych.</p>';
    }
}

// Funkcja renderująca HTML
function renderujListe(listaAut, kontenerId, czyPokazacStatus) {
    const container = document.getElementById(kontenerId);
    if (!container) return;

    if (listaAut.length === 0) {
        container.innerHTML = `<p class="my-car-empty">Brak pojazdów w tej sekcji.</p>`;
        return;
    }

    container.innerHTML = listaAut.map(auto => {
        // Linki
        let link = '#';
        if (auto.status === 'approved') link = `auto-detale.html?id=${auto.id}`;
        
        const cursorStyle = auto.status === 'approved' ? 'cursor: pointer;' : 'cursor: default;';
        const zdjecie = auto.zdjecie_url 
        ? (auto.zdjecie_url.startsWith('http') ? auto.zdjecie_url : `/img/auta/${auto.zdjecie_url}`) 
        : 'img/default-car.png';

        // Badge statusu
        let statusBadge = '';
        if (czyPokazacStatus) {
            if (auto.status === 'pending') statusBadge = '<div class="status-label status-pending">Weryfikacja</div>';
            if (auto.status === 'rejected') statusBadge = '<div class="status-label status-rejected">Odrzucone / Do poprawy</div>';
        }

        let actionButtons = '';
        if (czyPokazacStatus) {
            actionButtons = `
                <div class="manage-actions">
                    <a href="poprawka-auto.html?id=${auto.id}" class="btn-action-edit">EDYTUJ</a>
                    <button onclick="usunMojeAuto(${auto.id})" class="btn-action-delete">USUŃ</button>
                </div>
            `;
        }

        return `
            <div class="manage-card">
                <img src="${zdjecie}" class="manage-card-img" alt="Foto">
                <div class="manage-card-body">
                    ${statusBadge}
                    <h3 class="manage-card-title">
                        <a href="${link}" ${cursorStyle}">
                            ${auto.marka} ${auto.model}
                        </a>
                    </h3>
                    <div class="manage-card-meta">
                        <span>Rok produkcji: ${auto.rok_produkcji}</span>
                        <span>❤️ ${auto.like_count || 0}</span>
                    </div>
                    
                    ${actionButtons} </div>
            </div>
        `;
    }).join('');
}

/* --- OBSŁUGA MODALA USUWANIA --- */
let idAutaDoUsuniecia = null;

// 1. Otwiera modal zamiast alertu
window.usunMojeAuto = (id) => {
    idAutaDoUsuniecia = id;
    const modal = document.getElementById('delete-my-car-modal');
    if (modal) modal.style.display = 'flex';
};

// 2. Zamyka modal
window.zamknijModalMojegoAuta = () => {
    idAutaDoUsuniecia = null;
    const modal = document.getElementById('delete-my-car-modal');
    if (modal) modal.style.display = 'none';
};

// 3. Wykonuje usuwanie po kliknięciu "USUŃ" w modalu
window.potwierdzUsuniecieMojegoAuta = async () => {
    if (!idAutaDoUsuniecia) return;

    // Pobieramy login, żeby serwer mógł sprawdzić nasze uprawnienia
    const login = localStorage.getItem('zalogowanyUzytkownik');

    try {
        // Wysyłamy login w parametrze URL
        const response = await fetch(`/api/pojazdy/${idAutaDoUsuniecia}?login=${encodeURIComponent(login)}`, { 
            method: 'DELETE' 
        });
        
        if (response.ok) {
            zamknijModalMojegoAuta();
            zaladujMojePojazdy(); 
            // Jeśli masz funkcję toast w script.js:
            if (typeof pokazPowiadomienie === 'function') pokazPowiadomienie("Pojazd usunięty pomyślnie.");
        } else {
            const result = await response.json();
            alert("Błąd: " + (result.message || "Nie udało się usunąć."));
        }
    } catch (err) {
        console.error(err);
        alert("Błąd serwera.");
    }
};

// Obsługa zakładek
window.zmienZakladkeAut = (zakladka) => {
    // 1. Zmień klasy przycisków
    const buttons = document.querySelectorAll('.big-tab');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(zakladka)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Pokaż odpowiedni kontener
    document.querySelectorAll('.cars-view-content').forEach(div => div.classList.remove('active'));
    const target = document.getElementById(`view-${zakladka}`);
    if(target) target.classList.add('active');
};