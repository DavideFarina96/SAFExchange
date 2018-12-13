# Eagle Sensors Project 

## Web Platform

### Descrizione del Repository 

In questa cartella sono contenuti tutti i file legati alla Web Platform per la gestione dell'organizzazione interna del Team.

La piattaforma è sviluppata usando il "MEAN stack", ovvero MongoDb, Express 4.0, AngularJS e Node.js.

### Installazione & Primo Setup

Per avviare la piattaforma in locale è necessario installare alcuni pacchetti su Ubuntu. 
In particolare è necessario installare nodejs, mongodb e nodemon. 

Per **mongodb**:

```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
```
```
echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
```
```
sudo apt-get update
```
```
sudo apt-get install -y mongodb-org
```

Per **nodejs**:

```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
```

```
sudo apt-get install -y nodejs
```

Per **nodemon**:

```
sudo npm install -g nodemon 
```

Una volta installate le dipendenze è necessario creare il database e popolare correttamente tutte le tabelle contenti i dati.
Per fare questo sarà sufficiente entrare nella cartella dbExports e inserire il seguente comando:

```
cd dbExports/
```
```
./populateDb.sh
```

Dopo aver installato le dipendenze e popolato il db, per far girare l'applicazione in locale sarà sufficiente tornare nella cartella principale (eagle-webplatform) e digitare il seguente comando:

```
cd ..
```
```
npm install
```
```
./startEverything.sh
```

**Per avviare lo script** di riempimento utenti da csv é necessario installare il modulo pymongo e di python. 

```
sudo pip install pymongo
```

### Stato dello Sviluppo 


Caratteristiche attuali:
- Routing corretto delle pagine attraverso node
- Design del database
- Stile generale della piattaforma
- Pagine principali (login, dashboard, report, creaReport)
- Controller delle pagine
- Integrazione delle pagine (eccetto creaReport) con il db
- Visualizzazione dei dati legati ai report presenti nel db
- Tooltip quando si "hovera" sui badge dei workgroups
- Autenticazione degli utenti
- Sicurezza di base (impossibilità di entrare in pagine per cui non si hanno i permessi)
- Generazione automatica dei report il venerdi notte alle 1am
- Aggiunta dei report tramite il tasto "Crea/Modifica" o esplorando la settimana
- Colorazione dinamica dei badge riferiti ai team e ai workgroups
- log out
- pagina visualizzazione profilo
- modifica profilo
- add task
- backend tasks

Funzionalità da implementare:
- Font corretto per i loghi (quale font)
- lista di tutti i membri per TL
- possibilitá di modifica ruolo da parte di TL
- dettagli task
- visualizzazione dei soli task che puoi vedere (in cui sei assegnato o di cui sei TM)

### Descrizione Tecnica 

TODO
