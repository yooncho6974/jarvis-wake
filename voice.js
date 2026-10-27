'use strict';
(() => {
  const button = document.getElementById('voice-toggle');
  const dialog = document.getElementById('voice-settings');
  const select = document.getElementById('voice-select');
  const detail = document.getElementById('voice-detail');
  const preview = document.getElementById('voice-preview');
  const previewStatus = document.getElementById('voice-preview-status');
  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const pack = window.jarvisVoicePack;
  const audioSupported = Boolean(pack?.clips?.length && typeof window.Audio === 'function');
  const supported = speechSupported || audioSupported;
  const synth = speechSupported ? window.speechSynthesis : null;
  const femaleNames = /SunHi|Yuna|JiMin|SeoHyeon|SoonBok|YuJin|Haena|선히|유나|지민|서현|순복|유진|해나/i;
  const maleNames = /InJoon|Hyunsu|BongJin|GookMin|Minho|Min-su|민호|민수|인준|현수|봉진|국민|남성/i;
  let enabled = true, preference = '', voice = null, utterance = null, playback = null, previewing = false;
  try {
    enabled = localStorage.getItem('jarvis-voice-enabled') !== 'false';
    preference = localStorage.getItem('jarvis-voice-uri') || '';
  } catch {}
  // Apply the requested new profile once; keep later choices and mute settings.
  if (audioSupported) {
    let applied = false;
    try { applied = localStorage.getItem('jarvis-voice-profile-version') === pack.id; } catch {}
    if (!applied) {
      preference = pack.id;
      save('jarvis-voice-uri', preference);
      save('jarvis-voice-profile-version', pack.id);
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function rank(candidate) {
    return (femaleNames.test(candidate.name) ? 1000 : 0)
      - (maleNames.test(candidate.name) ? 1000 : 0)
      + (/Premium|Enhanced|Natural|Neural|고품질|프리미엄/i.test(candidate.name) ? 100 : 0)
      + (candidate.localService ? 10 : 0) + (candidate.default ? 1 : 0);
  }

  function chooseVoice() {
    const voices = synth ? synth.getVoices().filter(v => /^ko([_-]|$)/i.test(v.lang)) : [];
    voices.sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name, 'ko'));
    const preferred = voices.find(v => v.voiceURI === preference);
    voice = preferred || voices[0] || null;
    const automatic = document.createElement('option');
    automatic.value = '';
    automatic.textContent = '자동 · 여성 음성 우선';
    select.replaceChildren();
    if (audioSupported) {
      const generated = document.createElement('option');
      generated.value = pack.id;
      generated.textContent = pack.label;
      select.append(generated);
    }
    if (speechSupported) select.append(automatic);
    for (const candidate of voices) {
      const option = document.createElement('option');
      option.value = candidate.voiceURI;
      option.textContent = candidate.name;
      select.append(option);
    }
    // Keep a saved choice while the browser is still loading its voices.
    if (preference && !preferred && !(audioSupported && preference === pack.id)) {
      const unavailable = document.createElement('option');
      unavailable.value = preference;
      unavailable.textContent = '저장한 음성 (현재 사용 불가)';
      select.append(unavailable);
    }
    select.value = preference;
    select.disabled = !audioSupported && (!speechSupported || !voices.length);
    preview.disabled = !supported;
    detail.textContent = !supported ? '이 브라우저에서는 음성 안내를 사용할 수 없어요.'
      : audioSupported && preference === pack.id ? '현재 목소리: ' + pack.label + ' · ' + (pack.detail || '샘플을 참고해 새로 만든 안내 음성이에요.')
      : preference && !preferred ? '저장한 음성이 없어 지금은 자동으로 선택한 음성을 사용해요.'
      : voice ? '현재 목소리: ' + voice.name
      : '한국어 음성 목록을 불러오지 못했어요. 기기의 기본 음성으로 미리 들을 수 있어요.';
    render();
  }

  function render() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? '음성 안내 끄기' : '음성 안내 켜기');
    button.title = !supported ? '이 브라우저에서는 음성을 지원하지 않습니다.'
      : enabled ? '음성 안내 켜짐 · 눌러서 끄기' : '음성 안내 꺼짐 · 눌러서 켜기';
    button.dataset.voice = audioSupported && preference === pack.id ? pack.id
      : supported ? (voice?.name || 'system-default') : 'unavailable';
  }

  function stop() {
    // Invalidate callbacks before cancel(), which can fire an old error later.
    utterance = null;
    const previousPlayback = playback;
    playback = null;
    if (previousPlayback) {
      previousPlayback.pause();
      previousPlayback.removeAttribute('src');
      previousPlayback.load();
    }
    const wasPreviewing = previewing;
    previewing = false;
    if (synth) synth.cancel();
    document.body.dataset.speaking = 'false';
    button.dataset.playback = 'idle';
    if (wasPreviewing) previewStatus.textContent = '미리 듣기를 멈췄어요.';
  }

  function playClip(clip, isPreview) {
    const player = new window.Audio(clip.src);
    playback = player;
    previewing = isPreview;
    player.volume = .9;
    if (isPreview) previewStatus.textContent = 'AI 합성 음성을 준비하고 있어요…';
    player.onplaying = () => {
      if (playback !== player) return;
      document.body.dataset.speaking = 'true';
      button.dataset.playback = 'speaking';
      if (isPreview) previewStatus.textContent = 'AI 합성 음성을 미리 듣는 중이에요.';
    };
    player.onended = () => {
      if (playback !== player) return;
      playback = null;
      previewing = false;
      document.body.dataset.speaking = 'false';
      button.dataset.playback = 'ended';
      if (isPreview) previewStatus.textContent = '미리 듣기를 마쳤어요.';
    };
    const failed = () => {
      if (playback !== player) return;
      playback = null;
      previewing = false;
      document.body.dataset.speaking = 'false';
      button.dataset.playback = 'audio-error';
      const message = '음성을 재생하지 못했어요. 소리 설정을 확인하고 다시 눌러 주세요.';
      if (isPreview) previewStatus.textContent = message;
      if (typeof toast === 'function') toast(message);
    };
    player.onerror = failed;
    try { player.play()?.catch(failed); } catch { failed(); }
  }

  function speak(text, isPreview = false) {
    if ((!enabled && !isPreview) || !supported || document.hidden) return;
    stop();
    chooseVoice();
    const clip = audioSupported && preference === pack.id && pack.clips.find(item => item.text === text);
    if (clip) { playClip(clip, isPreview); return; }
    if (!synth) return;
    const next = new SpeechSynthesisUtterance(text);
    utterance = next;
    previewing = isPreview;
    next.lang = 'ko-KR';
    if (voice) next.voice = voice;
    next.rate = 1;
    next.pitch = 1;
    next.volume = .9;
    if (isPreview) previewStatus.textContent = '목소리를 준비하고 있어요…';
    next.onstart = () => {
      if (utterance !== next) return;
      document.body.dataset.speaking = 'true';
      button.dataset.playback = 'speaking';
      if (isPreview) previewStatus.textContent = '미리 듣는 중이에요.';
    };
    next.onend = () => {
      if (utterance !== next) return;
      utterance = null;
      previewing = false;
      document.body.dataset.speaking = 'false';
      button.dataset.playback = 'ended';
      if (isPreview) previewStatus.textContent = '미리 듣기를 마쳤어요.';
    };
    next.onerror = event => {
      if (utterance !== next) return;
      utterance = null;
      previewing = false;
      document.body.dataset.speaking = 'false';
      button.dataset.playback = event.error;
      if (['canceled', 'interrupted'].includes(event.error)) return;
      const message = '음성을 재생하지 못했어요. 소리 설정을 확인하거나 다른 목소리를 골라 주세요.';
      if (isPreview) previewStatus.textContent = message;
      if (typeof toast === 'function') toast(message);
    };
    synth.resume();
    synth.speak(next);
  }

  button.addEventListener('click', () => {
    if (!supported) {
      if (typeof toast === 'function') toast('이 브라우저에서는 음성을 지원하지 않습니다. 아이폰 Safari에서 이용해 주세요.');
      return;
    }
    enabled = !enabled;
    save('jarvis-voice-enabled', String(enabled));
    render();
    if (enabled) speak('안녕하세요. 언제든 불러 주세요.'); else stop();
  });
  document.getElementById('voice-settings-open').addEventListener('click', () => {
    chooseVoice();
    previewStatus.textContent = '설정은 이 기기에 저장돼요.';
    dialog.showModal();
  });
  select.addEventListener('change', () => {
    stop();
    preference = select.value;
    save('jarvis-voice-uri', preference);
    chooseVoice();
    previewStatus.textContent = '저장했어요. 미리 듣기로 확인해 보세요.';
  });
  preview.addEventListener('click', () => speak('주인님, 일어날게요. 주인님, 잘 자요.', true));
  dialog.addEventListener('close', () => { if (previewing) stop(); });
  window.jarvisVoice = { speak: text => speak(text) };
  if (synth) synth.addEventListener('voiceschanged', chooseVoice);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  chooseVoice();
})();
