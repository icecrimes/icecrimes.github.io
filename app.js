(function () {
  const inputEl = document.getElementById('vnInput');
  const normalizedEl = document.getElementById('normalized');
  const morseEl = document.getElementById('morseOutput');
  const copyBtn = document.getElementById('copyMorseBtn');
  
  const latinToMorse = new Map(Object.entries({
    // Letters
    'A': '∙−',    'B': '−∙∙∙',  'C': '−∙−∙',  'D': '−∙∙',   'E': '∙',
    'F': '∙∙−∙',  'G': '−−∙',   'H': '∙∙∙∙',  'I': '∙∙',    'J': '∙−−−',
    'K': '−∙−',   'L': '∙−∙∙',  'M': '−−',    'N': '−∙',    'O': '−−−',
    'P': '∙−−∙',  'Q': '−−∙−',  'R': '∙−∙',   'S': '∙∙∙',   'T': '−',
    'U': '∙∙−',   'V': '∙∙∙−',  'W': '∙−−',   'X': '−∙∙−',  'Y': '−∙−−',
    'Z': '−−∙∙', '¤': '−−−−', 
    // Digits
    '0': '−−−−−', '1': '∙−−−−', '2': '∙∙−−−', '3': '∙∙∙−−', '4': '∙∙∙∙−',
    '5': '∙∙∙∙∙', '6': '−∙∙∙∙', '7': '−−∙∙∙', '8': '−−−∙∙', '9': '−−−−∙',
  }));

  function expandVietnameseChar(char) {
    const nfd = char.normalize('NFD');
    if (!nfd) return char;
    const base = nfd[0].toLowerCase();
    const marks = nfd.slice(1);

    if (base === 'u' && marks.includes('\u031B')) return 'uw';
    if (base === 'o' && marks.includes('\u031B')) return 'ow';
    if (base === 'a' && marks.includes('\u0306')) return 'aw';
    if (base === 'a' && marks.includes('\u0302')) return 'aa';
    if (base === 'e' && marks.includes('\u0302')) return 'ee';
    if (base === 'o' && marks.includes('\u0302')) return 'oo';
    if (char === 'đ') return 'dd';
    return base;
  }

  function detectVietnameseTone(word) {
    const toneMap = {
      '\u0301': 's', // sắc
      '\u0300': 'q', // huyền
      '\u0309': 'z', // hỏi
      '\u0303': 'x', // ngã
      '\u0323': 'j', // nặng
    };

    const nfd = word.normalize('NFD');
    for (const [mark, code] of Object.entries(toneMap)) {
      if (nfd.includes(mark)) return code;
    }
    return '';
  }

  function expandVietnameseString(str) {
    if (!str) return '';
    let out = '';
    for (const ch of str) {
      out += expandVietnameseChar(ch);
    }
    return out;
  }

  function translateToMorse(normalizedInput) {
    const input = normalizedInput || '';
    if (!input) return '';
    const wordSeparator = '//';
    const words = input.split(/\s+/).filter(Boolean);
    const encodedWords = words.map((word) => {
      const encodedChars = [];
      for (const char of word) {
        const code = latinToMorse.get(char.toUpperCase());
        if (code) encodedChars.push(code);
      }
      return encodedChars.join('/');
    });
    return encodedWords.join(wordSeparator);
  }

  function update() {
    const raw = inputEl.value || '';
    const lower = raw.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const normalizedWords = [];

    for (const word of words) {
      const toneCode = detectVietnameseTone(word); 
      let expanded = expandVietnameseString(word);
      if (expanded.includes('uwow')) {
        expanded = expanded.replace(/uwow/g, 'uow');
      }
      else if (expanded.includes('ch')) {
        expanded = expanded.replace(/ch/g, '¤');
      } 
      const normalized = expanded.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      normalizedWords.push(normalized + toneCode);
    }

    const normalizedText = normalizedWords.join(' ');
    normalizedEl.value = normalizedText.toUpperCase();
    if (normalizedEl.value.includes('¤')) {
      normalizedEl.value = normalizedEl.value.replace(/¤/g, 'CH');
    }
    const morse = translateToMorse(normalizedText);
    morseEl.value = morse;
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
