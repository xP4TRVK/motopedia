/* ================================================================================= */
/* ========================== 1. ZMIENNE I INICJALIZACJA =========================== */
/* ================================================================================= */

let allFiles = [];         // Przechowuje rzeczywiste obiekty plików
let selectedMainIndex = 0; // Indeks zdjęcia, które będzie miniaturką

document.addEventListener('DOMContentLoaded', () => {
    const inputZdjecia = document.getElementById('zdjecia-input');
    const form = document.getElementById('add-car-form');

    // Nasłuchiwanie wyboru plików
    if (inputZdjecia) {
        inputZdjecia.addEventListener('change', obsluzWyborPlikow);
    }

    // Nasłuchiwanie wysyłki formularza
    if (form) {
        form.addEventListener('submit', wyslijFormularz);
    }
});

/* ================================================================================= */
/* ======================== 2. OBSŁUGA GALERII (PODGLĄD) =========================== */
/* ================================================================================= */

function obsluzWyborPlikow(e) {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    // Dodajemy nowe pliki do istniejącej tablicy (nie nadpisujemy!)
    allFiles = allFiles.concat(newFiles);
    
    // Resetujemy input, żeby można było dodać te same pliki ponownie w razie pomyłki
    e.target.value = '';

    renderujPodglad();
}

function renderujPodglad() {
    const container = document.getElementById('image-preview-container');
    container.innerHTML = ''; // Czyścimy kontener

    if (allFiles.length === 0) {
        container.innerHTML = '<p class="placeholder-text">Brak zdjęć. Dodaj je poniżej.</p>';
        return;
    }

    allFiles.forEach((file, index) => {
        // Tworzymy wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview-wrapper';
        
        // Oznaczenie głównego zdjęcia
        if (index === selectedMainIndex) {
            wrapper.classList.add('is-main');
        }

        // 1. Obrazek
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        
        // Kliknięcie w obrazek wybiera go jako główne
        img.onclick = () => {
            selectedMainIndex = index;
            renderujPodglad(); // Odśwież, żeby przerysować zieloną ramkę
        };

        // 2. Przycisk Usuwania (X)
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '✕'; // Znak X
        deleteBtn.className = 'btn-delete-photo';
        deleteBtn.type = 'button'; // Ważne, żeby nie wysłał formularza!
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); // Żeby nie kliknęło się "wybierz główne" pod spodem
            usunZdjecie(index);
        };

        wrapper.appendChild(img);
        wrapper.appendChild(deleteBtn);
        container.appendChild(wrapper);
    });
}

function usunZdjecie(indexToRemove) {
    // Usuwamy plik z tablicy
    allFiles.splice(indexToRemove, 1);

    // Logika naprawy indeksu głównego zdjęcia:
    if (indexToRemove === selectedMainIndex) {
        // Jeśli usunięto główne, ustaw pierwsze jako główne (lub 0 jeśli pusto)
        selectedMainIndex = 0;
    } else if (indexToRemove < selectedMainIndex) {
        // Jeśli usunięto zdjęcie PRZED głównym, indeks głównego musi się zmniejszyć
        selectedMainIndex--;
    }

    renderujPodglad();
}

/* ================================================================================= */
/* ========================== 3. WYSYŁANIE FORMULARZA ============================== */
/* ================================================================================= */

async function wyslijFormularz(e) {
    e.preventDefault();
    
    // Walidacja zdjęć
    if (allFiles.length === 0) {
        pokazPowiadomienie("Musisz dodać przynajmniej jedno zdjęcie!");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    // Blokada przycisku
    submitBtn.disabled = true;
    submitBtn.innerText = "Wysyłanie...";

    const form = e.target;
    const formData = new FormData(form);

    // USUWAMY standardowe pole 'zdjecia', bo dodamy pliki ręcznie z naszej tablicy allFiles
    formData.delete('zdjecia'); 

    // Dodajemy pliki z naszej tablicy
    allFiles.forEach(file => {
        formData.append('zdjecia', file);
    });

    // Dodajemy indeks głównego zdjęcia
    formData.append('mainPhotoIndex', selectedMainIndex);

    formData.append('login', localStorage.getItem('zalogowanyUzytkownik'));

    try {
        const response = await fetch('/api/pojazdy/dodaj', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('toastMessage', 'Auto dodane! Oczekuje na weryfikację.');
            // Przekierowanie do kolekcji, żeby zobaczyć efekt (lub profilu)
            window.location.href = 'kolekcja.html'; 
        } else {
            pokazPowiadomienie("Błąd: " + result.message);
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    } catch (err) {
        console.error("Błąd wysyłki:", err);
        pokazPowiadomienie("Błąd połączenia z serwerem.");
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
}