/* ================================================================================= */
/* ========================== 1. INICJALIZACJA I ZMIENNE =========================== */
/* ================================================================================= */

let gotowyPlikDoWyslania = null; // Przechowuje blob ze zdjęcia (po przycięciu)
let cropper = null;              // Instancja Cropper.js

document.addEventListener('DOMContentLoaded', () => {
    sprawdzCzyZalogowany();
    zaladujDaneProfilu();
    inicjalizujCroppera();
    inicjalizujFormularz();
});

function sprawdzCzyZalogowany() {
    const login = localStorage.getItem('zalogowanyUzytkownik');
    if (!login) {
        window.location.href = 'logowanie.html';
        throw new Error("Niezalogowany"); // Przerywa dalsze wykonywanie skryptu
    }
}

/* ================================================================================= */
/* ========================== 2. POBIERANIE DANYCH Z BAZY ========================== */
/* ================================================================================= */

async function zaladujDaneProfilu() {
    const login = localStorage.getItem('zalogowanyUzytkownik');
    
    try {
        const response = await fetch(`/api/uzytkownik/${login}`);
        if (!response.ok) throw new Error("Błąd pobierania danych");
        
        const user = await response.json();
        
        // Wypełnianie pól input
        document.getElementById('edit-login').value = user.login;
        document.getElementById('edit-nazwa').value = user.nazwa_uzytkownika || user.login;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('profile-edit-plec').value = user.plec;
        document.getElementById('profile-login-display').textContent = user.nazwa_uzytkownika || user.login;

        // Wyświetlanie rangi 
        const rolaElement = document.getElementById('profile-role-display');
        if (rolaElement) {
            if (user.rola === 'admin') {
                rolaElement.textContent = 'ADMINISTRATOR';
                rolaElement.style.color = '#ff4444'; // Czerwony dla admina
                rolaElement.style.fontWeight = 'bold';
                rolaElement.style.fontSize = 'large';
            } else {
                rolaElement.textContent = 'UŻYTKOWNIK';
                rolaElement.style.color = '#aaaaaa'; // Szary dla zwykłego
            }
        }

        // Ustawianie Avatara
        const circle = document.querySelector('.avatar-circle');
        const linkDoZdjecia = user.avatar_url;

        if (linkDoZdjecia && linkDoZdjecia !== "null" && linkDoZdjecia.trim() !== "") {
            // Dodajemy slash na początku jeśli go nie ma
            let sciezka = linkDoZdjecia;

            // Jeśli to NIE jest link z internetu (brak http) i NIE ma slasha, dodaj go
            if (!sciezka.startsWith('http') && !sciezka.startsWith('/')) {
                sciezka = '/' + sciezka;
            }

            // Zachowujemy Twój parametr odświeżania zdjęcia
            sciezka += (sciezka.includes('?') ? '&' : '?') + `v=${new Date().getTime()}`;

            circle.innerHTML = `<img src="${sciezka}" alt="Avatar">`;
        } else {
            // Jeśli brak zdjęcia, zostawiamy domyślny SVG (który jest w HTML)
             // Lub wstawiamy go ponownie, jeśli HTML byłby pusty
             if (!circle.querySelector('svg')) {
                 circle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
             }
        }

        const likesElem = document.getElementById('profile-total-likes');
        if (likesElem) {
        likesElem.textContent = user.total_likes;
}

    } catch (error) {
        console.error("Błąd profilu:", error);
        pokazPowiadomienie("Nie udało się załadować danych profilu.");
    }
}

/* ================================================================================= */
/* ========================== 3. OBSŁUGA CROPPERA (PRZYCINANIE) ==================== */
/* ================================================================================= */

