/* ================================================================================= */
/* ======================== 1. INICJALIZACJA I POWIADOMIENIA ======================= */
/* ================================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // Sprawdzenie, czy po przeładowaniu strony mamy komunikat do wyświetlenia (np. "Wylogowano")
    const wiadomoscPocztowa = localStorage.getItem('toastMessage');
    if (wiadomoscPocztowa) {
        // Funkcja z script.js
        if (typeof pokazPowiadomienie === 'function') {
            pokazPowiadomienie(wiadomoscPocztowa);
        }
        localStorage.removeItem('toastMessage');
    }
    
    // Aktualizacja paska nawigacji (ukrycie "Zaloguj", pokazanie Profilu)
    if (typeof aktualizujNawigacje === 'function') {
        aktualizujNawigacje();
    }

/* ================================================================================= */
/* ======================== 2. PRZEŁĄCZANIE FORMULARZY (UI) ======================== */
/* ================================================================================= */

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toRegisterLink = document.getElementById('to-register');
    const toLoginLink = document.getElementById('to-login');

    // Obsługa kliknięć w zakładki "Zaloguj się" / "Zarejestruj się"
    if (toRegisterLink && toLoginLink) {
        toRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            
            // Zmiana stylów aktywnej zakładki
            toRegisterLink.classList.add('active-tab');
            toLoginLink.classList.remove('active-tab');
        });

        toLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            
            toLoginLink.classList.add('active-tab');
            toRegisterLink.classList.remove('active-tab');
        });
    }

/* ================================================================================= */
/* ============================== 3. OBSŁUGA REJESTRACJI =========================== */
/* ================================================================================= */

    const registerFormElement = document.querySelector('#register-form form');
    
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(registerFormElement);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/rejestracja', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                pokazPowiadomienie(result.message);

                if (response.ok) {
                    // Po udanej rejestracji przełączamy na zakładkę logowania po 2 sekundach
                    setTimeout(() => {
                        if (toLoginLink) toLoginLink.click();
                    }, 2000); 
                }
            } catch (error) {
                console.error('Błąd rejestracji:', error);
                pokazPowiadomienie("Błąd połączenia z serwerem.");
            }
        });
    }

/* ================================================================================= */
/* =============================== 4. OBSŁUGA LOGOWANIA ============================ */
/* ================================================================================= */

    const loginFormElement = document.querySelector('#login-form form');

    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginFormElement);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/logowanie', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Zapisujemy dane użytkownika w przeglądarce
                    localStorage.setItem('zalogowanyUzytkownik', result.user);
                    localStorage.setItem('zalogowanaNazwa', result.nazwa || result.user);
                    localStorage.setItem('zalogowanaRola', result.rola);
                    
                    if (result.avatar) {
                        localStorage.setItem('zalogowanyAvatar', result.avatar);
                    }

                    // Ustawiamy komunikat, który wyświetli się po przeładowaniu strony
                    localStorage.setItem('toastMessage', 'Zalogowano pomyślnie!');
                    
                    // Przekierowanie na stronę główną
                    window.location.href = '/'; 
                } else {
                    pokazPowiadomienie(result.message); 
                }
            } catch (error) {
                console.error('Błąd logowania:', error);
                pokazPowiadomienie("Błąd połączenia z serwerem.");
            }
        });
    }
});