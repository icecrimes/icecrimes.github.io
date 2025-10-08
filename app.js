(function () {
  const inputEl = document.getElementById('vnInput');
  const normalizedEl = document.getElementById('normalized');
  const morseEl = document.getElementById('morseOutput');
  const semaphoreEl = document.getElementById('semaphoreOutput');
  const mirrorSemaphoreEl = document.getElementById('mirrorSemaphoreOutput');
  const copyBtn = document.getElementById('copyMorseBtn');

  const includeSpacesEl = document.getElementById('includeSpaces');
  const lettersPerLineEl = document.getElementById('lettersPerLine');
  const lineBreakWordsEl = document.getElementById('lineBreakWords');

  const mirrorIncludeSpacesEl = document.getElementById('mirrorIncludeSpaces');
  const mirrorLettersPerLineEl = document.getElementById('mirrorLettersPerLine');
  const mirrorLineBreakWordsEl = document.getElementById('mirrorLineBreakWords');

  const accents = {
    SAC:    {flag: 1 << 0, code: '\u0301', letter: 'S'},
    HUYEN:  {flag: 1 << 1, code: '\u0300', letter: 'Q'},
    HOI:    {flag: 1 << 2, code: '\u0309', letter: 'Z'},
    NGA:    {flag: 1 << 3, code: '\u0303', letter: 'X'},
    NANG:   {flag: 1 << 4, code: '\u0323', letter: 'J'},
  };

  const latinToMorse = new Map(Object.entries({
    'A': '∙−','B': '−∙∙∙','C': '−∙−∙','D': '−∙∙','E': '∙',
    'F': '∙∙−∙','G': '−−∙','H': '∙∙∙∙','I': '∙∙','J': '∙−−−',
    'K': '−∙−','L': '∙−∙∙','M': '−−','N': '−∙','O': '−−−',
    'P': '∙−−∙','Q': '−−∙−','R': '∙−∙','S': '∙∙∙','T': '−',
    'U': '∙∙−','V': '∙∙∙−','W': '∙−−','X': '−∙∙−','Y': '−∙−−',
    'Z': '−−∙∙','CH': '−−−−',
    '0': '−−−−−','1': '∙−−−−','2': '∙∙−−−','3': '∙∙∙−−','4': '∙∙∙∙−',
    '5': '∙∙∙∙∙','6': '−∙∙∙∙','7': '−−∙∙∙','8': '−−−∙∙','9': '−−−−∙',
  }));

  const charSeparator = '/';
  const getLatinToMorse = (char = '') => (latinToMorse.get(char.toUpperCase()) ?? '?') + charSeparator;

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
              <img src="images/semaphore/${letter}.svg"
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
            <img src="images/semaphore/SPACE.svg"
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
    let normalizedText = '';
    let morseText = '';

    function handleDoubleVowel() {
      const prev = normalizedText.at(-1)?.toUpperCase();
      if (prev === 'A' || prev === 'O' || prev === 'E') {
        normalizedText += prev;
        morseText += getLatinToMorse(prev);
      }
    }

    const handleDoubleD = () => {
      normalizedText += 'DD';
      morseText += getLatinToMorse('D') + getLatinToMorse('D');
    };
    const handleCrochet = () => {
      const prev = normalizedText.at(-1)?.toUpperCase();
      if (prev === 'U' || prev === 'O') {
        normalizedText += 'W';
        morseText += getLatinToMorse('W');
      }
    };
    const handleHalfMoon = () => {
      const prev = normalizedText.at(-1)?.toUpperCase();
      if (prev === 'A') {
        normalizedText += 'W';
        morseText += getLatinToMorse('W');
      }
    };
    const handleCH = () => {
      normalizedText += 'CH';
      morseText += getLatinToMorse('CH');
    };
    const handleUOW = () => {
      normalizedText += 'UOW';
      morseText += getLatinToMorse('U') + getLatinToMorse('O') + getLatinToMorse('W');
    };
    const handleDefault = (c) => {
      normalizedText += c.toUpperCase();
      morseText += getLatinToMorse(c.toUpperCase());
    };

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
          case 'u': // 'uow'
            if (i < NFDWord.length - 3 && NFDWord[i + 1] == '\u031B' && NFDWord[i + 2] == 'o' && NFDWord[i + 3] == '\u031B') {
              handleUOW();
              i = i+3;
              } else {
              handleDefault(char);
              }
              break;
          case '\u0302': // 'â', 'ê', 'ô'
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
        const letter = Object.values(accents).find(a => accent & a.flag)?.letter;
        normalizedText += letter;
        morseText += getLatinToMorse(letter);
      }
      normalizedText += ' ';
      morseText += charSeparator;
    }

    normalizedEl.value = normalizedText.toUpperCase();
    morseEl.value = morseText;

    updateSemaphore(semaphoreEl, includeSpacesEl, lettersPerLineEl, lineBreakWordsEl, false);
    updateSemaphore(mirrorSemaphoreEl, mirrorIncludeSpacesEl, mirrorLettersPerLineEl, mirrorLineBreakWordsEl, true);
  }
  
  // 📄 Écouteurs
  [inputEl, includeSpacesEl, lettersPerLineEl, lineBreakWordsEl,
   mirrorIncludeSpacesEl, mirrorLettersPerLineEl, mirrorLineBreakWordsEl]
    .forEach(el => el?.addEventListener('input', update));
  [includeSpacesEl, lettersPerLineEl, lineBreakWordsEl,
   mirrorIncludeSpacesEl, mirrorLettersPerLineEl, mirrorLineBreakWordsEl]
    .forEach(el => el?.addEventListener('change', update));

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(morseEl.value);
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Copié !';
        setTimeout(() => { copyBtn.textContent = prev || 'Copier le Morse'; }, 1000);
      } catch {
        morseEl.select();
        document.execCommand('copy');
      }
    });
  }

  update();
})();