/* ================================================================================= */
/* ======================== 1. IMPORTY I KONFIGURACJA ============================== */
/* ================================================================================= */
console.log("1. ⏳ Uruchamianie serwera..."); 

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

console.log("2. 📦 Biblioteki załadowane."); 

if (!process.env.DATABASE_URL) {
    console.error("❌ BŁĄD KRYTYCZNY: Nie znaleziono pliku .env!");
    process.exit(1);
} else {
    console.log("3. ✅ Zmienna DATABASE_URL wczytana.");
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 
app.use(express.static(__dirname)); 

/* ================================================================================= */
/* =========================== 2. BAZA DANYCH (POSTGRES) =========================== */
/* ================================================================================= */
console.log("4. 🔌 Próba połączenia z bazą danych...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ BŁĄD POŁĄCZENIA Z BAZĄ:', err.message);
    } else {
        console.log('✅ 5. Połączono z bazą Neon.tech pomyślnie!');
    }
});

/* ================================================================================= */
/* ========================= 3. KONFIGURACJA UPLOADU (MULTER) ====================== */
/* ================================================================================= */

const storageAvatar = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, './public/img/avatars'); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadAvatar = multer({ storage: storageAvatar, limits: { fileSize: 5 * 1024 * 1024 } });

const storageCar = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/img/auta/'); },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'auto-' + uniqueSuffix + '.jpg');
    }
});
const uploadCar = multer({ storage: storageCar });

/* ================================================================================= */
/* ============================ 4. TRASY FRONTENDOWE =============================== */
/* ================================================================================= */

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/kolekcja', (req, res) => res.sendFile(path.join(__dirname, 'kolekcja.html')));
app.get('/profil', (req, res) => res.sendFile(path.join(__dirname, 'profil.html')));
app.get('/logowanie', (req, res) => res.sendFile(path.join(__dirname, 'logowanie.html')));
app.get('/o-nas', (req, res) => res.sendFile(path.join(__dirname, 'o-nas.html')));
app.get('/auto-detale', (req, res) => res.sendFile(path.join(__dirname, 'auto-detale.html')));
app.get('/dodaj-auto', (req, res) => res.sendFile(path.join(__dirname, 'dodaj-auto.html')));
app.get('/edycja-auto', (req, res) => res.sendFile(path.join(__dirname, 'edycja-auto.html')));
app.get('/weryfikacja', (req, res) => res.sendFile(path.join(__dirname, 'weryfikacja.html')));

/* ================================================================================= */
/* ================================ 5. API: UŻYTKOWNICY ============================ */
/* ================================================================================= */

app.post('/api/rejestracja', async (req, res) => {
    try {
        const { login, email, haslo, plec } = req.body;
        const userExists = await pool.query('SELECT * FROM uzytkownicy WHERE login = $1 OR email = $2', [login, email]);
        if (userExists.rows.length > 0) return res.status(400).json({ message: "Login/Email zajęty!" });

        const hashedPassword = await bcrypt.hash(haslo, 10);
        await pool.query('INSERT INTO uzytkownicy (login, nazwa_uzytkownika, email, haslo, plec) VALUES ($1, $1, $2, $3, $4)', [login, email, hashedPassword, plec]);
        res.status(201).json({ message: "Konto założone!" });
    } catch (err) { res.status(500).json({ error: 'Błąd rejestracji' }); }
});

app.post('/api/logowanie', async (req, res) => {
    try {
        const { login, haslo } = req.body;
        const result = await pool.query('SELECT * FROM uzytkownicy WHERE login = $1', [login]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (await bcrypt.compare(haslo, user.haslo)) {
                res.json({ message: "Zalogowano", user: user.login, nazwa: user.nazwa_uzytkownika, avatar: user.avatar_url, rola: user.rola || 'uzytkownik' });
            } else { res.status(401).json({ message: "Błędne hasło" }); }
        } else { res.status(401).json({ message: "Brak użytkownika" }); }
    } catch (err) { res.status(500).json({ message: "Błąd serwera" }); }
});

app.get('/api/uzytkownik/:login', async (req, res) => {
    try {
        // ZMIANA: Używamy u.* (żeby pobrać email, plec itp.) oraz dodajemy subquery dla total_likes
        const query = `
            SELECT u.*, 
            (SELECT COUNT(*) FROM ulubione ul 
             JOIN pojazdy p ON ul.pojazd_id = p.id 
             WHERE p.uzytkownik_dodajacy = u.login) as total_likes
            FROM uzytkownicy u 
            WHERE login = $1
        `;
        
        const user = await pool.query(query, [req.params.login]);
        
        if (user.rows.length === 0) return res.status(404).json({ message: "Brak usera" });
        res.json(user.rows[0]); 
    } catch (err) { res.status(500).send("Błąd serwera"); }
});

