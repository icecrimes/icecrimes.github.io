(function () {
  const inputEl = document.getElementById('vnInput');
  const normalizedEl = document.getElementById('normalized');
  const morseEl = document.getElementById('morseOutput');
  const semaphoreEl = document.getElementById('semaphoreOutput');
  const copyBtn = document.getElementById('copyMorseBtn');
  const includeSpacesEl = document.getElementById('includeSpaces');
  const lettersPerLineEl = document.getElementById('lettersPerLine');
  const lineBreakWordsEl = document.getElementById('lineBreakWords');

  const accents = {
    SAC:    {flag: 1 << 0, code: '\u0301', letter: 'S'}, // sắc    00001
    HUYEN:  {flag: 1 << 1, code: '\u0300', letter: 'Q'}, // huyền  00010
    HOI:    {flag: 1 << 2, code: '\u0309', letter: 'Z'}, // hỏi    00100
    NGA:    {flag: 1 << 3, code: '\u0303', letter: 'X'}, // ngã    01000
    NANG:   {flag: 1 << 4, code: '\u0323', letter: 'J'}, // nặng   10000
  };

  const latinToMorse = new Map(Object.entries({
    // Letters
    'A': '∙−',    'B': '−∙∙∙',  'C': '−∙−∙',  'D': '−∙∙',   'E': '∙',
    'F': '∙∙−∙',  'G': '−−∙',   'H': '∙∙∙∙',  'I': '∙∙',    'J': '∙−−−',
    'K': '−∙−',   'L': '∙−∙∙',  'M': '−−',    'N': '−∙',    'O': '−−−',
    'P': '∙−−∙',  'Q': '−−∙−',  'R': '∙−∙',   'S': '∙∙∙',   'T': '−',
    'U': '∙∙−',   'V': '∙∙∙−',  'W': '∙−−',   'X': '−∙∙−',  'Y': '−∙−−',
    'Z': '−−∙∙', 'CH': '−−−−', 
    // Digits
    '0': '−−−−−', '1': '∙−−−−', '2': '∙∙−−−', '3': '∙∙∙−−', '4': '∙∙∙∙−',
    '5': '∙∙∙∙∙', '6': '−∙∙∙∙', '7': '−−∙∙∙', '8': '−−−∙∙', '9': '−−−−∙',
  }));

  const charSeparator = '/';

function getLatinToMorse(char = '') {
  return (latinToMorse.get(char.toUpperCase()) ?? '?') + charSeparator;
}

  function generateSemaphoreHTML(text) {
    if (!text) return '';
    
    let html = '';
    const includeSpaces = includeSpacesEl.checked;
    const lettersPerLine = parseInt(lettersPerLineEl.value) || 10;
    const lineBreakWords = lineBreakWordsEl.checked;
    
    // Calculer la taille des images en fonction du nombre par ligne
    // Plus le nombre par ligne est petit, plus les images sont grandes
    const baseSize = 60;
    const maxSize = 200;
    const sizeMultiplier = Math.max(1, (10 / lettersPerLine));
    const imageSize = Math.min(maxSize, Math.round(baseSize * sizeMultiplier));
    
    let letterCount = 0;
    let words = text.split(' ');
    
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex];
      
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const letter = char.toUpperCase();
        
        if (/[A-Z0-9]/.test(letter) || letter === 'CH') {
          // Ajouter un retour à la ligne si nécessaire
          if (letterCount > 0 && letterCount % lettersPerLine === 0) {
            html += '<div class="semaphore-line-break"></div>';
          }
          
          html += `
            <div class="semaphore-item">
              <img src="images/semaphore/${letter}.svg" alt="Sémaphore ${letter}" class="semaphore-image" style="width: ${imageSize}px; height: ${imageSize}px;">
              <span class="semaphore-letter">${letter}</span>
            </div>
          `;
          
          letterCount++;
        }
      }
      
      // Ajouter un espace entre les mots si l'option est activée
      if (includeSpaces && wordIndex < words.length - 1) {
        html += `
          <div class="semaphore-item">
            <img src="images/semaphore/SPACE.svg" alt="Sémaphore ESPACE" class="semaphore-image" style="width: ${imageSize}px; height: ${imageSize}px;">
            <span class="semaphore-letter">ESP</span>
          </div>
        `;
        letterCount++;
      }
      
      // Ajouter un retour à la ligne après chaque mot si l'option est activée
      if (lineBreakWords && wordIndex < words.length - 1) {
        html += '<div class="semaphore-line-break"></div>';
        letterCount = 0;
      }
    }
    
    return html;
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
            if (i < NFDWord.length - 3 && NFDWord[i + 1] == '\u031B' && NFDWord[i + 2] == 'o' && NFDWord[i + 3] == '\u031B') {
              handleUOW();
              i = i+3;
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
            if (i < NFDWord.length - 1 && NFDWord[i + 1].toLowerCase() == 'h') {
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
    
    // Mise à jour de l'affichage sémaphore
    semaphoreEl.innerHTML = generateSemaphoreHTML(normalizedText);
  }

  // Ajout des écouteurs d'événements
  inputEl.addEventListener('input', update);
  includeSpacesEl.addEventListener('change', update);
  lettersPerLineEl.addEventListener('change', update);
  lineBreakWordsEl.addEventListener('change', update);
  
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(morseEl.value);
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Copié !';
        setTimeout(() => { copyBtn.textContent = prev || 'Copier le Morse'; }, 1000);
      } catch (_) {
        morseEl.select();
        document.execCommand('copy');
      }
    });
  }

  // initial
  update();
})();
