from flask import Flask, request, jsonify, make_response  # Import Flask e strumenti per API
from flask_cors import CORS  # Gestione richieste Cross-Origin
import bcrypt  # Per hash delle password
import uuid  # Generazione di ID univoci
import sqlite3  # Connessione a SQLite

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Abilita CORS per tutte le richieste

# Funzione per inizializzare il database
def init_db():
    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
        # Crea tabella utenti
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                            email TEXT PRIMARY KEY,
                            firstName TEXT NOT NULL,
                            lastName TEXT NOT NULL,
                            phone TEXT NOT NULL,
                            password TEXT NOT NULL
                          )''')
        # Crea tabella prenotazioni
        cursor.execute('''CREATE TABLE IF NOT EXISTS bookings (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            service TEXT NOT NULL,
                            date TEXT NOT NULL,
                            time TEXT NOT NULL,
                            FOREIGN KEY(user_id) REFERENCES users(email)
                          )''')
        conn.commit()

init_db()  # Inizializza il database all'avvio

# Endpoint per la registrazione
@app.route('/register', methods=['POST'])
def register():
    data = request.json  # Dati ricevuti dal client
    firstName = data.get('firstName')
    lastName = data.get('lastName')
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())  # Hash della password

    try:
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            # Inserisce i dati dell'utente nel database
            cursor.execute('INSERT INTO users (email, firstName, lastName, phone, password) VALUES (?, ?, ?, ?, ?)',
                           (email, firstName, lastName, phone, hashed_password))
            conn.commit()

        # Risposta di successo
        response = make_response(jsonify({
            "message": "Registrazione completata",
            "firstName": firstName,
            "lastName": lastName,
            "user_id": email
        }))
    except sqlite3.IntegrityError:
        # Risposta in caso di email già registrata
        response = make_response(jsonify({"error": "Email già registrata"}), 400)

    response.headers.add("Access-Control-Allow-Origin", "*")  # Permette richieste CORS
    return response

# Endpoint per il login
@app.route('/login', methods=['POST'])
def login():
    data = request.json  # Dati ricevuti dal client
    email = data.get('email')
    password = data.get('password')

    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
        # Cerca l'utente nel database
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()

    if user and bcrypt.checkpw(password.encode('utf-8'), user[4]):  # Controlla la password
        # Risposta di successo
        response = make_response(jsonify({
            "message": "Login completato",
            "firstName": user[1],
            "lastName": user[2],
            "user_id": user[0]
        }))
    else:
        # Risposta in caso di credenziali errate
        response = make_response(jsonify({"error": "Credenziali non valide"}), 401)

    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# Endpoint per effettuare una prenotazione con controllo duplicati
@app.route('/book', methods=['POST'])
def book():
    data = request.json  # Dati ricevuti dal client
    user_id = data.get('user_id')
    service = data.get('service')
    date = data.get('date')
    time = data.get('time')
    booking_id = str(uuid.uuid4())  # Genera un ID unico per la prenotazione

    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
        # Verifica duplicati
        cursor.execute('SELECT * FROM bookings WHERE service = ? AND date = ? AND time = ?', (service, date, time))
        existing_booking = cursor.fetchone()

        if existing_booking:
            # Risposta in caso di duplicato
            response = make_response(jsonify({"error": "Esiste già una prenotazione per questo servizio, data e orario"}), 400)
        else:
            # Inserisce la prenotazione nel database
            cursor.execute('INSERT INTO bookings (id, user_id, service, date, time) VALUES (?, ?, ?, ?, ?)',
                           (booking_id, user_id, service, date, time))
            conn.commit()
            response = make_response(jsonify({"message": "Prenotazione completata"}))

    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# Endpoint per ottenere le prenotazioni dell'utente
@app.route('/get_bookings', methods=['GET'])
def get_bookings():
    user_id = request.args.get('user_id')  # Ottiene l'ID utente dalla query
    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
        # Cerca le prenotazioni dell'utente
        cursor.execute('SELECT * FROM bookings WHERE user_id = ?', (user_id,))
        user_bookings = cursor.fetchall()

    # Converte le prenotazioni in formato JSON
    bookings = [{"id": row[0], "service": row[2], "date": row[3], "time": row[4]} for row in user_bookings]
    response = make_response(jsonify(bookings))
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# Endpoint per aggiornare una prenotazione
@app.route('/update', methods=['POST'])
def update_booking():
    data = request.json  # Dati ricevuti dal client
    booking_id = data.get('booking_id')
    service = data.get('service')
    date = data.get('date')
    time = data.get('time')

    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
        # Aggiorna i dati della prenotazione
        cursor.execute('UPDATE bookings SET service = ?, date = ?, time = ? WHERE id = ?',
                       (service, date, time, booking_id))
        conn.commit()

    response = make_response(jsonify({"message": "Prenotazione modificata"}))
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# Endpoint per cancellare una prenotazione
@app.route('/delete', methods=['POST'])
def delete_booking():
    data = request.json  # Dati ricevuti dal client
    booking_id = data.get('booking_id')

    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
        # Elimina la prenotazione
        cursor.execute('DELETE FROM bookings WHERE id = ?', (booking_id,))
        conn.commit()

    response = make_response(jsonify({"message": "Prenotazione cancellata"}))
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)  # Avvia il server Flask