app.put('/api/uzytkownik/:login', uploadAvatar.single('avatar'), async (req, res) => {
    try {
        const { login } = req.params;
        const { nazwa_uzytkownika, email, plec, stareHaslo, noweHaslo } = req.body;
        const nowyPlik = req.file ? `/img/avatars/${req.file.filename}` : null;

        const userCheck = await pool.query('SELECT haslo, avatar_url FROM uzytkownicy WHERE login = $1', [login]);
        if (userCheck.rows.length === 0) return res.status(404).json({ message: "Brak usera" });
        if (!await bcrypt.compare(stareHaslo, userCheck.rows[0].haslo)) return res.status(401).json({ message: "Złe hasło!" });

        let finalPass = userCheck.rows[0].haslo;
        if (noweHaslo && noweHaslo.trim() !== "") finalPass = await bcrypt.hash(noweHaslo, 10);
        
        await pool.query('UPDATE uzytkownicy SET nazwa_uzytkownika=$1, email=$2, plec=$3, haslo=$4, avatar_url=$5 WHERE login=$6', 
            [nazwa_uzytkownika, email, plec, finalPass, nowyPlik || userCheck.rows[0].avatar_url, login]);

        res.json({ message: "Zaktualizowano!", nowyAvatar: nowyPlik || userCheck.rows[0].avatar_url });
    } catch (err) { res.status(500).json({ error: 'Błąd serwera' }); }
});

/* ================================================================================= */
/* ================================== 6. API: POJAZDY ============================== */
/* ================================================================================= */


