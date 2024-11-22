document.addEventListener("DOMContentLoaded", function () {
    const bookingForm = document.getElementById('booking-form'); // Form per effettuare una prenotazione
    const authContainer = document.getElementById('auth-container'); // Contenitore per login e registrazione
    const loginBtn = document.getElementById('login-btn'); // Bottone per accedere al form di login
    const registerBtn = document.getElementById('register-btn'); // Bottone per accedere al form di registrazione
    const logoutBtn = document.getElementById('logout-btn'); // Bottone per effettuare il logout
    const modifyBtn = document.getElementById('modify-btn'); // Bottone per modificare una prenotazione
    const welcomeMessage = document.getElementById('welcome-message'); // Messaggio di benvenuto per l'utente loggato
    const bookingListContainer = document.getElementById('booking-list'); // Contenitore delle prenotazioni
    const bookingsList = document.getElementById('bookings'); // Lista delle prenotazioni
    const saveChangesBtn = document.getElementById('save-changes-btn'); // Bottone per salvare le modifiche
    const submitBtn = document.getElementById('booking-btn'); // Bottone per inviare una nuova prenotazione

    let userId = JSON.parse(localStorage.getItem('userId')); // Recupera l'ID utente dal localStorage

    // Funzione per formattare la data
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`; // Ritorna la data in formato gg-mm-aaaa
    }

    // Funzione per aggiornare l'interfaccia utente
    function updateUI() {
        if (userId) {
            // Mostra il form di prenotazione e il messaggio di benvenuto
            bookingForm.style.display = 'block';
            authContainer.style.display = 'none';
            welcomeMessage.innerText = `Benvenuta/o, ${userId.name} ${userId.surname}!`;
            logoutBtn.style.display = 'inline';
            modifyBtn.style.display = 'inline';
            bookingListContainer.style.display = 'block';
            displayBookings(); // Carica le prenotazioni dell'utente
        } else {
            // Mostra il form di autenticazione
            bookingForm.style.display = 'none';
            authContainer.style.display = 'block';
            logoutBtn.style.display = 'none';
            modifyBtn.style.display = 'none';
            bookingListContainer.style.display = 'none';
            welcomeMessage.innerText = '';
        }
    }

    // Funzione per mostrare le prenotazioni dell'utente
    async function displayBookings() {
        try {
            const response = await fetch(`http://localhost:5000/get_bookings?user_id=${userId.id}`);
            if (!response.ok) throw new Error("Errore nel recuperare le prenotazioni.");

            const bookings = await response.json();

            bookingsList.innerHTML = ''; // Pulisce la lista corrente
            bookings.forEach(booking => {
                const card = document.createElement('div');
                card.className = 'booking-card';

                const formattedDate = formatDate(booking.date); // Formatta la data della prenotazione

                // Contenuto della card
                card.innerHTML = `
                    <h3>Servizio: ${booking.service}</h3>
                    <p>Data: ${formattedDate}</p>
                    <p>Ora: ${booking.time}</p>
                `;

                // Bottone per modificare la prenotazione
                const modifyButton = document.createElement('button');
                modifyButton.textContent = 'Modifica';
                modifyButton.classList.add('modify-btn');
                modifyButton.addEventListener('click', function (e) {
                    e.preventDefault(); // Blocca il comportamento predefinito
                    startEditBooking(booking.id, booking.service, booking.date, booking.time);
                });

                // Bottone per cancellare la prenotazione
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Cancella';
                deleteButton.classList.add('delete-btn');
                deleteButton.addEventListener('click', function (e) {
                    e.preventDefault(); // Blocca il comportamento predefinito
                    confirmDeleteBooking(booking.id);
                });

                card.appendChild(modifyButton);
                card.appendChild(deleteButton);
                bookingsList.appendChild(card); // Aggiunge la card alla lista
            });
            bookingListContainer.style.display = 'block';
        } catch (error) {
            console.error(error);
            alert(error.message); // Mostra un messaggio di errore
        }
    }

    // Funzione per confermare la cancellazione di una prenotazione
    function confirmDeleteBooking(bookingId) {
        const confirmed = confirm("Sei sicuro di voler cancellare?");
        if (confirmed) {
            deleteBooking(bookingId); // Procede con la cancellazione
        }
    }

    // Funzione per avviare la modifica di una prenotazione
    function startEditBooking(bookingId, service, date, time) {
        document.getElementById('service').value = service;
        document.getElementById('date').value = date;
        document.getElementById('time').value = time;

        submitBtn.style.display = 'none'; // Nasconde il bottone Prenota
        saveChangesBtn.style.display = 'block'; // Mostra il bottone Salva modifiche

        saveChangesBtn.onclick = function (e) {
            e.preventDefault(); // Blocca il comportamento predefinito
            modifyBooking(bookingId);
        };
    }

    // Funzione per modificare una prenotazione
    async function modifyBooking(bookingId) {
        const service = document.getElementById('service').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;

        try {
            const response = await fetch('http://localhost:5000/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId, service, date, time })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                await displayBookings(); // Aggiorna le prenotazioni
                submitBtn.style.display = 'block';
                saveChangesBtn.style.display = 'none';
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Errore durante la modifica della prenotazione:", error);
            alert("Errore durante la modifica della prenotazione.");
        }
    }

    // Funzione per cancellare una prenotazione
    async function deleteBooking(bookingId) {
        try {
            const response = await fetch('http://localhost:5000/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                await displayBookings(); // Aggiorna le prenotazioni
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Errore durante la cancellazione della prenotazione:", error);
            alert("Errore durante la cancellazione della prenotazione.");
        }
    }

    // Event listener per il bottone Modifica
    modifyBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Blocca il comportamento predefinito
        displayBookings(); // Mostra le prenotazioni
    });

    updateUI(); // Aggiorna l'interfaccia utente

    // Gestione del form di registrazione
    document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, phone, email, password })
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                userId = { id: email, name: firstName, surname: lastName };
                localStorage.setItem('userId', JSON.stringify(userId));
                updateUI();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Errore durante la registrazione:", error);
            alert("Errore nella registrazione.");
        }
    });

    // Gestione del form di login
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                userId = { id: email, name: result.firstName, surname: result.lastName };
                localStorage.setItem('userId', JSON.stringify(userId));
                updateUI();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Errore durante il login:", error);
            alert("Errore nel login.");
        }
    });

    // Gestione del form di prenotazione
    bookingForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!userId) {
            alert("Effettua prima il login.");
            return;
        }

        const service = document.getElementById('service').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;

        try {
            const response = await fetch('http://localhost:5000/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId.id, service, date, time })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                await displayBookings(); // Aggiorna le prenotazioni
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Errore durante la prenotazione:", error);
            alert("Errore durante la prenotazione.");
        }
    });

    // Event listener per i bottoni di navigazione
    loginBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Blocca il comportamento predefinito
        authContainer.querySelector('#login-form').style.display = 'block';
        authContainer.querySelector('#register-form').style.display = 'none';
        bookingForm.style.display = 'none';
    });

    registerBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Blocca il comportamento predefinito
        authContainer.querySelector('#register-form').style.display = 'block';
        authContainer.querySelector('#login-form').style.display = 'none';
        bookingForm.style.display = 'none';
    });

    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Blocca il comportamento predefinito
        userId = null;
        localStorage.removeItem('userId');
        updateUI();
    });
});

// Validazione del campo data
document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById('date');

    dateInput.addEventListener('input', function () {
        const selectedDate = new Date(dateInput.value);
        const dayOfWeek = selectedDate.getUTCDay();

        if (dayOfWeek === 0) {
            dateInput.setCustomValidity("La domenica non è disponibile per le prenotazioni.");
            dateInput.style.borderColor = "red"; // Evidenzia il bordo in rosso
        } else {
            dateInput.setCustomValidity("");
            dateInput.style.borderColor = ""; // Ripristina il colore del bordo
        }
    });
});
