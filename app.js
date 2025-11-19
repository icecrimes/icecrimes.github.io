(function () {

    const inputEl = document.getElementById('vnInput');
    const normalizedEl = document.getElementById('normalized');
    const morseEl = document.getElementById('morseOutput');
    const copyBtn = document.getElementById('copyMorseBtn');
    const semaphoreEl = document.getElementById('semaphoreOutput');
    const mirrorSemaphoreEl = document.getElementById('mirrorSemaphoreOutput');
    const includeSpacesEl = document.getElementById('includeSpaces');
    const lettersPerLineEl = document.getElementById('lettersPerLine');
    const lineBreakWordsEl = document.getElementById('lineBreakWords');
    const downloadSemaphoreBtn = document.getElementById('downloadSemaphoreBtn');
    const downloadMirrorSemaphoreBtn = document.getElementById('downloadMirrorSemaphoreBtn');


    // NORMALISATION - Accents, special characters

    const accents = {
        SAC: {flag: 1 << 0, code: '\u0301', letter: 'S'},    // sắc
        HUYEN: {flag: 1 << 1, code: '\u0300', letter: 'Q'},  // huyền
        HOI: {flag: 1 << 2, code: '\u0309', letter: 'Z'},    // hỏi
        NGA: {flag: 1 << 3, code: '\u0303', letter: 'X'},    // ngã
        NANG: {flag: 1 << 4, code: '\u0323', letter: 'J'},   // nặng
    };

    function normalize(raw) {
        const lower = raw.toLowerCase();
        const words = lower.split(/\s+/).filter(Boolean);
        let morseText = '';
        let normalizedText = '';

        function handleDoubleVowel() {
            const previousChar = normalizedText.at(-1).toUpperCase();
            if (previousChar === 'A' || previousChar === 'O' || previousChar === 'E') {
                normalizedText += previousChar;
                morseText += getLatinToMorse(previousChar);
            }
        }

        function handleDoubleD() {
            normalizedText += 'DD';
            morseText += getLatinToMorse('D') + getLatinToMorse('D');
        }

        function handleCrochet() {
            const previousChar = normalizedText.at(-1).toUpperCase();
            if (previousChar === 'U' || previousChar === 'O') {
                normalizedText += 'W';
                morseText += getLatinToMorse('W');
            }
        }

        function handleHalfMoon() {
            const previousChar = normalizedText.at(-1).toUpperCase();
            if (previousChar === 'A') {
                normalizedText += 'W';
                morseText += getLatinToMorse('W');
            }
        }

        function handleCH() {
            normalizedText += 'CH';
            morseText += getLatinToMorse('CH');
        }

        function handleUOW() {
            normalizedText += 'UOW';
            morseText += getLatinToMorse('U') + getLatinToMorse('O') + getLatinToMorse('W');
        }

        function handleDefault(char) {
            const upper = char.toUpperCase();
            normalizedText += upper;
            morseText += getLatinToMorse(upper);
        }

        for (const word of words) {
            let accent = 0;
            const NFDWord = word.normalize('NFD');

            for (let i = 0; i < NFDWord.length; i++) {
                const char = NFDWord[i].toLowerCase();
                const accentMatch = Object.values(accents).find(acc => acc.code === char);

                if (accentMatch) {
                    accent |= accentMatch.flag;
                    continue;
                }

                switch (char) {
                    case 'đ':
                        handleDoubleD();
                        break;
                    case 'u':  // 'ươ'
                        if (i < NFDWord.length - 3 && NFDWord[i + 1] === '\u031B' &&
                            NFDWord[i + 2] === 'o' && NFDWord[i + 3] === '\u031B') {
                            handleUOW();
                            i += 3;
                        } else {
                            handleDefault(char);
                        }
                        break;
                    case '\u0302': // 'â', 'ê', 'ô'
                        handleDoubleVowel();
                        break;
                    case '\u031B': // 'ư', 'ơ'
                        handleCrochet();
                        break;
                    case '\u0306': // 'ă'
                        handleHalfMoon();
                        break;
                    case 'c':
                        if (i < NFDWord.length - 1 && NFDWord[i + 1].toLowerCase() === 'h') {
                            handleCH();
                            i++;
                        } else {
                            handleDefault(char);
                        }
                        break;
                    default:
                        handleDefault(char);
                        break;
                }
            }

            if (accent) {
                const letter = Object.values(accents).find(acc => accent & acc.flag)?.letter;
                if (letter) {
                    normalizedText += letter;
                    morseText += getLatinToMorse(letter);
                }
            }

            normalizedText += ' ';
            morseText += '/';
        }

        return {
            normalized: normalizedText.toUpperCase(),
            morse: morseText
        };
    }

    // Morse

    const latinToMorse = new Map(Object.entries({
        // Letters
        'A': '∙−', 'B': '−∙∙∙', 'C': '−∙−∙', 'D': '−∙∙', 'E': '∙',
        'F': '∙∙−∙', 'G': '−−∙', 'H': '∙∙∙∙', 'I': '∙∙', 'J': '∙−−−',
        'K': '−∙−', 'L': '∙−∙∙', 'M': '−−', 'N': '−∙', 'O': '−−−',
        'P': '∙−−∙', 'Q': '−−∙−', 'R': '∙−∙', 'S': '∙∙∙', 'T': '−',
        'U': '∙∙−', 'V': '∙∙∙−', 'W': '∙−−', 'X': '−∙∙−', 'Y': '−∙−−',
        'Z': '−−∙∙', 'CH': '−−−−',
        // Digits
        '0': '−−−−−', '1': '∙−−−−', '2': '∙∙−−−', '3': '∙∙∙−−', '4': '∙∙∙∙−',
        '5': '∙∙∙∙∙', '6': '−∙∙∙∙', '7': '−−∙∙∙', '8': '−−−∙∙', '9': '−−−−∙',
    }));

    function getLatinToMorse(char = '') {
        return (latinToMorse.get(char.toUpperCase()) ?? '?') + '/';
    }

    // Generating SEMAPHORE with HTML and .svg files

    function generateSemaphoreHTML(text, {includeSpaces, lettersPerLine, lineBreakWords, mirror = false} = {}) {
        if (!text) return '';

        let html = '';
        const baseSize = 60;
        const maxSize = 200;
        const sizeMultiplier = Math.max(1, (10 / (lettersPerLine || 10)));
        const imageSize = Math.min(maxSize, Math.round(baseSize * sizeMultiplier));
        let letterCount = 0;
        const words = text.split(' ');
        const mirrorClass = mirror ? 'mirror' : '';

        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];

            for (let i = 0; i < word.length; i++) {
                const char = word[i];
                const letter = char.toUpperCase();

                if (/[A-Z0-9]/.test(letter) || letter === 'CH') {
                    if (letterCount > 0 && letterCount % lettersPerLine === 0) {
                        html += '<div class="semaphore-line-break"></div>';
                    }

                    html += `
                        <div class="semaphore-item">
                            <img src="images/${letter}.svg"
                                alt="Sémaphore ${letter}"
                                class="semaphore-image ${mirrorClass}"
                                style="width:${imageSize}px;height:${imageSize}px;">
                            <span class="semaphore-letter">${letter}</span>
                        </div>
                    `;
                    letterCount++;
                }
            }

            if (includeSpaces && wordIndex < words.length - 1) {
                html += `
                    <div class="semaphore-item">
                        <img src="images/SPACE.svg"
                            alt="Sémaphore ESPACE"
                            class="semaphore-image ${mirrorClass}"
                            style="width:${imageSize}px;height:${imageSize}px;">
                        <span class="semaphore-letter">ESP</span>
                    </div>
                `;
                letterCount++;
            }

            if (lineBreakWords && wordIndex < words.length - 1) {
                html += '<div class="semaphore-line-break"></div>';
                letterCount = 0;
            }
        }

        return html;
    }

    function updateSemaphore(element, mirror) {
        const options = {
            includeSpaces: includeSpacesEl.checked,
            lettersPerLine: parseInt(lettersPerLineEl.value),
            lineBreakWords: lineBreakWordsEl.checked,
            mirror
        };
        element.innerHTML = generateSemaphoreHTML(normalizedEl.value, options);
    }


    // JPG Download

    const imageCache = {};

    async function imageToBase64(src) {
        if (imageCache[src]) {
            return imageCache[src];
        }

        return new Promise((resolve, reject) => {
            fetch(src)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        imageCache[src] = reader.result;
                        resolve(reader.result);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        });
    }

    async function downloadSemaphoreAsJPG(element, filename) {
        if (!element || !element.innerHTML.trim()) {
            alert('Aucun contenu de sémaphore à télécharger.');
            return;
        }

        try {
            const clone = element.cloneNode(true);
            const images = clone.querySelectorAll('img');

            for (let img of images) {
                const base64 = await imageToBase64(img.src);
                img.src = base64;
            }

            const lettersPerLine = parseInt(lettersPerLineEl.value) || 10;
            const lineBreakWords = lineBreakWordsEl.checked;
            const items = Array.from(clone.querySelectorAll('.semaphore-item'));

            clone.innerHTML = '';

            let currentLine = document.createElement('div');
            currentLine.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;';

            let itemsInCurrentLine = 0;
            let itemIndex = 0;

            for (let item of items) {
                currentLine.appendChild(item);
                itemsInCurrentLine++;
                itemIndex++;

                let shouldBreak = false;

                if (lineBreakWords) {
                    const originalItem = element.querySelectorAll('.semaphore-item')[itemIndex - 1];
                    if (originalItem && originalItem.nextElementSibling?.classList.contains('semaphore-line-break')) {
                        shouldBreak = true;
                    }
                } else {
                    if (itemsInCurrentLine >= lettersPerLine && itemIndex < items.length) {
                        shouldBreak = true;
                    }
                }

                if (shouldBreak) {
                    clone.appendChild(currentLine);
                    currentLine = document.createElement('div');
                    currentLine.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;';
                    itemsInCurrentLine = 0;
                }
            }

            if (currentLine.children.length > 0) {
                clone.appendChild(currentLine);
            }

            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: absolute;
                left: -9999px;
                top: 0;
                padding: 20px;
                display: inline-block;
            `;

            clone.style.cssText = `
                display: block;
                padding: 10px;
                background: white;
                border-radius: 10px;
                width: fit-content;
            `;

            let isMirror = false;
            if (element === mirrorSemaphoreEl || filename.includes('miroir')) {
                isMirror = true;
            }
            // === AJOUT du texte (miroir) AVANT le clone si besoin ===
            if (isMirror) {
                const miroirDiv = document.createElement('div');
                miroirDiv.textContent = '(miroir)';
                miroirDiv.style.cssText = `
                    text-align: center;
                    font-size: 22px;
                    font-weight: bold;
                    color: #444;
                    margin: 8px 0 14px 0;
                    font-family: Arial, sans-serif;
                `;
                tempContainer.appendChild(miroirDiv);
            }


            tempContainer.appendChild(clone);
            document.body.appendChild(tempContainer);

            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(tempContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                allowTaint: true,
                useCORS: false
            });

            document.body.removeChild(tempContainer);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error('Erreur lors de la génération de l\'image:', error);
            alert('Erreur lors du téléchargement de l\'image.');
        }
    }


    function update() {
        const raw = inputEl.value || '';
        const {normalized, morse} = normalize(raw);

        normalizedEl.value = normalized;
        morseEl.value = morse;

        updateSemaphore(semaphoreEl, false);
        updateSemaphore(mirrorSemaphoreEl, true);
    }


    // Event Listeners

    [inputEl, includeSpacesEl, lettersPerLineEl, lineBreakWordsEl]
        .forEach(el => el?.addEventListener('input', update));
    [includeSpacesEl, lettersPerLineEl, lineBreakWordsEl]
        .forEach(el => el?.addEventListener('change', update));

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(morseEl.value);
                const prev = copyBtn.textContent;
                copyBtn.textContent = 'Copié !';
                setTimeout(() => {
                    copyBtn.textContent = prev || 'Copier';
                }, 1000);
            } catch {
                morseEl.select();
                document.execCommand('copy');
            }
        });
    }

    if (downloadSemaphoreBtn) {
        downloadSemaphoreBtn.addEventListener('click', () => {
            downloadSemaphoreAsJPG(semaphoreEl, 'semaphore.jpg');
        });
    }

    if (downloadMirrorSemaphoreBtn) {
        downloadMirrorSemaphoreBtn.addEventListener('click', () => {
            downloadSemaphoreAsJPG(mirrorSemaphoreEl, 'semaphore-miroir.jpg');
        });
    }

// === JEU MORSE ===

    const morseGameWords = [
        "chat", "maison", "soleil", "arbre", "livre", "jour", "nuit", "pomme", "eau", "table",
        "porte", "lampe", "main", "amour", "bouteille", "fromage", "pain", "feu", "route", "coeur"
    ];

    let morseGameState = null;

    function shuffleArray(array) {
        // Durstenfeld shuffle
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function morseGameWordToMorse(word) {
        return word
            .toUpperCase()
            .split("")
            .map(char => getLatinToMorse(char).replace(/\//, ''))
            .join(' / ') + ' /';
    }

    function morseShowSetup() {
        document.getElementById('jeu-morse-setup').style.display = '';
        document.getElementById('jeu-morse-game').style.display = 'none';
        document.getElementById('jeu-morse-score').style.display = 'none';
    }

    function morseShowGame() {
        document.getElementById('jeu-morse-setup').style.display = 'none';
        document.getElementById('jeu-morse-game').style.display = '';
        document.getElementById('jeu-morse-score').style.display = 'none';
    }

    function morseShowScore() {
        document.getElementById('jeu-morse-setup').style.display = 'none';
        document.getElementById('jeu-morse-game').style.display = 'none';
        document.getElementById('jeu-morse-score').style.display = '';
    }

    function startMorseGame(nbMots) {
        // Sélectionne aléatoirement nbMots mots (ou tous si pas assez)
        let pool = [...morseGameWords];
        shuffleArray(pool);
        let motsChoisis = pool.slice(0, Math.min(nbMots, pool.length));
        morseGameState = {
            mots: motsChoisis,
            current: 0,
            found: 0,
            startTime: null,
            endTime: null,
            motStart: null,  // début pour le mot courant
            perWordTimes: [],
            perWordGuesses: [],
        };
        morseShowGame();
        morseGameState.startTime = Date.now();
        morseGameState.motStart = Date.now();
        morseRenderMot();
        morseUpdateProgress();
        morseStartTimer();
    }

    function morseRenderMot() {
        let mot = morseGameState.mots[morseGameState.current];
        document.getElementById('morseGameMorse').textContent = morseGameWordToMorse(mot);
        document.getElementById('morseGameGuess').value = '';
        document.getElementById('morseGameResult').textContent = '';
        document.getElementById('morseGameResult').className = 'morse-game-result';
        document.getElementById('morseGameGuess').focus();

        // Reset timer display for this word
        morseUpdatePerWordTimer();
    }

    function morseUpdateProgress() {
        let progress = `${morseGameState.current + 1} / ${morseGameState.mots.length}`;
        document.getElementById('morseGameProgress').textContent = `Mot : ${progress}`;
    }

    let morseTimerInterval = null;

    function morseUpdatePerWordTimer() {
        const timerEl = document.getElementById('morseGameTimer');
        if (!morseGameState || morseGameState.endTime) return;
        let now = Date.now();
        let t = (now - morseGameState.motStart) / 1000;
        timerEl.textContent = `⏱ ${ t.toFixed(2) } s / mot`;
    }

    function morseStartTimer() {
        if (morseTimerInterval) clearInterval(morseTimerInterval);
        function update() {
            morseUpdatePerWordTimer();
        }
        update();
        morseTimerInterval = setInterval(update, 60);
    }

    function morseGameFin() {
        morseGameState.endTime = Date.now();
        if (morseTimerInterval) clearInterval(morseTimerInterval);
        morseShowScore();
        const total = ((morseGameState.endTime - morseGameState.startTime)/1000);

        let html = `<div style="font-size:18px;">
        <b>Score : <span style="color:#19d853">${morseGameState.found} / ${morseGameState.mots.length}</span></b><br>
        Temps total : <b style="color:#36ddad">${total.toFixed(2)} s</b>
        <br>
        <table class="morse-recap-table">
        <tr>
            <th>#</th>
            <th>Mot à deviner</th>
            <th>Temps (s)</th>
        </tr>
        ${
            morseGameState.mots.map((mot, i) => `
                <tr>
                    <td>${i+1}</td>
                    <td>${mot}</td>
                    <td class="time">${ (morseGameState.perWordTimes[i]||0).toFixed(2) }</td>
                </tr>
            `).join("")
        }
        </table>
        </div>
    `;
        document.getElementById('morseScoreRecap').innerHTML = html;
    }

    function morseGameCheck() {
        if (!morseGameState) return;
        const guess = document.getElementById('morseGameGuess').value.trim().toLowerCase();
        const resultDiv = document.getElementById('morseGameResult');
        const currentWord = morseGameState.mots[morseGameState.current];

        if (!guess) {
            resultDiv.textContent = "Écris ta proposition !";
            resultDiv.className = "morse-game-result error";
            return;
        }

        morseGameState.perWordGuesses[morseGameState.current] = guess;
        const now = Date.now();
        morseGameState.perWordTimes[morseGameState.current] = ((now - morseGameState.motStart) / 1000);

        if (guess === currentWord) {
            resultDiv.textContent = "Bravo ! Bonne réponse 🎉";
            resultDiv.className = "morse-game-result success";
            morseGameState.found++;

            // Prochain mot après 0,6s
            setTimeout(() => {
                morseGameNext();
            }, 650);

        } else {
            resultDiv.textContent = `Raté ! Réessaie.`;
            resultDiv.className = "morse-game-result error";
        }
    }

    function morseGameNext() {
        morseGameState.current++;
        if (morseGameState.current < morseGameState.mots.length) {
            morseGameState.motStart = Date.now();
            morseRenderMot();
            morseUpdateProgress();
        } else {
            morseGameFin();
        }
    }

// Gestion du setup page (choix du nombre de mots)
    window.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("jeu-morse-setup")) {
            // Custom radio + input activation
            const radios = document.querySelectorAll('input[name="nbMots"]');
            const customInput = document.getElementById('nbMotsCustom');
            radios.forEach(radio => {
                radio.onchange = () => {
                    if (radio.value === "custom") {
                        customInput.disabled = false;
                        customInput.focus();
                    } else { customInput.disabled = true; }
                };
            });

            document.getElementById('morseStartBtn').onclick = () => {
                let nb = 1;
                const selected = Array.from(radios).find(r => r.checked);
                if (selected.value === "custom") {
                    nb = Math.max(1, parseInt(customInput.value) || 1);
                } else {
                    nb = parseInt(selected.value);
                }
                startMorseGame(nb);
            }
            morseShowSetup();

            // Game
            document.getElementById('morseGameBtn').onclick = morseGameCheck;
            document.getElementById('morseGameGuess').onkeyup = (e) => {
                if (e.key === "Enter") morseGameCheck();
            };
            // Pour éviter ancienne interface : supprimer le bouton "Nouveau mot" s'il est là
            const old = document.getElementById('morseGameNew');
            if (old) old.style.display = 'none';
        }
    });


    // Initialisation
    update();
})();