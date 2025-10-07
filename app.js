(function () {
  const inputEl = document.getElementById('vnInput');
  const normalizedEl = document.getElementById('normalized');
  const morseEl = document.getElementById('morseOutput');
  const copyBtn = document.getElementById('copyMorseBtn');

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

  function getLatin2Morse(char = '') {
    let retval = ''
    retval += latinToMorse.get(char.toUpperCase()) ?? '?';
    retval += charSeparator;
    return (retval)
  }

  function update() {
    const raw = inputEl.value || '';
    const lower = raw.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    let morseText = '';
    let normalizedText = '';

    function handle_double_vowel() {
      const previousChar = normalizedText.at(-1).toUpperCase();
      if (previousChar === 'A' || previousChar === 'O' || previousChar === 'E') {
        normalizedText += previousChar;
        morseText += getLatin2Morse(previousChar);
      }
    }

    function handle_double_d() {
      normalizedText += 'DD';
      morseText += getLatin2Morse('D');
      morseText += getLatin2Morse('D');
    }

    function handle_crochet() {
      const previousChar = normalizedText.at(-1).toUpperCase();
      if (previousChar === 'U' || previousChar === 'O') {
        normalizedText += 'W';
        morseText += getLatin2Morse('W');
      }
    }

    function handle_half_moon() {
      const previousChar = normalizedText.at(-1).toUpperCase();
      if (previousChar === 'A') {
        normalizedText += 'W';
        morseText += getLatin2Morse('W');
      }
    }

    function handle_CH() {
      normalizedText += 'CH';
      morseText += getLatin2Morse('CH');
    }

    function handle_default(char) {
      normalizedText += char.toUpperCase();
      morseText += getLatin2Morse(char.toUpperCase());
    }

    for (const word of words) {
      let accent = 0;
      const NFDWord = word.normalize('NFD');
      for (let i = 0; i < NFDWord.length; i++) {
        const char = NFDWord[i].toLowerCase();
        switch (char) {
          case accents.SAC.code:
            accent |= accents.SAC.flag;
            break;
          case accents.HUYEN.code:
            accent |= accents.HUYEN.flag;
            break;
          case accents.HOI.code:
            accent |= accents.HOI.flag;
            break;
          case accents.NGA.code:
            accent |= accents.NGA.flag;
            break;
          case accents.NANG.code:
            accent |= accents.NANG.flag;
            break;
          case 'đ':
            handle_double_d();
            break;
          case '\u0302': // '^'
            handle_double_vowel();
            break;
          case '\u031B': // 'uw' or 'ow'
            handle_crochet();
            break;
          case '\u0306': // 'aw'
            handle_half_moon();
            break;
          case 'c':
            if (i < NFDWord.length - 1 && NFDWord[i + 1].toLowerCase() == 'h') {
              handle_CH();
              i++;
              break;
            } // else fallthrough
          default:
            handle_default(char);
            break;
        }
      }
      if (accent) {
        let letter = Object.values(accents).find(acc => accent & acc.flag)?.letter;
        normalizedText += letter;
        morseText += getLatin2Morse(letter);
      }
      normalizedText += ' ';
      morseText += charSeparator;
    }
    normalizedEl.value = normalizedText.toUpperCase();
    morseEl.value = morseText;
  }

  inputEl.addEventListener('input', update);
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
