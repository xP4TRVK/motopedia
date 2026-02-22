/* ================================================================================= */
/* ========================== 1. ZMIENNE I INICJALIZACJA =========================== */
/* ================================================================================= */

let filesToUpload = [];      // Nowe pliki
let photosToDelete = [];     // ID zdjęć do usunięcia
let mainPhotoSelection = {   
    type: 'existing',        
    value: null              
};

document.addEventListener('DOMContentLoaded', () => {
    inicjalizujFormularz();
    
    // Obsługa dodawania nowych zdjęć
    const inputNowe = document.getElementById('new-photos-input');
    if (inputNowe) {
        inputNowe.addEventListener('change', obsluzWyborNowychZdjec);
    }

    // Obsługa zapisu
    const form = document.getElementById('edit-car-form');
    if (form) {
        form.addEventListener('submit', zapiszPoprawki);
    }
});

/* ================================================================================= */
/* ========================== 2. POBIERANIE DANYCH ================================= */
/* ================================================================================= */

async function inicjalizujFormularz() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const zalogowany = localStorage.getItem('zalogowanyUzytkownik');

    if (!id) {
        window.location.href = 'moje-auta.html';
        return;
    }

    try {
        const response = await fetch(`/api/pojazdy/${id}`);
        if (!response.ok) throw new Error("Błąd sieci");
        
        const auto = await response.json();

        // --- ZMIANA TUTAJ: ZAMIAST ALERTU, POKAZUJEMY MODAL ---
        const rola = localStorage.getItem('zalogowanaRola');
        
        if (auto.uzytkownik_dodajacy !== zalogowany && rola !== 'admin') {
            // Znajdź modal i go pokaż
            const modal = document.getElementById('intruder-modal');
            if (modal) {
                modal.style.display = 'flex'; // Pokaż Custom Modal
            } else {
                // Fallback (gdyby HTML się nie zapisał), ale docelowo modal zadziała
                window.location.href = 'moje-auta.html';
            }
            return; // Ważne: Przerywamy funkcję, żeby nie wypełnił formularza danymi
        }
        // -----------------------------------------------------

        document.getElementById('edit-id').value = auto.id;
        document.getElementById('marka').value = auto.marka;
        document.getElementById('model').value = auto.model;
        document.getElementById('rok_produkcji').value = auto.rok_produkcji;
        document.getElementById('pojemnosc').value = auto.silnik; 
        document.getElementById('moc').value = auto.moc;
        document.getElementById('opis').value = auto.opis;

        mainPhotoSelection = { type: 'existing', value: auto.zdjecie_url };
        renderExistingGallery(auto.galeria);

    } catch (err) {
        console.error(err);
    }
}

/* ================================================================================= */
/* ========================== 3. OBSŁUGA GALERII (KOPIA Z EDYCJI) ================== */
/* ================================================================================= */

function renderExistingGallery(photos) {
    const container = document.getElementById('existing-gallery');
    if (!container) return;
    container.innerHTML = '';

    if (!photos || photos.length === 0) {
        container.innerHTML = '<p class="placeholder-text">Brak zdjęć w bazie.</p>';
        return;
    }

    photos.forEach(photo => {
        // Jeśli oznaczone do usunięcia, nie pokazuj
        if (photosToDelete.includes(photo.id)) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview-wrapper';
        
        // Ramka dla głównego zdjęcia
        if (mainPhotoSelection.type === 'existing' && mainPhotoSelection.value === photo.url) {
            wrapper.classList.add('is-main');
        }

        const src = photo.url.startsWith('http') ? photo.url : `img/auta/${photo.url}`;
        wrapper.innerHTML = `
        <img src="${src}" alt="Foto">
        <button type="button" class="btn-delete-photo">✕</button>
        `;

        // Usuwanie (dodanie do listy usuniętych)
        wrapper.querySelector('.btn-delete-photo').onclick = (e) => {
            e.stopPropagation(); 
            if (confirm("Usunąć to zdjęcie?")) {
                photosToDelete.push(photo.id);
                renderExistingGallery(photos); // Przerysuj
            }
        };

        // Wybór głównego
        wrapper.onclick = () => {
            mainPhotoSelection = { type: 'existing', value: photo.url };
            renderExistingGallery(photos);
        };

        container.appendChild(wrapper);
    });
}

function obsluzWyborNowychZdjec(e) {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;
    
    filesToUpload = filesToUpload.concat(newFiles);
    e.target.value = ''; // Reset inputa
    renderNewGallery();
}

function renderNewGallery() {
    const container = document.getElementById('new-images-preview');
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

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-delete-photo';
        btnDel.innerText = '✕';
        
        btnDel.onclick = (e) => {
            e.stopPropagation();
            filesToUpload.splice(index, 1);
            renderNewGallery();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(btnDel);

        wrapper.onclick = () => {
            mainPhotoSelection = { type: 'new', value: index };
            // Musimy odświeżyć obie galerie, żeby ramka zniknęła ze starego zdjęcia
            const currentMain = document.querySelector('.image-preview-wrapper.is-main');
            if(currentMain) currentMain.classList.remove('is-main');
            renderNewGallery();
        };

        container.appendChild(wrapper);
    });
}

/* ================================================================================= */
/* ========================== 4. WYSYŁANIE (ZDJĘCIA + TEKST) ======================= */
/* ================================================================================= */

async function zapiszPoprawki(e) {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); // Pobieramy ID z URL, bo input może być zawodny
    const btnSave = document.querySelector('.btn-primary');
    const login = localStorage.getItem('zalogowanyUzytkownik'); // KTO wysyła
    
    btnSave.disabled = true;
    btnSave.innerText = "Zapisywanie...";

    const formData = new FormData();

    // Dodajemy LOGIN dla bezpieczeństwa
    formData.append('login', login);

    formData.append('marka', document.getElementById('marka').value);
    formData.append('model', document.getElementById('model').value);
    formData.append('rok_produkcji', document.getElementById('rok_produkcji').value);
    formData.append('pojemnosc', document.getElementById('pojemnosc').value);
    formData.append('moc', document.getElementById('moc').value);
    formData.append('opis', document.getElementById('opis').value);

    formData.append('photosToDelete', JSON.stringify(photosToDelete));
    
    filesToUpload.forEach(file => {
        formData.append('newPhotos', file);
    });

    formData.append('mainPhotoType', mainPhotoSelection.type);
    formData.append('mainPhotoValue', mainPhotoSelection.value);

    try {
        const res = await fetch(`/api/pojazdy/edytuj/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (res.ok) {
            localStorage.setItem('toastMessage', 'Poprawki zapisane! Wpis trafił do weryfikacji.');
            window.location.href = 'moje-auta.html';
        } else {
            const result = await res.json();
            alert("Błąd: " + result.message);
            btnSave.disabled = false;
            btnSave.innerText = "ZAPISZ POPRAWKI";
        }
    } catch (err) {
        console.error(err);
        alert("Błąd serwera.");
        btnSave.disabled = false;
        btnSave.innerText = "ZAPISZ POPRAWKI";
    }
}