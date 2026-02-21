document.addEventListener('DOMContentLoaded', () => {
    sprawdzLogowanie();
    zaladujUlubione();
});

function sprawdzLogowanie() {
    const login = localStorage.getItem('zalogowanyUzytkownik');
    if (!login) {
        window.location.href = 'logowanie.html';
    }
}

async function zaladujUlubione() {
    const login = localStorage.getItem('zalogowanyUzytkownik');
    const kontener = document.getElementById('lista-ulubionych');
    
    if (!kontener) return;

    try {
        const response = await fetch(`/api/ulubione/${login}`);
        
        if (!response.ok) throw new Error("Błąd pobierania ulubionych");

        const auta = await response.json();

        if (auta.length === 0) {
            // BRAK WYNIKÓW -> Wywołujemy funkcję pustego stanu
            wyswietlBrakUlubionych(kontener);
        } else {
            // SĄ WYNIKI -> Włączamy grid
            kontener.classList.remove('grid-off-mode');
            if (typeof renderujKafelki === 'function') {
                renderujKafelki(kontener, auta);
            }
        }

    } catch (err) {
        console.error(err);
        // Fallback w razie błędu serwera
        kontener.innerHTML = '<p class="render-error">Nie udało się załadować listy ulubionych.</p>';
    }
}

function wyswietlBrakUlubionych(container) {
    // 1. Dodajemy klasę centrującą (z kolekcja.js/style.css)
    container.classList.add('grid-off-mode');

    // 2. Wstawiamy HTML identyczny strukturą jak w kolekcji
    // UWAGA: Używam klasy 'no-result-box' (bez 's' na końcu), bo taką masz w kolekcja.js.
    // Jeśli w CSS masz 'no-results-box' (z literą 's'), to style mogą nie złapać.
    // Dla pewności dodaję obie klasy w divie, żeby zadziałało niezależnie od literówki.
    
    container.innerHTML = `
        <div class="no-result-box no-results-box">
            <h3>Jeszcze nic tu nie ma ❤️</h3>
            <p>
                Twoja lista ulubionych jest pusta.<br>
                Przeglądaj kolekcję i klikaj serduszka, aby zapisać auta na później!
            </p>
            
            <button onclick="window.location.href='kolekcja.html'" class="btn-primary">
                PRZEJDŹ DO KOLEKCJI
            </button>
        </div>
    `;
}