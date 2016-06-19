# Project 5: Ome Joop's Tour (Groep J): API

We coderen in het Engels. Commitnamen en beschrijvingen moeten ook zinvol zijn, houd de code netjes en overzichtelijk.

## Installatie en uitvoeren API

### Installeren van NodeJS v4.4.5 LTS
https://nodejs.org/en/
Waar het wordt geïnstalleerd maakt niet uit. Locatie kan dus aangepast worden. De rest alles default laten en installeren.
<br />![alt tag](http://i.imgur.com/zjLvv3t.png)<br />

### Installeren van Python
https://www.python.org/downloads/
<br />![alt tag](http://i.imgur.com/wQhg3Ez.png)<br />
Maakt niet uit waar het wordt geïnstalleerd, zolang het Path wordt gezet op volgende scherm

Op het volgende scherm kan Python toegevoegd worden aan Path, doe dit.
<br />![alt tag](http://i.imgur.com/LZ7dxY3.png)<br />
Klik daarna op Next en ga door met installeren.

### Installeren OpenSSL
https://slproweb.com/products/Win32OpenSSL.html
Kies de laatste, niet light versie, en dan 32 of 64 bits.
<br />![alt tag](http://i.imgur.com/SS99eSv.png)<br />
Bij de installatie alles default laten en installeren op de C schijf. Als het niet op  de C schijf staat werkt het standaard niet en moet er iets aan de config ergens veranderd worden. De package die gebruikt maakt van OpenSSL kan het dan niet vinden.

### Binnenhalen project
Haal het project binnen waar je het wilt hebben.
<br />![alt tag](http://i.imgur.com/PncoM4S.png)<br />
Open een command prompt in deze map (kan door op het file path de klikken en “cmd” in te typen).
Run het command “npm install” (Dit haalt alle packeges binnen die nodig zijn voor het draaien van de server).
Als het goed is nu alles geïnstalleerd en zou het gestart kunnen worden doormiddel van “npm start”.
<br />![alt tag](http://i.imgur.com/enHZhuu.png)<br />

### Extra
Om ontwikkelen makkelijker te maken kan “npm install nodemon –g” geïnstalleerd worden en dan start de server met “nodemon start”. Met nodemon word bij elke file save de server opnieuw opstart, zodat dit niet handmatig hoeft.
<br />![alt tag](http://i.imgur.com/rhYN05M.png)<br />
(Zoiets zou je moeten krijgen na het opstarten van de server via nodemon)
We maken gebruikt van de editor Visual Studio Code, maar elke andere IDE of tekst editor kan gebruikt worden; er hoeft immers niet gecompileerd te worden.
 
# Push Notifications:

<br />![alt tag](https://www.filepicker.io/api/file/XMoBr7XxTeidnnjzx4ou)<br />
De Push Notifications worden verstuurd vanaf de Api naar Ionic en dan naar GCM of APNS en vervolgens het device.

Wanneer iemand inlogt wordt er gecheckt of er een Device Token wordt meegestuurd, als er een Device Token is wordt deze in de Database gezet en kan iemand Push Notifications ontvangen.

Push Notifications worden verstuurd wanneer de ontvanger een Device Token heeft. De ontvanger krijgt dus een popup wanneer die een nieuw bericht heeft ontvangen.

Op het moment is helaas alleen Android ondersteund en geen iOS.

Voor het opzetten en snappen van Push Notifications wordt deze guide aangeraden: https://devdactic.com/ionic-push-notifications-guide/. Dit is waar wij gebruik van hebben gemaakt.

Voor het aanpassen van de Push Notification settings moet je naar de messages.js gaan, vanaf regel 140 in de function pushNotifications(deviceTokens). De code spreekt vrij voor zichzelf. Zie ook deze pagina voor het aanpassen van de Push Notificatie http://docs.ionic.io/docs/push-sending-push 

Het overdragen van het Ionic project en het Google Cloud Messaging project kan over de email worden gedaan of dinsdag, na de demo presentatie.


# Opzet Github:

Master branch = stabiele demo. 2-3 dagen voordat we het gesprek hebben met de klant / presentatie.

    Testen en goedkeuren door hele team, alle features testen en dan overzetten

Develop branch = test demo

    Code in deze branch moet de applicatie niet laten crashen

Feature branch 

    Naam = duidelijk gebaseerd op de Taiga Userstory
    Pas een Pull Request maken als de feature af is
    Pull Request worden door meerdere personen nagekeken. Als alles goedgekeurd is wordt dat gemeld als comment

# Code Reviewing: 

Wanneer een branch af is, moet deze ge-pullrequest worden naar de Develop branch en door twee man binnen het team gecheckt worden.