function inicjalizujCroppera() {
    const fileInput = document.getElementById('avatar-upload');
    const modal = document.getElementById('crop-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const confirmBtn = document.getElementById('crop-confirm-btn');
    const cancelBtn = document.getElementById('cancel-crop-btn');
    const zoomSlider = document.getElementById('zoom-slider');

    if (!fileInput) return;

    // 1. Wybór pliku z dysku
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                imageToCrop.src = evt.target.result;
                modal.style.display = 'flex'; // Pokazujemy modal

                // Reset starego croppera
                if (cropper) cropper.destroy();

                // Konfiguracja Croppera (wymuszenie kwadratu)
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1,      // Kwadrat
                    viewMode: 1,         // Obraz nie ucieka z ramki
                    dragMode: 'move',    // Przesuwanie obrazka
                    autoCropArea: 0.8,
                    restore: false,
                    guides: false,
                    center: false,
                    highlight: false,
                    cropBoxMovable: false,
                    cropBoxResizable: false,
                    toggleDragModeOnDblclick: false,
                    ready: function() {
                        if (zoomSlider) zoomSlider.value = 1;
                    }
                });
            }
            reader.readAsDataURL(file);
        }
    });

    // 2. Obsługa zoomu suwakiem
    if (zoomSlider) {
        zoomSlider.addEventListener('input', function() {
            if (cropper) cropper.zoomTo(parseFloat(this.value)); 
        });
    }

    // 3. Anulowanie
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        fileInput.value = ""; // Reset inputa
        if (cropper) cropper.destroy();
    });

    // 4. Zatwierdzenie przycięcia
    confirmBtn.addEventListener('click', () => {
        if (cropper) {
            // Pobieramy wycinek jako Blob (plik binarny)
            cropper.getCroppedCanvas({
                width: 300, 
                height: 300
            }).toBlob((blob) => {
                gotowyPlikDoWyslania = blob;

                // Podgląd w kółku (bez wysyłania do bazy jeszcze)
                const previewUrl = URL.createObjectURL(blob);
                const circle = document.querySelector('.avatar-circle');
                circle.innerHTML = `<img src="${previewUrl}" alt="Podgląd">`;

                modal.style.display = 'none';
            });
        }
    });
}

/* ================================================================================= */
/* ========================== 4. WYSYŁANIE FORMULARZA ============================== */
/* ================================================================================= */

function inicjalizujFormularz() {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const login = localStorage.getItem('zalogowanyUzytkownik');
        const nazwa = document.getElementById('edit-nazwa').value;
        const email = document.getElementById('edit-email').value;
        const plec = document.getElementById('profile-edit-plec').value;
        const stareHaslo = document.getElementById('old-password').value;
        const noweHaslo = document.getElementById('new-password').value;
        const btnSave = e.target.querySelector('button[type="submit"]');

        // Walidacja
        if (!stareHaslo) {
            pokazPowiadomienie("Podaj obecne hasło, aby zapisać zmiany!");
            document.getElementById('old-password').focus();
            return;
        }

        // Blokada przycisku
        btnSave.disabled = true;
        btnSave.innerText = "Zapisywanie...";

        // Budowanie FormData
        const formData = new FormData();
        formData.append('nazwa_uzytkownika', nazwa);
        formData.append('email', email);
        formData.append('plec', plec);
        formData.append('stareHaslo', stareHaslo);
        formData.append('noweHaslo', noweHaslo);

        if (gotowyPlikDoWyslania) {
            formData.append('avatar', gotowyPlikDoWyslania, 'avatar.jpg');
        }

        try {
            const response = await fetch(`/api/uzytkownik/${login}`, {
                method: 'PUT',
                body: formData 
            });
            const result = await response.json();

            if (response.ok) {
                pokazPowiadomienie("Zapisano zmiany!");
                
                // Czyszczenie pól haseł
                document.getElementById('old-password').value = "";
                document.getElementById('new-password').value = "";
                
                // Aktualizacja LocalStorage i widoku
                document.getElementById('profile-login-display').textContent = nazwa;
                localStorage.setItem('zalogowanaNazwa', nazwa);
                
                if (result.nowyAvatar) {
                    localStorage.setItem('zalogowanyAvatar', result.nowyAvatar);
                }
                
                // Odświeżenie paska nawigacji
                if (typeof aktualizujNawigacje === 'function') {
                    aktualizujNawigacje();
                }

            } else {
                pokazPowiadomienie("Błąd: " + result.message);
            }
        } catch (error) {
            console.error(error);
            pokazPowiadomienie("Błąd połączenia z serwerem.");
        } finally {
            btnSave.disabled = false;
            btnSave.innerText = "ZAPISZ ZMIANY";
        }
    });
}