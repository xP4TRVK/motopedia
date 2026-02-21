--
-- PostgreSQL database dump
--

\restrict tmyhUaQ6vCOLg0BR5fNG3RJqk8PyNS1cvaJjgokVIOy3UbpUKKVREtVVRKIhcaG

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: komentarze_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.komentarze_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.komentarze_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: komentarze; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.komentarze (
    id integer DEFAULT nextval('public.komentarze_id_seq'::regclass) NOT NULL,
    pojazd_id integer,
    uzytkownik_login character varying(50) NOT NULL,
    tresc text NOT NULL,
    data_dodania timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.komentarze OWNER TO postgres;

--
-- Name: pojazdy_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pojazdy_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.pojazdy_id_seq OWNER TO postgres;

--
-- Name: pojazdy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pojazdy (
    id integer DEFAULT nextval('public.pojazdy_id_seq'::regclass) NOT NULL,
    marka character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    rok_produkcji integer,
    opis text,
    silnik character varying(50),
    moc integer,
    zdjecie_url character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    uzytkownik_dodajacy character varying(100)
);


ALTER TABLE public.pojazdy OWNER TO postgres;

--
-- Name: powiadomienia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.powiadomienia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.powiadomienia_id_seq OWNER TO postgres;

--
-- Name: powiadomienia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.powiadomienia (
    id integer DEFAULT nextval('public.powiadomienia_id_seq'::regclass) NOT NULL,
    uzytkownik_login character varying(50),
    tresc text NOT NULL,
    typ character varying(20),
    czy_przeczytane boolean DEFAULT false,
    data_dodania timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.powiadomienia OWNER TO postgres;

--
-- Name: ulubione_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ulubione_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.ulubione_id_seq OWNER TO postgres;

--
-- Name: ulubione; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ulubione (
    id integer DEFAULT nextval('public.ulubione_id_seq'::regclass) NOT NULL,
    uzytkownik_login character varying(50) NOT NULL,
    pojazd_id integer NOT NULL,
    data_dodania timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ulubione OWNER TO postgres;

--
-- Name: uzytkownicy_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uzytkownicy_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.uzytkownicy_id_seq OWNER TO postgres;

--
-- Name: uzytkownicy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uzytkownicy (
    id integer DEFAULT nextval('public.uzytkownicy_id_seq'::regclass) NOT NULL,
    login character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    haslo text NOT NULL,
    data_rejestracji timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    plec character varying(20),
    nazwa_uzytkownika character varying(50),
    avatar_url character varying(255) DEFAULT NULL::character varying,
    rola character varying(20) DEFAULT 'uzytkownik'::character varying
);


ALTER TABLE public.uzytkownicy OWNER TO postgres;

--
-- Name: zdjecia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.zdjecia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.zdjecia_id_seq OWNER TO postgres;

--
-- Name: zdjecia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zdjecia (
    id integer DEFAULT nextval('public.zdjecia_id_seq'::regclass) NOT NULL,
    pojazd_id integer,
    url character varying(255) NOT NULL
);


ALTER TABLE public.zdjecia OWNER TO postgres;

--
-- Data for Name: komentarze; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.komentarze (id, pojazd_id, uzytkownik_login, tresc, data_dodania) FROM stdin;
\.


--
-- Data for Name: pojazdy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pojazdy (id, marka, model, rok_produkcji, opis, silnik, moc, zdjecie_url, status, uzytkownik_dodajacy) FROM stdin;
20	Lamborghini	Miura P400	1966	Matka wszystkich supersamochodów. To Miura zdefiniowała układ z silnikiem umieszczonym centralnie, który stosuje się do dziś. Przepiękne nadwozie zaprojektowane przez Gandiniego, z charakterystycznymi "rzęsami" wokół reflektorów, kryje poprzecznie umieszczone V12. Auto tak piękne, że nawet Enzo Ferrari musiał uchylić kapelusza, choć nigdy by się do tego głośno nie przyznał.	3.9L V12	350	lamborghini_miura_p400_main.png	approved	P4TRVK
24	Chevrolet	Corvette C2	1963	To nie jest zwykły samochód, to "Święty Graal" dla kolekcjonerów Corvette. Rocznik '63 to jedyny rok produkcji z charakterystyczną dzieloną tylną szybą ("Split Window"), co czyni to auto absolutną ikoną designu. Pod maską drzemie brutalne V8, a sylwetka "Sting Ray" inspirowana była morskimi drapieżnikami. To rzeźba na kołach, która wymaga twardej ręki i szacunku na drodze.	5.4L V8	360	chevrolet_corvette_c2_main.png	approved	P4TRVK
16	Shelby	Cobra	1965	Szaleństwo na kołach. Przepis Carrolla Shelby'ego był prosty: wziąć lekkie, eleganckie brytyjskie nadwozie AC Ace i wcisnąć tam potężne, amerykańskie V8 Forda. Efekt? Samochód o stosunku mocy do masy, który przeraża nawet doświadczonych kierowców. Brak systemów bezpieczeństwa, brak dachu, tylko Ty, kierownica i ryczące wydechy parzące w łydki.	7.0L V8	425	shelby_cobra_main.png	approved	P4TRVK
19	Ford	Mustang Boss 429	1969	Najbardziej brutalny i rzadki Mustang ery muscle cars. Ten samochód powstał tylko w jednym celu: aby homologować potężny silnik 429 V8 do wyścigów NASCAR. Komora silnika musiała być ręcznie modyfikowana w fabryce, aby w ogóle zmieścić ten ogromny motor. To bestia, która pożera paliwo i opony w zastraszającym tempie, dając w zamian czystą, mechaniczną adrenalinę.	7.0L V8	375	ford_mustang_boss_429_main.png	approved	P4TRVK
23	BMW	M1	1978	Jedyny prawdziwy supersamochód w historii BMW z silnikiem umieszczonym centralnie. Zaprojektowany przez Giorgetto Giugiaro, łączy włoski styl z niemiecką inżynierią. Powstał, by dominować w wyścigach serii Procar. Jego rzędowa "szóstka" to dzieło sztuki, które brzmi jak mechaniczna symfonia. Auto niezwykle rzadkie i stanowiące kamień milowy dla całej dywizji M.	3.5L R6	277	bmw_m1_main.png	approved	P4TRVK
18	Jaguar	E-type	1961	Sam Enzo Ferrari nazwał go "najpiękniejszym samochodem świata". E-Type to kwintesencja brytyjskiej elegancji lat 60., połączona z osiągami, które w tamtych czasach szokowały (240 km/h). Długa maska, szprychowe koła i dźwięk rzędowej "szóstki" to przepis na motoryzacyjny romans, który trwa do dziś. Ikona popkultury.	3.8L R6	265	jaguar_etype_main.png	approved	P4TRVK
22	Lancia	Delta HF Integrale	1992	Królowa rajdowych tras, która zdominowała WRC na przełomie lat 80. i 90. "Deltona" to esencja kanciastego designu i surowej mechaniki. Te absurdalnie poszerzone nadkola nie są na pokaz – kryją szerszy rozstaw kół potrzebny do utrzymania tej bestii w ryzach. Napęd na cztery koła i turbodoładowane serce sprawiają, że na krętych drogach zawstydza nawet współczesne superauta.	2.0L Turbo	215	lancia_delta_hf_integrale_main.png	approved	P4TRVK
17	Ferrari	250 GTO	1962	Święty Graal motoryzacji. Najdroższy, najbardziej pożądany i prawdopodobnie najwspanialszy samochód, jaki kiedykolwiek wyjechał z Maranello. Stworzony do wygrywania wyścigów, napędzany legendarnym silnikiem V12 Colombo. Posiadanie tego auta to przepustka do najbardziej elitarnego klubu na Ziemi. Wyprodukowano ich zaledwie garstkę.	3.0L V12	300	ferrari_250_gto_main.png	approved	P4TRVK
21	Porsche	930 Turbo	1975	Słynny Widowmaker. Pierwsze seryjne 911 z turbodoładowaniem, które zmieniło zasady gry. Znane z ogromnej "turbodziury" – moc pojawia się nagle i brutalnie, często w połowie zakrętu, co zaskoczyło niejednego kierowcę. Wielki tylny spojler typu "Whale Tail" (Ogon Wieloryba) to nie ozdoba, lecz konieczność, by dopchać dodatkowe powietrze do chłodzonego wiatrem silnika.	3.0L Turbo	260	porsche_930_turbo_main.png	approved	P4TRVK
14	Toyota	GR Yaris	2023	Współczesna legenda rajdów w cywilnym przebraniu. To nie jest zwykły Yaris z mocniejszym silnikiem – to całkowicie inna konstrukcja (hybryda płyty podłogowej Yarisa i Corolli) stworzona, by wygrywać w WRC. Napęd na cztery koła GR-FOUR, karbonowy dach i trzycylindrowy silnik, który generuje absurdalną moc. Auto, które przywraca wiarę w to, że producenci wciąż mają fantazję.	1.6L Turbo	261	toyota_gr_yaris_main.png	approved	P4TRVK
15	Mercedes-Benz	300 SL Gullwing	1954	Dzieło inżynieryjnego geniuszu. Słynne drzwi otwierane do góry ("skrzydła mewy") nie były fanaberią stylisty, lecz koniecznością wynikającą z konstrukcji przestrzennej ramy, która wymuszała szerokie progi. Pierwsze seryjne auto z bezpośrednim wtryskiem paliwa. W latach 50. był to statek kosmiczny na publicznych drogach.	3.0L R6	215	mercedes_benz_300_sl_gullwing_main.png	approved	P4TRVK
9	Ferrari	SF90 Stradale	2023	Technologiczny pokaz siły z Maranello. Pierwsza seryjna hybryda plug-in od Ferrari, która redefiniuje pojęcie prędkości. Trzy silniki elektryczne wspomagają podwójnie doładowane V8, dając łącznie 1000 KM. To auto jest tak szybkie, że mózg kierowcy z trudem nadąża za zmieniającym się krajobrazem. Inżynieria F1 na drodze.	4.0 V8 Hybrid	1000	ferrari_sf90_stradale_main.png	approved	P4TRVK
26	McLaren	570s Coupe	2018	Chirurgiczna precyzja z brytyjskiego Woking. Dzięki karbonowemu monokokowi auto jest niesamowicie lekkie i sztywne. Drzwi otwierane do góry robią show pod każdą restauracją, ale to na krętej drodze McLaren pokazuje pazur. Układ kierowniczy przekazuje informacje z drogi w sposób, o jakim konkurencja może tylko pomarzyć.	3.8	569	auto-1770413536629-616053558.jpg	approved	P4TRVK
5	Ferrari	F8 Tributo	2022	Hołd dla wielokrotnie nagradzanego silnika V8 Ferrari. F8 Tributo to ewolucja modelu 488, doprowadzona do perfekcji. Włoski styl łączy się tu z zabójczą skutecznością aerodynamiczną (kanał S-Duct na masce). To prawdopodobnie ostatnie V8 Ferrari bez wspomagania elektrycznego, co czyni je przyszłym klasykiem.	3.9L V8 TT	720	ferrari_f8_tributo_main.png	approved	P4TRVK
8	Tesla	Model S Plaid	2024	Zagięcie czasoprzestrzeni w rodzinnym sedanie. Przyspieszenie tego auta jest fizycznie bolesne. Trzy silniki elektryczne generują moment obrotowy dostępny natychmiast, katapultując auto do setki w nieco ponad 2 sekundy. Kierownica typu "Yoke" i minimalistyczne wnętrze sprawiają wrażenie pilotowania statku Enterprise, choć jakość wykonania wciąż budzi dyskusje.	3 Silniki Elektryczne	1020	tesla_model_s_plaid_main.png	approved	P4TRVK
13	Mercedes-Benz	AMG GT	2020	Niemiecki młot na superauta. Długa maska, cofnięta kabina i potężne V8 biturbo sprawiają, że czujesz się w nim jak pilot myśliwca z II Wojny Światowej. To duchowy spadkobierca SLS-a, ale bardziej skupiony na precyzji prowadzenia. Dźwięk tego silnika to głęboki, basowy bulgot, który jest wizytówką Affalterbach.	4.0L V8 TT	530	mercedes_benz_amg_gt_main.png	approved	P4TRVK
7	Porsche	911 GT3 RS	2023	Samochód wyścigowy, któremu przypadkiem dano tablice rejestracyjne. To narzędzie chirurgiczne do walki z czasem na torze. Aktywna aerodynamika (DRS) rodem z F1 generuje docisk, który pozwala pokonywać zakręty z prędkościami przeczącymi prawom fizyki. Wolnossący bokser kręcący się do 9000 obrotów to muzyka dla uszu każdego purysty.	4.0 Flat-6	525	porsche_911_gt3_rs_main.png	approved	P4TRVK
12	Lamborghini	Revuelto	2024	Początek nowej ery dla byka z Sant'Agata. Revuelto łączy legendarne, wolnossące V12 z nowoczesną technologią hybrydową, oferując łącznie ponad 1000 KM. To pierwszy "HPEV" marki. Zachowuje duszę i wrzask poprzedników, dodając kosmiczne przyspieszenie dzięki silnikom elektrycznym. Wygląda jak statek kosmiczny, który przypadkiem wylądował na autostradzie.	6.5L V12 Hybrid	1015	lamborghini_revuelto_main.png	approved	P4TRVK
2	Tesla	Model 3	2023	Samochód, który zrewolucjonizował rynek i wprowadził elektromobilność pod strzechy. Choć wygląda niepozornie, wersja Performance potrafi zawstydzić wiele aut sportowych spod świateł. Minimalistyczne wnętrze sterowane z tabletu to wizja przyszłości, która stała się teraźniejszością. Idealny daily driver XXI wieku dla fana gadżetów.	Elektryczny	283	tesla_model_3_main.png	approved	P4TRVK
11	Audi	RS6 Avant	2024	Najbardziej wszechstronny supersamochód świata. Z jednej strony luksusowe kombi, którym wygodnie zawieziesz dzieci do szkoły i zrobisz zakupy w IKEA. Z drugiej – potwór z silnikiem V8 biturbo, który na autostradzie bez trudu dotrzymuje kroku Ferrari. Idealny balans między brutalną mocą a codzienną użytecznością.	4.0L V8 TT	630	audi_rs6_avant_main.png	approved	P4TRVK
6	Lamborghini	Huracan	2021	Ostatni bastion wolnossącego V10. W świecie turbosprężarek i hybryd, Huracan jest jak dinozaur – głośny, wściekły i cudownie analogowy w reakcji na gaz. Jego ostra stylistyka sprawia, że wygląda szybko nawet gdy stoi w miejscu. Dźwięk tego silnika przy redukcji biegów to uzależnienie, z którego nie chcesz się leczyć.	5.2 V10	610	lamborghini_huracan_main.png	approved	P4TRVK
10	BMW	M4 Competition	2024	Maszyna do precyzyjnego połykania zakrętów. Kontrowersyjny design z wielkimi "nerkami" nadrabia fenomenalnym układem jezdnym. Silnik S58 to inżynieryjny majstersztyk, który uwielbia wysokie obroty. Dzięki napędowi M xDrive auto jest piekielnie skuteczne w każdych warunkach, a po odłączeniu przedniej osi staje się maszyną do generowania dymu z opon.	3.0L R6 TT	510	bmw_m4_competition_main.png	approved	P4TRVK
4	Porsche	911 Turbo S	2023	Prawdopodobnie najszybszy sposób na pokonanie dowolnego odcinka drogi w każdych warunkach pogodowych. Turbo S to technologiczny majstersztyk, który łączy luksus z osiągami hiper-samochodu. Start z procedury Launch Control w tym aucie powoduje chwilowe niedotlenienie mózgu. Perfekcja w każdym calu, która nigdy się nie męczy.	3.7L TT	650	porsche_911_turbo_s_main.png	approved	P4TRVK
3	BMW	M3	2021	Wzorzec sportowego sedana od ponad 30 lat. Najnowsza generacja G80 jest brutalnie szybka i niesamowicie sztywna. To samochód z rozdwojeniem jaźni – rano zawieziesz nim rodzinę na wakacje w pełnym komforcie, a po południu wykręcisz świetny czas na torze Nürburgring. Ikona, która z każdą generacją staje się coraz szybsza.	3.0L R6 TT	480	bmw_m3_main.png	approved	P4TRVK
46	McLaren	P1	2013	Część "Świętej Trójcy" hypercarów. P1 nie jest samochodem, to broń biologiczna. Hybrydowy układ napędowy służy tu tylko jednemu: "wypełnianiu dziur" w momencie obrotowym turbosprężarek. Auto generuje taki docisk aerodynamiczny, że jazda nim przypomina walkę z żywiołem. Brutalny, dziki i niebezpieczny.	3.8L V8 Hybrid	916	auto-1771714455730-202985050.jpg	approved	P4TRVK
45	Ford	GT	2005	Hołd dla pogromcy Ferrari z lat 60. Ford stworzył auto, które wygląda jak klasyk, ale jeździ jak nowoczesny supersamochód. Brak systemów wspomagających, tylko Ty, manualna skrzynia i kompresor wyjący tuż za Twoimi plecami. Drzwi zachodzące na dach to koszmar na parkingu, ale kogo to obchodzi?	5.4L V8 SC	558	auto-1771714493181-339863975.jpg	approved	P4TRVK
44	Mercedes-Benz	C63 AMG W204	2011	Auto, które bardziej niszczy opony niż jeździ. Wolnossący silnik 6.2L V8 wsadzony do małego sedana to przepis na katastrofę i... najlepszą zabawę na świecie. Brzmi jak nadchodząca burza, a tył chce wyprzedzić przód na każdym rondzie. Ostatni bastion wielkich pojemności w klasie średniej.	6.2L V8	457	auto-1771714608124-606757879.jpg	approved	P4TRVK
43	Porsche	Carrera GT	2004	Jeden z najtrudniejszych do okiełznania supersamochodów w historii. Silnik V10 wywodzi się z anulowanego programu wyścigowego Le Mans. Brak systemów kontroli trakcji i manualna skrzynia biegów z drewnianą gałką sprawiają, że to auto dla kierowców o stalowych nerwach. Dźwięk? Czysta mechaniczna furia.	5.7L V10	612	auto-1771714643920-875130078.jpg	approved	P4TRVK
42	Honda	S2000 CR	2008	Kwintesencja roadstera. Silnik F22C to inżynieryjny majstersztyk, który ożywa dopiero tam, gdzie inne auta błagają o zmianę biegu. Skrzynia biegów ma skok lewarka krótki jak przeładowanie karabinu. Wersja CR (Club Racer) to torowa zabawka bez zbędnych wygłuszeń.	2.2L R4	240	auto-1771714679681-169709839.jpg	approved	P4TRVK
41	Lexus	LFA	2010	Samochód stworzony bez liczenia się z kosztami. Jego silnik V10, zestrojony przez dział muzyczny Yamahy, brzmi jak bolid Formuły 1 z lat 90. Wkręca się na obroty tak szybko, że trzeba było zamontować cyfrowy obrotomierz, bo analogowy nie nadążał. Nadwozie utkane z włókna węglowego na specjalnie zbudowanej maszynie.	4.8L V10	560	auto-1771714719334-102164962.jpg	approved	P4TRVK
40	Nissan	GT-R R35	2012	Godzilla. Samochód, który przepisał prawa fizyki i zawstydził superauta kosztujące trzy razy więcej. Komputerowo sterowany napęd na cztery koła sprawia, że przyczepność jest nieskończona. To cyfrowy młot na analogowe gwoździe. Launch Control w tym aucie powoduje przemieszczenie organów wewnętrznych.	3.8L V6 TT	550	auto-1771714762614-720693891.jpg	approved	P4TRVK
39	Ferrari	458 Italia	2011	Ostatnie V8 Ferrari z centralnie umieszczonym silnikiem bez turbodoładowania. Reakcja na gaz jest telepatyczna, a silnik kręci się do niebotycznych 9000 obr./min. Design Pininfariny jest ponadczasowy, a potrójna rura wydechowa nawiązuje do legendarnego F40. To auto tańczy w zakrętach jak baletnica na sterydach.	4.5L V8	570	auto-1771714805840-344914553.jpg	approved	P4TRVK
38	BMW	M3 E46 CSL	2003	Absolutna legenda i prawdopodobnie najlepsze M3 w historii. Wersja CSL (Coupe Sport Lightweight) to dieta odchudzająca połączona z karbonowym dachem i unikalnym układem dolotowym ("airbox"). Dźwięk silnika S54 przy 8000 obrotów to metaliczny ryk, który jeży włosy na karku. Skrzynia SMG II, choć brutalna, tutaj pasuje idealnie.	3.2L R6	360	auto-1771714854221-808711432.jpg	approved	P4TRVK
58	Koenigsegg	Agera RS	2015	Auto, które zdetronizowało Bugatti. Szwedzka inżynieria Christiana von Koenigsegga to magia – od felg z pustego w środku włókna węglowego po autorskie zawieszenie Triplex. V8 twin-turbo generuje moc, która wydaje się nierealna. Pobiło rekord prędkości na publicznej drodze w Nevadzie.	5.0L V8 TT	1160	auto-1771713738207-542443916.jpg	approved	P4TRVK
65	Renault	Clio V6 Phase 2	2003	Ktoś we Francji upadł na głowę i postanowił wsadzić silnik V6 zamiast tylnej kanapy do małego Clio. Efekt? Auto krótkie, szerokie i trudne w prowadzeniu, ale absolutnie niepowtarzalne. Napęd na tył w hatchbacku to przepis na bączki na każdym mokrym rondzie.	3.0L V6	255	auto-1771713202708-346878105.jpg	approved	P4TRVK
64	Mazda	RX-8 R3	2009	Ostatnie seryjne auto z silnikiem Wankla. Wersja R3 to dopracowany do perfekcji model z fotelami Recaro i sztywniejszym zawieszeniem. Silnik rotacyjny kręci się do 9000 obr./min gładko jak silnik elektryczny, ale pije olej i paliwo w tempie startującego odrzutowca. Unikalna konstrukcja drzwi "freestyle".	1.3L Rotary	231	auto-1771713270132-531558731.jpg	approved	P4TRVK
63	Porsche	918 Spyder	2013	Pokazał światu, że hybryda może być ekscytująca. Wydechy wyprowadzone pionowo za głowami pasażerów ("top pipes") to jeden z najfajniejszych detali w historii. Łączy wolnossące V8 z wyścigówki RS Spyder z silnikami elektrycznymi. Perfekcyjna trakcja i technologia jutra.	4.6L V8 Hybrid	887	auto-1771713315491-267858828.jpg	approved	P4TRVK
62	Bentley	Continental GT Speed	2012	Lokomotywa w skórze i drewnie. Waży ponad dwie tony, a mimo to przyspiesza jak pocisk dzięki potężnemu silnikowi W12. W środku panuje cisza absolutna, nawet przy 300 km/h. To definicja luksusowego Grand Tourera – przejedziesz nim kontynent i wysiądziesz wypoczęty.	6.0L W12 TT	625	auto-1771713435703-68715424.jpg	approved	P4TRVK
61	Lotus	Exige Cup 430	2017	"Simplify, then add lightness". To auto waży tyle co nic i ma mocny silnik V6 z kompresorem. Nie ma tu miejsca na komfort – wchodzenie do środka to gimnastyka, ale na torze Exige niszczy wszystko, co waży więcej niż tona. Czyste, niefiltrowane połączenie z asfaltem.	3.5L V6 SC	430	auto-1771713578532-478315711.jpg	approved	P4TRVK
60	Alfa Romeo	Giulia Quadrifoglio	2016	Powrót króla. Alfa wzięła silnik V8 z Ferrari California, ucięła dwa cylindry i wsadziła go do pięknego sedana. Prowadzi się lepiej niż BMW M3, a brzmienie wydechu to czysta Italia. Niezwykle szybka, emocjonująca i... kapryśna, jak każda prawdziwa Alfa.	2.9L V6 TT	510	auto-1771713627001-245506354.jpg	approved	P4TRVK
59	Pagani	Zonda Cinque	2009	Samochód, który powinien wisieć w Luwrze. Wyprodukowano tylko 5 sztuk. Nadwozie z karbo-tytanu, wnętrze jak z pracowni zegarmistrzowskiej i wolnossące V12 od AMG, które brzmi jak opętane. Horacio Pagani nie buduje samochodów, on tworzy biżuterię zdolną jechać 350 km/h.	7.3L V12	678	auto-1771713696686-830005198.jpg	approved	P4TRVK
57	Ford	Focus RS mk2	2009	Hot hatch na sterydach. 5-cylindrowy silnik Volvo brzmi jak połowa V10 z Lamborghini. Napęd tylko na przód, ale dzięki zawieszeniu RevoKnuckle jakoś sobie radzi (choć wyrywa kierownicę z rąk). W kolorze Ultimate Green jest tak dyskretny jak wybuch w fabryce fajerwerków.	2.5L R5 Turbo	305	auto-1771713800473-257232681.jpg	approved	P4TRVK
56	Dodge	Viper ACR	2017	Pojemność silnika z ciężarówki w aucie wyścigowym. 8.4 litra to nie pomyłka. Wersja ACR posiada aerodynamikę, która generuje tyle docisku, że teoretycznie mogłaby jeździć po suficie. To auto to środkowy palec wymierzony w finezję i technologię hybrydową. Czysta, mechaniczna przemoc.	8.4L V10	645	auto-1771713946669-290996493.jpg	approved	P4TRVK
55	Aston Martin	DBS	2008	Elegancja w garniturze, która potrafi przyłożyć. Auto znane z "Casino Royale". Silnik V12 nie krzyczy, on wydaje z siebie głęboki, arystokratyczny ryk. Ręcznie szyta skóra, kryształowy kluczyk i ponadczasowa linia nadwozia. Grand Tourer w najlepszym wydaniu.	5.9L V12	517	auto-1771713994027-823045712.jpg	approved	P4TRVK
53	Alfa Romeo	8C Competizione	2007	Dzieło sztuki, które przypadkiem jeździ. Limitowana produkcja, nadwozie z włókna węglowego i silnik Ferrari/Maserati. Prowadzenie nie jest idealne, ale nikogo to nie obchodzi, gdy auto wygląda i brzmi tak wspaniale. To motoryzacja dla duszy, nie dla stopera.	4.7L V8	450	auto-1771714106553-636571364.jpg	approved	P4TRVK
52	Mercedes-Benz	SLS AMG	2010	Pierwsze auto zaprojektowane samodzielnie przez AMG. Długa maska, cofnięta kabina i drzwi otwierane do góry to hołd dla 300 SL. Silnik 6.2 V8 to wolnossący potwór z suchą miską olejową. To auto ma więcej charakteru w jednym cylindrze niż większość współczesnych hybryd w całości.	6.2L V8	571	auto-1771714159805-293489603.jpg	approved	P4TRVK
51	Subaru	Impreza WRX STI	2004	Słynny "Blobeye". Niebieski lakier, złote felgi i ten charakterystyczny bulgot boksera, który słychać z trzech przecznic. Dzięki symetrycznemu napędowi AWD jest niepowstrzymana w każdych warunkach pogodowych. To auto nie jeździ, ono "klei" się do drogi.	2.5L Boxer Turbo	265	auto-1771714197374-668341787.jpg	approved	P4TRVK
50	Mitsubishi	Lancer Evolution IX	2006	Szczytowa forma ewolucji. Silnik 4G63T z systemem MIVEC to legenda tuningu – wytrzymuje absurdalne moce. Napęd na cztery koła z aktywnym dyferencjałem (AYC) sprawia, że to auto przeczy prawom fizyki na szutrze i asfalcie. Surowe wnętrze, wielkie skrzydło i turbodziura wielkości Kanionu Kolorado.	2.0L Turbo	280	auto-1771714271356-296637734.jpg	approved	P4TRVK
49	Bugatti	Veyron 16.4	2005	Concorde na kołach. Pierwszy seryjny samochód, który przekroczył barierę 400 km/h i 1000 KM. Posiada 16 cylindrów, 4 turbosprężarki i 10 chłodnic. Inżynieria tego auta to poziom lotniczy – opony kosztują tyle co nowe BMW, a przyspieszenie jest tak liniowe i nieustające, że mózg traci orientację.	8.0L W16 qTurbo	1001	auto-1771714323689-970393311.jpg	approved	P4TRVK
48	Audi	R8 V10 Plus	2015	Niemiecka precyzja z włoskim sercem. Dzieli silnik i podwozie z Lamborghini Huracanem, ale jest bardziej cywilizowane na co dzień. Napęd Quattro sprawia, że każdy kierowca czuje się jak mistrz kierownicy. Charakterystyczne "side blades" na bokach to jeden z najlepszych detali stylistycznych XXI wieku.	5.2L V10	610	auto-1771714366403-991598025.jpg	approved	P4TRVK
66	Audi	RS6 C6	2008	Szczyt szaleństwa Audi. Wsadzili silnik V10 Twin Turbo do rodzinnego kombi. 580 koni mechanicznych w 2008 roku to był kosmos – więcej niż ówczesne Ferrari F430! Idealne auto do szybkiego transportu lodówki... i upokarzania Porsche na światłach.	5.0L V10 TT	580	auto-1771714963255-120830123.jpg	approved	P4TRVK
67	Ferrari	Enzo	2002	Samochód nazwany imieniem Il Commendatore musiał być wybitny. Nos inspirowany bolidem F1 Michaela Schumachera, silnik V12 i technologia prosto z toru. Skrzynia biegów zmienia przełożenia w 150 milisekund. To auto zdefiniowało segment hiperaut na początku XXI wieku.	6.0L V12	660	auto-1771712750782-156404220.jpg	approved	P4TRVK
54	Lamborghini	Murcielago SV	2009	Ostatnie Lamborghini z legendarnym silnikiem V12 Bizzarriniego, którego korzenie sięgają lat 60. Wersja Super Veloce jest brutalna, głośna i przerażająca. Wielkie skrzydło i centralny wydech wielkości tunelu metra. To auto chce cię zabić przy każdej zmianie biegu i za to je kochamy.	6.5L V12	670	auto-1771714046261-822480356.jpg	approved	P4TRVK
47	BMW	M5 E60	2007	Jedyny seryjny sedan z silnikiem V10 inspirowanym Formułą 1. Gdy działa, jest najwspanialszym autem rodzinnym na świecie, wyjącym do 8250 obr./min. To wilk w owczej skórze, który na autostradzie połyka supersamochody, a potem spokojnie wiezie dzieci do szkoły.	5.0L V10	507	auto-1771714405754-804364761.jpg	approved	P4TRVK
\.


--
-- Data for Name: powiadomienia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.powiadomienia (id, uzytkownik_login, tresc, typ, czy_przeczytane, data_dodania) FROM stdin;
\.


--
-- Data for Name: ulubione; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ulubione (id, uzytkownik_login, pojazd_id, data_dodania) FROM stdin;
5	patryk	26	2026-02-05 21:48:26.888317
6	patryk	7	2026-02-05 21:48:31.859958
\.


--
-- Data for Name: uzytkownicy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.uzytkownicy (id, login, email, haslo, data_rejestracji, plec, nazwa_uzytkownika, avatar_url, rola) FROM stdin;
1	patryk	patryk.patryk@onet.pl	$2b$10$6hWXRYc95Qp7/tUrmi2XpeoZBMFmbEKHMuuK3GIzMbFHCbV2OuLuW	2026-01-10 19:21:55	mezczyzna	mruwa	/img/avatars/1768240959886.jpg	uzytkownik
2	marek	marek@wp.pl	$2b$10$m60/reltt27zZpuuyA/UIOwELXVPZ6sxAlODgKpXUoDn5XJOspzIq	2026-01-11 13:21:36	mezczyzna	marek	\N	uzytkownik
3	julka	julka@wp.pl	$2b$10$ldBd4hEbf5fGfJryR5ZBb..SsAnSgdXV0bvzD/27.qDyy6RGExaEW	2026-01-11 15:35:17	kobieta	julka	\N	uzytkownik
4	P4TRVK	patryk.admin@moto.pl	$2b$10$6SeaqfG3WUgjXH7qW6OqsOms1jHHfCIvs.oXnfWJzrzASTU1PxqhC	2026-01-14 14:49:13.646408	mezczyzna	P4TRVK	/img/avatars/1769190583299.jpg	admin
7	mruwaa	adsdas@ada.pl	$2b$10$WSdYnQB2GbN/agfa67auX.c0oA5rPQHkJyDBva4c3J.amcXHTaoMS	2026-02-04 14:18:30.261018	mezczyzna	mruwaa	\N	uzytkownik
\.


--
-- Data for Name: zdjecia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.zdjecia (id, pojazd_id, url) FROM stdin;
24	26	auto-1770413536629-842099789.jpg
25	26	auto-1770413536629-616053558.jpg
1	67	auto-1771712750782-84029269.jpg
2	67	auto-1771712750782-156404220.jpg
3	65	auto-1771713202708-15472918.jpg
4	65	auto-1771713202708-346878105.jpg
5	64	auto-1771713270132-531558731.jpg
6	64	auto-1771713270132-474900205.jpg
7	63	auto-1771713315491-267858828.jpg
8	63	auto-1771713315491-580629785.jpg
9	62	auto-1771713435703-68715424.jpg
10	61	auto-1771713578532-478315711.jpg
11	60	auto-1771713627001-830361813.jpg
12	60	auto-1771713627001-245506354.jpg
13	59	auto-1771713696686-830005198.jpg
14	58	auto-1771713738207-542443916.jpg
15	57	auto-1771713800473-257232681.jpg
16	56	auto-1771713946669-290996493.jpg
17	55	auto-1771713994027-823045712.jpg
18	54	auto-1771714046261-822480356.jpg
19	53	auto-1771714106553-636571364.jpg
20	52	auto-1771714159805-293489603.jpg
21	51	auto-1771714197374-668341787.jpg
22	50	auto-1771714271356-296637734.jpg
23	49	auto-1771714323689-970393311.jpg
26	48	auto-1771714366403-991598025.jpg
27	47	auto-1771714405754-804364761.jpg
28	46	auto-1771714455730-202985050.jpg
29	45	auto-1771714493181-339863975.jpg
30	44	auto-1771714608124-606757879.jpg
31	43	auto-1771714643920-875130078.jpg
32	42	auto-1771714679681-169709839.jpg
33	41	auto-1771714719334-102164962.jpg
34	40	auto-1771714762614-720693891.jpg
35	39	auto-1771714805840-344914553.jpg
36	38	auto-1771714854221-808711432.jpg
37	66	auto-1771714963255-120830123.jpg
\.


--
-- Name: komentarze_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.komentarze_id_seq', 1, false);


--
-- Name: pojazdy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pojazdy_id_seq', 1, false);


--
-- Name: powiadomienia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.powiadomienia_id_seq', 1, false);


--
-- Name: ulubione_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ulubione_id_seq', 1, false);


--
-- Name: uzytkownicy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uzytkownicy_id_seq', 1, false);


--
-- Name: zdjecia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.zdjecia_id_seq', 37, true);


--
-- Name: komentarze komentarze_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.komentarze
    ADD CONSTRAINT komentarze_pkey PRIMARY KEY (id);


--
-- Name: pojazdy pojazdy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pojazdy
    ADD CONSTRAINT pojazdy_pkey PRIMARY KEY (id);


--
-- Name: powiadomienia powiadomienia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.powiadomienia
    ADD CONSTRAINT powiadomienia_pkey PRIMARY KEY (id);


--
-- Name: ulubione ulubione_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ulubione
    ADD CONSTRAINT ulubione_pkey PRIMARY KEY (id);


--
-- Name: ulubione ulubione_uzytkownik_login_pojazd_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ulubione
    ADD CONSTRAINT ulubione_uzytkownik_login_pojazd_id_key UNIQUE (uzytkownik_login, pojazd_id);


--
-- Name: uzytkownicy uzytkownicy_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uzytkownicy
    ADD CONSTRAINT uzytkownicy_email_key UNIQUE (email);


--
-- Name: uzytkownicy uzytkownicy_login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uzytkownicy
    ADD CONSTRAINT uzytkownicy_login_key UNIQUE (login);


--
-- Name: uzytkownicy uzytkownicy_nazwa_uzytkownika_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uzytkownicy
    ADD CONSTRAINT uzytkownicy_nazwa_uzytkownika_key UNIQUE (nazwa_uzytkownika);


--
-- Name: uzytkownicy uzytkownicy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uzytkownicy
    ADD CONSTRAINT uzytkownicy_pkey PRIMARY KEY (id);


--
-- Name: zdjecia zdjecia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zdjecia
    ADD CONSTRAINT zdjecia_pkey PRIMARY KEY (id);


--
-- Name: komentarze komentarze_pojazd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.komentarze
    ADD CONSTRAINT komentarze_pojazd_id_fkey FOREIGN KEY (pojazd_id) REFERENCES public.pojazdy(id) ON DELETE CASCADE;


--
-- Name: powiadomienia powiadomienia_uzytkownik_login_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.powiadomienia
    ADD CONSTRAINT powiadomienia_uzytkownik_login_fkey FOREIGN KEY (uzytkownik_login) REFERENCES public.uzytkownicy(login) ON DELETE CASCADE;


--
-- Name: ulubione ulubione_pojazd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ulubione
    ADD CONSTRAINT ulubione_pojazd_id_fkey FOREIGN KEY (pojazd_id) REFERENCES public.pojazdy(id) ON DELETE CASCADE;


--
-- Name: zdjecia zdjecia_pojazd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zdjecia
    ADD CONSTRAINT zdjecia_pojazd_id_fkey FOREIGN KEY (pojazd_id) REFERENCES public.pojazdy(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tmyhUaQ6vCOLg0BR5fNG3RJqk8PyNS1cvaJjgokVIOy3UbpUKKVREtVVRKIhcaG