app.get('/api/pojazdy/pending', async (req, res) => {
    try {
        console.log("🔍 [DEBUG] Zapytanie o auta oczekujące..."); 
        const result = await pool.query("SELECT * FROM pojazdy WHERE status = 'pending' ORDER BY id DESC");
        console.log("✅ [DEBUG] Znaleziono aut:", result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ [BŁĄD SQL PENDING]:", err.message); 
        res.status(500).json({ message: "Błąd serwera", detail: err.message });
    }
});

/* ======================== LISTA POJAZDÓW (FILTROWANIE NAPRAWIONE) ======================== */
app.get('/api/pojazdy', async (req, res) => {
    try {
        const { search, limit, offset, sort, power, year } = req.query;

        const limitVal = limit ? parseInt(limit, 10) : null;
        const offsetVal = offset ? parseInt(offset, 10) : 0;

        let query = "SELECT * FROM pojazdy WHERE status = 'approved'";
        let params = [];

        // 1. WYSZUKIWARKA
        if (search) {
            const idx = params.length + 1;
            query += ` AND (marka ILIKE $${idx} OR model ILIKE $${idx})`;
            params.push(`${search}%`);
        }

        // 2. FILTR MOCY
        if (power && power !== 'all') {
            if (power.includes('-')) {
                // ZAKRES: "0-300"
                const [minP, maxP] = power.split('-');
                const idx1 = params.length + 1;
                const idx2 = params.length + 2;
                query += ` AND moc BETWEEN $${idx1} AND $${idx2}`;
                params.push(minP, maxP);
            } else {
                // MINIMUM: "300" (oznacza >300)
                const idx = params.length + 1;
                query += ` AND moc >= $${idx}`;
                params.push(parseInt(power, 10));
            }
        }

        // 3. FILTR ROCZNIKA (NAPRAWIONY)
        if (year && year !== 'all') {
            if (year.includes('_up')) {
                // "2020_up" -> 2020
                const minY = parseInt(year); 
                const idx = params.length + 1;
                query += ` AND rok_produkcji >= $${idx}`;
                params.push(minY);
            } 
            else if (year.includes('_down')) {
                 // "2000_down" -> 2000
                 const maxY = parseInt(year); 
                 const idx = params.length + 1;
                 query += ` AND rok_produkcji < $${idx}`;
                 params.push(maxY);
            }
            else if (year.includes('-')) {
                // "2010-2019"
                const [minY, maxY] = year.split('-');
                const idx1 = params.length + 1;
                const idx2 = params.length + 2;
                query += ` AND rok_produkcji BETWEEN $${idx1} AND $${idx2}`;
                params.push(minY, maxY);
            }
        }

        // 4. SORTOWANIE
        switch (sort) {
            case 'oldest':      query += " ORDER BY id ASC"; break;
            case 'newest':      
            default:            query += " ORDER BY id DESC"; break;
        }

        // 5. PAGINACJA
        if (limitVal) {
            const lIdx = params.length + 1;
            const oIdx = params.length + 2;
            query += ` LIMIT $${lIdx} OFFSET $${oIdx}`;
            params.push(limitVal, offsetVal);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error("Błąd pobierania pojazdów:", err);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

/*======================= LOSOWE AUTA NA STRONIE GŁÓWNEJ ========================== */
app.get('/api/pojazdy/losowe', async (req, res) => {
    try {
        // RANDOM() działa w PostgreSQL
        const result = await pool.query("SELECT * FROM pojazdy WHERE status = 'approved' ORDER BY RANDOM() LIMIT 3");
        res.json(result.rows);
    } catch (err) {
        console.error("Błąd losowania:", err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.get('/api/pojazdy/:id', async (req, res) => {
    try {
        const carResult = await pool.query('SELECT * FROM pojazdy WHERE id = $1', [req.params.id]);
        if (carResult.rows.length === 0) return res.status(404).json({ error: "Nie znaleziono" });
        
        const auto = carResult.rows[0];
        const photos = await pool.query('SELECT * FROM zdjecia WHERE pojazd_id = $1 ORDER BY id ASC', [req.params.id]);
        
        let galeria = photos.rows;
        if (auto.zdjecie_url) {
            const idx = galeria.findIndex(p => p.url === auto.zdjecie_url);
            if (idx > -1) galeria.unshift(galeria.splice(idx, 1)[0]);
            else galeria.unshift({ id: 0, pojazd_id: auto.id, url: auto.zdjecie_url });
        }
        auto.galeria = galeria;
        res.json(auto); 
    } catch (err) { 
        res.status(500).json({ error: 'Błąd serwera' }); 
    }
});

/* ======================== 3 PODOBNE AUTA (SUGESTIE) ======================== */
app.get('/api/pojazdy/podobne/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const currentRes = await pool.query(
            "SELECT marka, rok_produkcji, moc FROM pojazdy WHERE id = $1", 
            [id]
        );
        
        if (currentRes.rows.length === 0) return res.json([]);
        const car = currentRes.rows[0];

        const query = `
            WITH kandydaci AS (
                SELECT *, 
                       (marka = $2) as is_same_brand -- Zapamiętujemy, czy to ta sama marka
                FROM pojazdy 
                WHERE status = 'approved' AND id != $1
                ORDER BY 
                    (marka = $2) DESC,         
                    ABS(rok_produkcji - $3) ASC, 
                    ABS(moc - $4) ASC
                LIMIT 10                       
            )
            SELECT * FROM kandydaci 
            ORDER BY 
                is_same_brand DESC, -- NAJPIERW pokaż te z tą samą marką (Porsche)
                RANDOM()            -- Dopiero wewnątrz grup (marka / nie-marka) losuj kolejność
            LIMIT 5
        `;
        
        const result = await pool.query(query, [id, car.marka, car.rok_produkcji, car.moc]);
        res.json(result.rows);

    } catch (err) {
        console.error("Błąd dobierania:", err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.post('/api/pojazdy/dodaj', uploadCar.array('zdjecia', 10), async (req, res) => {
    try {
        console.log("1. 📥 Otrzymano żądanie dodania auta.");

        // 1. Pobieramy dane i KONWERTUJEMY liczby (to ważne!)
        const { marka, model, pojemnosc, moc, opis, rok_produkcji, mainPhotoIndex, login } = req.body;

        // Zabezpieczenie: Konwersja tekstu na liczby (jeśli przyjdzie pusty string, dajemy 0 lub null)
        const rokInt = parseInt(rok_produkcji) || null;
        const mocInt = parseInt(moc) || null;
        
        console.log("2. 👤 Użytkownik:", login);
        console.log("3. 🚗 Dane:", { marka, model, pojemnosc, mocInt, rokInt });

        // Walidacja loginu
        if (!login || login === 'null') {
            return res.status(400).json({ message: "Błąd: Nie jesteś zalogowany (brak loginu)." });
        }

        const files = req.files; 
        if (!files || files.length === 0) return res.status(400).json({ message: "Brak zdjęć!" });

        // Wybór zdjęcia głównego
        const indeks = parseInt(mainPhotoIndex) || 0;
        const nazwaPliku = files[indeks] ? files[indeks].filename : files[0].filename;

        // 2. Wstawiamy do bazy (TYLKO KOLUMNY, KTÓRE MASZ NA PEWNO)
        // Pomijamy cenę/przebieg/paliwo, bo mogłeś ich jeszcze nie dodać do bazy.
        const query = `
            INSERT INTO pojazdy (
                marka, model, silnik, moc, opis, zdjecie_url, status, rok_produkcji, uzytkownik_dodajacy
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8) 
            RETURNING id
        `;

        const values = [marka, model, pojemnosc, mocInt, opis, nazwaPliku, rokInt, login];

        const carRes = await pool.query(query, values);
        const newId = carRes.rows[0].id;

        // 3. Dodajemy zdjęcia do galerii
        for (const f of files) {
            await pool.query("INSERT INTO zdjecia (pojazd_id, url) VALUES ($1, $2)", [newId, f.filename]);
        }
        
        console.log("4. ✅ Sukces! Dodano auto ID:", newId);
        res.json({ message: "Wysłano do weryfikacji!" });

    } catch (err) { 
        // TUTAJ JEST KLUCZ DO ZAGADKI - Zobacz co wypisze w konsoli!
        console.error("❌❌❌ BŁĄD KRYTYCZNY W BAZIE:", err.message); 
        console.error("Szczegóły:", err);
        res.status(500).json({ message: "Błąd bazy danych: " + err.message }); 
    }
});

/* ======================== EDYCJA ISTNIEJĄCEGO POJAZDU ======================== */
app.put('/api/pojazdy/edytuj/:id', uploadCar.array('newPhotos'), async (req, res) => {
    const { id } = req.params;
    // Odbieramy login z formularza (wysłany przez JS)
    const { 
        marka, model, rok_produkcji, pojemnosc, moc, opis, 
        photosToDelete, mainPhotoType, mainPhotoValue, login 
    } = req.body;

    try {
        console.log(`✏️ Próba edycji auta ID: ${id} przez użytkownika: ${login}`);

        // 1. WERYFIKACJA UPRAWNIEŃ (Najważniejsza część)
        // Pobieramy właściciela auta i rolę osoby edytującej
        const carCheck = await pool.query("SELECT uzytkownik_dodajacy FROM pojazdy WHERE id = $1", [id]);
        const userCheck = await pool.query("SELECT rola FROM uzytkownicy WHERE login = $1", [login]);

        if (carCheck.rows.length === 0) {
            return res.status(404).json({ message: "Pojazd nie istnieje." });
        }

        const owner = carCheck.rows[0].uzytkownik_dodajacy;
        const userRole = userCheck.rows.length > 0 ? userCheck.rows[0].rola : 'user';

        // Jeśli to nie właściciel I nie admin -> blokujemy
        if (owner !== login && userRole !== 'admin') {
            console.warn(`⛔ Próba nieautoryzowanej edycji! Właściciel: ${owner}, Intruz: ${login}`);
            return res.status(403).json({ message: "Brak uprawnień do edycji tego pojazdu." });
        }

        // --- DALSZA CZĘŚĆ (ZAPIS) BEZ ZMIAN ---

        const rokInt = parseInt(rok_produkcji) || null;
        const mocInt = parseInt(moc) || null;

        // 2. Aktualizacja danych tekstowych i reset statusu
        await pool.query(
            `UPDATE pojazdy SET 
                marka = $1, model = $2, rok_produkcji = $3, silnik = $4, moc = $5, opis = $6,
                status = 'pending' 
            WHERE id = $7`,
            [marka, model, rokInt, pojemnosc, mocInt, opis, id]
        );

        // 3. Usuwanie zdjęć
        if (photosToDelete) {
            const ids = JSON.parse(photosToDelete);
            if (ids.length > 0) {
                // Najpierw pobierz nazwy plików, żeby usunąć z dysku (opcjonalne czyszczenie)
                const filesRes = await pool.query("SELECT url FROM zdjecia WHERE id = ANY($1)", [ids]);
                filesRes.rows.forEach(row => {
                    const filePath = path.join(__dirname, 'public/img/auta', row.url);
                    fs.unlink(filePath, (err) => { if(err && err.code !== 'ENOENT') console.error(err); });
                });

                await pool.query("DELETE FROM zdjecia WHERE id = ANY($1)", [ids]);
            }
        }

        // 4. Dodawanie nowych zdjęć
        const newFiles = req.files;
        let newMainName = null;

        if (newFiles && newFiles.length > 0) {
            for (let i = 0; i < newFiles.length; i++) {
                await pool.query("INSERT INTO zdjecia (pojazd_id, url) VALUES ($1, $2)", [id, newFiles[i].filename]);
                if (mainPhotoType === 'new' && parseInt(mainPhotoValue) === i) {
                    newMainName = newFiles[i].filename;
                }
            }
        }

        // 5. Aktualizacja okładki
        if (mainPhotoType === 'new' && newMainName) {
            await pool.query("UPDATE pojazdy SET zdjecie_url = $1 WHERE id = $2", [newMainName, id]);
        } else if (mainPhotoType === 'existing' && mainPhotoValue && mainPhotoValue !== 'null') {
            await pool.query("UPDATE pojazdy SET zdjecie_url = $1 WHERE id = $2", [mainPhotoValue, id]);
        }

        res.json({ message: "Zaktualizowano pomyślnie." });

    } catch (err) {
        console.error("❌ Błąd edycji:", err);
        res.status(500).json({ message: "Błąd serwera: " + err.message });
    }
});

app.put('/api/pojazdy/aktualizuj/:id', uploadCar.array('newPhotos'), async (req, res) => {
    try {
        const { id } = req.params;
        const { marka, model, rok_produkcji, pojemnosc, moc, opis, photosToDelete, mainPhotoType, mainPhotoValue } = req.body;
        
        await pool.query(`UPDATE pojazdy SET marka=$1, model=$2, rok_produkcji=$3, silnik=$4, moc=$5, opis=$6 WHERE id=$7`,
            [marka, model, rok_produkcji, pojemnosc, moc, opis, id]);

        if (photosToDelete) {
            const ids = JSON.parse(photosToDelete);
            if (ids.length > 0) await pool.query("DELETE FROM zdjecia WHERE id = ANY($1)", [ids]);
        }

        const newFiles = req.files;
        let newMainName = null;
        if (newFiles && newFiles.length > 0) {
            for (let i = 0; i < newFiles.length; i++) {
                await pool.query("INSERT INTO zdjecia (pojazd_id, url) VALUES ($1, $2)", [id, newFiles[i].filename]);
                if (mainPhotoType === 'new' && parseInt(mainPhotoValue) === i) newMainName = newFiles[i].filename;
            }
        }

        if (mainPhotoType === 'new' && newMainName) await pool.query("UPDATE pojazdy SET zdjecie_url = $1 WHERE id = $2", [newMainName, id]);
        else if (mainPhotoType === 'existing' && mainPhotoValue && mainPhotoValue !== 'null') await pool.query("UPDATE pojazdy SET zdjecie_url = $1 WHERE id = $2", [mainPhotoValue, id]);

        res.json({ message: "Zaktualizowano!" });
    } catch (err) { res.status(500).json({ message: "Błąd aktualizacji" }); }
});

/* --- TRWAŁE USUWANIE POJAZDU (PRZEZ WŁAŚCICIELA) --- */
app.delete('/api/pojazdy/:id', async (req, res) => {
    const { id } = req.params;
    const { login } = req.query; // Kto chce usunąć?

    try {
        console.log(`🗑️ Usuwanie pojazdu ID: ${id} przez użytkownika: ${login}`);

        // 1. Sprawdzamy, czy użytkownik w ogóle istnieje i jaką ma ROLĘ
        const userResult = await pool.query("SELECT rola FROM uzytkownicy WHERE login = $1", [login]);
        
        if (userResult.rows.length === 0) {
            return res.status(403).json({ message: "Użytkownik nieznany." });
        }

        const userRole = userResult.rows[0].rola; // np. 'admin' lub 'user'

        // 2. Pobieramy dane auta (kto je dodał i jakie ma zdjęcia)
        const carResult = await pool.query("SELECT uzytkownik_dodajacy, zdjecie_url FROM pojazdy WHERE id = $1", [id]);

        if (carResult.rows.length === 0) {
            return res.status(404).json({ message: "Pojazd nie istnieje." });
        }

        const auto = carResult.rows[0];

        // 3. LOGIKA BEZPIECZEŃSTWA (Poprawiona)
        // Pozwalamy usunąć JEŚLI:
        // (Użytkownik to właściciel auta) LUB (Użytkownik ma rolę 'admin')
        const isOwner = (auto.uzytkownik_dodajacy === login);
        const isAdmin = (userRole === 'admin');

        if (!isOwner && !isAdmin) {
            console.log(`⛔ Odmowa usunięcia. Login: ${login}, Rola: ${userRole}, Właściciel: ${auto.uzytkownik_dodajacy}`);
            return res.status(403).json({ message: "Nie masz uprawnień do usunięcia tego pojazdu!" });
        }

        // --- DALSZA CZĘŚĆ BEZ ZMIAN (USUWANIE PLIKÓW I REKORDÓW) ---

        // 4. Zbieranie plików do usunięcia
        let filesToDelete = [];
        if (auto.zdjecie_url) filesToDelete.push(auto.zdjecie_url);

        const galleryResult = await pool.query("SELECT url FROM zdjecia WHERE pojazd_id = $1", [id]);
        galleryResult.rows.forEach(row => {
            if (row.url) filesToDelete.push(row.url);
        });

        filesToDelete = [...new Set(filesToDelete)]; // Usuń duplikaty

        // 5. Fizyczne usuwanie z dysku
        filesToDelete.forEach(filename => {
            const filePath = path.join(__dirname, 'public/img/auta', filename);
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error(`Błąd usuwania pliku ${filename}:`, err.message);
                }
            });
        });

        // 6. Czyszczenie bazy danych
        await pool.query("DELETE FROM zdjecia WHERE pojazd_id = $1", [id]);
        await pool.query("DELETE FROM ulubione WHERE pojazd_id = $1", [id]);
        await pool.query("DELETE FROM komentarze WHERE pojazd_id = $1", [id]);
        await pool.query("DELETE FROM pojazdy WHERE id = $1", [id]);

        res.json({ message: "Pojazd usunięty pomyślnie." });

    } catch (err) {
        console.error("❌ Błąd serwera przy usuwaniu:", err);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

/* ================================================================================= */
/* ========================== 7. API: RESZTA FUNKCJI ADMINA ======================== */
/* ================================================================================= */

app.put('/api/pojazdy/zatwierdz/:id', async (req, res) => {
    try {
        // 1. Aktualizujemy status i pobieramy dane auta oraz właściciela (RETURNING)
        const car = await pool.query(
            "UPDATE pojazdy SET status = 'approved' WHERE id = $1 RETURNING uzytkownik_dodajacy, marka, model", 
            [req.params.id]
        );

        // 2. Jeśli auto istniało, wysyłamy powiadomienie do właściciela
        if (car.rows.length > 0) {
            const owner = car.rows[0].uzytkownik_dodajacy;
            const auto = car.rows[0];

            await pool.query(
                "INSERT INTO powiadomienia (uzytkownik_login, tresc) VALUES ($1, $2)",
                [owner, `Twój pojazd ${auto.marka} ${auto.model} został zatwierdzony przez Admina! ✅`]
            );
        }

        res.json({ message: "Zatwierdzono" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Błąd serwera" }); 
    }
});

app.put('/api/pojazdy/odrzuc/:id', async (req, res) => {
    try {
        // 1. Odrzucamy (status rejected) i pobieramy dane
        const car = await pool.query(
            "UPDATE pojazdy SET status = 'rejected' WHERE id = $1 RETURNING uzytkownik_dodajacy, marka, model", 
            [req.params.id]
        );

        // 2. Powiadomienie o odrzuceniu
        if (car.rows.length > 0) {
            const owner = car.rows[0].uzytkownik_dodajacy;
            const auto = car.rows[0];

            await pool.query(
                "INSERT INTO powiadomienia (uzytkownik_login, tresc) VALUES ($1, $2)",
                [owner, `Twój pojazd ${auto.marka} ${auto.model} wymaga poprawek i został cofnięty. Sprawdź 'Moje Auta'. ⚠️`]
            );
        }

        res.json({ message: "Odrzucono" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Błąd serwera" }); 
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const usersCount = await pool.query("SELECT COUNT(*) FROM uzytkownicy");
        const approvedCars = await pool.query("SELECT COUNT(*) FROM pojazdy WHERE status = 'approved'");
        const pendingCars = await pool.query("SELECT COUNT(*) FROM pojazdy WHERE status = 'pending'");

        res.json({
            users: parseInt(usersCount.rows[0].count),
            cars: parseInt(approvedCars.rows[0].count),
            pending: parseInt(pendingCars.rows[0].count)
        });
    } catch (err) {
        console.error("Błąd pobierania statystyk:", err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

/* ================================================================================= */
/* ========================== 8. SYSTEM ULUBIONYCH (SERDUSZKA) ===================== */
/* ================================================================================= */

// 1. Sprawdź status (Czy użytkownik lubi to auto?) i liczbę polubień
app.get('/api/ulubione/status/:id', async (req, res) => {
    const { id } = req.params;
    const { login } = req.query; // Login zalogowanego usera

    try {
        // Liczymy ile osób lubi to auto
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM ulubione WHERE pojazd_id = $1", 
            [id]
        );

        let isLiked = false;
        
        // Jeśli podano login, sprawdzamy czy ten konkretny user lubi
        if (login) {
            const checkResult = await pool.query(
                "SELECT 1 FROM ulubione WHERE pojazd_id = $1 AND uzytkownik_login = $2",
                [id, login]
            );
            if (checkResult.rows.length > 0) isLiked = true;
        }

        res.json({ 
            likes: parseInt(countResult.rows[0].count), 
            isLiked: isLiked 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// 2. Przełącznik (Jak lubi to usuń, jak nie lubi to dodaj)
app.post('/api/ulubione/toggle', async (req, res) => {
    const { login, pojazdId } = req.body;

    if (!login || !pojazdId) {
        return res.status(400).json({ message: "Brak danych" });
    }

    try {
        // Sprawdź czy już jest w ulubionych
        const check = await pool.query(
            "SELECT * FROM ulubione WHERE uzytkownik_login = $1 AND pojazd_id = $2",
            [login, pojazdId]
        );

        if (check.rows.length > 0) {
            // JUŻ JEST -> USUŃ (Unlike)
            await pool.query(
                "DELETE FROM ulubione WHERE uzytkownik_login = $1 AND pojazd_id = $2",
                [login, pojazdId]
            );
            res.json({ action: 'removed', message: "Usunięto z ulubionych" });
        } else {
            // NIE MA -> DODAJ (Like)
            await pool.query(
                "INSERT INTO ulubione (uzytkownik_login, pojazd_id) VALUES ($1, $2)",
                [login, pojazdId]
            );

            // ================= NOWY KOD: POWIADOMIENIE O LAJKU =================
            // 1. Pobieramy dane auta, żeby wiedzieć czyje ono jest
            const carInfo = await pool.query(
                "SELECT uzytkownik_dodajacy, marka, model FROM pojazdy WHERE id = $1", 
                [pojazdId]
            );

            if (carInfo.rows.length > 0) {
                const auto = carInfo.rows[0];
                const wlasciciel = auto.uzytkownik_dodajacy;

                // 2. Wysyłamy powiadomienie TYLKO jeśli lajkujący to nie właściciel
                if (wlasciciel !== login) {
                    await pool.query(
                        "INSERT INTO powiadomienia (uzytkownik_login, tresc) VALUES ($1, $2)",
                        [wlasciciel, `Użytkownik ${login} polubił Twój pojazd: ${auto.marka} ${auto.model}! ❤️`]
                    );
                }
            }
            // ================= KONIEC NOWEGO KODU ==============================

            res.json({ action: 'added', message: "Dodano do ulubionych" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd bazy danych" });
    }
});

/* ================================================================================= */
/* =============================== 9. ULUBIONE.html ================================ */
/* ================================================================================= */
// 3. POBIERANIE LISTY ULUBIONYCH DLA UŻYTKOWNIKA
app.get('/api/ulubione/:login', async (req, res) => {
    const { login } = req.params;
    try {
        // Pobieramy pełne dane aut, które są w ulubionych tego użytkownika
        const query = `
            SELECT p.* FROM pojazdy p
            JOIN ulubione u ON p.id = u.pojazd_id
            WHERE u.uzytkownik_login = $1
            ORDER BY u.id DESC
        `;
        
        const result = await pool.query(query, [login]);
        res.json(result.rows);

    } catch (err) {
        console.error("Błąd pobierania ulubionych:", err);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

/* ================================================================================= */
/* =========================== 10. SYSTEM KOMENTARZY =============================== */
/* ================================================================================= */

// 1. POBIERANIE KOMENTARZY (Z AVATAREM AUTORA)
app.get('/api/komentarze/:pojazdId', async (req, res) => {
    const { pojazdId } = req.params;
    try {
        // Łączymy tabele komentarzy i użytkowników, żeby pobrać też avatar
        const result = await pool.query(`
            SELECT k.id, k.tresc, k.uzytkownik_login, k.data_dodania, u.avatar_url 
            FROM komentarze k
            LEFT JOIN uzytkownicy u ON k.uzytkownik_login = u.login
            WHERE k.pojazd_id = $1
            ORDER BY k.data_dodania DESC
        `, [pojazdId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd pobierania komentarzy" });
    }
});

// 2. DODAWANIE KOMENTARZA
app.post('/api/komentarze', async (req, res) => {
    const { pojazdId, login, tresc } = req.body;

    if (!pojazdId || !login || !tresc) {
        return res.status(400).json({ message: "Brak danych" });
    }

    try {
        // 1. Najpierw dodajemy sam komentarz
        await pool.query(
            "INSERT INTO komentarze (pojazd_id, uzytkownik_login, tresc) VALUES ($1, $2, $3)",
            [pojazdId, login, tresc]
        );

        // ================= NOWY KOD: POWIADOMIENIE O KOMENTARZU =================
        // 2. Pobieramy dane auta, żeby wiedzieć kogo powiadomić
        const carInfo = await pool.query(
            "SELECT uzytkownik_dodajacy, marka, model FROM pojazdy WHERE id = $1", 
            [pojazdId]
        );

        if (carInfo.rows.length > 0) {
            const auto = carInfo.rows[0];
            const wlasciciel = auto.uzytkownik_dodajacy;

            // 3. Wysyłamy powiadomienie TYLKO jeśli komentujący to nie właściciel
            if (wlasciciel !== login) {
                // Skracamy treść komentarza do 30 znaków, żeby powiadomienie nie było za długie
                const skroconaTresc = tresc.length > 30 ? tresc.substring(0, 30) + "..." : tresc;
                
                await pool.query(
                    "INSERT INTO powiadomienia (uzytkownik_login, tresc) VALUES ($1, $2)",
                    [wlasciciel, `Użytkownik ${login} skomentował Twój pojazd ${auto.marka}: "${skroconaTresc}" 💬`]
                );
            }
        }
        // ================= KONIEC NOWEGO KODU ===================================

        res.json({ message: "Komentarz dodany" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// 3. USUWANIE KOMENTARZA
app.delete('/api/komentarze/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM komentarze WHERE id = $1", [id]);
        res.json({ message: "Usunięto komentarz" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd usuwania" });
    }
});

/* ================================================================================= */
/* ========================== 11. PROFIL - MOJE AUTA =============================== */
/* ================================================================================= */

app.get('/api/moje-pojazdy/:login', async (req, res) => {
    const { login } = req.params;
    try {
        // Pobieramy auta usera ORAZ liczymy ile mają polubień (podzapytanie)
        const result = await pool.query(`
            SELECT p.*, 
            (SELECT COUNT(*) FROM ulubione u WHERE u.pojazd_id = p.id) as like_count
            FROM pojazdy p 
            WHERE p.uzytkownik_dodajacy = $1
            ORDER BY p.id DESC
        `, [login]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd pobierania pojazdów" });
    }
});

/* ================================================================================= */
/* ============================ 11. PROFIL PUBLICZNY =============================== */
/* ================================================================================= */

app.get('/api/public-profile/:username', async (req, res) => {
    const { username } = req.params;
    try {
        // ZMIANA: Dodaliśmy podzapytanie (SELECT COUNT...), które liczy lajki
        const result = await pool.query(`
            SELECT u.login, u.nazwa_uzytkownika, u.avatar_url, u.rola, u.data_rejestracji,
            (SELECT COUNT(*) FROM ulubione ul 
             JOIN pojazdy p ON ul.pojazd_id = p.id 
             WHERE p.uzytkownik_dodajacy = u.login) as total_likes
            FROM uzytkownicy u 
            WHERE u.nazwa_uzytkownika = $1
        `, [username]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Użytkownik nie istnieje" });
        }

        const user = result.rows[0];
        res.json({
            login: user.nazwa_uzytkownika, // Frontend używa tego jako nazwy wyświetlanej
            avatar: user.avatar_url,
            rola: user.rola,
            data_rejestracji: user.data_rejestracji,
            total_likes: parseInt(user.total_likes, 10) || 0 // Wysyłamy policzone lajki
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// 2. Pobierz garaż publiczny (Szukamy aut osoby o danej NAZWIE)
app.get('/api/public-garage/:username', async (req, res) => {
    const { username } = req.params;
    try {
        // ZMIANA: Musimy zrobić JOIN, żeby znaleźć login na podstawie nazwy wyświetlanej
        // i dopiero po loginie znaleźć auta.
        const result = await pool.query(`
            SELECT p.* FROM pojazdy p
            JOIN uzytkownicy u ON p.uzytkownik_dodajacy = u.login
            WHERE u.nazwa_uzytkownika = $1 AND p.status = 'approved'
            ORDER BY p.id DESC
        `, [username]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// POWIADOMIENIA

app.get('/api/powiadomienia/:login', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM powiadomienia WHERE uzytkownik_login = $1 ORDER BY data_dodania DESC LIMIT 10",
            [req.params.login]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err); // To pokaże błąd w konsoli serwera
        res.status(500).json({ error: 'Błąd pobierania' });
    }
});

app.put('/api/powiadomienia/przeczytane/:login', async (req, res) => {
    try {
        // Upewnij się, że zapytanie SQL jest dokładnie takie:
        await pool.query("UPDATE powiadomienia SET czy_przeczytane = true WHERE uzytkownik_login = $1", [req.params.login]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Błąd aktualizacji powiadomień' });
    }
});

app.delete('/api/powiadomienia/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM powiadomienia WHERE id = $1", [req.params.id]);
        res.json({ message: "Usunięto" });
    } catch (err) {
        res.status(500).json({ error: 'Błąd usuwania' });
    }
});

/* ================================================================================= */
/* ================================== START SERWERA ================================ */
/* ================================================================================= */
app.listen(port, () => {
    console.log(`🚀 6. SERWER URUCHOMIONY! Działa na http://localhost:${port}`);
});