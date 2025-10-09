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


    const accents = {
        SAC: {flag: 1 << 0, code: '\u0301', letter: 'S'}, // sắc    00001
        HUYEN: {flag: 1 << 1, code: '\u0300', letter: 'Q'}, // huyền  00010
        HOI: {flag: 1 << 2, code: '\u0309', letter: 'Z'}, // hỏi    00100
        NGA: {flag: 1 << 3, code: '\u0303', letter: 'X'}, // ngã    01000
        NANG: {flag: 1 << 4, code: '\u0323', letter: 'J'}, // nặng   10000
    };

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

    const charSeparator = '/';

    function getLatinToMorse(char = '') {
        return (latinToMorse.get(char.toUpperCase()) ?? '?') + charSeparator;
    }

    function generateSemaphoreHTML(text, {
        includeSpaces,
        lettersPerLine,
        lineBreakWords,
        mirror = false
    } = {}) {
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

    function getOptionsFromElements(includeSpacesEl, lettersPerLineEl, lineBreakWordsEl, mirror) {
        return {
            includeSpaces: includeSpacesEl.checked,
            lettersPerLine: parseInt(lettersPerLineEl.value),
            lineBreakWords: lineBreakWordsEl.checked,
            mirror
        };
    }

    function updateSemaphore(element, includeSpacesEl, lettersPerLineEl, lineBreakWordsEl, mirror) {
        const options = getOptionsFromElements(includeSpacesEl, lettersPerLineEl, lineBreakWordsEl, mirror);
        element.innerHTML = generateSemaphoreHTML(normalizedEl.value, options);
    }

    function update() {
        const raw = inputEl.value || '';
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
            morseText += getLatinToMorse('D');
            morseText += getLatinToMorse('D');
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
            morseText += getLatinToMorse('U');
            morseText += getLatinToMorse('O');
            morseText += getLatinToMorse('W');
        }

        function handleDefault(char) {
            normalizedText += char.toUpperCase();
            morseText += getLatinToMorse(char.toUpperCase());
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
                    case 'u':
                        if (i < NFDWord.length - 3 && NFDWord[i + 1] === '\u031B' && NFDWord[i + 2] === 'o' && NFDWord[i + 3] === '\u031B') {
                            handleUOW();
                            i = i + 3;
                        } else {
                            handleDefault(char);
                        }
                        break;
                    case '\u0302': // '^'
                        handleDoubleVowel();
                        break;
                    case '\u031B': // 'uw' or 'ow'
                        handleCrochet();
                        break;
                    case '\u0306': // 'aw'
                        handleHalfMoon();
                        break;
                    case 'c':
                        if (i < NFDWord.length - 1 && NFDWord[i + 1].toLowerCase() === 'h') {
                            handleCH();
                            i++;
                            break;
                        } // else fallthrough
                    default:
                        handleDefault(char);
                        break;
                }
            }
            if (accent) {
                let letter = Object.values(accents).find(acc => accent & acc.flag)?.letter;
                normalizedText += letter;
                morseText += getLatinToMorse(letter);
            }
            normalizedText += ' ';
            morseText += charSeparator;
        }
        normalizedEl.value = normalizedText.toUpperCase();
        morseEl.value = morseText;

        updateSemaphore(semaphoreEl, includeSpacesEl, lettersPerLineEl, lineBreakWordsEl, false);
        updateSemaphore(mirrorSemaphoreEl, includeSpacesEl, lettersPerLineEl, lineBreakWordsEl, true);
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

    const imageCache = {};

    //   Conversion en base64
    //   SVG chargées depuis des fichiers externes -> erreur CORS

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
            // Cloner l'élément pour ne pas modifier l'original
            const clone = element.cloneNode(true);
            const images = clone.querySelectorAll('img');

            for (let img of images) {
                const base64 = await imageToBase64(img.src);
                img.src = base64;
            }

            // Récupérer la valeur de lettres par ligne
            const lettersPerLine = parseInt(lettersPerLineEl.value) || 10;
            const lineBreakWords = lineBreakWordsEl.checked;

            // Réorganiser le contenu en lignes pour éviter les problèmes de flex-wrap
            const items = Array.from(clone.querySelectorAll('.semaphore-item'));
            const lineBreaks = Array.from(clone.querySelectorAll('.semaphore-line-break'));

            // Vider le clone
            clone.innerHTML = '';

            // Reconstruire avec des lignes explicites
            let currentLine = document.createElement('div');
            currentLine.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;';

            let itemsInCurrentLine = 0;
            let itemIndex = 0;

            for (let item of items) {
                currentLine.appendChild(item);
                itemsInCurrentLine++;
                itemIndex++;

                // Vérifier si on doit faire un retour à la ligne
                let shouldBreak = false;

                if (lineBreakWords) {
                    // Chercher si l'item original était suivi d'un line-break
                    const originalItem = element.querySelectorAll('.semaphore-item')[itemIndex - 1];
                    if (originalItem && originalItem.nextElementSibling?.classList.contains('semaphore-line-break')) {
                        shouldBreak = true;
                    }
                } else {
                    // Retour à la ligne tous les N items
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

            // Ajouter la dernière ligne
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

    update();
})();