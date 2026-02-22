/* ================================================================================= */
/* ========================== 1. ZMIENNE I INICJALIZACJA =========================== */
/* ================================================================================= */

let filesToUpload = [];      // Tablica na nowe pliki (File objects)
let photosToDelete = [];     // Tablica ID zdjęć do usunięcia z bazy
let mainPhotoSelection = {   
    type: 'existing',        // 'existing' (z bazy) lub 'new' (z uploadu)
    value: null              // URL (dla existing) lub Index tablicy (dla new)
};

document.addEventListener('DOMContentLoaded', () => {
    inicjalizujFormularz();
    
    // Obsługa inputa dla nowych zdjęć
    const inputNowe = document.getElementById('new-photos-input');
    if (inputNowe) {
        inputNowe.addEventListener('change', obsluzWyborNowychZdjec);
    }

    // Obsługa wysyłki formularza
    const form = document.getElementById('edit-car-form');
    if (form) {
        form.addEventListener('submit', zapiszZmiany);
    }
});

/* ================================================================================= */
/* ========================== 2. POBIERANIE DANYCH AUTA ============================ */
/* ================================================================================= */

async function inicjalizujFormularz() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        pokazPowiadomienie("Błąd: Brak ID pojazdu.");
        setTimeout(() => window.location.href = 'kolekcja.html', 2000);
        return;
    }

    try {
        const response = await fetch(`/api/pojazdy/${id}`);
        if (!response.ok) throw new Error("Nie udało się pobrać danych.");
        
        const auto = await response.json();

        // Wypełnianie pól formularza
        document.getElementById('edit-id').value = auto.id;
        document.getElementById('marka').value = auto.marka;
        document.getElementById('model').value = auto.model;
        document.getElementById('rok_produkcji').value = auto.rok_produkcji || '';
        document.getElementById('pojemnosc').value = auto.silnik;
        document.getElementById('moc').value = auto.moc;
        document.getElementById('opis').value = auto.opis;

        // Ustawienie początkowego zdjęcia głównego
        mainPhotoSelection = { type: 'existing', value: auto.zdjecie_url }; 

        // Renderowanie obecnej galerii
        renderExistingGallery(auto.galeria);

    } catch (err) {
        console.error("Błąd:", err);
        pokazPowiadomienie("Błąd serwera podczas ładowania danych.");
    }
}

/* ================================================================================= */
/* ======================== 3. GALERIA ISTNIEJĄCA (Z BAZY) ========================= */
/* ================================================================================= */

function renderExistingGallery(photos) {
    const container = document.getElementById('existing-gallery');
    if (!container) return;
    
    container.innerHTML = '';

    // Zapiszmy sobie te zdjęcia globalnie (lub przekażmy w inny sposób), 
    // żeby móc odświeżać widok bez ponownego fetchowania.
    // Tutaj dla uproszczenia zakładamy, że 'photos' jest zawsze aktualne.
    // (W idealnym świecie trzymalibyśmy stan 'existingPhotos' w zmiennej globalnej).
    window.cachedExistingPhotos = photos || window.cachedExistingPhotos || [];
    const currentPhotos = window.cachedExistingPhotos;

    if (!currentPhotos || currentPhotos.length === 0) {
        container.innerHTML = '<p class="placeholder-text">Brak zdjęć w bazie.</p>';
        return;
    }

    currentPhotos.forEach(photo => {
        // Pomijamy te, które użytkownik oznaczył do usunięcia
        if (photosToDelete.includes(photo.id)) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview-wrapper';
        
        // Sprawdź czy to jest oznaczone jako główne
        if (mainPhotoSelection.type === 'existing' && mainPhotoSelection.value === photo.url) {
            wrapper.classList.add('is-main');
        }

        const src = photo.url.startsWith('http') ? photo.url : `img/auta/${photo.url}`;
        wrapper.innerHTML = `
        <img src="${src}" alt="Foto">
        <button type="button" class="btn-delete-photo" onclick="pytanieOUsuniecieZdjecia(${photo.id}, this)">✕</button>
        `;

        // Kliknięcie w zdjęcie (Ustawianie głównego)
        wrapper.onclick = () => {
            mainPhotoSelection = { type: 'existing', value: photo.url };
            odswiezWidokGalerii();
        };

        container.appendChild(wrapper);
    });
}

/* ================================================================================= */
/* ========================== 4. GALERIA NOWA (UPLOAD) ============================= */
/* ================================================================================= */

function obsluzWyborNowychZdjec(e) {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;
    
    filesToUpload = filesToUpload.concat(newFiles);
    // Reset inputa, żeby można było dodać te same pliki
    e.target.value = '';
    
    renderNewGallery();
}

