//const webAppURL = 'https://script.googleusercontent.com/macros/echo?user_content_key=-nf7HtnAq_0htG1VeTn-eIqjG7DG2zmJVAB9hWC3ghXihLe0aPd4Z5uHfso8dyf3px8_s0aqadWfwTLmhpF3F8T4JLVykrupm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnBgmdpr5BW5TgBjlEPPDofIM2_kNrBC71ajuEfM6JLC4DUaHCjcXJ17FzCh84gbx3gVxNwEBAPUaEcM9aEljYTZS6Ic6skGQNdz9Jw9Md8uu&lib=MiS8nA0IP1S5-p0rxnHc8P-ZNomVPhu3r';
const webAppURL = 'https://script.google.com/macros/s/AKfycbyPjrA5xG4zgYipW9eIch_QnK68055Elm34fWLRDr6OynEgrh3OjXuKf52zc0oZ7gmy4Q/exec';
document.addEventListener('DOMContentLoaded', function() {
    const notesContainer = document.getElementById('notes-container');
    const sideNav = document.getElementById('sidenav');

    fetch(webAppURL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Unable to access JSON');
            }
            return response.json();
        })
        .then(data => {
            URI = window.location.href;
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const noteData = data[key];
                    const note = document.createElement('div');
                    note.className = 'note';
                    //note.id="${noteData.ShortURL}"
                    shortURI = URI + "?url=" + noteData.ShortURL;
                    note.innerHTML = `
                        <h3>${noteData.Description}</h3>
                        <p><strong>Actual URL:</strong> <em>${noteData.URL}</em></p>
                        <p><strong>Short URL:</strong> <em>${shortURI}</em></p>
                        <p><a href="${shortURI}" target="_blank" class="button">Go to Short URL</a></p>
                    `;
                    notesContainer.appendChild(note);
                    //const nav = document.createElement('li');
                    //nav.innerHTML=`<li><a href="#${noteData.ShortURL}">${noteData.Description}</a></li>`;
                    //sidenav.appendChild(nav);
                }
            }
        })
        .catch(error => {
            console.log(error.message);
        });
});