function renderNewGallery() {
    const container = document.getElementById('new-images-preview');
    if (!container) return;
    
    container.innerHTML = '';

    if (filesToUpload.length === 0) {
        container.innerHTML = '<p class="placeholder-text">Nowe zdjęcia pojawią się tutaj...</p>';
        return;
    }

    filesToUpload.forEach((file, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview-wrapper';
        
        if (mainPhotoSelection.type === 'new' && mainPhotoSelection.value === index) {
            wrapper.classList.add('is-main');
        }

        // Tworzenie elementów DOM
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-delete-photo';
        btnDel.innerText = '✕';
        
        // Usuwanie z listy do uploadu
        btnDel.onclick = (e) => {
            e.stopPropagation();
            filesToUpload.splice(index, 1);
            
            // Jeśli usunięto to, które było wybrane jako główne - resetujemy wybór
            if (mainPhotoSelection.type === 'new' && mainPhotoSelection.value === index) {
                mainPhotoSelection = { type: 'existing', value: null }; 
            } 
            // Jeśli usunięto coś przed głównym, trzeba zmniejszyć indeks
            else if (mainPhotoSelection.type === 'new' && mainPhotoSelection.value > index) {
                mainPhotoSelection.value--;
            }

            renderNewGallery();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(btnDel);

        // Wybór jako główne
        wrapper.onclick = () => {
            mainPhotoSelection = { type: 'new', value: index };
            odswiezWidokGalerii();
        };

        container.appendChild(wrapper);
    });
}

// Funkcja pomocnicza do odświeżania obu galerii naraz (żeby ramka przeskoczyła)
function odswiezWidokGalerii() {
    renderExistingGallery(window.cachedExistingPhotos);
    renderNewGallery();
}

/* ================================================================================= */
/* ========================== 5. ZAPISYWANIE ZMIAN (PUT) =========================== */
/* ================================================================================= */

async function zapiszZmiany(e) {
    e.preventDefault();
    
    const form = e.target; // Pobieramy formularz
    // POPRAWKA: Szukamy przycisku submit wewnątrz tego formularza
    const btnSave = form.querySelector('button[type="submit"]'); 
    
    // Zabezpieczenie (gdyby jednak coś poszło nie tak)
    if (!btnSave) {
        console.error("Błąd: Nie znaleziono przycisku zapisu!");
        return;
    }

    const originalText = btnSave.innerText;
    
    btnSave.disabled = true;
    btnSave.innerText = "Zapisywanie...";

    const id = document.getElementById('edit-id').value;
    const formData = new FormData();

    // 1. Dane tekstowe
    formData.append('marka', document.getElementById('marka').value);
    formData.append('model', document.getElementById('model').value);
    formData.append('rok_produkcji', document.getElementById('rok_produkcji').value);
    formData.append('pojemnosc', document.getElementById('pojemnosc').value);
    formData.append('moc', document.getElementById('moc').value);
    formData.append('opis', document.getElementById('opis').value);

    // 2. Zdjęcia do usunięcia (JSON)
    formData.append('photosToDelete', JSON.stringify(photosToDelete));

    // 3. Nowe zdjęcia (Pliki)
    filesToUpload.forEach(file => {
        formData.append('newPhotos', file);
    });

    // 4. Informacja o głównym zdjęciu
    formData.append('mainPhotoType', mainPhotoSelection.type);
    formData.append('mainPhotoValue', mainPhotoSelection.value);

    try {
        const response = await fetch(`/api/pojazdy/aktualizuj/${id}`, {
            method: 'PUT',
            body: formData 
        });

        if (response.ok) {
            localStorage.setItem('toastMessage', 'Pojazd zaktualizowany pomyślnie!');
            
            // Inteligentny powrót
            const params = new URLSearchParams(window.location.search);
            const zrodlo = params.get('zrodlo');

            if (zrodlo === 'detale') {
                window.location.href = `auto-detale.html?id=${id}`;
            } else if (zrodlo === 'weryfikacja') {
                window.location.href = 'weryfikacja.html';
            } else {
                window.location.href = 'kolekcja.html';
            }
        } else {
            const result = await response.json();
            pokazPowiadomienie("Błąd: " + result.message);
            btnSave.disabled = false;
            btnSave.innerText = originalText;
        }
    } catch (err) {
        console.error("Błąd zapisu:", err);
        pokazPowiadomienie("Błąd połączenia z serwerem.");
        btnSave.disabled = false;
        btnSave.innerText = originalText;
    }
}

/* ======================== OBSŁUGA MODALA USUWANIA ZDJĘĆ ======================== */

let idZdjeciaDoUsuniecia = null;    // Tu zapamiętamy ID z bazy
let elementHTMLDoUsuniecia = null;  // Tu zapamiętamy kafelek <div> ze strony

// 1. Tę funkcję podpinamy pod przycisk "X" przy zdjęciu (zamiast starego confirm)
window.pytanieOUsuniecieZdjecia = (id, btnElement) => {
    idZdjeciaDoUsuniecia = id;
    // Szukamy całego kontenera zdjęcia (np. div.photo-item), żeby go usunąć wizualnie
    elementHTMLDoUsuniecia = btnElement.closest('.photo-preview-item') || btnElement.parentElement;
    
    // Otwieramy Twój ładny modal
    const modal = document.getElementById('delete-photo-modal');
    if (modal) modal.classList.add('modal-active');
};

// 2. Zamykanie modala (Anuluj)
window.zamknijModalZdjecia = () => {
    idZdjeciaDoUsuniecia = null;
    elementHTMLDoUsuniecia = null;
    const modal = document.getElementById('delete-photo-modal');
    if (modal) modal.classList.remove('modal-active');
};

// 3. Fizyczne usunięcie (Przycisk "USUŃ" w modalu)
window.potwierdzUsuniecieZdjecia = () => {
    if (idZdjeciaDoUsuniecia) {
        // Dodajemy ID do tablicy 'photosToDelete' (którą już masz w pliku edycji)
        photosToDelete.push(idZdjeciaDoUsuniecia);
        
        // Usuwamy element wizualnie ze strony
        if (elementHTMLDoUsuniecia) {
            elementHTMLDoUsuniecia.remove();
        }
        
        // Feedback dla użytkownika (opcjonalnie)
        if (typeof pokazPowiadomienie === 'function') {
            pokazPowiadomienie("Zdjęcie oznaczone do usunięcia.");
        }
    }
    zamknijModalZdjecia();
};